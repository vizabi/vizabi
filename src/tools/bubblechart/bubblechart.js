import * as utils from 'base/utils';
import Tool from 'base/tool';

import BubbleChartComponent from './bubblechart-component';
import {
  timeslider,
  dialogs,
  buttonlist,
  treemenu,
  datawarning,
  datanotes
} from 'components/_index';

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
      model: ["state.time", "state.entities", "state.marker", "language", "ui"] //pass models to component
    }, {
      component: timeslider,
      placeholder: '.vzb-tool-timeslider',
      model: ["state.time", "state.entities", "state.marker"]
    }, {
      component: dialogs,
      placeholder: '.vzb-tool-dialogs',
      model: ['state', 'ui', 'language']
    }, {
      component: buttonlist,
      placeholder: '.vzb-tool-buttonlist',
      model: ['state', 'ui', 'language']
    }, {
      component: treemenu,
      placeholder: '.vzb-tool-treemenu',
      model: ['state.marker', 'state.marker_tags', 'state.time', 'language']
    }, {
      component: datawarning,
      placeholder: '.vzb-tool-datawarning',
      model: ['language']
    }, {
      component: datanotes,
      placeholder: '.vzb-tool-datanotes',
      model: ['state.marker', 'language']
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
      time: { },
      entities: {
        dim: "id"
      }, 
      entities_tags: { }, 
      marker_tags: {
        space: ["entities_tags"],
        label: {},
        hook_parent: {}
      }, 
      marker: {
        space: ["entities", "time"],
        axis_x: {use: "indicator", which: "x"},
        axis_y: {use: "indicator", which: "y"},
        label:  {use: "property", which: "id"},
        size:   {/*use size model defaults - will be constant*/},
        color:  {/*use color model defaults - will be constant*/},
        size_label: {
          /*use size model defaults - will be constant*/
          _important: false,
          extent: [0, 0.33]
        },
      }
    },
    language: { },
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
    }
  }
});

export default BubbleChart;