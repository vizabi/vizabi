module.exports = function (app) {
  app
    .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {

      $routeProvider
        .when('/:slug', {
          controller: 'gapminderToolsCtrl'
        })
        .otherwise({
          redirectTo: '/bubbles'
        });

      $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
      });
    }]);
};
