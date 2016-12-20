/*!
 * VIZABI AGEPYRAMID
 */

import * as utils from 'base/utils';
import Tool from 'base/tool';

import AgePyramidComponent from 'tools/agepyramid/agepyramid-component';

import timeslider from 'components/timeslider/timeslider';
import dialogs from 'components/dialogs/dialogs';
import buttonlist from 'components/buttonlist/buttonlist';
import treemenu from 'components/treemenu/treemenu';

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
      model: ["state.time", "state.entities", "state.entities_side", "state.entities_stack", "state.entities_age", "state.marker", "state.marker_side", "locale", "ui"] //pass models to component
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
      marker_tags: {}
    },
    ui: {
      chart: {
        stacked: true,
        inpercent: false,
        flipSides: true
      },
      presentation: false
    },
    locale: { }
  }


});

export default AgePyramid;
