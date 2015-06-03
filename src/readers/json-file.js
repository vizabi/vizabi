/*!
 * Local JSON reader
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;
    var Promise = Vizabi.Promise;

    var FILE_CACHED = {}; //caches files from this reader
    var FILE_REQUESTED = {}; //caches files from this reader

    Vizabi.Reader.extend('json-file', {

        /**
         * Initializes the reader.
         * @param {Object} reader_info Information about the reader
         */
        init: function(reader_info) {
            this._name = 'json-file';
            this._data = [];
            this._basepath = reader_info.path;
            if (!this._basepath) {
                utils.error("Missing base path for json-file reader");
            };
        },

        /**
         * Reads from source
         * @param {Object} query to be performed
         * @param {String} language language
         * @returns a promise that will be resolved when data is read
         */
        read: function(query, language) {
            var _this = this;
            var p = new Promise();

            //this specific reader has support for the tag {{LANGUAGE}}
            var path = this._basepath.replace("{{LANGUAGE}}", language);
            _this._data = [];

            (function(query, p) {

                //if cached, retrieve and parse
                if (FILE_CACHED.hasOwnProperty(path)) {
                    parse(FILE_CACHED[path]);
                }
                //if requested by another hook, wait for the response
                else if (FILE_REQUESTED.hasOwnProperty(path)) {
                    FILE_REQUESTED[path].then(function() {
                        parse(FILE_CACHED[path]);
                    });
                }
                //if not, request and parse
                else {
                    d3.json(path, function(error, res) {
                        //cache and resolve
                        FILE_CACHED[path] = res;
                        FILE_REQUESTED[path].resolve();
                        delete FILE_REQUESTED[path];

                        if (error) {
                            utils.error("Error Happened While Loading File: " + path, error);
                            return;
                        }
                        parse(res);
                    });
                    FILE_REQUESTED[path] = new Promise();
                }

                function parse(res) {
                    //TODO: Improve local json filtering
                    var data = res[0];
                    //rename geo.category to geo.cat
                    var where = query.where;
                    if (where['geo.category']) {
                        where['geo.cat'] = utils.clone(where['geo.category']);
                        delete where['geo.category'];
                    }

                    for (var filter in where) {
                        var wanted = where[filter];

                        if (wanted[0] === "*") {
                            continue;
                        }

                        //if not time, normal filtering
                        if (filter !== "time") {
                            data = data.filter(function(row) {
                                var val = row[filter];
                                var found = -1;

                                //normalize
                                if (!utils.isArray(val)) val = [val];

                                //find first occurence
                                utils.forEach(val, function(j, i) {
                                    if (wanted.indexOf(j) !== -1) {
                                        found = i;
                                        return false;
                                    }
                                });
                                //if found, include
                                return found !== -1;
                            });
                        }
                        //in case it's time, special filtering
                        else {
                            var timeRange = wanted[0];
                            var min = timeRange[0];
                            var max = timeRange[1] || min;

                            data = data.filter(function(row) {
                                var val = row[filter]
                                return val >= min && val <= max;
                            });
                        }

                    }

                    //only selected items get returned
                    data = data.map(function(row) {
                        return utils.clone(row, query.select);
                    });

                    _this._data = data;

                    p.resolve();
                }

            })(query, p);

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