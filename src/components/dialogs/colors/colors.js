import * as utils from 'base/utils';
import Component from 'base/component';
import Dialog from 'components/dialogs/_dialog';

import colorlegend from 'components/colorlegend/colorlegend';
import indicatorpicker from 'components/indicatorpicker/indicatorpicker';

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
      model: ["state.time", "state.entities", "state.marker", "locale"],
      markerID: "color",
      showHoverValues: true
    }, {
      component: colorlegend,
      placeholder: '.vzb-clegend-container',
      model: ["state.time", "state.entities", "state.marker", "locale"]
    }];


    this._super(config, parent);
  }

});

export default Colors;
