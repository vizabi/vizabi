define([
    'jquery',
    'lodash',
    'base/model',
    'base/data'
], function($, _, Model, DataManager) {

    var ButtonModel = Model.extend({

        /**
         * Initializes the button model.
         * @param {Object} values The initial values of this model
         * @param intervals A parent intervals handler (from tool)
         * @param {Object} bind Initial events to bind
         */
        init: function(values, intervals, bind) {

            values = _.extend({
                buttons: [],
            }, values);

            this._super(values, intervals, bind);
        }
    });

    return ButtonModel;
});
