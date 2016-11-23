import * as utils from 'base/utils';
import Component from 'base/component';
import Dialog from 'components/dialogs/_dialog';

import simplecheckbox from 'components/simplecheckbox/simplecheckbox';
/*
 * Size dialog
 */

var Presentation = Dialog.extend({

/**
 * Initializes the dialog component
 * @param config component configuration
 * @param context component context (parent)
 */
init: function(config, parent) {
  this.name = 'presentation';

  // in dialog, this.model_expects = ["state", "data"];

  this.components = [
  {
    component: simplecheckbox,
    placeholder: '.vzb-presentationmode-switch',
    model: ["ui", "locale"],
    checkbox: 'presentation'
  }];

  this._super(config, parent);
}
});

export default Presentation;
