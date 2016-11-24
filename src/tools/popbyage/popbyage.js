/*!
 * VIZABI POPBYAGE
 */

import * as utils from 'base/utils';
import Tool from 'base/tool';

import PopByAgeComponent from 'tools/popbyage/popbyage-component';

import timeslider from 'components/timeslider/timeslider';
import dialogs from 'components/dialogs/dialogs';
import buttonlist from 'components/buttonlist/buttonlist';
import treemenu from 'components/treemenu/treemenu';

//BAR CHART TOOL
var PopByAge = Tool.extend('PopByAge', {

  /**
   * Initializes the tool (Bar Chart Tool).
   * Executed once before any template is rendered.
   * @param {Object} placeholder Placeholder element for the tool
   * @param {Object} external_model Model as given by the external page
   */
  init: function(placeholder, external_model) {

    this.name = "popbyage";

    //specifying components
    this.components = [{
      component: PopByAgeComponent,
      placeholder: '.vzb-tool-viz',
      model: ["state.time", "state.entities", "state.entities_age", "state.marker", "language"] //pass models to component
    }, {
      component: timeslider,
      placeholder: '.vzb-tool-timeslider',
      model: ["state.time", "state.entities", "state.marker", "ui"]
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
      marker_tags: {}
    },
    ui: {
      presentation: false
    }
  }

});

export default PopByAge;
