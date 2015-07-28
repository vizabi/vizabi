//service wraps single endpoint

angular.module('gapminderWorld')
.factory("vizabiFactory", ['$rootScope', '$timeout', function($rootScope, $timeout) {

  return {

    /**
     * Render Vizabi
     * @param {String} tool name of the tool
     * @param {DOMElement} placeholder
     * @return {Object}
     */
    render: function(tool, placeholder, options) {
      return Vizabi(tool, placeholder, options);
    }

  };

}]);