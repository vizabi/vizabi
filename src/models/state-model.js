define([
    'underscore',
    'base/model'
], function(_, Model) {

    var StateModel = Model.extend({
        init: function(values) {
            //default values for state model
            values = _.extend({}, values);

            this._super(values);
        },

        validate: function() {
            //validate
        }

    });

    return StateModel;
});