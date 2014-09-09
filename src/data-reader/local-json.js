 define([
     'base/class',
     'jquery',
     'underscore',
     'base/utils'
 ], function(Class, $, _, Util) {

     var LocalJSONReader = Class.extend({

         init: function(basepath) {
             this.data = [];
             this.basepath = basepath;
         },

         read: function(queries, language) {
             var _this = this,
                 defer = $.Deferred();

             var path = this.basepath.replace("{{LANGUAGE}}", language);

             _this.data = [];

             for (var i=0; i < queries.length; i++) {
                var fakeResponsePath = path.replace("response", "response_" + i);
                
                var promise = $.getJSON(fakeResponsePath, function(res) {
                    _this.data.push(res);
                })
                .error(function() { 
                    console.log("Error Happened While Lading File: " + path); 
                });
             }

             promise.done(function() {
                 console.log(_this.data);   
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