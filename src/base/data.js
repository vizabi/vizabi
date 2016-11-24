import * as utils from 'base/utils';
import Promise from 'base/promise';
import Class from 'base/class';
import Reader from 'base/reader';

var Data = Class.extend({

  init: function() {
    this._collection = {};
    this._collectionPromises = {};// stores promises, making sure we don't do one calulation twice
  },

  /**
   * Loads resource from reader or cache
   * @param {Array} query Array with queries to be loaded
   * @param {Object} reader Which reader to use - data reader info
   * @param {*} evts ?
   */
  load: function(query, reader, evts) {
    var _this = this;
    var promise = new Promise();
    var wait = new Promise().resolve();
    var cached = query === true ? true : this.isCached(query, reader);
    var loaded = false;
    //if result is cached, dont load anything
    if(!cached) {
      utils.timeStamp('Vizabi Data: Loading Data');
      if(evts && typeof evts.load_start === 'function') {
        evts.load_start();
      }
      wait = new Promise();
      this.loadFromReader(query, reader).then(function(queryId) {
        loaded = true;
        cached = queryId;
        wait.resolve();
      }, function(err) {
        utils.warn(err);
        wait.reject();
      });
    }
    wait.then(function() {
      //pass the data forward
      var data = _this._collection[cached].data;
      //not loading anymore
      if(loaded && evts && typeof evts.load_end === 'function') {
        evts.load_end();
      }
      promise.resolve(cached);
    }, function() {
      //not loading anymore
      if(loaded && evts && typeof evts.load_end === 'function') {
        evts.load_end();
      }
      promise.reject();
    });
    return promise;
  },

  /**
   * Loads resource from reader
   * @param {Array} query Array with queries to be loaded
   * @param {Object} reader Which reader to use. E.g.: "json"
   * @param {String} path Where data is located
   */
  loadFromReader: function(query, reader) {
    var _this = this;
    var promise = new Promise();
    var reader_name = reader.reader;
    var queryId = utils.hashCode([
      query,
      reader
    ]);

    // joining multiple queries
    // create a queue which this datamanager writes all queries to
    this.queryQueue = this.queryQueue || [];
    this.queryQueue.push({ query: query, queryId: queryId, promise: promise, reader: reader});

    // wait one execution round for the queue to fill up
    utils.defer(function() {
      // now the query queue is filled with all queries from one execution round

      var mergedQueries = [];
      var willExecute = false;

      // check every query in the queue
      _this.queryQueue = _this.queryQueue.filter(function(queueItem) {
        if (queueItem.query == query) {
          // Query is still in the queue so this is the first deferred query with same requested rows (where & group) to reach here.
          // This will be the base query which will be executed; It will be extended by other queries in the queue.
          mergedQueries.push(queueItem);
          willExecute = true;

          // remove so that other queries won't merge it
          return false;
        } else {
          // check if the requested rows are similar
          if (utils.comparePlainObjects(queueItem.query.where, query.where)
           && utils.comparePlainObjects(queueItem.query.select.key, query.select.key)
            ) {

            // if so, merge the selects to the base query
            Array.prototype.push.apply(query.select.value, queueItem.query.select.value);
            // merge parsers so the reader can parse the newly added columns
            utils.extend(reader.parsers, queueItem.reader.parsers);

            // the first entry in the "key" array of the query is the key of 1-dimensional set
            //TODO: what if the set is multidimenstional?
            reader.parsers[query.select.key[0]] = function(d){return ""+d};

            // include query's promise to promises for base query
            mergedQueries.push(queueItem);

            // remove queueItem from queue as it's merged in the current query
            return false;
          }
        }
        // otherwise keep it in the queue, so it can be joined with another query
        return true;
      });

      if (!willExecute) return;

      // make the promise a collection of all promises of merged queries
      // promise = promises.length ? Promise.all(promises) : new Promise.resolve();

      // remove double columns from select (resulting from merging)
      // no double columns in formatter because it's an object, extend would've overwritten doubles
      query.select.value = utils.unique(query.select.value);

      // Create a new reader for this query
      var readerClass = Reader.get(reader_name);
      if (!readerClass) {
        throw new Error('Unknown reader: ' + reader_name);
      }
      var r = new readerClass(reader);

      // execute the query with this reader
      r.read(query).then(function() {

          //success reading
          var values = r.getData();
          var q = query;
          if(values.length == 0) utils.warn("Reader returned empty array for query:", JSON.stringify(q, null, 2))

          if(values.length > 0) {
            //search data for the entirely missing columns
            var columnsMissing = (q.select.key||[]).concat(q.select.value||[]);
            for(var i = values.length-1; i>=0; i--){
              for(var c = columnsMissing.length-1; c>=0; c--){
                //if found value for column c in row i then remove that column name from the list of missing columns
                if(values[i][columnsMissing[c]] || values[i][columnsMissing[c]]===0) columnsMissing.splice(c,1);
              }
              //all columns were found to have value in at least one of the rows then stop iterating
              if(!columnsMissing.length) break;
            }
            columnsMissing.forEach(function(d){
              if(q.select.key.indexOf(d)==-1){
                utils.warn('Reader result: Column "' + d + '" is missing from "' + q.from + '" data, but it might be ok');
              }else{
                utils.error('Reader result: Key column "' + d + '" is missing from "' + q.from + '" data for query:', JSON.stringify(q));
                console.log(values);
              }
            });
          }

          _this._collection[queryId] = {};
          _this._collectionPromises[queryId] = {};
          var col = _this._collection[queryId];
          col.data = values;
          col.valid = {};
          col.nested = {};
          col.unique = {};
          col.limits = {};
          col.limitsPerFrame = {};
          col.frames = {};
          col.haveNoDataPointsPerKey = {};
          col.query = q;
          // col.sorted = {}; // TODO: implement this for sorted data-sets, or is this for the server/(or file reader) to handle?

          // returning the query-id/values of the merged query without splitting the result up again per query
          // this is okay because the collection-object above will only be passed by reference to the cache and this will not take up more memory.
          // On the contrary: it uses less because there is no need to duplicate the key-columns.
          utils.forEach(mergedQueries, function(mergedQuery) {
            // set the cache-location for each seperate query to the combined query's cache
            _this._collection[mergedQuery.queryId] = _this._collection[queryId];
            _this._collectionPromises[mergedQuery.queryId] = _this._collectionPromises[queryId];
            // resolve the query
            mergedQuery.promise.resolve(mergedQuery.queryId);
          });

          //promise.resolve(queryId);
        }, //error reading
        function(err) {
          utils.forEach(mergedQueries, function(mergedQuery) {
            mergedQuery.promise.reject(err);
          });
        }
      );

    })

    return promise;
  },

  /**
   * get data
   */
  get: function(queryId, what, whatId, args) {
    // if not specified data from what query, return nothing
    if(!queryId) return utils.warn("Data.js 'get' method doesn't like the queryId you gave it: " + queryId);

    // if they want data, return the data
    if(!what || what == 'data') {
      return this._collection[queryId]['data'];
    }

    // if they didn't give an instruction, give them the whole thing
    // it's probably old code which modifies the data outside this class
    // TODO: move these methods inside (e.g. model.getNestedItems())
    if (!whatId) {
      return this._collection[queryId][what];
    }

    // if they want a certain processing of the data, see if it's already in cache
    var id = (typeof whatId == "string")? whatId : JSON.stringify(whatId);
    if(this._collection[queryId][what][id]) {
      return this._collection[queryId][what][id];
    }

    // if it's not cached, process the data and then return it
    switch(what) {
      case 'unique':
        this._collection[queryId][what][id] = this._getUnique(queryId, whatId);
        break;
      case 'valid':
        this._collection[queryId][what][id] = this._getValid(queryId, whatId);
        break;
      case 'limits':
        this._collection[queryId][what][id] = this._getLimits(queryId, whatId);
        break;
      case 'nested':
        this._collection[queryId][what][id] = this._getNested(queryId, whatId);
        break;
      case 'haveNoDataPointsPerKey':
        //do nothing. no caching is available for this option, served directly from collection
        break;
    }
    return this._collection[queryId][what][id];
  },

  loadConceptProps: function(reader, languageId, callback){
    var _this = this;

    var query = {
      from: "concepts",
      language: languageId,
      select: {
        key: ["concept"],
        value: ["concept_type","domain","indicator_url","color","scales","interpolation","tags","name","unit","description"]
      }
    };

    this.load(query, reader).then(function(dataId) {

      _this.conceptPropsDataID = dataId;
      _this.conceptDictionary = {_default: {concept_type: "string", use: "constant", scales: ["ordinal"], tags: "_root"}};
      _this.get(dataId).forEach(function(d){
        var concept = {};
        concept["use"] = (d.concept_type=="measure" || d.concept_type=="time")?"indicator":"property";
        concept["concept_type"] = d.concept_type;
        concept["sourceLink"] = d.indicator_url;
        try {
          concept["color"] = d.color ? JSON.parse(d.color) : null;
        } catch (e) {
          concept["color"] = null;
        }
        try {
          concept["scales"] = d.scales ? JSON.parse(d.scales) : null;
        } catch (e) {
          concept["scales"] = null;
        }
        if(!concept.scales){
          switch (d.concept_type){
            case "measure": concept.scales=["linear", "log"]; break;
            case "string": concept.scales=["nominal"]; break;
            case "entity_domain": concept.scales=["ordinal"]; break;
            case "entity_set": concept.scales=["ordinal"]; break;
            case "time": concept.scales=["time"]; break;
          }
        }
        if(d.interpolation){
          concept["interpolation"] = d.interpolation;
        }else{
          if(concept.scales && concept.scales[0]=="log") concept["interpolation"] = "exp";
        }
        concept["domain"] = d.domain;
        concept["tags"] = d.tags;
        concept["name"] = d.name||d.concept||"";
        concept["unit"] = d.unit||"";
        concept["description"] = d.description;
        _this.conceptDictionary[d.concept] = concept;
      });

      callback(_this.conceptDictionary);
    }, function(err) {
      utils.warn('Problem with query: ', query);
    });
  },

  getConceptprops: function(which){
     if(which) {
       if(this.conceptDictionary[which]) {
         return this.conceptDictionary[which];
       }else{
         return utils.warn("The concept " + which + " is not found in the dictionary");
       }
     }else{
       return this.conceptDictionary;
     }
  },

  _getCacheKey: function(frames, keys) {
    var result = frames[0] + " - " + frames[frames.length-1];
    if (keys) {
      result = result + "_" + keys.join();
    }
    return result;
  },

  getFrames: function(queryId, framesArray, keys) {
    var _this = this;
    var whatId = this._getCacheKey(framesArray, keys);
    if (!this._collectionPromises[queryId][whatId]) {
      this._collectionPromises[queryId][whatId] = {
        queue: this.framesQueue(framesArray, whatId),
        promise: null
      };
    }
    if (this._collectionPromises[queryId][whatId] && this._collectionPromises[queryId][whatId]["promise"] instanceof Promise) {
      return this._collectionPromises[queryId][whatId]["promise"];
    } else {
      this._collectionPromises[queryId][whatId]["promise"] = new Promise(function (resolve, reject) {
        if (!queryId) reject(utils.warn("Data.js 'get' method doesn't like the queryId you gave it: " + queryId));
        _this._getFrames(queryId, whatId, framesArray, keys).then(function (frames) {
          _this._collection[queryId]["frames"][whatId] = frames;
          resolve(_this._collection[queryId]["frames"][whatId]);
        });
      })

    }
    return this._collectionPromises[queryId][whatId]["promise"];
  },


  getFrame: function(queryId, framesArray, neededFrame, keys) {
    //can only be called after getFrames()
    var _this = this;
    var whatId = this._getCacheKey(framesArray, keys);
    return new Promise(function(resolve, reject) {
      if (_this._collection[queryId]["frames"][whatId] && _this._collection[queryId]["frames"][whatId][neededFrame]) {
        resolve(_this._collection[queryId]["frames"][whatId]);
      } else {
        _this._collectionPromises[queryId][whatId]["queue"].forceFrame(neededFrame, function() {
          resolve(_this._collection[queryId]["frames"][whatId]);
        });
      }
    });
  },

  listenFrame: function(queryId, framesArray, keys,  cb) {
    var _this = this;
    var whatId = this._getCacheKey(framesArray, keys);
    this._collectionPromises[queryId][whatId]["queue"].defaultCallbacks.push(function(time) {
      cb(queryId, time);
    });
    if (this._collection[queryId]["frames"][whatId]) {
      utils.forEach(this._collection[queryId]["frames"][whatId], function(frame, key) {
        cb(queryId, new Date(key));
      });
    }
  },

  _muteAllQueues: function(except) {
    utils.forEach(this._collectionPromises, function(queries, queryId) {
        utils.forEach(queries, function(promise, whatId) {
          if(promise.queue.isActive == true && promise.queue.whatId != except) {
            promise.queue.mute();
          }
        });
    });
  },
  
  _checkForcedQueuesExists: function() {
    utils.forEach(this._collectionPromises, function(queries, queryId) {
      utils.forEach(queries, function(promise, whatId) {
        if(promise.queue.forcedQueue.length > 0) {
          promise.queue.unMute();
        }
      });
    });
  },

  _unmuteQueue: function() {
    utils.forEach(this._collectionPromises, function(queries, queryId) {
      utils.forEach(queries, function(promise, whatId) {
        if(promise.queue.isActive == false) {
          promise.queue.unMute();
        }
      });
    });
  },
  /**
   * set priority for generate each year frame
   * @param framesArray
   * @returns {*}
   */
  framesQueue: function(framesArray, whatId) {
    var _context = this;
    return new function() {
      this.defaultCallbacks = [];
      this.callbacks = {};
      this.forcedQueue = [];
      this.isActive = true;
      this.deferredPromise = null;
      this.whatId = whatId;
      this.queue = framesArray.slice(0); //clone array
      var queue = this;
      //put the last element to the start of the queue because we are likely to need it first
      this.queue.splice(0, 0, this.queue.splice(this.queue.length - 1, 1)[0]);
      this.key = 0;
      this.mute = function() {
        this.isActive = false;
        if (!(this.deferredPromise instanceof Promise && this.deferredPromise.status == "pending")) {
          this.deferredPromise = new Promise();
        }
      };

      this.unMute = function() {
        this.isActive = true;
        if (this.deferredPromise instanceof Promise) {
          this.deferredPromise.resolve();
        }
        this.deferredPromise = null;
        if (this.forcedQueue.length == 0 && this.queue.length == 0) {
          _context._unmuteQueue();
        }
      };
      this.frameComplete = function(frameName) { //function called after build each frame with name of frame build
        var i;
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
        if (!this.deferredPromise instanceof Promise) {
          this.deferredPromise = new Promise();
        }
        if (this.isActive) {
          this.deferredPromise.resolve();
        }
        return this.deferredPromise;
      };

      this._getNextFrameName = function() {
        var frameName = null;
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
        var defer = new Promise();
        this.checkForcedFrames();
        if (this.isActive) {
          defer.resolve(this._getNextFrameName());
        } else {
          this._waitingForActivation().then(function() {
            defer.resolve(queue._getNextFrameName());
          });
        }
        return defer;
      };

      // force the particular frame up the queue
      this.forceFrame = function(frameName, cb) {
        var objIndexOf = function(obj, need) {
          var search = need.toString();
          var index = -1;
          for(var i = 0, len = obj.length; i < len; i++) {
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
          var newKey = objIndexOf(this.queue, frameName);//this.queue.indexOf(frameName.toString());
          if (newKey !== -1) {
            this.forcedQueue.unshift(this.queue.splice(newKey, 1).pop());
            _context._muteAllQueues(this.whatId);
            this.unMute();
            if (typeof cb === "function") {
              if (typeof this.callbacks[frameName] != "object") {
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
      }
    }();
  },


  /**
   * Get regularised dataset (where gaps are filled)
   * @param {Number} queryId hash code for query
   * @param {String} whatId hash code for cache
   * @param {Array} framesArray -- array of keyframes across animatable
   * @param {Array} keys -- array of keys
   * @returns {Object} regularised dataset, nested by [animatable, column, key]
   */
  _getFrames: function(queryId, whatId, framesArray, keys) {
    var _this = this;

    if (!_this._collection[queryId]["frames"][whatId]) {
      _this._collection[queryId]["frames"][whatId] = {};
    }
    return new Promise(function(resolve, reject) {

      //TODO: thses should come from state or from outside somehow
      // FramesArray in the input contains the array of keyframes in animatable dimension.
      // Example: array of years like [1800, 1801 … 2100]
      // these will be the points where we need data
      // (some of which might already exist in the set. in regular datasets all the points would exist!)

      // Check if query.where clause is missing a time field

      var indicatorsDB = _this.getConceptprops();

      if(!indicatorsDB) utils.warn("_getFrames in data.js is missing indicatorsDB, it's needed for gap filling");
      if(!framesArray) utils.warn("_getFrames in data.js is missing framesArray, it's needed so much");

      var KEY = _this._collection[queryId].query.select.key[0];
      var TIME = _this._collection[queryId].query.animatable;

      var filtered = {};
      var items, itemsIndex, oneFrame, method, use, next;

      // We _nest_ the flat dataset in two levels: first by “key” (example: geo), then by “animatable” (example: year)
      // See the _getNested function for more details
      var nested = _this.get(queryId, 'nested', [KEY, TIME]);
      keys = keys ? keys : Object.keys(nested);
      // Get the list of columns that are in the dataset, exclude key column and animatable column
      // Example: [“lex”, “gdp”, “u5mr"]
      var query = _this._collection[queryId].query;
      var columns = query.select.value.filter(function(f){return f !== "_default"});

      var cLength = columns.length;
      var key, k, column, c;

      for (k = 0; k < keys.length; k++) {
        filtered[keys[k]] = {};
        for (c = 0; c < cLength; c++) filtered[keys[k]][columns[c]] = null;
      }
      for (c = 0; c < cLength; c++) _this._collection[queryId].haveNoDataPointsPerKey[columns[c]] = {};

      var buildFrame = function(frameName, keys, queryId, callback) {
        var frame = {};
          if (query.from !== "datapoints") {
            // we populate the regular set with a single value (unpack properties into constant time series)
            var dataset = _this._collection[queryId].data;
            for (c = 0; c < cLength; c++) frame[columns[c]] = {};

            for (var i = 0; i < dataset.length; i++) {
              var d = dataset[i];
              for (c = 0; c < cLength; c++) {
                frame[columns[c]][d[KEY]] = d[columns[c]];
                //check data for properties with missed data. If founded then write key to haveNoDataPointsPerKey with
                //count of broken datapoints
                if(d[columns[c]] == null) {
                  _this._collection[queryId].haveNoDataPointsPerKey[columns[c]][d[KEY]] = dataset.length;
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

              for (c = 0; c < cLength; c++) {
                column = columns[c];

                //If there are some points in the array with valid numbers, then
                //interpolate the missing point and save it to the “clean regular set”
                method = indicatorsDB[column] ? indicatorsDB[column].interpolation : null;
                use = indicatorsDB[column] ? indicatorsDB[column].use : "indicator";


                // Inside of this 3-level loop is the following:
                if (nested[key] && nested[key][frameName] && (nested[key][frameName][0][column] || nested[key][frameName][0][column] === 0)) {

                  // Check if the piece of data for [this key][this frame][this column] exists
                  // and is valid. If so, then save it into a “clean regular set”
                  frame[column][key] = nested[key][frameName][0][column];

                } else if (method === "none") {

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
                    var givenFrames = Object.keys(nested[key]);
                    items = new Array(givenFrames.length);
                    itemsIndex = 0;

                    for (var z = 0, length = givenFrames.length; z < length; z++) {
                      oneFrame = nested[key][givenFrames[z]];
                      if (oneFrame[0][column] || oneFrame[0][column] === 0) items[itemsIndex++] = oneFrame[0];
                    }

                    //trim the length of the array
                    items.length = itemsIndex;

                    if (itemsIndex === 0) {
                      filtered[key][column] = [];
                    } else {
                      filtered[key][column] = items;
                    }

                    if(items.length==0) _this._collection[queryId].haveNoDataPointsPerKey[column][key] = items.length;
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
          _this._collection[queryId]["frames"][whatId][frameName] = frame;

          // fire the callback
          if (typeof callback === "function") {
            // runs the function frameComplete inside framesQueue.getNext()
            callback(frameName);
          }

          // recursively call the buildFrame again, this time for the next frame
          //QUESTION: FramesArray is probably not needed at this point. queryId and whatId is enough
          _this._collectionPromises[queryId][whatId]["queue"].getNext().then(function(nextFrame) {
            if (nextFrame) {
              utils.defer(function() {
                buildFrame(nextFrame, keys, queryId, _this._collectionPromises[queryId][whatId]["queue"].frameComplete);
              });
            } else {
              //this goes to marker.js as a "response"
              resolve(_this._collection[queryId]["frames"][whatId]);
            }
          });
      };
      _this._collectionPromises[queryId][whatId]["queue"].getNext().then(function(nextFrame) {
        if (nextFrame) {
          buildFrame(nextFrame, keys, queryId, _this._collectionPromises[queryId][whatId]["queue"].frameComplete);
        }
      });
    });
  },


  _getNested: function(queryId, order) {
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

    var nest = d3.nest();
    for(var i = 0; i < order.length; i++) {
      nest = nest.key(
        (function(k) {
          return function(d) {
            return d[k];
          };
        })(order[i])
      );
    };

    return utils.nestArrayToObj(nest.entries(this._collection[queryId]['data']));
  },


  _getUnique: function(queryId, attr) {
    var uniq;
    var items = this._collection[queryId].data;
    //if it's an array, it will return a list of unique combinations.
    if(utils.isArray(attr)) {
      var values = items.map(function(d) {
        return utils.clone(d, attr); //pick attrs
      });
      uniq = utils.unique(values, function(n) {
        return JSON.stringify(n);
      });
    } //if it's a string, it will return a list of values
    else {
      var values = items.map(function(d) {
        return d[attr];
      });
      uniq = utils.unique(values);
    }
    return uniq;
  },

  _getValid: function(queryId, column) {
    return this._collection[queryId].data.filter(function(f){return f[column] || f[column]===0});
  },

  _getLimits: function(queryId, attr) {

    var items = this._collection[queryId].data;
    // get only column attr and only rows with number or date
    var filtered = items.reduce(function(filtered, d) {

      // check for dates
      var f = (utils.isDate(d[attr])) ? d[attr] : parseFloat(d[attr]);

      // if it is a number
      if(!isNaN(f)) {
        filtered.push(f);
      }

      //filter
      return filtered;
    }, []);

    // get min/max for the filtered rows
    var min;
    var max;
    var limits = {};
    for(var i = 0; i < filtered.length; i += 1) {
      var c = filtered[i];
      if(typeof min === 'undefined' || c < min) {
        min = c;
      }
      if(typeof max === 'undefined' || c > max) {
        max = c;
      }
    }
    limits.min = min || 0;
    limits.max = max || 100;
    return limits;
  },

  /**
   * checks whether this combination is cached or not
   */
  isCached: function(query, reader) {
    //encode in hashCode
    var q = utils.hashCode([
      query,
      reader
    ]);
    //simply check if we have this in internal data
    if(Object.keys(this._collection).indexOf(q) !== -1) {
      return q;
    }
    return false;
  }
});

export default Data;
