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
   * @param {String} path Where data is located
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
          // col.sorted = {}; // TODO: implement this for sorted data-sets, or is this for the server/(or file reader) to handle?

          // returning the query-id/values of the merged query without splitting the result up again per query
          // this is okay because the collection-object above will only be passed by reference to the cache and this will not take up more memory. 
          // On the contrary: it uses less because there is no need to duplicate the key-columns.
          utils.forEach(mergedQueries, function(mergedQuery) {
            mergedQuery.promise.resolve(queryId);
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
  get: function(queryId, what, whatId) {
    // if not specified data from what query, return nothing
    if(!queryId) {
      return;
    }

    // if they want data, return the data
    if(!what || what == 'data') {
      return this._collection[queryId]['data'];
    }

    // if they didn't give an ID, give them the whole thing
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
    }
    return this._collection[queryId][what][id];
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
