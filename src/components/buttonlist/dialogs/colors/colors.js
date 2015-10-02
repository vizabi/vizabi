import utils from '../../../../base/utils';
import Component from '../../../../base/component';
import Dialog from '../_dialog';

/*!
 * VIZABI COLOR DIALOG
 */

var Colors = Component.register('gapminder-buttonlist-colors', Dialog.extend({

  /**
   * Initializes the dialog component
   * @param config component configuration
   * @param context component context (parent)
   */
  init: function(config, parent) {
    this.name = 'colors';

    this.components = [{
      component: 'gapminder-indicatorpicker',
      placeholder: '.vzb-caxis-container',
      model: ["state.marker.color", "language"]
    }, {
      component: 'gapminder-colorlegend',
      placeholder: '.vzb-clegend-container',
      model: ["state.marker.color", "state.entities", "language"]
    }];


    this._super(config, parent);
  }

}));

export default Colors;