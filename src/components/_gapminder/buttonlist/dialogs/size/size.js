/*
 * Size dialog
 */

(function () {

  "use strict";

  var Vizabi = this.Vizabi;
  var Dialog = Vizabi.Component.get('gapminder-buttonlist-dialog');

  Vizabi.Component.register('gapminder-buttonlist-size', Dialog.extend({

    /**
     * Initializes the dialog component
     * @param config component configuration
     * @param context component context (parent)
     */
    init: function (config, parent) {
      this.name = 'size';

      // in dialog, this.model_expects = ["state", "data"];

      this.components = [{
        component: 'gapminder-bubblesize',
        placeholder: '.vzb-dialog-bubblesize',
        model: ["state.marker.size"],
        ui: {
          show_button: false
        }
      }, {
        component: 'gapminder-indicatorpicker',
        placeholder: '.vzb-saxis-container',
        model: ["state.marker.size", "language"],
        ui: {selectIndicator: true, selectScaletype: false}
      }];

      this._super(config, parent);
    }
  }));

}).call(this);
