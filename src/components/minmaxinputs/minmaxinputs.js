import * as utils from "base/utils";
import Component from "base/component";

/*!
 * VIZABI MIN MAX INPUT FIELDS
 */

const DOMAINMIN = "domainMin";
const DOMAINMAX = "domainMax";
const ZOOMEDMIN = "zoomedMin";
const ZOOMEDMAX = "zoomedMax";

const MinMaxInputs = Component.extend({

  /**
   * Initializes the Component.
   * Executed once before any template is rendered.
   * @param config The options passed to the component
   * @param context The component's parent
   */
  init(config, context) {

    this.name = "gapminder-minmaxinputs";
    this.template = require("./minmaxinputs.html");

    this.model_expects = [{
      name: "marker",
      type: "model"
    }, {
      name: "time",
      type: "time"
    }, {
      name: "locale",
      type: "locale"
    }];

    this.markerID = config.markerID;
    if (!config.markerID) utils.warn("minmaxinputs.js complains on 'markerID' property: " + config.markerID);

    this.model_binds = {
      "translate:locale": () => {
        this.updateView();
      },

      [`change:marker.${this.markerID}`]: () => {
        this.updateView();
      },

      ready: () => {
        this.updateView();
      }
    };

    // contructor is the same as any component
    this._super(config, context);

    // SPECIFIC COMPONENT UI! NOT TOOLMODEL UI!
    this.ui = utils.extend({
      selectDomainMinMax: false,
      selectZoomedMinMax: false
    }, this.ui.getPlainObject());

  },

  ready() {
    this.updateView();
  },

  readyOnce() {
    const _this = this;

    this.element = d3.select(this.element);

    this.el_domain_labelMin = this.element.select(".vzb-mmi-domainmin-label");
    this.el_domain_labelMax = this.element.select(".vzb-mmi-domainmax-label");
    this.el_domain_fieldMin = this.element.select(".vzb-mmi-domainmin");
    this.el_domain_fieldMax = this.element.select(".vzb-mmi-domainmax");

    this.el_break = this.element.select(".vzb-mmi-break");

    this.el_zoomed_labelMin = this.element.select(".vzb-mmi-zoomedmin-label");
    this.el_zoomed_labelMax = this.element.select(".vzb-mmi-zoomedmax-label");
    this.el_zoomed_fieldMin = this.element.select(".vzb-mmi-zoomedmin");
    this.el_zoomed_fieldMax = this.element.select(".vzb-mmi-zoomedmax");


    _this.el_domain_fieldMin.on("change", function() {
      _this._setModel(DOMAINMIN, this.value);
    });
    _this.el_domain_fieldMax.on("change", function() {
      _this._setModel(DOMAINMAX, this.value);
    });

    _this.el_zoomed_fieldMin.on("change", function() {
      _this._setModel(ZOOMEDMIN, this.value);
    });
    _this.el_zoomed_fieldMax.on("change", function() {
      _this._setModel(ZOOMEDMAX, this.value);
    });

    this.element.selectAll("input")
      .on("keypress", () => {
        if (d3.event.which == 13) document.activeElement.blur();
      });
  },

  updateView() {
    const _this = this;
    this.translator = this.model.locale.getTFunction();

    this.el_domain_labelMin.text(this.translator("hints/min") + ":");
    this.el_domain_labelMax.text(this.translator("hints/max") + ":");
    this.el_zoomed_labelMin.text(this.translator("hints/min") + ":");
    this.el_zoomed_labelMax.text(this.translator("hints/max") + ":");

    this.el_domain_labelMin.classed("vzb-hidden", !this.ui.selectDomainMinMax);
    this.el_domain_labelMax.classed("vzb-hidden", !this.ui.selectDomainMinMax);
    this.el_domain_fieldMin.classed("vzb-hidden", !this.ui.selectDomainMinMax);
    this.el_domain_fieldMax.classed("vzb-hidden", !this.ui.selectDomainMinMax);

    this.el_break.classed("vzb-hidden", !(this.ui.selectDomainMinMax && this.ui.selectZoomedMinMax));

    this.el_zoomed_labelMin.classed("vzb-hidden", !this.ui.selectZoomedMinMax);
    this.el_zoomed_labelMax.classed("vzb-hidden", !this.ui.selectZoomedMinMax);
    this.el_zoomed_fieldMin.classed("vzb-hidden", !this.ui.selectZoomedMinMax);
    this.el_zoomed_fieldMax.classed("vzb-hidden", !this.ui.selectZoomedMinMax);

    const formatter = function(n) {
      if (!n && n !== 0) return n;
      if (utils.isDate(n)) return _this.model.time.formatDate(n);
      return d3.format(".2r")(n);
    };

    const marker = this.model.marker[this.markerID];
    const [domainMin, domainMax] = marker.getScale().domain();
    const { zoomedMin, zoomedMax } = marker;
    this.el_domain_fieldMin.property("value", formatter(domainMin));
    this.el_domain_fieldMax.property("value", formatter(domainMax));
    this.el_zoomed_fieldMin.property("value", formatter(zoomedMin === null ? domainMin : zoomedMin));
    this.el_zoomed_fieldMax.property("value", formatter(zoomedMax === null ? domainMax : zoomedMax));
  },

  _setModel(what, value) {
    this.model.marker[this.markerID][what] = utils.strToFloat(value);
  }

});

export default MinMaxInputs;
