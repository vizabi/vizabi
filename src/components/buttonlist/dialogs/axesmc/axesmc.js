import * as utils from 'base/utils';
import Component from 'base/component';
import Dialog from '../_dialog';

import { indicatorpicker } from 'components/_index'
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
    this.name = 'axesmc'; 
    var _this = this;

    this.model_binds = {
      'change:state:time:xLogStops': function() {
        _this.updateView();
      },
      'change:state:time:yMaxMethod': function() {
        _this.updateView();
      },
      'change:state:time:probe': function() {
        _this.updateView();
      }
    };

    this.components = [{
      component: indicatorpicker,
      placeholder: '.vzb-xlimits-container',
      model: ["state.marker.axis_x", "language"],
      ui: {
        selectIndicator: false,
        selectScaletype: false,
        selectMinMax: false,
        selectFakeMinMax: true 
      }
    }]


    this._super(config, parent);
  },

  readyOnce: function() {
    var _this = this;
    this.element = d3.select(this.element);

    this.yMaxRadio = this.element.select('.vzb-yaxis-container').selectAll('input')
      .on("change", function() {
        _this.setModel("yMaxMethod", d3.select(this).node().value);
      })

    this.xLogStops = this.element.select('.vzb-xaxis-container').selectAll('input')
      .on("change", function() {
        _this.setModel("xLogStops", d3.select(this).node().value);
      })

    this.probeFieldEl = this.element.select(".vzb-probe-field")
      .on("change", function() {
        var result = parseFloat(this.value.replace(",", "."));
        if(result <= _this.model.state.time.tailCutX) {
          this.value = _this.model.state.time.probeX;
          return;
        }
        _this.setModel("probeX", result);
      });

    this.updateView();

    this._super();
  },

  updateView: function() {
    var _this = this;

    this.yMaxRadio.property('checked', function() {
      return d3.select(this).node().value === _this.model.state.time.yMaxMethod;
    })
    this.xLogStops.property('checked', function() {
      return _this.model.state.time.xLogStops.indexOf(+d3.select(this).node().value) !== -1;
    })
    this.probeFieldEl.property("value", this.model.state.time.probeX);
  },

  setModel: function(what, value) {
    var result;

    if(what == "yMaxMethod") {
      result = value;
    }
    if(what == "xLogStops") {
      result = [];
      this.xLogStops.each(function() {
        if(d3.select(this).property('checked')) result.push(+d3.select(this).node().value);
      })
    }
    if(what == "probeX") {
      result = value;
    }

    this.model.state.time[what] = result;
  }
});

export default Axes;