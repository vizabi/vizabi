import * as utils from "base/utils";
import Component from "base/component";
import Dialog from "components/dialogs/_dialog";

/*
 * Axes dialog
 */


const Mapoptions = Dialog.extend({

  /**
   * Initializes the dialog component
   * @param config component configuration
   * @param context component context (parent)
   */

  init(config, context) {
    this.name = "mapoptions";
    this.selectedLayer = {};
    this.mapEngines = [
      {
        title: "Topojson",
        value: "topojson"
      },
      {
        title: "Google",
        value: "google"
      },
      {
        title: "Mapbox",
        value: "mapbox"
      }
    ];

    this.mapLayers = {
      "google": [
        {
          title: "Land",
          value: "terrain"
        },
        {
          title: "Satellite",
          value: "satellite"
        }
      ],
      mapbox: [
        {
          title: "Land",
          value: "mapbox://styles/mapbox/streets-v9"
        },
        {
          title: "Satellite",
          value: "mapbox://styles/mapbox/satellite-v9"
        },
        {
          title: "Satellite Street",
          value: "mapbox://styles/mapbox/satellite-streets-v9"
        }
      ]
    };

    this.components = [];


    this._super(config, context);
  },

  readyOnce() {
    this._super();

    // save last used layer for map
    this.selectedLayer[this.model.ui.map.mapEngine] = this.model.ui.map.mapLayer;
    const _this = this;
    this.mapEngineForm = this.element.select(".vzb-dialog-paragraph.map-api")
        .selectAll("input")
        .data(_this.mapEngines);

    this.mapEngineForm.exit().remove();

    this.mapEngineForm.enter().append("label")
      .attr("for", (d, i) => "a" + i)
      .each(function(d, i) {
        d3.select(this)
          .append("input")
          .attr("id", "a" + i)
          .attr("type", "radio")
          .attr("name", "engine")
          .attr("value", d.value)
          .property("checked", d.value == _this.model.ui.map.mapEngine)
          .on("change", () => _this.setModel("mapEngine", d.value));
        d3.select(this)
          .append("span")
          .text(d.title);
      });
    this.updateView();
  },

  updateView() {
    const _this = this;
    this.element.select(".vzb-dialog-paragraph.map-layer").selectAll("label").remove();
    const data = _this.mapLayers[_this.model.ui.map.mapEngine] ? _this.mapLayers[_this.model.ui.map.mapEngine] : [];
    this.mapLayerForm = this.element.select(".vzb-dialog-paragraph.map-layer")
        .selectAll("label")
        .data(data);

    this.mapLayerForm.enter().append("label")
      .attr("for", (d, i) => "a" + i)
      .each(function(d, i) {
        d3.select(this)
          .append("input")
          .attr("id", "a" + i)
          .attr("type", "radio")
          .attr("name", "layer")
          .attr("value", d.value)
          .property("checked", d.value == _this.selectedLayer[_this.model.ui.map.mapEngine])
          .on("change", () => _this.setModel("mapLayer", d.value));
        d3.select(this)
          .append("span")
          .text(d.title);
      });
  },

  setModel(what, value) {
    if (what == "mapEngine" && this.model.ui.map.mapEngine != value) {
      if (!this.selectedLayer[value])
        this.selectedLayer[value] = this.mapLayers[value] ? this.mapLayers[value][0].value : null;
      this.model.ui.map.mapEngine = value;
      this.updateView();
      this.model.ui.map.mapLayer = this.selectedLayer[value];
    }
    if (what == "mapLayer") {
      this.selectedLayer[this.model.ui.map.mapEngine] = value;
      this.model.ui.map.mapLayer = value;
    }
  }
});

export default Mapoptions;
