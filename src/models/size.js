import * as utils from 'base/utils';
import Model from 'base/model';
import globals from 'base/globals';

/*
 * VIZABI Data Model (options.data)
 */

var SizeModel = Model.extend({

  /**
   * Default values for this model
   */
  _defaults: {
    use: "value",
    min: 0,
    max: 1,
    which: undefined
  },

  /**
   * Initializes the size hook
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init: function(values, parent, bind) {

    this._type = "size";
    //TODO: add defaults extend to super
    var defaults = utils.deepClone(this._defaults);
    values = utils.extend(defaults, values);
    this._super(values, parent, bind);
  },

  /**
   * Validates a size hook
   */
  validate: function() {
    //there must be a min and a max
    if(typeof this.min === 'undefined' || this.min < 0) this.min = 0;
    if(typeof this.max === 'undefined' || this.max > 1) this.max = 1;

    if(this.max < this.min) this.set('min', this.max, true);

    //value must always be between min and max
    if(this.use === "value" && this.which > this.max) this.which = this.max;
    if(this.use === "value" && this.which < this.min) this.which = this.min;
    
    if(!this.scaleType) this.scaleType = 'linear';
    if(this.use === "property") this.scaleType = 'ordinal';
    
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
        break;
      case "property":
        domain = this.getUnique(this.which);
        break;
      case "value":
      default:
        domain = [this.which];
        break;
    }
    
    var scaletype = (d3.min(domain)<=0 && d3.max(domain)>=0 && this.scaleType === "log")? "genericLog" : this.scaleType;;
    this.scale = d3.scale[scaletype || "linear"]().domain(domain).clamp(true);
  }

});

export default SizeModel;