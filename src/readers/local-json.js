 define([
     'jquery',
     'base/class',
 ], function($, Class) {

     var LocalJSONReader = Class.extend({

         /**
          * Initializes the reader.
          * @param {String} basepath The basepath of this reader (file)
          */
         init: function(basepath) {
             this._name = 'local-json';
             this._data = [];
             this._basepath = basepath;
         },

         /**
          * Reads from source
          * @param {Array} queries Queries to be performed
          * @param {String} language language
          * @returns a promise that will be resolved when data is read
          */
         read: function(queries, language) {
             var _this = this,
                 defer = $.Deferred(),
                 promises = [];

             var path = this._basepath.replace("{{LANGUAGE}}", language);

             _this._data = [];

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

                         //if there's a timeRange different than all, filter range
                         if (timeRange && timeRange != "*") {
                             timeRange = timeRange[0].split("-");
                             var min = timeRange[0],
                                 max = timeRange[1] || min;
                             //max = min in case there's only one

                             data = data.filter(function(row) {
                                 return row["time"] >= min && row["time"] <= max;
                             });
                         }

                         _this._data.push(data);
                     })
                     .error(function() {
                         console.log("Error Happened While Loading File: " + fakeResponsePath);
                     });

                 promises.push(promise);
             }

             $.when.apply(null, promises).done(function() {
                 defer.resolve();
             });

             return defer;
         },

         /**
          * Gets the data
          * @returns all data
          */
         getData: function() {
             return this._data;
         }

     });

     return LocalJSONReader;

 });