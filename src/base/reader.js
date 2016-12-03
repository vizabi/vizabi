import * as utils from 'base/utils';
import Class from 'base/class';

/**
 * Initializes the reader.
 * @param {Object} reader_info Information about the reader
 */
var Reader = Class.extend({
  init: function(reader_info) {
    this._name = this._name || reader_info.reader;
    this._data = reader_info.data || [];
    this._basepath = this._basepath || reader_info.path || null;

  },

  /**
   * Reads from source
   * @param {Array} queries Queries to be performed
   * @param {Object} parsers object
   * @returns a promise that will be resolved when data is read
   */
  read: function(query, parsers) {
    if(this._parsers) {
      this._data = utils.mapRows(this._data, this._parsers);
    }
    return Promise.resolve(this._data);
  }
});

export default Reader;
