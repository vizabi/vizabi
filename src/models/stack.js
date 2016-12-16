import * as utils from 'base/utils';
import Hook from 'models/hook';

/*
 * VIZABI Stack Model
 */

var palettes = {
  'ALL': "all",
  _default: "none"
};

var StackModel = Hook.extend({

  /**
   * Default values for this model
   */
  getClassDefaults: function() { 
    var defaults = {
      use: null,
      which: null,
      merge: false
    };
    return utils.deepExtend(this._super(), defaults);
  },
  
  /**
   * Initializes the stack hook
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init: function(name, values, parent, bind) {

    this._type = "model";
    
    this._super(name, values, parent, bind);
  },

  /**
   * Validates a color hook
   */
  validate: function() {
    //there must be no scale
    if(this.scale) this.scale = null;

    //use must not be "indicator"
    if(this.use === "indicator") {
      utils.warn("stack model: use must not be 'indicator'. Resetting use to 'constant' and which to '" + palettes._default)
      this.use = "constant";
      this.which = palettes._default;
    }

    //if use is "constant"
    if(this.use === "constant" && utils.values(palettes).indexOf(this.which) == -1) {
      utils.warn("stack model: the requested value '" + this.which + "' is not allowed. resetting to '" +
        palettes._default)
      this.which == palettes._default;
    }
  },

  /**
   * Get the above constants
   */
  getPalettes: function() {
    return palettes;
  },

  /**
   * There must be no scale
   */
  buildScale: function() {}

});

export default StackModel;
