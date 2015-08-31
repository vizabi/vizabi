/*!
 * VIZABI Axis Model (hook)
 */

(function () {

  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;

  //warn client if d3 is not defined
  if (!Vizabi._require('d3')) {
    return;
  }

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

  Vizabi.Model.extend('axis', {
    /**
     * Initializes the color hook
     * @param {Object} values The initial values of this model
     * @param parent A reference to the parent model
     * @param {Object} bind Initial events to bind
     */
    init: function (values, parent, bind) {

      this._type = "axis";
      values = utils.extend({
        use: "value",
        unit: "",
        which: undefined,
        min: null,
        max: null
      }, values);
      this._super(values, parent, bind);
    },

    /**
     * Validates a color hook
     */
    validate: function () {

      var possibleScales = ["log", "genericLog", "linear", "time", "pow"];
      if (!this.scaleType || (this.use === "indicator" && possibleScales.indexOf(this.scaleType) === -1)) {
        this.scaleType = 'linear';
      }

      if (this.use !== "indicator" && this.scaleType !== "ordinal") {
        this.scaleType = "ordinal";
      }

      //TODO a hack that kills the scale, it will be rebuild upon getScale request in model.js
      if (this.which_1 != this.which || this.scaleType_1 != this.scaleType) this.scale = null;
      this.which_1 = this.which;
      this.scaleType_1 = this.scaleType;

      if(this.scale && this._readyOnce && this.use=="indicator"){
          if(this.min==null) this.min = this.scale.domain()[0];
          if(this.max==null) this.max = this.scale.domain()[1];

          if(this.min<=0 && this.scaleType=="log") this.min = 0.01;
          if(this.max<=0 && this.scaleType=="log") this.max = 10;

          // Max may be less than min
          // if(this.min>=this.max) this.min = this.max/2;

          if(this.min!=this.scale.domain()[0] || this.max!=this.scale.domain()[1])
              this.scale.domain([this.min, this.max]);
      }
    },


    /**
     * Gets the domain for this hook
     * @returns {Array} domain
     */
    buildScale: function (margins) {
      var domain;
      var scaleType = this.scaleType || "linear";
      if (margins === undefined)
        margins = true;

      if (typeof margins === 'boolean') {
        var res = margins;
        margins = {};
        margins.min = res;
        margins.max = res;
      }

      if (this.scaleType == "time") {
        var limits = this.getLimits(this.which);
        this.scale = d3.time.scale().domain([limits.min, limits.max]);
        return;
      }

      switch (this.use) {
        case "indicator":
          var limits = this.getLimits(this.which),
            margin = (limits.max - limits.min) / 20;

          domain = [(limits.min - (margins.min && margin ? margin : 0)), (limits.max + (margins.max && margin ? margin : 0))];
          if (scaleType == "log") {
            domain = [(limits.min - limits.min / 4), (limits.max + limits.max / 4)];
          }

          break;
        case "property":
          domain = this.getUnique(this.which);
          break;
        case "value":
        default:
          domain = [this.which];
          break;
      }


      if (this.min!=null && this.max!=null && scaleType !== 'ordinal') {
        domain = [this.min, this.max];
        this.min = domain[0];
        this.max = domain[1];
      }

      this.scale = d3.scale[scaleType]().domain(domain);
    }
  });
}).call(this);
