//main app controller

angular.module('gapminderTools')
.controller('gapminderToolsCtrl', ['$scope', '$route', '$routeParams', '$location', 'vizabiFactory', function($scope, $route, $routeParams, $location, vizabiFactory) {

  var placeholder = document.getElementById('vizabi-placeholder');

  $scope.loading = true;
  $scope.started = false;
  $scope.loadingError = false;
  $scope.tools = {
    "bubbles": {
      title: "Wealth & Health of Nations",
      render: showBubbleChart,
      description: "This graph shows how long people live and how much money they earn. Click the play button to see how countries have developed since 1800.",
      category: "Tools"
    },
    "mountain": {
      title: "World Income Distribution",
      render: showMountainChart,
      description: "This graph shows the amount of people in the world across each income level",
      category: "Tools"
    }
  };

  var validTools = Object.keys($scope.tools);

  $scope.$on('$routeChangeSuccess', function() {
    if(validTools.indexOf($routeParams.slug) === -1) {
      //redirect
      $location.path('/' + validTools[0]);
      return;
    }

    console.log($routeParams);

    $scope.activeTool = $routeParams.slug;
    var tool = $scope.tools[$scope.activeTool];
    tool.render();

  });

  function showBubbleChart() {
    
    var viz = vizabiFactory.render('BubbleChart', placeholder, {
      bind: {
        'ready': function(evt, options) {
          $scope.loading = false;
          $scope.started = true;
          $scope.$apply();
          forceResizeEvt(); //TODO: remove this hotfix
        }
      },
      data: {
        reader: 'csv-file',
        path: 'http://static.gapminderdev.org/vizabi/develop/preview/local_data/waffles/bub_data_u5mr_inc_etc_20150823.csv'
      },
      ui: {
        buttons: ['moreoptions', 'find', 'axes', 'size', 'colors', 'fullscreen', 'trails', 'lock']
      }
    });
  }

  function showMountainChart () {
    var viz = vizabiFactory.render('MountainChart', placeholder, {
      bind: {
        'ready': function(evt, options) {
          $scope.loading = false;
          $scope.started = true;
          $scope.$apply();
          forceResizeEvt(); //TODO: remove this hotfix
        }
      },
      data: {
        reader: 'csv-file',
        path: "http://static.gapminderdev.org/vizabi/develop/preview/local_data/waffles/mountains-pop-gdp-gini-1800-2030.csv"
      },
      ui: {
        buttons: ['find', 'colors', 'stack', 'axes-mc', 'fullscreen']
      }
    });
  }


}]);
