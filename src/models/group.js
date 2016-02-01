import * as utils from 'base/utils';
import Model from 'base/model';
/*
 * VIZABI Data Model (options.data)
 */

var GroupModel = Model.extend({

  /**
   * Default values for this model
   */
  _defaults: {
    use: null,
    which: null,
    merge: false,
    manualSorting: null
  },

  /**
   * Initializes the group hook
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init: function(name, values, parent, bind) {

    this._type = "model";
    //TODO: add defaults extend to super
    var defaults = utils.deepClone(this._defaults);
    values = utils.extend(defaults, values);
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
  },

  /**
   * There must be no scale
   */
  buildScale: function() {}

});

export default GroupModel;