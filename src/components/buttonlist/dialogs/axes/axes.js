import * as utils from 'base/utils';
import Component from 'base/component';
import Dialog from '../_dialog';

import { indicatorpicker,simplecheckbox } from 'components/_index';

/*
 * Axes dialog
 */

var Axes = Dialog.extend({

  /**
   * Initializes the dialog component
   * @param config component configuration
   * @param context component context (parent)
   */
  init: function(config, parent) {
    this.name = 'axes';
    var _this = this;

    this.components = [{
      component: indicatorpicker,
      placeholder: '.vzb-xaxis-container',
      model: ["state.marker.axis_x", "language"]
    }, {
      component: indicatorpicker,
      placeholder: '.vzb-yaxis-container',
      model: ["state.marker.axis_y", "language"]
    }, {
      component: simplecheckbox,
      placeholder: '.vzb-axes-options',
      model: ["state", "language"],
      submodel: 'time',
      checkbox: 'adaptMinMaxZoom'
    }];

    this._super(config, parent);
  }
});

export default Axes;