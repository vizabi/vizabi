import * as utils from "base/utils";
import Component from "base/component";
import Dialog from "components/dialogs/_dialog";

import bubblesize from "components/brushslider/bubblesize/bubblesize";
import indicatorpicker from "components/indicatorpicker/indicatorpicker";
/*
 * Size dialog
 */

const Size = Dialog.extend("size", {

/**
 * Initializes the dialog component
 * @param config component configuration
 * @param context component context (parent)
 */
  init(config, parent) {
    this.name = "size";
    const _this = this;

    // in dialog, this.model_expects = ["state", "ui", "locale"];

    this.model_binds = {
      "change:state.marker.size.which": function(evt) {
        if (!_this._readyOnce) return;
        _this.updateSubtitle();
      },
      "translate:locale": function() {
        if (!_this._readyOnce) return;
        _this.updateSubtitle();
      }
    };

    this.components = [
      {
        component: indicatorpicker,
        placeholder: ".vzb-saxis-selector",
        model: ["state.time", "state.marker.size", "locale"],
        showHoverValues: true
      }
    ];

    // config.ui is same as this.model.ui here but this.model.ui is not yet available because constructor hasn't been called.
    // can't call constructor earlier because this.components needs to be complete before calling constructor
    if (!config.ui.chart || config.ui.chart.sizeSelectorActive !== 0) {
      this.components.push({
        component: bubblesize,
        placeholder: ".vzb-dialog-bubblesize",
        model: ["state.marker.size", "locale"],
        ui: {
          show_button: false
        }
      });
    }

    this._super(config, parent);
  },

  readyOnce() {
    this._super();
    this.updateSubtitle();
  },

  updateSubtitle() {
    const conceptProps = this.model.state.marker.size.getConceptprops();
    const subtitle = utils.getSubtitle(conceptProps.name, conceptProps.name_short);

    this.element.select(".vzb-dialog-subtitle").text(subtitle);
  }
});

export default Size;
