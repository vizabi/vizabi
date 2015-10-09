import * as utils from 'base/utils';
import globals from 'base/globals';
import Component from 'base/component';

/*!
 * VIZABI INDICATOR PICKER
 * Reusable indicator picker component
 */

var INDICATOR = "which";
var MIN = "min";
var MAX = "max";
var FAKEMIN = "fakeMin";
var FAKEMAX = "fakeMax";
var SCALETYPE = "scaleType";
var MODELTYPE_COLOR = "color";

var IndPicker = Component.extend({

  /**
   * Initializes the Indicator Picker.
   * Executed once before any template is rendered.
   * @param config The options passed to the component
   * @param context The component's parent
   */
  init: function(config, context) {

    this.name = 'gapminder-indicatorpicker';
    this.template = 'indicatorpicker.html';
      
    var _this = this;

    this.model_expects = [{
      name: "axis"
        //TODO: learn how to expect model "axis" or "size" or "color"
    }, {
      name: "language",
      type: "language"
    }];

    this.model_binds = {
      "change:axis": function(evt) {
        _this.updateView();
      },
      "change:language": function(evt) {
        _this.updateView();
      }
    };

    //contructor is the same as any component
    this._super(config, context);

    this.ui = utils.extend({
      selectIndicator: true,
      selectScaletype: true,
      selectMinMax: false,
      selectFakeMinMax: false
    }, this.ui.getObject());

  },

  ready: function() {
    this.updateView();
  },

  afterPreload: function() {
  },

  readyOnce: function() {
    var _this = this;

    this.element = d3.select(this.element);
    this.el_select_indicator = this.element.select('.vzb-ip-indicator');
    this.el_select_scaletype = this.element.select('.vzb-ip-scaletype');

    this.el_domain_minmaxbreak = this.element.select('.vzb-ip-minmax-break');
    this.el_domain_labelMin = this.element.select('.vzb-ip-domainmin-label');
    this.el_domain_labelMax = this.element.select('.vzb-ip-domainmax-label');
    this.el_domain_fieldMin = this.element.select('.vzb-ip-domainmin');
    this.el_domain_fieldMax = this.element.select('.vzb-ip-domainmax');

    this.el_fake_minmaxbreak = this.element.select('.vzb-ip-fakeminmax-break');
    this.el_fake_labelMin = this.element.select('.vzb-ip-fakemin-label');
    this.el_fake_labelMax = this.element.select('.vzb-ip-fakemax-label');
    this.el_fake_fieldMin = this.element.select('.vzb-ip-fakemin');
    this.el_fake_fieldMax = this.element.select('.vzb-ip-fakemax');

    this.el_select_indicator.on("change", function() {
      _this._setModel(INDICATOR, this.value)
    });
    this.el_select_scaletype.on("change", function() {
      _this._setModel(SCALETYPE, this.value)
    });

    _this.el_domain_fieldMin.on("change", function() {
      _this._setModel(MIN, this.value)
    });
    _this.el_domain_fieldMax.on("change", function() {
      _this._setModel(MAX, this.value)
    });
      
    _this.el_fake_fieldMin.on("change", function() {
      _this._setModel(FAKEMIN, this.value)
    });
    _this.el_fake_fieldMax.on("change", function() {
      _this._setModel(FAKEMAX, this.value)
    });
  },

  updateView: function() {
    var _this = this;
    this.translator = this.model.language.getTFunction();

    this.el_domain_labelMin.text(this.translator("min") + ":");
    this.el_domain_labelMax.text(this.translator("max") + ":");
    this.el_fake_labelMin.text(this.translator("min") + ":");
    this.el_fake_labelMax.text(this.translator("max") + ":");

    var indicatorsDB = globals.metadata.indicatorsDB;
    var indicatorsArray = globals.metadata.indicatorsArray;
    var pointer = "_default";
    var data = {};

    data[INDICATOR] = indicatorsArray
      .filter(function(f) {

        //keep indicator if nothing is specified in tool properties
        if(!_this.model.axis.allow || !_this.model.axis.allow.scales) return true;
        //keep indicator if any scale is allowed in tool properties
        if(_this.model.axis.allow.scales[0] == "*") return true;

        //check if there is an intersection between the allowed tool scale types and the ones of indicator
        for(var i = indicatorsDB[f].scales.length - 1; i >= 0; i--) {
          //if (f.scales[i] == _this.model.axis.scaleType) return true;
          if(_this.model.axis.allow.scales.indexOf(indicatorsDB[f].scales[i]) > -1) return true;
        }

        return false;
      });



    if(data[INDICATOR].indexOf(this.model.axis[INDICATOR]) > -1) pointer = this.model.axis[INDICATOR];

    data[SCALETYPE] = indicatorsDB[pointer].scales.filter(function(f) {
      if(!_this.model.axis.allow || !_this.model.axis.allow.scales) return true;
      if(_this.model.axis.allow.scales[0] == "*") return true;
      return _this.model.axis.allow.scales.indexOf(f) > -1;
    });

    //bind the data to the selector lists
    var elOptionsIndicator = this.el_select_indicator.selectAll("option")
      .data(data[INDICATOR], function(d) {
        return d
      });
    var elOptionsScaletype = this.el_select_scaletype.selectAll("option")
      .data(data[SCALETYPE], function(d) {
        return d
      });

    //remove irrelevant options
    elOptionsIndicator.exit().remove();
    elOptionsScaletype.exit().remove();

    //populate options into the list
    elOptionsIndicator.enter().append("option").attr("value", function(d) { return d; });
    elOptionsScaletype.enter().append("option").attr("value", function(d) { return d; });

    //show translated UI string
    elOptionsIndicator.text(function(d) { return _this.translator("indicator/" + d); });
    elOptionsScaletype.text(function(d) { return _this.translator("scaletype/" + d); });

    //set the selected option
    this.el_select_indicator[0][0].value = this.model.axis[INDICATOR];
    this.el_select_scaletype[0][0].value = this.model.axis[SCALETYPE];

    //disable the selector in case if there is only one option, hide if so requested by the UI setings
    this.el_select_indicator
      .style('display', this.ui.selectIndicator ? "auto" : "none")
      .attr('disabled', data[INDICATOR].length <= 1 ? "true" : null);

    this.el_select_scaletype
      .style('display', data[SCALETYPE].length == 0 || this.model.axis.use !== "indicator" ? "none" : "inline")
      .style('display', this.ui.selectScaletype ? "auto" : "none")
      .attr('disabled', data[SCALETYPE].length <= 1 ? "true" : null);

    this.el_domain_minmaxbreak.classed('vzb-hidden', !(this.ui.selectIndicator || this.ui.selectScaletype && this.ui.selectMinMax || this.ui.selectFakeMinMax));
    this.el_domain_labelMin.classed('vzb-hidden', !this.ui.selectMinMax);
    this.el_domain_labelMax.classed('vzb-hidden', !this.ui.selectMinMax);
    this.el_domain_fieldMin.classed('vzb-hidden', !this.ui.selectMinMax);
    this.el_domain_fieldMax.classed('vzb-hidden', !this.ui.selectMinMax);
      
    this.el_fake_minmaxbreak.classed('vzb-hidden', !(this.ui.selectMinMax && this.ui.selectFakeMinMax));
    this.el_fake_labelMin.classed('vzb-hidden', !this.ui.selectFakeMinMax);
    this.el_fake_labelMax.classed('vzb-hidden', !this.ui.selectFakeMinMax);
    this.el_fake_fieldMin.classed('vzb-hidden', !this.ui.selectFakeMinMax);
    this.el_fake_fieldMax.classed('vzb-hidden', !this.ui.selectFakeMinMax);

    var formatter = d3.format(".2r");
    this.el_domain_fieldMin.property("value", formatter(this.model.axis.getScale().domain()[0]));
    this.el_domain_fieldMax.property("value", formatter(this.model.axis.getScale().domain()[1]));
      
    this.el_fake_fieldMin.property("value", formatter(this.model.axis.fakeMin));
    this.el_fake_fieldMax.property("value", formatter(this.model.axis.fakeMax));
  },

  _setModel: function(what, value) {

    var indicatorsDB = globals.metadata.indicatorsDB;

    if([MIN, MAX, FAKEMIN, FAKEMAX].indexOf(what)>-1) value = utils.strToFloat(value);

    var mdl = this.model.axis;

    var obj = {};
    obj[what] = value;

    if(what == INDICATOR) {
      obj.use = indicatorsDB[value].use;

      if(indicatorsDB[value].scales.indexOf(mdl.scaleType) == -1) {
        obj.scaleType = indicatorsDB[value].scales[0];
      }
    }

    if(what == INDICATOR || what == SCALETYPE) {
      if(mdl.getType() == 'axis') {
        obj.min = null;
        obj.max = null;
        obj.fakeMin = null;
        obj.fakeMax = null;
      }
    }

    mdl.set(obj);
  }

});

export default IndPicker;