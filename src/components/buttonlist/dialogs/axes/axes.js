import utils from '../../../../base/utils';
import Component from '../../../../base/component';
import Dialog from '../_dialog';

/*
 * Axes dialog
 */

var Axes = Component.register('gapminder-buttonlist-axes', Dialog.extend({

  /**
   * Initializes the dialog component
   * @param config component configuration
   * @param context component context (parent)
   */
  init: function(config, parent) {
    this.name = 'axes';
    var _this = this;

    this.components = [{
      component: 'gapminder-indicatorpicker',
      placeholder: '.vzb-xaxis-container',
      model: ["state.marker.axis_x", "language"]
    }, {
      component: 'gapminder-indicatorpicker',
      placeholder: '.vzb-yaxis-container',
      model: ["state.marker.axis_y", "language"]
    }, {
      component: 'gapminder-simplecheckbox',
      placeholder: '.vzb-axes-options',
      model: ["state", "language"],
      submodel: 'time',
      checkbox: 'adaptMinMaxZoom'
    }];

    this._super(config, parent);
  }
}));

export default Axes;