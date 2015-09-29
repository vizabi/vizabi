Vizabi._globals.gapminder_paths.baseUrl = "http://static.gapminderdev.org/vizabi/master/preview/";

//main app module

angular.module('gapminderTools', ['ngRoute']).config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {

  $routeProvider
    .when('/:slug', {
      controller: 'gapminderToolsCtrl'
    })
    .otherwise({
      redirectTo: '/bubbles'
    });

  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false
  });
}]);

//TODO: remove global

function forceResizeEvt() {
  //force resize
  event = document.createEvent("HTMLEvents");
  event.initEvent("resize", true, true);
  event.eventName = "resize";
  window.dispatchEvent(event);
}

(function () {

  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;
  var Promise = Vizabi.Promise;

  var FILE_CACHED = {}; //caches files from this reader
  var FILE_REQUESTED = {}; //caches files from this reader

  Vizabi.Reader.extend('ws-json', {

    /**
     * Initializes the reader.
     * @param {Object} reader_info Information about the reader
     */
    init: function (reader_info) {
      this._name = 'ws-json';
      this._json = reader_info.data;
      this._data = [];
      this._basepath = reader_info.path;
      this._formatters = reader_info.formatters;
      if (!this._basepath) {
        utils.error("Missing base path for ws-json reader");
      }
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
      var path = this._basepath;
      //format time query if existing
      if (query.where.time) {
        var time = query.where.time[0];
        console.log(time, typeof time.join, time.length)
        //[['1990', '2012']] -> '1990-2012'
        var t = typeof time.join !== 'undefined' && time.length === 2 ?
          JSON.stringify({from: getYear(time[0]), to: getYear(time[1])}) :
          getYear(time[0]);
        console.log(t);
        path += '?time=' + t;
      }

      function getYear(time) {
        if (typeof time === 'string') {
          return time;
        }

        return time.getFullYear();
      }

      _this._data = [];

      (function (query, p) {
        //if cached, retrieve and parse
        if (FILE_CACHED.hasOwnProperty(path)) {
          parse(FILE_CACHED[path]);
          return p;
        }
        //if requested by another hook, wait for the response
        if (FILE_REQUESTED.hasOwnProperty(path)) {
          FILE_REQUESTED[path].then(function () {
            parse(FILE_CACHED[path]);
          });
          return p;
        }
        //if not, request and parse
        FILE_REQUESTED[path] = new Promise();
        utils.get(path, [], onSuccess, console.error.bind(console), true);
        function onSuccess(resp) {
          if (!resp) {
            utils.error("Empty json: " + path, error);
            return;
          }

          resp = format(uzip(resp.data));
          //cache and resolve
          FILE_CACHED[path] = resp;
          FILE_REQUESTED[path].resolve();
          FILE_REQUESTED[path] = void 0;

          parse(resp);
        }

        return p;

        function uzip(table) {
          var rows = table.rows;
          var headers = table.headers;
          var result = new Array(rows.length);
          // unwrap compact data into json collection
          for (var i = 0; i < rows.length; i++) {
            result[i] = {};
            for (var j = 0; j < headers.length; j++) {
              result[i][headers[j]] = (rows[i][j] || '').toString();
              if (headers[j] === 'geo.cat') {
                result[i][headers[j]] = [result[i][headers[j]]];
              }
            }
          }
          return result;
        }

        function format(res) {
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

          //make sure conditions don't contain invalid conditions
          var validConditions = [];
          utils.forEach(where, function (v, p) {
            for (var i = 0, s = data.length; i < s; i++) {
              if (data[i].hasOwnProperty(p)) {
                validConditions.push(p);
                return true;
              }
            }
          });
          //only use valid conditions
          where = utils.clone(where, validConditions);

          //filter any rows that match where condition
          data = utils.filterAny(data, where);

          //warn if filtering returns empty array
          if (data.length === 0) utils.warn("data reader returns empty array, that's bad");

          //only selected items get returned
          data = data.map(function (row) {
            return utils.clone(row, query.select);
          });
          //console.log(data);
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
