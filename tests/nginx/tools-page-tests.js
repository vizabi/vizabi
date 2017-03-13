'use strict';

let ToolsPage = require('./../pages/tools-page');

let page;

beforeEach(function () {
  page = new ToolsPage();
});

it('should open tools page', (done) => {
  page.get();
  expect(browser.getCurrentUrl()).toEqual('http://tools-dev.gapminderdev.org/tools/#_locale_id=en;&chart-type=bubbles');
  done();
});

it('should open mountain chart', (done) => {
  page.get();
  page.openMountainChart();
  expect(browser.getCurrentUrl()).toEqual('http://tools-dev.gapminderdev.org/tools/#_locale_id=en;&chart-type=mountain');
  done();
});

it('should open bubble map chart', (done) => {
  page.get();
  page.openBubbleMapChart();
  expect(browser.getCurrentUrl()).toEqual('http://tools-dev.gapminderdev.org/tools/#_locale_id=en;&chart-type=map');
  done();
});

it('should open bar rank chart', (done) => {
  page.get();
  page.openBarrankChart();
  expect(browser.getCurrentUrl()).toEqual('http://tools-dev.gapminderdev.org/tools/#_locale_id=en;&chart-type=barrank');
  done();
});

it('should open line chart', (done) => {
  page.get();
  page.openLineChart();
  expect(browser.getCurrentUrl()).toEqual('http://tools-dev.gapminderdev.org/tools/#_locale_id=en;&chart-type=linechart');
  done();
});

