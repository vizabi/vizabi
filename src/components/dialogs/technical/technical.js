import * as utils from "base/utils";
import Component from "base/component";
import Dialog from "components/dialogs/_dialog";

import simplecheckbox from "components/simplecheckbox/simplecheckbox";

const Technical = Dialog.extend("technical", {

/**
 * Initializes the dialog component
 * @param config component configuration
 * @param context component context (parent)
 */
  init(config, parent) {
    this.name = "technical";

    this.components = [{
      component: simplecheckbox,
      placeholder: ".vzb-advancedshowandselect-switch",
      model: ["ui.dialogs.dialog.find", "locale"],
      checkbox: "enableSelectShowSwitch"
    }];

    this._super(config, parent);
  }
});

export default Technical;
