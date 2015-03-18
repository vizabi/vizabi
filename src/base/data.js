define([
    'base/class',
    'q',
    'lodash'
], function(Class, Q, _) {

    var dataManager = Class.extend({

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
         * @param {Object} reader Which reader to use. E.g.: "local-json"
         * @param {String} path Where data is located
         */
        load: function(query, language, reader, evts) {

            var _this = this,
                defer = Q.defer(),
                promises = [],
                cached = this.isCached(query, language, reader),
                loaded = false,
                promise;

            //if result is cached, dont load anything
            if (cached) {
                promise = true;
            } else {

                console.timeStamp("Vizabi Data: Loading Data");

                if (evts && _.isFunction(evts["load_start"])) {
                    evts["load_start"]();
                }

                promise = this.loadFromReader(query, language, reader).then(function(queryId) {
                    loaded = true;
                    cached = queryId;
                });
            }
            promises.push(promise);

            Q.all(promises).then(
                // Great success! :D
                function() {
                    //pass the data forward
                    var data = _this.get(cached);

                    defer.resolve(data);

                    //not loading anymore
                    if (loaded && evts && _.isFunction(evts["load_end"])) {
                        evts["load_end"]();
                    }
                },
                // Unfortunate error
                function() {
                    defer.reject('Error loading file...');

                    //not loading anymore
                    if (loaded && evts && _.isFunction(evts["load_end"])) {
                        evts["load_end"]();
                    }
                });

            return defer.promise;
        },

        /**
         * Loads resource from reader
         * @param {Array} query Array with queries to be loaded
         * @param {String} lang Language
         * @param {Object} reader Which reader to use. E.g.: "local-json"
         * @param {String} path Where data is located
         */
        loadFromReader: function(query, lang, reader) {
            var _this = this,
                defer = Q.defer(),
                reader_name = reader.reader,
                queryId = this._idQuery(query, lang, reader);

            require(["readers/" + reader_name], function(Reader) {
                var r = new Reader(reader);
                r.read(query, lang).then(function() {
                    //success reading
                    
                    //TODO this is a temporary solution that does preprocessing of data
                    var values = _.flatten(r.getData()),
                        q = query[0];

                    var query_region = (q.select.indexOf("geo.region") !== -1);

                    //make sure all queried is returned
                    values = _.map(values, function(d) {
                        for(var i=0; i<q.select.length; i++) {
                            var col = q.select[i];
                            if(_.isUndefined(d[col])) {
                                d[col] = null;
                            }
                        }
                        return d;
                    });

                    values = _.map(values, function(d) {
                        if (d["geo"] == null) d["geo"] = d["geo.name"];

                        if (query_region && d["geo.region"] == null) {
                            d["geo.region"] = d["geo"];
                        }

                        return d;
                    });
                    // convert time to Date()
                    values = _.map(values, function(d) {
                        d.time = new Date(d.time);
                        d.time.setHours(0);
                        return d;
                    })
                    // sort records by time
                    values.sort(function(a, b) {
                        return a.time - b.time
                    });

                    _this._data[queryId] = values;
                    defer.resolve(queryId);
                },
                //error reading
                function(err) {
                    defer.reject(err);
                });
            });
            return defer.promise;
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
            var query = this._idQuery(query, language, reader);
            //simply check if we have this in internal data
            if (_.keys(this._data).indexOf(query) !== -1) {
                return query;
            }
            return false;
        },

        /**
         * Encodes query into a string
         */
        _idQuery: function(query, language, reader) {
            return JSON.stringify(query) + language + JSON.stringify(reader);
        },

        /**
         * Clears all data and querying
         */
        clear: function() {
            this._data = {};
        }
    });

    return dataManager;
});