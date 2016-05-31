/*!
 * VIZABI BARCHART
 */

import * as utils from 'base/utils';
import Tool from 'base/tool';

import DonutComponent from './donutchart-component';

import {
  timeslider,
  dialogs,
  buttonlist,
  treemenu
}
from 'components/_index';

var comp_template = 'barchart.html';

//BAR CHART TOOL
//extend the base Tool class and register it in Vizabi tools under a name 'DunutChart'
var DonutChart = Tool.extend('DonutChart', {

  //Run when the tool is created
  init: function(placeholder, external_model) {

    //Let's give it a name
    this.name = "donutchart";

    //Now we can specify components that should be included in the tool:
    this.components = [{
      //choose which component to use:
      //at this point you can check Vizabi.Component.getCollection() to see which components are available
      component: 'donut',
      //these placeholdes are defined by the Tool prototype class
      placeholder: '.vzb-tool-viz',
      //component should have access to the following models:
      model: ["state.time", "state.marker"]
    }, {
      component: 'timeslider',
      placeholder: '.vzb-tool-timeslider',
      model: ["state.time", "state.entities", "state.marker"]
    }];
      
      this._super(placeholder, external_model);
    },

    //provide the default options
    default_model: {
      state: {
      }
    }
});

export default DonutChart;


