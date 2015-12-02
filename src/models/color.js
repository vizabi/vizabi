import * as utils from 'base/utils';
import globals from 'base/globals';
import Model from 'base/model';

/*!
 * VIZABI Color Model (hook)
 */

var ColorModel = Model.extend({

  /**
   * Default values for this model
   */
  _defaults: {
    use: "constant",
    palette: null,
    which: undefined
  },

  /**
   * Initializes the color hook
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init: function(values, parent, bind) {

    this._type = "color";
    //TODO: add defaults extend to super
    var defaults = utils.deepClone(this._defaults);
    values = utils.extend(defaults, values);

    this._original_palette = values.palette;

    this._super(values, parent, bind);

    this._firstLoad = true;
    this._hasDefaultColor = false;
  },

  /**
   * Get the above constants
   */
  getPalettes: function() {
    var palettes = (globals.metadata) ? globals.metadata.color.palettes : {
      "_continuous": {
        "0": "#F77481",
        "1": "#E1CE00",
        "2": "#B4DE79"
      },
      "_discrete": {
        "0": "#bcfa83",
        "1": "#4cd843",
        "2": "#ff8684",
        "3": "#e83739",
        "4": "#ffb04b",
        "5": "#ff7f00",
        "6": "#f599f5",
        "7": "#c027d4",
        "8": "#f4f459",
        "9": "#d66425",
        "10": "#7fb5ed",
        "11": "#0ab8d8"
      },
      "_default": {
        "_default": "#fa5ed6"
      }
    };

    return palettes;
  },

  afterPreload: function() {
    this._resetPalette = true;
    this._super();
  },

  /**
   * Get the above constants
   */
  isUserSelectable: function(whichPalette) {

    var userSelectable = (globals.metadata) ? globals.metadata.color.selectable : {};

    if(userSelectable[whichPalette] == null) return true;
    return userSelectable[whichPalette];
  },

  /**
   * Validates a color hook
   */
  validate: function() {

    var palettes = this.getPalettes();

    var possibleScales = ["log", "genericLog", "linear", "time", "pow"];
    if(!this.scaleType || (this.use === "indicator" && possibleScales.indexOf(this.scaleType) === -1)) {
      this.scaleType = 'linear';
    }
    if(this.use !== "indicator" && this.scaleType !== "ordinal") {
      this.scaleType = "ordinal";
    }

    // reset palette in the following cases:
    // first load and no palette supplied in the state
    // or changing of the indicator
    if(this.palette == null || this._firstLoad === false && this.which_1 != this.which || this._firstLoad ===
      false && this.scaleType_1 != this.scaleType || this._resetPalette) {


      //TODO a hack that kills the scale, it will be rebuild upon getScale request in model.js
      this.set("palette", null, false);

      if(palettes[this.which]) {
        this.palette = utils.clone(palettes[this.which]);
      } else if(this.use === "constant") {
        this.palette = {
          "_default": this.which
        };
      } else if(this.use === "indicator") {
        this.palette = utils.clone(palettes["_continuous"]);
      } else if(this.use === "property") {
        this.palette = utils.clone(palettes["_discrete"]);
      } else {
        this.palette = utils.clone(palettes["_default"]);
      }

      this._resetPalette = false;

      //TODO a hack that kills the scale, it will be rebuild upon getScale request in model.js
      this.scale = null;
    }

    this.which_1 = this.which;
    this.scaleType_1 = this.scaleType;
    this._firstLoad = false;
  },

  /**
   * set color
   */
  setColor: function(value, pointer) {
    var temp = this.palette.getObject();
    temp[pointer] = value;
    this.scale.range(utils.values(temp));
    this.palette[pointer] = value;
  },


  /**
   * maps the value to this hook's specifications
   * @param value Original value
   * @returns hooked value
   */
  mapValue: function(value) {
    //if the property value does not exist, supply the _default
    // otherwise the missing value would be added to the domain
    if(this.scale != null && this.use == "property" && this._hasDefaultColor && this.scale.domain().indexOf(value) ==
      -1) value = "_default";
    return this._super(value);
  },


  /**
   * Gets the domain for this hook
   * @returns {Array} domain
   */
  buildScale: function() {
    var _this = this;

    var indicatorsDB = globals.metadata.indicatorsDB;

    var domain = Object.keys(_this.palette.getObject());
    var range = utils.values(_this.palette.getObject());

    this._hasDefaultColor = domain.indexOf("_default") > -1;

    if(this.scaleType == "time") {
      var limits = this.getLimits(this.which);
      var step = ((limits.max.valueOf() - limits.min.valueOf()) / (range.length - 1));
      domain = d3.range(limits.min.valueOf(), limits.max.valueOf(), step).concat(limits.max.valueOf());

      if(step === 0) {
        domain.push(domain[0]);
        range = [range[range.length - 1]];             
      }
      
      this.scale = d3.time.scale()
        .domain(domain)
        .range(range)
        .interpolate(d3.interpolateRgb);
      return;
    }

    switch(this.use) {
      case "indicator":
        var limits = this.getLimits(this.which);
        //default domain is based on limits
        domain = [limits.min, limits.max];
        //domain from metadata can override it if defined
        domain = indicatorsDB[this.which].domain ? indicatorsDB[this.which].domain : domain;
          
        var limitMin = domain[0];
        var limitMax = domain[1];
        var step = (limitMax - limitMin) / (range.length - 1);
        domain = d3.range(limitMin, limitMax, step).concat(limitMax);
        if (domain.length > range.length) domain.pop();
        domain = domain.reverse();
        if(this.scaleType == "log") {
          var s = d3.scale.log()
            .domain([limitMin === 0 ? 1 : limitMin, limitMax])
            .range([limitMin, limitMax]);
          domain = domain.map(function(d) {
            return s.invert(d)
          });
        }

        this.scale = d3.scale[this.scaleType]()
          .domain(domain)
          .range(range)
          .interpolate(d3.interpolateRgb);
        return;

      default:
        this.scale = d3.scale["ordinal"]()
          .domain(domain)
          .range(range);
        return;
    }
  }

});

export default ColorModel;