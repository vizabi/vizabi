import * as utils from 'base/utils';
import Component from 'base/component';
import Dialog from '../_dialog';

import { colorlegend, indicatorpicker } from 'components/_index'

/*!
 * VIZABI COLOR DIALOG
 */

var Colors = Dialog.extend({

  /**
   * Initializes the dialog component
   * @param config component configuration
   * @param context component context (parent)
   */
  init: function(config, parent) {
    this.name = 'colors';

    this.components = [{
      component: indicatorpicker,
      placeholder: '.vzb-caxis-selector',
      model: ["state.marker", "language"],
      markerID: "color"
    }, {
      component: colorlegend,
      placeholder: '.vzb-clegend-container',
      model: ["state.marker.color", "state.entities", "language"]
    }];


    this._super(config, parent);
  }

});

export default Colors;