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
      presentation: false
    }
  },
  
  
  datawarning_content: {
    title: "",
    body: "Comparing the size of economy across countries and time is not trivial. The methods vary and the prices change. Gapminder has adjusted the picture for many such differences, but still we recommend you take these numbers with a large grain of salt.<br/><br/> Countries on a lower income levels have lower data quality in general, as less resources are available for compiling statistics. Historic estimates of GDP before 1950 are generally also more rough. <br/><br/> Data for child mortality is more reliable than GDP per capita, as the unit of comparison, dead children, is universally comparable across time and place. This is one of the reasons this indicator has become so useful to measure social progress. But the historic estimates of child mortality are still suffering from large uncertainties.<br/><br/> Learn more about the datasets and methods in this <a href='http://www.gapminder.org/news/data-sources-dont-panic-end-poverty' target='_blank'>blog post</a>",
    doubtDomain: [1800, 1950, 2015],
    doubtRange: [1.0, .3, .2]
  }

});

export default Cartogram;