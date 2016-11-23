import * as utils from 'base/utils';
import Component from 'base/component';
import Dialog from 'components/dialogs/_dialog';

import bubblesize from 'components/bubblesize/bubblesize';
import indicatorpicker from 'components/indicatorpicker/indicatorpicker';
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

  // in dialog, this.model_expects = ["state", "ui", "locale"];

  this.components = [
  {
    component: indicatorpicker,
    placeholder: '.vzb-saxis-selector',
    model: ["state.time", "state.entities", "state.marker", "locale"],
    markerID: "size",
    showHoverValues: true
  }
  ];

  // config.ui is same as this.model.ui here but this.model.ui is not yet available because constructor hasn't been called. 
  // can't call constructor earlier because this.components needs to be complete before calling constructor
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
