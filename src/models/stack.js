import utils from '../base/utils';
import Model from '../base/model';

/*
 * VIZABI Data Model (options.data)
 */

var palettes = {
  'ALL': "all",
  _default: "none"
};

var StackModel = Model.extend({

  /**
   * Initializes the stack hook
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init: function(values, parent, bind) {

    this._type = "model";
    values = utils.extend({
      use: "value",
      which: undefined,
      merge: false
    }, values);
    this._super(values, parent, bind);
  },

  /**
   * Validates a color hook
   */
  validate: function() {
    //there must be no scale
    if(this.scale) this.scale = null;

    //use must not be "indicator" 
    if(this.use === "indicator") {
      utils.warn("stack model: use must not be 'indicator'. Resetting use to 'value' and which to '" + palettes._default)
      this.use = "value";
      this.which = palettes._default;
    }

    //if use is "value"
    if(this.use === "value" && utils.values(palettes).indexOf(this.which) == -1) {
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