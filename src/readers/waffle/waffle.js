import * as utils from 'base/utils';
import Promise from 'base/promise';
import Reader from 'base/reader';

var FILE_CACHED = {}; //caches files from this reader
var FILE_REQUESTED = {}; //caches files from this reader
// temporal hack for https problem

var WSReader = Reader.extend({

  ERROR_NETWORK     : 'Connection Problem',
  ERROR_RESPONSE    : 'Bad Response',
  ERROR_ORDERING    : 'Cannot sort response. Column does not exist in result.',
  ERROR_PARAM_PATH  : 'Missing base path for waffle reader',

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
      utils.error(this.ERROR_PARAM_PATH);
    }
  },

  /**
   * Reads from source
   * @param {Object} query to be performed
   * @param {String} language language
   * @returns a promise that will be resolved when data is read
   */
  read: function (query, language) {

    var p = new Promise();
    var path = this._basepath;

    path += '?' + this._encodeQuery(query);

    this._data = [];

    //if cached, retrieve and parse
    if (FILE_CACHED.hasOwnProperty(path)) {
      this._parse(p, query, FILE_CACHED[path]);
      return p;
    }
    //if requested by another hook, wait for the response
    if (FILE_REQUESTED.hasOwnProperty(path)) {
      return FILE_REQUESTED[path];
    }
    //if not, request and parse
    FILE_REQUESTED[path] = p;

    utils.get(
      path,
      [],
      this._readCallbackSuccess.bind(this, p, path, query),
      this._readCallbackError.bind(this, p, path, query),
      true
    );

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
  },

  _readCallbackSuccess: function (p, path, query, resp) {

    if (!resp) {
      utils.error("Empty json: " + path);
      p.reject({
        'message' : this.ERROR_RESPONSE,
        'data': path
      });
      return;
    }

    //format data
    resp = utils.mapRows(this._uzip(resp.data || resp), this._parsers);

    //cache and resolve
    FILE_CACHED[path] = resp;

    this._parse(p, query, resp);
    FILE_REQUESTED[path] = void 0;
  },

  _readCallbackError: function (p, path, query, resp) {
    p.reject({
      'message' : this.ERROR_NETWORK,
      'data': path
    });
  },

  _uzip: function (table) {
    var header;
    var rows = table.rows;
    var headers = table.headers;
    var result = new Array(rows.length);
    // unwrap compact data into json collection
    for (var i = 0; i < rows.length; i++) {
      result[i] = {};
      for (var headerIndex = 0; headerIndex < headers.length; headerIndex++) {
        header = headers[headerIndex];
        result[i][header] = '';
        if (!(typeof rows[i][headerIndex] == 'undefined' || rows[i][headerIndex] === null)) {
          result[i][header] = rows[i][headerIndex].toString();
        }
        if (header === 'geo.cat') {
          result[i][header] = [result[i][header]];
        }
      }
    }
    return result;
  },

  _parse: function (p, query, resp) {

    var data = resp;

    // sorting
    // one column, one direction (ascending) for now
    if(query.orderBy && data[0]) {
      if (data[0][query.orderBy]) {
        data.sort(function(a, b) {
          return a[query.orderBy] - b[query.orderBy];
        });
      } else {
        return p.reject({
          'message' : this.ERROR_ORDERING,
          'data': query.orderBy
        });
      }
    }

    this._data = data;
    p.resolve();
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
