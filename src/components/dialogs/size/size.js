import * as utils from 'base/utils';
import Component from 'base/component';
import Dialog from '../_dialog';

import { bubblesize, indicatorpicker } from 'components/_index'
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

  this.components = [
  {
    component: indicatorpicker,
    placeholder: '.vzb-saxis-selector',
    model: ["state.marker", "language"],
    markerID: "size"
  }
  ];
  if (!config.ui.chart || config.ui.chart.sizeSelectorActive !== 0) {
    this.components.push(  {
      component: bubblesize,
      placeholder: '.vzb-dialog-bubblesize',
      model: ["state.marker.size"],
      ui: {
        show_button: false
      }
    })
  }

  this._super(config, parent);
}
});

export default Size;