import * as utils from "base/utils";
import Component from "base/component";
import Dialog from "components/dialogs/_dialog";

import sizeslider from "components/sizeslider/sizeslider";
import indicatorpicker from "components/indicatorpicker/indicatorpicker";
import simplecheckbox from "components/simplecheckbox/simplecheckbox";
/*
 * Label dialog
 */

const Label = Dialog.extend({

/**
 * Initializes the dialog component
 * @param config component configuration
 * @param context component context (parent)
 */
  init(config, parent) {
    this.name = "label";

  // in dialog, this.model_expects = ["state", "data"];

    this.components = [
      {
        component: sizeslider,
        placeholder: ".vzb-dialog-sizeslider",
        model: ["state.marker.size_label",  "locale"],
        propertyname: "LabelTextSize",
        ui: {
          constantUnit: "unit/pixels"
        }
      },
      {
        component: indicatorpicker,
        placeholder: ".vzb-saxis-selector",
        model: ["state.time", "state.entities", "state.marker", "locale"],
        markerID: "size_label",
        showHoverValues: true
      },
      {
        component: simplecheckbox,
        placeholder: ".vzb-removelabelbox-switch",
        model: ["ui.chart", "locale"],
        checkbox: "removeLabelBox",
        submodel: "labels"
      }
    ];

    this._super(config, parent);
  }
});

export default Label;
