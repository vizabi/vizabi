import * as utils from 'base/utils';
import Model from 'base/model';
/*
 * VIZABI Data Model (options.data)
 */

var GroupModel = Model.extend({

  /**
   * Initializes the group hook
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init: function(values, parent, bind) {

    this._type = "model";
    values = utils.extend({
      use: "property",
      which: undefined,
      merge: false,
      manualSorting: null
    }, values);
    this._super(values, parent, bind);
  },

  /**
   * Validates a color hook
   */
  validate: function() {
    //there must be no scale
    if(this.scale) this.scale = null;

    //use must be "property" 
    if(this.use != "property") {
      utils.warn("group model: use must not be 'property'. Resetting...")
      this.use = "property";
    }
  },

  /**
   * There must be no scale
   */
  buildScale: function() {}

});

export default GroupModel;