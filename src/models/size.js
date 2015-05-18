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
                unit: "",
                value: undefined
            }, values);
            this._super(values, parent, bind);
        },

        /**
         * Validates a color hook
         */
        validate: function() {
            //there must be a min and a max
            if (_.isUndefined(this.min) || this.min < 0) {
                this.min = 0;
            }
            if (_.isUndefined(this.max) || this.max > 1) {
                this.max = 1;
            }
            if (this.min > this.max) {
                this.min = this.max;
            }
            //value must always be between 0 and 1
            if (this.use === "value" && this.value > this.max) {
                this.value = this.max;
            }
            else if (this.use === "value" && this.value < this.min) {
                this.value = this.min;
            }
            if (!this.scaleType) {
                this.scaleType = 'linear';
            }
            if (this.use === "property") {
                this.scaleType = 'ordinal';
            }
        },

        /**
         * Gets the domain for this hook
         * @returns {Array} domain
         */
        buildScale: function() {
            if(this.use === "value") {
                this.scale = d3.scale.linear().domain([0,1]);
            }
            this._super();
        }

    });

    return Size;
});