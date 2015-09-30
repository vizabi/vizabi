require('./static-assets');
require('../styles/main.scss');

var angular = require('angular');
var ngRoute = require('angular-route');
var ngTouch = require('angular-touch');
// Vizabi stuff

require('./vizabi-ws-reader');
var app = angular.module('gapminderTools', [ngRoute, ngTouch]);
require('./app.config')(app);
require('./controller')(app);
require('./directives')(app);
require('./services')(app);
