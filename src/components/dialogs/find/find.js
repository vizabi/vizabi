import * as utils from "base/utils";
import Component from "base/component";
import Dialog from "components/dialogs/_dialog";

import simpleslider from "components/simpleslider/simpleslider";

/*!
 * VIZABI FIND CONTROL
 * Reusable find dialog
 */

const Find = Dialog.extend({

  init(config, parent) {
    this.name = "find";
    const _this = this;

    this.components = [{
      component: simpleslider,
      placeholder: ".vzb-dialog-bubbleopacity",
      model: ["state.marker"],
      arg: "opacitySelectDim",
      properties: { step: 0.01 }
    }];

    this.model_binds = {
      "change:state.marker.select": function(evt) {
        _this.selectDataPoints();
        _this.showHideDeselect();
      },
      "change:state.time.playing": function(evt) {
        if (!_this.model.state.time.playing) {
          _this.time = _this.model.state.time.value;

          _this.model.state.marker.getFrame(_this.time, (values, time) => {
            if (!values || (_this.time - time)) return;
            _this.redrawDataPoints(values);
          });
        }
      },
      "change:state.time.value": function(evt) {
        // hide changes if the dialog is not visible
        if (!_this.placeholderEl.classed("vzb-active") && !_this.placeholderEl.classed("vzb-sidebar")) return;

        _this.time = _this.model.state.time.value;

        _this.model.state.marker.getFrame(_this.time, values => {
          if (!values) return;
          _this.redrawDataPoints(values);
        });
      },
      "translate:locale": function() {
        _this.input_search.attr("placeholder", _this.translator("placeholder/search") + "...");
      }
    };

    this._super(config, parent);
  },

  /**
   * Grab the list div
   */
  readyOnce() {
    this._super();

    this.list = this.element.select(".vzb-find-list");
    this.input_search = this.element.select(".vzb-find-search");
    this.deselect_all = this.element.select(".vzb-find-deselect");
    this.opacity_nonselected = this.element.select(".vzb-dialog-bubbleopacity");

    this.KEY = this.model.state.entities.getDimension();

    const _this = this;

    this.input_search.on("keyup", () => {
      const event = d3.event;
      if (event.keyCode == 13 && _this.input_search.node().value == "select all") {
        _this.input_search.node().value = "";
        //clear highlight so it doesn't get in the way when selecting an entity
        if (!utils.isTouchDevice()) _this.model.state.marker.clearHighlighted();
        _this.model.state.marker.selectAll();
      }
    });

    this.input_search.on("input", () => {
      _this.showHideSearch();
    });

    this.deselect_all.on("click", () => {
      _this.deselectMarkers();
    });

    this.translator = this.model.locale.getTFunction();
    this.input_search.attr("placeholder", this.translator("placeholder/search") + "...");

    //make sure it refreshes when all is reloaded
    this.root.on("ready", () => {
      _this.ready();
    });

  },

  open() {
    const _this = this;
    this._super();

    this.input_search.node().value = "";
    this.showHideSearch();

    this.time = this.model.state.time.value;

    this.model.state.marker.getFrame(this.time, values => {
      if (!values) return;
      _this.redrawDataPoints(values);
    });
  },

  /**
   * Build the list everytime it updates
   */
  //TODO: split update in render and update methods
  ready() {
    this._super();

    const _this = this;
    const KEY = this.KEY;

    this.time = this.model.state.time.value;
    this.model.state.marker.getFrame(this.time, values => {
      if (!values) return;

      const data = _this.model.state.marker.getKeys().map(d => {
        const pointer = {};
        pointer[KEY] = d[KEY];
        pointer.brokenData = false;
        pointer.name = values.label[d[KEY]];

        return pointer;
      });

      //sort data alphabetically
      data.sort((a, b) => (a.name < b.name) ? -1 : 1);

      _this.list.html("");

      _this.items = _this.list.selectAll(".vzb-find-item")
        .data(data)
        .enter()
        .append("div")
        .attr("class", "vzb-find-item vzb-dialog-checkbox");

      _this.items.append("input")
        .attr("type", "checkbox")
        .attr("class", "vzb-find-item")
        .attr("id", d => "-find-" + d[KEY] + "-" + _this._id)
        .on("change", d => {
          //clear highlight so it doesn't get in the way when selecting an entity
          if (!utils.isTouchDevice()) _this.model.state.marker.clearHighlighted();
          _this.model.state.marker.selectMarker(d);
          //return to highlighted state
          if (!utils.isTouchDevice() && !d.brokenData) _this.model.state.marker.highlightMarker(d);
        });

      _this.items.append("label")
        .attr("for", d => "-find-" + d[KEY] + "-" + _this._id)
        .text(d => d.name)
        .on("mouseover", d => {
          if (!utils.isTouchDevice() && !d.brokenData) _this.model.state.marker.highlightMarker(d);
        })
        .on("mouseout", d => {
          if (!utils.isTouchDevice()) _this.model.state.marker.clearHighlighted();
        });
      utils.preventAncestorScrolling(_this.element.select(".vzb-dialog-scrollable"));

      _this.redrawDataPoints(values);
      _this.selectDataPoints();
      _this.showHideSearch();
      _this.showHideDeselect();

    });
  },

  redrawDataPoints(values) {
    const _this = this;
    const KEY = this.KEY;

    _this.items
      .each(function(d) {
        const view = d3.select(this).select("label");

        d.brokenData = false;
        utils.forEach(values, (hook, name) => {
          //TODO: remove the hack with hardcoded hook names (see discussion in #1389)
          if (name !== "color" && name !== "size_label" && _this.model.state.marker[name].use !== "constant" && !hook[d[KEY]] && hook[d[KEY]] !== 0) {
            d.brokenData = true;
          }
        });

        view
          .classed("vzb-find-item-brokendata", d.brokenData)
          .attr("title", d.brokenData ? _this.model.state.time.formatDate(_this.time) + ": " + _this.translator("hints/nodata") : "");
      });
  },

  selectDataPoints() {
    const KEY = this.KEY;
    const selected = this.model.state.marker.getSelected(KEY);
    this.items.selectAll("input")
      .property("checked", d => (selected.indexOf(d[KEY]) !== -1));
  },

  showHideSearch() {
    let search = this.input_search.node().value || "";
    search = search.toLowerCase();

    this.list.selectAll(".vzb-find-item")
      .classed("vzb-hidden", d => {
        const lower = (d.name || "").toLowerCase();
        return (lower.indexOf(search) === -1);
      });
  },

  showHideDeselect() {
    const someSelected = !!this.model.state.marker.select.length;
    this.deselect_all.classed("vzb-hidden", !someSelected);
    this.opacity_nonselected.classed("vzb-hidden", !someSelected);
  },

  deselectMarkers() {
    this.model.state.marker.clearSelected();
  },

  transitionEnd(event) {
    this._super(event);

    if (!utils.isTouchDevice()) this.input_search.node().focus();
  }

});

export default Find;
