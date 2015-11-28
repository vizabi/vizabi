import * as utils from 'base/utils';
import globals from 'base/globals';
import Component from 'base/component';

/*!
 * VIZABI MIN MAX INPUT FIELDS
 */

var MIN = "min";
var MAX = "max";
var FAKEMIN = "fakeMin";
var FAKEMAX = "fakeMax";

var MinMaxInputs = Component.extend({

    /**
     * Initializes the Component.
     * Executed once before any template is rendered.
     * @param config The options passed to the component
     * @param context The component's parent
     */
    init: function(config, context) {

        this.name = 'gapminder-minmaxinputs';
        this.template = 'minmaxinputs.html';

        var _this = this;

        this.model_expects = [{
            name: "marker",
            type: "model"
        }, {
            name: "language",
            type: "language"
        }];

        this.markerID = config.markerID;
        if(!config.markerID) utils.warn("minmaxinputs.js complains on 'markerID' property: " + config.markerID);

        this.model_binds = {};
        this.model_binds["change:language:strings"] = function(evt) {
            _this.updateView();
        };
        this.model_binds["change:marker:" + this.markerID] = function(evt) {
            _this.updateView();
        };
        this.model_binds["ready"] = function(evt) {
            _this.updateView();
        };

        //contructor is the same as any component
        this._super(config, context);

        this.ui = utils.extend({
            selectMinMax: false,
            selectFakeMinMax: false
        }, this.ui.getObject());

    },

    ready: function() {
        this.updateView();
    },

    readyOnce: function() {
        var _this = this;

        this.element = d3.select(this.element);

        this.el_domain_labelMin = this.element.select('.vzb-mmi-domainmin-label');
        this.el_domain_labelMax = this.element.select('.vzb-mmi-domainmax-label');
        this.el_domain_fieldMin = this.element.select('.vzb-mmi-domainmin');
        this.el_domain_fieldMax = this.element.select('.vzb-mmi-domainmax');

        this.el_break = this.element.select('.vzb-mmi-break');
        
        this.el_fake_labelMin = this.element.select('.vzb-mmi-fakemin-label');
        this.el_fake_labelMax = this.element.select('.vzb-mmi-fakemax-label');
        this.el_fake_fieldMin = this.element.select('.vzb-mmi-fakemin');
        this.el_fake_fieldMax = this.element.select('.vzb-mmi-fakemax');


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

        this.el_domain_labelMin.classed('vzb-hidden', !this.ui.selectMinMax);
        this.el_domain_labelMax.classed('vzb-hidden', !this.ui.selectMinMax);
        this.el_domain_fieldMin.classed('vzb-hidden', !this.ui.selectMinMax);
        this.el_domain_fieldMax.classed('vzb-hidden', !this.ui.selectMinMax);

        this.el_break.classed('vzb-hidden', !(this.ui.selectMinMax && this.ui.selectFakeMinMax));

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
        this.model.marker[this.markerID][what] = utils.strToFloat(value);
    }

});

export default MinMaxInputs;