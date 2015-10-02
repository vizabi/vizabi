import utils from '../../../../base/utils';
import Component from '../../../../base/component';
import Dialog from '../_dialog';

import { bubblesize, indicatorpicker } from '../../../../components/_index';

/*
 * Size dialog
 */

var Size = Dialog.extend({

/**
 * Initializes the dialog component
 * @param config component configuration
 * @param context component context (parent)
 */
init: function(config, parent) {
  this.name = 'size';

  // in dialog, this.model_expects = ["state", "data"];

  this.components = [{
    component: bubblesize,
    placeholder: '.vzb-dialog-bubblesize-min',
    model: ["state.marker.size"],
    ui: {
      show_button: false
    },
    field: 'min'
  }, {
    component: bubblesize,
    placeholder: '.vzb-dialog-bubblesize-max',
    model: ["state.marker.size"],
    ui: {
      show_button: false
    },
    field: 'max'
  }, {
    component: indicatorpicker,
    placeholder: '.vzb-saxis-container',
    model: ["state.marker.size", "language"],
    ui: {
      selectIndicator: true,
      selectScaletype: false
    }
  }];

  this._super(config, parent);
}
});

export default Size;