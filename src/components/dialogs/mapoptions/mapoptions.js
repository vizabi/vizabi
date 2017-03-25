import * as utils from "base/utils";
import Component from "base/component";
import Dialog from "components/dialogs/_dialog";

/*
 * Axes dialog
 */
const mapEngines = [{
  title: "Google",
  value: "google"
}, {
  title: "Mapbox",
  value: "mapbox"
}];

const mapStyles = {
  "google": [{
    title: "Terrain",
    value: "terrain"
  }, {
    title: "Grayscale",
    value: "terrain grayscale"
  }, {
    title: "Satellite",
    value: "satellite"
  }],
  mapbox: [{
    title: "Land",
    value: "mapbox://styles/mapbox/streets-v9"
  }, {
    title: "Grayscale",
    value: "mapbox://styles/mapbox/light-v9"
  }, {
    title: "Satellite",
    value: "mapbox://styles/mapbox/satellite-v9"
  }, {
    title: "Satellite Street",
    value: "mapbox://styles/mapbox/satellite-streets-v9"
  }]
};

const Mapoptions = Dialog.extend({

  /**
   * Initializes the dialog component
   * @param config component configuration
   * @param context component context (parent)
   */

  init(config, context) {
    this.name = "mapoptions";
    this.components = [];
    const _this = this;

    this.model_binds = {
      "change:ui.map": function(evt) {
        if (!_this._ready) return;
        _this.updateView();
      }
    };


    this._super(config, context);
  },

  readyOnce() {
    this._super();
    const _this = this;

    this.mapLayersEl = this.element.select(".vzb-map-layers");
    this.mapEngineFormEl = this.element.select(".vzb-dialog-paragraph.vzb-map-engine");
    this.mapStyleFormEl = this.element.select(".vzb-dialog-paragraph.vzb-map-style");

    const mapEngineForm = this.mapEngineFormEl.selectAll("label")
      .data(mapEngines);

    mapEngineForm.exit().remove();

    mapEngineForm.enter().append("label")
      .attr("for", (d, i) => "a" + i)
      .each(function(d, i) {
        d3.select(this)
          .append("input")
          .attr("id", "a" + i)
          .attr("type", "radio")
          .attr("name", "engine")
          .attr("value", d.value)
          .on("change", () => _this.setModel("mapEngine", d.value));
        d3.select(this)
          .append("span")
          .text(d.title);
      });

    this.mapLayersEl.select("input[name='showBubbles']")
      .property("checked", d => _this.model.ui.map.showBubbles)
      .on("change", function() {
        _this.setModel("showBubbles", d3.select(this).property("checked"));
      });
    this.mapLayersEl.select("input[name='showAreas']")
      .property("checked",  _this.model.ui.map.showAreas)
      .on("change", function() {
        _this.setModel("showAreas", d3.select(this).property("checked"));
      });
    this.mapLayersEl.select("input[name='showMap']")
      .property("checked",  _this.model.ui.map.showMap)
      .on("change", function() {
        _this.setModel("showMap", d3.select(this).property("checked"));
      });

    this.updateView();
  },

  updateView() {
    const _this = this;
    this.mapStyleFormEl.selectAll("label").remove();
    const mapStyleForm = this.mapStyleFormEl.selectAll("label")
      .data(mapStyles[this.model.ui.map.mapEngine] || []);

    mapStyleForm.exit().remove();

    mapStyleForm.enter().append("label")
      .attr("for", (d, i) => "a" + i)
      .each(function(d, i) {
        d3.select(this)
          .append("input")
          .attr("id", "a" + i)
          .attr("type", "radio")
          .attr("name", "layer")
          .attr("value", d.value)
          .on("change", () => _this.setModel("mapStyle", d.value));
        d3.select(this)
          .append("span")
          .text(d.title);
      });

    this.mapEngineFormEl.selectAll("input")
      .property("checked", d => d.value === this.model.ui.map.mapEngine);

    this.mapStyleFormEl.selectAll("input")
      .property("checked", d => d.value === this.model.ui.map.mapStyle);

    this.mapLayersEl.select("input[name='showBubbles']")
      .property("checked", this.model.ui.map.showBubbles);
    this.mapLayersEl.select("input[name='showAreas']")
      .property("checked", this.model.ui.map.showAreas);
    this.mapLayersEl.select("input[name='showMap']")
      .property("checked", this.model.ui.map.showMap);
  },

  setModel(what, value) {
    if (what === "mapEngine") {
      this.model.ui.map.set({ mapEngine: value, mapStyle: mapStyles[value][0].value });
    }
    if (what === "mapStyle") {
      this.model.ui.map.mapStyle = value;
    }
    if (what === "showBubbles" || what === "showAreas" || what === "showMap") {
      this.model.ui.map[what] = value;
    }
  }
});

export default Mapoptions;
