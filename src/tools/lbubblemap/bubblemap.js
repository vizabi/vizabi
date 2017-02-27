/*!
 * VIZABI BUBBLEMAP
 */

import * as utils from "base/utils";
import Tool from "base/tool";

import LBubbleMapComponent from "tools/lbubblemap/bubblemap-component";

import timeslider from "components/timeslider/timeslider";
import dialogs from "components/dialogs/dialogs";
import buttonlist from "components/buttonlist/buttonlist";
import treemenu from "components/treemenu/treemenu";
import datawarning from "components/datawarning/datawarning";
import datanotes from "components/datanotes/datanotes";

//BAR CHART TOOL
const LBubbleMap = Tool.extend("LBubbleMap", {


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
      component: LBubbleMapComponent,
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
    }];
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
        preserveAspectRatio: true,
        mapEngine: "google",
        mapLayer: "terrain",
        topojsonLayer: true,
        bounds: {
          north: 60.25,
          west: 17.5,
          south: 59,
          east: 19.5
        },
        offset: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        },
        projection: "mercator",
        topology: {
          path: "data/sodertorn-basomr2010.json",
          objects: {
            geo: "c1e171fae817c0bfc26dc7df82219e08",
            boundaries: "c1e171fae817c0bfc26dc7df82219e08"
          },
          geoIdProperty: "BASKOD2010"
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
      presentation: false
    }
  }
});

export default LBubbleMap;
