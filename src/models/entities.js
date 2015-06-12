/*!
 * VIZABI Entities Model
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;

    Vizabi.Model.extend('entities', {
        /**
         * Initializes the entities model.
         * @param {Object} values The initial values of this model
         * @param parent A reference to the parent model
         * @param {Object} bind Initial events to bind
         */
        init: function(values, parent, bind) {

            this._type = "entities";
            values = utils.extend({
                show: {},
                select: [],
                brush: [],
                opacitySelectDim: 0.3,
                opacityRegular: 0.8
            }, values);

            this._visible = [];

            this._super(values, parent, bind);
        },

        /**
         * Validates the model
         * @param {boolean} silent Block triggering of events
         */
        validate: function(silent) {
            var _this = this;
            var dimension = this.getDimension();
            var visible_array = this._visible.map(function(d) {
                return d[dimension]
            });

            this.select = this.select.filter(function(f) {
                return visible_array.indexOf(f[dimension]) !== -1;
            });
            this.brush = this.brush.filter(function(f) {
                return visible_array.indexOf(f[dimension]) !== -1;
            });
        },

        /**
         * Gets the dimensions in this entities
         * @returns {String} String with dimension
         */
        getDimension: function() {
            return this.show.dim;
        },

        /**
         * Gets the filter in this entities
         * @returns {Array} Array of unique values
         */
        getFilter: function() {
            return this.show.filter.getObject();
        },

        /**
         * Gets the selected items
         * @returns {Array} Array of unique selected values
         */
        getSelected: function() {
            var dim = this.getDimension();
            return this.select.map(function(d) {
                return d[dim];
            });
        },

        /**
         * Selects or unselects an entity from the set
         */
        selectEntity: function(d, timeDim, timeFormatter) {
            var dimension = this.getDimension();
            var value = d[dimension];
            if (this.isSelected(d)) {
                this.select = this.select.filter(function(d) {
                    return d[dimension] !== value;
                });
            } else {
                var added = {};
                added[dimension] = value;
                added["labelOffset"] = [0, 0];
                if (timeDim && timeFormatter) {
                    added["trailStartTime"] = timeFormatter(d[timeDim]);
                }
                this.select = this.select.concat(added);
            }
        },

        setLabelOffset: function(d, xy) {
            var dimension = this.getDimension();
            var value = d[dimension];

            utils.find(this.select, function(d) {
                return d[dimension] === value;
            }).labelOffset = xy;

            //force the model to trigger events even if value is the same
            this.set("select", this.select, true);
        },

        /**
         * Selects an entity from the set
         * @returns {Boolean} whether the item is selected or not
         */
        isSelected: function(d) {
            var dimension = this.getDimension();
            var value = d[this.getDimension()];

            var select_array = this.select.map(function(d) {
                return d[dimension];
            });

            return select_array.indexOf(value) !== -1;
        },

        /**
         * Clears selection of items
         */
        clearSelected: function() {
            this.select = [];
        },
        
        
        setHighlighted: function(arg){
            this.brush = [].concat(arg);
        },

        //TODO: join the following 3 methods with the previous 3

        /**
         * Highlights an entity from the set
         */
        highlightEntity: function(d, timeDim, timeFormatter) {
            var dimension = this.getDimension();
            var value = d[dimension];
            if (!this.isHighlighted(d)) {
                var added = {};
                added[dimension] = value;
                if (timeDim && timeFormatter) {
                    added["trailStartTime"] = timeFormatter(d[timeDim]);
                }
                this.brush = this.brush.concat(added);
            }
        },

        /**
         * Unhighlights an entity from the set
         */
        unhighlightEntity: function(d) {
            var dimension = this.getDimension();
            var value = d[dimension];
            if (this.isHighlighted(d)) {
                this.brush = this.brush.filter(function(d) {
                    return d[dimension] !== value;
                });
            }
        },

        /**
         * Checks whether an entity is highlighted from the set
         * @returns {Boolean} whether the item is highlighted or not
         */
        isHighlighted: function(d) {
            var dimension = this.getDimension();
            var value = d[this.getDimension()];

            var brush_array = this.brush.map(function(d) {
                return d[dimension];
            });

            return brush_array.indexOf(value) !== -1;
        },

        /**
         * Clears selection of items
         */
        clearHighlighted: function() {
            this.brush = [];
        }
    });

}).call(this);