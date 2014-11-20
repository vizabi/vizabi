define([
    'lodash',
    'models/hook'
], function(_, Hook) {

    var Color = Hook.extend({

        /**
         * Initializes the color hook
         * @param {Object} values The initial values of this model
         * @param intervals A parent intervals handler (from tool)
         * @param {Object} bind Initial events to bind
         */
        init: function(values, intervals, bind) {

            values = _.extend({
                use: "value",
                value: undefined
            }, values);
            this._super(values, intervals, bind);
        },

        validate: function() {
            //if use == value, it must be a valid color, etc 
            //if use == discrete, it must be a set of colors, etc 
        }

    });

    return Color;
});