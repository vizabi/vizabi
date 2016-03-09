/*!
 * VIZABI LINECHART
 */

import * as utils from 'base/utils';
import Tool from 'base/tool';

import LCComponent from './linechart-component';

import {
  timeslider,
  dialogs,
  buttonlist,
  treemenu
}
from 'components/_index';


  //LINE CHART TOOL
var LineChart = Tool.extend('LineChart', {
    /**
     * Initialized the tool
     * @param {Object} placeholder Placeholder element for the tool
     * @param {Object} external_model Model as given by the external page
     */
    init: function(placeholder, external_model) {

      this.name = 'linechart';

      this.components = [{
        component: LCComponent,
        placeholder: '.vzb-tool-viz',
        model: ["state.time", "state.entities", "state.marker", "language"] //pass models to component
      }, {
        component: timeslider,
        placeholder: '.vzb-tool-timeslider',
        model: ["state.time"],
        ui: {show_value_when_drag_play: false, axis_aligned: true}
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

      this._super(placeholder, external_model);
    },

    default_model: {
    state: {
      time: {
        start: 1990,
        end: 2012,
        value: 2012,
        step: 1
      },
      //entities we want to show
      entities: {
        dim: "geo",
        show: {
          _defs_: {
            "geo": ["*"],
            "geo.cat": ["region"]
          }
        }
      },
      //how we show it
      marker: {
        space: ["entities", "time"],
        label: {
          use: "property",
          which: "geo.name"
        },
        axis_y: {
          use: "indicator",
          which: "gdp_pc",
          scaleType: "log"
        },
        axis_x: {
          use: "indicator",
          which: "time",
          scaleType: "time"
        },
        color: {
          use: "property",
          which: "geo.region"
        }
      }
    },

    data: {
      //reader: "waffle",
      reader: "csv",
      path: "data/waffles/basic-indicators.csv"
    },

    ui: {
      'vzb-tool-line-chart': {
        labels: {
          min_number_of_entities_when_values_hide: 10 //values hide when showing 10 entities or more
        },
        whenHovering: {
          hideVerticalNow: true,
          showProjectionLineX: true,
          showProjectionLineY: true,
          higlightValueX: true,
          higlightValueY: true,
          showTooltip: true
        }
      }
    }
  }

  });

export default LineChart;