/*!
 * VIZABI INDICATOR PICKER
 * Reusable indicator picker component
 */

(function () {

  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;

  var INDICATOR = "which";
  var SCALETYPE = "scaleType";
  var MODELTYPE_COLOR = "color";

  //warn client if d3 is not defined
  if (!Vizabi._require('d3')) {
    return;
  }

  var availOpts = {
    'geo.region': {use: 'property', unit: '', scales: ['ordinal']},
    'geo': {use: 'property', unit: '', scales: ['ordinal']},
    'time': {use: 'indicator', unit: 'time', scales: ['time']},
    'lex': {use: 'indicator', unit: 'lex', scales: ['linear']},
    'gdp_per_cap': {use: 'indicator', unit: 'gdp_per_cap', scales: ['log', 'linear']},
    'pop': {use: 'indicator', unit: '', scales: ['linear', 'log']},
    '_default': {use: 'value', unit: '', scales: ['linear', 'log']}
  };

  Vizabi.Component.extend('gapminder-indicatorpicker', {

    /**
     * Initializes the Indicator Picker.
     * Executed once before any template is rendered.
     * @param config The options passed to the component
     * @param context The component's parent
     */
    init: function (config, context) {

      this.template = '<span class="vzb-ip-holder"><select class="vzb-ip-indicator"></select><select class="vzb-ip-scaletype"></select></span>';
      var _this = this;

      this.model_expects = [{
        name: "axis"
        //TODO: learn how to expect model "axis" or "size" or "color"
      }, {
        name: "language",
        type: "language"
      }];

      this.model_binds = {
        "change:axis": function (evt) {
          _this.updateView();
        },
        "change:language": function (evt) {
          _this.updateView();
        }
      }

      //contructor is the same as any component
      this._super(config, context);

      this.ui = utils.extend({
        selectIndicator: true,
        selectScaletype: true,
        markerName: ""
      }, this.ui);

    },

    ready: function () {
      this.updateView();
    },

    readyOnce: function () {
      var _this = this;

      this.element = d3.select(this.element);
      this.el_select_indicator = this.element.select('.vzb-ip-indicator');
      this.el_select_scaletype = this.element.select('.vzb-ip-scaletype');

      this.el_select_indicator
        .on("change", function () {
          _this._setModel(INDICATOR, this.value)
        });

      this.el_select_scaletype
        .on("change", function () {
          _this._setModel(SCALETYPE, this.value)
        });
    },

    updateView: function () {
      var _this = this;
      this.translator = this.model.language.getTFunction();

      var pointer = "_default";

      var data = {};
      data[INDICATOR] = Object.keys(availOpts);

      if (data[INDICATOR].indexOf(this.model.axis[INDICATOR]) > -1) pointer = this.model.axis[INDICATOR];

      data[SCALETYPE] = availOpts[pointer].scales;

      //bind the data to the selector lists
      var elOptionsIndicator = this.el_select_indicator.selectAll("option")
        .data(data[INDICATOR], function (d) {
          return d
        });
      var elOptionsScaletype = this.el_select_scaletype.selectAll("option")
        .data(data[SCALETYPE], function (d) {
          return d
        });

      //remove irrelevant options
      elOptionsIndicator.exit().remove();
      elOptionsScaletype.exit().remove();

      //populate options into the list
      elOptionsIndicator.enter().append("option")
        .attr("value", function (d) {
          return d
        });
      elOptionsScaletype.enter().append("option")
        .attr("value", function (d) {
          return d
        });

      //show translated UI string
      elOptionsIndicator.text(function (d) {
        return _this.translator("indicator/" + d)
      })
      elOptionsScaletype.text(function (d) {
        return _this.translator("scaletype/" + d)
      })

      //set the selected option
      this.el_select_indicator[0][0].value = this.model.axis[INDICATOR];
      this.el_select_scaletype[0][0].value = this.model.axis[SCALETYPE];

      //disable the selector in case if there is only one option, hide if so requested by the UI setings
      this.el_select_indicator
        .style('display', this.ui.selectIndicator ? "auto" : "none")
        .attr('disabled', data[INDICATOR].length <= 1 ? "true" : null)
      this.el_select_scaletype
        .style('display', this.ui.selectScaletype ? "auto" : "none")
        .attr('disabled', data[SCALETYPE].length <= 1 ? "true" : null)
    },

    _setModel: function (what, value) {

      var mdl = this.model.axis;

      var obj = {};
      obj[what] = value;

      if (what == INDICATOR) {
        obj.use = availOpts[value].use;
        obj.unit = availOpts[value].unit;

        if (availOpts[value].scales.indexOf(mdl.scaleType) == -1) {
          obj.scaleType = availOpts[value].scales[0];
        }
      }

      mdl.set(obj);
    }

  });

}).call(this);
