import * as utils from 'base/utils';
import Component from 'base/component';
import Dialog from '../_dialog';

import {
  simpleslider,
  bubblesize,
  colorlegend,
  indicatorpicker,
  simplecheckbox
}
from 'components/_index';

/*
 * More options dialog
 */

export default Dialog.extend({

  /**
   * Initializes the dialog component
   * @param config component configuration
   * @param context component context (parent)
   */
  init: function(config, parent) {
    this.name = 'moreoptions';

    this.components = [{
      component: indicatorpicker,
      placeholder: '.vzb-xaxis-container',
      model: ["state.marker.axis_x", "language"],
      ui: {
        selectMinMax: false,
        selectFakeMinMax: true
      }
    }, {
      component: indicatorpicker,
      placeholder: '.vzb-yaxis-container',
      model: ["state.marker.axis_y", "language"],
      ui: {
        selectMinMax: false,
        selectFakeMinMax: true
      }
    }, {
      component: indicatorpicker,
      placeholder: '.vzb-saxis-container',
      model: ["state.marker.size", "language"],
      ui: {
        selectIndicator: true,
        selectScaletype: false
      }
    }, {
      component: bubblesize,
      placeholder: '.vzb-dialog-bubblesize',
      model: ["state.marker.size"],
      ui: {
        show_button: false
      }
    }, {
      component: indicatorpicker,
      placeholder: '.vzb-caxis-container',
      model: ["state.marker.color", "language"]
    }, {
      component: colorlegend,
      placeholder: '.vzb-clegend-container',
      model: ["state.marker.color", "state.entities", "language"]
    }, {
      component: simpleslider,
      placeholder: '.vzb-dialog-bubbleopacity-regular',
      model: ["state.entities"],
      arg: "opacityRegular"
    }, {
      component: simpleslider,
      placeholder: '.vzb-dialog-bubbleopacity-selectdim',
      model: ["state.entities"],
      arg: "opacitySelectDim"
    }, {
      component: simpleslider,
      placeholder: '.vzb-dialog-delay-slider',
      model: ["state.time"],
      arg: "delay",
      properties: {min:1, max:5, step:0.1, scale: d3.scale.linear()
        .domain([1,2,3,4,5])
        .range([1200,900,450,200,75])
      }
    },
    {
      component: simplecheckbox,
      placeholder: '.vzb-presentationmode-switch',
      model: ["ui", "language"],
      checkbox: 'presentation'
    }];

    this._super(config, parent);
  },

  readyOnce: function() {
    this.element = d3.select(this.element);
    this.resize();
  },

  resize: function() {
    var totalHeight = this.root.element.offsetHeight - 200;
    var content = this.element.select('.vzb-dialog-content');
    content.style('max-height', totalHeight + 'px');

    this._super();
  }
});
