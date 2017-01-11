import * as utils from 'base/utils';
import Hook from 'models/hook';

/*!
 * VIZABI Axis Model (hook)
 */

var allowTypes = {
    "indicator": ["linear", "log", "genericLog", "time", "pow"],
    "property": ["ordinal"],
    "constant": ["ordinal"]
};

var AxisModel = Hook.extend({
  
  //some hooks can be important. like axis x and y
  //that means, if X or Y doesn't have data at some point, we can't show markers
  _important: true,
  
  /**
   * Default values for this model
   */
  getClassDefaults: function() { 
    var defaults = {
      use: null,
      which: null,
      domainMin: null,
      domainMax: null,
      zoomedMin: null,
      zoomedMax: null,
      scaleType: "linear",
      allow: {
        scales: ["linear", "log", "genericLog", "time", "pow"]
      }
    };
    return utils.deepExtend(this._super(), defaults)
  },
    
  _type: "axis",

  /**
   * Validates a color hook
   */
  validate: function() {

    //only some scaleTypes are allowed depending on use. reset to default if inappropriate
    if(allowTypes[this.use].indexOf(this.scaleType) === -1) this.scaleType = allowTypes[this.use][0];
    
    //restore the correct object type for time values
    if(this.scale && this.scaleType == "time") {
      var obj = {};
      if(this.zoomedMin != null && !utils.isDate(this.zoomedMin)) obj.zoomedMin = this._space.time.parseToUnit(this.zoomedMin.toString());
      if(this.zoomedMax != null && !utils.isDate(this.zoomedMax)) obj.zoomedMax = this._space.time.parseToUnit(this.zoomedMax.toString());
      this.set(obj);
    }

  },

  /**
   * Gets the domain for this hook
   * @returns {Array} domain
   */
  buildScale: function(scaleType = this.scaleType) {
    var domain;

    if(scaleType == "time") {
      
      var timeMdl = this._space.time;
      var limits = timeMdl.splash ? 
          {min: timeMdl.parseToUnit(timeMdl.startOrigin), max: timeMdl.parseToUnit(timeMdl.endOrigin)}
          :
          {min: timeMdl.start, max: timeMdl.end};
      
      domain = [limits.min, limits.max];
      this.scale = d3.time.scale.utc().domain(domain);

    }else{

      switch(this.use) {
        case "indicator":
          var limits = this.getLimits(this.which);
          //default domain is based on limits
          domain = [limits.min, limits.max];
          //min and max can override the domain if defined
          domain[0] = this.domainMin!=null ? +this.domainMin : domain[0];
          domain[1] = this.domainMax!=null ? +this.domainMax : domain[1];
          break;
        case "property":
          domain = this.getUnique(this.which);
          break;
        case "constant":
        default:
          domain = [this.which];
          break;
      }

      scaleType = (d3.min(domain)<=0 && d3.max(domain)>=0 && scaleType === "log")? "genericLog" : scaleType;
      this.scale = d3.scale[scaleType || "linear"]().domain(domain);
    }
    
    this.scaleType = scaleType;
  },

  /**
   * Formats date according to time in this hook's space
   * @param {Date} date object to format
   * @returns {String} formatted date
   */
  formatDate: function(dateObject) {
    // improvement would be to check concept type of each space-dimension if it's time. 
    // Below code works as long we have one time model: time.
    return this._space.time.format(dateObject);
  }

});

export default AxisModel;
