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
    this._parsers = reader_info.parsers;
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

    path += '?' + _this._encodeQuery(query);

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
        resp = utils.mapRows(uzip(resp.data || resp), _this._parsers);

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

      function parse(res) {

        var data = res;

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
   * Encode query parameters into readable string
   * @param {Object} query to be performed
   * @returns encoded query params
   * `select=geo,time,population&geo=afr,chn&time=1800,1950:2000,2015&geo.cat=country,region`
   */
  _encodeQuery: function (params) {
    var _params = utils.deepExtend({}, params.where);
    _params.select = params.select;
    _params.gapfilling = params.gapfilling;

    // todo: WS doesn't support value `*` for geo parameter
    // remove this condition when geo will be removed from params.where (when you need all geo props)
    if (_params.geo && _params.geo.length === 1 && _params.geo[0] === '*') {
      delete _params.geo;
    }

    // todo: formatting date according to precision (year, month, etc)
    if (_params.time) {
      _params.time[0] = _params.time[0].map(function (year) {
        return typeof year === 'object' ? year.getUTCFullYear() : year;
      });
    }

    var result = [];

    // create `key=value` pairs for url query string
    Object.keys(_params).map(function (key) {
      var value = QueryEncoder.encodeQuery(_params[key]);
      if (value) {
        result.push(key + '=' + value);
      }
    });

    return result.join('&');
  },

  /**
   * Gets the data
   * @returns all data
   */
  getData: function () {
    return this._data;
  }
});

var QueryEncoder = (function() {
  return {
    encodeQuery: encodeQuery
  };

  function encodeQuery(param) {
    return mapParams()(param);
  }

  function mapParams(depth) {
    if (!depth) {
      return _map;
    }

    return _mapRange;
  }

  function _map(v, i) {
    // if falsy value
    if (!v) {
      return v;
    }

    // if value is string or number
    if (v.toString() === v || _isNumber(v)) {
      return v;
    }

    // if value is array
    if (Array.isArray(v)) {
      return v.map(mapParams(1)).join();
    }

    if (typeof v === 'object') {
      return _toArray(v).map(mapParams(1)).join();
    }

    return v;
  }

  function _mapRange(v) {
    return encodeURI(v).replace(/,/g, ':')
  }

  function _isNumber(value) {
    return parseInt(value, 10) == value;
  }

  function _toArray(object) {
    return Object.keys(object).map(function(key) {
      if (object[key] === true) {
        return [key];
      }

      return [key, object[key]];
    })
  }
})();

export default WSReader;
