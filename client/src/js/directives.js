var ASSET_URL = '/public';

angular.module('gapminderTools').directive('navExpandable', ['menuFactory', function(menuFactory) {
  return {
    restrict: 'A',
    scope: {
      items: '='
    },

    controller: ['$scope', function($scope) {

      $scope.items = {};

      menuFactory.getMenu().then(function(items) {
        $scope.items = items;
        console.log($scope.items);
      }); 

      /**
       * Checks if a menu item has an icon.
       * @param {Object} item
       */
      $scope.hasIcon = function(item) {
        return angular.isDefined(item) && item;
      };

      /**
       * Creates an icon URL.
       * @param {string} url relative URL to icon
       */
      $scope.createIconUrl = function(url) {
        var iconUrl = ASSET_URL + url;
        return iconUrl;
      };
    }],
    
    templateUrl: 'menu.html'
  };
}]);