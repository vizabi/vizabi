import * as utils from 'base/utils';
import Component from 'base/component';
import Dialog from '../_dialog';

import { simpleslider } from 'components/_index'

/*!
 * VIZABI FIND CONTROL
 * Reusable find dialog
 */

var Find = Dialog.extend({

  init: function(config, parent) {
    this.name = 'find';
    var _this = this;

    this.components = [{
      component: simpleslider,
      placeholder: '.vzb-dialog-bubbleopacity',
      model: ["state.entities"],
      arg: "opacitySelectDim",
      properties: {step: 0.01}
    }];

    this.model_binds = {
      "change:state.entities.select": function(evt) {
        _this.ready();
      },
      "change:state.time.value": function(evt) {
        if(!_this.model.state.time.playing && !_this.model.state.time.dragging) {
          _this.ready();
        }
      },
      "change:language.strings": function() {
        _this.translator = _this.model.language.getTFunction();
        _this.input_search.attr("placeholder", _this.translator("placeholder/search") + "...");
      }
    }

    this._super(config, parent);
  },

  /**
   * Grab the list div
   */
  readyOnce: function() {
    this._super();

    this.list = this.element.select(".vzb-find-list");
    this.input_search = this.element.select("#vzb-find-search");
    this.deselect_all = this.element.select("#vzb-find-deselect");
    this.opacity_nonselected = this.element.select(".vzb-dialog-bubbleopacity");

    this.KEY = this.model.state.entities.getDimension();

    var _this = this;

    this.input_search.on("keyup", function() {
      var event = d3.event;
      if(event.keyCode == 13 && _this.input_search.node().value == "select all") {
        _this.input_search.node().value = "";
        //clear highlight so it doesn't get in the way when selecting an entity
        if(!utils.isTouchDevice()) _this.model.state.entities.clearHighlighted();        
        _this.model.state.entities.selectAll();
      }
    });

    this.input_search.on("input", function() {
      _this.showHideSearch();
    });

    this.deselect_all.on("click", function() {
      _this.deselectEntities();
    });

    this.translator = this.model.language.getTFunction();
    this.input_search.attr("placeholder", this.translator("placeholder/search") + "...");

    //make sure it refreshes when all is reloaded
    this.root.on('ready', function() {
      _this.ready();
    })

  },

  open: function() {
    this._super();

    this.input_search.node().value = "";
    this.showHideSearch();
  },

  /**
   * Build the list everytime it updates
   */
  //TODO: split update in render and update methods
  ready: function() {
    this._super();

    var _this = this;
    var KEY = this.KEY;
    var TIMEDIM = this.model.state.time.getDimension();
    var selected = this.model.state.entities.getSelected();
    var marker = this.model.state.marker;
    var time = this.model.state.time.value;
    marker.getFrame(time, function(values) {
    var data = marker.getKeys().map(function(d) {
      var pointer = {};
      pointer[KEY] = d[KEY];
      pointer.name = values.label[d[KEY]];
      return pointer;
    }).filter(function(d) {
      var include = true;
      utils.forEach(values, function(hook, name) {
        //TODO: remove the hack with hardcoded hook names (see discussion in #1389)
        if(name!=="color" && name!=="size_label" && !hook[d[KEY]] && hook[d[KEY]] !== 0) {
          include = false;
          return;
        }
      });
      return include;
    })

    //sort data alphabetically
    data.sort(function(a, b) {
      return(a.name < b.name) ? -1 : 1;
    });

      _this.list.html("");

    var items = _this.list.selectAll(".vzb-find-item")
      .data(data)
      .enter()
      .append("div")
      .attr("class", "vzb-find-item vzb-dialog-checkbox")

    items.append("input")
      .attr("type", "checkbox")
      .attr("class", "vzb-find-item")
      .attr("id", function(d) {
        return "-find-" + d[KEY];
      })
      .property("checked", function(d) {
        return(selected.indexOf(d[KEY]) !== -1);
      })
      .on("change", function(d) {
        //clear highlight so it doesn't get in the way when selecting an entity
        if(!utils.isTouchDevice()) _this.model.state.entities.clearHighlighted();        
        _this.model.state.entities.selectEntity(d);        
        //return to highlighted state
        if(!utils.isTouchDevice()) _this.model.state.entities.highlightEntity(d); 
      });

    items.append("label")
      .attr("for", function(d) {
        return "-find-" + d[KEY];
      })
      .text(function(d) {
        return d.name;
      })
      .on("mouseover", function(d) {
        if(!utils.isTouchDevice()) _this.model.state.entities.highlightEntity(d);
      })
      .on("mouseout", function(d) {
        if(!utils.isTouchDevice()) _this.model.state.entities.clearHighlighted();
      });
    utils.preventAncestorScrolling(_this.element.select('.vzb-dialog-scrollable'));

      _this.showHideSearch();
      _this.showHideDeselect();
    });

  },
  showHideSearch: function() {
    var search = this.input_search.node().value || "";
    search = search.toLowerCase();

    this.list.selectAll(".vzb-find-item")
      .classed("vzb-hidden", function(d) {
        var lower = d.name.toLowerCase();
        return(lower.indexOf(search) === -1);
      });
  },

  showHideDeselect: function() {
    var someSelected = !!this.model.state.entities.select.length;
    this.deselect_all.classed('vzb-hidden', !someSelected);
    this.opacity_nonselected.classed('vzb-hidden', !someSelected);
  },

  deselectEntities: function() {
    this.model.state.entities.clearSelected();
  },

  transitionEnd: function(event) {
    this._super(event);

    if(!utils.isTouchDevice()) this.input_search.node().focus();
  }

});

export default Find;
