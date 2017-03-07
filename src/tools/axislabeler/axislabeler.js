/*!
 * VIZABI BARCHART
 */

import * as utils from "base/utils";
import Tool from "base/tool";

import AxisLabelerComponent from "tools/axislabeler/axislabeler-component";

const comp_template = "axislabeler.html";

const listPointer = 0;
const listData = [
    [-123, 123],
    [1.00000, 10000.0],
    [4.00000, 123.000],
    [0.00060, 123.000],
    [123.000, 4.00000],
    [123.000, 0.00060],
    [-123.00, -4.0000],
    [-123.00, -0.0006],
    [-4.0000, -123.00],
    [-0.0006, -123.00],
    [-123.00, 1800.00],
    [1800.00, -123.00],
    [123.000, -18000.0],
    [-18000.0, 123.000],
    [-0.0006, 1800.00],
    [1800.00, -0.0006],
    [0.00060, -1800.0],
    [-1800.0, 0.00060],
    [-12.000, -2.0000],
    [-80.000, 40.0000],
    [5.00000, 8.00000],
    [42.0000, 42.0000],
    [0.00000000005, 4554545484715],
    [-2611968678575, 4554545484715],
    [-0.0020, 0.00200],
    [-123, -0.1, 0.002, 1540],
    [-123, -0.001, 0.5, 1540],
    [123, 0.1, -0.002, -1540],
    [123, 0.001, -0.5, -1540]
];

//AXIS LABELER TOOL
const AxisLabeler = Tool.extend("AxisLabeler", {

  /**
   * Initializes the tool (Bar Chart Tool).
   * Executed once before any template is rendered.
   * @param {Object} placeholder Placeholder element for the tool
   * @param {Object} external_model Model as given by the external page
   */
  init(placeholder, external_model) {

    this.name = "axislabeler";

    //specifying components
    this.components = [{
      component: AxisLabelerComponent,
      placeholder: ".vzb-tool-viz",
      model: ["state.scales", "state.show"] //pass models to component
    }];

    //constructor is the same as any tool
    this._super(placeholder, external_model);
  },

  default_model: {
    state: {
      scales: {
        domain: listData[listPointer],
        xScaleType: "linear",
        yScaleType: "genericLog"
      },
      show: {
        labelSize: "16px",
        labelMargin: { LR: "5px", TB: "5px" },
        toolMargin: { top: 30, right: 20, left: 40, bottom: 40 }
      }

    },
    data: { noConceptprops: true },
    locale: { },
    ui: { }
  }
});

export default AxisLabeler;
