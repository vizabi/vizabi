import * as utils from 'base/utils';
import Model from 'base/model';
import globals from 'base/globals';

/*!
 * VIZABI Axis Model (hook)
 */

//constant time formats
var time_formats = {
  "year": d3.time.format("%Y"),
  "month": d3.time.format("%Y-%m"),
  "week": d3.time.format("%Y-W%W"),
  "day": d3.time.format("%Y-%m-%d"),
  "hour": d3.time.format("%Y-%m-%d %H"),
  "minute": d3.time.format("%Y-%m-%d %H:%M"),
  "second": d3.time.format("%Y-%m-%d %H:%M:%S")
};


var allowTypes = {
    "indicator": ["linear", "log", "genericLog", "time", "pow"],
    "property": ["ordinal"],
    "value": ["ordinal"]
};

var AxisModel = Model.extend({

  /**
   * Default values for this model
   */
  _defaults: {
    use: "constant",
    which: undefined,
    min: null,
    max: null,
    fakeMin: null,
    fakeMax: null
  },

  /**
   * Initializes the color hook
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init: function(name, values, parent, bind) {

    this._type = "axis";
    //TODO: add defaults extend to super
    var defaults = utils.deepClone(this._defaults);
    values = utils.extend(defaults, values);
    this._super(name, values, parent, bind);
  },

  /**
   * Validates a color hook
   */
  validate: function() {
    //only some scaleTypes are allowed depending on use. reset to default if inappropriate
    if(allowTypes[this.use].indexOf(this.scaleType) === -1) this.scaleType = allowTypes[this.use][0];

    //kill the scale if indicator or scale type have changed
    //the scale will be rebuild upon getScale request in model.js
    if(this.which_1 != this.which || this.scaleType_1 != this.scaleType) this.scale = null;
    this.which_1 = this.which;
    this.scaleType_1 = this.scaleType;

    //here the modified min and max may change the domain, if the scale is defined
    if(this.scale && this._readyOnce && this.use === "indicator") {

      //min and max nonsense protection
      if(this.min == null || this.min <= 0 && this.scaleType === "log") this.min = this.scale.domain()[0];
      if(this.max == null || this.max <= 0 && this.scaleType === "log") this.max = this.scale.domain()[1];

      //fakemin and fakemax nonsense protection
      if(this.fakeMin == null || this.fakeMin <= 0 && this.scaleType === "log") this.fakeMin = this.scale.domain()[0];
      if(this.fakeMax == null || this.fakeMax <= 0 && this.scaleType === "log") this.fakeMax = this.scale.domain()[1];

      this.scale.domain([this.min, this.max]);
      this.buildScale();
    }
  },

//  _getBroadest: function(a1, a2){
//      if(!a1 || !a2 || !a1.length && !a2.length) return utils.warn("_getBroadest: bad input");
//      if(!a1.length) return a2;
//      if(!a2.length) return a1;
//      return Math.abs(a1[0]-a1[a1.length-1]) > Math.abs(a2[0]-a2[a2.length-1])? a1 : a2;
//  },
//
//
//  _getNarrowest: function(a1, a2){
//      if(!a1 || !a2 || !a1.length && !a2.length) return utils.warn("_getNarrowest: bad input");
//      if(!a1.length) return a2;
//      if(!a2.length) return a1;
//      return Math.abs(a1[0]-a1[a1.length-1]) > Math.abs(a2[0]-a2[a2.length-1])? a2 : a1;
//  },

  /**
   * Gets the domain for this hook
   * @returns {Array} domain
   */
  buildScale: function(margins) {
    var domain;
    var indicatorsDB = globals.metadata.indicatorsDB;

    if(this.scaleType == "time") {
      var limits = this.getLimits(this.which);
      this.scale = d3.time.scale().domain([limits.min, limits.max]);
      return;
    }

    switch(this.use) {
      case "indicator":
        var limits = this.getLimits(this.which);
        //default domain is based on limits
        domain = [limits.min, limits.max];
        //domain from metadata can override it if defined
        domain = indicatorsDB[this.which].domain ? indicatorsDB[this.which].domain : domain;
        //min and max can override the domain if defined
        domain = this.min!=null && this.max!=null ? [+this.min, +this.max] : domain;
        break;
      case "property":
        domain = this.getUnique(this.which);
        break;
      case "constant":
      default:
        domain = [this.which];
        break;
    }

    var scaletype = (d3.min(domain)<=0 && d3.max(domain)>=0 && this.scaleType === "log")? "genericLog" : this.scaleType;;
    this.scale = d3.scale[scaletype || "linear"]().domain(domain);
  }
});

export default AxisModel;
