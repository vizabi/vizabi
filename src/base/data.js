import * as utils from 'utils';
import Promise from 'promise';
import Class from 'class';
import Reader from 'reader';

var Data = Class.extend({

  init: function() {
    this._collection = {};
  },

  /**
   * Loads resource from reader or cache
   * @param {Array} query Array with queries to be loaded
   * @param {String} language Language
   * @param {Object} reader Which reader to use - data reader info
   * @param {*} evts ?
   */
  load: function(query, language, reader, evts) {
    var _this = this;
    var promise = new Promise();
    var wait = new Promise().resolve();
    var cached = query === true ? true : this.isCached(query, language, reader);
    var loaded = false;
    //if result is cached, dont load anything
    if(!cached) {
      utils.timeStamp('Vizabi Data: Loading Data');
      if(evts && typeof evts.load_start === 'function') {
        evts.load_start();
      }
      wait = new Promise();
      this.loadFromReader(query, language, reader).then(function(queryId) {
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
   * @param {String} lang Language
   * @param {Object} reader Which reader to use. E.g.: "json"
   * @param {String} path Where data is located
   */
  loadFromReader: function(query, lang, reader) {
    var _this = this;
    var promise = new Promise();
    var reader_name = reader.reader;
    var queryId = utils.hashCode([
      query,
      lang,
      reader
    ]);

    // joining multiple queries
    // create a queue which this datamanager writes all queries to
    this.queryQueue = this.queryQueue || [];
    this.queryQueue.push({ query: query, queryId: queryId, promise: promise });

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
           && utils.comparePlainObjects(queueItem.query.grouping, query.grouping)
            ) {

            // if so, merge the selects to the base query
            Array.prototype.push.apply(query.select, queueItem.query.select);

            // include query's promise to promises for base query
            mergedQueries.push(queueItem);

            // remove from queue as it's merged in the current query
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
      query.select = utils.unique(query.select);

      //create hash for dimensions only query
      var dim, dimQ, dimQId = 0; 
      dimQ = utils.clone(query);
      dim = utils.keys(dimQ.grouping);
      if (utils.arrayEquals(dimQ.select.slice(0, dim.length), dim)) {
        dimQ.select = dim;
        dimQId = utils.hashCode([
          dimQ,
          lang,
          reader
        ]);
      }

      // Create a new reader for this query
      var readerClass = Reader.get(reader_name);
      if (!readerClass) {
        throw new Error('Unknown reader: ' + reader_name);
      }
      var r = new readerClass(reader);

      // execute the query with this reader
      r.read(query, lang).then(function() {

          //success reading
          var values = r.getData();
          var q = query;

          //make sure all queried is returned
          values = values.map(function(d) {
            for(var i = 0; i < q.select.length; i += 1) {
              var col = q.select[i];
              if(typeof d[col] === 'undefined') {
                d[col] = null;
              }
            }
            return d;
          });

          _this._collection[queryId] = {};
          var col = _this._collection[queryId];
          col.data = values;
          col.filtered = {};
          col.nested = {};
          col.unique = {};
          col.limits = {};
          col.limitsPerFrame = {};
          col.frames = {};
          col.query = q;
          // col.sorted = {}; // TODO: implement this for sorted data-sets, or is this for the server/(or file reader) to handle?

          // returning the query-id/values of the merged query without splitting the result up again per query
          // this is okay because the collection-object above will only be passed by reference to the cache and this will not take up more memory. 
          // On the contrary: it uses less because there is no need to duplicate the key-columns.
          utils.forEach(mergedQueries, function(mergedQuery) {
            // set the cache-location for each seperate query to the combined query's cache
            _this._collection[mergedQuery.queryId] = _this._collection[queryId]; 
            // resolve the query
            mergedQuery.promise.resolve(mergedQuery.queryId);
          });
  
          //create cache record for dimension only query
          if(dimQId !== 0) {
            _this._collection[dimQId] = _this._collection[queryId];              
          }
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
    var id = JSON.stringify(whatId);
    if(this._collection[queryId][what][id]) {
      return this._collection[queryId][what][id];
    }

    // if it's not cached, process the data and then return it
    switch(what) {
      case 'unique':
        this._collection[queryId][what][id] = this._getUnique(queryId, whatId);
        break;
      case 'filtered':
        this._collection[queryId][what][id] = this._getFiltered(queryId, whatId);
        break;
      case 'limits':
        this._collection[queryId][what][id] = this._getLimits(queryId, whatId);
        break;
      case 'limitsPerFrame':
        this._collection[queryId][what][id] = this._getLimitsPerFrame(queryId, whatId, args);
        break;
      case 'frames':
        this._collection[queryId][what][id] = this._getFrames(queryId, whatId, args);
        break;
      case 'nested':     
        this._collection[queryId][what][id] = this._getNested(queryId, whatId);
        break;
    }
    return this._collection[queryId][what][id];
  },

    
    
  
  /**
   * Get regularised dataset (where gaps are filled)
   * @param {Number} queryId hash code for query
   * @param {Array} framesArray -- array of keyframes across animatable
   * @param {Object} indicatorsDB -- indicators DB from globals.metadata
   * @returns {Object} regularised dataset, nested by [animatable, column, key]
   */
  _getFrames: function(queryId, framesArray, indicatorsDB) {
      var _this = this;
      
      if(!indicatorsDB) utils.warn("_getFrames in data.js is missing indicatorsDB, it's needed for gap filling")
      if(!framesArray) utils.warn("_getFrames in data.js is missing framesArray, it's needed so much")
            
      //TODO: thses should come from state or from outside somehow
      var KEY = "geo";
      var TIME = "time";
      var result = {};
      var filtered = {};
      var items, itemsIndex, givenFrames, oneFrame, method, use, next;
      
      // We _nest_ the flat dataset in two levels: first by “key” (example: geo), then by “animatable” (example: year)
      // See the _getNested function for more details
      var nested = this.get(queryId, 'nested', [KEY, TIME]);
      var keys = Object.keys(nested);
      
      // Get the list of columns that are in the dataset, exclude key column and animatable column
      // Example: [“lex”, “gdp”, “u5mr"]
      var query = this._collection[queryId].query;
      var columns = query.select.filter(function(f){return f != KEY && f != TIME && f !== "_default"});
      
      var fLength = framesArray.length;
      var kLength = keys.length;
      var cLength = columns.length;
      var frame, f, key, k, column, c;
      
      // FramesArray in the input contains the array of keyframes in animatable dimension. 
      // Example: array of years like [1800, 1801 … 2100]
      // these will be the points where we need data 
      // (some of which might already exist in the set. in regular datasets all the points would exist!)
      
      // Check if query.where clause is missing a time field
      if(!query.where.time){          
          // The query.where clause doesn't have time field for properties: 
          // we populate the regular set with a single value (unpack properties into constant time series)
          var dataset = _this._collection[queryId].data;
          
          for(f=0; f<fLength; f++){
              frame = framesArray[f];
              
              result[frame] = {};
              for(c=0; c<cLength; c++) result[frame][columns[c]] = {};
              
              for(var i=0; i<dataset.length; i++){   
                  var d = dataset[i];
                  for(c=0; c<cLength; c++) result[frame][columns[c]][d[KEY]] = d[columns[c]];
              };
          };
          
          
      }else{
          // If there is a time field in query.where clause, then we are dealing with indicators in this request

          // If time is restricted to a single point then override the input with that single point
          if(query.where.time[0].length === 1) framesArray = query.where.time[0];
          
          // Put together a template for cached filtered sets (see below what's needed)
          for(k=0; k<kLength; k++){
              filtered[keys[k]] = {};
              for(c=0; c<cLength; c++) filtered[keys[k]][columns[c]] = null;
          };

          // Now we run a 3-level loop: across frames, then across keys, then and across data columns (lex, gdp)
          for(f=0; f<fLength; f++){
            frame = framesArray[f];
            result[frame] = {};
            for(c=0; c<cLength; c++) result[frame][columns[c]] = {};

            for(k=0; k<kLength; k++){
                key = keys[k];
                
                for(c=0; c<cLength; c++){
                    column = columns[c];       
                    
                    //If there are some points in the array with valid numbers, then
                    //interpolate the missing point and save it to the “clean regular set” 
                    method = indicatorsDB[column] ? indicatorsDB[column].interpolation : null;
                    use = indicatorsDB[column] ? indicatorsDB[column].use : "indicator";
                    

                    // Inside of this 3-level loop is the following: 
                    if(nested[key] && nested[key][frame] && (nested[key][frame][0][column] || nested[key][frame][0][column] === 0)){

                        // Check if the piece of data for [this key][this frame][this column] exists 
                        // and is valid. If so, then save it into a “clean regular set”
                        result[frame][column][key] = nested[key][frame][0][column];
                        
                    }else{
                        // If the piece of data doesn’t exist or is invalid, then we need to inter- or extapolate it

                        // Let’s take a slice of the nested set, corresponding to the current key nested[key] 
                        // As you remember it has the data nested further by frames. 
                        // At every frame the data in the current column might or might not exist. 
                        // Thus, let’s filter out all the frames which don’t have the data for the current column. 
                        // Let’s cache it because we will most likely encounter another gap in the same column for the same key

                        items = filtered[key][column];

                        if(items == null){
                            
                            givenFrames = Object.keys(nested[key]);
                            items = new Array(givenFrames.length);
                            itemsIndex = 0;

                            for(var z = 0, length = givenFrames.length; z<length; z++){
                                oneFrame = nested[key][givenFrames[z]];
                                if(oneFrame[0][column] || oneFrame[0][column] === 0) items[itemsIndex++] = oneFrame[0];
                            };
                            
                            //trim the length of the array
                            items.length = itemsIndex;
                        }


                        // Now we are left with a fewer frames in the filtered array. Let's check its length. 
                        //If the array is empty, then the entire column is missing for the key
                        //So we let the key have missing values in this column for all frames
                        if(items.length > 0) {
                            next = null;
                            result[frame][column][key] = utils.interpolatePoint(items, use, column, next, TIME, frame, method);
                        }

                    }
                        

                }; //loop across columns
            }; //loop across keys
          }; //loop across frameArray
      }
      
      return result;
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

  _getFiltered: function(queryId, filter) {
    return utils.filter(this._collection[queryId].data, filter);
  },
    
    
  _getLimitsPerFrame: function(queryId, args, indicatorsDB) {
    var result = {};
    var values = [];
      
    var frames = this.get(queryId, 'frames', args.framesArray, indicatorsDB);
      
    utils.forEach(frames, function(frame, t){
        result[t] = {};
        
        values = utils.values(frame[args.which]);
        
        result[t] = !values || !values.length ? {max: 0, min: 0} : {
            max: d3.max(values), 
            min: d3.min(values)
        }
    });    
    
    return result;
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
  isCached: function(query, language, reader) {
    //encode in hashCode
    var q = utils.hashCode([
      query,
      language,
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
