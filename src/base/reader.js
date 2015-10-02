import * as utils from './utils';
import Promise from './promise';
import Class from './class';

/**
 * Initializes the reader.
 * @param {Object} reader_info Information about the reader
 */
var Reader = Class.extend({
  init: function(reader_info) {
    this._name = this._name || reader_info.reader;
    this._data = reader_info.data || [];
    this._basepath = this._basepath || reader_info.path || null;
    this._formatters = reader_info.formatters;

    if(this._formatters) {
      this._data = utils.mapRows(this._data, this._formatters);
    }
  },

  /**
   * Reads from source
   * @param {Array} queries Queries to be performed
   * @param {String} language language
   * @returns a promise that will be resolved when data is read
   */
  read: function(queries, language) {
    return new Promise.resolve();
  },

  /**
   * Gets the data
   * @returns all data
   */
  getData: function() {
    return this._data;
  }
});

export default Reader;