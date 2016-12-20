import * as utils from 'base/utils';
import Tool from 'base/tool';

import BubbleChartComponent from 'tools/bubblechart/bubblechart-component';

import timeslider from 'components/timeslider/timeslider';
import dialogs from 'components/dialogs/dialogs';
import buttonlist from 'components/buttonlist/buttonlist';
import treemenu from 'components/treemenu/treemenu';
import datawarning from 'components/datawarning/datawarning';
import datanotes from 'components/datanotes/datanotes';

var BubbleChart = Tool.extend('BubbleChart', {

  /**
   * Initializes the tool (Bubble Chart Tool).
   * Executed once before any template is rendered.
   * @param {Object} placeholder Placeholder element for the tool
   * @param {Object} external_model Model as given by the external page
   */
  init: function(placeholder, external_model) {

    this.name = "bubblechart";

    //specifying components
    this.components = [{
      component: BubbleChartComponent,
      placeholder: '.vzb-tool-viz',
      model: ["state.time", "state.entities", "state.marker", "locale", "ui"] //pass models to component
    }, {
      component: timeslider,
      placeholder: '.vzb-tool-timeslider',
      model: ["state.time", "state.entities", "state.marker", "ui"]
    }, {
      component: dialogs,
      placeholder: '.vzb-tool-dialogs',
      model: ['state', 'ui', 'locale']
    }, {
      component: buttonlist,
      placeholder: '.vzb-tool-buttonlist',
      model: ['state', 'ui', 'locale']
    }, {
      component: treemenu,
      placeholder: '.vzb-tool-treemenu',
      model: ['state.marker', 'state.marker_tags', 'state.time', 'locale']
    }, {
      component: datawarning,
      placeholder: '.vzb-tool-datawarning',
      model: ['locale']
    }, {
      component: datanotes,
      placeholder: '.vzb-tool-datanotes',
      model: ['state.marker', 'locale']
    }];

    this._super(placeholder, external_model);

  },

  validate: function(model){
    model = this.model || model;

    this._super(model);

    if(model.ui.chart.lockNonSelected) {
       var time = model.state.time.timeFormat.parse("" + model.ui.chart.lockNonSelected);
       if(time < model.state.time.start) model.ui.chart.lockNonSelected = model.state.time.timeFormat(model.state.time.start);
       if(time > model.state.time.end) model.ui.chart.lockNonSelected = model.state.time.timeFormat(model.state.time.end);
    }
  },

  /**
   * Determines the default model of this tool
   */
  default_model: {
    state: {
      time: { 
        autogenerate: {
          data: "data",
          conceptIndex: 1
        }
      },
      entities: {
        autogenerate: {
          data: "data",
          conceptIndex: 0
        }
      },
      entities_colorlegend: {
        autogenerate: {
          data: "data",
          conceptIndex: 0
        }
      },
      entities_tags: { },
      marker_tags: {
        space: ["entities_tags"],
        label: {},
        hook_parent: {}
      },
      marker: {
        space: ["entities", "time"],
        axis_x: { 
          use: "indicator",
          autogenerate: {
            conceptIndex: 2
          }
        },
        axis_y: { 
          use: "indicator",
          autogenerate: {
            conceptIndex: 3
          }
        },
        label:  {
          use: "property",
          autogenerate: {
            conceptIndex: 0
          }
        },
        size: {
        },
        color: {
          syncModels: ["marker_colorlegend"]
        },
        size_label: {
          /*use size model defaults - will be constant*/
          _important: false,
          extent: [0, 0.33]
        },
      },
      "marker_colorlegend":{
        "space": ["entities_colorlegend"],
        "label": {
          "use": "property",
          "which": "name"
        },
        "hook_rank": {
          "use": "property",
          "which": "rank"
        },
        "hook_geoshape": {
          "use": "property",
          "which": "shape_lores_svg"
        }
      }
    },
    locale: { },
    ui: {
      chart: {
        whenHovering: {
          showProjectionLineX: true,
          showProjectionLineY: true,
          higlightValueX: true,
          higlightValueY: true
        },
        labels: {
          dragging: true,
          removeLabelBox: false
        },
        trails: true,
        lockNonSelected: 0
      },
      datawarning: {
        doubtDomain: [],
        doubtRange: []
      },
      presentation: false,
      adaptMinMaxZoom: false,
      cursorMode: 'arrow',
      zoomOnScrolling: false,
      buttons: ['colors', 'find', 'size', 'trails', 'lock', 'moreoptions', 'fullscreen', 'presentation'],
      dialogs: {
        popup: ['colors', 'find', 'size', 'zoom', 'moreoptions'], 
        sidebar: ['colors', 'find', 'size', 'zoom'], 
        moreoptions: ['opacity', 'speed', 'axes', 'size', 'colors', 'label', 'zoom','presentation', 'about']
      }
    }
  }
});

export default BubbleChart;
