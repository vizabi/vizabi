import * as utils from 'base/utils';
import Component from 'base/component';
import Dialog from '../_dialog';

import { zoombuttonlist, simplecheckbox } from 'components/_index'


/*
 * Zoom dialog
 */

var Zoom = Dialog.extend({

/**
 * Initializes the dialog component
 * @param config component configuration
 * @param context component context (parent)
 */
init: function(config, parent) {
  this.name = 'zoom';

  // in dialog, this.model_expects = ["state", "data"];

  this.components = [{
    component: zoombuttonlist,
    placeholder: '.vzb-dialog-zoom-buttonlist',
    model: ["state", "ui", "language"]
  }, {
    component: simplecheckbox,
    placeholder: '.vzb-zoomonscrolling-switch',
    model: ["ui", "language"],
    checkbox: 'zoomOnScrolling'
  }, {
    component: simplecheckbox,
    placeholder: '.vzb-adaptminmaxzoom-switch',
    model: ["ui", "language"],
    checkbox: 'adaptMinMaxZoom'
  }];

  this._super(config, parent);
}
});

export default Zoom;