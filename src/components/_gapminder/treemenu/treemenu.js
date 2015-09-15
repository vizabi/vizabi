/*!
 * VIZABI INDICATOR PICKER
 * Reusable indicator picker component
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;

    var INDICATOR = "which";
    var SCALETYPE = "scaleType";
    var MODELTYPE_COLOR = "color";

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) {
        return;
    }

    var data = [
	    {
	    "id": "properties",
	    "children": [{
	            "id": "geo",
	            "unit": "",
	            "use": "property",
	            "scales": ["ordinal"]
	        },
	        {
	            "id": "geo.region",
	            "unit": "",
	            "use": "property",
	            "scales": ["ordinal"]
	        }]
	    },
	    {
	    "id": "indicators",
	    "children": [{
	            "id": "lex",
	            "unit": "years",
	            "use": "indicator",
	            "scales": ["linear"]
	        },
	        {
	            "id": "gdp_per_cap",
	            "unit": "$/year/person",
	            "use": "indicator",
	            "scales": ["log","linear"]
	        },
	        {
	            "id": "pop",
	            "unit": "",
	            "use": "indicator",
	            "scales": ["linear","log"]
	        }]
	    },
	    {
	        "id": "time",
	        "unit": "year",
	        "use": "indicator",
	        "scales": ["time"]
	    }
	];

	var translator = {
	    "en":{
	        "geo": "Country",
	        "geo.region": "World region",
	        "lex": "Life expectancy",
	        "gdp_per_cap": "GDP per capita",
	        "pop": "Population",
	        "time": "Time"
	    },
	    "se":{
	        "geo": "Land",
	        "geo.region": "Världsregion",
	        "lex": "Livslängd",
	        "gdp_per_cap": "BNP per capita",
	        "pop": "Befolkning",
	        "time": "Tid"
	    }
	};

	Vizabi.Component.extend('gapminder-treemenu', {

	    init: function(config, context) {
	        var _this = this;

	        this.model_expects = [{
	            name: "axis"
	                //TODO: learn how to expect model "axis" or "size" or "color"
	        }, {
	            name: "language",
	            type: "language"
	        }];

	        this.context = context;

	        this.model_binds = {
	            "change:axis": function(evt) {
	                _this.updateView();
	            },
	            "change:language": function(evt) {
	                _this.updateView();
	            }
	        }

	        //contructor is the same as any component
	        this._super(config, context);

	        this.ui = utils.extend({
	            selectIndicator: true,
	            selectScaletype: true
	        }, this.ui);

	    },

	    ready: function() {
	        this.updateView();
	    },

	    readyOnce: function() {
	        //this function is only called once at start, when both DOM and this.model are ready
	        //this.element contains the view where you can append the menu
	        var container = d3.select(this.element);

	        //menu class private
	        var _this = this;

	        //init buttons
	        d3
	            .select(this.placeholder)
	            .append('button')
	            .text('Toggle')
	            .on('click', function() { _this.toggle() });

	        //css custom classes
	        var cssClasses = {
	            wrapper: 'dl-menu-wrap',
	            search: 'dl-menu-search',
	            list: 'dl-menu-list',
	            list_item: 'dl-menu-list_item',
	            hasChild: 'dl-menu-list_item--children',
	            list_item_label: 'dl-menu-list_item_label',
	            list_top_level: 'dl-menu-list_top',
	            search_wrap: 'dl-menu-search_wrap',
	            isSpecial: 'dl-menu-list_item--special'
	        };

	        //options and globals
	        var OPTIONS = {
	            MENU_ID: 'menu-' + this._id, //identify this menu
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

	        //default callback
	        var callback = function(indicator) {
	            console.log("Indicator selector: stub callback fired. New indicator is ", indicator);
	        };

	        //data
	        var data;

	        //translator
	        var translator;

	        //language
	        var lang;

	        //debug function (REMOVE IN PRODUCTION)
	        var log = function() {
	            console.log('ok', this);
	        };

	        //general markup
	        var menuSkeleton = container
	                                //.style('overflow-x', 'hidden')
	                                .append('div')
	                                .classed(cssClasses.wrapper, true)
	                                .attr('id', OPTIONS.MENU_ID)
	                                .append('div')
	                                .classed(cssClasses.search_wrap, true)
	                                .append('input')
	                                .classed(cssClasses.search, true)
	                                .attr('type', 'text')
	                                .attr('id', cssClasses.search + '_' + OPTIONS.MENU_ID);

	        /*

	            METHODS AND SELFVARIABLES

	        */

	        this.resizeProfiles = [
	            {
	                col_width: 300,
	                min: 1280
	            },
	            {
	                col_width: 250,
	                min: 1024
	            },
	            {
	                col_width: 200,
	                min: OPTIONS.MOBILE_BREAKPOINT
	            }
	        ];

	        this.toggle = function() {
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

	        this.state = null;

	        //setters-getters
	        this.data = function(input) {
	            if (!arguments.length) return data;
	            data = input;
	            render(data);
	            return this;
	        };

	        this.lang = function(input) {
	            if (!arguments.length) return lang;
	            lang = input;
	            return this;
	        };

	        this.translator = function(input) {
	            if (!arguments.length) return translator;
	            translator = input;
	            return this;
	        };

	        this.callback = function(input) {
	            if (!arguments.length) return callback;
	            callback = input;
	            return this;
	        };

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
	                d3
	                    .select(node)
	                    .select('.'+cssClasses.list)
	                    .classed('active', true);

	                marqueeToggle(node, true);
	            };

	            var closeAll = function(node){
	                var li = d3
	                            .select(node)
	                            .selectAll('.'+cssClasses.list_item+':not(:hover)');

	                li
	                    .each(function() {
	                        d3
	                            .select(this)
	                            .selectAll('.'+cssClasses.list)
	                            .each(function() {
	                                d3
	                                    .select(this)
	                                    .classed('active', false);
	                            });
	                    });

	                li
	                    .filter('.marquee')
	                    .each(function() {
	                        marqueeToggle(this, false);
	                    });

	                resizeDropdown();

	            };

	            var closeCurSub = function() {
	                if (!OPTIONS.IS_MOBILE) {
	                    var selectSub = d3.select(curSub);

	                    selectSub
	                        .classed('active', false)
	                        .attr('style', '');
	                };

	            };



	            d3
	                .select(curSub)
	                .select('.' + cssClasses.list_item)
	                .node()
	                .addEventListener('mouseleave', closeCurSub, false);

	            self
	                .node()
	                .addEventListener('mouseenter', function() { possiblyActivate(event, this); }, false);

	            self
	                .node()
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

	        //search listener
	        var enableSearch = function() {
	            var input = d3.select('#' + cssClasses.search + '_' + OPTIONS.MENU_ID);

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

	        //this function process click on list item
	        var selectIndicator = function() {
	            var select = d3.select(this),
	                data = select.data()[0];

	            if (data.use) {
	                _this.state = data;
	                callback(data);
	                _this.toggle();
	            };

	        };

	        //watch for resizing
	        var watchContainerSize = function() {

	            OPTIONS.CONTAINER_DIMENSIONS = {
	                height: container.node().offsetHeight,
	                width: container.node().offsetWidth
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
	                        .select('#' + OPTIONS.MENU_ID)
	                        .classed('mobile', true);

	                    container
	                        .selectAll('*')
	                        .each(function(){
	                            d3
	                                .select(this)
	                                .attr('style', '');
	                        });
	                } else {
	                    d3.select('#' + OPTIONS.MENU_ID).classed('mobile', false);
	                };
	            };

	            //// Start the polling loop, asynchronously.
	            setTimeout(function(){
	                var elem = container,
	                    width = container.node().offsetWidth,
	                    height = container.node().offsetHeight;

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
	                ulArr.push(d3.select('#' + OPTIONS.MENU_ID).node());
	                container
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
	                        ulSelectNested
	                            .transition()
	                            .duration(200)
	                            .style('width', OPTIONS.CURRENT_PROFILE.col_width);
	                        fullColNumber --;
	                    } else {
	                        if (remain > OPTIONS.MIN_COL_WIDTH) {
	                            ulSelectNested
	                                .transition()
	                                .duration(200)
	                                .style('width', remain/(i+1));
	                            remain -= remain/(i+1);
	                        } else {
	                            ulSelectNested
	                                .transition()
	                                .duration(200)
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

	            container.select('#' + OPTIONS.MENU_ID).select('.' + cssClasses.list_top_level).remove();

	            //rendering first level
	            var firstLevelMenu = container
	                            .select('#' + OPTIONS.MENU_ID)
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
	                            .data(data, function(d){
	                                return d['id'];
	                            });

	            //removing old data
	            data
	                .exit()
	                .remove();


	            //adding new data
	            var li = data
	                    .enter()
	                    .append('li');

	            li
	                .append('span')
	                .classed(cssClasses.list_item_label, true)
	                .text(function(d){
	                    return translatorInt(d);
	                })
	                .on('click', selectIndicator);

	            li
	                .classed(cssClasses.list_item, true)
	                .classed(cssClasses.hasChild, function(d) { return d['children']; })
	                .classed(cssClasses.isSpecial, function(d) { return d['special']; })
	                .each(function(d) {
	                    var selection = d3.select(this);
	                    selection.call(toggleSub);

	                    var parsingProcess = function(select, data) {
	                        if(data != null) {
	                            var li = select
	                                .append('ul')
	                                .classed(cssClasses.list, true)
	                                .selectAll('li')
	                                .data(data, function(d) { return d['id']; })
	                                .enter()
	                                .append('li');

	                            li
	                                .append('span')
	                                .classed(cssClasses.list_item_label, true)
	                                .text(function (d) {
	                                    return translatorInt(d);
	                                })
	                                .on('click', selectIndicator);

	                            li
	                                .classed(cssClasses.list_item, true)
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

	        //init functions
	        d3.select('body').on('mousemove', mousemoveDocument).select('#' + OPTIONS.MENU_ID).on('mouseleave', closeAllSub);
	        enableSearch();
	        watchContainerSize();

	    },

	    updateView: function() {
	        // do some redraw and update here
	        var setModel = this._setModel.bind(this);
	        var _this = this;
	        this.translator(translator).lang(_this.context.model._data.language._data.id).callback(setModel).data(data);
	    },

	    _setModel: function() {

	        var mdl = this.model.axis;

	        var state = this.state;

	        var obj = {};

	        obj.which = state['id'];
	        obj.use = state['use'];
	        obj.unit = state['unit'];
	        obj.scaleType = state['scales'][0];


	        console.log(obj);

	        mdl.set(obj);
	    }


	});

}).call(this);