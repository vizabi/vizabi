import * as utils from "base/utils";
import Component from "base/component";


// Sankey Component
const SankeyComponent = Component.extend({

	/**
	 * Initializes the component (Sankey Chart).
	 * Executed once before any template is rendered.
	 * @param {Object} config The options passed to the component
	 * @param {Object} context The component's parent
	 */
  init(config, context) {
    this.name = "sankeydiagram";
    this.template = require("./sankeydiagram.html");

		// expectectations for model
    this.model_expects = [{
      name: "time",
      type: "time"
    }, {
      name: "entities",
      type: "entities"
    }, {
      name: "marker",
      type: "model"
    }, {
      name: "locale",
      type: "locale"
    }];

    const _this = this;


  }
});
