/*!
 * Local Drill reader
 */

(function () {

  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;
  var Promise = Vizabi.Promise;

  var FILE_CACHED = {}; //caches files from this reader
  var FILE_REQUESTED = {}; //caches files from this reader

  Vizabi.Reader.extend('drill-rest', {

    /**
     * Initializes the reader.
     * @param {Object} reader_info Information about the reader
     */
    init: function (reader_info) {
      this._name = 'drill-rest';
      this._data = [];
      this._dbpath = reader_info.dbpath; // e.g. "http://drill.host:8047/query.json"
      this._sql = reader_info.sql_query; // e.g. "select * from  vzb.dev.`/bigdata/parquet_basic_indicators`"
      this._formatters = reader_info.formatters;
	  
      if (!this._dbpath) {
        utils.error("Missing database path for drill-rest reader");
      }
      if (!this._sql) {
        utils.error("Missing sql query for drill-rest reader");
      }
      ;
    },

    /**
     * Reads from source
     * @param {Object} query to be performed
     * @param {String} language language
     * @returns a promise that will be resolved when data is read
     */
    read: function (query, language) {
      var _this = this;
      var p = new Promise();

      var path = this._dbpath + this._sql;
      _this._data = [];

      (function (query, p) {

        //if cached, retrieve and parse
        if (FILE_CACHED.hasOwnProperty(path)) {
          parse(FILE_CACHED[path]);
        }
        //if requested by another hook, wait for the response
        else if (FILE_REQUESTED.hasOwnProperty(path)) {
          FILE_REQUESTED[path].then(function () {
            parse(FILE_CACHED[path]);
          });
        }
        else {
         d3.json(_this._dbpath)
          .header("Content-Type", "application/json")
          .post(JSON.stringify({"queryType" : "SQL", "query": _this._sql}), function(error, data) {
            if (!data) {
              utils.error("Failed to execute " + " " + _this._sql + " on " + _this._dbpath, error);
              return;
            }

            if (error) {
              utils.error("Error while attempting to execute " + " " + _this._sql + " on " + _this._dbpath, error);
              return;
            }
			var res = data.rows;
            //fix JSON response
            res = format(res);

            //cache and resolve
            FILE_CACHED[path] = res;
            FILE_REQUESTED[path].resolve();
            delete FILE_REQUESTED[path];


            parse(res);
          });
          FILE_REQUESTED[path] = new Promise();
        }

        function format(res) {
          //TODO: Improve local json filtering
          //make category an array and fix missing regions
          res = res.map(function (row) {
            row['geo.cat'] = [row['geo.cat']];
            row['geo.region'] = (row['geo.region'] == "") ? row['geo'] : row['geo.region'];
            return row;
          });

          //format data
          res = utils.mapRows(res, _this._formatters);

          //TODO: fix this hack with appropriate ORDER BY
          //order by formatted
          //sort records by time
          var keys = Object.keys(_this._formatters);
          var order_by = keys[0];
          res.sort(function (a, b) {
            return a[order_by] - b[order_by];
          });
          //end of hack

          return res;
        }

        function parse(res) {
          var data = res;
          //rename geo.category to geo.cat
          var where = query.where;
          if (where['geo.category']) {
            where['geo.cat'] = utils.clone(where['geo.category']);
            delete where['geo.category'];
          }

          //format values in the dataset and filters
          where = utils.mapRows([where], _this._formatters)[0];

          data = utils.filterAny(data, where);
        
          //warn if filtering returns empty array
          if(data.length==0) utils.warn("data reader returns empty array, that's bad");

          //only selected items get returned
          data = data.map(function (row) {
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
    getData: function () {
      return this._data;
    }
  });

}).call(this);
