describe('Web - Vizabi e2e test :: All', function() {

  var testData = require('../../pageObjects.json');    
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000;
  browser.manage().window().setSize(1100, 600);

  var baseUrl = 'http://localhost:9000/preview/';
  var baseUrlHash = "#_width:750&height:650&fullscreen:true&resp-sect:true&info-sect:true&butt-sect:true";

  testData.forEach( function (data) {
  var play = element(by.css(data.All_Global_Loctors.play_Locator_CSS));
  var pause = element(by.css(data.All_Global_Loctors.pause_Locator_CSS));
  var slider = element(by.css(data.All_Global_Loctors.slider_Locator_CSS));
  var USABubbleMap = element(by.css(data.bubbleMap_Chart_Loctors.USABubbleMap_Locator_CSS));
  var EC = protractor.ExpectedConditions;

  /***************************** All CHARTS *************************************/

  // On large screen there is a side panel with color controls and list of countries
  // Bubble Chart

  it('LargeScreenBubbleChart', function() {

    browser.get(baseUrl + "bubblechart.html" + baseUrlHash);
    browser.refresh();
    browser.wait(EC.visibilityOf(play), 120000 , "Chart is not Loaded");

    //Clicking Expand
    var expand =element(by.css(data.All_Charts_Loctors.expandIconBubble_Locator_CSS));
    browser.wait(EC.visibilityOf(expand), 5000);
    expand.click();
    browser.sleep(2000);

    // Getting attributes of color dropdown
    var colorOption = browser.element(by.css(data.All_Charts_Loctors.colorDropdownIcon_Locator_CSS));
    browser.wait(EC.visibilityOf(colorOption), 5000);
    colorOption.getText().then(function (colorOptionAsParameter) {
      var colorOptionText = colorOptionAsParameter;
      // Comparing the color option name
      var findMe = "World Region";
      expect(findMe).toBe(colorOptionText);
    });


    // Getting Afghnistan name under expanded find
    var afg = browser.element(by.css(data.All_Charts_Loctors.afgCheckboxLabel_Locator_CSS));
    browser.wait(EC.visibilityOf(afg), 5000);
    afg.getText().then(function (afgAsParameter) {
      var afgText = afgAsParameter;
      // Comparing the country name
      var findMeAfg = "Afghanistan";
      expect(findMeAfg).toBe(afgText);
    });


    // Getting attributes of size dropdown
    var sizeOption = browser.element(by.css(data.All_Charts_Loctors.sizeOptionLabel_Locator_CSS));
    browser.wait(EC.visibilityOf(sizeOption), 5000);
    sizeOption.getText().then(function (sizeOptionAsParameter) {
      var sizeOptionText = sizeOptionAsParameter;
      // Comparing the size option name
      var findMeSizeOption = "Population";
      expect(findMeSizeOption).toBe(sizeOptionText);
    });
  });

  // On large screen there is a side panel with color controls and list of countries
  // Mountain Chart

  it('LargeScreenMountainChart', function(){

    browser.get(baseUrl + "mountainchart.html" + baseUrlHash);
    browser.refresh();
    browser.wait(EC.visibilityOf(play), 120000 , "Chart is not Loaded");

    //Clicking Expand
    var expand =element(by.css(data.All_Charts_Loctors.expandIconMountain_Locator_CSS));
    browser.wait(EC.visibilityOf(expand), 5000);
    expand.click();
    browser.sleep(2000);


    // Getting attributes of color dropdown
    var colorOption = browser.element(by.css(data.All_Charts_Loctors.colorDropdownIcon_Locator_CSS));
    browser.wait(EC.visibilityOf(colorOption), 5000);
    colorOption.getText().then(function (colorOptionAsParameter) {
      var colorOptionText = colorOptionAsParameter;
      // Comparing the color option name
      var findMe = "World Region";
      expect(findMe).toBe(colorOptionText);
    });


    // Getting Afghnistan name under expanded find
    var afg = browser.element(by.css(data.All_Charts_Loctors.afgCheckboxLabel_Locator_CSS));
    browser.wait(EC.visibilityOf(afg), 5000);
    afg.getText().then(function (afgAsParameter) {
      var afgText = afgAsParameter;
      // Comparing the country name
      var findMeAfg = "Afghanistan";
      expect(findMeAfg).toBe(afgText);
    });


    // Getting attributes of stack options
    var stackOption = browser.element(by.css(data.All_Charts_Loctors.stackIconMountain_Locator_CSS));
    browser.wait(EC.visibilityOf(stackOption), 5000);
    stackOption.getText().then(function (stackOptionAsParameter) {
      var stackOptionText = stackOptionAsParameter;
      // Comparing the stack option name
      var findMestackOption = "World";
      expect(findMestackOption).toBe(stackOptionText);
    });

  });

  // On large screen there is a side panel with color controls and list of countries
  // Bubble Map Chart

  it('LargeScreenBubbleMapChart', function(){
    browser.get(baseUrl + "bubblemap.html" + baseUrlHash);
    browser.refresh();
    browser.wait(EC.visibilityOf(play), 120000 , "Chart is not Loaded");

    //Clicking Expand
    var expand =element(by.css(data.All_Charts_Loctors.expandIconBubbleMap_Locator_CSS));
    browser.wait(EC.visibilityOf(expand), 5000);
    expand.click();
    browser.sleep(2000);

    // Getting attributes of color dropdown
    var colorOption = browser.element(by.css(data.All_Charts_Loctors.colorDropdownIcon_Locator_CSS));
    browser.wait(EC.visibilityOf(colorOption), 5000);
    colorOption.getText().then(function (colorOptionAsParameter) {
      var colorOptionText = colorOptionAsParameter;
      // Comparing the color option name
      var findMe = "World Region";
      expect(findMe).toBe(colorOptionText);
    });


    // Getting Afghnistan name under expanded find
    var afg = browser.element(by.css(data.All_Charts_Loctors.afgCheckboxLabel_Locator_CSS));
    browser.wait(EC.visibilityOf(afg), 5000);
    afg.getText().then(function (afgAsParameter) {
      var afgText = afgAsParameter;
      // Comparing the country name
      var findMeAfg = "Afghanistan";
      expect(findMeAfg).toBe(afgText);
    });


    // Getting attributes of size dropdown
    var sizeOption = browser.element(by.css(data.All_Charts_Loctors.sizeOptionLabel_Locator_CSS));
    browser.wait(EC.visibilityOf(sizeOption), 5000);
    sizeOption.getText().then(function (sizeOptionAsParameter) {
      var sizeOptionText = sizeOptionAsParameter;
      // Comparing the size option name
      var findMeSizeOption = "Population";
      expect(findMeSizeOption).toBe(sizeOptionText);
    });

  });

  // URL persistency: set time slider to some point, refresh,
  // timeslider should keep the point you gave it, and chart should load at the state of that point
  // URL persistency: select a few entities, refresh, entities should be selected
  // Bubble Chart

  it('URLPersistencyBubbleChart', function() {
    browser.get(baseUrl + "bubblechart.html" + baseUrlHash);
    browser.refresh();
    browser.wait(EC.visibilityOf(play), 120000 , "Chart is not Loaded");

    //Clicking USA bubble
    var USABubble = element(by.css(data.bubble_Chart_Loctors.USA_Bubble_Locator_CSS));
    browser.wait(EC.visibilityOf(USABubble), 5000);
    browser.actions().mouseMove(USABubble).mouseMove({x:0, y:-15}).click().perform();

    //Clicking China bubble
    var chinaBubble = element(by.css(data.bubble_Chart_Loctors.China_Bubble_Locator_CSS));
    browser.wait(EC.visibilityOf(chinaBubble), 5000);
    browser.actions().mouseMove(chinaBubble).mouseMove({x:0, y:-30}).click().perform();

    //Clicking play
    browser.wait(EC.visibilityOf(play), 5000).then(function(){
      play.click();
    });

    //Clicking Pause
    browser.wait(EC.visibilityOf(pause), 5000).then(function(){
      pause.click();
    });

    //Dragging slider
    browser.actions().dragAndDrop(slider, {x:1000, y:0}).perform();
    browser.sleep(1000);
  });

  // URL persistency: set time slider to some point, refresh,
  // timeslider should keep the point you gave it, and chart should load at the state of that point
  // URL persistency: select a few entities, refresh, entities should be selected
  // Mountain Chart

  it('URLPersistencyMountainChart', function() {
    browser.get(baseUrl + "mountainchart.html" + baseUrlHash);
    browser.refresh();
    browser.wait(EC.visibilityOf(play), 120000 , "Chart is not Loaded");

    //Clicking find
    var find = browser.element(by.css(data.mountain_Chart_Loctors.findIcon_Locator_CSS));
    browser.wait(EC.visibilityOf(find), 5000).then(function(){
      find.click();
    });
    // Place Text in Search
    var search = browser.element(by.css(data.mountain_Chart_Loctors.searchOfFind_Locator_CSS));
    browser.wait(EC.visibilityOf(search), 5000).then(function(){
      search.sendKeys("china");
    });
    //Clicking China
    var china = browser.element(by.css(data.mountain_Chart_Loctors.chinaCheckboxFind_Locator_CSS));
    browser.wait(EC.visibilityOf(china), 5000).then(function(){
      china.click();
    });

    // Getting name from check box
    var chinaCheckBox = element(by.css(data.mountain_Chart_Loctors.chinaCheckboxText_Locator_CSS));
    browser.wait(EC.visibilityOf(chinaCheckBox), 5000);

    //Getting text from China check box
    chinaCheckBox.getText().then(function (chinaCheckBoxTextAsParameter) {
      var chinaCheckBoxText = chinaCheckBoxTextAsParameter;
      // Clicking OK of Find pop up
      var ok = browser.element(by.css(data.mountain_Chart_Loctors.okOnFindPopup_Locator_CSS));
      browser.wait(EC.visibilityOf(chinaCheckBox), 5000).then(function(){
        ok.click();
      });

      //Clicking play
      play.click();
      browser.sleep(5000);

      //clicking pause
      pause.click();
      browser.sleep(2000);
    });
  });

  // URL persistency: set time slider to some point, refresh,
  // timeslider should keep the point you gave it, and chart should load at the state of that point
  // URL persistency: select a few entities, refresh, entities should be selected
  // Bubble Map Chart

  it('URLPersistencyBubbleMapChart', function() {
    browser.get(baseUrl + "bubblemap.html" + baseUrlHash);
    browser.refresh();
    browser.wait(EC.visibilityOf(USABubbleMap), 60000 , "Chart is not Loaded");

    //Clicking find
    var find =element(by.css(data.bubbleMap_Chart_Loctors.find_Locator_CSS));
    browser.wait(EC.visibilityOf(find), 5000).then(function(){
      find.click();
    });
    //Placing text in search field
    var search =element(by.css(data.bubbleMap_Chart_Loctors.search_Locator_CSS));
    browser.wait(EC.visibilityOf(search), 5000).then(function(){
      search.sendKeys("china");
    });

    // Check China Text Box
    var chinaBubble =element(by.css(data.bubbleMap_Chart_Loctors.chinaBubbleCheckbox_Locator_CSS));
    browser.wait(EC.visibilityOf(chinaBubble), 5000).then(function(){
      chinaBubble.click();
    });

    //clicking ok
    var ok =element(by.css(data.bubbleMap_Chart_Loctors.okOfFind_Locator_CSS));
    browser.wait(EC.visibilityOf(ok), 5000).then(function(){
      ok.click();
    });

    //Clciking play
    play.click();
    browser.sleep(5000);

    //clicking pause
    pause.click();
    browser.sleep(2000);
  });

});
});
