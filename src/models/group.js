import * as utils from 'base/utils';
import Hook from 'models/hook';
/*
 * VIZABI Group Model
 */

var GroupModel = Hook.extend({

  /**
   * Default values for this model
   */
  getClassDefaults: function() { 
    var defaults = {
      use: null,
      which: null,
      merge: false,
      manualSorting: null
    };
    return utils.deepExtend(this._super(), defaults)
  },

  /**
   * Initializes the group hook
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

    //use must be "property"
    if(this.use != "property") {
      utils.warn("group model: use must be 'property'. Resetting...")
      this.use = "property";
    }
  }

});

export default GroupModel;
