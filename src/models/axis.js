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
  _defaults: {
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
  },
    
  _type: "axis",

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
      if(this.scaleType == "time") {
        
        var timeMdl = this._space.time;
        var limits = timeMdl.splash ? 
            {min: timeMdl.parseToUnit(timeMdl.startOrigin), max: timeMdl.parseToUnit(timeMdl.endOrigin)}
            :
            {min: timeMdl.start, max: timeMdl.end};
        
        if (this.scale.domain()[0] < limits.min || this.scale.domain()[1] > limits.max) {
          this.scale.domain([limits.min, limits.max]);
        }
        
        //restore the correct object type for time values
        if(this.zoomedMin != null && !utils.isDate(this.zoomedMin)) this.zoomedMin = this._space.time.parseToUnit(this.zoomedMin.toString());
        if(this.zoomedMax != null && !utils.isDate(this.zoomedMax)) this.zoomedMax = this._space.time.parseToUnit(this.zoomedMax.toString());

        if(!utils.isDate(this.domainMin)) this.domainMin = this.scale.domain()[0];
        if(!utils.isDate(this.domainMax)) this.domainMax = this.scale.domain()[1];
      }
      //min and max nonsense protection
      if(this.domainMin == null || this.domainMin <= 0 && this.scaleType === "log") this.domainMin = this.scale.domain()[0];
      if(this.domainMax == null || this.domainMax <= 0 && this.scaleType === "log") this.domainMax = this.scale.domain()[1];

      //zoomedmin and zoomedmax nonsense protection    
      if(this.zoomedMin == null) this.zoomedMin = this.scale.domain()[0];
      if(this.zoomedMax == null) this.zoomedMax = this.scale.domain()[1];

      this.scale.domain([this.domainMin, this.domainMax]);
    }
  },

  /**
   * Gets the domain for this hook
   * @returns {Array} domain
   */
  buildScale: function(margins) {
    var domain;

    if(this.scaleType == "time") {
      
      var timeMdl = this._space.time;
      var limits = timeMdl.splash ? 
          {min: timeMdl.parseToUnit(timeMdl.startOrigin), max: timeMdl.parseToUnit(timeMdl.endOrigin)}
          :
          {min: timeMdl.start, max: timeMdl.end};
      
      domain = [limits.min, limits.max];
      this.scale = d3.time.scale.utc().domain(domain);

      this.validate();
      return;
    }

    switch(this.use) {
      case "indicator":
        var limits = this.getLimits(this.which);
        //default domain is based on limits
        domain = [limits.min, limits.max];
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
    
    var scaletype = (d3.min(domain)<=0 && d3.max(domain)>=0 && this.scaleType === "log")? "genericLog" : this.scaleType;
    if(this.scaletype == "nominal") scaletype = "ordinal"; // 
    this.scale = d3.scale[scaletype || "linear"]().domain(domain);
  },

  /**
   * Formats date according to time in this hook's space
   * @param {Date} date object to format
   * @returns {String} formatted date
   */
  formatDate: function(dateObject) {
    // improvement would be to check concept type of each space-dimension if it's time. 
    // Below code works as long we have one time model: time.
    this._space.time.format(dateObject);
  }

});

export default AxisModel;
