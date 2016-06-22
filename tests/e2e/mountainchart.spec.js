describe('Web - Vizabi e2e test :: Mountain Chart', function() {
    
  var testData = require('../../pageObjects.json');
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000;
  browser.manage().window().setSize(1100, 600);

  var baseUrl = 'http://localhost:9000/preview/';
  var baseChartUrl = baseUrl + "mountainchart.html#_width:750&height:650&fullscreen:true&resp-sect:true&info-sect:true&butt-sect:true";
  var EC = protractor.ExpectedConditions;
  testData.forEach( function (data) {

  // Base Selectors

  var buttonPlay = element(by.css(data.All_Global_Loctors.buttonPlay_Locator_CSS));
  var countries = element(by.css(data.mountain_Chart_Loctors.countriesMountain_Locator_CSS));
  var buttonList = element(by.css(data.All_Global_Loctors.buttonList_Locator_CSS));

  it('Loading Mountain Chart Page', function() {

    browser.get(baseChartUrl);

    // Check that elements were loaded

    browser.wait(EC.visibilityOf(buttonPlay), 60000, "Chart is not Loaded");

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
      expect(items.length).toBe(7);
    });

    buttonListVisible.then(function(items) {
      expect(items.length).toBe(7);
    });

  });

  //**************************MOUNTAIN CHART*************************************

    var play = element(by.css(data.All_Global_Loctors.play_Locator_CSS));
    var pause = element(by.css(data.All_Global_Loctors.pause_Locator_CSS));
    var slider = element(by.css(data.All_Global_Loctors.slider_Locator_CSS));

  // Click "find" and check a few countries there, they should get selected on
  // the visualization and their names should appear as a list on top left.
  // Population should be displayed after the name.

  it('MountainFind', function() {
    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(play), 60000 , "Chart is not Loaded");

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

      // Getting atrributes of population
      var chinaBall = element(by.css(data.mountain_Chart_Loctors.chinaPopulationBall_Locator_CSS));
      browser.wait(EC.visibilityOf(chinaBall), 5000);

      //Getting text from china ball
      chinaBall.getText().then(function (chinaBallAsParameter) {
        var chinaBallText = chinaBallAsParameter;
        //Getting country name from population
        var subStr = chinaBallText.substring(0, 5);
        //Getting population
        var population = chinaBallText.substring(7, 12);
        //Comparing population
        var givenPop = "1.38B";
        expect(givenPop).toBe(population);
        //Comparing country name
        expect(subStr).toBe(chinaCheckBoxText);
      });
    });
  });

  // Click "show", check a few countries, you should get to see only these
  // checked countries on the picture. (bad: you still see many other
  // countries that are not checked, bad: you don't see anything)

  it('ShowMountain', function() {
    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(play), 60000 , "Chart is not Loaded");

    // Clicking show icon
    var show = browser.element(by.css(data.mountain_Chart_Loctors.showIcon_Locator_CSS));
    browser.wait(EC.visibilityOf(show), 5000).then(function(){
      show.click();
    });

    // Giving the country name to search bar
    var search=browser.element(by.css(data.mountain_Chart_Loctors.searchOfShow_Locator_CSS));
    browser.wait(EC.visibilityOf(search), 5000).then(function(){
      search.sendKeys("china");
    });

    // Clicking the check box of china
    var checkBox = browser.element(by.css(data.mountain_Chart_Loctors.chinaCheckboxShow_Locator_CSS));
    browser.wait(EC.visibilityOf(checkBox), 5000 , "Check box is not clicked").then(function(){
      checkBox.click();
    });

    //Removing text from search bar
    browser.wait(EC.visibilityOf(search), 5000).then(function(){
      search.clear();
    });

    // Giving second name to search bar
    browser.wait(EC.visibilityOf(search), 5000).then(function(){
      search.sendKeys("united states");
    });

    // Clicking the check box of USA
    var checkUSA = browser.element(by.css(data.mountain_Chart_Loctors.USACheckboxShow_Locator_CSS));
    browser.wait(EC.visibilityOf(checkUSA), 5000).then(function(){
      checkUSA.click();
      browser.sleep(2000);
    });

    //Clicking OK of show pop up
    var ok = browser.element(by.css(data.mountain_Chart_Loctors.okOnShowPopup_Locator_CSS));
    browser.wait(EC.visibilityOf(ok), 5000).then(function(){
      ok.click();
    });

    //Clicking find
    var find = browser.element(by.css(data.mountain_Chart_Loctors.findIcon_Locator_CSS));
    browser.wait(EC.visibilityOf(find), 5000).then(function(){
      find.click();
    });

    // Check China Text Box
    var checkChn = browser.element(by.css(data.mountain_Chart_Loctors.chinaCheckboxFindAfterShow_Locator_CSS));
    browser.wait(EC.visibilityOf(checkChn), 5000).then(function(){
      checkChn.click();
    });

    //Getting China Text from check box field
    var chinaCheckBox = browser.element(by.css(data.mountain_Chart_Loctors.chinaCheckboxFindAfterShowText_Locator_CSS));
    browser.wait(EC.visibilityOf(chinaCheckBox), 5000);
    chinaCheckBox.getText().then(function (chinaCheckBoxTextAsParameter) {
      var chinaCheckBoxText = chinaCheckBoxTextAsParameter;

      //Getting China Text from population
      var chinaBall = element(by.css(data.mountain_Chart_Loctors.chinaPopulationBall_Locator_CSS));
      browser.wait(EC.visibilityOf(chinaBall), 5000);
      chinaBall.getText().then(function (chinaBallAsParameter) {
        var chinaBallText = chinaBallAsParameter;

        //Getting country name from population
        var subStrChn = chinaBallText.substring(0, 5);

        // Check USA Text Box
        var checkUSA1 = browser.element(by.css(data.mountain_Chart_Loctors.USACheckboxFindAfterShow_Locator_CSS));
        browser.wait(EC.visibilityOf(checkUSA1), 5000).then(function(){
          checkUSA1.click();
        });

        //Getting USA Text from check box field
        var USACheckBoxText = browser.element(by.css(data.mountain_Chart_Loctors.USACheckboxFindAfterShowText_Locator_CSS));
        browser.wait(EC.visibilityOf(USACheckBoxText), 5000);
        USACheckBoxText.getText().then(function (USACheckBoxTextAsParameter) {
          var USACheckBoxText = USACheckBoxTextAsParameter;

          //Getting USA Text from population
          var usaBall = browser.element(by.css(data.mountain_Chart_Loctors.USAPopulationBall_Locator_CSS));
          browser.wait(EC.visibilityOf(usaBall), 5000);
          usaBall.getText().then(function (usaBallAsParameter) {
            var usaBallText = usaBallAsParameter;

            //Getting country name from population
            var subStrUSA = usaBallText.substring(0, 13);

            //Comparing China country name
            expect(subStrChn).toBe(chinaCheckBoxText);

            //Comparing USA country name
            expect(subStrUSA).toBe(USACheckBoxText);
          });
        });
      });
    });
  });


  // in 2015, the percentage of people living in the extreme poverty should be
  // 11.5 � 0.3%, and the world population should be 7.3B.

  it('MountainSelect', function() {
    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(play), 60000 , "Chart is not Loaded");


    // Getting year's 1st digit
    var firstDigit = browser.element(by.css(data.mountain_Chart_Loctors.firstDigitOfYear_Locator_CSS));
    browser.wait(EC.visibilityOf(firstDigit), 5000);
    firstDigit.getText().then(function (firstDigitAsParameter) {
      var firstDigitText = firstDigitAsParameter;

      // Comparing the year's 1st digit
      var firstDigitOfYear= "2";
      expect(firstDigitText).toBe(firstDigitOfYear);

      // Getting year's 2nd digit
      var secondDigit = browser.element(by.css(data.mountain_Chart_Loctors.secondDigitOfYear_Locator_CSS));
      browser.wait(EC.visibilityOf(secondDigit), 5000);
      secondDigit.getText().then(function (secondDigitAsParameter) {
        var secondDigitText = secondDigitAsParameter;

        // Comparing the year's 2nd digit
        var secondDigitOfYear= "0";
        expect(secondDigitText).toBe(secondDigitOfYear);

        // Getting year's 3rd digit
        var thirdDigit = browser.element(by.css(data.mountain_Chart_Loctors.thirdDigitOfYear_Locator_CSS));
        browser.wait(EC.visibilityOf(thirdDigit), 5000);
        thirdDigit.getText().then(function (thirdDigitAsParameter) {
          var thirdDigitText = thirdDigitAsParameter;

          // Comparing the year's 3rd digit
          var thirdDigitOfYear= "1";
          expect(thirdDigitText).toBe(thirdDigitOfYear);

          // Getting year's 4th digit
          var fourthDigit = browser.element(by.css(data.mountain_Chart_Loctors.fourthDigitOfYear_Locator_CSS));
          browser.wait(EC.visibilityOf(fourthDigit), 5000);
          fourthDigit.getText().then(function (fourthDigitAsParameter) {
            var fourthDigitText = fourthDigitAsParameter;

            // Comparing the year's 4th digit
            var fourthDigitOfYear= "5";
            expect(fourthDigitText).toBe(fourthDigitOfYear);

            // Clicking Options icon
            var options = browser.element(by.css(data.mountain_Chart_Loctors.optionsIcon_Locator_CSS));
            browser.wait(EC.visibilityOf(options), 5000).then(function(){
              options.click();
            });

            // Clicking X and Y
            var XandY = browser.element(by.css(data.mountain_Chart_Loctors.XandYIcon_Locator_CSS));
            browser.wait(EC.visibilityOf(XandY), 5000).then(function(){
              XandY.click();
            });

            // Clicking probeline search bar
            var searchBar = browser.element(by.css(data.mountain_Chart_Loctors.problineSearchbar_Locator_CSS));
            browser.wait(EC.visibilityOf(searchBar), 5000).then(function(){
              searchBar.click();
            });
            // Getting text from probeline search bar
            searchBar.getAttribute('value').then(function (searchBarAsParameter) {
              var searchBarText = searchBarAsParameter;

              // Comparing value of probline search bar
              peakVal = "1.93";
              downVal = "1.64";
              expect(peakVal).toBeGreaterThan(searchBarText);
              expect(downVal).toBeLessThan(searchBarText);

              // Clicking Option pop up OK
              var optionsPopUpOk = browser.element(by.css(data.mountain_Chart_Loctors.okOFOptionsPopup_Locator_CSS));
              browser.wait(EC.visibilityOf(optionsPopUpOk), 5000).then(function(){
                optionsPopUpOk.click();
              });

              // Clicking Stack
              var stack = browser.element(by.css(data.mountain_Chart_Loctors.stackIcon_Locator_CSS));
              browser.wait(EC.visibilityOf(stack), 5000).then(function(){
                stack.click();
              });
              // Clicking the world radio button
              var world = browser.element(by.css(data.mountain_Chart_Loctors.worldRadioButton_Locator_CSS));
              browser.wait(EC.visibilityOf(world), 5000).then(function(){
                world.click();
              });

              // Clicking stack pop up OK
              var stackPopUpOk = browser.element(by.css(data.mountain_Chart_Loctors.okOFStackPopup_Locator_CSS));
              browser.wait(EC.visibilityOf(stackPopUpOk), 5000).then(function(){
                stackPopUpOk.click();
              });
              //Clicking the curve of mountain
              var mountain = browser.element(by.css(data.mountain_Chart_Loctors.mountainCurve_Locator_CSS));
              browser.wait(EC.visibilityOf(mountain), 5000).then(function(){
                mountain.click();
              });

              // Getting atrributes of population
              var worldBall = element(by.css(data.mountain_Chart_Loctors.worldBallOfPopulation_Locator_CSS));
              browser.wait(EC.visibilityOf(worldBall), 5000);
              worldBall.getText().then(function (worldBallAsParameter) {
                var worldBallText = worldBallAsParameter;

                // Comparing the Check box country with selected country on the chart
                var pop = "7.3B";
                expect(worldBallText.indexOf(pop) !== -1).toBe(true);
              });
            });
          });
        });
      });
    });
  });

  // Uncheck the countries from "show", when the last one is unchecked, the
  // picture should return to a default view = stacked shapes of all countries

  it('UncheckMountain', function() {
    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(play), 60000 , "Chart is not Loaded");

    //Clicking Show icon
    var showIcon = browser.element(by.css(data.mountain_Chart_Loctors.showIcon_Locator_CSS));
    browser.wait(EC.visibilityOf(showIcon), 5000).then(function(){
      showIcon.click();
    });
    //Clicking check box of Afghanistan
    var afg = browser.element(by.css(data.mountain_Chart_Loctors.checkboxAfghanistanShow_Locator_CSS));
    browser.wait(EC.visibilityOf(afg), 5000).then(function(){
      afg.click();
      browser.sleep(2000);
    });
    //Clicking check box of Algeria
    var alg = browser.element(by.css(data.mountain_Chart_Loctors.checkboxAlgeriaShow_Locator_CSS));
    browser.wait(EC.visibilityOf(alg), 5000).then(function(){
      alg.click();
      browser.sleep(2000);
    });

    //Clicking OK of show pop up
    var ok = browser.element(by.css(data.mountain_Chart_Loctors.okOnShowPopup_Locator_CSS));
    browser.wait(EC.visibilityOf(ok), 5000).then(function(){
      ok.click();
    });

    //Clicking Show icon to uncheck the country
    browser.wait(EC.visibilityOf(showIcon), 5000).then(function(){
      showIcon.click();
    });
    //Unchecking Afghanistan
    browser.wait(EC.visibilityOf(afg), 5000).then(function(){
      afg.click();
      browser.sleep(2000);
    });

    //Unchecking Algeria
    browser.wait(EC.visibilityOf(alg), 5000).then(function(){
      alg.click();
      browser.sleep(2000);
    });

    //Clicking OK of show pop up
    browser.wait(EC.visibilityOf(ok), 5000).then(function(){
      ok.click();
    });

    //Clicking find
    var find = browser.element(by.css(data.mountain_Chart_Loctors.findIcon_Locator_CSS));
    browser.wait(EC.visibilityOf(find), 5000).then(function(){
      find.click();
    });

    //Clicking Search bar of find
    var search = browser.element(by.css(data.mountain_Chart_Loctors.searchOfFind_Locator_CSS));
    browser.wait(EC.visibilityOf(search), 5000);

    //Entering China to searchbar
    browser.wait(EC.visibilityOf(search), 5000).then(function(){
      search.sendKeys("china");
    });

    // Check China Text Box
    var checkChn = browser.element(by.css(data.mountain_Chart_Loctors.chinaCheckboxFind_Locator_CSS));
    browser.wait(EC.visibilityOf(checkChn), 5000).then(function(){
      checkChn.click();
    });

    //Getting China Terxt from check box field
    var chinaCheckBox = browser.element(by.css(data.mountain_Chart_Loctors.chinaCheckboxText_Locator_CSS));
    browser.wait(EC.visibilityOf(chinaCheckBox), 5000);
    chinaCheckBox.getText().then(function (chinaCheckBoxTextAsParameter) {
      var chinaCheckBoxText = chinaCheckBoxTextAsParameter;

      //Getting China Terxt from population
      var chinaBall = element(by.css("#chn-label > text:nth-child(3)"));
      browser.wait(EC.visibilityOf(chinaBall), 5000);
      chinaBall.getText().then(function (chinaBallAsParameter) {
        var chinaBallText = chinaBallAsParameter;

        //Getting country name from population
        var subStrChn = chinaBallText.substring(0, 5);

        //Removing text
        search.clear();

        //Entering USA to searchbar
        search.sendKeys("united states");

        //Clicking check box of USA
        var checkUSA = browser.element(by.css(data.mountain_Chart_Loctors.USACheckboxFind_Locator_CSS));
        browser.wait(EC.visibilityOf(checkUSA), 5000).then(function(){
          checkUSA.click();
        });
        //Getting USA Text from check box field
        var USACheckBoxText = browser.element(by.css(data.mountain_Chart_Loctors.USACheckboxText_Locator_CSS));
        browser.wait(EC.visibilityOf(USACheckBoxText), 5000);
        USACheckBoxText.getText().then(function (USACheckBoxTextAsParameter) {
          var USACheckBoxText = USACheckBoxTextAsParameter;

          //Getting USA Text from population
          var usaBall = browser.element(by.css(data.mountain_Chart_Loctors.USAPopulationBall_Locator_CSS));
          browser.wait(EC.visibilityOf(usaBall), 5000);
          usaBall.getText().then(function (usaBallAsParameter) {
            var usaBallText = usaBallAsParameter;

            //Getting country name from population
            var subStrUSA = usaBallText.substring(0, 13);

            //Comparing China country name
            expect(subStrChn).toBe(chinaCheckBoxText);

            //Comparing USA country name
            expect(subStrUSA).toBe(USACheckBoxText);
          });
        });
      });
    });
  });
      
// In 2015 there is roughly the same amount of people living in the extreme
// poverty as there was in 1800 (827 and 812 Millions). Hover the X Axis to
// check the number of people.
    
it('povertyPopulation', function() {
    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(play), 60000 , "Chart is not Loaded");

    // Getting year's 1st digit  at 2015
    var firstDigit = browser.element(by.css(data.mountain_Chart_Loctors.firstDigitOfYear_Locator_CSS));
    browser.wait(EC.visibilityOf(firstDigit), 5000);
    firstDigit.getText().then(function (firstDigitAsParameter) {
        var firstDigitText = firstDigitAsParameter;

        // Comparing the year's 1st digit
        var firstDigitOfYear= "2";
        expect(firstDigitText).toBe(firstDigitOfYear);

        // Getting year's 2nd digit at 2015
        var secondDigit = browser.element(by.css(data.mountain_Chart_Loctors.secondDigitOfYear_Locator_CSS));
        browser.wait(EC.visibilityOf(secondDigit), 5000);
        secondDigit.getText().then(function (secondDigitAsParameter) {
            var secondDigitText = secondDigitAsParameter;

            // Comparing the year's 2nd digit
            var secondDigitOfYear= "0";
            expect(secondDigitText).toBe(secondDigitOfYear);

            // Getting year's 3rd digit at 2015
            var thirdDigit = browser.element(by.css(data.mountain_Chart_Loctors.thirdDigitOfYear_Locator_CSS));
            browser.wait(EC.visibilityOf(thirdDigit), 5000);
            thirdDigit.getText().then(function (thirdDigitAsParameter) {
                var thirdDigitText = thirdDigitAsParameter;

                // Comparing the year's 3rd digit
                var thirdDigitOfYear= "1";
                expect(thirdDigitText).toBe(thirdDigitOfYear);


                // Getting year's 4th digit at 2015
                var fourthDigit = browser.element(by.css(data.mountain_Chart_Loctors.fourthDigitOfYear_Locator_CSS));
                browser.wait(EC.visibilityOf(fourthDigit), 5000);
                fourthDigit.getText().then(function (fourthDigitAsParameter) {
                    var fourthDigitText = fourthDigitAsParameter;

                    // Comparing the year's 4th digit
                    var fourthDigitOfYear= "5";
                    expect(fourthDigitText).toBe(fourthDigitOfYear);

                    // Hovering the poverty line at default place at 2015
                    var axis = browser.element(by.css(data.mountain_Chart_Loctors.axis_Locator_CSS));
                    browser.wait(EC.visibilityOf(axis), 5000);
                    browser.actions().mouseMove(axis,{x:260,y:1}).perform();
                    browser.sleep(5000);

                    // Getting attributes of poverty line at 2015
                    var line = browser.element(by.css(data.mountain_Chart_Loctors.proLine_Locator_CSS));
                    browser.wait(EC.visibilityOf(line), 5000);
                    line.getText().then(function (lineAsParameter) {
                        var lineText = lineAsParameter;

                        //Getting population at 2015
                        var subStr = lineText.substring(12, 16);	

                        // Comparing the population at 2015
                        var peakVal = "828";
                        var downVal = "826";
                        expect(peakVal).toBeGreaterThan(subStr);
                        expect(downVal).toBeLessThan(subStr);

                        // Drag the Slider ball to 1800
                        browser.wait(EC.visibilityOf(slider), 5000);	
                        browser.driver.actions().dragAndDrop(slider, {x:-1000, y:0}).click().perform();
                        browser.sleep(5000);
                        // Getting year's 1st digit  at 1800
                        firstDigit.getText().then(function (firstDigitAsParameter) {
                            var firstDigitText = firstDigitAsParameter;

                            // Comparing the year's 1st digit
                            var firstDigitOfYear1= "1";
                            expect(firstDigitText).toBe(firstDigitOfYear1);		

                            // Getting year's 2nd digit at 1800
                            secondDigit.getText().then(function (secondDigitAsParameter) {
                                var secondDigitText = secondDigitAsParameter;

                                // Comparing the year's 2nd digit
                                var secondDigitOfYear1= "8";
                                expect(secondDigitText).toBe(secondDigitOfYear1);


                                // Getting year's 3rd digit at 1800
                                thirdDigit.getText().then(function (thirdDigitAsParameter) {
                                    var thirdDigitText = thirdDigitAsParameter;

                                    // Comparing the year's 3rd digit
                                    var thirdDigitOfYear1= "0";
                                    expect(thirdDigitText).toBe(thirdDigitOfYear1);


                                    // Getting year's 4th digit at 1800
                                    fourthDigit.getText().then(function (fourthDigitAsParameter) {
                                        var fourthDigitText = fourthDigitAsParameter;

                                        // Comparing the year's 4th digit
                                        var fourthDigitOfYear1= "0";
                                        expect(fourthDigitText).toBe(fourthDigitOfYear1);

                                        // Hovering the poverty line at 1800
                                        browser.actions().mouseMove(axis,{x:260,y:1}).perform();


                                        // Getting attributes of poverty line at 1800
                                        line.getText().then(function (lineAsParameter1) {
                                            var lineTextAfterDrag = lineAsParameter1;

                                            //Getting population at 1800
                                            var subStrAfterDrag = lineTextAfterDrag.substring(12, 16);

                                            // Comparing the population at 1800
                                            var findMe = "812M";

                                            // Comparing value of probline search bar
                                            peakVal = "813";
                                            downVal = "811";
                                            expect(peakVal).toBeGreaterThan(subStrAfterDrag);
                                            expect(downVal).toBeLessThan(subStrAfterDrag);		
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});   
            
});      
});