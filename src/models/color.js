import * as utils from 'base/utils';
import Hook from 'hook';

/*!
 * VIZABI Color Model (hook)
 */

var defaultPalettes = {
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
    "_default": "#93daec"
  }
};

var ColorModel = Hook.extend({

  /**
   * Default values for this model
   */
  _defaults: {
    use: null,
    palette: {},
    scaleType: null,
    which: null
  },

  /**
   * Initializes the color hook
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init: function(name, values, parent, bind) {

    this._type = "color";
    //TODO: add defaults extend to super
    var defaults = utils.deepClone(this._defaults);
    values = utils.extend(defaults, values);

    this._original_palette = values.palette;

    this._super(name, values, parent, bind);

    this._firstLoad = true;
    this._hasDefaultColor = false;
  },

  // args: {colorID, shadeID}
  getColorShade: function(args){
    var palette = this.getPalette();
      
    if(!args) return utils.warn("getColorShade() is missing arguments");  
      
    // if colorID is not given or not found in the palette, replace it with default color
    if(!args.colorID || !palette[args.colorID]) args.colorID = "_default";
    
    // if the resolved colr value is not an array (has only one shade) -- return it
    if( !utils.isArray(palette[args.colorID]) ) return palette[args.colorID];
      
    var colorMeta = this.getMetadata().color;
    var shade = args.shadeID && colorMeta && colorMeta.shades && colorMeta.shades[args.shadeID] ? colorMeta.shades[args.shadeID] : 0;
        
    return palette[args.colorID][shade];
    
  },
    

  afterPreload: function() {
    this._super();
  },
  
  /**
   * Get the above constants
   */
  isUserSelectable: function() {
    var metaColor = this.getMetadata().color;
    return metaColor == null || metaColor.selectable == null || metaColor.selectable;
  },

  /**
   * Validates a color hook
   */
  validate: function() {

    var possibleScales = ["log", "genericLog", "linear", "time", "pow"];
    if(!this.scaleType || (this.use === "indicator" && possibleScales.indexOf(this.scaleType) === -1)) {
      this.scaleType = 'linear';
    }
    if(this.use !== "indicator" && this.scaleType !== "ordinal") {
      this.scaleType = "ordinal";
    }

    // reset palette and scale in the following cases: indicator or scale type changed
    if(this._firstLoad === false && (this.which_1 != this.which || this.scaleType_1 != this.scaleType)) {

      //TODO a hack that kills the scale and palette, it will be rebuild upon getScale request in model.js
      if(this.palette) this.palette._data = {};
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
    var temp = this.getPalette();
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
    if(this.scale != null && this.use == "property" && this._hasDefaultColor && this.scale.domain().indexOf(value) == -1) value = "_default";
    return this._super(value);
  },


  getDefaultPalette: function() {     
      var metaColor = this.getMetadata().color;
      var palette;
      
      if(metaColor && metaColor.palette) {
        //specific color palette from hook metadata
        palette = utils.clone(metaColor.palette);
      } else if(defaultPalettes[this.which]) {
        //color palette for this.which exists in palette defaults
        palette = utils.clone(defaultPalettes[this.which]);
      } else if(this.use === "constant" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(this.which)) {
        //an explicit hex color constant #abc or #adcdef is provided
        palette = {"_default": this.which};
      } else if(this.use === "indicator") {
        palette = utils.clone(defaultPalettes["_continuous"]);
      } else if(this.use === "property") {
        palette = utils.clone(defaultPalettes["_discrete"]);
      } else {
        palette = utils.clone(defaultPalettes["_default"]);
      }
      
      return palette;
  },
    
  getPalette: function(){
    //rebuild palette if it's empty
    if (!this.palette || Object.keys(this.palette._data).length===0) this.palette.set(this.getDefaultPalette(), false, false);
    return this.palette.getPlainObject(); 
  },
    
  /**
   * Gets the domain for this hook
   * @returns {Array} domain
   */
  buildScale: function() {
    var _this = this;

    var paletteObject = _this.getPalette();
    var domain = Object.keys(paletteObject);
    var range = utils.values(paletteObject);

    this._hasDefaultColor = domain.indexOf("_default") > -1;

    if(this.scaleType == "time") {
      
      var timeMdl = this._parent._parent.time;
      var limits = timeMdl.beyondSplash ? 
          {min: timeMdl.beyondSplash.start, max: timeMdl.beyondSplash.end}
          :
          {min: timeMdl.start, max: timeMdl.end};
        
      var step = ((limits.max.valueOf() - limits.min.valueOf()) / (range.length - 1));
      domain = d3.range(limits.min.valueOf(), limits.max.valueOf(), step).concat(limits.max.valueOf());

      if(step === 0) {
        domain.push(domain[0]);
        range = [range[range.length - 1]];             
      }
      
      this.scale = d3.time.scale.utc()
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
        domain = this.getMetadata().domain ? this.getMetadata().domain : domain;
          
        var limitMin = domain[0];
        var limitMax = domain[1];
        var step = (limitMax - limitMin) / (range.length - 1);
        domain = d3.range(limitMin, limitMax, step).concat(limitMax);
        if (domain.length > range.length) domain.pop();
        domain = domain.reverse();
        var scaletype = (d3.min(domain)<=0 && d3.max(domain)>=0 && this.scaleType === "log")? "genericLog" : this.scaleType;
        if(this.scaleType == "log") {
          var s = d3.scale[scaletype || "linear"]()
            .domain([limitMin, limitMax])
            .range([limitMin, limitMax]);
          domain = domain.map(function(d) {
            return s(d)
          });
        }
        this.scale = d3.scale[scaletype]()
          .domain(domain)
          .range(range)
          .interpolate(d3.interpolateRgb);
        return;
      default:
        range = range.map(function(m){ return utils.isArray(m)? m[0] : m; });
            
        this.scale = d3.scale["ordinal"]()
          .domain(domain)
          .range(range);
        return;
    }
  }

});

export default ColorModel;