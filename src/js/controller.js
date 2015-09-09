//main app controller

angular.module('gapminderTools')
.controller('gapminderToolsCtrl', ['$scope', 'vizabiFactory', function($scope, vizabiFactory) {

  var placeholder = document.getElementById('vizabi-placeholder');

  $scope.loading = true;
  $scope.started = false;
  $scope.loadingError = false;
  $scope.tools = {
    "wealth-and-health": {
      title: "Wealth & Health of Nations",
      render: showBubbleChart,
      description: "This graph shows how long people live and how much money they earn. Click the play button to see how countries have developed since 1800.",
      category: "Tools"
    },
    "world-income": {
      title: "World Income Distribution",
      render: showMountainChart,
      description: "This graph shows the amount of people in the world across each income level",
      category: "Tools"
    }
  };

  $scope.activeTool = "wealth-and-health";

  $scope.changeChart = function(chart) {
    $scope.activeTool = chart;
  };

  $scope.$watch('activeTool', function() {
      var tool = $scope.tools[$scope.activeTool];
      tool.render();

      $scope.title = tool.title;
      $scope.description = tool.description;
      $scope.category = tool.category;
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
        path: 'http://static.gapminderdev.org/vizabi/develop/preview/local_data/waffles/basic-indicators.csv'
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
