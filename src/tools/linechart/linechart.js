/*!
 * VIZABI LINECHART
 */

import * as utils from 'base/utils';
import Tool from 'base/tool';

import LCComponent from 'tools/linechart/linechart-component';

import timeslider from 'components/timeslider/timeslider';
import dialogs from 'components/dialogs/dialogs';
import buttonlist from 'components/buttonlist/buttonlist';
import treemenu from 'components/treemenu/treemenu';
import datanotes from 'components/datanotes/datanotes';


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
        model: ["state.time", "state.entities", "state.marker", "ui"],
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
        model: ['state.marker', 'state.marker_tags', 'state.time', 'language']
      }, {
        component: datanotes,
        placeholder: '.vzb-tool-datanotes',
        model: ['state.marker', 'language']
      }];

      this._super(placeholder, external_model);
    },

    default_model: {
    state: {
      time: {},
    },
    language: { },
    "ui": {
      "chart": {
        "labels": {
          "min_number_of_entities_when_values_hide": 2 //values hide when showing 2 entities or more
        },
        "whenHovering": {
          "hideVerticalNow": false,
          "showProjectionLineX": true,
          "showProjectionLineY": true,
          "higlightValueX": true,
          "higlightValueY": true,
          "showTooltip": false
        }
      },
      "presentation": false
    }
  }

  });

export default LineChart;
