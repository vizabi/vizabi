import utils from '../../../../base/utils';
import Component from '../../../../base/component';
import Dialog from '../_dialog';

/*
 * Size dialog
 */

var Size = Component.register('gapminder-buttonlist-size', Dialog.extend({

/**
 * Initializes the dialog component
 * @param config component configuration
 * @param context component context (parent)
 */
init: function(config, parent) {
  this.name = 'size';

  // in dialog, this.model_expects = ["state", "data"];

  this.components = [{
    component: 'gapminder-bubblesize',
    placeholder: '.vzb-dialog-bubblesize-min',
    model: ["state.marker.size"],
    ui: {
      show_button: false
    },
    field: 'min'
  }, {
    component: 'gapminder-bubblesize',
    placeholder: '.vzb-dialog-bubblesize-max',
    model: ["state.marker.size"],
    ui: {
      show_button: false
    },
    field: 'max'
  }, {
    component: 'gapminder-indicatorpicker',
    placeholder: '.vzb-saxis-container',
    model: ["state.marker.size", "language"],
    ui: {
      selectIndicator: true,
      selectScaletype: false
    }
  }];

  this._super(config, parent);
}
}));

}).call(this);

export default Size;