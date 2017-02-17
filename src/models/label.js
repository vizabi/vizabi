import * as utils from "base/utils";
import Hook from "models/hook";

/*
 * VIZABI Data Model (options.data)
 */

const LabelModel = Hook.extend({

  /**
   * Default values for this model
   */

  getClassDefaults() {
    const defaults = {
      use: null,
      which: null
    };
    return utils.deepExtend(this._super(), defaults);
  },

  /**
   * Initializes the size hook
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init(name, values, parent, bind) {

    this._type = "label";

    this._super(name, values, parent, bind);
  }


});

export default LabelModel;
