
import * as utils from "base/utils";
import Class from "base/class";

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
    const queryMergeId = this._getQueryId(query, readerObject._basepath);

    if (!this.queries[queryMergeId]) {
      this.queries[queryMergeId] = this.queryQueue(readerObject, queryMergeId);
    }
    return this.queries[queryMergeId].getPromise(query, parsers);
  }

  queryQueue(readerObject, queryMergeId) {
    const _context = this;
    return new function() {
      this.readerObject = readerObject;
      this.queries = [];
      this.query = null;
      this.parsers = null;
      this.defer = {};
      this.getPromise = function(query, parsers) {
        for (const reader of this.queries) {
          if (query.select.value.filter(x => reader.query.select.value.indexOf(x) == -1).length == 0) { //check if this query have all needed values
            return reader.defer.promise;
          }
        }
        if (!this.query) {
          this.query = query;
          this.parsers = parsers;
        } else {
          this.query.select.value = utils.unique(this.query.select.value.concat(query.select.value));
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

      this.reader = function(query, parsers, defer) {
        const _queue = this;
        return new function() {
          this.defer = defer;
          this.query = query;
          this.parsers = parsers;
          this.dataId = null;
          _queue.readerObject.read(this.query, this.parsers).then(response => {
            //success reading
            this.dataId = utils.hashCode([
              query, _queue.readerObject._basepath
            ]);
            this.checkQueryResponse(query, response);
            _context._collection[this.dataId] = {};
            _context._collectionPromises[this.dataId] = {};
            const col = _context._collection[this.dataId];
            col.data = response;
            col.valid = {};
            col.nested = {};
            col.unique = {};
            col.limits = {};
            col.frames = {};
            col.haveNoDataPointsPerKey = {};
            col.query = query;
            this.defer.resolve(this.dataId);
          }).catch(err => {
            this.defer.reject(err);
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
                  utils.warn('Reader result: Column "' + d + '" is missing from "' + query.from + '" data, but it might be ok');
                } else {
                  utils.error('Reader result: Key column "' + d + '" is missing from "' + query.from + '" data for query:', JSON.stringify(query));
                  console.log(response);
                }
              });
            }
          };
        }();
      };
    }();
  }

  _getQueryId(query, path) {
    return utils.hashCode([
      query.select.key,
      query.where,
      query.join,
      query.dataset,
      query.version,
      path
    ]);
  }

  setGrouping(dataId, grouping) {
    this._collection[dataId].grouping = grouping;
  }

  getData(dataId, what, whatId, args) {
    // if they want data, return the data
    if (!what || what == "data") {
      return this._collection[dataId]["data"];
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
    // order = ["geo", "time"];
    //
    // original_data = [
    //   { geo: "afg", time: 1800, gdp: 23424, lex: 23}
    //   { geo: "afg", time: 1801, gdp: 23424, lex: null}
    //   { geo: "chn", time: 1800, gdp: 23587424, lex: 46}
    //   { geo: "chn", time: 1801, gdp: null, lex: null}
    // ];
    //
    // nested_data = {
    //   afg: {
    //     1800: {gdp: 23424, lex: 23},
    //     1801: {gdp: 23424, lex: null}
    //   }
    //   chn: {
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

    return utils.nestArrayToObj(nest.entries(this._collection[dataId]["data"]));
  }

  getFrames(dataId, framesArray, keys, conceptprops) {
    const _this = this;
    const whatId = this._getCacheKey(dataId, framesArray, keys);
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
    const whatId = this._getCacheKey(dataId, framesArray, keys);
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
    const whatId = this._getCacheKey(dataId, framesArray, keys);
    this._collectionPromises[dataId][whatId]["queue"].defaultCallbacks.push(time => {
      cb(dataId, time);
    });
    if (this._collection[dataId]["frames"][whatId]) {
      utils.forEach(this._collection[dataId]["frames"][whatId], (frame, key) => {
        cb(dataId, new Date(key));
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
      let k, items, itemsIndex, oneFrame, method, use, next;

      const entitiesByKey = {};
      if (KEY.length > 1) {
        for (k = 1; k < KEY.length; k++) {
          const nested = _this.getData(dataId, "nested", [KEY[k]].concat([TIME]));
          entitiesByKey[KEY[k]] = Object.keys(nested);
        }
      }

      // We _nest_ the flat dataset in two levels: first by “key” (example: geo), then by “animatable” (example: year)
      // See the _getNested function for more details
      const nested = _this.getData(dataId, "nested", KEY.concat([TIME]));
      keys = keys ? keys : Object.keys(nested);
      entitiesByKey[KEY[0]] = keys;
      // Get the list of columns that are in the dataset, exclude key column and animatable column
      // Example: [“lex”, “gdp”, “u5mr"]
      const query = _this._collection[dataId].query;
      const columns = query.select.value.filter(f => f !== "_default");

      const cLength = columns.length;
      let key, c;

      const lastIndex = KEY.length - 1;
      function createFiltered(parent, index) {
        const keys = entitiesByKey[KEY[index]];
        for (let i = 0, j = keys.length; i < j; i++) {
          parent[keys[i]] = {};
          if (index == lastIndex) {
            for (c = 0; c < cLength; c++) parent[keys[i]][columns[c]] = null;
          } else {
            const nextIndex = index + 1;
            createFiltered(parent[keys[i]], nextIndex);
          }
        }
      }

      createFiltered(filtered, 0);

      for (c = 0; c < cLength; c++) _this._collection[dataId].haveNoDataPointsPerKey[columns[c]] = {};

      const { key: groupKey, grouping: groupValue } = _this._collection[dataId].grouping || {};

      const buildFrame = function(frameName, entitiesByKey, KEY, dataId, callback) {
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
                _this._collection[dataId].haveNoDataPointsPerKey[columns[c]][d[KEY[0]]] = dataset.length;
              }
            }
          }

        } else {
          // If there is a time field in query.where clause, then we are dealing with indicators in this request

          // Put together a template for cached filtered sets (see below what's needed)

          // Now we run a 3-level loop: across frames, then across keys, then and across data columns (lex, gdp)

          const firstKeyObject = {};
          for (c = 0; c < cLength; c++) firstKeyObject[c] = frame[columns[c]] = {};

          if (groupKey) {
            iterateKeysWithGrouping(firstKeyObject, nested, filtered, 0);
          } else {
            iterateKeys(firstKeyObject, nested, filtered, 0);
          }

          function iterateKeys(lastKeyObject, nested, filtered, index) {
            const _lastKeyObject = {};
            const keys = entitiesByKey[KEY[index]];
            for (let i = 0, j = keys.length, key; i < j; i++) {
              key = keys[i];
              if (nested[key]) {
                if (index == lastIndex) {
                  for (c = 0; c < cLength; c++) {
                    lastKeyObject[c][key] = mapValue(columns[c], nested[key], filtered[key]);
                  }
                } else {
                  for (c = 0; c < cLength; c++) {
                    _lastKeyObject[c] = lastKeyObject[c][key] = {};
                  }
                  iterateKeys(_lastKeyObject, nested[key], filtered[key], index + 1);
                }
              }
            }
          }

          function iterateKeysWithGrouping(lastKeyObject, nested, filtered, index) {
            const _lastKeyObject = {};
            const keys = entitiesByKey[KEY[index]];
            const grouping = KEY[index] === groupKey;
            for (let i = 0, j = keys.length, key, gKey; i < j; i++) {
              key = keys[i];
              gKey = grouping ? ~~(+key / groupValue) * groupValue : key;
              if (index == lastIndex) {
                let value;
                for (c = 0; c < cLength; c++) {
                  value = mapValue(columns[c], nested[key], filtered[key]);
                  if (value !== null) {
                    lastKeyObject[c][gKey] = (lastKeyObject[c][gKey] || 0) + value;
                  } else if (lastKeyObject[c][gKey] === undefined) {
                    lastKeyObject[c][gKey] = value;
                  }
                }
              } else {
                for (c = 0; c < cLength; c++) {
                  _lastKeyObject[c] = lastKeyObject[c][gKey] = lastKeyObject[c][gKey] || {};
                }
                iterateKeysWithGrouping(_lastKeyObject, nested[key], filtered[key], index + 1);
              }
            }
          }

          function mapValue(column, nested, filtered) {

            //If there are some points in the array with valid numbers, then
            //interpolate the missing point and save it to the “clean regular set”
            method = indicatorsDB[column] ? indicatorsDB[column].interpolation : null;
            use = indicatorsDB[column] ? indicatorsDB[column].use : "indicator";

            // Inside of this 3-level loop is the following:
            if (nested && nested[frameName] && (nested[frameName][0][column] || nested[frameName][0][column] === 0)) {

              // Check if the piece of data for [this key][this frame][this column] exists
              // and is valid. If so, then save it into a “clean regular set”
              return nested[frameName][0][column];
            }

            // the piece of data is not available and the interpolation is set to "none"
            if (method === "none") return null;

            // If the piece of data doesn’t exist or is invalid, then we need to inter- or extapolate it

            // Let’s take a slice of the nested set, corresponding to the current key nested[key]
            // As you remember it has the data nested further by frames.
            // At every frame the data in the current column might or might not exist.
            // Thus, let’s filter out all the frames which don’t have the data for the current column.
            // Let’s cache it because we will most likely encounter another gap in the same column for the same key
            items = filtered[column];
            if (items === null) {
              const givenFrames = Object.keys(nested);
              items = new Array(givenFrames.length);
              itemsIndex = 0;

              for (let z = 0, length = givenFrames.length; z < length; z++) {
                oneFrame = nested[givenFrames[z]];
                if (oneFrame[0][column] || oneFrame[0][column] === 0) items[itemsIndex++] = oneFrame[0];
              }

              //trim the length of the array
              items.length = itemsIndex;

              if (itemsIndex === 0) {
                filtered[column] = [];
              } else {
                filtered[column] = items;
              }

              if (items.length == 0) _this._collection[dataId].haveNoDataPointsPerKey[column][key] = items.length;
            }

            // Now we are left with a fewer frames in the filtered array. Let's check its length.
            //If the array is empty, then the entire column is missing for the key
            //So we let the key have missing values in this column for all frames
            if (items && items.length > 0) {
              next = null;
              return utils.interpolatePoint(items, use, column, next, TIME, frameName, method);
            }
          }
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
              buildFrame(nextFrame, entitiesByKey, KEY, dataId, _this._collectionPromises[dataId][whatId]["queue"].frameComplete);
            });
          } else {
            //this goes to marker.js as a "response"
            resolve(_this._collection[dataId]["frames"][whatId]);
          }
        });
      };
      _this._collectionPromises[dataId][whatId]["queue"].getNext().then(nextFrame => {
        if (nextFrame) {
          buildFrame(nextFrame, entitiesByKey, KEY, dataId, _this._collectionPromises[dataId][whatId]["queue"].frameComplete);
        }
      });
    });
  }

  _getCacheKey(dataId, frames, keys) {
    let result = frames[0] + " - " + frames[frames.length - 1];
    const grouping = this._collection[dataId]["grouping"];
    if (grouping) {
      result = result + "_grouping(" + grouping.key + ":" + grouping.grouping + ")";
    }
    if (keys) {
      result = result + "_" + keys.join();
    }
    return result;
  }
}

export const DataStorage = new Storage();
