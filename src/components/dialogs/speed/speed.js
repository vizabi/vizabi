import * as utils from "base/utils";
import Component from "base/component";
import Dialog from "components/dialogs/_dialog";

import singlehandleslider from "components/brushslider/singlehandleslider/singlehandleslider";
import simplecheckbox from "components/simplecheckbox/simplecheckbox";


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
        placeholder: ".vzb-speed-slider",
        model: ["state.time", "locale"],
        arg: "delay",
        properties: {
          domain: [1200, 900, 450, 200, 150, 100],
          roundDigits: 0
        }
      },
      {
        component: simplecheckbox,
        placeholder: ".vzb-showforecast-switch",
        model: ["state.time", "locale"],
        checkbox: "showForecast"
      },
      {
        component: simplecheckbox,
        placeholder: ".vzb-pausebeforeforecast-switch",
        model: ["state.time", "locale"],
        checkbox: "pauseBeforeForecast"
      },
      {
        component: simplecheckbox,
        placeholder: ".vzb-showstripedpatternwhenforecast-switch",
        model: ["ui.chart", "locale"],
        checkbox: "showForecastOverlay"
      }
    ];

    this._super(config, parent);
  },

  readyOnce() {
    this._super();
    const _this = this;

    this.timeFormatExampleEl = this.element.select(".vzb-timeformatexample-label");

    this.forecastFieldEl = this.element.select(".vzb-endbeforeforecast-field")
      .on("keypress", function() {
        if (d3.event.charCode == 13 || d3.event.keyCode == 13) {
          //this prevents form submission action with subsequent page reload
          d3.event.preventDefault();
          this.blur();
        }
      })
      .on("change", function() {
        const parsed = _this.model.state.time.parse(this.value);
        if (utils.isDate(parsed)) {
          _this.model.state.time.endBeforeForecast = parsed;
        }
      });

    this.updateView();
  },

  updateView() {
    this.forecastFieldEl.property("value",
      this.model.state.time.formatDate(this.model.state.time.endBeforeForecast)
    );
    this.timeFormatExampleEl.text(this.model.state.time.formatDate(new Date()));
  }
});

export default Speed;
