import * as utils from "base/utils";
import Component from "base/component";
import Dialog from "components/dialogs/_dialog";

import simpleslider from "components/simpleslider/simpleslider";
/*
 * Size dialog
 */

const Opacity = Dialog.extend({

/**
 * Initializes the dialog component
 * @param config component configuration
 * @param context component context (parent)
 */
  init(config, parent) {
    this.name = "opacity";

  // in dialog, this.model_expects = ["state", "data"];

    this.components = [
      {
        component: simpleslider,
        placeholder: ".vzb-dialog-bubbleopacity-regular",
        model: ["state.marker"],
        arg: "opacityRegular",
        properties: { step: 0.01 }
      }, {
        component: simpleslider,
        placeholder: ".vzb-dialog-bubbleopacity-selectdim",
        model: ["state.marker"],
        arg: "opacitySelectDim",
        properties: { step: 0.01 }
      }
    ];

    this._super(config, parent);
  }
});

export default Opacity;
