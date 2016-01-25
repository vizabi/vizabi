import * as utils from 'base/utils';
import Component from 'base/component';
import Dialog from '../_dialog';

import { indicatorpicker, minmaxinputs, simplecheckbox } from 'components/_index';

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
      placeholder: '.vzb-xaxis-selector',
      model: ["state.marker", "language"],
      markerID: "axis_x"
    },{
      component: minmaxinputs,
      placeholder: '.vzb-xaxis-minmax',
      model: ["state.marker", "language"],
      markerID: "axis_x",
      ui: {
        selectMinMax: false,
        selectZoomedMinMax: true
      }
    }, {
      component: indicatorpicker,
      placeholder: '.vzb-yaxis-selector',
      model: ["state.marker", "language"],
      markerID: "axis_y"
    }, {
      component: minmaxinputs,
      placeholder: '.vzb-yaxis-minmax',
      model: ["state.marker", "language"],
      markerID: "axis_y",
      ui: {
        selectMinMax: false,
        selectZoomedMinMax: true
      }
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