import * as utils from "base/utils";
import Component from "base/component";
import Dialog from "components/dialogs/_dialog";

import singlehandleslider from "components/brushslider/singlehandleslider/singlehandleslider";
/*
 * Size dialog
 */

const Speed = Dialog.extend("speed", {

/**
 * Initializes the dialog component
 * @param config component configuration
 * @param context component context (parent)
 */
  init(config, parent) {
    this.name = "speed";

    // in dialog, this.model_expects = ["state", "data"];

    this.components = [
      {
        component: singlehandleslider,
        placeholder: ".vzb-dialog-placeholder",
        model: ["state.time", "locale"],
        arg: "delay",
        properties: {
          domain: [1200, 900, 450, 200, 150, 100],
          roundDigits: 0
        }
      }
    ];

    this._super(config, parent);
  }
});

export default Speed;
