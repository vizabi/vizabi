 define([
    'base/class',
    'jquery',
    'underscore'
], function(Class, $, _) {

    var LocalJSONReader = Class.extend({

        init: function(basepath) {
            this.data = {};
            this.basepath = basepath;
        },

        read: function(options) {
            var _this = this,
                defer = $.Deferred();
            
            //creating query in the expected object format as discussed 
            //(local json)
            var query = {};

            //sending request to server
            var promise = $.getJSON(_this.basepath, query , function(res) {
                _this.data = res || {};
            });

            promise.done(function() {
                defer.resolve();
            });

            return defer;
        },

        getData: function() {
            return this.data;
        }

    });

    return LocalJSONReader;

});