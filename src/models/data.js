import * as utils from 'base/utils';
import Model from 'base/model';
import Reader from 'base/reader';
import EventSource from 'base/events';

/*
 * VIZABI Data Model (model.data)
 */

var DataModel = Model.extend({

  /**
   * Default values for this model
   */
  getClassDefaults: function() { 
    var defaults = {
      reader: "csv"
    };
    return utils.deepExtend(this._super(), defaults)
  },

  trackInstances: true,

  /**
   * Initializes the data model.
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init: function(name, values, parent, bind) {

    this._type = "data";

    this.queryQueue = {};
    this._collection = {};
    this._collectionPromises = {}; // stores promises, making sure we don't do one calulation twice

    //same constructor as parent, with same arguments
    this._super(name, values, parent, bind);

    this.readerObject = this.getReader();

  },

  /**
   * Loads concept properties when all other models are also starting to load data
   * @return {Promise} Promise which resolves when concepts are loaded
   */
  preloadData: function() {
    return this.loadConceptProps();
  },

  /**
   * Loads resource from reader or cache
   * @param {Array} query Array with queries to be loaded
   * @param {Object} parsers An object with concepts as key and parsers as value
   * @param {*} evts ?
   */
  load: function(query, parsers = {}) {

    // add waffle server specific query clauses if set
    if (this.dataset) query.dataset = this.dataset;
    if (this.version) query.version = this.version;

    var dataId = this.getDataId(query);

    if (dataId) {
      return Promise.resolve(dataId);
    } else {
      utils.timeStamp('Vizabi Data: Loading Data');
      EventSource.freezeAll([
        'hook_change',
        'resize'
      ]);
      return this.loadFromReader(query, parsers)
        .then(dataId => { 
          EventSource.unfreezeAll();
          return dataId;
        });
    }

  },

  /**
   * Loads resource from reader
   * @param {Array} query Array with queries to be loaded
   * @param {Object} parsers An object with concepts as key and parsers as value
   */
  loadFromReader: function(query, parsers) {
    var _this = this;
    
    var dataId = utils.hashCode([
      query
    ]);
    var queryMergeId = utils.hashCode([
      query.select.key,
      query.where,
      query.join
    ]);

    if (this.queryQueue[queryMergeId]) {

      // add select to base query and return the base query promise
      Array.prototype.push.apply(this.queryQueue[queryMergeId].query.select.value, query.select.value);
      utils.extend(this.queryQueue[queryMergeId].parsers, parsers);
      return this.queryQueue[queryMergeId].promise;
    
    } else {

      // set up base query
      var promise = new Promise(function(resolve, reject) {

        // wait one execution round for the queue to fill up
        utils.defer(function() {
          // now the query queue is filled with all queries from one execution round

          // remove double columns from select (resulting from merging)
          // no double columns in formatter because it's an object, extend would've overwritten doubles
          query.select.value = utils.unique(query.select.value);

          // execute the query with this reader
          _this.readerObject.read(query, parsers).then(function(response) {

              //success reading
              _this.checkQueryResponse(query, response);

              _this._collection[dataId] = {};
              _this._collectionPromises[dataId] = {};
              var col = _this._collection[dataId];
              col.data = response;
              col.valid = {};
              col.nested = {};
              col.unique = {};
              col.limits = {};
              col.frames = {};
              col.haveNoDataPointsPerKey = {};
              col.query = query;
              // col.sorted = {}; // TODO: implement this for sorted data-sets, or is this for the server/(or file reader) to handle?

              // remove query from queue
              _this.queryQueue[queryMergeId] = null;
              resolve(dataId);

            }, //error reading
            function(err) {
              _this.queryQueue[queryMergeId] = null;
              reject(err);
            }
          );

        });
      });


      this.queryQueue[queryMergeId] = {
        query: query,
        parsers: parsers,
        promise: promise
      };
      
      return this.queryQueue[queryMergeId].promise;

    }

  },

  getReader: function() {
    // Create a new reader for this query
    var readerClass = Reader.get(this.reader);
    if (!readerClass) {
      throw new Error('Unknown reader: ' + this.reader);
    }

    return new readerClass({
      path: this.path,
      delimiter: this.delimiter,
      keySize: this.keySize
    });
  },

  checkQueryResponse: function(query, response) {
    if (response.length == 0) utils.warn("Reader for data source '" + this._name + "' returned empty array for query:", JSON.stringify(query, null, 2))

    if (response.length > 0) {
      // search data for the entirely missing columns
      var columnsMissing = (query.select.key||[]).concat(query.select.value||[]);
      for (var i = response.length-1; i>=0; i--){
        for (var c = columnsMissing.length-1; c>=0; c--){
          // if found value for column c in row i then remove that column name from the list of missing columns
          if (response[i][columnsMissing[c]] || response[i][columnsMissing[c]]===0) columnsMissing.splice(c,1);
        }
        // all columns were found to have value in at least one of the rows then stop iterating
        if (!columnsMissing.length) break;
      }
      columnsMissing.forEach(function(d) {
        if (query.select.key.indexOf(d)==-1){
          utils.warn('Reader result: Column "' + d + '" is missing from "' + query.from + '" data, but it might be ok');
        } else {
          utils.error('Reader result: Key column "' + d + '" is missing from "' + query.from + '" data for query:', JSON.stringify(query));
          console.log(response);
        }
      });
    }
  },

  /**
   * get data
   */
  getData: function(dataId, what, whatId, args) {
    // if not specified data from what query, return nothing
    if(!dataId) return utils.warn("Data.js 'get' method doesn't like the dataId you gave it: " + dataId);

    // if they want data, return the data
    if(!what || what == 'data') {
      return this._collection[dataId]['data'];
    }

    // if they didn't give an instruction, give them the whole thing
    // it's probably old code which modifies the data outside this class
    // TODO: move these methods inside (e.g. model.getNestedItems())
    if (!whatId) {
      return this._collection[dataId][what];
    }

    // if they want a certain processing of the data, see if it's already in cache
    var id = (typeof whatId == "string")? whatId : JSON.stringify(whatId);
    if(this._collection[dataId][what][id]) {
      return this._collection[dataId][what][id];
    }

    // if it's not cached, process the data and then return it
    switch(what) {
      case 'unique':
        this._collection[dataId][what][id] = this._getUnique(dataId, whatId);
        break;
      case 'valid':
        this._collection[dataId][what][id] = this._getValid(dataId, whatId);
        break;
      case 'limits':
        this._collection[dataId][what][id] = this._getLimits(dataId, whatId);
        break;
      case 'nested':
        this._collection[dataId][what][id] = this._getNested(dataId, whatId);
        break;
      case 'haveNoDataPointsPerKey':
        //do nothing. no caching is available for this option, served directly from collection
        break;
    }
    return this._collection[dataId][what][id];
  },

  loadConceptProps: function(){
    var _this = this;

    var query = {
      select: {
        key: ["concept"],
        value: ["concept_type","domain","indicator_url","color","scales","interpolation","tags","name","unit","description"]
      },
      from: "concepts",
      where: {},
      language: this.getClosestModel('locale').id,
    };

    return this.load(query)
      .then(this.handleConceptPropsResponse.bind(this))
      .catch(function(err) {
        utils.warn('Problem with query: ', query);
      });

  },

  handleConceptPropsResponse: function(dataId) {

    this.conceptDictionary = {_default: {concept_type: "string", use: "constant", scales: ["ordinal"], tags: "_root"}};
    this.conceptArray = [];
    
    this.getData(dataId).forEach(d => {
      var concept = {};

      if(d.concept_type) concept["use"] = (d.concept_type=="measure" || d.concept_type=="time")?"indicator":"property";
      
      concept["concept_type"] = d.concept_type;
      concept["sourceLink"] = d.indicator_url;
      try {
        concept["color"] = d.color && d.color !== "" ? JSON.parse(d.color) : null;
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
      if(concept["scales"]==null) concept["scales"] = ["linear", "log"];
      if(d.interpolation){
        concept["interpolation"] = d.interpolation;
      }else if(d.concept_type == "measure"){
        concept["interpolation"] = concept.scales && concept.scales[0]=="log"? "exp" : "linear";
      }else if(d.concept_type == "time"){
        concept["interpolation"] = "linear";        
      }else{
        concept["interpolation"] = "stepMiddle";
      }
      concept["concept"] = d.concept;
      concept["domain"] = d.domain;
      concept["tags"] = d.tags;
      concept["name"] = d.name||d.concept||"";
      concept["unit"] = d.unit||"";
      concept["description"] = d.description;
      this.conceptDictionary[d.concept] = concept;
      this.conceptArray.push(concept);
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

  getConceptByIndex: function(index) {
    return this.conceptArray[index];
  },
  
  getDatasetName: function(){
    if(this.readerObject.getDatasetInfo) {
      var meta = this.readerObject.getDatasetInfo();
      return meta.name + (meta.version ? " " + meta.version : "");
    }
    return this._name;
  },

  _getCacheKey: function(frames, keys) {
    var result = frames[0] + " - " + frames[frames.length-1];
    if (keys) {
      result = result + "_" + keys.join();
    }
    return result;
  },

  getFrames: function(dataId, framesArray, keys) {
    var _this = this;
    var whatId = this._getCacheKey(framesArray, keys);
    if (!this._collectionPromises[dataId][whatId]) {
      this._collectionPromises[dataId][whatId] = {
        queue: this.framesQueue(framesArray, whatId),
        promise: null
      };
    }
    if (this._collectionPromises[dataId][whatId] && this._collectionPromises[dataId][whatId]["promise"] instanceof Promise) {
      return this._collectionPromises[dataId][whatId]["promise"];
    } else {
      this._collectionPromises[dataId][whatId]["promise"] = new Promise(function (resolve, reject) {
        if (!dataId) reject(utils.warn("Data.js 'get' method doesn't like the dataId you gave it: " + dataId));
        _this._getFrames(dataId, whatId, framesArray, keys).then(function (frames) {
          _this._collection[dataId]["frames"][whatId] = frames;
          resolve(_this._collection[dataId]["frames"][whatId]);
        });
      })

    }
    return this._collectionPromises[dataId][whatId]["promise"];
  },


  getFrame: function(dataId, framesArray, neededFrame, keys) {
    //can only be called after getFrames()
    var _this = this;
    var whatId = this._getCacheKey(framesArray, keys);
    return new Promise(function(resolve, reject) {
      if (_this._collection[dataId]["frames"][whatId] && _this._collection[dataId]["frames"][whatId][neededFrame]) {
        resolve(_this._collection[dataId]["frames"][whatId]);
      } else {
        _this._collectionPromises[dataId][whatId]["queue"].forceFrame(neededFrame, function() {
          resolve(_this._collection[dataId]["frames"][whatId]);
        });
      }
    });
  },

  listenFrame: function(dataId, framesArray, keys,  cb) {
    var _this = this;
    var whatId = this._getCacheKey(framesArray, keys);
    this._collectionPromises[dataId][whatId]["queue"].defaultCallbacks.push(function(time) {
      cb(dataId, time);
    });
    if (this._collection[dataId]["frames"][whatId]) {
      utils.forEach(this._collection[dataId]["frames"][whatId], function(frame, key) {
        cb(dataId, new Date(key));
      });
    }
  },

  _muteAllQueues: function(except) {
    utils.forEach(this._collectionPromises, function(queries, dataId) {
        utils.forEach(queries, function(promise, whatId) {
          if(promise.queue.isActive == true && promise.queue.whatId != except) {
            promise.queue.mute();
          }
        });
    });
  },

  _checkForcedQueuesExists: function() {
    utils.forEach(this._collectionPromises, function(queries, dataId) {
      utils.forEach(queries, function(promise, whatId) {
        if(promise.queue.forcedQueue.length > 0) {
          promise.queue.unMute();
        }
      });
    });
  },

  _unmuteQueue: function() {
    utils.forEach(this._collectionPromises, function(queries, dataId) {
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
      this.delayedAction = null;
      this.whatId = whatId;
      this.queue = framesArray.slice(0); //clone array
      var queue = this;
      //put the last element to the start of the queue because we are likely to need it first
      this.queue.splice(0, 0, this.queue.splice(this.queue.length - 1, 1)[0]);
      this.key = 0;
      this.mute = function() {
        var _this = this;
        this.isActive = false;
        new Promise(function(resolve, reject){
          _this.delayedAction = resolve;    
        });
      };

      this.unMute = function() {
        this.isActive = true;
        if (typeof this.delayedAction == "function") {
          this.delayedAction();
        }
        this.delayedAction = null;
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
        var _this = this;
        return new Promise(function(resolve, reject) {
          if (_this.isActive) {
            return resolve();
          }
          _this.delayedAction = resolve;
        });
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
        var _this = this;
        return new Promise(function(resolve, reject) {
          _this.checkForcedFrames();
          if (_this.isActive) {
            resolve(_this._getNextFrameName());
          } else {
            _this._waitingForActivation().then(function() {
              resolve(_this._getNextFrameName());
            });
          }
        });
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
   * @param {Number} dataId hash code for query
   * @param {String} whatId hash code for cache
   * @param {Array} framesArray -- array of keyframes across animatable
   * @param {Array} keys -- array of keys
   * @returns {Object} regularised dataset, nested by [animatable, column, key]
   */
  _getFrames: function(dataId, whatId, framesArray, keys) {
    var _this = this;

    if (!_this._collection[dataId]["frames"][whatId]) {
      _this._collection[dataId]["frames"][whatId] = {};
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

      var KEY = _this._collection[dataId].query.select.key[0];
      var TIME = _this._collection[dataId].query.animatable;

      var filtered = {};
      var items, itemsIndex, oneFrame, method, use, next;

      // We _nest_ the flat dataset in two levels: first by “key” (example: geo), then by “animatable” (example: year)
      // See the _getNested function for more details
      var nested = _this.getData(dataId, 'nested', [KEY, TIME]);
      keys = keys ? keys : Object.keys(nested);
      // Get the list of columns that are in the dataset, exclude key column and animatable column
      // Example: [“lex”, “gdp”, “u5mr"]
      var query = _this._collection[dataId].query;
      var columns = query.select.value.filter(function(f){return f !== "_default"});

      var cLength = columns.length;
      var key, k, column, c;

      for (k = 0; k < keys.length; k++) {
        filtered[keys[k]] = {};
        for (c = 0; c < cLength; c++) filtered[keys[k]][columns[c]] = null;
      }
      for (c = 0; c < cLength; c++) _this._collection[dataId].haveNoDataPointsPerKey[columns[c]] = {};

      var buildFrame = function(frameName, keys, dataId, callback) {
        var frame = {};
          if (query.from !== "datapoints") {
            // we populate the regular set with a single value (unpack properties into constant time series)
            var dataset = _this._collection[dataId].data;
            for (c = 0; c < cLength; c++) frame[columns[c]] = {};

            for (var i = 0; i < dataset.length; i++) {
              var d = dataset[i];
              for (c = 0; c < cLength; c++) {
                frame[columns[c]][d[KEY]] = d[columns[c]];
                //check data for properties with missed data. If founded then write key to haveNoDataPointsPerKey with
                //count of broken datapoints
                if(d[columns[c]] == null) {
                  _this._collection[dataId].haveNoDataPointsPerKey[columns[c]][d[KEY]] = dataset.length;
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

                    if(items.length==0) _this._collection[dataId].haveNoDataPointsPerKey[column][key] = items.length;
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
          _this._collectionPromises[dataId][whatId]["queue"].getNext().then(function(nextFrame) {
            if (nextFrame) {
              utils.defer(function() {
                buildFrame(nextFrame, keys, dataId, _this._collectionPromises[dataId][whatId]["queue"].frameComplete);
              });
            } else {
              //this goes to marker.js as a "response"
              resolve(_this._collection[dataId]["frames"][whatId]);
            }
          });
      };
      _this._collectionPromises[dataId][whatId]["queue"].getNext().then(function(nextFrame) {
        if (nextFrame) {
          buildFrame(nextFrame, keys, dataId, _this._collectionPromises[dataId][whatId]["queue"].frameComplete);
        }
      });
    });
  },


  _getNested: function(dataId, order) {
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

    return utils.nestArrayToObj(nest.entries(this._collection[dataId]['data']));
  },


  _getUnique: function(dataId, attr) {
    var uniq;
    var items = this._collection[dataId].data;
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

  _getValid: function(dataId, column) {
    return this._collection[dataId].data.filter(function(f){return f[column] || f[column]===0});
  },

  _getLimits: function(dataId, attr) {

    var items = this._collection[dataId].data;
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
  getDataId: function(query) {
    //encode in hashCode
    var q = utils.hashCode([
      query
    ]);
    //simply check if we have this in internal data
    if(Object.keys(this._collection).indexOf(q) !== -1) {
      return q;
    }
    return false;
  }

});

export default DataModel;
