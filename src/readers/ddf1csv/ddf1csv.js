import * as utils from 'base/utils';
import Promise from 'base/promise';
import Reader from 'base/reader';
import Ddf from 'readers/ddf1csv/ddf';

var DDF1CSVReader = Reader.extend({

  /**
   * Initializes the reader.
   * @param {Object} reader_info Information about the reader
   */
  init: function (reader_info) {
    this._name = 'ddf1-csv';
    this._data = [];
    this._ddfPath = reader_info.path;
    this.ddf = new Ddf(this._ddfPath);
  },

  /**
   * Reads from source
   * @param {Object} query to be performed
   * @param {String} language language
   * @returns a promise that will be resolved when data is read
   */
  read: function (queryPar, language) {
    var _this = this;
    var query = utils.deepExtend({}, queryPar);
    var p = new Promise();

    if(!_this.ddf.filesList.length) {
      p.reject();
      return p;
    }

    _this.ddf.getIndex(function () {
      // get `concepts` and `entries` in any case
      // this data needed for query's kind (service, data point) detection
      _this.ddf.getConceptsAndEntities(query, function (result) {
        // service query: it was detected by next criteria:
        // all of `select` section of query parts are NOT measures
        if (_this.ddf.divideByQuery(query).measures.length <= 0) {
          _this._data = _this.ddf.getAllEntities();
          p.resolve();
        }

        // data point query: it was detected by next criteria:
        // at least one measure was detected in `select` section of the query
        if (_this.ddf.divideByQuery(query).measures.length > 0) {
          _this.ddf.getDataPoints(query, function (data) {
            _this._data = data;
            p.resolve();
          });
        }
      });
    });
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

export default DDF1CSVReader;
