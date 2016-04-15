describe('Web - Vizabi e2e test :: Mountain Chart', function() {

  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000;
  browser.manage().window().setSize(1100, 750);

  var baseUrl = 'http://localhost:9000/preview/';
  var baseChartUrl = baseUrl + "mountainchart.html#_width:750&height:650&fullscreen:true&resp-sect:true&info-sect:true&butt-sect:true";
  var EC = protractor.ExpectedConditions;

  // Base Selectors

  var buttonPlay = element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-timeslider > div > div.vzb-ts-btns > button.vzb-ts-btn-play.vzb-ts-btn > svg"));
  var countries = element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg > g > g.vzb-mc-mountains"));
  var buttonList = element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-buttonlist"));

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

  var play = element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-timeslider > div > div.vzb-ts-btns > button.vzb-ts-btn-play.vzb-ts-btn"));
  var pause = element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-timeslider > div > div.vzb-ts-btns > button.vzb-ts-btn-pause.vzb-ts-btn"));
  var slider = element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-timeslider > div > div.vzb-ts-slider-wrapper > svg.vzb-ts-slider > g > g.vzb-ts-slider-slide > circle"));

  // Click "find" and check a few countries there, they should get selected on
  // the visualization and their names should appear as a list on top left.
  // Population should be displayed after the name.

  it('MountainFind', function() {
    browser.get(baseChartUrl);
    browser.refresh();
    browser.wait(EC.visibilityOf(play), 60000 , "Chart is not Loaded");

    //Clicking find
    var find = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-buttonlist > button:nth-child(2) > span.vzb-buttonlist-btn-icon.fa"));
    browser.wait(EC.visibilityOf(find), 5000).then(function(){
      find.click();
    });
    // Place Text in Search
    var search = browser.element(by.css("#vzb-find-search"));
    browser.wait(EC.visibilityOf(search), 5000).then(function(){
      search.sendKeys("china");
    });
    //Clicking China
    var china = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-dialog-shadow.vzb-popup.vzb-active.notransition > div > div.vzb-dialog-content.vzb-dialog-content-fixed.vzb-dialog-scrollable > div > div:nth-child(30) > label"));
    browser.wait(EC.visibilityOf(china), 5000).then(function(){
      china.click();
    });

    // Getting name from check box
    var chinaCheckBox = element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-dialog-shadow.vzb-popup.vzb-active.notransition > div > div.vzb-dialog-content.vzb-dialog-content-fixed.vzb-dialog-scrollable > div > div:nth-child(30)"));
    browser.wait(EC.visibilityOf(chinaCheckBox), 5000);

    //Getting text from China check box
    chinaCheckBox.getText().then(function (chinaCheckBoxTextAsParameter) {
      var chinaCheckBoxText = chinaCheckBoxTextAsParameter;

      // Clicking OK of Find pop up
      var ok = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-popup.vzb-active.notransition > div > div.vzb-dialog-buttons > div.vzb-dialog-button.vzb-label-primary > span"));
      browser.wait(EC.visibilityOf(chinaCheckBox), 5000).then(function(){
        ok.click();
      });

      // Getting atrributes of population
      var chinaBall = element(by.css("#chn-label > text:nth-child(3)"));
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
    var show = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-buttonlist > button:nth-child(4) > span.vzb-buttonlist-btn-icon.fa"));
    browser.wait(EC.visibilityOf(show), 5000).then(function(){
      show.click();
    });

    // Giving the country name to search bar
    var search=browser.element(by.css("#vzb-show-search"));
    browser.wait(EC.visibilityOf(search), 5000).then(function(){
      search.sendKeys("china");
    });

    // Clicking the check box of china
    var checkBox = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-dialog-shadow.vzb-popup.vzb-active.notransition > div > div.vzb-dialog-content.vzb-dialog-content-fixed.vzb-dialog-scrollable > div > div:nth-child(48) > label"));
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
    var checkUSA = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-dialog-shadow.vzb-popup.vzb-active.notransition > div > div.vzb-dialog-content.vzb-dialog-content-fixed.vzb-dialog-scrollable > div > div:nth-child(258) > label"));
    browser.wait(EC.visibilityOf(checkUSA), 5000).then(function(){
      checkUSA.click();
      browser.sleep(2000);
    });

    //Clicking OK of show pop up
    var ok = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-dialog-shadow.vzb-popup.vzb-active.notransition > div > div.vzb-dialog-buttons > div.vzb-dialog-button.vzb-label-primary > span"));
    browser.wait(EC.visibilityOf(ok), 5000).then(function(){
      ok.click();
    });

    //Clicking find
    var find = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-buttonlist > button:nth-child(2) > span.vzb-buttonlist-btn-icon.fa"));
    browser.wait(EC.visibilityOf(find), 5000).then(function(){
      find.click();
    });

    // Check China Text Box
    var checkChn = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-dialog-shadow.vzb-popup.vzb-active.notransition > div > div.vzb-dialog-content.vzb-dialog-content-fixed.vzb-dialog-scrollable > div > div:nth-child(1) > label"));
    browser.wait(EC.visibilityOf(checkChn), 5000).then(function(){
      checkChn.click();
    });

    //Getting China Text from check box field
    var chinaCheckBox = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-dialog-shadow.vzb-popup.vzb-active.notransition > div > div.vzb-dialog-content.vzb-dialog-content-fixed.vzb-dialog-scrollable > div > div:nth-child(1)"));
    browser.wait(EC.visibilityOf(chinaCheckBox), 5000);
    chinaCheckBox.getText().then(function (chinaCheckBoxTextAsParameter) {
      var chinaCheckBoxText = chinaCheckBoxTextAsParameter;

      //Getting China Text from population
      var chinaBall = element(by.css("#chn-label > text:nth-child(3)"));
      browser.wait(EC.visibilityOf(chinaBall), 5000);
      chinaBall.getText().then(function (chinaBallAsParameter) {
        var chinaBallText = chinaBallAsParameter;

        //Getting country name from population
        var subStrChn = chinaBallText.substring(0, 5);

        // Check USA Text Box
        var checkUSA1 = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-popup.vzb-active.notransition > div > div.vzb-dialog-content.vzb-dialog-content-fixed.vzb-dialog-scrollable > div > div:nth-child(2) > label"));
        browser.wait(EC.visibilityOf(checkUSA1), 5000).then(function(){
          checkUSA1.click();
        });

        //Getting USA Text from check box field
        var USACheckBoxText = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-dialog-shadow.vzb-popup.vzb-active.notransition > div > div.vzb-dialog-content.vzb-dialog-content-fixed.vzb-dialog-scrollable > div > div:nth-child(2)"));
        browser.wait(EC.visibilityOf(USACheckBoxText), 5000);
        USACheckBoxText.getText().then(function (USACheckBoxTextAsParameter) {
          var USACheckBoxText = USACheckBoxTextAsParameter;

          //Getting USA Text from population
          var usaBall = browser.element(by.css("#usa-label > text:nth-child(3)"));
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
    var firstDigit = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg > g > g.vzb-mc-year > text:nth-child(1)"));
    browser.wait(EC.visibilityOf(firstDigit), 5000);
    firstDigit.getText().then(function (firstDigitAsParameter) {
      var firstDigitText = firstDigitAsParameter;

      // Comparing the year's 1st digit
      var firstDigitOfYear= "2";
      expect(firstDigitText).toBe(firstDigitOfYear);

      // Getting year's 2nd digit
      var secondDigit = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg > g > g.vzb-mc-year > text:nth-child(2)"));
      browser.wait(EC.visibilityOf(secondDigit), 5000);
      secondDigit.getText().then(function (secondDigitAsParameter) {
        var secondDigitText = secondDigitAsParameter;

        // Comparing the year's 2nd digit
        var secondDigitOfYear= "0";
        expect(secondDigitText).toBe(secondDigitOfYear);

        // Getting year's 3rd digit
        var thirdDigit = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg > g > g.vzb-mc-year > text:nth-child(3)"));
        browser.wait(EC.visibilityOf(thirdDigit), 5000);
        thirdDigit.getText().then(function (thirdDigitAsParameter) {
          var thirdDigitText = thirdDigitAsParameter;

          // Comparing the year's 3rd digit
          var thirdDigitOfYear= "1";
          expect(thirdDigitText).toBe(thirdDigitOfYear);

          // Getting year's 4th digit
          var fourthDigit = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg > g > g.vzb-mc-year > text:nth-child(4)"));
          browser.wait(EC.visibilityOf(fourthDigit), 5000);
          fourthDigit.getText().then(function (fourthDigitAsParameter) {
            var fourthDigitText = fourthDigitAsParameter;

            // Comparing the year's 4th digit
            var fourthDigitOfYear= "5";
            expect(fourthDigitText).toBe(fourthDigitOfYear);

            // Clicking Options icon
            var options = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-buttonlist > button:nth-child(5) > span.vzb-buttonlist-btn-icon.fa"));
            browser.wait(EC.visibilityOf(options), 5000).then(function(){
              options.click();
            });

            // Clicking X and Y
            var XandY = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-dialog-shadow.vzb-active.notransition.vzb-popup > div > div.vzb-dialog-content.vzb-dialog-scrollable > div.vzb-accordion > div:nth-child(4) > div > div.vzb-dialog-title"));
            browser.wait(EC.visibilityOf(XandY), 5000).then(function(){
              XandY.click();
            });

            // Clicking probeline search bar
            var searchBar = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-dialog-shadow.vzb-active.notransition.vzb-popup > div > div.vzb-dialog-content.vzb-dialog-scrollable > div.vzb-accordion > div.vzb-dialogs-dialog.vzb-moreoptions.vzb-accordion-section.vzb-accordion-active > div > div.vzb-dialog-content > div.vzb-probe-container > input"));
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
              var optionsPopUpOk = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-popup.vzb-active.notransition > div > div.vzb-dialog-buttons > div"));
              browser.wait(EC.visibilityOf(optionsPopUpOk), 5000).then(function(){
                optionsPopUpOk.click();
              });

              // Clicking Stack
              var stack = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-buttonlist > button:nth-child(3) > span.vzb-buttonlist-btn-icon.fa > svg"));
              browser.wait(EC.visibilityOf(stack), 5000).then(function(){
                stack.click();
              });
              // Clicking the world radio button
              var world = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-active.notransition.vzb-popup > div > div.vzb-dialog-content.vzb-dialog-scrollable > form.vzb-howtomerge.vzb-dialog-paragraph > label:nth-child(4) > input[type=radio]"));
              browser.wait(EC.visibilityOf(world), 5000).then(function(){
                world.click();
              });

              // Clicking stack pop up OK
              var stackPopUpOk = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-popup.vzb-active.notransition > div > div.vzb-dialog-buttons > div"));
              browser.wait(EC.visibilityOf(stackPopUpOk), 5000).then(function(){
                stackPopUpOk.click();
              });
              //Clicking the curve of mountain
              var mountain = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-stage > div.vzb-tool-viz > div > svg > g > g.vzb-mc-mountains"));
              browser.wait(EC.visibilityOf(mountain), 5000).then(function(){
                mountain.click();
              });

              // Getting atrributes of population
              var worldBall = element(by.css(".vzb-mc-mountains-labels .vzb-mc-label text.vzb-mc-label-text:nth-child(3)"));
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
    var showIcon = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-buttonlist > button:nth-child(4) > span.vzb-buttonlist-btn-icon.fa"));
    browser.wait(EC.visibilityOf(showIcon), 5000).then(function(){
      showIcon.click();
    });
    //Clicking check box of Afghanistan
    var afg = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-dialog-shadow.vzb-popup.vzb-active.notransition > div > div.vzb-dialog-content.vzb-dialog-content-fixed.vzb-dialog-scrollable > div > div:nth-child(2) > label"));
    browser.wait(EC.visibilityOf(afg), 5000).then(function(){
      afg.click();
      browser.sleep(2000);
    });
    //Clicking check box of Algeria
    var alg = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-dialog-shadow.vzb-popup.vzb-active.notransition > div > div.vzb-dialog-content.vzb-dialog-content-fixed.vzb-dialog-scrollable > div > div:nth-child(5) > label"));
    browser.wait(EC.visibilityOf(alg), 5000).then(function(){
      alg.click();
      browser.sleep(2000);
    });

    //Clicking OK of show pop up
    var ok = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-dialog-shadow.vzb-popup.vzb-active.notransition > div > div.vzb-dialog-buttons > div.vzb-dialog-button.vzb-label-primary > span"));
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
    var find = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-buttonlist > button:nth-child(2) > span.vzb-buttonlist-btn-icon.fa"));
    browser.wait(EC.visibilityOf(find), 5000).then(function(){
      find.click();
    });

    //Clicking Search bar of find
    var search = browser.element(by.css("#vzb-find-search"));
    browser.wait(EC.visibilityOf(search), 5000);

    //Entering China to searchbar
    browser.wait(EC.visibilityOf(search), 5000).then(function(){
      search.sendKeys("china");
    });

    // Check China Text Box
    var checkChn = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-popup.vzb-active.notransition > div > div.vzb-dialog-content.vzb-dialog-content-fixed.vzb-dialog-scrollable > div > div:nth-child(30) > label"));
    browser.wait(EC.visibilityOf(checkChn), 5000).then(function(){
      checkChn.click();
    });

    //Getting China Terxt from check box field
    var chinaCheckBox = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-popup.vzb-active.notransition > div > div.vzb-dialog-content.vzb-dialog-content-fixed.vzb-dialog-scrollable > div > div:nth-child(30)"));
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
        var checkUSA = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-dialog-shadow.vzb-popup.vzb-active.notransition > div > div.vzb-dialog-content.vzb-dialog-content-fixed.vzb-dialog-scrollable > div > div:nth-child(157) > label"));
        browser.wait(EC.visibilityOf(checkUSA), 5000).then(function(){
          checkUSA.click();
        });
        //Getting USA Text from check box field
        var USACheckBoxText = browser.element(by.css("#vzbp-placeholder > div > div.vzb-tool-sidebar > div.vzb-tool-dialogs > div.vzb-top-dialog.vzb-dialogs-dialog.vzb-dialog-shadow.vzb-popup.vzb-active.notransition > div > div.vzb-dialog-content.vzb-dialog-content-fixed.vzb-dialog-scrollable > div > div:nth-child(157)"));
        browser.wait(EC.visibilityOf(USACheckBoxText), 5000);
        USACheckBoxText.getText().then(function (USACheckBoxTextAsParameter) {
          var USACheckBoxText = USACheckBoxTextAsParameter;

          //Getting USA Text from population
          var usaBall = browser.element(by.css("#usa-label > text:nth-child(3)"));
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

});
