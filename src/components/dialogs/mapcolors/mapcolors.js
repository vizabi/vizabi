import * as utils from "base/utils";
import Component from "base/component";
import Dialog from "components/dialogs/_dialog";
import colorlegend from "components/colorlegend/colorlegend";
import indicatorpicker from "components/indicatorpicker/indicatorpicker";

/*!
 * VIZABI COLOR DIALOG
 */

const Mapcolors = Dialog.extend({

  /**
   * Initializes the dialog component
   * @param config component configuration
   * @param parent component context (parent)
   */
  init(config, parent) {
    this.name = "mapcolors";

    this.components = [{
      component: indicatorpicker,
      placeholder: ".vzb-caxis-selector",
      model: ["state.time", "state.entities", "state.marker", "locale"],
      markerID: "color_map",
      showHoverValues: true
    }, {
      component: colorlegend,
      placeholder: ".vzb-clegend-container",
      model: ["state.time", "state.entities", "state.marker", "state.marker.color_map", "locale"]
    }];


    this._super(config, parent);
  }

});

export default Mapcolors;
