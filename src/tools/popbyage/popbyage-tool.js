/*!
 * VIZABI BARCHART
 */

(function () {

  "use strict";

  var Vizabi = this.Vizabi;
  var utils = Vizabi.utils;

  //warn client if d3 is not defined
  if (!Vizabi._require('d3')) return;

  //BAR CHART TOOL
  var PopByAge = Vizabi.Tool.extend('PopByAge', {

    /**
     * Initializes the tool (Bar Chart Tool).
     * Executed once before any template is rendered.
     * @param {Object} config Initial config, with name and placeholder
     * @param {Object} options Options such as state, data, etc
     */
    init: function (config, options) {

      this.name = "popbyage";

      //specifying components
      this.components = [{
        component: 'gapminder-popbyage',
        placeholder: '.vzb-tool-viz',
        model: ["state.time", "state.entities", "state.entities_age", "state.marker", "language"] //pass models to component
      }, {
        component: 'gapminder-timeslider',
        placeholder: '.vzb-tool-timeslider',
        model: ["state.time"]
      }, {
        component: 'gapminder-buttonlist',
        placeholder: '.vzb-tool-buttonlist',
        model: ['state', 'ui', 'language']
      }];

      //constructor is the same as any tool
      this._super(config, options);
    },

    /**
     * Validating the tool model
     * @param model the current tool model to be validated
     */
    validate: function (model) {

      model = this.model || model;

      var time = model.state.time;
      var marker = model.state.marker.label;

      //don't validate anything if data hasn't been loaded
      if (!marker.getKeys() || marker.getKeys().length < 1) {
        return;
      }

      var dateMin = marker.getLimits(time.getDimension()).min;
      var dateMax = marker.getLimits(time.getDimension()).max;

      if (time.start < dateMin) {
        time.start = dateMin;
      }
      if (time.end > dateMax) {
        time.end = dateMax;
      }
    }
  });


}).call(this);
