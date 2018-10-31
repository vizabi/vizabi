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
  },

  autoconfigureModel(autoconfigResult) {
    if (!this.which && this.autoconfig) {
      autoconfigResult = this._parent.getAvailableConcept(this.autoconfig) || this._parent.getAvailableConcept({ type: "entity_domain" });
    }
    this._super(autoconfigResult);
  }


});

export default LabelModel;
