//main app controller

angular.module('gapminderTools')
.controller('gapminderToolsCtrl', ['$scope', '$route', '$routeParams', '$location', 'vizabiItems', 'vizabiFactory', function($scope, $route, $routeParams, $location, vizabiItems, vizabiFactory) {

  var placeholder = document.getElementById('vizabi-placeholder');

  $scope.loadingError = false;
  $scope.tools = {};
  $scope.validTools = [];

  //start off by getting all items
  vizabiItems.getItems().then(function(items) {
    $scope.tools = items;
    console.log(items);
    $scope.validTools = Object.keys($scope.tools);
    $scope.$broadcast('$routeChangeSuccess');
  });


  $scope.$on('$routeChangeSuccess', function() {
    var validTools = $scope.validTools;
    if(validTools.length === 0) return;
    if(validTools.indexOf($routeParams.slug) === -1) {
      //redirect
      $location.path('/' + validTools[0]);
      return;
    }

    $scope.activeTool = $routeParams.slug;
    var tool = $scope.tools[$scope.activeTool];
    $scope.viz = vizabiFactory.render(tool.tool, placeholder, tool.opts);
  });


}]);
