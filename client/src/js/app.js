
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

// GOOGLE ANALYTICS

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-67908993-1', 'auto');