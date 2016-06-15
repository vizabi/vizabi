describe('Web - Vizabi e2e test :: Line Chart', function() {

  var testData = require('../../pageObjects.json');    
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000;
  browser.manage().window().setSize(1100, 600);

  var baseUrl = 'http://localhost:9000/preview/';
  var EC = protractor.ExpectedConditions;
  testData.forEach( function (data) {

  // Base Selectors

  var buttonPlay = element(by.css(data.All_Global_Loctors.buttonPlay_Locator_CSS));
  var countries = element(by.css(data.line_Chart_Loctors.countriesLineChart_Locator_CSS));
  var buttonList = element(by.css(data.All_Global_Loctors.buttonList_Locator_CSS));

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
});