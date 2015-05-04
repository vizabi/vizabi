//FIX ME: Use req instead of jquery

define([
    //'jquery',
    'lodash',
    'base/class'
], function(/* $, */ _, Class) {

    var LocalJSONReader = Class.extend({

        /**
         * Initializes the reader.
         * @param {Object} reader_info Information about the reader
         */
        init: function(reader_info) {
            this._name = 'local-json';
            this._data = [];
            this._basepath = reader_info.path;
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

            //this specific reader has support for the tag {{LANGUAGE}}
            var path = this._basepath.replace("{{LANGUAGE}}", language);
            _this._data = [];

            //Loops through each query
            for (var i = 0; i < queries.length; i++) {

                this._data[i] = {};

                (function(order) {
                    var query = queries[i];
                    var promise = $.getJSON(path, function(res) {

                            //TODO: Improve local json filtering
                            var data = res[0];

                            for (var filter in query.where) {
                                var wanted = query.where[filter];

                                if (wanted[0] === "*") {
                                    continue;
                                }

                                //if not time, normal filtering
                                if (filter !== "time") {
                                    data = _.filter(data, function(row) {
                                        var val = row[filter],
                                            found = -1;
                                        //normalize
                                        if (!_.isArray(val)) {
                                            val = [val];
                                        }
                                        //find first occurence
                                        var found = _.findIndex(val, function(j) {
                                            return wanted.indexOf(j) !== -1;
                                        });

                                        //if found, include
                                        return found !== -1;
                                    });
                                }
                                //in case it's time, special filtering
                                else {
                                    var timeRange = wanted[0],
                                        min = timeRange[0],
                                        max = timeRange[1] || min;

                                    data = _.filter(data, function(row) {
                                        var val = row[filter]
                                        return val >= min && val <= max;
                                    });
                                }
                            }

                            //only selected items get returned
                            data = _.map(data, function(row) {
                                return _.pick(row, query.select);
                            })

                            _this._data[order] = data;
                        })
                        .error(function() {
                            console.log("Error Happened While Loading File: " + path);
                        });
                    promises.push(promise);
                })(i);
            }

            $.when.apply(null, promises).done(function() {
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