import * as utils from 'base/utils';
import Component from 'base/component';
import Dialog from 'components/dialogs/_dialog';

import indicatorpicker from 'components/indicatorpicker/indicatorpicker';
import minmaxinputs from 'components/minmaxinputs/minmaxinputs';

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
      model: ["state.time", "state.entities", "state.marker", "locale"],
      markerID: "axis_x"
    },{
      component: minmaxinputs,
      placeholder: '.vzb-xaxis-minmax',
      model: ["state.marker", "state.time", "locale"],
      markerID: "axis_x",
      ui: {
        selectDomainMinMax: false,
        selectZoomedMinMax: true
      }
    }, {
      component: indicatorpicker,
      placeholder: '.vzb-yaxis-selector',
      model: ["state.time", "state.entities", "state.marker", "locale"],
      markerID: "axis_y"
    }, {
      component: minmaxinputs,
      placeholder: '.vzb-yaxis-minmax',
      model: ["state.marker", "state.time", "locale"],
      markerID: "axis_y",
      ui: {
        selectDomainMinMax: false,
        selectZoomedMinMax: true
      }
    }];

    this._super(config, parent);
  }
});

export default Axes;
