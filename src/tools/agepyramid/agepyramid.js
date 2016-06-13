/*!
 * VIZABI AGEPYRAMID
 */

import * as utils from 'base/utils';
import Tool from 'base/tool';

import AgePyramidComponent from './agepyramid-component';

import {
  timeslider,
  dialogs,
  buttonlist,
  treemenu
}
from 'components/_index';

//BAR CHART TOOL
var AgePyramid = Tool.extend('AgePyramid', {

  /**
   * Initializes the tool (Bar Chart Tool).
   * Executed once before any template is rendered.
   * @param {Object} placeholder Placeholder element for the tool
   * @param {Object} external_model Model as given by the external page
   */
  init: function(placeholder, external_model) {

    this.name = "agepyramid";

    //specifying components
    this.components = [{
      component: AgePyramidComponent,
      placeholder: '.vzb-tool-viz',
      model: ["state.time", "state.entities", "state.entities_side", "state.entities_stack", "state.entities_age", "state.marker", "language"] //pass models to component
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
    }];

    //constructor is the same as any tool
    this._super(placeholder, external_model);
  }

});

export default AgePyramid;