describe('Web - Vizabi e2e test :: Bubble Chart', function() {
    
    if(typeof require !== 'undefined') XLSX = require('xlsx');
var workbook = XLSX.readFile('CoreInteractions_Specs.xlsx');

	var worksheet   = workbook.SheetNames[0];
	var Bubble_Chart  = workbook.Sheets[worksheet];	


  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000;
  browser.manage().window().setSize(1100, 750);

  var baseUrl = 'http://localhost:9000/preview/';
  var baseChartUrl = baseUrl + "bubblechart.html#_width:750&height:650&fullscreen:true&resp-sect:true&info-sect:true&butt-sect:true";
  var EC = protractor.ExpectedConditions;

  // Base Selectors  
  var play = element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-timeslider > div > div.vzb-ts-btns > button.vzb-ts-btn-play.vzb-ts-btn"));

  var pause = element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-timeslider > div > div.vzb-ts-btns > button.vzb-ts-btn-pause.vzb-ts-btn"));
	
  var slider = element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-timeslider > div > div.vzb-ts-slider-wrapper > svg.vzb-ts-slider > g > g.vzb-ts-slider-slide > circle"));
    
    
  /***************************** BUBBLE CHART *************************************/
   
    
// If I select China and the United States bubbles and drag the timeslider,
// we see the trails being left for those two countries.

  it('MakeTrialsDrag', function() {

    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(play), 60000 , "Chart is not Loaded");

    //Clicking USA bubble
    var USABubble = element(by.css(Bubble_Chart['D6'].v));
    var USABubbleIsDisplayed = USABubble.isDisplayed();

//    browser.wait(EC.visibilityOf(USABubble), 5000).then(function(){
        browser.actions().mouseMove(USABubbleIsDisplayed).mouseMove({x:15, y:0}).click().perform();
//    });


    //Clicking China bubble
    var chinaBubble = element(by.css(Bubble_Chart['D7'].v));
    var chinaBubbleIsDisplayed = chinaBubble.isDisplayed();
//    browser.wait(EC.visibilityOf(chinaBubble), 5000).then(function(){
        browser.actions().mouseMove(chinaBubbleIsDisplayed).mouseMove({x:0, y:35}).click().perform();
//    });

    //Clicking play
    browser.wait(EC.visibilityOf(play), 5000).then(function(){
        play.click();
        browser.sleep(5000);
    });

    //Clicking Pause
    browser.wait(EC.visibilityOf(pause), 5000).then(function(){
        pause.click();
    });

    //Getting slider location before drag
    browser.wait(EC.visibilityOf(slider), 5000);
    slider.getLocation().then(function (beforePlaySliderLocation) {
        var beforePlaySliderDivLocation = beforePlaySliderLocation.x;
        //Dragging slider
        browser.driver.actions().dragAndDrop(slider, {x:200, y:5}).click().perform();

        //Getting slider location after drag
        slider.getLocation().then(function (afterPlaySliderLocation) {
            var afterPlaySliderDivLocation = afterPlaySliderLocation.x;
            //Comparing slider locations
            expect(afterPlaySliderDivLocation).toBeGreaterThan(beforePlaySliderDivLocation);
        });
     });
  });

    
// If I click on play when I'm on the year 2015, the time slider handle
  // moves,, and the bubbles change position. It pauses automatically when it reached the final year.

  it('Play', function() {

    //browser.removeMockModule('modName');
    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(play), 60000 , "Chart is not Loaded");

    // Getting year's 1st digit
    var firstDigit = element(by.css(Bubble_Chart['D11'].v));
    browser.wait(EC.visibilityOf(firstDigit), 5000);
    firstDigit.getText().then(function (firstDigitIntro) {
      var firstDigitText = firstDigitIntro;

      // Comparing the year's 1st digit
      var val1= "2";
      expect(firstDigitText).toBe(val1);

      // Getting year's 2nd digit
      var secondDigit = element(by.css(Bubble_Chart['D12'].v));
      browser.wait(EC.visibilityOf(secondDigit), 5000);
      secondDigit.getText().then(function (secondDigitIntro) {
        var secondDigitText = secondDigitIntro;

        // Comparing the year's 2nd digit
        var val2= "0";
        expect(secondDigitText).toBe(val2);

        // Getting year's 3rd digit
        var thirdDigit = element(by.css(Bubble_Chart['D13'].v));
        browser.wait(EC.visibilityOf(thirdDigit), 5000);
        thirdDigit.getText().then(function (thirdDigitIntro) {
          var thirdDigitText = thirdDigitIntro;

          // Comparing the year's 3rd digit
          var val3= "1";
          expect(thirdDigitText).toBe(val3);

          // Getting year's 4th digit
          var fourthDigit = element(by.css(Bubble_Chart['D14'].v));
          browser.wait(EC.visibilityOf(fourthDigit), 5000);
          fourthDigit.getText().then(function (fourthDigitIntro) {
            var fourthDigitText = fourthDigitIntro;

            // Comparing the year's 4th digit
            var val4= "5";
            expect(fourthDigitText).toBe(val4);

            //Getting slider position before play
            slider.getLocation().then(function (beforePlaySliderLocation) {
              var beforePlaySliderDivLocation = beforePlaySliderLocation.x;
              play.click();
              browser.sleep(100000);

              //Getting slider position after play
              slider.getLocation().then(function (afterPlaySliderLocation) {
                var afterPlaySliderDivLocation = afterPlaySliderLocation.x;

                //Comparing drag positions
                expect(afterPlaySliderDivLocation).toBe(beforePlaySliderDivLocation);
              });
            });
          });
        });
      });
    });
  });    
  
   
// United states should have 2015: GDP: 53354 $/year/person

  it('GDP', function(){

    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(play), 600000 , "Chart is not Loaded");

    //Hovering USA bubble
     var USABubble = element(by.css(Bubble_Chart['D6'].v));
    browser.actions().mouseMove(USABubble).mouseMove({x:0,y:20}).perform();
          browser.sleep(5000);

    // Getting attributes of X axis
    var axis = element(by.css(Bubble_Chart['D19'].v));
    browser.wait(EC.visibilityOf(axis), 60000);
    axis.getText().then(function (axisAsParameter) {
        var axisText = axisAsParameter;

      // Comparing gdp
      var findMe = "100k";
      expect(axisText.indexOf(findMe) !== -1).toBe(true);
    });
  });

      
    
// User can hover the bubbles with a cursor,
// the bubbles react to hovering and a tooltip appears, and contains the country name  
    
    
    it('USAHover', function(){

    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(play), 60000 , "Chart is not Loaded");

    //Hovering USA bubble
    var USABubble = element(by.css(Bubble_Chart['D6'].v));
    browser.actions().mouseMove(USABubble).mouseMove({x:0, y:20}).perform();
    browser.sleep(5000);

    // Getting attributes of tooltip
    var tooltip =element(by.css(Bubble_Chart['D24'].v));
    browser.wait(EC.visibilityOf(tooltip), 60000);
    tooltip.getText().then(function (tooltipAsParameter) {
      var tooltipText = tooltipAsParameter;
      // Comparing the country name
      var findMe = "United States";
      expect(findMe).toBe(tooltipText);
        });
    });
  

    
    
// There's a data warning to the bottom right

  it('DataWarning', function(){

    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(play), 60000 , "Chart is not Loaded");

    //Clicking Data Warning link
    var warning =element(by.css(Bubble_Chart['D28'].v));
    browser.wait(EC.visibilityOf(warning), 5000).then(function(){
      warning.click();
    });

    //Getting text heading from data warning pop up
    var warningTextElememnt =element(by.css(Bubble_Chart['D29'].v));
    browser.wait(EC.visibilityOf(warningTextElememnt), 5000);
    warningTextElememnt.getText().then(function (warningTextAsParameter) {
      var warningText = warningTextAsParameter;

      // Comparing the heading text from pop up of data warning
      var findMe = "DATA DOUBTS";
      expect(findMe).toBe(warningText);
    });
  });

    
    
 // I can drag the label "United States" and drop it anywhere in the chart area

  it('DragLabel', function(){

    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(play), 60000 , "Chart is not Loaded");

    //Clicking USA bubble
    var USABubble =element(by.css(Bubble_Chart['D6'].v));
    browser.wait(EC.visibilityOf(USABubble), 5000).then(function(){
      browser.actions().mouseMove(USABubble).mouseMove({x: 0, y: 20}).click().perform();
    });

    //Getting location before dragging label
    var USALabel = element(by.css(Bubble_Chart['D34'].v));
    USALabel.getLocation().then(function(initialLocation){
      var initialLocationText = initialLocation.x;
      browser.sleep(2000);

      // label drag and drop
      browser.wait(EC.visibilityOf(USALabel), 5000).then(function(){
        browser.actions().mouseMove(USALabel, {x: 0, y: 0}).perform();
        browser.sleep(2000);
        browser.actions().dragAndDrop(USALabel, {x: -300, y:50}).click().perform();
        browser.sleep(2000);
      });

      //Getting location after dragging label
      USALabel.getLocation().then(function(finalLocationText){
        var finlLocationText = finalLocationText.x;

        //Comparing label positions
        expect(initialLocationText).not.toEqual(finlLocationText);
      });
    });
  });   
 

// I can select and deselect countries using the button "Find" to the right.

  it('Deselect',function(){

    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(play), 60000 , "Chart is not Loaded");

    //Clicking find
    var find =element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-buttonlist > button:nth-child(2) > span.vzb-buttonlist-btn-icon.fa"));
//    browser.wait(EC.visibilityOf(find), 60000).then(function(){
      find.click();
//    });
    // Place Text in Search
    var search =element(by.css("#vzb-find-search"));
    browser.wait(EC.visibilityOf(search), 60000).then(function(){
      search.sendKeys("china");
    });

    // Check China Text Box
    var chinaBubble =element(by.css(Bubble_Chart['D40'].v));
    browser.wait(EC.visibilityOf(chinaBubble), 60000).then(function(){
      chinaBubble.click();
    });
    // Remove Text
    search.clear();

    // Place Text in Search / Find Field
    browser.wait(EC.visibilityOf(search), 60000).then(function(){
      search.sendKeys("united states");
    });

    // Check United States Text Box
    var USABubble =element(by.css(Bubble_Chart['D41'].v));
    browser.wait(EC.visibilityOf(USABubble), 60000).then(function(){
      USABubble.click();
    });
    // Remove Text
    search.clear();

    //Clicking OK
    var ok = element(by.css(Bubble_Chart['D42'].v));
    browser.wait(EC.visibilityOf(ok), 60000).then(function(){
      ok.click();
    });

    // Getting USA opacity value
    var USA =element(by.css(Bubble_Chart['D6'].v));
    USA.getCssValue('opacity').then(function(USAOpacityAsParameter){
      var USAOpacity = USAOpacityAsParameter;

      // Getting Nigeria Opacity value
      var nga =element(by.css(Bubble_Chart['D44'].v));
      nga.getCssValue('opacity').then(function(NGAOpacityAsParameter){
        var NGAOpacity = NGAOpacityAsParameter;

        //Clicking find	again to deselect
        browser.wait(EC.visibilityOf(find), 60000).then(function(){
          find.click();
        });
        // Place Text in Search	again to deselect
        browser.wait(EC.visibilityOf(search), 60000).then(function(){
          search.sendKeys("china");
        });

        // Check China Text Box	again to deselect
        browser.wait(EC.visibilityOf(chinaBubble), 60000).then(function(){
          chinaBubble.click();
        });
        // Remove Text
        search.clear();

        // Place Text in Search / Find Field again to deselect
        browser.wait(EC.visibilityOf(search), 5000).then(function(){
          search.sendKeys("united states");
        });

        // Check United States Text Box	again to deselect
        browser.wait(EC.visibilityOf(USABubble), 60000).then(function(){
          USABubble.click();
        });
        // Remove Text
        search.clear();

        //Clicking OK
        browser.wait(EC.visibilityOf(ok), 60000).then(function(){
          ok.click();
        });
        // Comapring Opacities
        expect(NGAOpacity).toBeLessThan(USAOpacity);

      });
    });
  });    

  
    
  // If I select a country, click "Lock", and drag the time slider or play,
  // all unselected countries stay in place and only the selected one moves

  it('Lock',function(){

    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(play), 60000 , "Chart is not Loaded");

   //Clicking find
    var find =element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-buttonlist > button:nth-child(2) > span.vzb-buttonlist-btn-icon.fa"));
    browser.wait(EC.visibilityOf(find), 60000).then(function(){
      find.click();
    });

    // Giving country name in Search bar
    var search =element(by.css("#vzb-find-search"));
    browser.wait(EC.visibilityOf(search), 60000).then(function(){
      search.sendKeys("United States");
    });

    // Clicking Check box of USA
    var checkBox =element(by.css(Bubble_Chart['D41'].v));
    browser.wait(EC.visibilityOf(checkBox), 60000).then(function(){
      checkBox.click();
    });

    // Remove text from search bar
    search.clear();

    // Click OK
    var OK =element(by.css(Bubble_Chart['D42'].v));
    browser.wait(EC.visibilityOf(OK), 60000).then(function(){
      OK.click();
    });
      
    //Removing hovering effect
    var USBubble =element(by.css(Bubble_Chart['D6'].v));
    browser.actions().mouseMove(USBubble,{x:15, y:15}).perform();
      
    // Click Lock
    var lock =element(by.css(Bubble_Chart['D53'].v));
    browser.wait(EC.visibilityOf(lock), 60000).then(function(){
      lock.click();
    });

 
    // Getting USA size before play
    USBubble.getAttribute('r').then(function(radius){
      var rad=radius;

      // Click for Play
      play.click();
      browser.sleep(5000);

      //Clicking pause
      var pause =element(by.css(Bubble_Chart['D54'].v));
      pause.click();

      // Getting USA size after play
      USBubble.getAttribute('r').then(function(finlRadiusParameter){
        var finalRadius=finlRadiusParameter;

        // Comapring sizes
        expect(rad).not.toEqual(finalRadius);
      });
    });
  });  
 
    
    
 // I can drag any panel on large screen resolutions if I drag the hand icon

  it('DragPanel',function(){

    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(play), 60000 , "Chart is not Loaded");

    // Selecting size icon
    var sizeIcon =element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-buttonlist > button:nth-child(3) > span.vzb-buttonlist-btn-icon.fa"));
    browser.wait(EC.visibilityOf(sizeIcon), 60000).then(function(){
      sizeIcon.click();
      browser.sleep(5000);
    });

    //Getting location of the panel before dargging
    var hand =element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-dialog-shadow.vzb-active.notransition.vzb-popup > div > span.thumb-tack-class.thumb-tack-class-ico-drag.fa > svg"));
    hand.getLocation().then(function (beforeDrag) {
      var bforDrag = beforeDrag;
      browser.sleep(5000);

      // Dragging the panel
      browser.actions().dragAndDrop(hand, {x:-300,y:40}).perform();
      browser.sleep(5000);

      //Getting location of the panel after dargging
      hand.getLocation().then(function (afterDrag) {
        var aftrDrag = afterDrag;
        browser.sleep(5000);

        //Comparing positions
        expect(bforDrag).not.toEqual(aftrDrag);
      });
    });
  });    

    
});
