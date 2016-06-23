/*!
 * VIZABI AGEPYRAMID
 */

import * as utils from 'base/utils';
import Tool from 'base/tool';

import CartogramComponent from '../cartogram/cartogram-component';
import LCComponent from '../linechart/linechart-component';

import {
  timeslider,
  dialogs,
  buttonlist,
  treemenu,
  datawarning,
  datanotes
}
from 'components/_index';

//BAR CHART TOOL
var JOINTCartogramLine = Tool.extend('JOINTCartogramLine', {

  /**
   * Initializes the tool (Bar Chart Tool).
   * Executed once before any template is rendered.
   * @param {Object} placeholder Placeholder element for the tool
   * @param {Object} external_model Model as given by the external page
   */
  init: function(placeholder, external_model) {
    
    this.name = "joint_cartogramline";
    
    this.template = 
      '<div class="vzb-tool vzb-tool-' + this.name + '">' + 
        '<div class="vzb-tool-stage vzb-tool-stage-left" style="position:absolute; left: 0; width: 65%; height: 100%;">' + 
          '<div class="vzb-tool-viz vzb-tool-viz-cartogram"></div>' + 
        '</div>' + 
        '<div class="vzb-tool-stage vzb-tool-stage-right" style="position:absolute; right: 0; top: 0; width: 40%; height: 100%;">' +
          '<div class="vzb-tool-viz vzb-tool-viz-line"></div>' + 
          '<div class="vzb-tool-timeslider"></div>' + 
        '</div>' + 
        '<div class="vzb-tool-sidebar">' + 
          '<div class="vzb-tool-dialogs"></div>' +
          '<div class="vzb-tool-buttonlist"></div>' + 
        '</div>' +         
        '<div class="vzb-tool-datanotes vzb-hidden"></div>' + 
        '<div class="vzb-tool-treemenu vzb-hidden"></div>' + 
        '<div class="vzb-tool-datawarning vzb-hidden"></div>' + 
        '<div class="vzb-tool-labels vzb-hidden"></div>' + 
      '</div>';
    
    
    //specifying components
    this.components = [{
      component: CartogramComponent,
      placeholder: '.vzb-tool-viz-cartogram',
      model: ["state.time", "state.entities", "state.marker", "language", "ui"] //pass models to component
    }, {
      component: LCComponent,
      placeholder: '.vzb-tool-viz-line',
      model: ["state.time", "state.entities_line", "state.marker_line", "language"]
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
      model: ['state.marker', 'language']
    }, {
      component: datawarning,
      placeholder: '.vzb-tool-datawarning',
      model: ['language']
    }, {
      component: datanotes,
      placeholder: '.vzb-tool-datanotes',
      model: ['state.marker', 'language']
    }];

    //constructor is the same as any tool
    this._super(placeholder, external_model);
  },
  
  readyOnce: function(){
    this.element = d3.select(this.element);
    //this.element.select(".vzb-ct-axis-y-title").classed("vzb-hidden", true);
    //this.element.select(".vzb-ct-axis-y-info").style("visibility", "hidden");
    this.element.select(".vzb-lc-axis-y-title").classed("vzb-hidden", true);
    this.element.select(".vzb-lc-axis-x-title").classed("vzb-hidden", true);
    this.element.select(".vzb-lc-axis-y-info").classed("vzb-hidden", true);
    this.element.select(".vzb-data-warning").classed("vzb-hidden", true);
  
  }

});

export default JOINTCartogramLine;