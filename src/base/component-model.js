 define([
    'base/model'
], function(Model) {

	// HERE COMMON METHODS CAN EXIST FOR EXTENDING
    var ComponentModel = Model.extend({
        init: function() {
            this._super();
        }

    });

    return ComponentModel;
});