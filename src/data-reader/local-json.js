 define([
     'base/class',
     'jquery',
     'underscore'
 ], function(Class, $, _) {

     var LocalJSONReader = Class.extend({

         init: function(basepath) {
             this.data = [];
             this.basepath = basepath;
         },

         read: function(queries, language) {
             var _this = this,
                 defer = $.Deferred();

             var path = this.basepath.replace("{{LANGUAGE}}", language);

             //sending request to server
             var promise = $.getJSON(path, function(res) {
                 _this.data = [];
                 for (var i in queries) {
                     _this.data.push(queryJSON(res, queries[i]))
                 }
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

     function queryJSON(json, query) {
         if (query.from == "data") {
             var table_name = getTableName(query),
                 data = json.tables[table_name].data;
             return filterColumns(filterRows(data, query.where), query.select);
         }
     }

     function getTableName(query) {
         var table_name = [];
         _.each(query.where, function(value, field) {
             table_name.push(field);
         });
         //alphabetical order (ex: year, country = table country_year)
         table_name.sort();
         return table_name.join("_");
     }

     function filterColumns(array, columns) {
        return _.map(array, function(row) {
            return _.pick(row, columns);
        })
     };

     function filterRows(array, conditions) {
        return _.filter(array, function(row) {
                var include = true;

                for(var field in conditions) {
                    var value = conditions[field];
                    if(!matchValue(field, value, row[field])) {
                        include = false;
                        break;
                    }
                }
                return include;
             });
     }

     function matchValue(field, possible, value) {

        //exception to handle year formats
        if(_.isString(possible)) {
            if(field === "year" && _.contains(possible, "-")) {
                var years = possible.split("-");
                possible = _.range(parseInt(years[0], 10),parseInt(years[1], 10)+1);
            } else {
                possible = [possible];
            }
        } else if (_.isArray(possible) && field === "year") {
            var new_possible = [];
            for(var i in possible) {
                if(!_.contains(possible[i], "-")) {
                    new_possible.push(possible[i]);
                }
                else {
                    var years = possible[i].split("-");
                    new_possible = _.union(new_possible, _.range(parseInt(years[0], 10),parseInt(years[1], 10)+1));
                }
            }
            possible = new_possible;
        }
        //TODO: review string and int incompatibility
        return _.contains(possible, value);
     }

     return LocalJSONReader;

 });