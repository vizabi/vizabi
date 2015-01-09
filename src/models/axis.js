define([
    'd3',
    'lodash',
    'models/hook'
], function(d3, _, Hook) {

    var Size = Hook.extend({

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

        /**
         * Validates a color hook
         */
        validate: function(silent) {

            var possibleScales = ["log", "linear", "pow"];
            if (!this.scale || (this.use === "indicator" && possibleScales.indexOf(this.scale) === -1)) {
                this.set("scale", "linear" , silent, true);
            }

            if (!this.unit && this.use === "indicator") {
                this.set("unit", 1 , silent, true);
            }

            if (this.use !== "indicator") {
                this.set("scale", "ordinal" , silent, true);
            }

            //TODO: add min and max to validation

        },

        /**
         * Gets tick values for this hook
         * @returns {Number|String} value The value for this tick
         */
        getTick: function(tick_value) {
            var value = tick_value;
            if (this.use == "indicator") {
                value = parseFloat(value) / this.unit;
            }
            return value;
        },

        /**
         * Gets the domain for this hook
         * @returns {Array} domain
         */
        getDomain: function() {
            var domain,
                scale = this.scale || "linear";

            switch (this.use) {
                case "indicator":
                    var limits = this.getLimits(this.value),
                        margin = (limits.max - limits.min) / 10;
                    domain = [(limits.min - margin), (limits.max + margin)];
                    if(scale == "log") {
                        domain = [limits.min/2, (limits.max + limits.max/2)];
                    }

                    break;
                case "property":
                    domain = this.getUnique(this.value);
                    break;
                case "value":
                default:
                    domain = [this.value];
                    break;
            }

            return d3.scale[scale]().domain(domain);
        }

    });

    return Size;
});