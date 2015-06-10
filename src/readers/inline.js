/*!
 * Inline Reader
 * the simplest reader possible
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;

    Vizabi.Reader.extend('inline', {
        init: function(reader_info) {
            this.name = "inline";
            this._super(reader_info);
        }
    });

}).call(this);