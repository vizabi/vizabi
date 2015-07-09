/*
 * VIZABI Data Model (options.data)
 */

(function () {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) return;
    
    Vizabi.Model.extend('group', {

        /**
         * Initializes the group hook
         * @param {Object} values The initial values of this model
         * @param parent A reference to the parent model
         * @param {Object} bind Initial events to bind
         */
        init: function (values, parent, bind) {

            this._type = "model";
            values = utils.extend({
                use: "property",
                which: undefined
            }, values);
            this._super(values, parent, bind);
        },

        /**
         * Validates a color hook
         */
        validate: function () {
            //there must be no scale
            if (this.scale) this.scale = null;

            //use must be "property" 
            if (this.use != "property") {
                utils.warn("group model: use must not be 'property'. Resetting...")
                this.use = "property";
            }
        },

        /**
         * There must be no scale
         */
        buildScale: function () {}

    });

}).call(this);