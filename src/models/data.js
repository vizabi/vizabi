define([
    'jquery',
    'lodash',
    'base/model',
    'base/data'
], function($, _, Model, DataManager) {

    var DataModel = Model.extend({

        /**
         * Initializes the data model.
         * @param {Object} values The initial values of this model
         * @param parent A reference to the parent model
         * @param {Object} bind Initial events to bind
         */
        init: function(values, parent, bind) {

            this._type = "data";
            values = _.extend({
                reader: "local-json",
                path: "data.json"
            }, values);

            //same constructor as parent, with same arguments
            this._super(values, parent, bind);
        }

    });

    return DataModel;
});