import * as utils from "base/utils";
import Component from "base/component";
import Dialog from "components/dialogs/_dialog";

import minmaxinputs from "components/minmaxinputs/minmaxinputs";

/*
 * Axes dialog
 */


const Axes = Dialog.extend({

  /**
   * Initializes the dialog component
   * @param config component configuration
   * @param context component context (parent)
   */
  init(config, parent) {
    this.name = "axesmc";
    const _this = this;

    this.model_binds = {
      "change:ui.chart.xLogStops": function() {
        _this.updateView();
      },
      "change:ui.chart.yMaxMethod": function() {
        _this.updateView();
      }
    };

    this.components = [{
      component: minmaxinputs,
      placeholder: ".vzb-xlimits-container",
      model: ["state.marker", "state.time", "locale"],
      markerID: "axis_x",
      ui: {
        selectDomainMinMax: false,
        selectZoomedMinMax: true
      }
    }];


    this._super(config, parent);
  },

  readyOnce() {
    this._super();

    const _this = this;

    this.yMaxRadio = this.element.select(".vzb-yaxis-container").selectAll("input")
      .on("change", function() {
        _this.setModel("yMaxMethod", d3.select(this).node().value);
      });

    this.xLogStops = this.element.select(".vzb-xaxis-container").selectAll("input")
      .on("change", function() {
        _this.setModel("xLogStops", d3.select(this).node().value);
      });

    this.probeCheck = this.element.select(".vzb-probe-check")
      .on("change", function() {
        _this.setModel("showProbeX", d3.select(this).property("checked"));
      });

    this.probeFieldEl = this.element.select(".vzb-probe-field")
      .on("change", function() {
        let result = parseFloat(this.value.replace(",", "."));
        if (!result || result <= _this.model.state.marker.axis_x.tailCutX) {
          this.value = _this.model.ui.chart.probeX;
          return;
        } else if (result > _this.model.state.marker.axis_x.domainMax) {
          result = _this.model.state.marker.axis_x.domainMax;
        }
        this.value = result;
        _this.setModel("probeX", result);
      });

    this.updateView();

  },

  updateView() {
    const _this = this;

    this.yMaxRadio.property("checked", function() {
      return d3.select(this).node().value === _this.model.ui.chart.yMaxMethod;
    });
    this.xLogStops.property("checked", function() {
      return _this.model.ui.chart.xLogStops.indexOf(+d3.select(this).node().value) !== -1;
    });
    this.probeCheck.property("checked", this.model.ui.chart.showProbeX);
    this.probeFieldEl.property("value", this.model.ui.chart.probeX);
  },

  setModel(what, value) {
    let result;

    if (what == "yMaxMethod") {
      result = value;
    }
    if (what == "xLogStops") {
      result = [];
      this.xLogStops.each(function() {
        if (d3.select(this).property("checked")) result.push(+d3.select(this).node().value);
      });
    }
    if (what == "probeX" || what == "showProbeX") {
      result = value;
    }

    this.model.ui.chart[what] = result;
  }
});

export default Axes;
