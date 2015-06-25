/*!
 * VIZABI DATA
 * Manages data
 */
(function () {
  'use strict';

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;
  var Promise = Vizabi.Promise;
  var Data = Vizabi.Class.extend({

    init: function () {
      this._collection = {};
    },

    /**
     * Loads resource from reader or cache
     * @param {Array} query Array with queries to be loaded
     * @param {String} language Language
     * @param {Object} reader Which reader to use - data reader info
     * @param {String} path Where data is located
     */
    load: function (query, language, reader, evts) {
      var _this = this;
      var promise = new Promise();
      var wait = new Promise().resolve();
      var cached = query === true ? true : this.isCached(query, language, reader);
      var loaded = false;
      //if result is cached, dont load anything
      if (!cached) {
        utils.timeStamp('Vizabi Data: Loading Data');
        if (evts && typeof evts.load_start === 'function') {
          evts.load_start();
        }
        wait = new Promise();
        this.loadFromReader(query, language, reader).then(function (queryId) {
          loaded = true;
          cached = queryId;
          wait.resolve();
        });
      }
      wait.then(function () {
        //pass the data forward
        var data = _this._collection[cached].data;
        //not loading anymore
        if (loaded && evts && typeof evts.load_end === 'function') {
          evts.load_end();
        }
        promise.resolve(cached);
      }, function () {
        //not loading anymore
        if (loaded && evts && typeof evts.load_end === 'function') {
          evts.load_end();
        }
        promise.reject('Error loading file...');
      });
      return promise;
    },

    /**
     * Loads resource from reader
     * @param {Array} query Array with queries to be loaded
     * @param {String} lang Language
     * @param {Object} reader Which reader to use. E.g.: "json-file"
     * @param {String} path Where data is located
     */
    loadFromReader: function (query, lang, reader) {
      var _this = this;
      var promise = new Promise();
      var reader_name = reader.reader;
      var queryId = utils.hashCode([
        query,
        lang,
        reader
      ]);
      var readerClass = Vizabi.Reader.get(reader_name);
      var r = new readerClass(reader);
      r.read(query, lang).then(function () {
          //success reading
          var values = r.getData();
          var q = query;

          //make sure all queried is returned
          values = values.map(function (d) {
            for (var i = 0; i < q.select.length; i += 1) {
              var col = q.select[i];
              if (typeof d[col] === 'undefined') {
                d[col] = null;
              }
            }
            return d;
          });

          _this._collection[queryId] = {};
          var col = _this._collection[queryId];
          col.data = values;
          col.filtered = {};
          col.unique = {};
          col.limits = {};
          promise.resolve(queryId);
        }, //error reading
        function (err) {
          promise.reject(err);
        });
      return promise;
    },

    /**
     * get data
     */
    get: function (queryId, what) {
      if (!queryId) {
        return;
      }
      if (!what) {
        what = 'data';
      }
      return this._collection[queryId][what];
    },

    /**
     * checks whether this combination is cached or not
     */
    isCached: function (query, language, reader) {
      //encode in hashCode
      var q = utils.hashCode([
        query,
        language,
        reader
      ]);
      //simply check if we have this in internal data
      if (Object.keys(this._collection).indexOf(q) !== -1) {
        return q;
      }
      return false;
    }
  });

  /**
   * Initializes the reader.
   * @param {Object} reader_info Information about the reader
   */
  var Reader = Vizabi.Class.extend({
    init: function (reader_info) {
      this._name = this._name || reader_info.reader;
      this._data = reader_info.data || [];
      this._basepath = this._basepath || reader_info.path || null;
      this._formatters = reader_info.formatters;

      if (this._formatters) {
        this._data = utils.mapRows(this._data, this._formatters);
      }
    },

    /**
     * Reads from source
     * @param {Array} queries Queries to be performed
     * @param {String} language language
     * @returns a promise that will be resolved when data is read
     */
    read: function (queries, language) {
      return new Promise.resolve();
    },

    /**
     * Gets the data
     * @returns all data
     */
    getData: function () {
      return this._data;
    }
  });
  Vizabi.Reader = Reader;
  Vizabi.Data = Data;
}.call(this));
