import * as utils from 'base/utils';
import Component from 'base/component';
import Class from 'class';
import {close as iconClose} from 'base/iconset';

/*!
 * VIZABI INDICATOR PICKER
 * Reusable indicator picker component
 */

var INDICATOR = "which";
var SCALETYPE = "scaleType";
var MODELTYPE_COLOR = "color";
var MENU_HORIZONTAL = 1;
var MENU_VERTICAL = 2;

//css custom classes
var css = {
  wrapper: 'vzb-treemenu-wrap',
  wrapper_outer: 'vzb-treemenu-wrap-outer',
  background: 'vzb-treemenu-background',
  close: 'vzb-treemenu-close',
  search: 'vzb-treemenu-search',
  list: 'vzb-treemenu-list',
  list_outer: 'vzb-treemenu-list-outer',
  list_item: 'vzb-treemenu-list-item',
  list_item_leaf: 'vzb-treemenu-list-item-leaf',
  leaf: 'vzb-treemenu-leaf',
  leaf_content: 'vzb-treemenu-leaf-content',
  leaf_content_item: 'vzb-treemenu-leaf-content-item',
  leaf_content_item_title: 'vzb-treemenu-leaf-content-item-title',
  leaf_content_item_descr: 'vzb-treemenu-leaf-content-item-descr',
  hasChild: 'vzb-treemenu-list-item-children',
  list_item_label: 'vzb-treemenu-list-item-label',
  list_top_level: 'vzb-treemenu-list-top',
  search_wrap: 'vzb-treemenu-search-wrap',
  isSpecial: 'vzb-treemenu-list-item-special',
  hidden: 'vzb-hidden',
  title: 'vzb-treemenu-title',
  scaletypes: 'vzb-treemenu-scaletypes',
  scaletypesDisabled: 'vzb-treemenu-scaletypes-disabled',
  scaletypesActive: 'vzb-treemenu-scaletypes-active',
  alignYt: 'vzb-align-y-top',
  alignYb: 'vzb-align-y-bottom',
  alignXl: 'vzb-align-x-left',
  alignXr: 'vzb-align-x-right',
  alignXc: 'vzb-align-x-center',
  menuHorizontal: 'vzb-treemenu-horizontal',
  menuVertical: 'vzb-treemenu-vertical',
  absPosVert: 'vzb-treemenu-abs-pos-vert',
  absPosHoriz: 'vzb-treemenu-abs-pos-horiz',
  menuOpenLeftSide: 'vzb-treemenu-open-left-side',
  noTransition: 'notransition'
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
  SEARCH_MIN_STR: 1, //minimal length of query string to start searching
  RESIZE_TIMEOUT: null, //container resize timeout
  MOBILE_BREAKPOINT: 400, //mobile breakpoint
  CURRENT_PATH: [], //current active path
  MIN_COL_WIDTH: 60, //minimal column size
  MENU_DIRECTION: MENU_HORIZONTAL,
  MAX_MENU_WIDTH: 320,
  MENU_OPEN_LEFTSIDE: false
};

var Menu = Class.extend({
  init: function (parent, menu) {
    var _this = this;
    this.parent = parent;
    this.entity = menu;
    this.width = OPTIONS.MIN_COL_WIDTH;
    this.direction = OPTIONS.MENU_DIRECTION;
    this._setDirectionClass();
    this.menuItems = [];
    var menuItemsHolder;
    
    if(this.entity.empty()) return this;

    this.entity.each(function() {
      menuItemsHolder = d3.selectAll(this.childNodes).filter(function() {
        return d3.select(this).classed(css.list);
      });
    });
    if(menuItemsHolder.empty()) menuItemsHolder = this.entity;
    menu.selectAll('.' + css.list_item)
      .filter(function() {
        return this.parentNode == menuItemsHolder.node();
      })
      .each(function() {
        _this.addSubmenu(d3.select(this));
      });
    return this;
  },
  setWidth: function(width, recursive, immediate) {
    if (this.width != width && this.entity.node()) {
      this.width = width;
      if ((this.entity.classed(css.list_top_level) || this.entity.classed('active')) && this.direction == MENU_HORIZONTAL) {
        if(!immediate) {
          this.entity.transition()
            .delay(0)
            .duration(100)
            .style('width', this.width + "px")
        } else {
          this.entity.style('width', this.width + "px");
        }
      }
      if (this.entity.classed(css.list_top_level)) {
        this.entity.selectAll('.' + css.leaf).style('width', this.width - 1 + "px");
      }
      if (recursive) {
        for (var i = 0; i < this.menuItems.length; i++) {
          this.menuItems[i].setWidth(this.width, recursive, immediate);
        }
      }
      return this;
    }
  },
  /**
   * configure menu type (horizontal or vertical)
   * @param direction MENU_HORIZONTAL or MENU_VERTICAL
   * @param recursive change direction over menu sublevels
   * @returns {Menu}
   */
  setDirection: function(direction, recursive) {
    this.direction = direction;
    this.entity
      .style('width', '')
      .style('height', '');
    if (recursive) {
      for (var i = 0; i < this.menuItems.length; i++) {
        this.menuItems[i].setDirection(this.direction, recursive);
      }
    }
    this._setDirectionClass();
    return this;
  },
  _setDirectionClass: function() {
    if (this.direction == MENU_HORIZONTAL) {
      this.entity.classed(css.menuVertical, false);
      this.entity.classed(css.menuHorizontal, true);
    } else {
      this.entity.classed(css.menuHorizontal, false);
      this.entity.classed(css.menuVertical, true);
    }
  },
  addSubmenu: function(item) {
    this.menuItems.push(new MenuItem(this, item))
  },
  open: function() {
    var _this = this;
    if (!this.isActive()) {
      _this.parent.parentMenu.openSubmenuNow = true;
      this.closeNeighbors(function() {
        if (_this.direction == MENU_HORIZONTAL) {
          _this._openHorizontal();
          _this.calculateMissingWidth(0);
        } else {
          _this._openVertical();
        }
      });
      _this.parent.parentMenu.openSubmenuNow = false;      
    }
    return this;
  },
  /**
   * recursively calculate missed width for last menu level
   * @param width
   * @param cb
   */
  calculateMissingWidth: function(width, cb) {
    var _this = this;
    if (this.entity.classed(css.list_top_level)) {
      if (width > OPTIONS.MAX_MENU_WIDTH) {
        if (typeof cb === "function") cb(width - OPTIONS.MAX_MENU_WIDTH);
      }
    } else {
      this.parent.parentMenu.calculateMissingWidth(width + this.width, function(widthToReduce) {
        if (widthToReduce > 0) {
          _this.reduceWidth(widthToReduce, function(newWidth) {
            if (typeof cb === "function") cb(newWidth); // callback is not defined if it is emitted from this level
          });
        } else if (typeof cb === "function") cb(widthToReduce);
      });
    }
  },
  /**
   * restore width (if it was reduced before)
   * @param width
   * @param isClosedElement (parameter for check if curent element emit this action)
   * @param cb
   */
  restoreWidth: function(width, isClosedElement, cb) {
    var _this = this;
    if (isClosedElement) {
      this.parent.parentMenu.restoreWidth(width, false, cb);
    } else if (width <= 0) {
      if (typeof cb === "function") cb();
    } else if (!this.entity.classed(css.list_top_level)) {
      var currentElementWidth =  this.entity.node().offsetWidth;
      var newElementWidth = Math.min(width, _this.width);
      if (currentElementWidth < newElementWidth) {
        var duration = 250*(currentElementWidth / newElementWidth);
        this.entity.transition()
          .delay(0)
          .duration(duration)
          .style('width', newElementWidth + "px")
          .each('end', function() {
          });
        _this.parent.parentMenu.restoreWidth(width - newElementWidth, false, cb);
      } else {
        this.parent.parentMenu.restoreWidth(width, false, cb);
      }
    } else {
      if (typeof cb === "function") cb();
    }
  },
  /**
   * made element narrower to free space for other element
   * @param width
   * @param cb
   */
  reduceWidth: function(width, cb) {
    var _this = this;
    var currWidth = this.entity.node().offsetWidth;

    if (currWidth <= OPTIONS.MIN_COL_WIDTH) {
      cb(width - _this.width + currWidth);
    } else {

      var newElementWidth = Math.max(OPTIONS.MIN_COL_WIDTH, _this.width - width);
      var duration = 250 / (_this.width / newElementWidth);
      this.entity.transition()
        .delay(0)
        .duration(duration)
        .style('width', newElementWidth + "px")
        .each('end', function() {
          cb(width - _this.width + newElementWidth);
        });
    }
  },
  _openHorizontal: function() {
    var _this = this;
    _this.entity.classed('active', true)
      .transition()
      .delay(0)
      .duration(250)
      .style('width', _this.width + "px")
      .each('end', function() {
        _this.marqueeToggle(true);
      });
  },
  _openVertical: function() {
    var _this = this;
    _this.entity.style('height','0px');
    _this.entity.transition()
      .delay(0)
      .duration(250)
      .style('height', (36 * _this.menuItems.length) + "px")
      .each('end', function() {
        _this.entity.style('height', 'auto');
        _this.marqueeToggle(true);
        _this.scrollToFitView();
      });
    _this.entity.classed('active', true);
  },
  closeAllChildren: function(cb) {
    var callbacks = 0;
    for (var i = 0; i < this.menuItems.length; i++) {
      if (this.menuItems[i].isActive()) {
        ++callbacks;
        this.menuItems[i].submenu.close(function() {
          if (--callbacks == 0) {
            if (typeof cb === "function") cb();
          }
        });
      }
    }
    if (callbacks == 0) {
      if (typeof cb === "function") cb();
    }
  },
  closeNeighbors: function(cb) {
    if (this.parent) {
      this.parent.closeNeighbors(cb);
    } else {
      cb();
    }
  },
  close: function(cb) {
    var _this = this;
    this.closeAllChildren(function() {
      if (_this.direction == MENU_HORIZONTAL) {
        _this._closeHorizontal(cb);
      } else {
        _this._closeVertical(cb);
      }
    })
  },
  _closeHorizontal: function(cb) {
    var elementWidth = this.entity.node().offsetWidth;
    var _this = this;
    var openSubmenuNow = _this.parent.parentMenu.openSubmenuNow;
    _this.entity.transition()
      .delay(0)
      .duration(20)
      .style('width', 0 + "px")
      .each('end', function() {
        _this.marqueeToggle(false);
        _this.entity.classed('active', false);
        if(!openSubmenuNow) {
          _this.restoreWidth(OPTIONS.MAX_MENU_WIDTH, true, function() {
            if (typeof cb === "function") cb();
          });
        } else {
          if (typeof cb === "function") cb();
        }
      });
  },
  _closeVertical: function(cb) {
    var _this = this;
    _this.entity
      .transition()
      .delay(0)
      .duration(100)
      .style('height', 0 + "px")
      .each('end', function() {
        _this.marqueeToggle(false);
        _this.entity.classed('active', false);
        if (typeof cb === "function") cb();
      });
  },
  isActive: function() {
    return this.entity.classed('active');
  },
  marqueeToggle: function(toggle) {
    for (var i = 0; i < this.menuItems.length; i++) {
      this.menuItems[i].marqueeToggle(toggle);
    }
  },
  marqueeToggleAll: function(toggle) {
    for (var i = 0; i < this.menuItems.length; i++) {
      this.menuItems[i].marqueeToggleAll(toggle);
    }
  },
  findItemByName: function(name) {
    for (var i = 0; i < this.menuItems.length; i++) {
      if(this.menuItems[i].entity.select('.' + css.list_item_label).text() == name) {
        return this.menuItems[i];
      }
      if(this.menuItems[i].submenu) {
        var item = this.menuItems[i].submenu.findItemByName(name);
        if(item) return item;
      }
    }
    return null;
  },
  getTopMenu: function() {
    if (this.parent) {
      return this.parent.parentMenu.getTopMenu();
    } else {
      return this;
    }
  },

  scrollToFitView: function() {
    var treeMenuNode = this.getTopMenu().entity.node().parentNode;
    var parentItemNode = this.entity.node().parentNode;
    var menuRect = treeMenuNode.getBoundingClientRect();
    var itemRect = parentItemNode.getBoundingClientRect();
    var viewportItemTop = itemRect.top - menuRect.top;
    if (viewportItemTop + itemRect.height > menuRect.height) {
      var newItemTop = (itemRect.height > menuRect.height) ?
        (menuRect.height - 10) : (itemRect.height + 10);

      var newScrollTop = treeMenuNode.scrollTop + newItemTop - menuRect.height + viewportItemTop;     

      var scrollTopTween = function(scrollTop) {
        return function() {
          var i = d3.interpolateNumber(this.scrollTop, scrollTop);
          return function(t) { this.scrollTop = i(t); };
        };
      }

      d3.select(treeMenuNode).transition().duration(20)
      .tween("scrolltoptween", scrollTopTween(newScrollTop));
      
      //treeMenuNode.scrollTop = scrollTop;
    }

  }

});

var MenuItem = Class.extend({
  init: function (parent, item) {
    var _this = this;
    this.parentMenu = parent;
    this.entity = item;
    var submenu = item.select('.' + css.list_outer);
    if (submenu.node()) {
      this.submenu = new Menu(this, submenu);
    }
    var label = this.entity.select('.' + css.list_item_label).on('mouseenter', function() {
      if(utils.isTouchDevice()) return;
      if (_this.parentMenu.direction == MENU_HORIZONTAL) {
        _this.openSubmenu();
        _this.marqueeToggle(true);
      }
    }).on('click.item', function() {
      if(utils.isTouchDevice()) return;
      d3.event.stopPropagation();
      if(_this.parentMenu.direction == MENU_HORIZONTAL) {
        _this.openSubmenu();
      } else {
        var view = d3.select(this);
        //only for leaf nodes
        if(!view.attr("children")) return;
        _this.toggleSubmenu();
      }
    }).onTap(function(evt) {
      d3.event.stopPropagation();
      if(_this.parentMenu.direction == MENU_VERTICAL) {
        var view = _this.entity.select('.' + css.list_item_label);
        //only for leaf nodes
        if(!view.attr("children")) return;
      }
      _this.toggleSubmenu();
    });
    return this;
  },
  setWidth: function(width, recursive, immediate) {
    if (this.submenu && recursive) {
      this.submenu.setWidth(width, recursive, immediate);
    }
    return this;
  },
  setDirection: function(direction, recursive) {
    if (this.submenu && recursive) {
      this.submenu.setDirection(direction, recursive);
    }
    return this;
  },
  toggleSubmenu: function() {
    if (this.submenu) {
      if (this.submenu.isActive()) {
        this.submenu.close();
      } else {
        this.submenu.open();
      }
    }
  },
  openSubmenu: function() {
    if (this.submenu) {
      this.submenu.open();
    } else {
      this.closeNeighbors();
    }
  },
  closeNeighbors: function(cb) {
    this.parentMenu.closeAllChildren(cb);
  },
  isActive: function() {
    return this.submenu && this.submenu.isActive();
  },
  marqueeToggleAll: function(toggle) {
    var _this = this;
    var labels = this.entity.selectAll('.' + css.list_item_label);
    labels.each(function() {
      var label = d3.select(this).select('span');
      var parent = d3.select(this.parentNode);
      parent.classed('marquee', false);
      label.style("left", '');
      if(toggle) {
        if(label.node().scrollWidth > label.node().offsetWidth) {
          label.attr("data-content", label.text());
          var space = 30;
          label.style("left", (-space - label.node().scrollWidth) + 'px');
          parent.classed('marquee', true);
        }
      }
    });
  },
  marqueeToggle: function(toggle) {
    var label = this.entity.select('.' + css.list_item_label).select('span');
    this.entity.classed('marquee', false);
    label.style("left", '');
    if(toggle) {
      if(label.node().scrollWidth > label.node().offsetWidth) {
        label.attr("data-content", label.text());
        var space = 30;
        label.style("left", (-space - label.node().scrollWidth) + 'px');
        this.entity.classed('marquee', true);
      }
    }
  }
});

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
var top;
var left;
var selectedNode;

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
  top: function(input) {
    if(!arguments.length) return top;
    top = input;
    return this;
  },
  left: function(input) {
    if(!arguments.length) return left;
    left = input;
    return this;
  },

  init: function(config, context) {

    var _this = this;

    this.name = 'gapminder-treemenu';
    this.model_expects = [{
      name: "marker",
      type: "model"
    }, {
        name: "language",
        type: "language"
      }];

    this.context = context;
    // object for manipulation with menu representation level
    this.menuEntity = null;
    this.model_binds = {
      "change:marker": function(evt, path) {
        if(path.indexOf(markerID + '.which')==-1 && path.indexOf(markerID + '.scaleType')==-1) return;
        _this.updateView();
      },
      "change:language.strings": function(evt) {
        _this.updateView();
      }
    };

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

    this.element.selectAll("div").remove();

    //general markup

    this.element.append("div")
      .attr("class", css.background)
      .on("click", function() {
        d3.event.stopPropagation();
        _this.toggle()
      });

    this.wrapperOuter = this.element
      .append('div')
      .classed(css.wrapper_outer, true)
      .classed(css.noTransition, true);

    this.wrapper = this.wrapperOuter
      .append('div')
      .classed(css.wrapper, true)
      .classed(css.noTransition, true)
      .classed("vzb-dialog-scrollable", true);

    this.wrapper
      .on("click", function() {
        d3.event.stopPropagation();
      })

    this.wrapper.append("div")
      .attr("class", css.close)
      .html(iconClose)
      .on("click", function() {
        d3.event.stopPropagation();
        _this.toggle()
      })
      .select("svg")
      .attr("width", "0px")
      .attr("height", "0px")
      .attr("class", css.close + '-icon');

    this.wrapper.append('div')
      .classed(css.scaletypes, true)
      .append('span');
    this.wrapper.append('div')
      .classed(css.title, true)
      .append('span');

    this.wrapper.append('div')
      .classed(css.search_wrap, true)
      .append('input')
      .classed(css.search, true)
      .attr('type', 'search')
      .attr('id', css.search);


    //init functions
    d3.select('body').on('mousemove', _this._mousemoveDocument);
    this.wrapper.on('mouseleave', function() {
      //if(_this.menuEntity.direction != MENU_VERTICAL) _this.menuEntity.closeAllChildren();
    });

    _this._enableSearch();

    _this.resize();
  },

  //happens on resizing of the container
  resize: function() {
    var _this = this;

    this.profiles = {
      "small": {
        col_width: 200
      },
      "medium": {
        col_width: 200
      },
      "large": {
        col_width: 200
      }
    };

    this.wrapper.classed(css.noTransition, true);
    this.wrapper.node().scrollTop = 0;

    this.activeProfile = this.profiles[this.getLayoutProfile()];
    OPTIONS.IS_MOBILE = this.getLayoutProfile() === "small";

    if (this.menuEntity) {
      this.menuEntity.setWidth(this.activeProfile.col_width, true, true);

      if (OPTIONS.IS_MOBILE) {
        if (this.menuEntity.direction != MENU_VERTICAL) {
          this.menuEntity.setDirection(MENU_VERTICAL, true);
        }
      } else {
        if (this.menuEntity.direction != MENU_HORIZONTAL) {
          this.menuEntity.setDirection(MENU_HORIZONTAL, true);
        }
      }
    }

    this.width = _this.element.node().offsetWidth;
    this.height = _this.element.node().offsetHeight;
    var rect = this.wrapperOuter.node().getBoundingClientRect();
    var containerWidth = rect.width;
    var containerHeight = rect.height;
    if (containerWidth) {
      if(OPTIONS.IS_MOBILE) {
        this.clearPos();
      } else {
        if(top || left) {
          if(this.wrapperOuter.node().offsetTop < 10) {
            this.wrapperOuter.style('top', '10px');
          }
          if(this.height - _this.wrapperOuter.node().offsetTop - containerHeight < 0) {
            if(containerHeight > this.height) {
              containerHeight = this.height - 20;
            }
            this.wrapperOuter.style({'top' : (this.height - containerHeight - 10) + 'px', 'bottom' : 'auto'});
          }
          if(top) top = _this.wrapperOuter.node().offsetTop;
        }
        
        var maxHeight;
        if(this.wrapperOuter.classed(css.alignYb)) {
          maxHeight = this.wrapperOuter.node().offsetTop + this.wrapperOuter.node().offsetHeight;
        } else {
          maxHeight = this.height - this.wrapperOuter.node().offsetTop;
        }
        this.wrapper.style('max-height', (maxHeight - 10) + 'px');
      
        this.wrapperOuter.classed(css.alignXc, alignX === "center");
        this.wrapperOuter.style("margin-left",alignX === "center"? "-" + containerWidth/2 + "px" : null);
        if (alignX === "center") {
          OPTIONS.MAX_MENU_WIDTH = this.width/2 - containerWidth * 0.5 - 10;
        } else {
          OPTIONS.MAX_MENU_WIDTH = this.width - this.wrapperOuter.node().offsetLeft - containerWidth - 10; // 10 - padding around wrapper
        }

        var minMenuWidth = this.activeProfile.col_width + OPTIONS.MIN_COL_WIDTH * 2;
        var leftPos = this.wrapperOuter.node().offsetLeft;
        OPTIONS.MENU_OPEN_LEFTSIDE = OPTIONS.MAX_MENU_WIDTH < minMenuWidth && leftPos > (OPTIONS.MAX_MENU_WIDTH + 10);
        if(OPTIONS.MENU_OPEN_LEFTSIDE) {
          if(leftPos <  (minMenuWidth + 10)) leftPos = (minMenuWidth + 10);
          OPTIONS.MAX_MENU_WIDTH = leftPos - 10; // 10 - padding around wrapper        
        } else {
          if (OPTIONS.MAX_MENU_WIDTH < minMenuWidth) { 
            leftPos = leftPos - (minMenuWidth - OPTIONS.MAX_MENU_WIDTH);
            OPTIONS.MAX_MENU_WIDTH = minMenuWidth;
          } 
        }
       
        if(left) {
          left = leftPos;
        } else {
          if(leftPos != this.wrapperOuter.node().offsetLeft) {
            this.wrapperOuter.style({'left': 'auto', 'right': (this.width - leftPos - rect.width) + 'px'}); 
          }
        }
        
        if(left || top) this.setPos();
        
        this.wrapperOuter.classed('vzb-treemenu-open-left-side', !OPTIONS.IS_MOBILE && OPTIONS.MENU_OPEN_LEFTSIDE);        
      }
    }

    this.wrapper.node().offsetHeight;
    this.wrapper.classed(css.noTransition, false);

    return this;
  },

  toggle: function() {
    var _this = this;
    var hidden = !this.element.classed(css.hidden);
    this.element.classed(css.hidden, hidden);

    if(hidden) {
      this.clearPos();
      this.menuEntity.marqueeToggle(false);
    } else {
      if(top || left) this.setPos();
      this.resize();
      this.scrollToSelected();
    }

    this.wrapper.classed(css.noTransition, hidden);

    this.parent.components.forEach(function(c) {
      if(c.name == "gapminder-dialogs") {
        d3.select(c.placeholder.parentNode).classed("vzb-blur", !hidden);
      } else
        if(c.element.classed) {
          c.element.classed("vzb-blur", c != _this && !hidden);
        } else {
          d3.select(c.element).classed("vzb-blur", c != _this && !hidden);
        }
    });

    this.width = _this.element.node().offsetWidth;
  },

  scrollToSelected: function() {
    var _this = this;
    var scrollToItem = function(listNode, itemNode) {
      listNode.scrollTop = 0;
      var rect = listNode.getBoundingClientRect();
      var itemRect = itemNode.getBoundingClientRect();
      var scrollTop = itemRect.bottom - rect.top - listNode.offsetHeight + 10;
      listNode.scrollTop = scrollTop;
    }

    if (this.menuEntity.direction == MENU_VERTICAL) {
      scrollToItem(this.wrapper.node(), selectedNode);
      _this.menuEntity.marqueeToggleAll(true);
    } else {
      var selectedItem = this.menuEntity.findItemByName(d3.select(selectedNode).select('span').text());
      selectedItem.submenu.calculateMissingWidth(0, function() {
        _this.menuEntity.marqueeToggleAll(true);
      });

      var parent = selectedNode;
      var listNode;
      while(!(utils.hasClass(parent, css.list_top_level))) {
        if(parent.tagName == 'LI') {
          listNode = utils.hasClass(parent.parentNode, css.list_top_level) ? parent.parentNode.parentNode : parent.parentNode;
          scrollToItem(listNode , parent);
        }
        parent = parent.parentNode;
      }
    }
  },

  setPos: function() {
    var rect = this.wrapperOuter.node().getBoundingClientRect();

    if(top) {
      this.wrapperOuter.style({'top': top + 'px', 'bottom': 'auto'});
      this.wrapperOuter.classed(css.absPosVert, top);
    }
    if(left) {
      var right = this.element.node().offsetWidth - left - rect.width;
      right = right < 10 ? 10 : right;
      this.wrapperOuter.style({'right': right + 'px', 'left': 'auto'});
      this.wrapperOuter.classed(css.absPosHoriz, right);
    }

  },

  clearPos: function() {
    top = '';
    left = '';
    this.wrapperOuter.attr("style", "");
    this.wrapperOuter.classed(css.absPosVert, '');
    this.wrapperOuter.classed(css.absPosHoriz, '');
    this.wrapperOuter.classed(css.menuOpenLeftSide, '');
    this.wrapper.style('max-height', '');
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
      var translationMatch = function(value, data, i) {
        var languageId = _this.model.language.id;

        if(_this.langStrings()) {
          var translate = _this.langStrings()[languageId]['indicator/' + data[i][OPTIONS.SEARCH_PROPERTY]] ||
            _this.langStrings()[languageId]['indicator' + '/' + _this.model.marker[markerID]._type + '/' + data[i][OPTIONS.SEARCH_PROPERTY]];
          if(translate && translate.toLowerCase().indexOf(value.toLowerCase()) >= 0) return true;
        };
        return false;
      };

      var matching = function(data) {
        for(var i = 0; i < data.length; i++) {
          var match = false;
          match =  translationMatch(value, data, i);
          if(match) {
            matches.children.push(data[i]);
          }
          if(!match && data[i][OPTIONS.SUBMENUS]) {
            matching(data[i][OPTIONS.SUBMENUS]);
          }
        }
      };
      matching(_this.dataFiltered.children);
      return matches;
    };

    var searchIt = utils.debounce(function() {
        var value = input.node().value;

        if(value.length >= OPTIONS.SEARCH_MIN_STR) {
          _this.redraw(getMatches(value), true);  
        } else {
          _this.redraw();
        }
      }, 250);

    input.on('input', searchIt);
  },

  _selectIndicator: function(value) {
    callback("which", value, markerID);
    this.toggle();
  },


  //function is redrawing data and built structure
  redraw: function(data, useDataFiltered) {
    var _this = this;

    var dataFiltered;
    
    var indicatorsDB = _this.model.marker.getConceptprops();

    var hookType = _this.model.marker[markerID]._type;

    if(useDataFiltered) {
      dataFiltered = data;
    } else {
      if(data == null) data = tree;

      var allowedIDs = utils.keys(indicatorsDB).filter(function(f) {
        //check if indicator is denied to show with allow->names->!indicator
        if(_this.model.marker[markerID].allow && _this.model.marker[markerID].allow.names
          && _this.model.marker[markerID].allow.names.indexOf('!' + f) != -1) return false;
        //keep indicator if nothing is specified in tool properties
        if(!_this.model.marker[markerID].allow || !_this.model.marker[markerID].allow.scales) return true;
        //keep indicator if any scale is allowed in tool properties
        if(_this.model.marker[markerID].allow.scales[0] == "*") return true;

        // if no scales defined, all are allowed
        if (!indicatorsDB[f].scales) return true

        //check if there is an intersection between the allowed tool scale types and the ones of indicator
        for(var i = indicatorsDB[f].scales.length - 1; i >= 0; i--) {
          if(_this.model.marker[markerID].allow.scales.indexOf(indicatorsDB[f].scales[i]) > -1) return true;
        }

        return false;
      })

      dataFiltered = utils.pruneTree(data, function(f) {
        return allowedIDs.indexOf(f.id) > -1
      });
      
      this.dataFiltered = dataFiltered;
    }

    this.wrapper.select('ul').remove();
 
    this.element.select('.' + css.title).select("span")
      .text(this.translator("buttons/" + markerID));

    this.element.select('.' + css.search)
      .attr("placeholder", this.translator("placeholder/search") + "...");
 
    var createSubmeny = function(select, data, toplevel) {
      if(!data.children) return;
      var _select = toplevel ? select : select.append('div')
        .classed(css.list_outer, true);

      var li = _select.append('ul')
        .classed(css.list, !toplevel)
        .classed(css.list_top_level, toplevel)
        .classed("vzb-dialog-scrollable", true)
        .selectAll('li')
        .data(data.children, function(d) {
          return d['id'];
        })
        .enter()
        .append('li');

      li.append('span')
        .classed(css.list_item_label, true)
        // .attr("info", function(d) {
        //   return d.id;
        // })
        .attr("children", function(d) {
          return d.children ? "true" : null;
        })
        .on('click', function(d) {
          var view = d3.select(this);
          //only for leaf nodes
          if(view.attr("children")) return;
          d3.event.stopPropagation();
          _this._selectIndicator(d.id);
        })
        .append('span')
        .text(function(d) {
          //Let the indicator "_default" in tree menu be translated differnetly for every hook type
          var translated = _this.translator("indicator" + (d.id==="_default" ? "/" + hookType : "") + "/" + d.id);
          if(translated.indexOf("indicator/")!==-1)utils.warn("translation missing: " + translated);
          return translated;
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

          //deepLeaf
          if(!d.children) {
            var deepLeaf = view.append('div').attr('class', css.menuHorizontal + ' ' + css.list_outer + ' ' + css.list_item_leaf);
            deepLeaf.on('click', function(d) {
              _this._selectIndicator(d.id);
            });
            var deepLeafContent = deepLeaf.append('div').classed(css.leaf + ' ' + css.leaf_content + " vzb-dialog-scrollable", true);
            deepLeafContent.append('span').classed(css.leaf_content_item + ' ' + css.leaf_content_item_title, true)
              .text(function(d) {
                //Let the indicator "_default" in tree menu be translated differnetly for every hook type
                var translated = _this.translator("indicator" + (d.id === "_default" ? "/" + hookType : "") + "/" + d.id);
                if(translated.indexOf("indicator/") !== -1) utils.warn("translation missing: " + translated);
                return translated;
              });
            var hideUnits;
            var units = deepLeafContent.append('span').classed(css.leaf_content_item, true)
              .text(function(d) {
                //Let the indicator "_default" in tree menu be translated differnetly for every hook type
                var translated = _this.translator("unit" + (d.id==="_default" ? "/" + hookType : "") + "/" + d.id);
                hideUnits = translated.indexOf("unit/") !== -1 || translated === ''; 
                if(translated.indexOf("unit/") !== -1) utils.warn("translation missing: " + translated);
                return _this.translator('hints/units') + ': ' + translated;
              });
            units.classed('vzb-hidden', hideUnits);
            var hideDescription;
            var description = deepLeafContent.append('span').classed(css.leaf_content_item + ' ' + css.leaf_content_item_descr, true)
              .text(function(d) {
                //Let the indicator "_default" in tree menu be translated differnetly for every hook type
                var translated = _this.translator("description" + (d.id === "_default" ? "/" + hookType : "") + "/" + d.id);
                hideDescription = translated.indexOf("description/") !== -1; 
                if(hideDescription) utils.warn("translation missing: " + translated);
                return (hideUnits && hideDescription) ? _this.translator("hints/nodescr") : translated;
              });
            description.classed('vzb-hidden', hideDescription && !hideUnits);
          }
          
          if(d.id == _this.model.marker[markerID].which) {
            var parent = this.parentNode;
            d3.select(this).classed('item-active', true)
              .select('.' + css.list_item_leaf).classed('active', true);
            while(!(utils.hasClass(parent, css.list_top_level))) {
              if(parent.tagName == 'UL') {
                d3.select(parent.parentNode)
                  .classed('active', true);
              }
              if(parent.tagName == 'LI') {
                d3.select(parent).classed('item-active', true);
              }
              parent = parent.parentNode;
            }
            selectedNode = this;
          }
          createSubmeny(view, d);
        });
    };
    
    if(OPTIONS.IS_MOBILE) {
      OPTIONS.MENU_DIRECTION = MENU_VERTICAL;
    } else {
      OPTIONS.MENU_DIRECTION = MENU_HORIZONTAL;
    }
    createSubmeny(this.wrapper, dataFiltered, true);
    this.menuEntity = new Menu(null, this.wrapper.selectAll('.' + css.list_top_level));
    if(this.menuEntity) this.menuEntity.setDirection(OPTIONS.MENU_DIRECTION);
    if(this.menuEntity) this.menuEntity.setWidth(this.activeProfile.col_width, true, true);
    
    if(!useDataFiltered) {
      var pointer = "_default";
      if(allowedIDs.indexOf(this.model.marker[markerID].which) > -1) pointer = this.model.marker[markerID].which;
      if(!indicatorsDB[pointer].scales) {
        this.element.select('.' + css.scaletypes).classed(css.hidden, true);
        return true;
      }
      var scaleTypesData = indicatorsDB[pointer].scales.filter(function(f) {
        if(!_this.model.marker[markerID].allow || !_this.model.marker[markerID].allow.scales) return true;
        if(_this.model.marker[markerID].allow.scales[0] == "*") return true;
        return _this.model.marker[markerID].allow.scales.indexOf(f) > -1;
      });
      if(scaleTypesData.length == 0) {
        this.element.select('.' + css.scaletypes).classed(css.hidden, true);
      } else {

        var scaleTypes = this.element.select('.' + css.scaletypes).classed(css.hidden, false).selectAll("span")
            .data(scaleTypesData, function(d){return d});

        scaleTypes.exit().remove();

        scaleTypes.enter().append("span")
          .on("click", function(d){
            d3.event.stopPropagation();
            _this._setModel("scaleType", d, markerID)
          });

        scaleTypes
          .classed(css.scaletypesDisabled, scaleTypesData.length < 2)
          .classed(css.scaletypesActive, function(d){
            return d == _this.model.marker[markerID].scaleType && scaleTypesData.length > 1;
          })
          .text(function(d){
            return _this.translator("scaletype/" + d);
          });
      }

    }

    return this;
  },






  updateView: function() {
    var _this = this;
    var languageID = _this.model.language.id;

    if(!markerID) return;

    this.wrapperOuter.classed(css.absPosVert, top);
    this.wrapperOuter.classed(css.alignYt, alignY === "top");
    this.wrapperOuter.classed(css.alignYb, alignY === "bottom");
    this.wrapperOuter.classed(css.absPosHoriz, left);
    this.wrapperOuter.classed(css.alignXl, alignX === "left");
    this.wrapperOuter.classed(css.alignXr, alignX === "right");


    var strings = langStrings ? langStrings : {};
    strings[languageID] = _this.model.language.strings[languageID];

    this.translator = this.model.language.getTFunction();

    var setModel = this._setModel.bind(this);
    this.langStrings(strings)
      .lang(languageID)
      .callback(setModel)
      .tree(this.model.marker.getIndicatorsTree())
      .redraw();

    this.wrapper.select('.' + css.search).node().value = "";

    return this;
  },

  _setModel: function(what, value, markerID) {

    var indicatorsDB = this.model.marker.getConceptprops();

    var mdl = this.model.marker[markerID];

    var obj = {};

    obj[what] = value;

    if(what == "which") {
      obj.use = indicatorsDB[value].use;

      if(indicatorsDB[value].scales) {
        // change scale without triggering events (non-persistent)
        // otherwise ready is called via bubblechart:72 change:marker:scaleType before data arrives
        mdl.getModelObject('scaleType').set(indicatorsDB[value].scales[0], false, true);
      }
    }

    if(mdl.getType() === 'axis' || mdl.getType() === 'size') {
      obj.domainMin = null;
      obj.domainMax = null;
      obj.zoomedMin = null;
      obj.zoomedMax = null;
    }

    mdl.set(obj);

  }


});

export default TreeMenu;
