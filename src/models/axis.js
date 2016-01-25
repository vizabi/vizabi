import * as utils from 'base/utils';
import Model from 'base/model';
import globals from 'base/globals';

/*!
 * VIZABI Axis Model (hook)
 */

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
    use: null,
    which: null,
    domainMin: null,
    domainMax: null,
    zoomedMin: null,
    zoomedMax: null
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
      if(this.domainMin == null || this.domainMin <= 0 && this.scaleType === "log") this.domainMin = this.scale.domain()[0];
      if(this.domainMax == null || this.domainMax <= 0 && this.scaleType === "log") this.domainMax = this.scale.domain()[1];

      //zoomedmin and zoomedmax nonsense protection    
      if(this.zoomedMin == null || this.zoomedMin <= 0 && this.scaleType === "log") this.zoomedMin = this.scale.domain()[0];
      if(this.zoomedMax == null || this.zoomedMax <= 0 && this.scaleType === "log") this.zoomedMax = this.scale.domain()[1];

      this.scale.domain([this.domainMin, this.domainMax]);
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
        domain = this.domainMin!=null && this.domainMax!=null ? [+this.domainMin, +this.domainMax] : domain;
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
