/**
 * Created by tvaleriy on 8/30/16.
 */

'use strict';

exports.config = {
    directConnect: true,
    chromeDriver: '/usr/lib/node_modules/webdriver-manager/selenium/chromedriver_2.23',
    noGlobals: false,
    specs: [
      '/home/tvaleriy/work/vizabi/tests/nginx/*.js'
    ],
    capabilities: {
      browserName: 'chrome',
      chromeOptions: {
        args: ['show-fps-counter=true']
      }
    },
    baseUrl: 'https://www.gapminder.org',
    useAllAngular2AppRoots: true,
    allScriptsTimeout: 5000000,
    getPageTimeout: 10000,
    restartBrowserBetweenTests: false,
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
    browser.driver.manage().window().maximize();
browser.driver.get(browser.baseUrl);
browser.ignoreSynchronization = true;
const SpecReporter = require('jasmine-spec-reporter');
jasmine.getEnv().addReporter(new SpecReporter({displayStacktrace: 'all'}));
}
};
