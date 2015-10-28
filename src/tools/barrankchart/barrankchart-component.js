import * as utils from 'base/utils';
import Component from 'base/component';


/*!
 * VIZABI POP BY AGE Component
 */


//POP BY AGE CHART COMPONENT
var BarRankChart = Component.extend({

  /**
   * Initializes the component (Bar Chart).
   * Executed once before any template is rendered.
   * @param {Object} config The options passed to the component
   * @param {Object} context The component's parent
   */
  init: function(config, context) {

    this.name = 'barrankchart';
    this.template = 'barrank.html';

    //define expected models for this component
    this.model_expects = [{
      name: "time",
      type: "time"
    }, {
      name: "entities",
      type: "entities"
    }, {
      name: "marker",
      type: "model"
    }, {
      name: "language",
      type: "language"
    }, {
      name: "ui",
      type: "model"
    }];

    var _this = this;
    this.model_binds = {
      "change:time:value": function(evt) {
        _this.onTimeChange();
      }
    };

    //contructor is the same as any component
    this._super(config, context);

  },

  _onTimeChange: function() {

  },

  /**
   * DOM and model are ready
   */
  readyOnce: function() {


  },

  /*
   * Both model and DOM are ready
   */
  ready: function() {

  }

});

export default BarRankChart;