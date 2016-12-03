/*!
 * VIZABI LINECHART
 */

import * as utils from 'base/utils';
import Tool from 'base/tool';

import CartogramComponent from 'tools/cartogram/cartogram-component';

import timeslider from 'components/timeslider/timeslider';
import dialogs from 'components/dialogs/dialogs';
import buttonlist from 'components/buttonlist/buttonlist';
import treemenu from 'components/treemenu/treemenu';
import datawarning from 'components/datawarning/datawarning';
import datanotes from 'components/datanotes/datanotes';

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
        model: ["state.time", "state.entities", "state.marker", "locale", "ui"] //pass models to component
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
        model: ['state.marker', 'locale']
      }, {
        component: datawarning,
        placeholder: '.vzb-tool-datawarning',
        model: ['locale']
      }, {
        component: datanotes,
        placeholder: '.vzb-tool-datanotes',
        model: ['state.marker', 'locale']
      }
      ];

      //constructor is the same as any tool
      this._super(placeholder, external_model);
    },

  default_model: {
    state: { },
    ui: {
      chart: {
        labels: {
          dragging: true
        },
        lockNonSelected: 0,
        lockActive: 0,
        sizeSelectorActive:0
      },
      datawarning: {
        doubtDomain: [],
        doubtRange: []
      },
      presentation: false
    }
  }
});

export default Cartogram;
