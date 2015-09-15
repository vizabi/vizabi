//service wraps single endpoint

angular.module('gapminderTools')
.factory("vizabiFactory", ['$rootScope', '$timeout', function($rootScope, $timeout) {

  return {

    /**
     * Render Vizabi
     * @param {String} tool name of the tool
     * @param {DOMElement} placeholder
     * @return {Object}
     */
    render: function(tool, placeholder, options) {

      var hash = window.location.hash;
      if(hash){
        var state = JSON.parse(location.hash.substr(1), function(key, value) {
            if (key == 'value' || key == 'end' || key == 'start') {
              var date = new Date(value);
              return date.getFullYear().toString();
            }
            return value;
          }
        );

        options.language = {};
        options.language.id = state.id;
        options.state = state.state;
      }

      return Vizabi(tool, placeholder, options);
    }
  };

}]);


angular.module('gapminderTools')
.factory("vizabiItems", ['$http', function($http) {

  return {
    /**
     * Get All Items
     */
    getItems: function() {
      //return the promise directly.
      return $http.get('/api/item')
                  .then(function(result) {
                      var items = {}, i, s;
                      for(i=0, s=result.data.length; i<s; i++) {
                        items[result.data[i].slug] = result.data[i];
                      }
                      return items;
                  });
    }
  };

}]);