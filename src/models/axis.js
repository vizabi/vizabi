/*!
 * VIZABI Axis Model (hook)
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) {
        return;
    }

    //constant time formats
    var time_formats = {
        "year": d3.time.format("%Y"),
        "month": d3.time.format("%Y-%m"),
        "week": d3.time.format("%Y-W%W"),
        "day": d3.time.format("%Y-%m-%d"),
        "hour": d3.time.format("%Y-%m-%d %H"),
        "minute": d3.time.format("%Y-%m-%d %H:%M"),
        "second": d3.time.format("%Y-%m-%d %H:%M:%S")
    };

    Vizabi.Model.extend('axis', {
        /**
         * Initializes the color hook
         * @param {Object} values The initial values of this model
         * @param parent A reference to the parent model
         * @param {Object} bind Initial events to bind
         */
        init: function(values, parent, bind) {

            this._type = "axis";
            values = utils.extend({
                use: "value",
                unit: "",
                which: undefined
            }, values);
            this._super(values, parent, bind);
        },

        /**
         * Validates a color hook
         */
        validate: function() {

            var possibleScales = ["log", "linear", "time", "pow"];
            if (!this.scaleType || (this.use === "indicator" && possibleScales.indexOf(this.scaleType) === -1)) {
                this.scaleType = 'linear'; 
            }

            if (this.use !== "indicator" && this.scaleType !== "ordinal") {
                this.scaleType = "ordinal";
            }

            //TODO a hack that kills the scale, it will be rebuild upon getScale request in model.js
            if(this.value_1 != this.which || this.scaleType_1 != this.scaleType) this.scale = null;
            this.value_1 = this.which;
            this.scaleType_1 = this.scaleType;

            //TODO: add min and max to validation
        },
        
        /**
         * Gets tick values for this hook
         * @returns {Number|String} value The value for this tick
         */
        tickFormatter: function(x) {
            var result = x;
            if(utils.isDate(x)) {
                //TODO: generalize for any time unit
                result = time_formats["year"](x);
            }else if (this.use == "indicator") {
                result = parseFloat(x);
            }
            return result;
        },

        /**
         * Gets the domain for this hook
         * @returns {Array} domain
         */
        buildScale: function() {
            var domain;
            var scale = this.scaleType || "linear";

            if(this.which=="time"){
                var limits = this.getLimits(this.which);
                this.scale = d3.time.scale().domain([limits.min, limits.max]);
                return;
            }
            
            switch (this.use) {
                case "indicator":
                    var limits = this.getLimits(this.which),
                        margin = (limits.max - limits.min) / 20;
                    domain = [(limits.min - margin), (limits.max + margin)];
                    if(scale == "log") {
                        domain = [(limits.min-limits.min/4), (limits.max + limits.max/4)];
                    }

                    break;
                case "property":
                    domain = this.getUnique(this.which);
                    break;
                case "value":
                default:
                    domain = [this.which];
                    break;
            }

            this.scale = d3.scale[scale]().domain(domain);
        }
    });
}).call(this);