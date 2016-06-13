describe('Web - Vizabi e2e test :: Bubble Map Chart', function() {
    
  var testData = require('../../pageObjects.json');
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000;
  browser.manage().window().setSize(1100, 600);

  var baseUrl = 'http://localhost:9000/preview/';
  var baseChartUrl = baseUrl + "bubblemap.html#_width:750&height:650&fullscreen:true&resp-sect:true&info-sect:true&butt-sect:true";
  var EC = protractor.ExpectedConditions;
    testData.forEach( function (data) {

  // Base Selectors

  var buttonPlay = element(by.css(data.All_Global_Loctors.buttonPlay_Locator_CSS));
  var countries = element(by.css(data.bubbleMap_Chart_Loctors.countriesBubbleMap_Locator_CSS));
  var buttonList = element(by.css(data.All_Global_Loctors.buttonList_Locator_CSS));

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

 // ***************************** BUBBLE MAP *************************************

  var play = element(by.css(data.All_Global_Loctors.play_Locator_CSS));
  var pause = element(by.css(data.All_Global_Loctors.pause_Locator_CSS));
  var slider = element(by.css(data.All_Global_Loctors.slider_Locator_CSS));
  var USABubbleMap = element(by.css(data.bubbleMap_Chart_Loctors.USABubbleMap_Locator_CSS));
  var chinaBubbleMap =element(by.css(data.bubbleMap_Chart_Loctors.chinaBubbleMap_Locator_CSS));

  // I can select and deselect countries using the button "Find" to the right.

  it('Findmap',function(){
    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(play), 60000 , "Chart is not Loaded");

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

    // Remove Text
    search.clear();

    // Place Text in Search / Find Field
    browser.wait(EC.visibilityOf(search), 5000).then(function(){
      search.sendKeys("united states");
    });

    // Check United States Text Box
    var USABubble =element(by.css(data.bubbleMap_Chart_Loctors.USABubbleCheckbox_Locator_CSS));
    browser.wait(EC.visibilityOf(USABubble), 5000).then(function(){
      USABubble.click();
    });

    // Remove Text
    search.clear();


    //clicking ok
    var ok =element(by.css(data.bubbleMap_Chart_Loctors.okOfFind_Locator_CSS));
    browser.wait(EC.visibilityOf(ok), 5000).then(function(){
      ok.click();
    });

    // Getting USA opacity value
    var USA =element(by.css(data.bubbleMap_Chart_Loctors.USABubbleMap_Locator_CSS));
    browser.wait(EC.visibilityOf(USA), 5000);
    USA.getCssValue('opacity').then(function(USAOpacityAsParameter){
      var USAOpacity = USAOpacityAsParameter;

      // Getting Nigeria Opacity value
      var nga =element(by.css(data.bubbleMap_Chart_Loctors.NigeriaBubbleMap_Locator_CSS));
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
    browser.wait(EC.visibilityOf(play), 60000 , "Chart is not Loaded");

    // Hovering the China Bubble
    browser.wait(EC.visibilityOf(chinaBubbleMap), 5000);
    browser.actions().mouseMove(chinaBubbleMap).perform();
    var findMe = "China";

    // Getting attributes of Tooltip
    var tooltip = browser.element(by.css(data.bubbleMap_Chart_Loctors.tooltipOfchinaBubbleMap_Locator_CSS));
    browser.wait(EC.visibilityOf(tooltip), 5000);
    tooltip.getText().then(function (tooltipAsParameter) {
      var tooltipText = tooltipAsParameter;

      // Comparing the country name
      expect(tooltipText).toBe(findMe);
    });
  });


  //  Clicking the bubble of the United States should select it. The bubble
  //  gets full opacity, while the other bubbles get lower opacity.
   

   it('OpacityMap',function(){
    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(play), 60000 , "Chart is not Loaded");

    // Clicking the bubble of USA
    browser.wait(EC.visibilityOf(USABubbleMap), 5000).then(function(){
      USABubbleMap.click();
    });

    // Getting USA opacity value
    browser.wait(EC.visibilityOf(USABubbleMap), 5000);
    USABubbleMap.getCssValue('opacity').then(function(USAOpacityAsParameter){
      var USAOpacity=USAOpacityAsParameter;
        
      // Getting China Opacity value
      browser.wait(EC.visibilityOf(chinaBubbleMap), 5000);
      chinaBubbleMap.getCssValue('opacity').then(function(chinaBubbleMapAsParameter){
        var chinaBubbleMapOpacity=chinaBubbleMapAsParameter;

        // Comparing the opacities
        expect(USAOpacity).not.toEqual(chinaBubbleMapOpacity);
      });
    });
  });


  // I can drag the label "United States" and drop it anywhere in the chart area

  it('DragLabelMap', function(){
    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(play), 60000 , "Chart is not Loaded");

    //Clicking USA bubble
    browser.wait(EC.visibilityOf(USABubbleMap), 5000).then(function(){
      USABubbleMap.click();
    });
    //Getting tooltip text before drag
    var USALabel =element(by.css(data.bubbleMap_Chart_Loctors.tooltipOfUSABubbleMap_Locator_CSS));
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

 
  //  I can unselect the bubble by clicking on the "x" of the label
  //  "United States", or by clicking on the bubble
   

  it('CrossLabelMap',function(){
    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(play), 60000 , "Chart is not Loaded");

    // Clicking the US bubble
    browser.wait(EC.visibilityOf(USABubbleMap), 5000).then(function(){
      USABubbleMap.click();
    });

    //Unselectiong the US bubble by clikcing bubble
    browser.wait(EC.visibilityOf(USABubbleMap), 5000).then(function(){
      USABubbleMap.click();
    });

    // Clicking the US bubble again
      USABubbleMap.click();


    //Hovering the label to get cross
    var tooltip= element(by.css(data.bubbleMap_Chart_Loctors.tooltipOfUSABubbleMap_Locator_CSS));
    browser.wait(EC.visibilityOf(tooltip), 5000);
    browser.actions().mouseMove(tooltip).perform();

    // Unselect country by click
    var cross = element(by.css(data.bubbleMap_Chart_Loctors.crossOnTooltipOfUSABubbleMap_Locator_CSS));
    browser.wait(EC.visibilityOf(cross), 5000);
    browser.actions().mouseMove(cross).click().perform();
  });

    
       
  // bubbles react on hover
   
  it('BubbleMapHover', function() {
    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(play), 60000 , "Chart is not Loaded");

    // Hovering the China Bubble
    browser.wait(EC.visibilityOf(chinaBubbleMap), 5000);
    browser.actions().mouseMove(chinaBubbleMap).perform();

    // Getting attributes of Tooltip
    var tooltip = browser.element(by.css(data.bubbleMap_Chart_Loctors.tooltipOfchinaBubbleMap_Locator_CSS));
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
    browser.wait(EC.visibilityOf(play), 60000 , "Chart is not Loaded");

    //Bubble size before play
   USABubbleMap.getCssValue("r").then(function (USAAsParameter) {
      var heightBefore = USAAsParameter;

      //Clicking play
      browser.wait(EC.visibilityOf(play), 5000).then(function(){
        play.click();
        browser.sleep(3000);
      });

      //Clicking paus
      browser.wait(EC.visibilityOf(pause), 5000).then(function(){
        pause.click();
      });

      //Bubble size after play ang before drag
      USABubbleMap.getAttribute("r").then(function (USAAsParameter1) {
        var heightAfter = USAAsParameter1;

        //Comparing sizes
        expect(heightBefore).not.toEqual(heightAfter);

        //Getting the location of slider ball before darg
        slider.getLocation().then(function (sliderAsParameter) {
          var positionBefore = sliderAsParameter.x;

          //Dragging the slider ball
          browser.actions().dragAndDrop(slider,{x:500,y:10}).click().perform();

          //Bubble size after drag
          USABubbleMap.getAttribute("r").then(function (USAAsParameter11) {
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
    browser.wait(EC.visibilityOf(play), 60000 , "Chart is not Loaded");


    // Clicking size icon
    var size = browser.element(by.css(data.bubbleMap_Chart_Loctors.sizeIcon_Locator_CSS));
    browser.wait(EC.visibilityOf(size), 5000).then(function(){
      size.click();
    });

    //Bubble size before dargging
    USABubbleMap.getSize().then(function (USAAsParameter) {
      var heightBefore = USAAsParameter.height;

      // dargging minimum pointer to the maximum
      var sliderOfSize = browser.element(by.css(data.bubbleMap_Chart_Loctors.sliderOfSize_Locator_CSS));
      browser.wait(EC.visibilityOf(sliderOfSize), 5000);
      browser.actions().dragAndDrop(sliderOfSize,{x:100,y:0}).click().perform();

      //Bubble size after dargging
      USABubbleMap.getSize().then(function (USAAsParameter1) {
        var heightAfter = USAAsParameter1.height;

        //clicking OK
        var ok = browser.element(by.css(data.bubbleMap_Chart_Loctors.okOfSizePopup_Locator_CSS));
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
    browser.wait(EC.visibilityOf(play), 60000 , "Chart is not Loaded");

    //Hovering USA bubble element
    browser.wait(EC.visibilityOf(USABubbleMap), 5000);
    browser.actions().mouseMove(USABubbleMap).perform();

    // Getting attributes of population
    var population = browser.element(by.css(data.bubbleMap_Chart_Loctors.population_Locator_CSS));
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
});
