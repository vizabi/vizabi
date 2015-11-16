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
      name: "marker",
      type: "model"
    }, {
      name: "language",
      type: "language"
    }];
      
    this.markerID = config.markerID;
    if(!config.markerID) utils.warn("indicatorpicker.js complains on 'markerID' property: " + config.markerID);

    this.model_binds = {};
    this.model_binds["change:language:strings"] = function(evt) {
        _this.updateView();
    };
    this.model_binds["change:marker:"+this.markerID] = function(evt) {
        _this.updateView();
    };
      

    //contructor is the same as any component
    this._super(config, context);

    this.ui = utils.extend({
      selectIndicator: true,
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
      
    this.el_select = this.element.select('.vzb-ip-select');
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
      
      

    this.el_select.on("click", function() {
        _this.root.findChildByName("gapminder-treemenu")
          .markerID(_this.markerID)
          .alignX("left")
          .alignY("top")
          .updateView()
          .toggle();
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




    //hide if so requested by the UI setings
    this.el_select
      .style('display', this.ui.selectIndicator ? "auto" : "none")
      .text(this.translator("indicator/" + this.model.marker[this.markerID][INDICATOR]));

    this.el_domain_minmaxbreak.classed('vzb-hidden', !(this.ui.selectIndicator && (this.ui.selectMinMax || this.ui.selectFakeMinMax)));
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
    this.el_domain_fieldMin.property("value", formatter(this.model.marker[this.markerID].getScale().domain()[0]));
    this.el_domain_fieldMax.property("value", formatter(this.model.marker[this.markerID].getScale().domain()[1]));
      
    this.el_fake_fieldMin.property("value", formatter(this.model.marker[this.markerID].fakeMin));
    this.el_fake_fieldMax.property("value", formatter(this.model.marker[this.markerID].fakeMax));
  },

  _setModel: function(what, value) {

    var indicatorsDB = globals.metadata.indicatorsDB;

    if([MIN, MAX, FAKEMIN, FAKEMAX].indexOf(what)>-1) value = utils.strToFloat(value);

    var mdl = this.model.marker[this.markerID];

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