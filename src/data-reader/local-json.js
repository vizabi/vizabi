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
             var promise = $.getJSON(path, function(res) {
                 _this.data = [];

                 for (var i=0; i < queries.length; i++) {
                    _this.data.push(queryJSON(res, queries[i]))
                 }
             })
             .success(function() { console.log("File: " + path + "Loaded, Successfully."); })
             .error(function() { console.log("Error Happened While Lading File: " + path); });

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

     function queryJSON(json, query) {
        var result = [];
        
        _.each(json.response, function (resp) {
            var numOfMetConditions = getNumberOfMetConditions(query.where, resp);
            var numOfConditions = _.size(query.where);
            
            //If all where conditions were satisfied, selected attribute
            if (numOfConditions === numOfMetConditions) {
                result.push(getSelectedElements(query.select, resp));
            }
        });

        return result;
    }

    // check all where condition in each response object
    function getNumberOfMetConditions (where, resp) {
        var i = 1;
        var num = _.size(where);
            
        _.each(where, function(value, key) {
            if (typeof resp[key] === 'number' && 
                isInRange(value,resp[key])) {
                i++;
            }
            else if (Array.isArray(resp[key]) && 
                Util.isSubArray(resp[key], value)) {
                    i++;
            }
            else  if (value.indexOf(resp[key]) > 0) {
                i++;
            }
        });

        return i;
    }
    
    function getSelectedElements(select, resp) {
        var res = {};
        
        _.each(select, function (attr) {
            res[attr] = resp[attr];
        });

        return res;

    }

    function isInRange(ranges, year) {
        for (var range in ranges) {
            for (var i = parseInt(range.split("-")[0]); 
                        i < parseInt(range[0].split[1]); i++) {
                if (year === i) return true;
            }
        }

        return false;
    }

    return LocalJSONReader;

 });