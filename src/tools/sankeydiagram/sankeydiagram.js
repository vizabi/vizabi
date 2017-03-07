import * as utils from "base/utils";
import Tool from "base/tool";
import SankeyComponent from "tools/sankeydiagram/sankey-component";

// SANKEY TOOL
const SankeyDiagram = Tool.extend("SankeyDiagram", {

	/**
	 * Initializes the tool (Bar Chart Tool).
	 * Executed once before any template is rendered.
	 * @param {Object} placeholder Placeholder element for the tool
	 * @param {Object} external_model Model as given by the external page
	 */
	init(placeholder, external_model) {
		this.name = "sankeydiagram";

		// specify components
		this.components = [{
			component: SankeyComponent
			placeholder: ".vzb-tool-viz",
			model: ["state.time", "state.entities", "state.marker", "locale"]
		}, {
			component: dialogs,
			placeholder: ".vzb-tool-dialogs",
			model: ["state", "ui", "locale"]
		}, {
			component: buttonlist,
			placeholder: ".vzb-tool-buttonlist",
			model: ["state", "ui", "locale"]
		}];

		// constructor for tool
		this.__super(placeholder, external_model);
	},


	default_model: {
		state: {
			time: {},
			entities: {},
			marker: {
				label: {},
				axis_y: {
					allow: {
						scales: ["linear", "log"]
					}
				},
				axis_x: {
					allow: {
						scales: ["ordinal", "nominal"]
					}
				},
				color: {}
			}
		},
		locale: {},
		ui: {
			presentation: false,
			chart: {},
			"buttons": ["axes", "colors", "fullscreen"],
			"dialogs": {
				"popup": ["axes", "colors"]
			},
		}
	}
});

export default SannkeyDiagram;
})
