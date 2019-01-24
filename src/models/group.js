import * as utils from "base/utils";
import Hook from "models/hook";
/*
 * VIZABI Group Model
 */

const GroupModel = Hook.extend({

  /**
   * Default values for this model
   */
  getClassDefaults() {
    const defaults = {
      use: null,
      which: null,
      merge: false,
      manualSorting: null,
      spaceRef: null,
      scaleType: "ordinal" // the only one possible, right?
    };
    return utils.deepExtend(this._super(), defaults);
  },

  /**
   * Initializes the group hook
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init(name, values, parent, bind) {
    this._type = "model";

    this._super(name, values, parent, bind);
  },

  /**
   * Validates a color hook
   */
  validate() {
    //there must be no scale
    if (this.scale) this.scale = null;

    //use must be "property"
    if (this.use != "property" && this.use != "constant") {
      utils.warn("group model: use must be 'property' or 'constant'. Resetting to property...");
      this.use = "property";
    }
  },

  // Group model only gets synced with discrete models
  _receiveSyncModelUpdate(sourceMdl) {
    const conceptType = sourceMdl.getConceptprops().concept_type;
    if (["entity_set", "entity_domain"].includes(conceptType) && this.use !== "constant") {
      this._super(sourceMdl);
    }
  }

});

export default GroupModel;
