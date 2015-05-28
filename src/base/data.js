/*!
 * VIZABI DATA
 * Manages data
 */

(function() {

    "use strict";
    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;
    var Promise = Vizabi.Promise;

    var Data = Vizabi.Class.extend({

        /**
         * Initializes the data manager.
         */
        init: function() {
            this._data = {};
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
            var wait = (new Promise).resolve();
            var cached = (query === true) ? true : this.isCached(query, language, reader);
            var loaded = false;

            //if result is cached, dont load anything
            if (!cached) {
                utils.timeStamp("Vizabi Data: Loading Data");

                if (evts && typeof evts.load_start === 'function') {
                    evts.load_start();
                }
                wait = new Promise();
                this.loadFromReader(query, language, reader).then(function(queryId) {
                    loaded = true;
                    cached = queryId;
                    wait.resolve();
                });
            }

            wait.then(
                function() {
                    //pass the data forward
                    var data = _this.get(cached);
                    //not loading anymore
                    if (loaded && evts && typeof evts.load_end === 'function') {
                        evts.load_end();
                    }
                    promise.resolve(data);
                },
                function() {
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
         * @param {Object} reader Which reader to use. E.g.: "local-json"
         * @param {String} path Where data is located
         */

        loadFromReader: function(query, lang, reader) {
            var _this = this;
            var promise = new Promise();
            var reader_name = reader.reader;
            var queryId = idQuery(query, lang, reader);
            var readerClass = Vizabi.Reader.get(reader_name);
            
            var r = new readerClass(reader);
            
            r.read(query, lang).then(function() {
                    //success reading
                    var values = r.getData();
                    var q = query;

                    var query_region = (q.select.indexOf("geo.region") !== -1);

                    //make sure all queried is returned
                    values = values.map(function(d) {
                        for (var i = 0; i < q.select.length; i++) {
                            var col = q.select[i];
                            if (typeof d[col] === 'undefined') {
                                d[col] = null;
                            }
                        }
                        return d;
                    });

                    values = values.map(function(d) {
                        if (d.geo === null) d.geo = d["geo.name"];
                        if (query_region && d["geo.region"] === null) {
                            d["geo.region"] = d.geo;
                        }
                        return d;
                    });
                    // convert time to Date()
                    values = values.map(function(d) {
                        d.time = new Date(d.time);
                        d.time.setHours(0);
                        return d;
                    });
                    // sort records by time
                    values.sort(function(a, b) {
                        return a.time - b.time;
                    });

                    _this._data[queryId] = values;
                    promise.resolve(queryId);
                },
                //error reading
                function(err) {
                    promise.reject(err);
                });

            return promise;
        },

        /**
         * Gets all items
         * @param queryId query identifier
         * @returns {Array} items
         */
        get: function(queryId) {
            if (queryId) {
                return this._data[queryId];
            }
            return this._data;
        },

        /**
         * Checks whether it's already cached
         * @returns {Boolean}
         */
        isCached: function(query, language, reader) {
            //encode in one string
            var q = idQuery(query, language, reader);
            //simply check if we have this in internal data
            if (Object.keys(this._data).indexOf(q) !== -1) {
                return q;
            }
            return false;
        },

        /**
         * Clears all data and querying
         */
        clear: function() {
            this._data = {};
        }
    });

    /**
     * Initializes the reader.
     * @param {Object} reader_info Information about the reader
     */
    var Reader = Vizabi.Class.extend({
        init: function(reader_info) {
            this._name = this._name || reader_info.reader;
            this._data = reader_info.data || [];
            this._basepath = this._basepath || reader_info.path || null;
        },

        /**
         * Reads from source
         * @param {Array} queries Queries to be performed
         * @param {String} language language
         * @returns a promise that will be resolved when data is read
         */
        read: function(queries, language) {
            return new Promise.resolve(this._data);
        },

        /**
         * Gets the data
         * @returns all data
         */
        getData: function() {
            return this._data;
        }

    });

    /**
     * Encodes query into a string
     */
    function idQuery(query, language, reader) {
        return JSON.stringify(query) + language + JSON.stringify(reader);
    }
    Vizabi.Reader = Reader;
    Vizabi.Data = Data;

}).call(this);