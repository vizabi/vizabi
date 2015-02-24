define([
    'jquery',
    'lodash',
    'base/class',
], function($, _, Class) {

    var LocalJSONReader = Class.extend({

        /**
         * Initializes the reader.
         * @param {Object} reader_info Information about the reader
         */
        init: function(reader_info) {
            this._name = 'waffle-reader';
            this._data = [];
            this._basepath = reader_info.path || "https://waffle.gapminder.org/api/v1/query";
        },

        /**
         * Reads from source
         * @param {Array} queries Queries to be performed
         * @param {String} language language
         * @returns a promise that will be resolved when data is read
         */
        read: function(queries, language) {
            var _this = this,
                defer = $.Deferred(),
                promises = [];

            this._data = [];

            queries = JSON.stringify(queries);

            var pars = {
                query: queries,
                lang: language
            };

            //load from waffle server
            var promise = $.getJSON(this._basepath, pars, function(res) {
                _this._data = res;
                defer.resolve();
            }).error(function() {
                console.log("Error loading from Waffle Server:", _this._basepath);
                defer.resolve();
            });

            return defer;
        },

        /**
         * Gets the data
         * @returns all data
         */
        getData: function() {
            return this._data;
        }
    });

    return LocalJSONReader;
});