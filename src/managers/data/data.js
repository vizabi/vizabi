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
        load: function(path, force, reset) {
        	var _this = this;
            //if result is cached, dont load anything unless forced to
            if (_.isObject(this.cache[path]) && !force) {
                return true;
            }
            //if force or no cache, load it.
            else {
                return $.getJSON(this.base_path + path, function(res) {
                    if (_.isUndefined(_this.cache[path]) || reset) {
                        _this.cache[path] = res || {};
                    } else {
                        $.extend(true, _this.cache[path], res);
                    }
                });
            }
        },

        //return requested file or entire cache
        get: function(path) {
            return (path) ? this.cache[path] : this.cache;
        }
    });

    return dataManager;
});