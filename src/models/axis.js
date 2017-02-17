import * as utils from "base/utils";
import Hook from "models/hook";

/*!
 * VIZABI Axis Model (hook)
 */

const AxisModel = Hook.extend({

  //some hooks can be important. like axis x and y
  //that means, if X or Y doesn't have data at some point, we can't show markers
  _important: true,

  /**
   * Default values for this model
   */
  getClassDefaults() {
    const defaults = {
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
    return utils.deepExtend(this._super(), defaults);
  },

  autoGenerateModel() {
    if (this.which == null && this.autogenerate) {

      let concept = this.dataSource.getConceptByIndex(this.autogenerate.conceptIndex, this.autogenerate.conceptType);

      if (!concept) {
        concept = this.dataSource.getConceptByIndex(0, "time");
      }

      this.which = concept.concept;
    }
  },

  _type: "axis",

  /**
   * Validates a color hook
   */
  validate() {
    this._super();

    //restore the correct object type for time values
    if (this.scale && this.scaleType == "time") {
      const obj = {};
      if (this.zoomedMin != null && !utils.isDate(this.zoomedMin)) obj.zoomedMin = this._space.time.parse(this.zoomedMin.toString());
      if (this.zoomedMax != null && !utils.isDate(this.zoomedMax)) obj.zoomedMax = this._space.time.parse(this.zoomedMax.toString());
      this.set(obj);
    }

  },

  /**
   * Gets the domain for this hook
   * @returns {Array} domain
   */
  buildScale(scaleType = this.scaleType) {
    let domain;

    if (scaleType == "time") {

      const timeMdl = this._space.time;
      const limits = timeMdl.splash ?
          { min: timeMdl.parse(timeMdl.startOrigin), max: timeMdl.parse(timeMdl.endOrigin) }
          :
          { min: timeMdl.start, max: timeMdl.end };

      domain = [limits.min, limits.max];
      this.scale = d3.time.scale.utc().domain(domain);

    } else {

      if (!this.isDiscrete()) {
        const limits = this.getLimits(this.which);
        //default domain is based on limits
        domain = [limits.min, limits.max];
        //min and max can override the domain if defined
        domain[0] = this.domainMin != null ? +this.domainMin : domain[0];
        domain[1] = this.domainMax != null ? +this.domainMax : domain[1];
      } else {
        domain = this.use === "constant" ? [this.which] : this.getUnique(this.which);
      }

      scaleType = (d3.min(domain) <= 0 && d3.max(domain) >= 0 && scaleType === "log") ? "genericLog" : scaleType;
      this.scale = d3.scale[scaleType || "linear"]().domain(domain);
    }

    this.scaleType = scaleType;
  },

  /**
   * Formats date according to time in this hook's space
   * @param {Date} date object to format
   * @returns {String} formatted date
   */
  formatDate(dateObject) {
    // improvement would be to check concept type of each space-dimension if it's time.
    // Below code works as long we have one time model: time.
    return this._space.time.formatDate(dateObject);
  }

});

export default AxisModel;
