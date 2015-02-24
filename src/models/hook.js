/*
 * Some models may extend Hook if they always want to be hooked to data
 */

define([
    'lodash',
    'base/model'
], function(_, Model) {

    var Hook = Model.extend({

        /**
         * Initializes the hook
         * @param {Object} values The initial values of this model
         * @param parent A reference to the parent model
         * @param {Object} bind Initial events to bind
         */
        init: function(values, parent, bind) {

            this._type = this._type || "hook"; //type of this model
            values = _.extend({
                use: "value",
                value: undefined
            }, values);
            
            this._super(values, parent, bind);
        }

    });

    return Hook;
});