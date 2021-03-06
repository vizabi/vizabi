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
      fixBaseline: null,
      scaleType: "linear",
      allow: {
        scales: ["linear", "log", "genericLog", "time", "pow"]
      }
    };
    return utils.deepExtend(this._super(), defaults);
  },

  autoconfigureModel(autoconfigResult) {
    if (!this.which && this.autoconfig && this._type === "axis") {
      autoconfigResult = this._parent.getAvailableConcept(this.autoconfig) || this._parent.getAvailableConcept({ type: "time" });
    }
    this._super(autoconfigResult);
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
      this.scale = d3.scaleUtc().domain(domain);

    } else {
      let limits;
      if (!this.isDiscrete()) {
        limits = this.getLimits(this.which);
        //default domain is based on limits
        domain = [limits.min, limits.max];
        //fixBaseline can override the domain if defined and if limits.min isn't negative
        domain[0] = ((this.fixBaseline || this.fixBaseline === 0) && limits.min > 0) ? +this.fixBaseline : domain[0];
        //min and max can further override the domain if defined
        domain[0] = this.domainMin != null ? +this.domainMin : domain[0];
        domain[1] = this.domainMax != null ? +this.domainMax : domain[1];
      } else {
        domain = this.use === "constant" ? [this.which] : this.getUnique(this.which);
      }

      scaleType = (d3.min(domain) <= 0 && d3.max(domain) >= 0 && scaleType === "log") ? "genericLog" : scaleType;

      const _scaleType = (scaleType === "ordinal" ? "point" : scaleType) || "linear";
      this.scale = d3[`scale${utils.capitalize(_scaleType)}`]()
        .domain(domain);
      if (this.scale.constant) {
        this.scale.constant(limits.minAbsNear0);
      }
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
  },

  _getZoomed(type) {
    const zoomed = this[`zoomed${type}`];
    return zoomed !== null ? zoomed : d3[type.toLowerCase()](this.getScale().domain());
  },

  getZoomedMin() {
    return this._getZoomed("Min");
  },

  getZoomedMax() {
    return this._getZoomed("Max");
  },

});

export default AxisModel;
