/*!
 * VIZABI LINECHART
 */

import * as utils from 'base/utils';
import Tool from 'base/tool';

import CartogramComponent from './cartogram-component';

import {
  timeslider,
  dialogs,
  buttonlist,
  treemenu,
  labels,
  datawarning,
  datanotes
}
from 'components/_index';

  //CARTOGRAM TOOL
var Cartogram = Tool.extend('Cartogram', {

    /**
     * Initialized the tool
     * @param {Object} placeholder Placeholder element for the tool
     * @param {Object} external_model Model as given by the external page
     */
    init: function(placeholder, external_model) {

      this.name = 'cartogram';

      //specifying components
      this.components = [{
        component: CartogramComponent,
        placeholder: '.vzb-tool-viz',
        model: ["state.time", "state.entities", "state.marker", "language", "ui"] //pass models to component
      }, {
        component: timeslider,
        placeholder: '.vzb-tool-timeslider',
        model: ["state.time", "state.entities", "state.marker"]
      }, {
        component: labels,
        placeholder: '.vzb-tool-labels',
        model: ["state.entities", "state.marker", "ui"]
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
      }
      ];

      //constructor is the same as any tool
      this._super(placeholder, external_model);
    },

  default_model: {
    state: {
      time: {},
      marker: {
        space: ["entities", "time"],
        color: {
          use: "property",
          which: "population"
        }
      }
    },
    ui: {
      chart: {
        labels: {
          dragging: true
        },
        lockNonSelected: 0
      },
      presentation: true
    }
  }

  });

export default Cartogram;