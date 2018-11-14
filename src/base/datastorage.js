
import * as utils from "base/utils";
import Class from "base/class";

function _getQueryId(query, path, lastModified, readerName) {
  return utils.hashCode([
    query.select.key,
    query.where,
    query.from,
    query.join,
    query.dataset,
    query.version,
    query.language,
    path,
    lastModified,
    readerName
  ]);
}

function getCacheKey(dataId, frames, keys) {
  let result = `${frames[0]} - ${frames[frames.length - 1]} (${frames.length})`;
  if (keys) {
    result = result + "_" + keys.join();
  }
  return result;
}

export class Storage {
  constructor() {
    this.queryIds = {};
    this.queries = {};
    this._collection = {};
    this._collectionPromises = {}; // stores promises, making sure we don't do one calulation twice
  }

  /**
   * Loads resource from reader
   * @param {Array} query Array with queries to be loaded
   * @param {Object} parsers An object with concepts as key and parsers as value
   * @param {Object} readerObject for this query
   */
  loadFromReader(query, parsers, readerObject) {
    const _this = this;
    const queryMergeId = _getQueryId(query, readerObject._basepath, readerObject._lastModified, readerObject._name);

    if (!this.queries[queryMergeId]) {
      this.queries[queryMergeId] = this.queryQueue(readerObject, queryMergeId);
    }
    return this.queries[queryMergeId].getPromise(query, parsers);
  }

  getDataId(query, readerObject, parsers) {
    const queryMergeId = _getQueryId(query, readerObject._basepath, readerObject._lastModified, readerObject._name);
    if (this.queries[queryMergeId]) {
      return this.queries[queryMergeId].getDataId(query, parsers);
    }
    return false;

  }

  queryQueue(readerObject, queryMergeId) {
    const _context = this;
    const _parsersCompare = function(readerParsers, queryParcers) {
      return Object.keys(queryParcers).filter(p => queryParcers[p] !== readerParsers[p]).length == 0 &&
      (Object.keys(readerParsers).length == 0 || Object.keys(queryParcers).length != 0);
    };
    return new function() {
      this.readerObject = readerObject;
      this.queries = [];
      this.query = null;
      this.parsers = null;
      this.defer = {};
      this.getPromise = function(query, parsers) {
        for (const reader of this.queries) {
          if (query.select.value.filter(x => reader.query.select.value.indexOf(x) == -1).length == 0 &&
            _parsersCompare(reader.parsers, parsers)) { //check if this query have all needed values
            return reader.defer.promise;
          }
        }
        if (!this.query) {
          this.query = query;
          this.parsers = parsers;
        } else {
          this.query.select.value = (this.query.select.value) ? utils.unique(this.query.select.value.concat(query.select.value)) : [];
          utils.extend(this.parsers, parsers);
        }
        utils.debounce(() => {
          this.runQuery();
        }, 10)();
        if (!this.defer.promise || !(this.defer.promise instanceof Promise)) {
          this.defer.promise = new Promise((resolve, reject) => {
            this.defer.resolve = resolve;
            this.defer.reject = reject;
          });
        }
        return this.defer.promise;
      };
      this.runQuery = function() {
        if (this.query) {
          this.queries.push(this.reader(this.query, this.parsers, this.defer));
          this.query = null;
          this.parsers = null;
          this.defer = {};
        }
      };

      this.getDataId = function(query, parsers) {
        for (const reader of this.queries) {
          if ((!query.select.value || query.select.value.filter(x => reader.query.select.value.indexOf(x) == -1).length == 0)
              && _parsersCompare(reader.parsers, parsers)
              && reader.dataId) { //check if this query have all needed values
            return reader.dataId;
          }
        }
        return false;
      };

      this.reader = function(query, parsers, defer) {
        const _queue = this;
        // && !(_queue.readerObject.compatibility || {}).aggregateValues
        const _query = query.grouping ? utils.clone(query, null, ["grouping"]) : query;
        return new function() {
          this.defer = defer;
          this.query = query;
          this.parsers = parsers;
          this.dataId = null;

          //TODO FIXME: this is the added protection for the case when vizabi requests have null in select.key
          //this happens because of the incorrect implementation of multidimensionality in pop by age,
          //when marker is always connected to "side" entity, which sometimes has dim of null
          //instead an entity should be added to and removed from marker space
          let promise;
          if (query.select.key.includes(null)) {
            promise = Promise.resolve([]);
          } else {
            promise = _queue.readerObject.read(_query, this.parsers);
          }

          promise.then(response => {
            //success reading
            this.checkQueryResponse(query, response);
            this.dataId = utils.hashCode([
              _query, _queue.readerObject._basepath
            ]);
            _context._collection[this.dataId] = {};
            _context._collectionPromises[this.dataId] = {};
            const col = _context._collection[this.dataId];
            col.data = response;
            col.valid = {};
            col.nested = {};
            col.unique = {};
            col.timespan = {};
            col.limits = {};
            col.frames = {};
            col.haveNoDataPointsPerKey = {};
            col.query = query;
            this.defer.resolve(this.dataId);
          }).catch(error => {
            this.defer.reject(error);
          });

          this.checkQueryResponse = function(query, response) {
            if (response.length == 0) utils.warn("Reader for data source '" + this._name + "' returned empty array for query:", JSON.stringify(query, null, 2));

            if (response.length > 0) {
              // search data for the entirely missing columns
              const columnsMissing = (query.select.key || []).concat(query.select.value || []);
              for (let i = response.length - 1; i >= 0; i--) {
                for (let c = columnsMissing.length - 1; c >= 0; c--) {
                  // if found value for column c in row i then remove that column name from the list of missing columns
                  if (response[i][columnsMissing[c]] || response[i][columnsMissing[c]] === 0) columnsMissing.splice(c, 1);
                }
                // all columns were found to have value in at least one of the rows then stop iterating
                if (!columnsMissing.length) break;
              }
              columnsMissing.forEach(d => {
                if (query.select.key.indexOf(d) == -1) {
                  utils.warn("Reader result: Column '" + d + "' is missing from '" + query.from + "' data, but it might be ok");
                } else {
                  utils.error("Reader result: Key column '" + d + "' is missing from '" + query.from + "' response", JSON.stringify(query));
                  const err = new Error;
                  err.name = "reader/error/keyColumnMissingInReaderResult";
                  err.message = "Reader result: Key column '" + d + "' is missing from '" + query.from + "' response";
                  err.details = d;
                  err.ddfql = query;

                  this.defer.reject(err);
                  console.log(response);
                }
              });
            }
          };
        }();
      };
    }();
  }

  aggregateData(dataId, query, readerObject, conceptProps) {
    if (Object.keys(query.grouping).every(key => query.grouping[key]["grouping"] === 1)) {
      return Promise.resolve(dataId);
    }

    const queryMergeId = _getQueryId(query, readerObject._basepath, readerObject._lastModified, readerObject._name);
    const dataIdAggr = utils.hashCode([
      query, readerObject._basepath
    ]);

    if (!this._collection[dataIdAggr] || this._collection[dataIdAggr]._queryMergeId !== queryMergeId) {
      const grouping = query.grouping = query.grouping;
      const queryKeys = query.select.key;
      const queryMeasures = query.select.value.filter(value => conceptProps[value]["concept_type"] === "measure");

      const order = query.from === "datapoints" ? queryKeys.concat(query.animatable) : queryKeys.slice(0);

      const groupKeys = Object.keys(grouping || {}).filter(key => order.indexOf(key) !== -1 && queryKeys.indexOf(key) !== -1 && grouping[key]["grouping"] > 1);
      const groupKeyCalcs = groupKeys.reduce((calcs, key) => (function(group) {
        calcs[key] = function(d) { return ~~(+d / group) * group; };
        return calcs;
      })(grouping[key]["grouping"]), {});

      let nest = d3.nest();
      for (let i = 0; i < order.length; i++) {
        nest = nest.key(
          (function(k, groupKeyCalc) {
            return groupKeyCalc ?
              function(d) {
                return groupKeyCalc(d[k]);
              }
              :
              function(d) {
                return d[k];
              };
          })(order[i], groupKeyCalcs[order[i]])
        );
      }

      if (groupKeys.length) {
        nest = nest.rollup(values => {
          const obj = Object.assign({}, values[0]);
          groupKeys.forEach(key => obj[key] = groupKeyCalcs[key](obj[key]));
          queryMeasures.forEach(measure => obj[measure] = d3.sum(values, d => +d[measure]));
          return [obj];
        });
      }

      this._collection[dataIdAggr] = {};
      this._collectionPromises[dataIdAggr] = {};
      const col = this._collection[dataIdAggr];
      col.data = utils.nestArrayToValues(nest.entries(this._collection[dataId]["data"]));
      col.valid = {};
      col.nested = {};
      col.unique = {};
      col.timespan = {};
      col.limits = {};
      col.frames = {};
      col.haveNoDataPointsPerKey = {};
      col.query = query;
      col._queryMergeId = queryMergeId;
    }

    return Promise.resolve(dataIdAggr);
  }

  getData(dataId, what, whatId, args) {
    // if they want data, return the data
    if (!what || what == "data") {
      return this._collection[dataId]["data"];
    }
    if (what == "query") {
      return this._collection[dataId]["query"];
    }
    // if they didn't give an instruction, give them the whole thing
    // it's probably old code which modifies the data outside this class
    // TODO: move these methods inside (e.g. model.getNestedItems())
    if (!whatId) {
      return this._collection[dataId][what];
    }

    // if they want a certain processing of the data, see if it's already in cache
    const id = (typeof whatId === "string") ? whatId : JSON.stringify(whatId);
    if (this._collection[dataId][what][id]) {
      return this._collection[dataId][what][id];
    }

    // if it's not cached, process the data and then return it
    switch (what) {
      case "unique":
        this._collection[dataId][what][id] = this._getUnique(dataId, whatId);
        break;
      case "valid":
        this._collection[dataId][what][id] = this._getValid(dataId, whatId);
        break;
      case "timespan":
        this._collection[dataId][what][id] = this._getTimespan(dataId, whatId);
        break;
      case "limits":
        this._collection[dataId][what][id] = this._getLimits(dataId, whatId);
        break;
      case "nested":
        this._collection[dataId][what][id] = this._getNested(dataId, whatId);
        break;
      case "haveNoDataPointsPerKey":
        //do nothing. no caching is available for this option, served directly from collection
        break;
    }
    return this._collection[dataId][what][id];
  }

  _getTimespan(dataId, column) {
    const TIME = this._collection[dataId].query.animatable;
    const items = this._collection[dataId].data
      .filter(f => f[column] || f[column] === 0)
      .map(m => m[TIME]);

    if (items.length == 0) utils.warn("_getTimespan() was unable to work with an empty array of valid datapoints");

    return { min: d3.min(items), max: d3.max(items) };
  }

  _getValid(dataId, column) {
    return this._collection[dataId].data.filter(f => f[column] || f[column] === 0);
  }

  _getLimits(dataId, attr) {

    const items = this._collection[dataId].data;
    // get only column attr and only rows with number or date
    const filtered = items.reduce((filtered, d) => {

      // check for dates
      const f = (utils.isDate(d[attr])) ? d[attr] : parseFloat(d[attr]);

      // if it is a number
      if (!isNaN(f)) {
        filtered.push(f);
      }

      //filter
      return filtered;
    }, []);

    // get min/max for the filtered rows
    let min;
    let max;
    const limits = {};
    for (let i = 0; i < filtered.length; i += 1) {
      const c = filtered[i];
      if (typeof min === "undefined" || c < min) {
        min = c;
      }
      if (typeof max === "undefined" || c > max) {
        max = c;
      }
    }
    limits.min = min || 0;
    limits.max = max || 100;
    return limits;
  }

  _getUnique(dataId, attr) {
    let uniq;
    const items = this._collection[dataId].data;
    // if it's an array, it will return a list of unique combinations.
    if (utils.isArray(attr)) {
      const values = items.map(d => utils.clone(d, attr)); // pick attrs
      uniq = utils.unique(values, n => JSON.stringify(n));
    } // if it's a string, it will return a list of values
    else {
      const values = items.map(d => d[attr]);
      uniq = utils.unique(values);
    }
    return uniq;
  }

  _getNested(dataId, order) {
    // Nests are objects of key-value pairs
    // Example:
    //
    // order = ["geo", "gender", "time"];
    //
    // original_data = [
    //   { geo: "afg", gender: "male", time: 1800, gdp: 23424, lex: 23}
    //   { geo: "afg", gender: "female", time: 1800, gdp: 23424, lex: 23}
    //   { geo: "afg", gender: "male", time: 1801, gdp: 23424, lex: null}
    //   { geo: "afg", gender: "female", time: 1801, gdp: 23424, lex: null}
    //   { geo: "chn", gender: "male", time: 1800, gdp: 23587424, lex: 46}
    //   { geo: "chn", gender: "female", time: 1800, gdp: 23587424, lex: 46}
    //   { geo: "chn", gender: "male", time: 1801, gdp: null, lex: null}
    //   { geo: "chn", gender: "female", time: 1801, gdp: null, lex: null}
    // ];
    //
    // nested_data = {
    //   ["afg","male"]: {
    //     1800: {gdp: 23424, lex: 23},
    //     1801: {gdp: 23424, lex: null}
    //   }
    //   ["afg","female"]: {
    //     1800: {gdp: 23424, lex: 23},
    //     1801: {gdp: 23424, lex: null}
    //   }
    //   ["chn","male"]: {
    //     1800: {gdp: 23587424, lex: 46 },
    //     1801: {gdp: null, lex: null }
    //   }
    //   ["chn","female"]: {
    //     1800: {gdp: 23587424, lex: 46 },
    //     1801: {gdp: null, lex: null }
    //   }
    // };

    let nest = d3.nest();
    for (let i = 0; i < order.length; i++) {
      nest = nest.key(
        (function(k) {
          return function(d) {
            return d[k];
          };
        })(order[i])
      );
    }

    return utils.nestArrayToObjWithFlatKeys(nest.entries(this._collection[dataId]["data"]));
  }

  getFrames(dataId, framesArray, keys, conceptprops) {
    const _this = this;
    //if(dataId === false) return Promise.resolve([]);
    
    const whatId = getCacheKey(dataId, framesArray, keys);
    if (!this._collectionPromises[dataId][whatId]) {
      this._collectionPromises[dataId][whatId] = {
        queue: this.framesQueue(framesArray, whatId),
        promise: null
      };
    }
    if (this._collectionPromises[dataId][whatId] && this._collectionPromises[dataId][whatId]["promise"] instanceof Promise) {
      return this._collectionPromises[dataId][whatId]["promise"];
    }

    this._collectionPromises[dataId][whatId]["promise"] = new Promise((resolve, reject) => {
      if (!dataId) reject(utils.warn("Data.js 'get' method doesn't like the dataId you gave it: " + dataId));
      _this._getFrames(dataId, whatId, framesArray, keys, conceptprops).then(frames => {
        _this._collection[dataId]["frames"][whatId] = frames;
        resolve(_this._collection[dataId]["frames"][whatId]);
      });
    });

    return this._collectionPromises[dataId][whatId]["promise"];
  }

  getFrame(dataId, framesArray, neededFrame, keys) {
    const _this = this;
    //if(dataId === false) return Promise.resolve([]);
    
    const whatId = getCacheKey(dataId, framesArray, keys);
    return new Promise((resolve, reject) => {
      if (_this._collection[dataId]["frames"][whatId] && _this._collection[dataId]["frames"][whatId][neededFrame]) {
        resolve(_this._collection[dataId]["frames"][whatId]);
      } else {
        _this._collectionPromises[dataId][whatId]["queue"].forceFrame(neededFrame, () => {
          resolve(_this._collection[dataId]["frames"][whatId]);
        });
      }
    });
  }

  listenFrame(dataId, framesArray, keys,  cb) {
    const whatId = getCacheKey(dataId, framesArray, keys);
    this._collectionPromises[dataId][whatId]["queue"].defaultCallbacks.push(time => {
      cb(dataId, time);
    });
    if (this._collection[dataId]["frames"][whatId]) {
      //reduce frame array to get correct Date from frame key
      const framesObj = framesArray.reduce((result, frame) => {
        result[frame] = frame;
        return result;
      }, {});
      utils.forEach(this._collection[dataId]["frames"][whatId], (frame, key) => {
        cb(dataId, framesObj[key]);
      });
    }
  }

  _muteAllQueues(except) {
    utils.forEach(this._collectionPromises, (queries, dataId) => {
      utils.forEach(queries, (promise, whatId) => {
        if (promise.queue.isActive == true && promise.queue.whatId != except) {
          promise.queue.mute();
        }
      });
    });
  }

  _checkForcedQueuesExists() {
    utils.forEach(this._collectionPromises, (queries, dataId) => {
      utils.forEach(queries, (promise, whatId) => {
        if (promise.queue.forcedQueue.length > 0) {
          promise.queue.unMute();
        }
      });
    });
  }

  _unmuteQueue() {
    utils.forEach(this._collectionPromises, (queries, dataId) => {
      utils.forEach(queries, (promise, whatId) => {
        if (promise.queue.isActive == false) {
          promise.queue.unMute();
        }
      });
    });
  }

  /**
   * set priority for generate each year frame
   * @param framesArray
   * @param whatId
   * @returns {*}
   */
  framesQueue(framesArray, whatId) {
    const _context = this;
    return new function() {
      this.defaultCallbacks = [];
      this.callbacks = {};
      this.forcedQueue = [];
      this.isActive = true;
      this.delayedAction = null;
      this.whatId = whatId;
      this.queue = framesArray.slice(0); //clone array
      const queue = this;
      //put the last element to the start of the queue because we are likely to need it first
      this.queue.splice(0, 0, this.queue.splice(this.queue.length - 1, 1)[0]);
      this.key = 0;
      this.mute = function() {
        this.isActive = false;
        this.delayedAction = Promise.resolve.bind(Promise);
      };

      this.unMute = function() {
        this.isActive = true;
        if (typeof this.delayedAction === "function") {
          this.delayedAction();
        }
        this.delayedAction = null;
        if (this.forcedQueue.length == 0 && this.queue.length == 0) {
          _context._unmuteQueue();
        }
      };
      this.frameComplete = function(frameName) { //function called after build each frame with name of frame build
        let i;
        if (queue.defaultCallbacks.length > 0) {
          for (i = 0; i < queue.defaultCallbacks.length; i++) {
            queue.defaultCallbacks[i](frameName);
          }
        }
        if (queue.callbacks[frameName] && queue.callbacks[frameName].length > 0) {
          for (i = 0; i < queue.callbacks[frameName].length; i++) {
            queue.callbacks[frameName][i]();
          }
        }
      };
      this._waitingForActivation = function() {
        const _this = this;
        return new Promise((resolve, reject) => {
          if (_this.isActive) {
            return resolve();
          }
          _this.delayedAction = resolve;
        });
      };

      this._getNextFrameName = function() {
        let frameName = null;
        if (this.forcedQueue.length > 0 || this.queue.length > 0) {
          if (this.forcedQueue.length > 0) {
            frameName = this.forcedQueue.shift();
          } else {
            if (this.forcedQueue.length == 0 && this.key >= this.queue.length - 1) {
              this.key = 0;
            }
            frameName = this.queue.splice(this.key, 1).pop();
          }
        } else {
          _context._unmuteQueue();
        }
        return frameName;
      };
      this.checkForcedFrames = function() {
        if (this.forcedQueue.length > 0) return;
        _context._checkForcedQueuesExists();
      };

      // returns the next frame in a queue
      this.getNext = function() {
        const _this = this;
        return new Promise((resolve, reject) => {
          _this.checkForcedFrames();
          if (_this.isActive) {
            resolve(_this._getNextFrameName());
          } else {
            _this._waitingForActivation().then(() => {
              resolve(_this._getNextFrameName());
            });
          }
        });
      };

      // force the particular frame up the queue
      this.forceFrame = function(frameName, cb) {
        const objIndexOf = function(obj, need) {
          const search = need.toString();
          let index = -1;
          for (let i = 0, len = obj.length; i < len; i++) {
            if (obj[i].toString() == search) {
              index = i;
              break;
            }
          }
          return index;
        };
        if (this.callbacks[frameName]) {

          this.callbacks[frameName].push(cb);
        } else {
          const newKey = objIndexOf(this.queue, frameName);//this.queue.indexOf(frameName.toString());
          if (newKey !== -1) {
            this.forcedQueue.unshift(this.queue.splice(newKey, 1).pop());
            _context._muteAllQueues(this.whatId);
            this.unMute();
            if (typeof cb === "function") {
              if (typeof this.callbacks[frameName] !== "object") {
                this.callbacks[frameName] = [];
              }
              this.callbacks[frameName].push(cb);
            }
            this.key = newKey; //set key to next year after gorced element (preload if user click play)
          } else {
            if (typeof this.callbacks[frameName] === "object") {
              this.callbacks[frameName].push(cb);
            } else {
              this.callbacks[frameName] = [cb];
            }
          }
        }
      };
    }();
  }

  /**
   * Get regularised dataset (where gaps are filled)
   * @param {Number} dataId hash code for query
   * @param {String} whatId hash code for cache
   * @param {Array} framesArray -- array of keyframes across animatable
   * @param {Array} keys -- array of keys
   * @param {Array} indicatorsDB
   * @returns {Object} regularised dataset, nested by [animatable, column, key]
   */
  _getFrames(dataId, whatId, framesArray, keys, indicatorsDB) {
    const _this = this;
    if (!_this._collection[dataId]["frames"][whatId]) {
      _this._collection[dataId]["frames"][whatId] = {};
    }
    return new Promise((resolve, reject) => {

      //TODO: thses should come from state or from outside somehow
      // FramesArray in the input contains the array of keyframes in animatable dimension.
      // Example: array of years like [1800, 1801 … 2100]
      // these will be the points where we need data
      // (some of which might already exist in the set. in regular datasets all the points would exist!)

      // Check if query.where clause is missing a time field

      if (!indicatorsDB) utils.warn("_getFrames in data.js is missing indicatorsDB, it's needed for gap filling");
      if (!framesArray) utils.warn("_getFrames in data.js is missing framesArray, it's needed so much");

      const TIME = _this._collection[dataId].query.animatable;
      const KEY = _this._collection[dataId].query.select.key.slice(0);
      if (TIME && KEY.indexOf(TIME) != -1) KEY.splice(KEY.indexOf(TIME), 1);

      const filtered = {};
      let items, itemsIndex, oneFrame, method, use, next;

      // We _nest_ the flat dataset in two levels: first by “key” (example: geo), then by “animatable” (example: year)
      // See the _getNested function for more details
      const nested = _this.getData(dataId, "nested", KEY.concat([TIME]), indicatorsDB);
      const nestedKeys = Object.keys(nested);
      keys = keys ? keys : nestedKeys.map(k => JSON.parse(k).join(","));

      // Get the list of columns that are in the dataset, exclude key column and animatable column
      // Example: [“lex”, “gdp”, “u5mr"]
      const query = _this._collection[dataId].query;
      const columns = query.select.value.filter(f => f !== "_default");

      const cLength = columns.length;

      let key, nestedKey, k, column, c;

      for (k = 0; k < keys.length; k++) {
        filtered[keys[k]] = {};
        for (c = 0; c < cLength; c++) filtered[keys[k]][columns[c]] = null;
      }

      for (c = 0; c < cLength; c++) _this._collection[dataId].haveNoDataPointsPerKey[columns[c]] = {};

      const buildFrame = function(frameName, keys, dataId, callback) {
        const frame = {};
        if (query.from !== "datapoints") {
          // we populate the regular set with a single value (unpack properties into constant time series)
          const dataset = _this._collection[dataId].data;
          for (c = 0; c < cLength; c++) frame[columns[c]] = {};

          for (let i = 0; i < dataset.length; i++) {
            const d = dataset[i];
            for (c = 0; c < cLength; c++) {
              frame[columns[c]][d[KEY[0]]] = d[columns[c]];
              //check data for properties with missed data. If founded then write key to haveNoDataPointsPerKey with
              //count of broken datapoints
              if (d[columns[c]] == null) {
                _this._collection[dataId].haveNoDataPointsPerKey[columns[c]][JSON.stringify([d[KEY[0]]])] = dataset.length;
              }
            }
          }

        } else {
          // If there is a time field in query.where clause, then we are dealing with indicators in this request

          // Put together a template for cached filtered sets (see below what's needed)

          // Now we run a 3-level loop: across frames, then across keys, then and across data columns (lex, gdp)

          for (c = 0; c < cLength; c++) frame[columns[c]] = {};

          for (k = 0; k < keys.length; k++) {
            key = keys[k];
            nestedKey = nestedKeys[k];

            for (c = 0; c < cLength; c++) {
              column = columns[c];

              //If there are some points in the array with valid numbers, then
              //interpolate the missing point and save it to the “clean regular set”
              method = indicatorsDB[column] ? indicatorsDB[column].interpolation : null;

              // Inside of this 3-level loop is the following:
              if (nested[nestedKey] && nested[nestedKey][frameName] && (nested[nestedKey][frameName][0][column] || nested[nestedKey][frameName][0][column] === 0)) {

                // Check if the piece of data for [this key][this frame][this column] exists
                // and is valid. If so, then save it into a “clean regular set”
                frame[column][key] = nested[nestedKey][frameName][0][column];

              } else if (method === "none" || query.gapfill === false) {

                // the piece of data is not available and the interpolation is set to "none"
                frame[column][key] = null;

              } else {
                // If the piece of data doesn’t exist or is invalid, then we need to inter- or extapolate it

                // Let’s take a slice of the nested set, corresponding to the current key nested[key]
                // As you remember it has the data nested further by frames.
                // At every frame the data in the current column might or might not exist.
                // Thus, let’s filter out all the frames which don’t have the data for the current column.
                // Let’s cache it because we will most likely encounter another gap in the same column for the same key
                items = filtered[key][column];
                if (items === null) {
                  const givenFrames = Object.keys(nested[nestedKey]);
                  items = new Array(givenFrames.length);
                  itemsIndex = 0;

                  for (let z = 0, length = givenFrames.length; z < length; z++) {
                    oneFrame = nested[nestedKey][givenFrames[z]];
                    if (oneFrame[0][column] || oneFrame[0][column] === 0) items[itemsIndex++] = oneFrame[0];
                  }

                  //trim the length of the array
                  items.length = itemsIndex;

                  if (itemsIndex === 0) {
                    filtered[key][column] = [];
                  } else {
                    filtered[key][column] = items;
                  }

                  if (items.length == 0) _this._collection[dataId].haveNoDataPointsPerKey[column][nestedKey] = items.length;
                }

                // Now we are left with a fewer frames in the filtered array. Let's check its length.
                //If the array is empty, then the entire column is missing for the key
                //So we let the key have missing values in this column for all frames
                if (items && items.length > 0) {
                  next = null;
                  frame[column][key] = utils.interpolatePoint(items, use, column, next, TIME, frameName, method);
                }
              }
            } //loop across columns
          } //loop across keys
        }

        // save the calcualted frame to global datamanager cache
        _this._collection[dataId]["frames"][whatId][frameName] = frame;

        // fire the callback
        if (typeof callback === "function") {
          // runs the function frameComplete inside framesQueue.getNext()
          callback(frameName);
        }

        // recursively call the buildFrame again, this time for the next frame
        //QUESTION: FramesArray is probably not needed at this point. dataId and whatId is enough
        _this._collectionPromises[dataId][whatId]["queue"].getNext().then(nextFrame => {
          if (nextFrame) {
            utils.defer(() => {
              buildFrame(nextFrame, keys, dataId, _this._collectionPromises[dataId][whatId]["queue"].frameComplete);
            });
          } else {
            //this goes to marker.js as a "response"
            resolve(_this._collection[dataId]["frames"][whatId]);
          }
        });
      };
      _this._collectionPromises[dataId][whatId]["queue"].getNext().then(nextFrame => {
        if (nextFrame) {
          buildFrame(nextFrame, keys, dataId, _this._collectionPromises[dataId][whatId]["queue"].frameComplete);
        }
      });
    });
  }
}

export const DataStorage = new Storage();
