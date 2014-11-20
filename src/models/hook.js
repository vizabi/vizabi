define([
    'lodash',
    'base/model'
], function(_, Model) {

    var Hook = Model.extend({

        /**
         * Initializes the hook
         * @param {Object} values The initial values of this model
         * @param intervals A parent intervals handler (from tool)
         * @param {Object} bind Initial events to bind
         */
        init: function(values, bind) {

            values = _.extend({
                use: "value",
                value: undefined
            }, values);
            this._super(values, bind);
        }

    });

    return Hook;
});