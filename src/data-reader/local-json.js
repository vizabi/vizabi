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
                 defer = $.Deferred(),
                 promises = [];

             var path = this.basepath.replace("{{LANGUAGE}}", language);

             _this.data = [];

             for (var i = 0; i < queries.length; i++) {
                 var fakeResponsePath = path.replace("response", "response_" + i),
                     query = queries[i];

                 var promise = $.getJSON(fakeResponsePath, function(res) {
                         var geos = query.where.geo,
                             categories = query.where['geo.category'],
                             timeRange = query.where.time,
                             data = res[0];

                         //if geos is not everything, filter geos
                         if (geos[0] != "*") {
                             data = data.filter(function(row) {
                                 return geos.indexOf(row["geo"]) >= 0;
                             });
                         }

                         //if geos is not everything, filter geos
                         if (categories && categories[0] != "*") {
                             data = data.filter(function(row) {
                                 return categories.indexOf(row["geo.category"][0]) >= 0;
                             });
                         }

                         //if there's a timeRange, filter range
                         if(timeRange) {
                            timeRange = timeRange[0].split("-");
                            var min = timeRange[0], max = timeRange[1];

                            data = data.filter(function(row) {
                                 return row["time"] >= min && row["time"] <= max;
                             });
                         }

                         _this.data.push(data);
                     })
                     .error(function() {
                         console.log("Error Happened While Lading File: " + fakeResponsePath);
                     });

                 promises.push(promise);
             }

             $.when.apply(null, promises).done(function() {
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