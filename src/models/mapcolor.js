import * as utils from "base/utils";
import Color from "models/color";

/*!
 * VIZABI MapColor Model (hook)
 */

const defaultPalettes = {
  "_continuous": {
    "_default": "#ffb600",
    "0": "#B4DE79",
    "50": "#E1CE00",
    "100": "#F77481"
  },
  "_discrete": {
    "_default": "#ffb600",
    "0": "#4cd843",
    "1": "#e83739",
    "2": "#ff7f00",
    "3": "#c027d4",
    "4": "#d66425",
    "5": "#0ab8d8",
    "6": "#bcfa83",
    "7": "#ff8684",
    "8": "#ffb04b",
    "9": "#f599f5",
    "10": "#f4f459",
    "11": "#7fb5ed"
  },
  "_default": {
    "_default": "#93daec"
  }
};

const MapcolorModel = Color.extend({
  init(name, values, parent, bind) {
    const _this = this;
    this._super(name, values, parent, bind);
  },

  getColorlegendMarker() {
    return (this._syncModelReferences["marker_map_colorlegend"] || {})["marker"];
  },

  getColorlegendEntities() {
    return (this._syncModelReferences["marker_map_colorlegend"] || {})["entities"];
  },

});

export default MapcolorModel;
