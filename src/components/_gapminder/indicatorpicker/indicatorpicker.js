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
    var MIN = "min";
    var MAX = "max";
    var SCALETYPE = "scaleType";
    var MODELTYPE_COLOR = "color";

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) {
        return;
    }

    var availOpts = {
        'geo.region': {use: 'property',unit: '',scales: ['ordinal'] },
        'geo': {use: 'property',unit: '',scales: ['ordinal'] },
        'time': {use: 'indicator',unit: 'time',scales: ['time'] },
        'childSurv': {use: 'indicator',unit: 'childSurv',scales: ['linear', 'log'] },
        'gdp_per_cap': {use: 'indicator',unit: 'gdp_per_cap',scales: ['log', 'linear'] },
        'pop': {use: 'indicator',unit: '',scales: ['linear', 'log'] },
        'geo.name': {use: 'property',unit: '',scales: ['ordinal'] },
        'u5mr': {use: 'indicator',unit: 'u5mr',scales: ['linear', 'log'] },
        'size': {use: 'property',unit: '',scales: ['ordinal'] },
        'gini': {use: 'indicator',unit: 'gini',scales: ['linear'] },
        'gdppc_pday':{use: 'indicator',unit: 'gdppc_pday',scales: ['log', 'linear'] },
        'inc_pday':{use: 'indicator',unit: 'inc_pday',scales:['log', 'linear'] },
        '_default': {use: 'value',unit: '',scales: ['linear', 'log'] }
    };

    Vizabi.Component.extend('gapminder-indicatorpicker', {

        /**
         * Initializes the Indicator Picker.
         * Executed once before any template is rendered.
         * @param config The options passed to the component
         * @param context The component's parent
         */
        init: function (config, context) {

            this.template = '<span class="vzb-ip-holder"><select class="vzb-ip-indicator"></select><select class="vzb-ip-scaletype"></select><br/><span class="vzb-ip-domainmin-label"></span> <input type="text" class="vzb-ip-domainmin" name="min"> <span class="vzb-ip-domainmax-label"></span> <input type="text" class="vzb-ip-domainmax" name="max">';
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
            };

            //contructor is the same as any component
            this._super(config, context);

            this.ui = utils.extend({
                selectIndicator: true,
                selectScaletype: true,
                selectMinMax: false
            }, this.ui.getObject());

        },

        ready: function () {
            this.updateView();
        },

        readyOnce: function () {
            var _this = this;

            this.element = d3.select(this.element);
            this.el_select_indicator = this.element.select('.vzb-ip-indicator');
            this.el_select_scaletype = this.element.select('.vzb-ip-scaletype');

            this.el_domain_labelMin = this.element.select('.vzb-ip-domainmin-label');
            this.el_domain_labelMax = this.element.select('.vzb-ip-domainmax-label');
            this.el_domain_fieldMin = this.element.select('.vzb-ip-domainmin');
            this.el_domain_fieldMax = this.element.select('.vzb-ip-domainmax');

            this.el_select_indicator.on("change", function() { _this._setModel(INDICATOR, this.value)});
            this.el_select_scaletype.on("change", function() { _this._setModel(SCALETYPE, this.value)});

            _this.el_domain_fieldMin.on("change", function(){_this._setModel(MIN, this.value)});
            _this.el_domain_fieldMax.on("change", function(){_this._setModel(MAX, this.value)});
        },

        updateView: function () {
            var _this = this;
            this.translator = this.model.language.getTFunction();

            this.el_domain_labelMin.text(this.translator("min") + ":");
            this.el_domain_labelMax.text(this.translator("max") + ":");

            var pointer = "_default";

            var data = {};
            data[INDICATOR] = Object.keys(availOpts);

            if (data[INDICATOR].indexOf(this.model.axis[INDICATOR]) > -1) pointer = this.model.axis[INDICATOR];

            data[SCALETYPE] = availOpts[pointer].scales;

            //bind the data to the selector lists
            var elOptionsIndicator = this.el_select_indicator.selectAll("option")
                .data(data[INDICATOR], function (d) {return d});
            var elOptionsScaletype = this.el_select_scaletype.selectAll("option")
                .data(data[SCALETYPE], function (d) {return d});

            //remove irrelevant options
            elOptionsIndicator.exit().remove();
            elOptionsScaletype.exit().remove();

            //populate options into the list
            elOptionsIndicator.enter().append("option").attr("value", function (d) {return d});
            elOptionsScaletype.enter().append("option").attr("value", function (d) {return d});

            //show translated UI string
            elOptionsIndicator.text(function (d) { return _this.translator("indicator/" + d) });
            elOptionsScaletype.text(function (d) { return _this.translator("scaletype/" + d) });

            //set the selected option
            this.el_select_indicator[0][0].value = this.model.axis[INDICATOR];
            this.el_select_scaletype[0][0].value = this.model.axis[SCALETYPE];

            //disable the selector in case if there is only one option, hide if so requested by the UI setings
            this.el_select_indicator
                .style('display', this.ui.selectIndicator ? "auto" : "none")
                .attr('disabled', data[INDICATOR].length <= 1 ? "true" : null);
            this.el_select_scaletype
                .style('display', this.ui.selectScaletype ? "auto" : "none")
                .attr('disabled', data[SCALETYPE].length <= 1 ? "true" : null);

            this.el_domain_labelMin.style('display', this.ui.selectMinMax ? "auto" : "none");
            this.el_domain_labelMax.style('display', this.ui.selectMinMax ? "auto" : "none");
            this.el_domain_fieldMin.style('display', this.ui.selectMinMax ? "auto" : "none");
            this.el_domain_fieldMax.style('display', this.ui.selectMinMax ? "auto" : "none");

            var formatter = d3.format(".2r");
            this.el_domain_fieldMin.property("value", formatter(this.model.axis.getScale().domain()[0]));
            this.el_domain_fieldMax.property("value", formatter(this.model.axis.getScale().domain()[1]));
        },

        _setModel: function (what, value) {
            if(what==MIN || what==MAX) value = utils.strToFloat(value);

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
