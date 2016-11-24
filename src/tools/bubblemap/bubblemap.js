/*!
 * VIZABI BUBBLEMAP
 */

import * as utils from 'base/utils';
import Tool from 'base/tool';

import BubbleMapComponent from 'tools/bubblemap/bubblemap-component';

import timeslider from 'components/timeslider/timeslider';
import dialogs from 'components/dialogs/dialogs';
import buttonlist from 'components/buttonlist/buttonlist';
import treemenu from 'components/treemenu/treemenu';
import datawarning from 'components/datawarning/datawarning';
import datanotes from 'components/datanotes/datanotes';

//BAR CHART TOOL
var BubbleMap = Tool.extend('BubbleMap', {


  /**
   * Initializes the tool (Bar Chart Tool).
   * Executed once before any template is rendered.
   * @param {Object} placeholder Placeholder element for the tool
   * @param {Object} external_model Model as given by the external page
   */
  init: function(placeholder, external_model) {

    this.name = "bubblemap";

    //specifying components
    this.components = [{
      component: BubbleMapComponent,
      placeholder: '.vzb-tool-viz',
      model: ["state.time", "state.entities", "state.marker", "language", "ui"] //pass models to component
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
    }, {
      component: datawarning,
      placeholder: '.vzb-tool-datawarning',
      model: ['language']
    }, {
      component: datanotes,
      placeholder: '.vzb-tool-datanotes',
      model: ['state.marker', 'language']
    }
    ];

    //constructor is the same as any tool
    this._super(placeholder, external_model);
  },

  default_model: {
    state: {
      time: {
        "delay": 100,
        "delayThresholdX2": 50,
        "delayThresholdX4": 25
      },
      entities: {
        "opacitySelectDim": 0.3,
        "opacityRegular": 1
      }
    },
    language: { },
    ui: {
      chart: {
        labels: {
          dragging: true
        }
      },
      datawarning: {
        doubtDomain: [],
        doubtRange: []
      },
      presentation: false
    }
  }
});

export default BubbleMap;
