import * as utils from "base/utils";

/*!
 * VIZABI Entities Model
 */

const SpaceModel = Model.extend({

  /**
   * Default values for this model
   */
  getClassDefaults() {
    const defaults = {
      dimensions: null,
    };
    return utils.deepExtend(this._super(), defaults);
  },

  /**
   * Initializes the entities model.
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init(name, values, parent, bind) {

    this._type = "space";

    this._super(name, values, parent, bind);
  },

});

export default SpaceModel;
