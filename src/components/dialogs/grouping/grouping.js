import * as utils from "base/utils";
import Component from "base/component";
import Dialog from "components/dialogs/_dialog";

import simpleslider from "components/simpleslider/simpleslider";
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
        component: simpleslider,
        placeholder: ".vzb-dialog-placeholder",
        model: ["state.entities_age"],
        arg: "grouping",
        properties: { min: 1, max: this.groupStops.length, step: 1, suppressInput: true, scale: d3.scaleLinear()
          .domain(d3.range(1, this.groupStops.length))
          .range(this.groupStops)
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
