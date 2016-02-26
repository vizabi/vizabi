import * as utils from 'base/utils';
import Hook from 'hook';

/*
 * VIZABI Size Model
 */

var SizeModel = Hook.extend({

  /**
   * Default values for this model
   */
  _defaults: {
    use: null,
    domainMin: 0,
    domainMax: 1,
    which: null
  },

  /**
   * Initializes the size hook
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init: function(name, values, parent, bind) {

    this._type = "size";
    //TODO: add defaults extend to super
    var defaults = utils.deepClone(this._defaults);
    values = utils.extend(defaults, values);
    this._super(name, values, parent, bind);
  },

  /**
   * Validates a size hook
   */
  validate: function() {
    //there must be a min and a max
    if(typeof this.domainMin === 'undefined' || this.domainMin < 0) this.domainMin = 0;
    if(typeof this.domainMax === 'undefined' || this.domainMax > 1) this.domainMax = 1;

    if(this.domainMax < this.domainMin) this.set('domainMin', this.domainMax, true);

    //value must always be between min and max
    if(this.use === "constant" && this.which > this.domainMax) this.which = this.domainMax;
    if(this.use === "constant" && this.which < this.domainMin) this.which = this.domainMin;
    
    if(!this.scaleType) this.scaleType = 'linear';
    if(this.use === "property" || this.use === "constant") this.scaleType = 'ordinal';
    
    //TODO a hack that kills the scale, it will be rebuild upon getScale request in model.js
    if(this.which_1 != this.which || this.scaleType_1 != this.scaleType) this.scale = null;
    this.which_1 = this.which;
    this.scaleType_1 = this.scaleType;
  },

  /**
   * Gets the domain for this hook
   * @returns {Array} domain
   */
  buildScale: function(margins) {
    var domain;

    if(this.scaleType == "time") {
      var limits = this.getLimits(this.which);
      this.scale = d3.time.scale.utc().domain([limits.min, limits.max]);
      return;
    }

    switch(this.use) {
      case "indicator":
        var limits = this.getLimits(this.which);
        //default domain is based on limits
        domain = [limits.min, limits.max];
        //domain from metadata can override it if defined
        domain = this.getMetadata().domain ? this.getMetadata().domain : domain;
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
    if(this.scaleType !== 'ordinal') this.scale.clamp(true);
  }

});

export default SizeModel;