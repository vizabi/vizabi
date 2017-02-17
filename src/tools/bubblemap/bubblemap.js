/*!
 * VIZABI BUBBLEMAP
 */

import * as utils from "base/utils";
import Tool from "base/tool";

import BubbleMapComponent from "tools/bubblemap/bubblemap-component";

import timeslider from "components/timeslider/timeslider";
import dialogs from "components/dialogs/dialogs";
import buttonlist from "components/buttonlist/buttonlist";
import treemenu from "components/treemenu/treemenu";
import datawarning from "components/datawarning/datawarning";
import datanotes from "components/datanotes/datanotes";
import steppedSpeedSlider from "components/steppedspeedslider/steppedspeedslider";

//BAR CHART TOOL
const BubbleMap = Tool.extend("BubbleMap", {


  /**
   * Initializes the tool (Bar Chart Tool).
   * Executed once before any template is rendered.
   * @param {Object} placeholder Placeholder element for the tool
   * @param {Object} external_model Model as given by the external page
   */
  init(placeholder, external_model) {

    this.name = "bubblemap";

    //specifying components
    this.components = [{
      component: BubbleMapComponent,
      placeholder: ".vzb-tool-viz",
      model: ["state.time", "state.entities", "state.marker", "locale", "ui"] //pass models to component
    }, {
      component: timeslider,
      placeholder: ".vzb-tool-timeslider",
      model: ["state.time", "state.entities", "state.marker", "ui"]
    }, {
      component: dialogs,
      placeholder: ".vzb-tool-dialogs",
      model: ["state", "ui", "locale"]
    }, {
      component: buttonlist,
      placeholder: ".vzb-tool-buttonlist",
      model: ["state", "ui", "locale"]
    }, {
      component: treemenu,
      placeholder: ".vzb-tool-treemenu",
      model: ["state.marker", "state.marker_tags", "state.time", "locale"]
    }, {
      component: datawarning,
      placeholder: ".vzb-tool-datawarning",
      model: ["locale"]
    }, {
      component: datanotes,
      placeholder: ".vzb-tool-datanotes",
      model: ["state.marker", "locale"]
    }, {
      component: steppedSpeedSlider,
      placeholder: ".vzb-tool-stepped-speed-slider",
      model: ["state.time", "locale"]
    }
    ];

    //constructor is the same as any tool
    this._super(placeholder, external_model);
  },

  default_model: {
    state: {
      time: {
        "delay": 100,
        "delayThresholdX2": 50,
        "delayThresholdX4": 25
      },
      entities: {
        "opacitySelectDim": 0.3,
        "opacityRegular": 1
      }
    },
    locale: { },
    ui: {
      map: {
        path: null,
        colorGeo: false,
        preserveAspectRatio: true,
        scale: 0.95,
        offset: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        },
        projection: "robinson",
        topology: {
          path: null,
          objects: {
            geo: "land",
            boundaries: "countries"
          },
          geoIdProperty: null,
        }
      },
      chart: {
        labels: {
          dragging: true
        }
      },
      datawarning: {
        doubtDomain: [],
        doubtRange: []
      },
      "buttons": ["colors", "find", "size", "moreoptions", "fullscreen", "presentation"],
      "dialogs": {
        "popup": ["colors", "find", "size", "moreoptions"],
        "sidebar": ["colors", "find", "size"],
        "moreoptions": ["opacity", "speed", "size", "colors", "presentation", "about"]
      },
      presentation: false
    }
  }
});

export default BubbleMap;
