describe('Web - Vizabi e2e test :: Line Chart', function() {

  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000;
  browser.manage().window().setSize(1100, 600);

  var baseUrl = 'http://localhost:9000/preview/';
  var EC = protractor.ExpectedConditions;

  // Base Selectors

  var buttonPlay = element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-timeslider > div > div.vzb-ts-btns > button.vzb-ts-btn-play.vzb-ts-btn > svg"));
  var countries = element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg > g > svg > svg.vzb-lc-lines"));
  var buttonList = element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-buttonlist"));

  it('Loading Line Chart Page', function() {

    browser.get(baseUrl + "linechart.html");

    // Check that elements were loaded

    browser.wait(EC.visibilityOf(buttonPlay), 60000, "Chart is not Loaded");
    browser.sleep(1500);

    // Check that Chart was loaded and Ready

    buttonPlay.isDisplayed().then(function(visibility) {
      expect(visibility).toBe(true);
    });

    // Check that country is displaying on Chart

    countries.all(by.tagName('path')).then(function(items) {
      expect(items.length).not.toBe(0);
    });

    // Check that navigate buttons are available

    var buttonListAll = buttonList.all(by.tagName('button'));
    var buttonListVisible = buttonList.all(by.tagName('button')).filter(function(element){
      return element.isDisplayed().then(function(visibility) {
        return !!visibility;
      });
    });

    buttonListAll.then(function(items) {
      expect(items.length).toBe(5);
    });

    buttonListVisible.then(function(items) {
      expect(items.length).toBe(5);
    });

  });

});
