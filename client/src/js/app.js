require('../styles/main.scss');

var angular = require('angular');
require('angular-route');

// Vizabi stuff

require('./vizabi-ws-reader');

var app = angular.module('gapminderTools', ['ngRoute']);
require('./app.config')(app);
require('./controller')(app);
require('./directives')(app);
require('./services')(app);
