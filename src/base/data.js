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
            this._data = [];
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
                isCached = this.isCached(query, language, reader, path),
                promise;

            //if result is cached, dont load anything
            if (isCached) {
                promise = true;
            } else {
                promise = this.loadFromReader(query, language, reader, path);
            }
            promises.push(promise);
            $.when.apply(null, promises).then(
                // Great success! :D
                function() {
                    defer.resolve(_this.get());
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
         * @param {String} language Language
         * @param {String} reader Which reader to use. E.g.: "local-json"
         * @param {String} path Where data is located
         */
        loadFromReader: function(query, language, reader, path) {
            var _this = this,
                defer = $.Deferred();
            require(["readers/" + reader], function(Reader) {
                var reader = new Reader(path);
                reader.read(query, language).then(function() {
                    _this._data = reader.getData();
                    defer.resolve();
                });
            });
            return defer;
        },

        /**
         * Gets all items
         * @returns {Array} items
         */
        get: function() {
            return this._data;
        },

        /**
         * Checks whether it's already cached
         * @returns {Boolean}
         */
        isCached: function(query, language, reader, path) {
            //encode in one string
            var query = JSON.stringify(query) + language + reader + path;
            //compare to previous string
            if (this._prevQuery === query) {
                return true;
            } else {
                this._prevQuery = query;
                return false;
            }
        },

        /**
         * Clears all data and querying
         */
        clear: function() {
            this._prevQuery = undefined;
            this._data = [];
        }
    });

    return dataManager;
});
