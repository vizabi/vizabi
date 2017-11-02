import * as utils from "base/utils";
import Component from "base/component";
import Dialog from "components/dialogs/_dialog";

import singlehandleslider from "components/brushslider/singlehandleslider/singlehandleslider";
/*
 * Size dialog
 */

const Opacity = Dialog.extend("opacity", {

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
        component: singlehandleslider,
        placeholder: ".vzb-dialog-bubbleopacity-regular",
        model: ["state.marker", "locale"],
        arg: "opacityRegular"
      }, {
        component: singlehandleslider,
        placeholder: ".vzb-dialog-bubbleopacity-selectdim",
        model: ["state.marker", "locale"],
        arg: "opacitySelectDim"
      }
    ];

    this._super(config, parent);
  }
});

export default Opacity;
