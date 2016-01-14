import * as utils from 'base/utils';
import Promise from 'base/promise';
import Reader from 'base/reader';


var FILE_CACHED = {};
var FILE_REQUESTED = {};
var DATA_CACHED = {};
var CACHE = {
  measureFileToName: {},
  measureNameToFile: {}
};

var GEO = 1;
var MEASURES_TIME_PERIOD = 2;
var MEASURES_TIME_FIXED = 3;

var DDFCSVReader = Reader.extend({

  /**
   * Initializes the reader.
   * @param {Object} reader_info Information about the reader
   */
  init: function (reader_info) {
    this._name = 'ddf-csv';
    this._data = [];
    this._basepath = reader_info.path;
    this._formatters = reader_info.formatters;
    this.indexPath = this._basepath + '/ddf--index.csv';
    this.dimensionPath = this._basepath + '/ddf--dimensions.csv';
    this._formatters = reader_info.formatters;
  },

  /**
   * Reads from source
   * @param {Object} query to be performed
   * @param {String} language language
   * @returns a promise that will be resolved when data is read
   */
  read: function (queryPar, language) {
    // todo: add groupby processing

    var _this = this;
    var query = utils.deepExtend({}, queryPar);

    _this.queryDescriptor = new QueryDescriptor(queryPar);

    if (_this.queryDescriptor.type === GEO) {
      return new Promise(function (resolve) {
        _this.geoProcessing(1, function () {
          _this._data = _this.getGeoData(_this.queryDescriptor);
          console.log('!GEO DATA', _this._data);
          resolve();
        });
      });
    }

    if (_this.queryDescriptor.type === MEASURES_TIME_PERIOD ||
      _this.queryDescriptor.type === MEASURES_TIME_FIXED) {

      return new Promise(function (resolve) {
        _this.getIndex().then(function () {
          Promise
            .all(_this.getExpectedMeasures(query))
            .then(function () {
              var result = [];
              var geo = DATA_CACHED['geo-' + _this.queryDescriptor.category];

              var d1 = (new Date(_this.queryDescriptor.timeFrom)).getFullYear();
              var d2 = (new Date(_this.queryDescriptor.timeTo)).getFullYear();

              for (var year = d1; year <= d2; year++) {

                for (var geoIndex = 0; geoIndex < geo.length; geoIndex++) {
                  var line = {
                    'geo': geo[geoIndex].geo,
                    'time': year + ''
                  };

                  if (_this.injectMeasureValues(query, line, geoIndex, year) === true) {
                    result.push(line);
                  }
                }
              }

              _this._data = utils.mapRows(result, _this._formatters);

              console.log('!QUERY', JSON.stringify(query));
              console.log('!OUT DATA', _this._data);
              console.log('!METADATA', Vizabi._globals.metadata);

              resolve();
            });
        });
      });
    }
  },

  /**
   * Gets the data
   * @returns all data
   */
  getData: function () {
    return this._data;
  },

  geoProcessing: function (n, cb) {
    var _this = this;
    _this.getDimensions().then(function () {
      Promise
        .all(_this.getDimensionsDetails())
        .then(function () {
          cb();
        });
    });
  },

  injectMeasureValues: function (query, line, geoIndex, year) {
    var f = 0;
    var measures = this.getMeasuresNames(query);
    var geo = DATA_CACHED['geo-' + this.queryDescriptor.category];

    utils.forEach(measures, function (m) {
      var measureCache = FILE_CACHED[CACHE.measureFileToName[m]];

      if (measureCache && measureCache[geo[geoIndex].geo]) {
        if (measureCache[geo[geoIndex].geo] && measureCache[geo[geoIndex].geo][year + ''] &&
          measureCache[geo[geoIndex].geo][year + ''][m]) {
          line[m] = Number(measureCache[geo[geoIndex].geo][year + ''][m]);
          f++;
        }
      }
    });

    return f === measures.length;
  },

  getIndex: function () {
    return this.load(this.indexPath);
  },

  getDimensions: function () {
    return this.load(this.dimensionPath);
  },

  getGeoData: function (queryDescriptor) {
    var adapters = {
      country: function (geoRecord) {
        return {
          geo: geoRecord.geo,
          'geo.name': geoRecord.name,
          'geo.cat': queryDescriptor.category,
          'geo.region': geoRecord.world_4region
        }
      }
    };

    var expectedGeoData = null;
    for (var k in FILE_CACHED) {
      if (FILE_CACHED.hasOwnProperty(k) &&
        k.indexOf('ddf--list--geo--' + queryDescriptor.category) >= 0) {
        expectedGeoData = FILE_CACHED[k];
        break;
      }
    }

    var result = [];
    if (expectedGeoData !== null) {
      utils.forEach(expectedGeoData, function (d) {
        result.push(adapters[queryDescriptor.category](d));
      });
    }

    DATA_CACHED['geo-' + queryDescriptor.category] = result;
    return result;
  },

  getMeasuresNames: function (query) {
    var res = [];
    utils.forEach(query.select, function (q) {
      if (q !== 'time' && q !== 'geo') {
        res.push(q);
      }
    });

    return res;
  },

  getExpectedMeasures: function (query) {
    var _this = this;
    var expected = [];

    utils.forEach(FILE_CACHED[_this.indexPath], function (indexRecord) {
      // todo: fix condition -> geo
      if (query.select.indexOf(indexRecord.measure) >= 0 &&
        (!query.where['geo.cat'] || query.where['geo.cat'].indexOf(indexRecord.geo) >= 0)) {
        var path = _this._basepath + '/' + indexRecord.file;
        // todo: swap...
        CACHE.measureFileToName[indexRecord.measure] = path;
        CACHE.measureNameToFile[path] = indexRecord.measure;
        expected.push(_this.load(path));
      }
    });

    return expected;
  },

  getDimensionsDetails: function () {
    var _this = this;
    var expected = [];

    utils.forEach(FILE_CACHED[_this.dimensionPath], function (dimensionRecord) {
      // todo: remove this ugly hack after open numbers fixing
      if (dimensionRecord.dimension !== 'geo' && dimensionRecord.dimension !== 'un_state') {
        expected.push(_this.load(_this._basepath + '/ddf--list--geo--' + dimensionRecord.dimension + '.csv'));
      }
    });

    return expected;
  },

  // todo: remove it after 'fetcher' implementation
  _measureHashTransformer: function (measure, data) {
    if (!measure) {
      return data;
    }

    var hash = {};
    utils.forEach(data, function (d) {
      if (!hash[d.geo]) {
        hash[d.geo] = {};
      }

      if (!hash[d.geo][d.year]) {
        hash[d.geo][d.year] = {};
      }

      hash[d.geo][d.year][measure] = d[measure];
    });

    return hash;
  },

  load: function (path) {
    var _this = this;
    if (!FILE_CACHED.hasOwnProperty(path) && !FILE_REQUESTED.hasOwnProperty(path)) {
      /*d3.csv(path, function (error, res) {
       if (!res) {
       console.log('No permissions or empty file: ' + path, error);
       return;
       }

       if (error) {
       console.log('Error Happened While Loading CSV File: ' + path, error);
       return;
       }

       FILE_CACHED[path] = _this._measureHashTransformer(CACHE.measureNameToFile[path], res);
       FILE_REQUESTED[path].resolve();
       });*/

      ///
      _this.readCsv(path, function (error, res) {
        if (!res) {
          console.log('No permissions or empty file: ' + path, error);
        }

        if (error) {
          console.log('Error Happened While Loading CSV File: ' + path, error);
        }

        FILE_CACHED[path] = _this._measureHashTransformer(CACHE.measureNameToFile[path], res);
        FILE_REQUESTED[path].resolve();
      });
      ///
    }

    FILE_REQUESTED[path] = new Promise();

    return FILE_REQUESTED[path];
  },
  readCsv: function (path, cb) {
    var _this = this;
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'text';
    xhr.open('GET', path, true);
    var res = [];

    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
        res = parseCSVToObject(xhr.response);
        FILE_CACHED[path] = _this._measureHashTransformer(CACHE.measureNameToFile[path], res);

        cb(xhr.status == 200 ? null : xhr.status, res);
      } else if (xhr.readyState == XMLHttpRequest.DONE) {
        console.log('can\'t load file');

        cb(xhr.status == 200 ? null : xhr.status, res);
      }
    };

    xhr.send();
  }
});

function parseCSVToObject(csv) {
  var chars = csv.split('');
  var c = 0;
  var cc = chars.length;
  var start, end;
  var table = [];
  var row;

  while (c < cc) {
    row = [];
    table.push(row);

    while (c < cc && '\r' !== chars[c] && '\n' !== chars[c]) {
      start = end = c;

      if ('"' === chars[c]) {
        start = end = ++c;

        while (c < cc) {
          if ('"' === chars[c]) {
            if ('"' !== chars[c + 1]) {
              break;
            } else {
              chars[++c] = '';
            }
          }

          end = ++c;
        }

        if ('"' === chars[c]) {
          ++c;
        }

        while (c < cc && '\r' !== chars[c] && '\n' !== chars[c] && ',' !== chars[c]) {
          ++c;
        }
      } else {
        while (c < cc && '\r' !== chars[c] && '\n' !== chars[c] && ',' !== chars[c]) {
          end = ++c;
        }
      }

      row.push(chars.slice(start, end).join(''));

      if (',' === chars[c]) {
        ++c;
      }
    }

    if ('\r' === chars[c]) {
      ++c;
    }

    if ('\n' === chars[c]) {
      ++c;
    }
  }

  var header = table[0];

  var result = [];
  for (var i = 1; i < table.length; i++) {
    var row = {};
    for (var j = 0; j < header.length; j++) {
      row[header[j]] = table[i][j];
    }
    result.push(row);
  }

  return result;
}

function QueryDescriptor(query) {
  var _this = this;
  _this.query = query;
  _this.geoCat = query.where['geo.cat'];
  var result;

  if (query.select.indexOf('geo.name') >= 0 || query.select.indexOf('geo.region') >= 0) {
    _this.type = GEO;
    _this.category = _this.geoCat[0];
  }

  if (!result && query.where && query.where.time) {
    if (query.where.time.length > 0 && query.where.time[0].length === 1) {
      _this.type = MEASURES_TIME_FIXED;
      _this.category = _this.geoCat[0];
      _this.timeFrom = Number(query.where.time[0][0]);
      _this.timeTo = Number(query.where.time[0][0]);
    }

    if (query.where.time.length > 0 && query.where.time[0].length === 2) {
      _this.type = MEASURES_TIME_PERIOD;
      _this.category = _this.geoCat[0];
      _this.timeFrom = Number(query.where.time[0][0]);
      _this.timeTo = Number(query.where.time[0][1]);
    }
  }
}

export default DDFCSVReader;