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
      extent: [0, 0.85],
      scaleType: null,
      allow: {
        scales: ["linear", "log", "genericLog", "pow"]
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

  },

  autoGenerateModel() {
    if (this.which == null) {
      let concept;
      if (this.autogenerate) {
        concept = this.dataSource
          .getConceptByIndex(this.autogenerate.conceptIndex, this.autogenerate.conceptType);

        if (concept) {
          this.which = concept.concept;
          this.use = "indicator";
          this.scaleType = "linear";
        }

      }
      if (!concept) {
        this.which = "_default";
        this.use = "constant";
        this.scaleType = "ordinal";
      }
    }
    if (this.scaleType == null) {
      this.scaleType = this.dataSource
        .getConceptprops(this.which).scales[0];
    }
  }

});

export default SizeModel;
