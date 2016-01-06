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
     * @param config tool configurations, such as placeholder div
     * @param options tool options, such as state, data, etc
     */
    init: function (config, options) {

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

      this._super(config, options);
    },

    default_options: {
    state: {
      time: {
        start: 1990,
        end: 2012,
        value: 2012,
        step: 1,
        formatInput: "%Y"
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
        entity_labels: {
          min_number_of_entities_when_values_hide: 2 //values hide when showing 2 entities or more
        },
        whenHovering: {
          hideVerticalNow: 0,
          showProjectionLineX: true,
          showProjectionLineY: true,
          higlightValueX: true,
          higlightValueY: true,
          showTooltip: 0
        }
      }
    }
  }

  });

export default LineChart;