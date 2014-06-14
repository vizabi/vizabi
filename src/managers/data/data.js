define([
    'base/class',
    'jquery',
    'underscore'
], function(Class, $, _) {

    var dataManager = Class.extend({
        init: function(base_path) {
            this.base_path = base_path || "";
            this.cache = {};
        },

        //load resource
        load: function(identifier, path, force, reset) {
        	var _this = this;
            //if result is cached, dont load anything unless forced to
            if (_.isObject(this.cache[identifier]) && !force) {
                return true;
            }
            //if force or no cache, load it.
            else {
                return $.getJSON(this.base_path + path, function(res) {
                    if (_.isUndefined(_this.cache[identifier]) || reset) {
                        _this.cache[identifier] = res || {};
                    } else {
                        $.extend(true, _this.cache[identifier], res);
                    }
                });
            }
        },

        //return requested identifier or entire cache
        get: function(identifier) {
            return (identifier) ? this.cache[identifier] : this.cache;
        }
    });

    return dataManager;
});