/*
 * More options dialog
 */

(function () {

  "use strict";

  var Vizabi = this.Vizabi;
  var Dialog = Vizabi.Component.get('gapminder-buttonlist-dialog');


  Vizabi.Component.register('gapminder-buttonlist-moreoptions', Dialog.extend({

    /**
     * Initializes the dialog component
     * @param config component configuration
     * @param context component context (parent)
     */
    init: function (config, parent) {
      this.name = 'moreoptions';

      this.components = [{
        component: 'gapminder-indicatorpicker',
        placeholder: '.vzb-xaxis-container',
        model: ["state.marker.axis_x", "language"],          
        ui: {selectMinMax: true}
      }, {
        component: 'gapminder-indicatorpicker',
        placeholder: '.vzb-yaxis-container',
        model: ["state.marker.axis_y", "language"],          
        ui: {selectMinMax: true}
      }, {
        component: 'gapminder-simplecheckbox',
        placeholder: '.vzb-axes-options',
        model: ["state", "language"],
        submodel: 'time',
        checkbox: 'adaptMinMaxZoom'
      }, {
        component: 'gapminder-bubblesize',
        placeholder: '.vzb-dialog-bubblesize-min',
        model: ["state.marker.size"],
        field: 'min'
      }, {
        component: 'gapminder-bubblesize',
        placeholder: '.vzb-dialog-bubblesize-max',
        model: ["state.marker.size"],
        field: 'max'
      }, {
        component: 'gapminder-indicatorpicker',
        placeholder: '.vzb-saxis-container',
        model: ["state.marker.size", "language"]
      }, {
        component: 'gapminder-indicatorpicker',
        placeholder: '.vzb-caxis-container',
        model: ["state.marker.color", "language"]
      }, {
        component: 'gapminder-colorlegend',
        placeholder: '.vzb-clegend-container',
        model: ["state.marker.color", "state.entities", "language"]
      }, {
        component: 'gapminder-bubbleopacity',
        placeholder: '.vzb-dialog-bubbleopacity-regular',
        model: ["state.entities"],
        arg: "opacityRegular"
      }, {
        component: 'gapminder-bubbleopacity',
        placeholder: '.vzb-dialog-bubbleopacity-selectdim',
        model: ["state.entities"],
        arg: "opacitySelectDim"
      }];

      this._super(config, parent);
    },

    readyOnce: function () {
      this.element = d3.select(this.element);
      this.resize();
    },

    resize: function () {
      var totalHeight = this.root.element.offsetHeight - 200;
      var content = this.element.select('.vzb-dialog-content');
      content.style('max-height', totalHeight + 'px');
    }
  }));

}).call(this);
