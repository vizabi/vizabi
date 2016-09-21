/**
 * Created by tvaleriy on 8/30/16.
 */
/*eslint-env protractor, jasmine */
'use strict';
const EC = protractor.ExpectedConditions;
const timeout = 5000;
function logos () {
  browser.wait(EC.visibilityOf(element(by.css('#logo > a:nth-child(1) > img'))));
  browser.wait(EC.visibilityOf(element(by.css('#footer-logo'))));
}
function logos2 () {
  browser.wait(EC.visibilityOf(element(by.css('body > div.wrapper > div.header > a'))));
  browser.wait(EC.visibilityOf(element(by.css('#vizabi-placeholder > div > div.vzb-tool-stage > ' +
    'div.vzb-tool-timeslider > div > div.vzb-ts-btns > button.vzb-ts-btn-play.vzb-ts-btn > svg'))));

  browser.wait(EC.visibilityOf(element(by.css('body > div.wrapper > div.header > a'))));
  browser.wait(EC.visibilityOf(element(by.css('#vizabi-placeholder > div > div.vzb-tool-stage > ' +
    'div.vzb-tool-timeslider > div > div.vzb-ts-btns > button.vzb-ts-btn-play.vzb-ts-btn > svg'))));
}
function logos3 () {
  browser.wait(EC.visibilityOf(element(by.css('#logo > a:nth-child(1) > img'))));
  browser.wait(EC.visibilityOf(element(by.css('#footer-logo'))));
}
function logos4 () {
  browser.wait(EC.visibilityOf(element(by.css('body > div:nth-child(2) > div:nth-child(1) > nav > div > ' +
    'div.navbar-header > a > logo > span'))));
  browser.wait(EC.visibilityOf(element(by.css('body > div:nth-child(2) > footer > footer > div > div.footer-top' +
    ' > div.top-primary > a:nth-child(2) > logo > span'))));
}
function load () {
  browser.ignoreSynchronization=true;
  browser.driver.get('http://gapminder.org/tools');
  browser.waitForAngular();
}
const about = element(by.css('body > div.wrapper > div.header > ' +
  'ul.nav.navbar-nav.navbar-nav-left.desktop.ng-isolate-scope > li > div:nth-child(3) > a'));
const facts = element(by.css('body > div.wrapper > div.header > ' +
  'ul.nav.navbar-nav.navbar-nav-left.desktop.ng-isolate-scope > li > div:nth-child(1) > a'));
const forteachers = element(by.css('body > div.wrapper > div.header > ' +
  'ul.nav.navbar-nav.navbar-nav-left.desktop.ng-isolate-scope > li > div:nth-child(2) > a'));
describe('checking redirecting', () => {
  it('should open https://www.gapminder.org', (done) => {
    browser.ignoreSynchronization = true;
    browser.get('https://www.gapminder.org');
    logos();
    expect(browser.getCurrentUrl()).toEqual('https://www.gapminder.org/');
    done();
  });
  it('redirect https://www.gapminder.org/ to https://www.gapminder.org', (done) => {
    browser.ignoreSynchronization = true;
    browser.get('https://www.gapminder.org/');
    logos();
    expect(browser.getCurrentUrl()).toEqual('https://www.gapminder.org/');
    done();
  });
  it('redirect http://www.gapminder.org to https://www.gapminder.org', (done) => {
    browser.ignoreSynchronization = true;
    browser.get('http://www.gapminder.org');
    logos();
    expect(browser.getCurrentUrl()).toEqual('https://www.gapminder.org/');
    done();
  });
  it('redirect http://www.gapminder.org/ to https://www.gapminder.org', (done) => {
    browser.ignoreSynchronization = true;
    browser.get('http://www.gapminder.org/');
    logos();
    expect(browser.getCurrentUrl()).toEqual('https://www.gapminder.org/');
    done();
  });
  it('redirect https://gapminder.org to https://www.gapminder.org', (done) => {
    browser.ignoreSynchronization = true;
    browser.get('https://gapminder.org');
    logos();
    expect(browser.getCurrentUrl()).toEqual('https://www.gapminder.org/');
    done();
  });
  it('redirect http://gapminder.org to https://www.gapminder.org', (done) => {
    browser.ignoreSynchronization = true;
    browser.get('http://gapminder.org');
    logos();
    expect(browser.getCurrentUrl()).toEqual('https://www.gapminder.org/');
    done();
  });
  it('redirect http://gapminder.org to https://www.gapminder.org', (done) => {
    browser.ignoreSynchronization = true;
    browser.get('http://gapminder.org');
    logos();
    expect(browser.getCurrentUrl()).toEqual('https://www.gapminder.org/');
    done();
  });
  it('redirect https://www.gapminder.org/tools to https://www.gapminder.org/tools/#_chart-type=bubbles', (done) => {
    browser.get('https://www.gapminder.org/tools');
    logos2();
    expect(browser.getCurrentUrl()).toContain('chart-type=bubbles');
    done();
  });
  it('redirect http://www.gapminder.org/tools to https://www.gapminder.org/tools/#_chart-type=bubbles', (done) => {
    browser.get('http://www.gapminder.org/tools');
    logos2();
    expect(browser.getCurrentUrl()).toContain('chart-type=bubbles');
    done();
  });
  it('redirect https://gapminder.org/tools to https://www.gapminder.org/tools/#_chart-type=bubbles', (done) => {
    browser.get('https://gapminder.org/tools');
    logos2();
    expect(browser.getCurrentUrl()).toContain('chart-type=bubbles');
    done();
  });
  it('redirect http://gapminder.org/tools to https://www.gapminder.org/tools/#_chart-type=bubbles', (done) => {
    browser.get('http://gapminder.org/tools');
    logos2();
    expect(browser.getCurrentUrl()).toContain('chart-type=bubbles');
    done();
  });
  it('redirect https://www.gapminder.org/tools/ to https://www.gapminder.org/tools/#_chart-type=bubbles', (done) => {
    browser.get('https://www.gapminder.org/tools/');
    logos2();
    expect(browser.getCurrentUrl()).toContain('chart-type=bubbles');
    done();
  });
  it('redirect http://www.gapminder.org/tools/ to https://www.gapminder.org/tools/#_chart-type=bubbles', (done) => {
    browser.get('http://www.gapminder.org/tools/');
    logos2();
    expect(browser.getCurrentUrl()).toContain('chart-type=bubbles');
    done();
  });
  it('redirect https://gapminder.org/tools/ to https://www.gapminder.org/tools/#_chart-type=bubbles', (done) => {
    browser.get('https://gapminder.org/tools/');
    logos2();
    expect(browser.getCurrentUrl()).toContain('chart-type=bubbles');
    done();
  });
  it('redirect http://gapminder.org/tools/ to https://www.gapminder.org/tools/#_chart-type=bubbles', (done) => {
    browser.get('http://gapminder.org/tools/');
    logos2();
    expect(browser.getCurrentUrl()).toContain('chart-type=bubbles');
    done();
  });
  it('redirect https://www.gapminder.org/tools/bubbles to https://www.gapminder.org/tools/#_chart-type=bubbles',
    (done) => {
    browser.get('https://www.gapminder.org/tools/bubbles');
    logos2();
    expect(browser.getCurrentUrl()).toContain('chart-type=bubbles');
    done();
  });
  it('redirect http://www.gapminder.org/tools/bubbles to https://www.gapminder.org/tools/#_chart-type=bubbles',
    (done) => {
    browser.get('http://www.gapminder.org/tools/bubbles');
    logos2();
    expect(browser.getCurrentUrl()).toContain('chart-type=bubbles');
    done();
  });
  it('redirect https://gapminder.org/tools/bubbles to https://www.gapminder.org/tools/#_chart-type=bubbles', (done) => {
    browser.get('https://gapminder.org/tools/bubbles');
    logos2();
    expect(browser.getCurrentUrl()).toContain('chart-type=bubbles');
    done();
  });
  it('redirect http://gapminder.org/tools/bubbles to https://www.gapminder.org/tools/#_chart-type=bubbles', (done) => {
    browser.get('http://gapminder.org/tools/bubbles');
    logos2();
    expect(browser.getCurrentUrl()).toContain('chart-type=bubbles');
    done();
  });
  it('redirect https://www.gapminder.org/tools/bubbles/ to https://www.gapminder.org/tools/#_chart-type=bubbles',
    (done) => {
    browser.get('https://www.gapminder.org/tools/bubbles/');
    logos2();
    expect(browser.getCurrentUrl()).toContain('chart-type=bubbles');
    done();
  });
  it('redirect http://www.gapminder.org/tools/bubbles/ to https://www.gapminder.org/tools/#_chart-type=bubbles',
    (done) => {
    browser.get('http://www.gapminder.org/tools/bubbles/');
    logos2();
    expect(browser.getCurrentUrl()).toContain('chart-type=bubbles');
    done();
  });
  it('redirect https://gapminder.org/tools/bubbles/ to https://www.gapminder.org/tools/#_chart-type=bubbles',
    (done) => {
    browser.get('https://gapminder.org/tools/bubbles/');
    logos2();
    expect(browser.getCurrentUrl()).toContain('chart-type=bubbles');
    done();
  });
  it('redirect http://gapminder.org/tools/bubbles/ to https://www.gapminder.org/tools/#_chart-type=bubbles', (done) => {
    browser.get('http://gapminder.org/tools/bubbles/');
    logos2();
    expect(browser.getCurrentUrl()).toContain('chart-type=bubbles');
    done();
  });
  it('redirect https://www.gapminder.org/tools/#_chart-type=bubbles to https://www.gapminder.org/tools/' +
    '#_chart-type=bubbles', (done) => {
    browser.get('https://www.gapminder.org/tools/#_chart-type=bubbles');
    logos2();
    expect(browser.getCurrentUrl()).toContain('chart-type=bubbles');
    done();
  });
  it('redirect http://www.gapminder.org/tools/#_chart-type=bubbles to https://www.gapminder.org/tools/' +
    '#_chart-type=bubbles', (done) => {
    browser.get('http://www.gapminder.org/tools/#_chart-type=bubbles');
    logos2();
    expect(browser.getCurrentUrl()).toContain('chart-type=bubbles');
    done();
  });
  it('redirect https://gapminder.org/tools/#_chart-type=bubbles to https://www.gapminder.org/tools/' +
    '#_chart-type=bubbles', (done) => {
    browser.get('https://gapminder.org/tools/#_chart-type=bubbles');
    logos2();
    expect(browser.getCurrentUrl()).toContain('chart-type=bubbles');
    done();
  });
  it('redirect http://gapminder.org/tools/#_chart-type=bubbles to https://www.gapminder.org/tools/' +
    '#_chart-type=bubbles', (done) => {
    browser.get('http://gapminder.org/tools/#_chart-type=bubbles');
    logos2();
    expect(browser.getCurrentUrl()).toContain('chart-type=bubbles');
    done();
  });
});
describe('checking Teach menu items', () => {
  it('should open for-teachers page', (done) => {
    load();
    logos2();
    forteachers.click();
    element(by.css('body > div.wrapper > div.header > ul.nav.navbar-nav.navbar-nav-left.desktop.ng-isolate-scope' +
      ' > li > div:nth-child(2) > div > div > div > ul > li:nth-child(1) > a > div.column-item-info' +
      ' > div.column-item-heading')).click();
    logos3();
    expect(browser.getCurrentUrl()).toEqual('https://www.gapminder.org/for-teachers/');
    done();
  });
  it('should open workshops page', (done) => {
    load();
    logos2();
    forteachers.click();
    element(by.css('body > div.wrapper > div.header > ul.nav.navbar-nav.navbar-nav-left.desktop.ng-isolate-scope' +
      ' > li > div:nth-child(2) > div > div > div > ul > li:nth-child(3) > a' +
      ' > div.column-item-info > div.column-item-heading.ng-binding')).click();
    logos4();
    expect(browser.getCurrentUrl()).toEqual('http://www.gapminder.org/workshops/');
    done();
  });
  it('should open slideshows page', (done) => {
    load();
    logos2();
    forteachers.click();
    element(by.css('body > div.wrapper > div.header > ul.nav.navbar-nav.navbar-nav-left.desktop.ng-isolate-scope' +
      ' > li > div:nth-child(2) > div > div > div > ul > li:nth-child(2) > a > div.column-item-icon > img')).click();
    logos4();
    expect(browser.getCurrentUrl()).toEqual('http://www.gapminder.org/slideshows/');
    done();
  });
  it('should open test questions page', (done) => {
    load();
    logos2();
    forteachers.click();
    element(by.css('body > div.wrapper > div.header > ul.nav.navbar-nav.navbar-nav-left.desktop.ng-isolate-scope' +
      ' > li > div:nth-child(2) > div > div > div > ul > li:nth-child(4) > a > div.column-item-icon > img')).click();
    logos4();
    expect(browser.getCurrentUrl()).toEqual('http://www.gapminder.org/test-questions/');
    done();
  });
});
describe('checking Facts menu items', () => {
  it('should open bubble-chart page', (done) => {
    load();
    logos2();
    facts.click();
    element(by.css('body > div.wrapper > div.header > ul.nav.navbar-nav.navbar-nav-left.desktop.ng-isolate-scope' +
      ' > li > div:nth-child(1) > div > div > div > ul > li:nth-child(1) > a > div.column-item-icon > img')).click();
    logos3();
    expect(browser.getCurrentUrl()).toContain('https://www.gapminder.org/world/');
    done();
  });
  it('should open massive ignorance page', (done) => {
    load();
    logos2();
    facts.click();
    element(by.css('body > div.wrapper > div.header > ul.nav.navbar-nav.navbar-nav-left.desktop.ng-isolate-scope' +
      ' > li > div:nth-child(1) > div > div > div > ul > li:nth-child(3) > a > div.column-item-icon > img')).click();
    logos3();
    expect(browser.getCurrentUrl()).toEqual('https://www.gapminder.org/ignorance/');
    done();
  });
  it('should open answers page', (done) => {
    load();
    logos2();
    facts.click();
    element(by.css('body > div.wrapper > div.header > ul.nav.navbar-nav.navbar-nav-left.desktop.ng-isolate-scope' +
      ' > li > div:nth-child(1) > div > div > div > ul > li:nth-child(2) > a > div.column-item-icon > img')).click();
    browser.wait(EC.visibilityOf(element(by.css('body > div > div:nth-child(1) > nav > div > div.navbar-header' +
      ' > a > logo > span'))));
    browser.wait(EC.visibilityOf(element(by.css('body > div > footer > footer > div > div.footer-top > ' +
      'div.top-primary > a:nth-child(2) > logo > span'))));
    expect(browser.getCurrentUrl()).toEqual('http://www.gapminder.org/answers/');
    done();
  });
  it('should open data page', (done) => {
    load();
    logos2();
    facts.click();
    element(by.css('body > div.wrapper > div.header > ul.nav.navbar-nav.navbar-nav-left.desktop.ng-isolate-scope' +
      ' > li > div:nth-child(1) > div > div > div > ul > li:nth-child(4) > a > div.column-item-icon > img')).click();
    logos3();
    expect(browser.getCurrentUrl()).toEqual('https://www.gapminder.org/data/');
    done();
  })
});
describe('checking About menu items', () => {
  it('should open our organization page', (done) => {
    load();
    logos2();
    about.click();
    element(by.css('body > div.wrapper > div.header > ul.nav.navbar-nav.navbar-nav-left.desktop.ng-isolate-scope' +
      ' > li > div:nth-child(3) > div > div > div > ul > li:nth-child(1) > a > div.column-item-icon > img')).click();
    logos3();
    expect(browser.getCurrentUrl()).toContain('https://www.gapminder.org/about-gapminder/');
    done();
  });
  it('should open faq page', (done) => {
    load();
    logos2();
    about.click();
    element(by.css('body > div.wrapper > div.header > ul.nav.navbar-nav.navbar-nav-left.desktop.ng-isolate-scope' +
      ' > li > div:nth-child(3) > div > div > div > ul > li:nth-child(3) > a > div.column-item-icon > img')).click();
    logos3();
    expect(browser.getCurrentUrl()).toEqual('https://www.gapminder.org/faq_frequently_asked_questions/');
    done();
  });
  it('should open news page', (done) => {
    load();
    logos2();
    about.click();
    element(by.css('body > div.wrapper > div.header > ul.nav.navbar-nav.navbar-nav-left.desktop.ng-isolate-scope' +
      ' > li > div:nth-child(3) > div > div > div > ul > li:nth-child(2) > a > div.column-item-icon > img')).click();
    logos3();
    expect(browser.getCurrentUrl()).toEqual('https://www.gapminder.org/news/');
    done();
  });
  it('should open open license page', (done) => {
    load();
    logos2();
    about.click();
    element(by.css('body > div.wrapper > div.header > ul.nav.navbar-nav.navbar-nav-left.desktop.ng-isolate-scope' +
      ' > li > div:nth-child(3) > div > div > div > ul > li:nth-child(4) > a > div.column-item-icon > img')).click();
    logos4();
    expect(browser.getCurrentUrl()).toEqual('http://www.gapminder.org/free-material/');
    done();
  })
});
