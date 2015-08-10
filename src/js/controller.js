//main app controller

angular.module('gapminderWorld')
.controller('gapminderWorldCtrl', ['$scope', 'vizabiFactory', function($scope, vizabiFactory) {


  var placeholder = document.getElementById('vizabi-placeholder');

  $scope.loading = true;
  $scope.started = false;
  $scope.loadingError = false;

  var viz = vizabiFactory.render('BubbleChart', placeholder, {
  	bind: {
  		'ready': function(evt, options) {
  			$scope.loading = false;
		    $scope.started = true;
		    $scope.$apply();
  			forceResizeEvt(); //TODO: remove this hotfix
  		},

  		//bind variable to hovered country
  		'change:state:entities:brush': function(evt, options) {
  			var hovered = options.state.entities.brush[0];
  			$scope.hoveredCountry = hovered;
  			$scope.$apply();
  		},

      'change:marker': function(evt, options) {
        console.log(options);
      },

  		//bind variable to hovered country
  		'change:state:time:value': function(evt, options) {
  			var time = options.state.time.value;
  			$scope.time = time.getFullYear();
  			$scope.$apply();
  		},

      'change:state': function(evt, options) {
        dataToUrl(options);
      }
  	},
    data: {
      reader: 'csv-file',
      path: 'https://dl.dropboxusercontent.com/u/4933279/csv/basic-indicators.csv'
    }
  });


  var initOpts = viz.getOptions();
  $scope.sizeValue = initOpts.state.marker.size.max * 100;

  $scope.changeSize = function() {
    var newSize = $scope.sizeValue / 100;
    viz.setOptions({
      state: {
        marker: {
          size: {
            max: newSize
          }
        }
      }
    });
  };


}]);
