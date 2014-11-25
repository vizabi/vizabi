define([
    'lodash',
    'models/hook'
], function(_, Hook) {

    var Color = Hook.extend({

        /**
         * Initializes the color hook
         * @param {Object} values The initial values of this model
         * @param parent A reference to the parent model
         * @param {Object} bind Initial events to bind
         */
        init: function(values, parent, bind) {

            values = _.extend({
                use: "value",
                value: undefined
            }, values);
            this._super(values, parent, bind);
        },

        validate: function() {
            //if use == value, it must be a valid color, etc 
            //if use == discrete, it must be a set of colors, etc 
        },

        getColor: function(filters) {
            var color;
            switch (this.use) {
                case "indicator":
                    color = this._getColorProperty(filters);
                    break;
                case "property":
                    color = this._getColorProperty(filters);
                    break;
                case "value":
                default:
                    color = this.value;
                    break;
            }
            return color;
        },

        _getColorProperty: function(filters) {
            var val = _.findWhere(this.getDataHook(), filters)[this.value];
            //TODO: add domain mapping
            return "#333333";
        }

    });

    return Color;
});