/*!
 * VIZABI BUBBLEMAP
 */

import * as utils from 'base/utils';
import Tool from 'base/tool';

import BubbleMapComponent from './bubblemap-component';

import {
  timeslider,
  buttonlist,
  treemenu,
  datawarning
}
from 'components/_index';

//BAR CHART TOOL
var BubbleMap = Tool.extend('BubbleMap', {


  /**
   * Initializes the tool (Bar Chart Tool).
   * Executed once before any template is rendered.
   * @param {Object} config Initial config, with name and placeholder
   * @param {Object} options Options such as state, data, etc
   */
  init: function(config, options) {

    this.name = "bubblemap";

    //specifying components
    this.components = [{
      component: BubbleMapComponent,
      placeholder: '.vzb-tool-viz',
      model: ["state.time", "state.entities", "state.marker", "language", "ui"] //pass models to component
    }, {
      component: timeslider,
      placeholder: '.vzb-tool-timeslider',
      model: ["state.time"]
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
    }
    ];

    //constructor is the same as any tool
    this._super(config, options);
  },

  default_options: {
    state: {
      time: {},
      entities: {
        dim: "geo",
        show: {
          _defs_: {
            "geo": ["*"],
            "geo.cat": ["region"]
          }
        }
      },
      marker: {
        space: ["entities", "time"],
        label: {
          use: "property",
          which: "geo.name"
        },
        axis_y: {
          use: "indicator",
          which: "lex"
        },
        axis_x: {
          use: "property",
          which: "geo.name"
        },
        color: {
          use: "property",
          which: "geo.region"
        }
      }
    },
    data: {
      reader: "csv",
      path: "data/waffles/basic-indicators.csv"
    },
    ui: {
      presentation: true
    }
  }
});

export default BubbleMap;