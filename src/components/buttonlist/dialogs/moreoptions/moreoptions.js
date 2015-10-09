import * as utils from 'base/utils';
import Component from 'base/component';
import Dialog from '../_dialog';

import {
  bubbleopacity,
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
      component: simplecheckbox,
      placeholder: '.vzb-axes-options',
      model: ["state", "language"],
      submodel: 'time',
      checkbox: 'adaptMinMaxZoom'
    }, {
      component: bubblesize,
      placeholder: '.vzb-dialog-bubblesize-min',
      model: ["state.marker.size"],
      field: 'min'
    }, {
      component: bubblesize,
      placeholder: '.vzb-dialog-bubblesize-max',
      model: ["state.marker.size"],
      field: 'max'
    }, {
      component: indicatorpicker,
      placeholder: '.vzb-saxis-container',
      model: ["state.marker.size", "language"]
    }, {
      component: indicatorpicker,
      placeholder: '.vzb-caxis-container',
      model: ["state.marker.color", "language"]
    }, {
      component: colorlegend,
      placeholder: '.vzb-clegend-container',
      model: ["state.marker.color", "state.entities", "language"]
    }, {
      component: bubbleopacity,
      placeholder: '.vzb-dialog-bubbleopacity-regular',
      model: ["state.entities"],
      arg: "opacityRegular"
    }, {
      component: bubbleopacity,
      placeholder: '.vzb-dialog-bubbleopacity-selectdim',
      model: ["state.entities"],
      arg: "opacitySelectDim"
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

