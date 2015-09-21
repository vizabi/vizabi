/*!
 * VIZABI BUBBLECHART
 */

(function () {

  "use strict";

  var Vizabi = this.Vizabi;
  var utils = Vizabi.utils;

  //warn client if d3 is not defined
  if (!Vizabi._require('d3')) return;


  //BUBBLE CHART TOOL
  Vizabi.Tool.extend('BubbleChart', {

    /**
     * Initializes the tool (Bubble Chart Tool).
     * Executed once before any template is rendered.
     * @param {Object} config Initial config, with name and placeholder
     * @param {Object} options Options such as state, data, etc
     */
    init: function (config, options) {

      this.name = "bubblechart";

      //specifying components
      this.components = [{
        component: 'gapminder-bubblechart',
        placeholder: '.vzb-tool-viz',
        model: ["state.time", "state.entities", "state.marker", "language"] //pass models to component
      }, {
        component: 'gapminder-timeslider',
        placeholder: '.vzb-tool-timeslider',
        model: ["state.time"]
      }, {
        component: 'gapminder-buttonlist',
        placeholder: '.vzb-tool-buttonlist',
        model: ['state', 'ui', 'language']
      },{
        component: 'gapminder-treemenu',
        placeholder: '.vzb-tool-treemenu',
        model: ['state.marker', 'language']
      }];

      this._super(config, options);

    }
  });


}).call(this);
