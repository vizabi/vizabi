'use strict';
var angular = require('angular');
var ngRoute = require('angular-route');
Vizabi._globals.gapminder_paths.baseUrl = "http://static.gapminderdev.org/vizabi/master/preview/";

require('./vizabi-ws-reader');
var app = angular.module('gapminderTools', [ngRoute]);
require('./app.config')(app);
