 define([
     'base/model'
 ], function(Model) {

     var showModelAttribute = {
         show: {
             geo: ['bra', 'swe'],
             'geo.category': ['country']
         }
     };

     var ShowModel = Model.extend({
         init: function() {
             this._super();
         },

         setAttr: function(attr, val) {
             showModelAttribute[attr] = val;
         }


     });

     return ShowModel;
 });