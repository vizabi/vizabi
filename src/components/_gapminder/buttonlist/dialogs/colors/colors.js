/*!
 * VIZABI COLOR DIALOG
 */

(function () {

  "use strict";

  var Vizabi = this.Vizabi;
  var utils = Vizabi.utils;
  var Dialog = Vizabi.Component.get('gapminder-buttonlist-dialog');

  if (!Vizabi._require('d3')) return;

  Vizabi.Component.register('gapminder-buttonlist-colors', Dialog.extend({

    /**
     * Initializes the dialog component
     * @param config component configuration
     * @param context component context (parent)
     */
    init: function (config, parent) {
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


}).call(this);
