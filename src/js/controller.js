//main app controller

angular.module('gapminderWorld')
.controller('gapminderWorldCtrl', ['$scope', 'vizabiFactory', function($scope, vizabiFactory) {

  var placeholder = document.getElementById('vizabi-placeholder');
  
  $scope.loading = true;
  $scope.started = false;
  $scope.loadingError = false;

  vizabiFactory.render('BubbleChart', placeholder, {
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

  		//bind variable to hovered country
  		'change:state:time:value': function(evt, options) {
  			var time = options.state.time.value;
  			$scope.time = time.getFullYear();
  			$scope.$apply();
  		}
  	},
    data: {
      reader: 'csv-file',
      path: 'https://dl.dropboxusercontent.com/u/4933279/csv/basic-indicators.csv'
    }
  });

}]);