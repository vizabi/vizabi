import Reader from './reader';

/*!
 * Inline Reader
 * the simplest reader possible
 */

var InlineReader = Reader.extend('inline', {
    init: function (reader_info) {
      this.name = "inline";
      this._super(reader_info);
    }
  });

export default InlineReader;
