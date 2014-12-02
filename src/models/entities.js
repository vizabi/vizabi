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

            values = _.extend({
                show: [],
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
         * @returns {Array} Array of unique values
         */
        getDimensions: function() {
            return _.unique(_.pluck(this.show, "dim"));
        },

        /**
         * Gets the filters in this entities
         * @returns {Array} Array of unique values
         */
        getFilters: function() {
            return _.unique(_.pluck(this.show, "filter"));
        },

        selectEntity: function(d) {
            var id = _.pick(d, this.getDimensions());
            //TODO: include in select array in the correct format
            var select_array = this.select;
            if(this.isSelected(id)) {
                select_array = _.reject(select_array, id);
            } else {
                select_array.push(id);
            }
            this.set("select", select_array);
        },

        isSelected: function(d) {
            var id = _.pick(d, this.getDimensions());
            var select_array = this.select;
            if(_.findIndex(select_array, id) !== -1) {
                return true;
            } else {
                return false;
            }
        },

        /**
         * Gets the flattened version of the entities arrays
         * @returns {Array} flat array
         */
        _flatten: function(field) {
            var target = this[field],
                flat = [];
            _.each(target, function(dimension) {
                var dim = dimension.dim,
                    objs = dimension.filter[dim];
                _.each(objs, function(entity) {
                    var new_obj = {};
                    new_obj[dim] = entity;
                    flat.push(new_obj);
                });
            });
            return flat;
        }

    });

    return Entity;
});