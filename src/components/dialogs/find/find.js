import * as utils from "base/utils";
import Dialog from "components/dialogs/_dialog";

import show from "./show";
import singlehandleslider from "components/brushslider/singlehandleslider/singlehandleslider";
import indicatorpicker from "components/indicatorpicker/indicatorpicker";

/*!
 * VIZABI FIND CONTROL
 * Reusable find dialog
 */

const Find = Dialog.extend("find", {

  init(config, parent) {
    this.name = "find";
    const _this = this;

    this.components = [{
      component: show,
      placeholder: ".vzb-dialog-panel-show",
      model: ["state", "locale"]
    }, {
      component: singlehandleslider,
      placeholder: ".vzb-dialog-bubbleopacity",
      model: ["state.marker", "locale"],
      arg: "opacitySelectDim"
    }];

    this.panelMode = ((config.ui.dialogs.dialog || {}).find || {}).panelMode || "find";
    this.enablePicker = ((config.ui.dialogs.dialog || {}).find || {}).enablePicker;
    if (this.enablePicker) {
      this.components.push({
        component: indicatorpicker,
        placeholder: ".vzb-find-filter-selector",
        model: ["state.time", "state.marker", "locale"]
      });
    }

    this.model_binds = {
      "change:state.marker.select": function(evt) {
        _this.items.order();
        _this.selectDataPoints();
        _this.showHideButtons();
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
        if (!_this._readyOnce) return;
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

    this.panelComps = { find: this, show: this.findChildByName("show") };

    this.titleSwitch = this.element.select(".vzb-dialog-title-switch input");
    this.panelsEl = this.contentEl.selectAll(".vzb-dialog-content");
    this.list = this.element.select(".vzb-find-list");
    this.input_search = this.element.select(".vzb-find-search");
    this.deselect_all = this.element.select(".vzb-find-deselect");
    this.opacity_nonselected = this.element.select(".vzb-dialog-bubbleopacity");

    this.element.select(".vzb-find-filter-selector").classed("vzb-hidden", !this.enablePicker);
    this.element.select(".vzb-dialog-title").classed("vzb-title-two-rows", this.enablePicker);

    this.KEY = this.model.state.entities.getDimension();

    const _this = this;

    this.titleSwitch.on("change", () => {
      _this.panelMode = _this.titleSwitch.property("checked") ? "show" : "find";
      _this.panelsEl.classed("vzb-active", false);
      _this.contentEl.select(".vzb-dialog-panel-" + _this.panelMode).classed("vzb-active", true);
      _this.panelComps[_this.panelMode].showHideSearch();
      _this._buttonAdjust();
      _this.panelComps[_this.panelMode].showHideButtons();
    });
    this.titleSwitch.property("checked", this.panelMode !== "find");
    this.titleSwitch.dispatch("change");

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
      _this.panelComps[_this.panelMode].showHideSearch();
    });

    d3.select(this.input_search.node().parentNode).on("reset", () => {
      utils.defer(() => _this.panelComps[_this.panelMode].showHideSearch());
    });

    this.deselect_all.on("click", () => {
      _this.deselectMarkers();
    });

    const closeButton = this.buttonsEl.select(".vzb-dialog-button[data-click='closeDialog']");
    closeButton.on("click.panel", () => _this.panelComps[_this.panelMode].closeClick());

    this.translator = this.model.locale.getTFunction();
    this.input_search.attr("placeholder", this.translator("placeholder/search") + "...");

    //make sure it refreshes when all is reloaded
    this.root.on("ready", () => {
      _this.ready();
    });

  },

  getPanelMode() {
    return this.panelMode;
  },

  _buttonAdjust() {
    this.buttonsEl.selectAll(".vzb-dialog-buttons > :not([data-dialogtype])").classed("vzb-hidden", true);
    this.buttonsEl.selectAll(`[data-panel=${this.panelMode}]`).classed("vzb-hidden", false);
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
    const KEYS = this.KEYS = utils.unique(this.model.state.marker._getAllDimensions({ exceptType: "time" }));

    this.importantHooks = _this.model.state.marker.getImportantHooks();

    this.time = this.model.state.time.value;
    this.model.state.marker.getFrame(this.time, values => {
      if (!values) return;

      const data = _this.model.state.marker.getKeys().map(d => {
        d.brokenData = false;
        d.name = _this.model.state.marker.getCompoundLabelText(d, values);
        return d;
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
        .attr("id", (d, i) => "-find-" + i + "-" + _this._id)
        .on("change", d => {
          //clear highlight so it doesn't get in the way when selecting an entity
          if (!utils.isTouchDevice()) _this.model.state.marker.clearHighlighted();
          _this.model.state.marker.selectMarker(d);
          //return to highlighted state
          if (!utils.isTouchDevice() && !d.brokenData) _this.model.state.marker.highlightMarker(d);
        });

      _this.items.append("label")
        .attr("for", (d, i) => "-find-" + i + "-" + _this._id)
        .text(d => d.name)
        .attr("title", function(d) {
          return this.offsetWidth < this.scrollWidth ? d.name : null;
        })
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
      _this.showHideButtons();

    });
  },

  redrawDataPoints(values) {
    const _this = this;
    const KEYS = this.KEYS;

    _this.items
      .each(function(d) {
        const view = d3.select(this).select("label");
        d.brokenData = false;

        utils.forEach(_this.importantHooks, name => {
          if (_this.model.state.marker[name].use == "constant") return;
          const hook = values[name];
          if (!hook) return;
          const value = hook[utils.getKey(d, KEYS)];
          if (!value && value !== 0) {
            d.brokenData = true;
            return false;
          }
        });

        const nameIfEllipsis = this.offsetWidth < this.scrollWidth ? d.name : "";
        view
          .classed("vzb-find-item-brokendata", d.brokenData)
          .attr("title", nameIfEllipsis + (d.brokenData ? (nameIfEllipsis ? " | " : "") + _this.model.state.time.formatDate(_this.time) + ": " + _this.translator("hints/nodata") : ""));
      });
  },

  selectDataPoints() {
    const _this = this;
    const KEY = this.KEY;
    //    const selected = this.model.state.marker.getSelected(KEY);
    const selected = this.model.state.marker;
    this.items.selectAll("input")
    //      .property("checked", d => (selected.indexOf(d[KEY]) !== -1));
      .property("checked", function(d) {
        const isSelected = selected.isSelected(d);
        d3.select(this.parentNode).classed("vzb-checked", isSelected);
        return isSelected;
      });
    const lastCheckedNode = this.list.selectAll(".vzb-checked")
      .classed("vzb-separator", false)
      .lower()
      .nodes()[0];
    d3.select(lastCheckedNode).classed("vzb-separator", true);
    this.contentEl.node().scrollTop = 0;
  },

  showHideSearch() {
    if (this.getPanelMode() !== "find") return;

    let search = this.input_search.node().value || "";
    search = search.toLowerCase();

    this.list.selectAll(".vzb-find-item")
      .classed("vzb-hidden", d => {
        const lower = (d.name || "").toString().toLowerCase();
        return (lower.indexOf(search) === -1);
      });
  },

  showHideButtons() {
    if (this.getPanelMode() !== "find") return;

    const someSelected = !!this.model.state.marker.select.length;
    this.deselect_all.classed("vzb-hidden", !someSelected);
    this.opacity_nonselected.classed("vzb-hidden", !someSelected);
    if (someSelected) {
      this.findChildByName("singlehandleslider").trigger("resize");
    }
  },

  deselectMarkers() {
    this.model.state.marker.clearSelected();
  },

  transitionEnd(event) {
    this._super(event);

    if (!utils.isTouchDevice()) this.input_search.node().focus();
  },

  closeClick() {

  }

});

export default Find;
