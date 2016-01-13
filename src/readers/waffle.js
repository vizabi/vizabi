import * as utils from 'base/utils';
import Promise from 'base/promise';
import Reader from 'base/reader';

var FILE_CACHED = {}; //caches files from this reader
var FILE_REQUESTED = {}; //caches files from this reader
// temporal hack for https problem

var WSReader = Reader.extend({

  /**
   * Initializes the reader.
   * @param {Object} reader_info Information about the reader
   */
  init: function (reader_info) {
    this._name = 'waffle';
    this._data = [];
    this._basepath = reader_info.path;
    this._formatters = reader_info.formatters;
    if (!this._basepath) {
      utils.error("Missing base path for graph reader");
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

    path += '?select=' + encodeURI(query.select);

    if (query.where['geo.cat'] && query.where['geo.cat'].length && query.where['geo.cat'][0] !== '*') {
      path += '&geo.cat=' + encodeURI(query.where['geo.cat']);
    }

    if (query.where.time) {
      var time = query.where.time[0];
      var t = typeof time.join !== 'undefined' && time.length === 2 ?
        // {from: time, to: time}
        JSON.stringify({from: getYear(time[0]), to: getYear(time[1])}) :
        getYear(time[0]);
      path += '&time=' + t;
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

        //format data
        resp = utils.mapRows(uzip(resp.data), _this._formatters);

        //cache and resolve
        FILE_CACHED[path] = resp;
        FILE_REQUESTED[path].resolve();
        FILE_REQUESTED[path] = void 0;

        parse(resp);
      }

      return p;

      function uzip(table) {
        var rows = table.data.rows;
        var headers = table.data.headers;
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

      function parse(res) {

        var data = res;
        //rename geo.category to geo.cat
        var where = query.where;
        if (where['geo.category']) {
          where['geo.cat'] = utils.clone(where['geo.category']);
          delete where['geo.category'];
        }

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

        // sorting
        // one column, one direction (ascending) for now
        if(query.orderBy && data[0]) {
          if (data[0][query.orderBy]) {
            data.sort(function(a, b) {
              return a[query.orderBy] - b[query.orderBy];
            });
          } else {
            p.reject("Cannot sort by " + query.orderBy + ". Column does not exist in result.");
          }
        }

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

export default WSReader;
