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

            this._type = "size";
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

            //there must be a min and a max
            if (_.isUndefined(this.min) || this.min < 0) {
                this.set("min", 0 , silent, true);
            }
            if (_.isUndefined(this.max) || this.max > 1) {
                this.set("max", 1, silent, true);
            }

            if (this.min > this.max) {
                this.set("min", this.max, silent, true);
            }

            //value must always be between 0 and 1
            if (this.hook === "value" && this.value > this.max) {
                this.set("value", this.max , silent, true);
            }
            else if (this.hook === "value" && this.value < this.min) {
                this.set("value", this.min , silent, true);
            }
            if (!this.scale) {
                this.set("scale", "linear", silent, true);
            }
            if (this.hook === "property") {
                this.set("scale", "ordinal", silent, true);
            }
        },

        /**
         * Gets the domain for this hook
         * @returns {Array} domain
         */
        getDomain: function() {
            if(this.hook === "value") {
                return d3.scale.linear().domain([0,1]);
            }
            return this._super();
        }

    });

    return Size;
});