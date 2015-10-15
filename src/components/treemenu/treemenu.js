import { extend, pruneTree } from 'base/utils';
import Component from 'base/component';
import globals from 'base/globals';
import {close as iconClose} from 'base/iconset';

/*!
 * VIZABI INDICATOR PICKER
 * Reusable indicator picker component
 */

var INDICATOR = "which";
var MIN = "min";
var MAX = "max";
var SCALETYPE = "scaleType";
var MODELTYPE_COLOR = "color";


//css custom classes
var css = {
  wrapper: 'vzb-treemenu-wrap',
  background: 'vzb-treemenu-background',
  close: 'vzb-treemenu-close',
  search: 'vzb-treemenu-search',
  list: 'vzb-treemenu-list',
  list_item: 'vzb-treemenu-list-item',
  hasChild: 'vzb-treemenu-list-item-children',
  list_item_label: 'vzb-treemenu-list-item-label',
  list_top_level: 'vzb-treemenu-list-top',
  search_wrap: 'vzb-treemenu-search-wrap',
  isSpecial: 'vzb-treemenu-list-item-special',
  hidden: 'vzb-hidden',
  title: 'vzb-treemenu-title',
  alignYt: 'vzb-align-y-top',
  alignYb: 'vzb-align-y-bottom',
  alignXl: 'vzb-align-x-left',
  alignXr: 'vzb-align-x-right'
};

//options and globals
var OPTIONS = {
  MOUSE_LOCS: [], //contains last locations of mouse
  MOUSE_LOCS_TRACKED: 3, //max number of locations of mouse
  DELAY: 200, //amazons multilevel delay
  TOLERANCE: 150, //this parameter is used for controlling the angle of multilevel dropdown
  LAST_DELAY_LOC: null, //this is cached location of mouse, when was a delay
  TIMEOUT: null, //timeout id
  SEARCH_PROPERTY: 'id', //property in input data we we'll search by
  SUBMENUS: 'children', //property for submenus (used by search)
  SEARCH_MIN_STR: 2, //minimal length of query string to start searching
  RESIZE_TIMEOUT: null, //container resize timeout
  MOBILE_BREAKPOINT: 400, //mobile breakpoint
  CURRENT_PATH: [], //current active path
  MIN_COL_WIDTH: 50 //minimal column size
};


//default callback
var callback = function(indicator) {
  console.log("Indicator selector: stub callback fired. New indicator is ", indicator);
};

var tree;
var langStrings;
var lang;
var markerID;
var alignX = "center";
var alignY = "center";

var TreeMenu = Component.extend({

  //setters-getters
  tree: function(input) {
    if(!arguments.length) return tree;
    tree = input;
    return this;
  },
  lang: function(input) {
    if(!arguments.length) return lang;
    lang = input;
    return this;
  },
  langStrings: function(input) {
    if(!arguments.length) return langStrings;
    langStrings = input;
    return this;
  },
  callback: function(input) {
    if(!arguments.length) return callback;
    callback = input;
    return this;
  },
  markerID: function(input) {
    if(!arguments.length) return markerID;
    markerID = input;
    return this;
  },
  alignX: function(input) {
    if(!arguments.length) return alignX;
    alignX = input;
    return this;
  },
  alignY: function(input) {
    if(!arguments.length) return alignY;
    alignY = input;
    return this;
  },

  init: function(config, context) {

    var _this = this;

    this.name = 'gapminder-treemenu';
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

    this.ui = extend({
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

    this.element.selectAll("div").remove();

    //general markup

    this.element.append("div")
      .attr("class", css.background)
      .on("click", function() {
        _this.toggle()
      });

    this.wrapper = this.element
      .append('div')
      .classed(css.wrapper, true);

    this.wrapper.append("div")
      .html(iconClose)
      .on("click", function() {
        _this.toggle()
      })
      .select("svg")
      .attr("width", "0px")
      .attr("height", "0px")
      .attr("class", css.close)

    this.wrapper.append('div')
      .classed(css.title, true)
      .append('span');

    this.wrapper.append('div')
      .classed(css.search_wrap, true)
      .append('input')
      .classed(css.search, true)
      .attr("placeholder", "Search...")
      .attr('type', 'text')
      .attr('id', css.search);


    //init functions
    d3.select('body').on('mousemove', _this._mousemoveDocument)

    this.wrapper.on('mouseleave', function() {
      _this._closeAllSub(this)
    });

    _this._enableSearch();

    _this.resize();
  },

  //happens on resizing of the container
  resize: function() {
    var _this = this;

    this.profiles = {
      "small": {
        col_width: 150
      },
      "medium": {
        col_width: 170
      },
      "large": {
        col_width: 200
      }
    };

    this.activeProfile = this.profiles[this.getLayoutProfile()];
    this.width = _this.element.node().offsetWidth;

    OPTIONS.IS_MOBILE = this.getLayoutProfile() === "small";

  },



  toggle: function() {
    var _this = this;
    var hidden = !this.element.classed(css.hidden);

    this.element.classed(css.hidden, hidden);

    if(hidden) {
      this.wrapper.selectAll('.' + css.list_item)
        .filter('.marquee')
        .each(function() {
          _this._marqueeToggle(this, false);
        });
    };

    this.parent.components.forEach(function(c) {
      if(c.element.classed) {
        c.element.classed("vzb-blur", c != _this && !hidden);
      } else {
        d3.select(c.element).classed("vzb-blur", c != _this && !hidden);
      }
    })

    this.width = _this.element.node().offsetWidth;
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
    OPTIONS.MOUSE_LOCS.push({
      x: coordinates[0],
      y: coordinates[1]
    });

    if(OPTIONS.MOUSE_LOCS.length > OPTIONS.MOUSE_LOCS_TRACKED) {
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

    if($menu.getElementsByClassName('active').length == 0) {
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

    if(!loc) {
      return 0;
    }

    if(!prevLoc) {
      prevLoc = loc;
    }

    if(prevLoc.x < $menu.offsetLeft ||
      prevLoc.y < $menu.offsetTop || prevLoc.y > lowerRight.y) {
      // If the previous mouse location was outside of the entire
      // menu's bounds, immediately activate.
      return 0;
    }

    if(OPTIONS.LAST_DELAY_LOC &&
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
      return(b.y - a.y) / (b.x - a.x);
    };

    var decreasingCorner = upperRight,
      increasingCorner = lowerRight;

    var decreasingSlope = slope(loc, decreasingCorner),
      increasingSlope = slope(loc, increasingCorner),
      prevDecreasingSlope = slope(prevLoc, decreasingCorner),
      prevIncreasingSlope = slope(prevLoc, increasingCorner);

    if(decreasingSlope < prevDecreasingSlope &&
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





  //search listener
  _enableSearch: function() {
    var _this = this;

    var input = this.wrapper.select('.' + css.search);

    //it forms the array of possible queries
    var getMatches = function(value) {
      var matches = {
        _id: 'root',
        children: []
      };

      //translation integration
      var translation = function(value, data, i) {

        var arr = [];
        if(_this.langStrings()) {
          for(var language in _this.langStrings()) {
            for(var key in _this.langStrings()[language]) {
              if(key.indexOf('indicator/') == 0 &&
                _this.langStrings()[language][key].toLowerCase().indexOf(
                  value.toLowerCase()) >= 0) {
                return key;
              };
            };
          };
        };
      };

      var matching = function(data) {
        for(var i = 0; i < data.length; i++) {
          var match = false;
          match = match || (data[i][OPTIONS.SEARCH_PROPERTY].toLowerCase().indexOf(
              value.toLowerCase()) >= 0) ||
            data[i][OPTIONS.SEARCH_PROPERTY] == translation(value, data, i);
          if(match) {
            matches.children.push(data[i]);
          }
          if(data[i][OPTIONS.SUBMENUS]) {
            matching(data[i][OPTIONS.SUBMENUS]);
          }
        }
      };
      matching(tree.children);
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

    if(toggle) {
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

    if(!OPTIONS.IS_MOBILE) {

      var ulArr = [];
      ulArr.push(this.wrapper.node());
      _this.element
        .selectAll('.' + css.list + '.active')
        .each(function() {
          ulArr.push(this);
        });

      var fullColNumber = Math.floor(this.width / this.activeProfile.col_width);

      var remain = this.width - fullColNumber * this.activeProfile.col_width;

      if(remain < OPTIONS.MIN_COL_WIDTH) {
        fullColNumber -= 1;
        remain += this.activeProfile.col_width
      };

      for(var i = ulArr.length - 1; i >= 0; i--) {
        var ulSelectNested = d3.select(ulArr[i]);

        if(fullColNumber > 0) {
          ulSelectNested
            .transition()
            .duration(200)
            .style('width', this.activeProfile.col_width + "px");
          fullColNumber--;
        } else {
          if(remain > OPTIONS.MIN_COL_WIDTH) {
            ulSelectNested
              .transition()
              .duration(200)
              .style('width', (remain / (i + 1)) + "px");
            remain -= remain / (i + 1);
          } else {
            ulSelectNested
              .transition()
              .duration(200)
              .style('width', remain + "px");
            remain = 0;
          };
        };
      };

      OPTIONS.CURRENT_PATH = ulArr;

    }

  },



  //open submenu
  _toggleSub: function(view) {

    var _this = this;

    var curSub = view.node().parentNode;

    var possiblyActivate = function(event, it) {

      if((OPTIONS.IS_MOBILE && event.type == 'click')) {

        closeAll(curSub);
        if(!view.classed('active')) {
          open(it);
        };
        return;

      } else if(!OPTIONS.IS_MOBILE && event.type == 'mouseenter') {
        var delay = _this._activationDelay(curSub);

        if(delay) {
          OPTIONS.TIMEOUT = setTimeout(function() {
            possiblyActivate(event, it);
          }, delay);
        } else {
          open(it);
          closeAll(curSub);
        };
      };


    };

    var open = function(node) {
      d3.select(node)
        .select('.' + css.list)
        .classed('active', true);

      _this._marqueeToggle(node, true);
    };

    var closeAll = function(node) {
      var li = d3.select(node)
        .selectAll('.' + css.list_item + ':not(:hover)');

      li.each(function() {
        d3.select(this)
          .selectAll('.' + css.list)
          .each(function() {
            d3.select(this).classed('active', false);
          });
      });

      li.filter('.marquee')
        .each(function() {
          _this._marqueeToggle(this, false);
        });

      _this._resizeDropdown();

    };

    var closeCurSub = function() {
      if(!OPTIONS.IS_MOBILE) {
        var selectSub = d3.select(curSub);

        selectSub
          .classed('active', false)
          .attr('style', '');
      };

    };



    d3.select(curSub)
      .select('.' + css.list_item)
      .on('mouseleave', closeCurSub, false);

    view.on('mouseenter', function() {
      possiblyActivate(event, this);
    });

    view.on('click', function() {
      possiblyActivate(event, this);
    });

  },



  //this function process click on list item
  _selectIndicator: function(item, view) {

    view = d3.select(view);

    //only for leaf nodes
    if(view.attr("children")) return;
    callback(view.attr("info"), markerID);
    this.toggle();
  },




  //function is redrawing data and built structure
  redraw: function(data) {
    var _this = this;

    this.element.select('.' + css.title).select("span")
      .text(this.translator("buttons/" + markerID));

    if(data == null) data = tree;
    this.wrapper.select('ul').remove();

    var indicatorsDB = globals.metadata.indicatorsDB;

    var allowedIDs = globals.metadata.indicatorsArray.filter(function(f) {
      //keep indicator if nothing is specified in tool properties
      if(!_this.model.marker[markerID].allow || !_this.model.marker[markerID].allow.scales) return true;
      //keep indicator if any scale is allowed in tool properties
      if(_this.model.marker[markerID].allow.scales[0] == "*") return true;

      //check if there is an intersection between the allowed tool scale types and the ones of indicator
      for(var i = indicatorsDB[f].scales.length - 1; i >= 0; i--) {
        if(_this.model.marker[markerID].allow.scales.indexOf(indicatorsDB[f].scales[i]) > -1) return true;
      }

      return false;
    })

    var dataFiltered = pruneTree(data, function(f) {
     return allowedIDs.indexOf(f.id) > -1
    });



    var createSubmeny = function(select, data, toplevel) {
      if(!data.children) return;
      var li = select.append('ul')
        .classed(css.list, !toplevel)
        .classed(css.list_top_level, toplevel)
        .selectAll('li')
        .data(data.children, function(d) {
          return d['id'];
        })
        .enter()
        .append('li');

      li.append('span')
        .classed(css.list_item_label, true)
        .text(function(d) {
          return _this.translator("indicator/" + d.id);
        })
        .attr("info", function(d) {
          return d.id;
        })
        .attr("children", function(d) {
          return d.children ? "true" : null;
        })
        .on('click', function(d) {
          _this._selectIndicator(d, this)
        });

      li.classed(css.list_item, true)
        .classed(css.hasChild, function(d) {
          return d['children'];
        })
        .classed(css.isSpecial, function(d) {
          return d['special'];
        })
        .each(function(d) {
          var view = d3.select(this);
          _this._toggleSub(view);
          createSubmeny(view, d);
        });
    };

    createSubmeny(this.wrapper, dataFiltered, true);


    return this;
  },







  updateView: function() {
    var _this = this;
    var languageID = _this.model.language.id;

    if(!markerID) return;


    this.wrapper.classed(css.alignYt, alignY === "top");
    this.wrapper.classed(css.alignYb, alignY === "bottom");
    this.wrapper.classed(css.alignXl, alignX === "left");
    this.wrapper.classed(css.alignXr, alignX === "right");

    var strings = langStrings ? langStrings : {};
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

    if(mdl.getType() == 'axis') {
      obj.min = null;
      obj.max = null;
    }


    mdl.set(obj);


  }


});

export default TreeMenu;
