import Reader from "base/reader";

/**
 * Inline Reader
 * the simplest reader possible
 */

const InlineReader = Reader.extend({

  _name: "inline",

  init(readerInfo) {
    this._data = readerInfo.data || [{}];
  },

  load() {
    return Promise.resolve({
      columns: Object.keys(this._data[0]),
      rows: this._data
    });
  },

  versionInfo: { version: __VERSION, build: __BUILD }

});

export default InlineReader;
