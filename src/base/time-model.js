 define([
    'base/model'
], function(Model) {

	var timeModelAttrs = {
		timeRange: ["1990-2012"],
        time: 2007,
	};
    
    var TimeModel = Model.extend({
        init: function() {
            this._super();
        },

        setAttr: function(attr, val) {
            timeModelAttrs[attr] = val;
        }

    });

    return TimeModel;
});