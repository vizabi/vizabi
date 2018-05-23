import * as utils from "base/utils";
import Component from "base/component";
import Dialog from "components/dialogs/_dialog";

import simplecheckbox from "components/simplecheckbox/simplecheckbox";
/*
 * Size dialog
 */

const Presentation = Dialog.extend("presentation", {

/**
 * Initializes the dialog component
 * @param config component configuration
 * @param context component context (parent)
 */
  init(config, parent) {
    this.name = "presentation";

    // in dialog, this.model_expects = ["state", "data"];

    this.components = [{
      component: simplecheckbox,
      placeholder: ".vzb-presentationmode-switch",
      model: ["ui", "locale"],
      checkbox: "presentation"
    }, {
      component: simplecheckbox,
      placeholder: ".vzb-decorations-switch",
      model: ["ui.chart.decorations", "locale"],
      checkbox: "enabled"
    }, {
      component: simplecheckbox,
      placeholder: ".vzb-advancedshowandselect-switch",
      model: ["ui.dialogs.dialog.find", "locale"],
      checkbox: "enableSelectShowSwitch"
    }];

    this._super(config, parent);
  }
});

export default Presentation;
