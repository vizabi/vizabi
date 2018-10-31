import Axis from "models/axis";
import * as utils from "base/utils";

/*
 * VIZABI Size Model
 */

const SizeModel = Axis.extend({

  /**
   * Default values for this model
   */
  getClassDefaults() {
    const defaults = {
      use: null,
      which: null,
      domainMin: null,
      domainMax: null,
      zoomedMin: null,
      zoomedMax: null,
      fixBaseline: 0,
      extent: [0, 0.85],
      scaleType: null,
      allow: {
        scales: ["ordinal", "linear", "log", "genericLog", "pow"]
      }
    };
    return utils.deepExtend(this._super(), defaults);
  },

  _type: "size",

  buildScale() {
    //do whatever axis.buildScale does
    this._super();
    //but then also clamp a numeric scale
    if (this.scaleType !== "ordinal") this.scale.clamp(true);

  }
});

export default SizeModel;
