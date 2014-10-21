define([
    'underscore',
    'base/model'
], function(_, Model) {

    var StateModel = Model.extend({
        init: function(values) {
            //default values for state model
            values = _.extend({
                value: "en",
                ui_strings: {}
            }, values);
            this._super(values);
        }

    });

    return StateModel;
});