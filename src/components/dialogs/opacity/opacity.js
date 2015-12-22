import * as utils from 'base/utils';
import Component from 'base/component';
import Dialog from '../_dialog';

import { simpleslider } from 'components/_index'
/*
 * Size dialog
 */

var Opacity = Dialog.extend({

/**
 * Initializes the dialog component
 * @param config component configuration
 * @param context component context (parent)
 */
init: function(config, parent) {
  this.name = 'opacity';

  // in dialog, this.model_expects = ["state", "data"];

  this.components = [
  {
    component: simpleslider,
    placeholder: '.vzb-dialog-bubbleopacity-regular',
    model: ["state.entities"],
    arg: "opacityRegular"
  }, {
    component: simpleslider,
    placeholder: '.vzb-dialog-bubbleopacity-selectdim',
    model: ["state.entities"],
    arg: "opacitySelectDim"
  }
  ];

  this._super(config, parent);
}
});

export default Opacity;