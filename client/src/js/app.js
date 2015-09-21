
Vizabi._globals.gapminder_paths.baseUrl = "http://static.gapminderdev.org/vizabi/develop/preview/";

//main app module

angular.module('gapminderTools', ['ngRoute']).config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

  $routeProvider
    .when('/:slug', {
        controller : 'gapminderToolsCtrl'
    })
    .otherwise({
      redirectTo: '/bubbles'
    });
    
  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false
  });
}]);

//TODO: remove global

function forceResizeEvt() {
    //force resize
    event = document.createEvent("HTMLEvents");
    event.initEvent("resize", true, true);
    event.eventName = "resize";
    window.dispatchEvent(event);
}