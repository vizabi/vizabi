/*!
 * VIZABI INDICATOR PICKER
 * Reusable indicator picker component
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var globals = Vizabi._globals;
    var utils = Vizabi.utils;

    var INDICATOR = "which";
    var MIN = "min";
    var MAX = "max";
    var SCALETYPE = "scaleType";
    var MODELTYPE_COLOR = "color";

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) return;


    	        //css custom classes
	        var css = {
	            wrapper: 'vzb-treemenu-wrap',
	            search: 'vzb-treemenu-search',
	            list: 'vzb-treemenu-list',
	            list_item: 'vzb-treemenu-list_item',
	            hasChild: 'vzb-treemenu-list_item--children',
	            list_item_label: 'vzb-treemenu-list_item_label',
	            list_top_level: 'vzb-treemenu-list_top',
	            search_wrap: 'vzb-treemenu-search_wrap',
	            isSpecial: 'vzb-treemenu-list_item--special',
	            hidden: 'vzb-hidden',
	            title: 'vzb-treemenu-title'    
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
	            MOBILE_BREAKPOINT: 400, //mobile breakpoint
	            CURRENT_PATH: [], //current active path
	            CURRENT_PROFILE: null, //current resize profile
	            MIN_COL_WIDTH: 50 //minimal column size
	        };

	        var resizeProfiles = [
                { col_width: 300, min: 1280 },
                { col_width: 250, min: 1024 },
                { col_width: 200, min: OPTIONS.MOBILE_BREAKPOINT }
	        ];
    
    
	        //default callback
	        var callback = function(indicator) {
	            console.log("Indicator selector: stub callback fired. New indicator is ", indicator);
	        };

	        //data
	        var tree;

	        //langStrings
	        var langStrings;

	        //language
	        var lang;
    
            //maker id
            var markerID;

    
    
	Vizabi.Component.extend('gapminder-treemenu', {


        //setters-getters
        tree: function(input) { if (!arguments.length) return tree; tree = input; return this; },
        lang: function(input) { if (!arguments.length) return lang; lang = input; return this; },
        langStrings: function(input) { if (!arguments.length) return langStrings; langStrings = input; return this; },
        callback: function(input) { if (!arguments.length) return callback; callback = input; return this; },
        markerID: function(input) { if (!arguments.length) return markerID; markerID = input; return this; },

        init: function(config, context) {
	        var _this = this;

	        this.model_expects = [{
	            name: "marker"
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
                //...add properties here
	        }, this.ui);

	    },

	    ready: function() {
	        this.updateView();
	    },

	    readyOnce: function() {
	        //this function is only called once at start, when both DOM and this.model are ready
	        //this.element contains the view where you can append the menu
	        this.element = d3.select(this.placeholder);

	        //menu class private 
	        var _this = this;


	        //general markup
	        var skeleton = this.element
                .append('div')
                .classed(css.wrapper, true)
                .attr('id', OPTIONS.MENU_ID)
            
            skeleton.append('div')
                .classed(css.title, true)
                .append('span');
            
            skeleton.append('div')
                .classed(css.search_wrap, true)
                .append('input')
                .classed(css.search, true)
                .attr("placeholder", "Search...")
                .attr('type', 'text')
                .attr('id', css.search + '_' + OPTIONS.MENU_ID);





	        //init functions
	        d3.select('body')
                .on('mousemove', _this._mousemoveDocument)
                .select('#' + OPTIONS.MENU_ID)
                .on('mouseleave', function(){_this._closeAllSub(this)});
	        _this._enableSearch();
	        _this._watchContainerSize();

	    },
        
        
        
        
        
        
        
        
        
        toggle: function() {
	            var wrapper = d3.select('#' + OPTIONS.MENU_ID);
	            var hidden = this.element.classed(css.hidden);

	            this.element.classed(css.hidden, !hidden);
            
	            if (!hidden) {
	                wrapper
	                    .selectAll('.' + css.list_item)
	                    .filter('.marquee')
	                    .each(function() {
	                        _this._marqueeToggle(this, false);
	                    });
	            };
	        },


        

	        //if menu lost focus close all levels
	        _closeAllSub: function(view) {
	            view = d3.select(view);

	            view.selectAll('.active')
	                .classed('active', false);

	            view.selectAll('.marquee')
	                .classed('marquee', false);

	            this._resizeDropdown();
	        },

        
        
        
        	        //Keep track of the last few locations of the mouse.
	        _mousemoveDocument: function() {
	            var coordinates = d3.mouse(this);
	            OPTIONS.MOUSE_LOCS.push({x: coordinates[0], y: coordinates[1]});

	            if (OPTIONS.MOUSE_LOCS.length > OPTIONS.MOUSE_LOCS_TRACKED) {
	                OPTIONS.MOUSE_LOCS.shift();
	            }
	        },
        
        
        
	        /**
	         * Return the amount of time that should be used as a delay before the
	         * currently hovered row is activated.
	         *
	         * Returns 0 if the activation should happen immediately. Otherwise,
	         * returns the number of milliseconds that should be delayed before
	         * checking again to see if the row should be activated.
	         */
	        _activationDelay: function(submenu) {
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
	        },

 
 
        
	        //watch for resizing
	        _watchContainerSize: function() {
                var _this = this;

	            OPTIONS.CONTAINER_DIMENSIONS = {
	                height: _this.element.node().offsetHeight,
	                width: _this.element.node().offsetWidth
	            };

	            var switchProfile = function(width) {
	                for (var i = 0; i < resizeProfiles.length; i++) {
	                    if(resizeProfiles[i].min < width && i == 0 || resizeProfiles[i].min < width && i != 0 && width < _this.resizeProfiles[i - 1].min) {
	                        OPTIONS.CURRENT_PROFILE = resizeProfiles[i];
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

	                    _this.element
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
	                var elem = _this.element,
	                    width = _this.element.node().offsetWidth,
	                    height = _this.element.node().offsetHeight;

	                // If element size has changed since the last time, update the element
	                // data store and trigger the 'resize' event.
	                if ( width !== OPTIONS.CONTAINER_DIMENSIONS.width || height !== OPTIONS.CONTAINER_DIMENSIONS.height ) {
	                    OPTIONS.CONTAINER_DIMENSIONS.width = width;
	                    OPTIONS.CONTAINER_DIMENSIONS.height = height;
	                }

	                switchProfile(OPTIONS.CONTAINER_DIMENSIONS.width);

	                //loop
	                _this._watchContainerSize();

	            }, 500 );
	        },

 
 
        
        
        
        
	        //search listener
	        _enableSearch: function() {
                var _this = this;
                
	            var input = d3.select('#' + css.search + '_' + OPTIONS.MENU_ID);

	            //it forms the array of possible queries
	            var getMatches = function(value) {
	                var matches = [];

	                //translation integration
	                var translation = function(value, data, i) {
	                    var arr = [];
	                    if (_this.langStrings()) {
	                        for (var language in _this.langStrings()) {
	                            for (var key in _this.langStrings()[language]) {
	                                if (_this.langStrings()[language][key].toLowerCase().indexOf(value.toLowerCase()) >= 0) {
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
	                                data[i][OPTIONS.SEARCH_PROPERTY] == translation(value, data, i);

	                        if (match) {
	                            matches.push(data[i]);
	                        }

	                        if(data[i][OPTIONS.SUBMENUS]) {
	                            matching(data[i][OPTIONS.SUBMENUS]);
	                        }
	                    }
	                };

	                matching(tree);

	                return matches;
	            };

	            var searchIt = function() {
	                var value = input.node().value;

	                if(value.length >= OPTIONS.SEARCH_MIN_STR) {
	                    _this.redraw(getMatches(value));
	                } else {
	                    _this.redraw();
	                }
	            };

	            input.on('keyup', searchIt);
	        },


        
        
        	        //marquee animation
	        _marqueeToggle: function(node, toggle) {
	            var selection = d3.select(node),
	                label = selection.select('.' + css.list_item_label);

	            if (toggle) {
	                if(label.node().scrollWidth > node.offsetWidth) {
	                    selection.classed('marquee', true);
	                }
	            } else {
	                selection.classed('marquee', false);
	            }
	        },
 
        
	        //resize function
	       _resizeDropdown: function() {
               
               var _this = this;

	            if (!OPTIONS.IS_MOBILE) {

	                var ulArr = [];
	                ulArr.push(d3.select('#' + OPTIONS.MENU_ID).node());
	                _this.element
	                    .selectAll('.' + css.list + '.active')
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

	        },
        
        
        
        	        //open submenu
	       _toggleSub: function(view){

	            var _this = this;

	            var curSub = view.node().parentNode;

	            var possiblyActivate = function(event, it) {

	                if ((OPTIONS.IS_MOBILE && event.type == 'click')) {

	                    closeAll(curSub);
	                    if (!view.classed('active')) {
	                        open(it);
	                    };
	                    return;

	                } else if (!OPTIONS.IS_MOBILE && event.type == 'mouseenter') {
	                    var delay = _this._activationDelay(curSub);

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
	                    .select('.'+css.list)
	                    .classed('active', true);

	                _this._marqueeToggle(node, true);
	            };

	            var closeAll = function(node){
	                var li = d3.select(node)
	                   .selectAll('.'+css.list_item+':not(:hover)');

	                li.each(function() {
	                        d3.select(this)
	                            .selectAll('.'+css.list)
	                            .each(function() {
	                                d3.select(this)
	                                    .classed('active', false);
	                            });
	                    });

	                li.filter('.marquee')
	                    .each(function() {
	                        _this._marqueeToggle(this, false);
	                    });

	                _this._resizeDropdown();

	            };

	            var closeCurSub = function() {
	                if (!OPTIONS.IS_MOBILE) {
	                    var selectSub = d3.select(curSub);

	                    selectSub
	                        .classed('active', false)
	                        .attr('style', '');
	                };

	            };



	            d3.select(curSub)
	                .select('.' + css.list_item)
	                .node()
	                .addEventListener('mouseleave', closeCurSub, false);

	            view.node()
	                .addEventListener('mouseenter', function() { possiblyActivate(event, this); }, false);

	            view.node()
	                .addEventListener('click', function() { possiblyActivate(event, this); }, false);

	        },
        
        
        
	        //this function process click on list item
	        _selectIndicator: function(view) {
                
	            var item = d3.select(view).data()[0];

                //only for leaf nodes
	            if (!item.children) {
	                callback(item.id, markerID);
	                this.toggle();
	            };

	        },
        
        
        
        
	        //function is redrawing data and built structure
	        redraw: function (data){
                var _this = this;
                
                this.element.select("." + css.title).select("span")
                    .text( this.translator("buttons/" + markerID) );
                
                if (data == null) data = tree;
                    
	            this.element
                    .select('#' + OPTIONS.MENU_ID)
                    .select('.' + css.list_top_level)
                    .remove();

	            //redrawing first level
	            var firstLevelMenu = this.element
                    .select('#' + OPTIONS.MENU_ID)
                    .append('ul')
                    .classed(css.list_top_level, true);

	            //translation integration
//	            var getTranslation = function(d) {
//	                if (_this.lang()) {
//	                    for (var key in _this.langStrings()[_this.lang()]) {
//	                        if (_this.langStrings()[_this.lang()].hasOwnProperty(d['id'])) {
//	                            if (key == d['id']) {
//	                                return _this.langStrings()[_this.lang()][key];
//	                            }
//	                        } else {
//	                            return d['id'];
//	                        }
//	                    };
//	                } else {
//	                    return d['id'];
//	                };
//	            };
                
                var indicatorsDB = globals.metadata.indicatorsDB;
                
                var filterAvailable = function(data){
                    return data
                        .filter(function(f){
                            return f.children || globals.metadata.indicatorsArray.indexOf(f.id) > -1;
                        })
                        .filter(function(f){
                        
                            //keep indicator if nothing is specified in tool properties
                            if (!_this.model.marker[markerID].allow || !_this.model.marker[markerID].allow.scales) return true;
                            //keep indicator if any scale is allowed in tool properties
                            if (_this.model.marker[markerID].allow.scales[0] == "*") return true;
                        
                            //keep indicator if it is a folder
                            if(f.children) return true;

                            //check if there is an intersection between the allowed tool scale types and the ones of indicator
                            for (var i = indicatorsDB[f.id].scales.length - 1; i >= 0; i--) {
                                if (_this.model.marker[markerID].allow.scales.indexOf(indicatorsDB[f.id].scales[i]) > -1) return true;
                            }

                            return false;
                        })
                };

	            //bind the data
	            var li = firstLevelMenu.selectAll('li')
                    .data(filterAvailable(data), function(d){ return d['id']; });

	            //removing old items
	            li.exit().remove();


	            //adding new items
	            li.enter().append('li');

	            li.append('span')
	                .classed(css.list_item_label, true)
	                .text(function(d){
	                    return _this.translator("indicator/" + d.id);
	                })
	                .on('click', function(){_this._selectIndicator(this)});

	            li.classed(css.list_item, true)
	                .classed(css.hasChild, function(d) { return d['children']; })
	                .classed(css.isSpecial, function(d) { return d['special']; })
	                .each(function(d) {
	                    var view = d3.select(this);
	                    _this._toggleSub(view);

	                    var parsingProcess = function(select, data) {
	                        if(data != null) {
	                            var li = select
	                                .append('ul')
	                                .classed(css.list, true)
	                                .selectAll('li')
	                                .data(filterAvailable(data), function(d) { return d['id']; })
	                                .enter()
	                                .append('li');

	                            li.append('span')
	                                .classed(css.list_item_label, true)
	                                .text(function (d) {
	                                    return _this.translator("indicator/" + d.id);
	                                })
	                                .on('click', function(){_this._selectIndicator(this)});

	                            li.classed(css.list_item, true)
	                                .classed(css.hasChild, function(d) { return d['children']; })
	                                .classed(css.isSpecial, function(d) { return d['special']; })
	                                .each(function(d){
	                                    _this._toggleSub(d3.select(this));
	                                    parsingProcess(d3.select(this), d['children']);
	                                });
	                        };
	                    };

	                    parsingProcess(view, d['children']);

	                });

                return this;
	        },
        
        
        
        
        
        

	    updateView: function() {
	        var _this = this;
            var languageID = _this.model.language.id;
            
            if(!markerID) return;
            
            var strings = langStrings? langStrings : {};
            strings[languageID] = _this.model.language.strings[languageID];
            
            this.translator = this.model.language.getTFunction();
            
	        var setModel = this._setModel.bind(this);
	        this.langStrings(strings)
                .lang(languageID)
                .callback(setModel)
                .tree(globals.metadata.indicatorsTree)
                .redraw();
            
            return this;
	    },

	    _setModel: function(value, markerID) {
            
            var indicatorsDB = globals.metadata.indicatorsDB;


            var mdl = this.model.marker[markerID];

            var obj = {};
            
            obj.which = value;
	        obj.use = indicatorsDB[value].use;
	        obj.scaleType = indicatorsDB[value].scales[0];
            
            if (mdl.getType() == 'axis') {
                obj.min = null;
                obj.max = null;
            }
             

            mdl.set(obj);
            
            
	    }


	});

}).call(this);