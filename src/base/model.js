define([
    'base/class'
], function(Class) {

    var model = Class.extend({
        init: function(options) {
            this.attributes = {};
        },
        get: function(attr) {
            return this.attributes[attr];
        },
        set: function(attr, value) {
            if (typeof attr !== 'object') {
                attr = {
                    attr: value
                };
            }

            for (var att in attr) {
                this.attributes[att] = attr[att];
            }

        }
    });

    return model;

});