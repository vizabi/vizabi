define([
    'd3',
    'lodash',
    'models/hook'
], function(d3, _, Hook) {

    var Color = Hook.extend({

        /**
         * Initializes the color hook
         * @param {Object} values The initial values of this model
         * @param parent A reference to the parent model
         * @param {Object} bind Initial events to bind
         */
        init: function(values, parent, bind) {

            this._type = "color";

            values = _.extend({
                use: "value",
                value: undefined
            }, values);
            this._super(values, parent, bind);
        },

        afterLoad: function() {

            var domain = _.values(this.domain);

            var possible = this.getUnique(this.value);

            this._ordinalScale = d3.scale.ordinal()
                                .domain(possible)
                                .range(domain);

            var limits = this.getLimits(this.value),
                min = parseFloat(limits.min),
                max = parseFloat(limits.max),
                step = ((max-min) / (domain.length - 1));

            //todo: clean this perturbation up (hotfix)
            max = max + max / 10000;

            var domain = d3.range(min, max, step);

            this._linearScale = d3.scale.linear()
                                  .domain(domain)
                                  .range(domain)
                                  .interpolate(d3.interpolateRgb);
        },

        /**
         * Validates a color hook
         */
        validate: function() {
            //this domain must exist
            if (this.use !== "value" && !this.domain) {
                 this.domain = ["#CCCCCC", "#000000"];
            } else if (this.use === "value") {
                this.value = d3.rgb(this.value).toString();
            }
        },

        /**
         * Maps value for this hook
         * @param value Original value
         * @returns {String} color
         */
        mapValue: function(value) {

            if(!_.isArray(this.domain) && this.domain[value]) {
                return this.domain[value];
            }

            var color;
            switch (this.use) {
                case "indicator":
                    color = this._getColorLinear(value);
                    break;
                case "property":
                    color = this._getColorOrdinal(value);
                    break;
                case "value":
                default:
                    color = value;
                    break;
            }
            return color;
        },

        /**
         * Gets value of color with linear interpolation
         * @returns {String} color
         */
        _getColorLinear: function(value) {
            if(!this._linearScale) return "#000000";
            return this._linearScale(value);
        },

        /**
         * Gets value of color with discrete values
         * @returns {String} color
         */
        _getColorOrdinal: function(value) {
            if(!this._ordinalScale) return "#000000";
            return this._ordinalScale(value);
        }

    });

    return Color;
});