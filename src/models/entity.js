define([
    'lodash',
    'base/model'
], function(_, Model) {

    var Entity = Model.extend({

        /**
         * Initializes the entity model.
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
         * Gets the dimensions in this entity
         * @returns {Array} Array of unique values
         */
        getDimensions: function() {
            return _.unique(_.pluck(this.show, "dim"));
        },

        /**
         * Gets the filters in this entity
         * @returns {Array} Array of unique values
         */
        getFilters: function() {
            return _.unique(_.pluck(this.show, "filter"));
        }

    });

    return Entity;
});