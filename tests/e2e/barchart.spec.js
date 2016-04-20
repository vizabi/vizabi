describe('Web - Vizabi e2e test :: Bar Chart', function() {

  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000;
  browser.manage().window().setSize(1100, 750);

  var baseUrl = 'http://localhost:9000/preview/';
  var EC = protractor.ExpectedConditions;

  // Base Selectors

  var buttonPlay = element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-timeslider > div > div.vzb-ts-btns > button.vzb-ts-btn-play.vzb-ts-btn > svg"));
  var countries = element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > svg > g > g.vzb-bc-bars"));
  var buttonList = element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-buttonlist"));

  it('Loading Bar Chart Page', function() {

    browser.get(baseUrl + "barchart.html");

    // Check that elements were loaded

    browser.wait(EC.visibilityOf(buttonPlay), 60000, "Chart is not Loaded");

    // Check that Chart was loaded and Ready

    buttonPlay.isDisplayed().then(function(visibility) {
      expect(visibility).toBe(true);
    });

    // Check that country is displaying on Chart

    countries.all(by.tagName('rect')).then(function(items) {
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
      expect(items.length).toBe(3);
    });

    buttonListVisible.then(function(items) {
      expect(items.length).toBe(3);
    });

  });

});
