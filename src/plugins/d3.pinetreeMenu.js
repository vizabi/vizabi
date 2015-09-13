(function () {

    'use strict';
    var root = this;

    if (!Vizabi._require('d3')) return;

    d3.pinetreeMenu = function () {
        
        return function d3_pinetree_menu() {

            //css custom classes
            var cssClasses = {
                wrapper: 'vzb-pinetree-wrap',
                search: 'vzb-pinetree-search',
                list: 'vzb-pinetree-list',
                list_item: 'vzb-pinetree-list_item',
                hasChild: 'vzb-pinetree-list_item--children',
                list_item_label: 'vzb-pinetree-list_item_label',
                list_top_level: 'vzb-pinetree-list_top',
                search_wrap: 'vzb-pinetree-search_wrap',
                isSpecial: 'vzb-pinetree-list_item--special'
            };
            
            //options and globals
            var OPTIONS = {
                MENU_ID: 'menu-' + Math.round(Math.random()*100), //identify this menu
                MOUSE_LOCS: [], //contains last locations of mouse
                MOUSE_LOCS_TRACKED: 3, //max number of locations of mouse
                DELAY: 200, //amazons multilevel delay
                TOLERANCE: 150, //this parameter is used for controlling the angle of multilevel dropdown
                LAST_DELAY_LOC: null, //this is cached location of mouse, when was a delay
                TIMEOUT: null, //timeout id
                SEARCH_PROPERTY: 'id', //property in input data we we'll search by
                SUBMENUS: 'children', //property for submenus (used by search)
                SEARCH_MIN_STR: 2, //minimal length of query string to start searching
                CONTAINER_DIMENSIONS: {}, //current container width, height
                RESIZE_TIMEOUT: null, //container resize timeout
                MOBILE_BREAKPOINT: 500, //mobile breakpoint
                CURRENT_PATH: [], //current active path
                CURRENT_PROFILE: null, //current resize profile
                MIN_COL_WIDTH: 50 //minimal column size
            };
            
            
            

            

            
            
            
            function pinetreeMenu(container) {

                _this.state = null;
                
                _this.container = container;
                

                //general markup
                var menuSkeleton = _this.container
                    //.style('overflow-x', 'hidden')
                    .append('div')
                    .classed(cssClasses.wrapper, true)
                    .attr('id', OPTIONS.MENU_ID)
                    .append('div')
                    .classed(cssClasses.search_wrap, true)
                    .append('input')
                    .classed(cssClasses.search, true)
                    .attr('type', 'text')
                    .attr('id', cssClasses.search); 
                
                render(data);

                //init functions
                //d3.select('body').on('mousemove', mousemoveDocument).select('.'+cssClasses.wrapper).on('mouseleave', closeAllSub);
                //enableSearch();
                //watchContainerSize();

            };
            
            
            
            
            var _this = pinetreeMenu;


            _this.resizeProfiles = [
                {col_width: 300, min: 1280 },
                {col_width: 250, min: 1024 },
                {col_width: 200, min: OPTIONS.MOBILE_BREAKPOINT  }
            ];
            

            //data
            var data;
            //setters-getters
            _this.data = function(input) {
                if (!arguments.length) return data;
                data = input;
                return this;
            };

            //language
            var lang;
            _this.lang = function(input) {
                if (!arguments.length) return lang;
                lang = input;
                return this;
            };

            //translator
            var translator;
            _this.translator = function(input) {
                if (!arguments.length) return translator;
                translator = input;
                return this;
            };

            //callback
            var callback = function(indicator) { console.log("Pinetree menu stub callback. Item selected: ", indicator);};
            _this.callback = function(input) {
                if (!arguments.length) return callback;
                callback = input;
                return this;
            };


                _this.toggle = function() {
                    var wrapper = d3.select('#' + OPTIONS.MENU_ID),
                        trigger = wrapper.classed('active');

                    if (trigger) {
                        wrapper.classed('active', false);
                        wrapper
                            .selectAll('.' + cssClasses.list_item)
                            .filter('.marquee')
                            .each(function() {
                                marqueeToggle(this, false);
                            });
                    } else {
                        wrapper.classed('active', true);
                    };
                };
            
            
            
            
                //debug function (REMOVE IN PRODUCTION)
                var log = function() {console.log('ok', this);};
            

                /*

                    FUNCTIONS

                */

                //open submenu
                var toggleSub = function(){

                    var self = this;

                    var curSub = self.node().parentNode;

                    var possiblyActivate = function(event, it) {

                        if ((OPTIONS.IS_MOBILE && event.type == 'click')) {

                            closeAll(curSub);
                            if (!self.classed('active')) {
                                open(it);
                            };
                            return;

                        } else if (!OPTIONS.IS_MOBILE && event.type == 'mouseenter') {
                            var delay = activationDelay(curSub);

                            if (delay) {
                                OPTIONS.TIMEOUT = setTimeout(function() {
                                    possiblyActivate(event, it);
                                }, delay);
                            } else {
                                open(it);
                                closeAll(curSub);
                            };
                        };


                    };

                    var open = function(node){
                        d3.select(node)
                            .select('.'+cssClasses.list)
                            .classed('active', true);

                        marqueeToggle(node, true);
                    };

                    var closeAll = function(node){
                        var li = d3.select(node).selectAll('.'+cssClasses.list_item+':not(:hover)');

                        li.each(function() {
                                d3.select(this)
                                    .selectAll('.'+cssClasses.list)
                                    .each(function() {
                                        d3.select(this).classed('active', false);
                                    });
                            });

                        li.filter('.marquee')
                            .each(function() {
                                marqueeToggle(this, false);
                            });

                        resizeDropdown();

                    };

                    var closeCurSub = function() {
                        var selectSub = d3.select(curSub);

                        selectSub
                            .classed('active', false)
                            .attr('style', '');

                    };



                    d3.select(curSub)
                        .select('.' + cssClasses.list_item)
                        .node()
                        .addEventListener('mouseleave', closeCurSub, false);

                    self.node()
                        .addEventListener('mouseenter', function() { possiblyActivate(event, this); }, false);

                    self.node()
                        .addEventListener('click', function() { possiblyActivate(event, this); }, false);

                };

                //marquee animation
                var marqueeToggle = function(node, toggle) {
                    var selection = d3.select(node),
                        label = selection.select('.' + cssClasses.list_item_label);

                    if (toggle) {
                        if(label.node().scrollWidth > node.offsetWidth) {
                            selection.classed('marquee', true);
                        }
                    } else {
                        selection.classed('marquee', false);
                    }
                };

                //if menu lost focus close all levels
                var closeAllSub = function() {
                    var selfSelect = d3.select(this);

                    selfSelect
                        .selectAll('.active')
                        .classed('active', false);

                    selfSelect
                        .selectAll('.marquee')
                        .classed('marquee', false);

                    resizeDropdown();
                };

                //Keep track of the last few locations of the mouse.
                var mousemoveDocument = function() {
                    var coordinates = d3.mouse(this);
                    OPTIONS.MOUSE_LOCS.push({x: coordinates[0], y: coordinates[1]});

                    if (OPTIONS.MOUSE_LOCS.length > OPTIONS.MOUSE_LOCS_TRACKED) {
                        OPTIONS.MOUSE_LOCS.shift();
                    }
                };

                /**
                 * Return the amount of time that should be used as a delay before the
                 * currently hovered row is activated.
                 *
                 * Returns 0 if the activation should happen immediately. Otherwise,
                 * returns the number of milliseconds that should be delayed before
                 * checking again to see if the row should be activated.
                 */
                var activationDelay = function(submenu) {
                    var $menu = d3.select(submenu).node();
                    var menuWrap = $menu.parentNode;

                    if ($menu.getElementsByClassName('active').length == 0) {
                        //if current submenu has no opened submenus, open first immediately
                        return 0;
                    }

                    var upperLeft = {
                            x: $menu.offsetLeft + menuWrap.offsetLeft,
                            y: $menu.offsetTop + menuWrap.offsetTop - OPTIONS.TOLERANCE
                        },
                        upperRight = {
                            x: $menu.offsetLeft + menuWrap.offsetLeft + $menu.offsetWidth,
                            y: upperLeft.y
                        },
                        lowerLeft = {
                            x: $menu.offsetLeft + menuWrap.offsetLeft,
                            y: $menu.offsetTop + menuWrap.offsetTop + $menu.offsetHeight + OPTIONS.TOLERANCE
                        },
                        lowerRight = {
                            x: $menu.offsetLeft + menuWrap.offsetLeft + $menu.offsetWidth,
                            y: lowerLeft.y
                        },
                        loc = OPTIONS.MOUSE_LOCS[OPTIONS.MOUSE_LOCS.length - 1],
                        prevLoc = OPTIONS.MOUSE_LOCS[0];

                    if (!loc) {
                        return 0;
                    }

                    if (!prevLoc) {
                        prevLoc = loc;
                    }

                    if (prevLoc.x < $menu.offsetLeft ||
                        prevLoc.y < $menu.offsetTop || prevLoc.y > lowerRight.y) {
                        // If the previous mouse location was outside of the entire
                        // menu's bounds, immediately activate.
                        return 0;
                    }

                    if (OPTIONS.LAST_DELAY_LOC &&
                            loc.x == OPTIONS.LAST_DELAY_LOC.x && loc.y == OPTIONS.LAST_DELAY_LOC.y) {
                        // If the mouse hasn't moved since the last time we checked
                        // for activation status, immediately activate.
                        return 0;
                    }

                    // Detect if the user is moving towards the currently activated
                    // submenu.
                    //
                    // If the mouse is heading relatively clearly towards
                    // the submenu's content, we should wait and give the user more
                    // time before activating a new row. If the mouse is heading
                    // elsewhere, we can immediately activate a new row.
                    //
                    // We detect this by calculating the slope formed between the
                    // current mouse location and the upper/lower right points of
                    // the menu. We do the same for the previous mouse location.
                    // If the current mouse location's slopes are
                    // increasing/decreasing appropriately compared to the
                    // previous's, we know the user is moving toward the submenu.
                    //
                    // Note that since the y-axis increases as the cursor moves
                    // down the screen, we are looking for the slope between the
                    // cursor and the upper right corner to decrease over time, not
                    // increase (somewhat counterintuitively).
                    function slope(a, b) {
                        return (b.y - a.y) / (b.x - a.x);
                    };

                    var decreasingCorner = upperRight,
                        increasingCorner = lowerRight;

                    var decreasingSlope = slope(loc, decreasingCorner),
                        increasingSlope = slope(loc, increasingCorner),
                        prevDecreasingSlope = slope(prevLoc, decreasingCorner),
                        prevIncreasingSlope = slope(prevLoc, increasingCorner);

                    if (decreasingSlope < prevDecreasingSlope &&
                            increasingSlope > prevIncreasingSlope) {
                        // Mouse is moving from previous location towards the
                        // currently activated submenu. Delay before activating a
                        // new menu row, because user may be moving into submenu.
                        OPTIONS.LAST_DELAY_LOC = loc;
                        return OPTIONS.DELAY;
                    }

                    OPTIONS.LAST_DELAY_LOC = null;
                    return 0;
                };



                //this function process click on list item
                var selectIndicator = function() {
                    var select = d3.select(this),
                        data = select.data()[0];
                    if (data.units) {
                        _this.state = data;
                        callback(data);
                        _this.toggle();
                    };
                };
            
            

            
                //search listener
                var enableSearch = function() {
                    var input = d3.select('#' + cssClasses.search);

                    //it forms the array of possible queries
                    var getMatches = function(value) {
                        var matches = [];

                        //translator integration
                        var translatorInt = function(value, data, i) {
                            var arr = [];
                            if (_this.translator()) {
                                for (var language in _this.translator()) {
                                    for (var key in _this.translator()[language]) {
                                        if (_this.translator()[language][key].toLowerCase().indexOf(value.toLowerCase()) >= 0) {
                                            return key;
                                        };
                                    };
                                };
                            };
                        };

                        var matching = function(data) {
                            for (var i = 0; i < data.length; i++) {
                                var match = false;
                                match = match || (data[i][OPTIONS.SEARCH_PROPERTY].toLowerCase().indexOf(value.toLowerCase()) >= 0) ||
                                        data[i][OPTIONS.SEARCH_PROPERTY] == translatorInt(value, data, i);

                                if (match) {
                                    matches.push(data[i]);
                                }

                                if(data[i][OPTIONS.SUBMENUS]) {
                                    matching(data[i][OPTIONS.SUBMENUS]);
                                }
                            }
                        };

                        matching(data);

                        return matches;
                    };

                    var searchIt = function() {
                        var value = input.node().value;

                        if(value.length >= OPTIONS.SEARCH_MIN_STR) {
                            render(getMatches(value));
                        } else {
                            render(data);
                        }
                    };

                    input.on('keyup', searchIt);
                };            

            
            
            
                //watch for resizing
                var watchContainerSize = function() {

                    OPTIONS.CONTAINER_DIMENSIONS = {
                        height: _this.container.node().offsetHeight,
                        width: _this.container.node().offsetWidth
                    };

                    var switchProfile = function(width) {
                        for (var i = 0; i < _this.resizeProfiles.length; i++) {
                            if(_this.resizeProfiles[i].min < width && i == 0 || _this.resizeProfiles[i].min < width && i != 0 && width < _this.resizeProfiles[i - 1].min) {
                                OPTIONS.CURRENT_PROFILE = _this.resizeProfiles[i];
                                OPTIONS.IS_MOBILE = false;
                                break;
                            } else if (width <= OPTIONS.MOBILE_BREAKPOINT) {
                                OPTIONS.CURRENT_PROFILE = null;
                                OPTIONS.IS_MOBILE = true;
                            };
                        };

                        if (OPTIONS.IS_MOBILE) {
                            d3
                                .select('.' + cssClasses.wrapper)
                                .classed('mobile', true);

                            _this.container
                                .selectAll('*')
                                .each(function(){
                                    d3
                                        .select(this)
                                        .attr('style', '');
                                });
                        } else {
                            d3.select('.' + cssClasses.wrapper).classed('mobile', false);
                        };
                    };

                    //// Start the polling loop, asynchronously.
                    OPTIONS.RESIZE_TIMEOUT = setTimeout(function(){
                        var elem = _this.container,
                            width = _this.container.node().offsetWidth,
                            height = _this.container.node().offsetHeight;

                        // If element size has changed since the last time, update the element
                        // data store and trigger the 'resize' event.
                        if ( width !== OPTIONS.CONTAINER_DIMENSIONS.width || height !== OPTIONS.CONTAINER_DIMENSIONS.height ) {
                            OPTIONS.CONTAINER_DIMENSIONS.width = width;
                            OPTIONS.CONTAINER_DIMENSIONS.height = height;
                        }

                        switchProfile(OPTIONS.CONTAINER_DIMENSIONS.width);

                        //loop
                        watchContainerSize();

                    }, 500 );
                };            
            
            
            
            
            
                //resize function
                var resizeDropdown = function() {

                    if (!OPTIONS.IS_MOBILE) {

                        var ulArr = [];
                        ulArr.push(d3.select('.' + cssClasses.wrapper).node());
                        _this.container
                            .selectAll('.' + cssClasses.list + '.active')
                            .each(function() {
                                ulArr.push(this);
                            });

                        var fullColNumber = Math.floor(OPTIONS.CONTAINER_DIMENSIONS.width / OPTIONS.CURRENT_PROFILE.col_width);

                        var remain = OPTIONS.CONTAINER_DIMENSIONS.width - fullColNumber * OPTIONS.CURRENT_PROFILE.col_width;

                        if (remain < OPTIONS.MIN_COL_WIDTH) {
                            fullColNumber -= 1;
                            remain += OPTIONS.CURRENT_PROFILE.col_width
                        };

                        for (var i = ulArr.length - 1; i >= 0 ; i--) {
                            var ulSelectNested = d3.select(ulArr[i]);

                            if (fullColNumber > 0) {
                                ulSelectNested.transition().duration(200)
                                    .style('width', OPTIONS.CURRENT_PROFILE.col_width);
                                fullColNumber --;
                            } else {
                                if (remain > OPTIONS.MIN_COL_WIDTH) {
                                    ulSelectNested.transition().duration(200)
                                        .style('width', remain/(i+1));
                                    remain -= remain/(i+1);
                                } else {
                                    ulSelectNested.transition().duration(200)
                                        .style('width', remain);
                                    remain = 0;
                                };
                            };
                        };

                        OPTIONS.CURRENT_PATH = ulArr;

                    }

                };            
            
            
            
            
            

                //function is rendering data and built structure
                var render = function (data){

                    _this.container.select('#' + OPTIONS.MENU_ID).select('.' + cssClasses.list_top_level).remove();

                    //rendering first level
                    var firstLevelMenu = _this.container.select('#' + OPTIONS.MENU_ID)
                        .append('ul')
                        .classed(cssClasses.list_top_level, true);

                    //translator integration
                    var translatorInt = function(d) {
                        if (_this.lang()) {
                            for (var key in _this.translator()[_this.lang()]) {
                                if (_this.translator()[_this.lang()].hasOwnProperty(d['id'])) {
                                    if (key == d['id']) {
                                        return _this.translator()[_this.lang()][key];
                                    }
                                } else {
                                    return d['id'];
                                }
                            };
                        } else {
                            return d['id'];
                        };
                    };

                    //selection
                    var data = firstLevelMenu
                        .selectAll('li')
                        .data(data, function(d){return d['id'];});

                    //removing old data
                    data.exit().remove();


                    //adding new data
                    var li = data.enter().append('li');

                    li.append('span')
                        .classed(cssClasses.list_item_label, true)
                        .text(function(d){ return translatorInt(d); })
                        .on('click', selectIndicator);

                    li.classed(cssClasses.list_item, true)
                        .classed(cssClasses.hasChild, function(d) { return d['children']; })
                        .classed(cssClasses.isSpecial, function(d) { return d['special']; })
                        .each(function(d) {
                            var selection = d3.select(this);
                            selection.call(toggleSub);

                            var parsingProcess = function(select, data) {
                                if(data != null) {
                                    var li = select.append('ul')
                                        .classed(cssClasses.list, true)
                                        .selectAll('li')
                                        .data(data, function(d) { return d['id']; })
                                        .enter()
                                        .append('li');

                                    li.append('span')
                                        .classed(cssClasses.list_item_label, true)
                                        .text(function (d) {return translatorInt(d);})
                                        .on('click', selectIndicator);

                                    li.classed(cssClasses.list_item, true)
                                        .classed(cssClasses.hasChild, function(d) { return d['children']; })
                                        .classed(cssClasses.isSpecial, function(d) { return d['special']; })
                                        .each(function(d){
                                            d3.select(this).call(toggleSub);
                                            parsingProcess(d3.select(this), d['children']);
                                        });
                                };
                            };

                            parsingProcess(selection, d['children']);

                        });

                };
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
//            // tuning defaults
//            var nCellsH = 15;
//            // number of cells by hues (angular)
//            var minH = 0;
//            // which hue do we start from: 0 to 1 instead of 0 to 365
//            var nCellsL = 4;
//            // number of cells by lightness (radial)
//            var minL = 0.5;
//            // which lightness to start from: 0 to 1. Recommended 0.3...0.5
//            var satConstant = 0.7;
//            // constant saturation for color wheel: 0 to 1. Recommended 0.7...0.8
//            var outerL_display = 0.4;
//            // ecxeptional saturation of the outer circle. the one displayed 0 to 1
//            var outerL_meaning = 0.3;
//            // ecxeptional saturation of the outer circle. the one actually ment 0 to 1
//            var firstAngleSat = 0;
//            // exceptional saturation at first angular segment. Set 0 to have shades of grey
//            var minRadius = 15;
//            //radius of the central hole in color wheel: px
//            var margin = {
//                top: 0.1,
//                bottom: 0.1,
//                left: 0.1,
//                right: 0.1
//            };
//            //margins in % of container's width and height
//            var colorOld = '#000';
//            var colorDef = '#000';
//            // names of CSS classes
//            var css = {
//                INVISIBLE: 'vzb-invisible',
//                COLOR_POINTER: 'vzb-pinetreeMenu-colorPointer',
//                COLOR_BUTTON: 'vzb-pinetreeMenu-colorCell',
//                COLOR_DEFAULT: 'vzb-pinetreeMenu-defaultColor',
//                COLOR_SAMPLE: 'vzb-pinetreeMenu-colorSample',
//                COLOR_PICKER: 'vzb-pinetreeMenu-pinetreeMenu',
//                COLOR_CIRCLE: 'vzb-pinetreeMenu-colorCircle',
//                COLOR_SEGMENT: 'vzb-pinetreeMenu-colorSegment',
//                COLOR_BACKGR: 'vzb-pinetreeMenu-background'
//            };
//            var colorData = [];
//
//            var arc = d3.svg.arc();
//            var pie = d3.layout.pie().sort(null).value(function (d) {
//                return 1;
//            });
//            var svg = null;
//            var colorPointer = null;
//            var showPinetreeMenu = false;
//            var sampleRect = null;
//            var sampleText = null;
//            var background = null;
//            var callback = function (value) {
//                console.info('Color picker callback example. Setting color to ' + value);
//            };
//
//
//
//            // this is init function. call it once after you are satisfied with parameters tuning
//            // container should be a D3 selection that has a div where we want to render color picker
//            // that div should have !=0 width and height in its style
//            function pinetreeMenu(container) {
//                colorData = _generateColorData();
//                svg = container.append('svg').style('position', 'absolute').style('top', '0').style('left', '0').style('width', '100%').style('height', '100%').attr('class', css.COLOR_PICKER).classed(css.INVISIBLE, !showPinetreeMenu);
//                var width = parseInt(svg.style('width'));
//                var height = parseInt(svg.style('height'));
//                var maxRadius = width / 2 * (1 - margin.left - margin.right);
//
//            }
//            
//            
//            
//            
//
//            var _doTheStyling = function (svg) {
//                //styling
//                svg.select('.' + css.COLOR_BACKGR).style('fill', 'white');
//                svg.select('.' + css.COLOR_POINTER).style('stroke-width', 2).style('stroke', 'white').style('pointer-events', 'none').style('fill', 'none');
//                svg.selectAll('.' + css.COLOR_BUTTON).style('cursor', 'pointer');
//                svg.selectAll('text').style('dominant-baseline', 'hanging').style('fill', '#D9D9D9').style('font-size', '0.7em').style('text-transform', 'uppercase');
//                svg.selectAll('circle.' + css.COLOR_BUTTON).style('stroke-width', 2);
//            };
//            var _this = pinetreeMenu;
//            var _cellHover = function (value, view) {
//                // show color pointer if the view is set (a cell of colorwheel)
//                if (view != null)
//                    colorPointer.classed(css.INVISIBLE, false).attr('d', d3.select(view).attr('d'));
//                sampleRect.style('fill', value);
//                sampleText.text(value);
//                callback(value);
//            };
//            var _cellUnHover = function () {
//                colorPointer.classed(css.INVISIBLE, true);
//            };
//            
//            
//            //Use this function to hide or show the color picker
//            //true = show, false = hide, "toggle" or TOGGLE = toggle
//            var TOGGLE = 'toggle';
//            pinetreeMenu.show = function (arg) {
//                if (!arguments.length) return showPinetreeMenu;
//                if (svg == null) console.warn('Color picker is missing SVG element. Was init sequence performed?');
//                showPinetreeMenu = arg == TOGGLE ? !showPinetreeMenu : arg;
//                svg.classed(css.INVISIBLE, !showPinetreeMenu);
//            };
//
//
//            // getters and setters
//            pinetreeMenu.nCellsH = function (arg) {
//                if (!arguments.length) return nCellsH;
//                nCellsH = arg;
//                return pinetreeMenu;
//            };
//            pinetreeMenu.minH = function (arg) {
//                if (!arguments.length) return minH;
//                minH = arg;
//                return pinetreeMenu;
//            };
//            pinetreeMenu.nCellsL = function (arg) {
//                if (!arguments.length) return nCellsL;
//                nCellsL = arg;
//                return pinetreeMenu;
//            };
//            pinetreeMenu.minL = function (arg) {
//                if (!arguments.length) return minL;
//                minL = arg;
//                return pinetreeMenu;
//            };
//            pinetreeMenu.outerL_display = function (arg) {
//                if (!arguments.length) return outerL_display;
//                outerL_display = arg;
//                return pinetreeMenu;
//            };
//            pinetreeMenu.outerL_meaning = function (arg) {
//                if (!arguments.length) return outerL_meaning;
//                outerL_meaning = arg;
//                return pinetreeMenu;
//            };
//            pinetreeMenu.satConstant = function (arg) {
//                if (!arguments.length) return satConstant;
//                satConstant = arg;
//                return pinetreeMenu;
//            };
//            pinetreeMenu.firstAngleSat = function (arg) {
//                if (!arguments.length) return firstAngleSat;
//                firstAngleSat = arg;
//                return pinetreeMenu;
//            };
//            pinetreeMenu.minRadius = function (arg) {
//                if (!arguments.length) return minRadius;
//                minRadius = arg;
//                return pinetreeMenu;
//            };
//            pinetreeMenu.margin = function (arg) {
//                if (!arguments.length) return margin;
//                margin = arg;
//                return pinetreeMenu;
//            };
//            pinetreeMenu.callback = function (arg) {
//                if (!arguments.length) return callback;
//                callback = arg;
//                return pinetreeMenu;
//            };
//            pinetreeMenu.colorDef = function (arg) {
//                if (!arguments.length)
//                    return colorDef;
//                colorDef = arg;
//                if (svg == null) console.warn('Color picker is missing SVG element. Was init sequence performed?');
//                svg.select('.' + css.COLOR_DEFAULT).style('fill', colorDef);
//                return pinetreeMenu;
//            };
//            pinetreeMenu.colorOld = function (arg) {
//                if (!arguments.length) return colorOld;
//                colorOld = arg;
//                if (svg == null) console.warn('Color picker is missing SVG element. Was init sequence performed?');
//                svg.select('rect.' + css.COLOR_SAMPLE).style('fill', colorOld);
//                svg.select('text.' + css.COLOR_SAMPLE).text(colorOld);
//                return pinetreeMenu;
//            };
            
            
            
            return pinetreeMenu;
        }();
        
    }; //d3.svg.pinetreeMenu = function(){
    
}.call(this));





//
//
//
//var menu = new Menu(d3.select('div.wrapper'), 'firstMenu');
//
//var menu2 = new Menu(d3.select('div.wrapper'), 'secondMenu');
////to set translator, current language and init
////menu.translator(translator).lang('se').data(data);
//
//menu.data(fakeData);
//menu2.translator(translator).lang('se').data(data);
//console.log(menu);
//console.log(menu2);
////some test buttons
//document.getElementById('toggle').addEventListener('click', function(){ menu.toggle() }, false);
//document.getElementById('toggle1').addEventListener('click', function(){ menu2.toggle() }, false);
//
//document.getElementById('togglefakeData').addEventListener('click', function(){ menu.data(fakeData) }, false);
//document.getElementById('real_data').addEventListener('click', function(){ menu.translator(translator).lang('se').data(data); }, false);
//document.getElementById('watch_current_state').addEventListener('click', function(){ console.log('Current state is ', menu.state) }, false);
//document.getElementById('set_another_callback').addEventListener('click', function(){ menu.callback( function(indicator) {
//	console.log('another callback setted up', indicator);
//} ) }, false);
//document.getElementById('toggle_language').addEventListener('click', function(){ menu.lang('en').data(data); }, false);
