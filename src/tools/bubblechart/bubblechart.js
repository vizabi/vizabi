import * as utils from 'base/utils';
import Tool from 'base/tool';

import BubbleChartComponent from './bubblechart-component';
import {
  timeslider,
  dialogs,
  buttonlist,
  treemenu,
  labels,
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
      component: labels,
      placeholder: '.vzb-tool-labels',
      model: ["state.entities", "state.marker", "ui"]
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
    },
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
      presentation: true,
      adaptMinMaxZoom: false
    }
  }
});

export default BubbleChart;