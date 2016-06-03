'use strict';

let config = {
    baseUrl: 'http://localhost:9000/',
  specs: [
//   '../tests/e2e/*.spec.js'
      '../tests/e2e/excel_access.spec.js'
  ],
  exclude: [],

  framework: 'jasmine',

  allScriptsTimeout: 110000,

  jasmineNodeOpts: {
    showTiming: true,
    showColors: true,
    isVerbose: true,
    includeStackTrace: true,
    defaultTimeoutInterval: 400000,
    print: function () {
    }
  },

  onPrepare: function () {
    browser.ignoreSynchronization = true;
    var SpecReporter = require('jasmine-spec-reporter');
    // add jasmine spec reporter
    jasmine.getEnv().addReporter(new SpecReporter({displayStacktrace: 'all'}));
  },

  reporter: ['spec'],
  /**
   * Angular 2 configuration
   *
   * useAllAngular2AppRoots: tells Protractor to wait for any angular2 apps on the page instead of just the one matching
   * `rootEl`
   *
   */
  useAllAngular2AppRoots: true
};	

config.multiCapabilities = [
    {
//	'browserName': 'firefox',
	'browserName': 'phantomjs',
	'phantomjs.binary.path': require('phantomjs').path,
	'phantomjs.ghostdriver.cli.args': ['--loglevel=DEBUG'],
    }
];

exports.config = config;
exports.config = config;
