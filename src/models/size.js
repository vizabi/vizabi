define([
    'models/hook'
], function(Hook) {

    var Size = Hook.extend({

        /**
         * Initializes the data model.
         * @param {Object} values The initial values of this model
         * @param intervals A parent intervals handler (from tool)
         * @param {Object} bind Initial events to bind
         */
        init: function(values, intervals, bind) {

            values = _.extend({
                use: "value",
                value: undefined
            }, values);
            this._super(values, intervals, bind);
        }

    });

    return Size;
});