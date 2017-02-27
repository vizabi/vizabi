import * as utils from "base/utils";
import Tool from "base/tool";

import BarRankChartComponent from "tools/barrankchart/barrankchart-component";

import timeslider from "components/timeslider/timeslider";
import dialogs from "components/dialogs/dialogs";
import buttonlist from "components/buttonlist/buttonlist";
import treemenu from "components/treemenu/treemenu";
import datanotes from "components/datanotes/datanotes";
import datawarning from "components/datawarning/datawarning";
import steppedSpeedSlider from "components/steppedspeedslider/steppedspeedslider";

const BarRankChart = Tool.extend("BarRankChart", {

  //Run when the tool is created
  init(placeholder, external_model) {

    this.name = "barrankchart";

    this.components = [{
      component: BarRankChartComponent,
      placeholder: ".vzb-tool-viz",
      model: ["state.time", "state.entities", "state.marker", "locale", "ui"]
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
      component: datanotes,
      placeholder: ".vzb-tool-datanotes",
      model: ["state.marker", "locale"]
    }, {
      component: datawarning,
      placeholder: ".vzb-tool-datawarning",
      model: ["locale"]
    }, {
      component: steppedSpeedSlider,
      placeholder: ".vzb-tool-stepped-speed-slider",
      model: ["state.time", "locale"]
    }];

    //constructor is the same as any tool
    this._super(placeholder, external_model);
  },

  /**
   * Determines the default model of this tool
   */
  default_model: {
    state: {
      entities: {
        dim: "id"
      },
      time: {},
      marker: {
        axis_x: { allow: { scales: ["linear", "log"] } },
        axis_y: { allow: { scales: ["ordinal", "nominal"] } },
        color: {}
      }
    },
    locale: {},
    ui: {
      chart: {},
      datawarning: {
        doubtDomain: [],
        doubtRange: []
      },
      "buttons": ["colors", "find", "show", "moreoptions", "fullscreen", "presentation"],
      "dialogs": {
        "popup": ["timedisplay", "colors", "find", "axes", "show", "moreoptions"],
        "sidebar": ["timedisplay", "colors", "find"],
        "moreoptions": ["opacity", "speed", "colors", "presentation", "about"]
      },
      presentation: false
    }
  }
});

export default BarRankChart;
