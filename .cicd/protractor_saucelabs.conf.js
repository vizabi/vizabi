/**
 * Created by tvaleriy on 9/6/16.
 */
'use strict';

exports.config = {
  sauceUser: process.env.SAUCE_USERNAME,
  sauceKey: process.env.SAUCE_ACCESS_KEY,
  specs: [
    '../tests/nginx/*.js'
  ],
  capabilities: {
    browserName: 'chrome',
    version: "53.0",
    platform: "windows 10"
  },
  onPrepare: () => {
    browser.driver.manage().window().maximize();
  },
  onComplete: function() {
    var printSessionId = function(jobName){
      browser.getSession().then(function(session) {
        console.log('SauceOnDemandSessionID=' + session.getId() + ' job-name=' + jobName);
      });
    }
    printSessionId("Insert Job Name Here");
  }
}
