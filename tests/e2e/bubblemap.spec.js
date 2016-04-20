describe('Web - Vizabi e2e test :: Bubble Map Chart', function() {

  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000;
  browser.manage().window().setSize(1100, 750);

  var baseUrl = 'http://localhost:9000/preview/';
  var baseChartUrl = baseUrl + "bubblemap.html#_width:750&height:650&fullscreen:true&resp-sect:true&info-sect:true&butt-sect:true";
  var EC = protractor.ExpectedConditions;

  // Base Selectors

  var buttonPlay = element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-timeslider > div > div.vzb-ts-btns > button.vzb-ts-btn-play.vzb-ts-btn > svg"));
  var countries = element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg.vzb-bubblemap-svg > g > g.vzb-bmc-bubbles"));
  var buttonList = element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-buttonlist"));

  it('Loading Bubble Map Page', function() {

    browser.get(baseChartUrl);

    // Check that elements were loaded

    browser.wait(EC.visibilityOf(buttonPlay), 60000, "Chart is not Loaded");

    // Check that Chart was loaded and Ready

    buttonPlay.isDisplayed().then(function(visibility) {
      expect(visibility).toBe(true);
    });

    // Check that country is displaying on Chart

    countries.all(by.tagName('circle')).then(function(items) {
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
      expect(items.length).toBe(6);
    });

    buttonListVisible.then(function(items) {
      expect(items.length).toBe(6);
    });

  });

  /***************************** BUBBLE MAP *************************************/

  var play = element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-timeslider > div > div.vzb-ts-btns > button.vzb-ts-btn-play.vzb-ts-btn"));
  var pause = element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-timeslider > div > div.vzb-ts-btns > button.vzb-ts-btn-pause.vzb-ts-btn"));
  var slider = element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-timeslider > div > div.vzb-ts-slider-wrapper > svg.vzb-ts-slider > g > g.vzb-ts-slider-slide > circle"));
  var USABubbleMap = element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg.vzb-bubblemap-svg > g > g.vzb-bmc-bubbles > circle:nth-child(3)"));

  // I can select and deselect countries using the button "Find" to the right.

  it('Findmap',function(){
    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(USABubbleMap), 60000 , "Chart is not Loaded");

    //Clicking find
    var find =element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-buttonlist > button:nth-child(2) > span.vzb-buttonlist-btn-icon.fa"));
    browser.wait(EC.visibilityOf(find), 5000).then(function(){
      find.click();
    });
    //Placing text in search field
    var search =element(by.css("#vzb-find-search"));
    browser.wait(EC.visibilityOf(search), 5000).then(function(){
      search.sendKeys("china");
    });

    // Check China Text Box
    var chinaBubble =element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-dialog-shadow.vzb-popup.vzb-active.notransition > div > div.vzb-dialog-content.vzb-dialog-content-fixed.vzb-dialog-scrollable > div > div:nth-child(44) > label"));
    browser.wait(EC.visibilityOf(chinaBubble), 5000).then(function(){
      chinaBubble.click();
    });

    // Remove Text
    search.clear();

    // Place Text in Search / Find Field
    browser.wait(EC.visibilityOf(search), 5000).then(function(){
      search.sendKeys("united states");
    });

    // Check United States Text Box
    var USABubble =element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-dialog-shadow.vzb-popup.vzb-active.notransition > div > div.vzb-dialog-content.vzb-dialog-content-fixed.vzb-dialog-scrollable > div > div:nth-child(240) > label"));
    browser.wait(EC.visibilityOf(USABubble), 5000).then(function(){
      USABubble.click();
    });

    // Remove Text
    search.clear();


    //clicking ok
    var ok =element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-dialog-shadow.vzb-popup.vzb-active.notransition > div > div.vzb-dialog-buttons > div.vzb-dialog-button.vzb-label-primary > span"));
    browser.wait(EC.visibilityOf(ok), 5000).then(function(){
      ok.click();
    });

    // Getting USA opacity value
    var USA =element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg.vzb-bubblemap-svg > g > g.vzb-bmc-bubbles > circle:nth-child(3)"));
    browser.wait(EC.visibilityOf(USA), 5000);
    USA.getCssValue('opacity').then(function(USAOpacityAsParameter){
      var USAOpacity = USAOpacityAsParameter;

      // Getting Nigeria Opacity value
      var nga =element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg.vzb-bubblemap-svg > g > g.vzb-bmc-bubbles > circle:nth-child(7)"));
      browser.wait(EC.visibilityOf(nga), 5000);
      nga.getCssValue('opacity').then(function(NGAOpacityAsParameter){
        var NGAOpacity = NGAOpacityAsParameter;

        // Comapring Opacities
        expect(NGAOpacity).toBeLessThan(USAOpacity);
      });
    });
  });

  // User can hover the bubbles with a cursor, the bubbles react to hovering
  // and a tooltip appears, and contains the country name.

  it('HoverMap', function(){

    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(USABubbleMap), 60000 , "Chart is not Loaded");

    // Hovering the China Bubble
    var china = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg.vzb-bubblemap-svg > g > g.vzb-bmc-bubbles > circle:nth-child(1)"));
    browser.wait(EC.visibilityOf(china), 5000);
    browser.actions().mouseMove(china).perform();
    var findMe = "China";

    // Getting attributes of Tooltip
    var tooltip = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg.vzb-bubblemap-svg > g > g.vzb-bmc-tooltip"));
    browser.wait(EC.visibilityOf(tooltip), 5000);
    tooltip.getText().then(function (tooltipAsParameter) {
      var tooltipText = tooltipAsParameter;

      // Comparing the country name
      expect(tooltipText).toBe(findMe);
    });
  });

  /*
   * Clicking the bubble of the United States should select it. The bubble
   * gets full opacity, while the other bubbles get lower opacity.
   */

  it('OpacityMap',function(){
    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(USABubbleMap), 60000 , "Chart is not Loaded");

    // Clicking the bubble of USA
    var USABubble = element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg.vzb-bubblemap-svg > g > g.vzb-bmc-bubbles > circle:nth-child(3)"));
    browser.wait(EC.visibilityOf(USABubble), 5000).then(function(){
      USABubble.click();
    });

    // Getting USA opacity value
    var USA = element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg.vzb-bubblemap-svg > g > g.vzb-bmc-bubbles > circle:nth-child(3)"));
    browser.wait(EC.visibilityOf(USA), 5000);
    USA.getCssValue('opacity').then(function(USAOpacityAsParameter){
      var USAOpacity=USAOpacityAsParameter;

      // Getting Nigeria Opacity value
      var nga = element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg.vzb-bubblemap-svg > g > g.vzb-bmc-bubbles > circle:nth-child(7)"));
      browser.wait(EC.visibilityOf(nga), 5000);
      nga.getCssValue('opacity').then(function(NGAOpacityAsParameter){
        var NGAOpacity=NGAOpacityAsParameter;

        // Comparing the opacities
        expect(USAOpacity).not.toEqual(NGAOpacity);
      });
    });
  });

  // I can drag the label "United States" and drop it anywhere in the chart area

  it('DragLabelMap', function(){
    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(USABubbleMap), 60000 , "Chart is not Loaded");

    //Clicking USA bubble
    var USABubble =element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg.vzb-bubblemap-svg > g > g.vzb-bmc-bubbles > circle:nth-child(3)"));
    browser.wait(EC.visibilityOf(USABubble), 5000).then(function(){
      USABubble.click();
    });
    //Getting tooltip text before drag
    var USALabel =element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg.vzb-bubblemap-svg > g > g.vzb-bmc-labels > g > rect"));
    browser.wait(EC.visibilityOf(USALabel), 5000);
    USALabel.getLocation().then(function(initiallocation){
      var initialLocationText = initiallocation.x;

      //Dragging tooltip
      browser.actions().dragAndDrop(USALabel, {x: -300, y: 40}).click().perform();
      browser.sleep(2000);

      //Getting tooltip text after drag
      USALabel.getLocation().then(function(finalLocationText){
        var finlocation = finalLocationText.x;

        //Comparing tooltip positios
        expect(initialLocationText).not.toEqual(finalLocationText);
      });
    });
  });

  /*
   * I can unselect the bubble by clicking on the "x" of the label
   * "United States", or by clicking on the bubble
   */

  it('CrossLabelMap',function(){
    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(USABubbleMap), 60000 , "Chart is not Loaded");

    // Clicking the US bubble
    var USABubble = element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg.vzb-bubblemap-svg > g > g.vzb-bmc-bubbles > circle:nth-child(3)"));
    browser.wait(EC.visibilityOf(USABubble), 5000).then(function(){
      USABubble.click();
    });

    //Unselectiong the US bubble by clikcing bubble
    browser.wait(EC.visibilityOf(USABubble), 5000).then(function(){
      USABubble.click();
    });

    // Clicking the US bubble again
    browser.wait(EC.visibilityOf(USABubble), 5000).then(function(){
      USABubble.click();
    });

    //Hovering the label to get cross
    var tooltip= element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg.vzb-bubblemap-svg > g > g.vzb-bmc-labels > g > rect"));
    browser.wait(EC.visibilityOf(tooltip), 5000);
    browser.actions().mouseMove(tooltip).perform();

    // Unselect country by click
    var cross = element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg.vzb-bubblemap-svg > g > g.vzb-bmc-labels > g > g"));
    browser.wait(EC.visibilityOf(cross), 5000);
    browser.actions().mouseMove(cross).click().perform();
  });

  /*
   * bubbles react on hover
   */

  it('BubbleMapHover', function() {
    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(USABubbleMap), 60000 , "Chart is not Loaded");

    // Hovering the China Bubble
    var china = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg.vzb-bubblemap-svg > g > g.vzb-bmc-bubbles > circle:nth-child(1)"));
    browser.wait(EC.visibilityOf(china), 5000);
    browser.actions().mouseMove(china).perform();

    // Getting attributes of Tooltip
    var tooltip = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg.vzb-bubblemap-svg > g > g.vzb-bmc-tooltip"));
    browser.wait(EC.visibilityOf(tooltip), 5000);
    tooltip.getText().then(function (tooltipAsParameter) {
      var tooltipText = tooltipAsParameter;

      // Comparing the country name
      var findMe = "China";
      expect(tooltipText).toBe(findMe);
    });
  });

  // The bubbles change size with timeslider drag and play

  it('BubbleMapdrag', function() {
    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(USABubbleMap), 60000 , "Chart is not Loaded");

    //USA bubble element
    var USA = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg.vzb-bubblemap-svg > g > g.vzb-bmc-bubbles > circle:nth-child(3)"));
    browser.wait(EC.visibilityOf(USA), 5000);

    //Bubble size before play
    USA.getCssValue("r").then(function (USAAsParameter) {
      var heightBefore = USAAsParameter;

      //Clicking play
      browser.wait(EC.visibilityOf(play), 5000).then(function(){
        play.click();
        browser.sleep(3000);
      });

      //Clicking pause
      var pause = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-timeslider > div > div.vzb-ts-btns > button.vzb-ts-btn-pause.vzb-ts-btn > svg"));
      browser.wait(EC.visibilityOf(pause), 5000).then(function(){
        pause.click();
      });

      //Bubble size after play ang before drag
      USA.getAttribute("r").then(function (USAAsParameter1) {
        var heightAfter = USAAsParameter1;

        //Comparing sizes
        expect(heightBefore).not.toEqual(heightAfter);

        //Getting the location of slider ball before darg
        slider.getLocation().then(function (sliderAsParameter) {
          var positionBefore = sliderAsParameter.x;

          //Dragging the slider ball
          browser.actions().dragAndDrop(slider,{x:500,y:10}).click().perform();

          //Bubble size after drag
          USA.getAttribute("r").then(function (USAAsParameter11) {
            var heightAfterDrag = USAAsParameter11;

            //Comparing sizes
            expect(heightAfterDrag).not.toEqual(heightAfter);

            //Getting the location of slider ball after drag
            slider.getLocation().then(function (sliderAsParameter1) {
              var positionAfter = sliderAsParameter1.x;

              //Comparing slider position
              expect(positionBefore).toBeLessThan(positionAfter);

            });
          });
        });
      });
    });
  });

  // the size is according to the scale

  it('Scale', function() {
    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(USABubbleMap), 60000 , "Chart is not Loaded");

    //USA bubble element
    var USA = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg.vzb-bubblemap-svg > g > g.vzb-bmc-bubbles > circle:nth-child(3)"));
    browser.wait(EC.visibilityOf(USA), 5000);

    // Clicking size icon
    var size = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-buttonlist > button:nth-child(3) > span.vzb-buttonlist-btn-icon.fa"));
    browser.wait(EC.visibilityOf(size), 5000).then(function(){
      size.click();
    });

    //Bubble size before dargging
    USA.getSize().then(function (USAAsParameter) {
      var heightBefore = USAAsParameter.height;

      // dargging minimum pointer to the maximum
      var sliderOfSize = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-dialog-shadow.vzb-popup.vzb-active.notransition > div > div.vzb-dialog-content > div > div > svg > g > g > g.resize.w.vzb-bs-slider-thumb > g"));
      browser.wait(EC.visibilityOf(sliderOfSize), 5000);
      browser.actions().dragAndDrop(sliderOfSize,{x:100,y:0}).click().perform();

      //Bubble size after dargging
      USA.getSize().then(function (USAAsParameter1) {
        var heightAfter = USAAsParameter1.height;

        //clicking OK
        var ok = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-dialog-shadow.vzb-popup.vzb-active.notransition > div > div.vzb-dialog-buttons"));
        browser.wait(EC.visibilityOf(ok), 5000);

        //Comparing sizes
        expect(heightBefore).toBeLessThan(heightAfter);

      });
    });
  });

  // While hovering, the chart title changes to show the exact values.

  it('HoverValueMap', function() {
    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(USABubbleMap), 60000 , "Chart is not Loaded");

    //Hovering USA bubble element
    var USA = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg.vzb-bubblemap-svg > g > g.vzb-bmc-bubbles > circle:nth-child(3)"));
    browser.wait(EC.visibilityOf(USA), 5000);
    browser.actions().mouseMove(USA).perform();

    // Getting attributes of population
    var population = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg.vzb-bubblemap-svg > g > g.vzb-bmc-axis-y-title"));
    browser.wait(EC.visibilityOf(population), 5000);
    population.getText().then(function (populationAsParameter) {
      var populationText = populationAsParameter;

      // Comparing the population
      var findMe = "322M";
      var populationInMillion = populationText.substring(6, 10);

      expect(findMe).toBe(populationInMillion);
    });
  });

});
