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
import datawarning from 'components/datawarning/datawarning';
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
        model: ["state.time", "state.entities", "state.marker", "locale", "ui"] //pass models to component
      }, {
        component: timeslider,
        placeholder: '.vzb-tool-timeslider',
        model: ["state.time", "state.entities", "state.marker", "ui"],
        ui: {show_value_when_drag_play: false, axis_aligned: true}
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
      }, {
        component: datawarning,
        placeholder: '.vzb-tool-datawarning',
        model: ['locale']
      }, {
        component: datanotes,
        placeholder: '.vzb-tool-datanotes',
        model: ['state.marker', 'locale']
      }];

      this._super(placeholder, external_model);
    },

    default_model: {
    state: {
      time: {},
      marker: { 
        axis_x: {allow: {scales: ["time"]}},
        axis_y: {allow: {scales: ["linear", "log"]}}
      }
    },
    locale: { },
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
      datawarning: {
        doubtDomain: [],
        doubtRange: []
      },
      "presentation": false
    }
  }

  });

export default LineChart;
