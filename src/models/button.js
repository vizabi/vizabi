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
         * @param parent A reference to the parent model
         * @param {Object} bind Initial events to bind
         */
        init: function(values, parent, bind) {

            values = _.extend({
                buttons: [],
            }, values);

            this._super(values, parent, bind);
        }
    });

    return ButtonModel;
});
