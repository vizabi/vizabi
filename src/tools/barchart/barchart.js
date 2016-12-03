/*!
 * VIZABI BARCHART
 */

import * as utils from 'base/utils';
import Tool from 'base/tool';

import BarChartComponent from 'tools/barchart/barchart-component';

import timeslider from 'components/timeslider/timeslider';
import dialogs from 'components/dialogs/dialogs';
import buttonlist from 'components/buttonlist/buttonlist';
import treemenu from 'components/treemenu/treemenu';

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
      model: ["state.time", "state.entities", "state.marker", "locale"] //pass models to component
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
        axis_x: {allow: {scales: ["ordinal", "nominal"]}},
        color: { }
      }
    },
    locale: { },
    ui: {
      presentation: false,
      chart: { }
    }
  }
});

export default BarChart;
