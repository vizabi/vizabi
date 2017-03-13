'use strict';

exports.config = {
  directConnect: true,
  chromeDriver: '/usr/lib/node_modules/webdriver-manager/selenium/chromedriver_2.28',
  noGlobals: false,
  specs: [
    '../tests/nginx/tools-page-tests.js'
  ],
  capabilities: {
    browserName: 'chrome',
    chromeOptions: {
      args: ['show-fps-counter=true']
    }
  },
  baseUrl: 'http://tools-dev.gapminderdev.org',
  useAllAngular2AppRoots: true,
  allScriptsTimeout: 5000000,
  getPageTimeout: 10000,
  restartBrowserBetweenTests: true,
  untrackOutstandingTimeouts: true,
  framework: 'jasmine',
  jasmineNodeOpts: {
    showTiming: true,
    showColors: true,
    isVerbose: false,
    includeStackTrace: false,
    defaultTimeoutInterval: 30000,
    print: function() {}
  },

  onPrepare: () => {

    let SpecReporter = require('jasmine-spec-reporter').SpecReporter;

    jasmine.getEnv().addReporter(new SpecReporter({
      spec: {
        displayStacktrace: true
      }
    }))
  }
};
