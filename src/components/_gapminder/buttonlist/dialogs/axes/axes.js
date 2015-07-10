/*
 * Axes dialog
 */

(function () {

  "use strict";

  var Vizabi = this.Vizabi;
  var Dialog = Vizabi.Component.get('gapminder-buttonlist-dialog');


  Vizabi.Component.register('gapminder-buttonlist-axes', Dialog.extend({

    /**
     * Initializes the dialog component
     * @param config component configuration
     * @param context component context (parent)
     */
    init: function (config, parent) {
      this.name = 'axes';
      var _this = this;

      this.components = [{
        component: 'gapminder-indicatorpicker',
        placeholder: '.vzb-xaxis-container',
        model: ["state.marker.axis_x", "language"],
        ui: { markerName: "markerNames/axis_x"}
      }, {
        component: 'gapminder-indicatorpicker',
        placeholder: '.vzb-yaxis-container',
        model: ["state.marker.axis_y", "language"],
        ui: { markerName: "markerNames/axis_y"}
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

}).call(this);

