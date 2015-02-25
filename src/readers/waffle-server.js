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

            //TODO: eliminate formatting if possible
            //format queries
            var formatted = [];
            for (var i = queries.length - 1; i >= 0; i--) {
                var where = queries[i].where;

                //format time query if existing
                if(where['time']) {
                    //[['1990', '2012']] -> '1990-2012'
                    where['time'] = where['time'][0].join('-');
                }
                //rename geo.category to geo.cat
                if(where['geo.category']) {
                    where['geo.cat'] = _.clone(where['geo.category']);
                    delete where['geo.category'];
                }


                formatted[i] = {
                    "SELECT": queries[i].select,
                    "WHERE": where,
                    "FROM": "humnum"
                };
            };

            var pars = {
                query: formatted,
                lang: language
            };

            //load from waffle server
            var promise = $.post(this._basepath, pars, function(res) {
                _this._data = res;
                defer.resolve();
            }).error(function(e) {
                console.log("Error loading from Waffle Server:", _this._basepath);
                defer.resolve('error');
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