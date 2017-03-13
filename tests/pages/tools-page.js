'use strict';

const EC = protractor.ExpectedConditions;

let ToolsPage = function() {
  let mountainChart = element(by.css('a[href*="mountain"]'));
  let bubblemapChart = element(by.css('a[href*="map"]'));
  let barrankChart = element(by.css('a[href*="barrank"]'));
  let lineChart = element(by.css('a[href*="linechart"]'));
  let headerImage = element(by.css('app-header > div > a'));
  let buttonPlay = element(by.css('button.vzb-ts-btn-play.vzb-ts-btn > svg'));

  this.get = function() {
    browser.driver.manage().window().maximize();
    browser.ignoreSynchronization = true;
    browser.get(browser.baseUrl);
    browser.waitForAngular();
    this.waitForLogosDisplayed();
  };

  this.openMountainChart = function() {
    mountainChart.click();
    this.waitForLogosDisplayed();
  };

  this.openBubbleMapChart = function() {
    bubblemapChart.click();
    this.waitForLogosDisplayed();
  };

  this.openBarrankChart = function() {
    barrankChart.click();
    this.waitForLogosDisplayed();
  };

  this.openLineChart = function() {
    lineChart.click();
    this.waitForLogosDisplayed();
  };

  this.waitForLogosDisplayed = function() {
    browser.wait(EC.visibilityOf(headerImage));
    browser.wait(EC.visibilityOf(buttonPlay));
  };
};

module.exports = ToolsPage;
