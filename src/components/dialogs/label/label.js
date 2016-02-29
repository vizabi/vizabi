import * as utils from 'base/utils';
import Component from 'base/component';
import Dialog from '../_dialog';

import { sizeslider, indicatorpicker, simplecheckbox } from 'components/_index'
/*
 * Size dialog
 */

var Label = Dialog.extend({

/**
 * Initializes the dialog component
 * @param config component configuration
 * @param context component context (parent)
 */
init: function(config, parent) {
  this.name = 'label';

  // in dialog, this.model_expects = ["state", "data"];

  this.components = [
  {
    component: sizeslider,
    placeholder: '.vzb-dialog-sizeslider',
    model: ["state.marker.size_label"],
    propertyname: 'LabelTextSize',
    ui: {
      show_button: false
    }
  },
  {
    component: indicatorpicker,
    placeholder: '.vzb-saxis-selector',
    model: ["state.marker", "language"],
    markerID: "size_label"
  },
  {
    component: simplecheckbox,
    placeholder: '.vzb-removelabelbox-switch',
    model: ["ui.vzb-tool-bubblechart", "language"],
    checkbox: 'removeLabelBox',
    submodel: 'labels'
  }
  ];

  this._super(config, parent);
}
});

export default Label;