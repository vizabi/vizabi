import * as utils from "base/utils";
import Component from "base/component";
import Dialog from "components/dialogs/_dialog";

import singlehandleslider from "components/brushslider/singlehandleslider/singlehandleslider";
/*
 * Size dialog
 */

const Grouping = Dialog.extend("grouping", {

/**
 * Initializes the dialog component
 * @param config component configuration
 * @param context component context (parent)
 */
  init(config, parent) {
    this.name = "grouping";

    // in dialog, this.model_expects = ["state", "data"];

    this.groupStops = [1, 5, 10, 15];

    this.components = [
      {
        component: singlehandleslider,
        placeholder: ".vzb-dialog-placeholder",
        model: ["state.entities_age", "locale"],
        arg: "grouping",
        properties: {
          snapValue: true,
          suppressInput: true,
          domain: this.groupStops
        }
      }
    ];

    this._super(config, parent);
  },

  readyOnce() {
    this._super();
    //    this.element = d3.select(this.element);
    const groups = this.element.select(".vzb-dialog-groups");

    groups.selectAll(".vzb-dialog-groups-title")
      .data(this.groupStops)
      .enter()
      .append("span")
      .attr("class", ".vzb-dialog-groups-title")
      .text(d => d);
  }
});

export default Grouping;
