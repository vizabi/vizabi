define([
    'base/class',
    'jquery',
    'lodash'
], function(Class, $, _) {

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
         * @param {String} reader Which reader to use. E.g.: "local-json"
         * @param {String} path Where data is located
         */
        load: function(query, language, reader, path) {

            var _this = this,
                defer = $.Deferred(),
                promises = [],
                cached = this.isCached(query, language, reader, path),
                promise;

            //if result is cached, dont load anything
            if (cached) {
                promise = true;
            } else {
                promise = this.loadFromReader(query, language, reader, path).then(function(queryId) {
                    cached = queryId;
                });
            }
            promises.push(promise);
            $.when.apply(null, promises).then(
                // Great success! :D
                function() {
                    defer.resolve(_this.get(cached));
                },
                // Unfortunate error
                function() {
                    defer.resolve('error');
                });

            return defer;
        },

        /**
         * Loads resource from reader
         * @param {Array} query Array with queries to be loaded
         * @param {String} lang Language
         * @param {String} reader Which reader to use. E.g.: "local-json"
         * @param {String} path Where data is located
         */
        loadFromReader: function(query, lang, reader, path) {
            var _this = this,
                defer = $.Deferred();
            require(["readers/" + reader], function(Reader) {
                var reader = new Reader(path);
                reader.read(query, lang).then(function() {
                    var queryId = _this._idQuery(query, lang, reader, path);
                    _this._data[queryId] = reader.getData();
                    defer.resolve(queryId);
                });
            });
            return defer;
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
        isCached: function(query, language, reader, path) {
            //encode in one string
            var query = this._idQuery(query, language, reader, path);
            //simply check if we have this in internal data
            if(_.keys(this._data).indexOf(query) !== -1) {
                return query;
            }
            return false;
        },

        /**
         * Encodes query into a string
         */
        _idQuery: function(query, language, reader, path) {
            return JSON.stringify(query) + language + reader + path;
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