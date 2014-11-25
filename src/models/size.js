define([
    'models/hook'
], function(Hook) {

    var Size = Hook.extend({

        /**
         * Initializes the data model.
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
        }

    });

    return Size;
});