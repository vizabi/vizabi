import * as utils from "base/utils";
import Component from "base/component";
import Dialog from "components/dialogs/_dialog";

import zoombuttonlist from "components/zoombuttonlist/zoombuttonlist";
import simplecheckbox from "components/simplecheckbox/simplecheckbox";


/*
 * Zoom dialog
 */

const Zoom = Dialog.extend({

/**
 * Initializes the dialog component
 * @param config component configuration
 * @param context component context (parent)
 */
  init(config, parent) {
    this.name = "zoom";

  // in dialog, this.model_expects = ["state", "data"];

    this.components = [{
      component: zoombuttonlist,
      placeholder: ".vzb-dialog-zoom-buttonlist",
      model: ["state", "ui", "locale"]
    }, {
      component: simplecheckbox,
      placeholder: ".vzb-panwitharrow-switch",
      model: ["ui", "locale"],
      checkbox: "panWithArrow"
    }, {
      component: simplecheckbox,
      placeholder: ".vzb-zoomonscrolling-switch",
      model: ["ui", "locale"],
      checkbox: "zoomOnScrolling"
    }, {
      component: simplecheckbox,
      placeholder: ".vzb-adaptminmaxzoom-switch",
      model: ["ui", "locale"],
      checkbox: "adaptMinMaxZoom"
    }];

    this._super(config, parent);
  }
});

export default Zoom;
