/*!
 * Waffle server Reader
 * the simplest reader possible
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;
    var Promise = Vizabi.Promise;

    Vizabi.Reader.extend('waffle-server', {

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
         * @param {Array} query to be performed
         * @param {String} language language
         * @returns a promise that will be resolved when data is read
         */
        read: function(query, language) {
            var _this = this;
            var p = new Promise();
            var formatted;

            this._data = [];

            var where = query.where;
            //format time query if existing
            if (where['time']) {
                //[['1990', '2012']] -> '1990-2012'
                where['time'] = where['time'][0].join('-');
            }
            //rename geo.category to geo.cat
            if (where['geo.category']) {
                where['geo.cat'] = utils.clone(where['geo.category']);
                delete where['geo.category'];
            }


            formatted = {
                "SELECT": query.select,
                "WHERE": where,
                "FROM": "humnum"
            };

            var pars = {
                query: [formatted],
                lang: language
            };

            utils.post(this._basepath, pars, function(res) {
                _this._data = res;
                p.resolve();
            }, function() {
                console.log("Error loading from Waffle Server:", _this._basepath);
                p.reject('Could not read from waffle server');
            }, true);

            return p;
        },

        /**
         * Gets the data
         * @returns all data
         */
        getData: function() {
            return this._data;
        }
    });

}).call(this);