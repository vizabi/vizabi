import * as utils from 'base/utils';
import Component from 'base/component';
import Dialog from 'components/dialogs/_dialog';

import simpleslider from 'components/simpleslider/simpleslider';

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
      model: ["state.marker"],
      arg: "opacitySelectDim",
      properties: {step: 0.01}
    }];

    this.model_binds = {
      "change:state.marker.select": function(evt) {
        _this.selectDataPoints();
        _this.showHideDeselect();
      },
      "change:state.time.playing": function(evt) {
        if(!_this.model.state.time.playing) {
          _this.time = _this.model.state.time.value;

          _this.model.state.marker.getFrame(_this.time, function(values, time) {
            if (!values || (_this.time - time)) return;
            _this.redrawDataPoints(values);
          });
        }
      },
      "change:state.time.value": function(evt) {
        // hide changes if the dialog is not visible
        if(!_this.placeholderEl.classed('vzb-active') && !_this.placeholderEl.classed('vzb-sidebar')) return;

        _this.time = _this.model.state.time.value;

        _this.model.state.marker.getFrame(_this.time, function(values) {
          if (!values) return;
          _this.redrawDataPoints(values);
        });
      },
      "translate:locale": function() {
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
    this.input_search = this.element.select(".vzb-find-search");
    this.deselect_all = this.element.select(".vzb-find-deselect");
    this.opacity_nonselected = this.element.select(".vzb-dialog-bubbleopacity");

    this.KEY = this.model.state.entities.getDimension();

    var _this = this;

    this.input_search.on("keyup", function() {
      var event = d3.event;
      if(event.keyCode == 13 && _this.input_search.node().value == "select all") {
        _this.input_search.node().value = "";
        //clear highlight so it doesn't get in the way when selecting an entity
        if(!utils.isTouchDevice()) _this.model.state.marker.clearHighlighted();
        _this.model.state.marker.selectAll();
      }
    });

    this.input_search.on("input", function() {
      _this.showHideSearch();
    });

    this.deselect_all.on("click", function() {
      _this.deselectMarkers();
    });

    this.translator = this.model.locale.getTFunction();
    this.input_search.attr("placeholder", this.translator("placeholder/search") + "...");

    //make sure it refreshes when all is reloaded
    this.root.on('ready', function() {
      _this.ready();
    })

  },

  open: function() {
    var _this = this;
    this._super();

    this.input_search.node().value = "";
    this.showHideSearch();

    this.time = this.model.state.time.value;

    this.model.state.marker.getFrame(this.time, function(values) {
      if (!values) return;
      _this.redrawDataPoints(values);
    });
  },

  /**
   * Build the list everytime it updates
   */
  //TODO: split update in render and update methods
  ready: function() {
    this._super();

    var _this = this;
    var KEY = this.KEY;

    this.time = this.model.state.time.value;
    this.model.state.marker.getFrame(this.time, function(values) {
      if (!values) return;

      var data = _this.model.state.marker.getKeys().map(function(d) {
        var pointer = {};
        pointer[KEY] = d[KEY];
        pointer.brokenData = false;
        pointer.name = values.label[d[KEY]];

        return pointer;
      });

      //sort data alphabetically
      data.sort(function(a, b) {
        return(a.name < b.name) ? -1 : 1;
      });

      _this.list.html("");

      _this.items = _this.list.selectAll(".vzb-find-item")
        .data(data)
        .enter()
        .append("div")
        .attr("class", "vzb-find-item vzb-dialog-checkbox")

      _this.items.append("input")
        .attr("type", "checkbox")
        .attr("class", "vzb-find-item")
        .attr("id", function(d) {
          return "-find-" + d[KEY] + "-" + _this._id;
        })
        .on("change", function(d) {
          //clear highlight so it doesn't get in the way when selecting an entity
          if(!utils.isTouchDevice()) _this.model.state.marker.clearHighlighted();
          _this.model.state.marker.selectMarker(d);
          //return to highlighted state
          if(!utils.isTouchDevice() && !d.brokenData) _this.model.state.marker.highlightMarker(d);
        });

      _this.items.append("label")
        .attr("for", function(d) {
          return "-find-" + d[KEY] + "-" + _this._id;
        })
        .text(function(d){return d.name})
        .on("mouseover", function(d) {
          if(!utils.isTouchDevice() && !d.brokenData) _this.model.state.marker.highlightMarker(d);
        })
        .on("mouseout", function(d) {
          if(!utils.isTouchDevice()) _this.model.state.marker.clearHighlighted();
        });
        utils.preventAncestorScrolling(_this.element.select('.vzb-dialog-scrollable'));

        _this.redrawDataPoints(values);
        _this.selectDataPoints();
        _this.showHideSearch();
        _this.showHideDeselect();

    });
  },

  redrawDataPoints: function(values){
    var _this = this;
    var KEY = this.KEY;

    _this.items
      .each(function(d){
        var view = d3.select(this).select("label");

        d.brokenData = false;
        utils.forEach(values, function(hook, name) {
          //TODO: remove the hack with hardcoded hook names (see discussion in #1389)
          if(name!=="color" && name!=="size_label" && _this.model.state.marker[name].use!=="constant" && !hook[d[KEY]] && hook[d[KEY]] !== 0) {
            d.brokenData = true;
          }
        });

        view
          .classed("vzb-find-item-brokendata", d.brokenData)
          .attr("title", d.brokenData? _this.model.state.time.timeFormat(_this.time) + ": " + _this.translator("hints/nodata") : "");
      })
  },

  selectDataPoints: function(){
    var KEY = this.KEY;
    var selected = this.model.state.marker.getSelected(KEY);
    this.items.selectAll("input")
        .property("checked", function(d) {
          return(selected.indexOf(d[KEY]) !== -1);
        });
  },

  showHideSearch: function() {
    var search = this.input_search.node().value || "";
    search = search.toLowerCase();

    this.list.selectAll(".vzb-find-item")
      .classed("vzb-hidden", function(d) {
        var lower = (d.name||"").toLowerCase();
        return(lower.indexOf(search) === -1);
      });
  },

  showHideDeselect: function() {
    var someSelected = !!this.model.state.marker.select.length;
    this.deselect_all.classed('vzb-hidden', !someSelected);
    this.opacity_nonselected.classed('vzb-hidden', !someSelected);
  },

  deselectMarkers: function() {
    this.model.state.marker.clearSelected();
  },

  transitionEnd: function(event) {
    this._super(event);

    if(!utils.isTouchDevice()) this.input_search.node().focus();
  }

});

export default Find;
