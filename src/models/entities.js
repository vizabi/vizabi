define([
    'lodash',
    'base/model'
], function(_, Model) {

    var Entity = Model.extend({

        /**
         * Initializes the entities model.
         * @param {Object} values The initial values of this model
         * @param parent A reference to the parent model
         * @param {Object} bind Initial events to bind
         */
        init: function(values, parent, bind) {

            this._type = "entities";
            values = _.extend({
                show: {},
                select: [],
                brush: []
            }, values);

            this._super(values, parent, bind);
        },

        /**
         * Validates the model
         * @param {boolean} silent Block triggering of events
         */
        validate: function(silent) {
            //TODO: validate if select and brush are a subset of show
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
            return _.map(this.select, function(d) {
                return d[dim];
            });
        },

        /**
         * Selects or unselects an entity from the set
         */
        selectEntity: function(d, timeFormatter) {
            var dimension = this.getDimension();
            var value = d[dimension];
            if(this.isSelected(d)) {
                this.select = this.select.filter(function(d){
                    return d[dimension] !== value;
                });
            } else {
                var added = {};
                added[dimension] = value;
                if(timeFormatter) {
                    added["trailStartTime"] = timeFormatter(d.time);
                }
                this.select = this.select.concat(added);
            }
        },

        /**
         * Selects an entity from the set
         * @returns {Boolean} whether the item is selected or not
         */
        isSelected: function(d) {
            var dimension = this.getDimension();
            var value = d[this.getDimension()];

            var select_array = this.select.map(function(d){
                return d[dimension];
            });
            
            if(_.indexOf(select_array, value) !== -1) {
                return true;
            } else {
                return false;
            }
        }

    });

    return Entity;
});