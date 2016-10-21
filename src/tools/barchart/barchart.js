/*!
 * VIZABI BARCHART
 */

import * as utils from 'base/utils';
import Tool from 'base/tool';

import BarChartComponent from './barchart-component';

import {
  timeslider,
  dialogs,
  buttonlist,
  treemenu
}
from 'components/_index';

var comp_template = 'barchart.html';

//BAR CHART TOOL
var BarChart = Tool.extend('BarChart', {

  /**
   * Initializes the tool (Bar Chart Tool).
   * Executed once before any template is rendered.
   * @param {Object} placeholder Placeholder element for the tool
   * @param {Object} external_model Model as given by the external page
   */
  init: function(placeholder, external_model) {

    this.name = "barchart";

    //specifying components
    this.components = [{
      component: BarChartComponent,
      placeholder: '.vzb-tool-viz',
      model: ["state.time", "state.entities", "state.marker", "language"] //pass models to component
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
    }];

    //constructor is the same as any tool
    this._super(placeholder, external_model);
  },

  default_model: {
    state: {
      time: { },
      entities: { },
      marker: {
        label: { },
        axis_y: {allow: {scales: ["linear", "log"]}},
        axis_x: {allow: {scales: ["ordinal"]}},
        color: { }
      }
    },
    language: { },
    ui: {
      presentation: false,
      chart: { }
    }
  }
});

export default BarChart;