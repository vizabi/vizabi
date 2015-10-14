module.exports = function (app) {
  app
    .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {

      $routeProvider
        .when('/:slug', {
          controller: 'gapminderToolsCtrl',
          reloadOnSearch: false
        })
        .otherwise({
          redirectTo: '/bubbles',
          reloadOnSearch: false
        });

      $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
      });
    }]);
};
