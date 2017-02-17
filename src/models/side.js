import * as utils from "base/utils";
import Hook from "models/hook";

/*
 * VIZABI Data Model (options.data)
 */

const SideModel = Hook.extend({

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

    this._type = "side";

    bind["readyOnce"] = this.readyOnce;

    this.state = { left: {}, right: {} };
    this._super(name, values, parent, bind);
  },

  readyOnce() {
    if (!this.spaceRef) return;
    const dataConnChildren = this._space[this.spaceRef].dataConnectedChildren.slice(0);
    dataConnChildren.splice(dataConnChildren.indexOf("show"), 1);
    this._space[this.spaceRef].dataConnectedChildren = dataConnChildren;
  },

  switchSideState() {
    const left = this.state.left;
    this.state.left = this.state.right;
    this.state.right = left;
  },

  clearSideState() {
    this.state = { left: {}, right: {} };
  }

});

export default SideModel;
