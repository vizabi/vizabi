define([
    'base/class',
    'managers/events/events',
], function(Class, Events) {

    
    var model = Class.extend({
        
        init: function(initAttr) {
            this.attributes = initAttr || {};
            this.events = Events;
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

            this.events.trigger("change");
        },

        bind: function(name, func) {
            this.events.bind(name, func);
        },

        trigger: function(name) {
            this.events.trigger(name);
        }
    });

    return model;

});