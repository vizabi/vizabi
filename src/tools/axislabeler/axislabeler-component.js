import * as utils from "base/utils";
import Component from "base/component";

import axisSmart from "helpers/d3.axisWithLabelPicker";


//BAR CHART COMPONENT
const AxisLabelerComponent = Component.extend({

  /**
   * Initializes the component (Bar Chart).
   * Executed once before any template is rendered.
   * @param {Object} config The options passed to the component
   * @param {Object} context The component's parent
   */
  init(config, context) {
    this.name = "axislabeler";
    this.template = require("./axislabeler.html");

    //define expected models for this component
    this.model_expects = [{ name: "scales" }, { name: "show" }];

    const _this = this;

    this.model_binds = {
      "change:scales": function(evt) {
        _this.initScales();
        _this.update();
      },
      "change:show": function(evt, path) {
        _this.initScales();
        _this.update();
      }
    };

    //contructor is the same as any component
    this._super(config, context);

    this.xScale = null;
    this.yScale = null;

    this.xAxis = axisSmart("bottom");
    this.yAxis = axisSmart("left");
  },

  /**
   * DOM is ready
   */
  readyOnce() {
    const _this = this;
    this.element = d3.select(this.element);

    // reference elements
    this.graph = this.element.select(".vzb-al-graph");
    this.xAxisEl = this.graph.select(".vzb-al-axis-x");
    this.yAxisEl = this.graph.select(".vzb-al-axis-y");

    //$(".vzb-bc-axis-x, .vzb-bc-axis-y").css('font-size',this.model.show.labelSize);
    this.xInvert = function(d) { return _this.xScale(_this.xScale.invert(_this.xScale(d))); };
    this.yInvert = function(d) { return _this.yScale(_this.yScale.invert(_this.yScale(d))); };

    this.line = d3.svg.line()
      .x(d => _this.xScale(d))
      .y(d => _this.yScale(d));

    this.lineInvert = d3.svg.line()
      .x(d => _this.xInvert(d))
      .y(d => _this.yInvert(d));

    //component events
    this.on("resize", () => {
      _this.update();
    });
  },

  /*
   * Both model and DOM are ready
   */
  ready() {
    console.log("Model ready");
    this.initScales();
    this.update();
  },

  initScales() {
    const _this = this;

    const domain = this.model.scales.domain;

    this.xScale = d3.scale[this.model.scales.xScaleType]();
    this.yScale = d3.scale[this.model.scales.yScaleType]();

    this.xScale.domain(domain);

    this.yScale.domain(domain);

    this.mockData = d3.range(domain[0], domain[domain.length - 1], (domain[domain.length - 1] - domain[0]) / 10000);
    this.mockData.push(domain[domain.length - 1]);
  },


  update() {
    const _this = this;

    const margin = this.model.show.toolMargin.getPlainObject();

    //stage
    const height = (parseInt(this.element.style("height"), 10) - margin.top - margin.bottom) || 0;
    const width = (parseInt(this.element.style("width"), 10) - margin.left - margin.right) || 0;

    if (height <= 0 || width <= 0) return utils.warn("Axis Labeler update() call interrupted for Vizabi container is too little or has display:none");

    //graph group is shifted according to margins (while svg element is at 100 by 100%)
    this.graph.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //update scales to the new range
    const xLength = this.xScale.domain().length;
    const yLength = this.yScale.domain().length;
    this.xScale.range(d3.range(xLength).map(n => width / (xLength - 1) * n)); //.nice();
    this.yScale.range(d3.range(yLength).map(n => height / (yLength - 1) * n).reverse()); //.nice();

    this.xAxis.scale(this.xScale)
      .tickSize(6, 0)
      .tickSizeMinor(3, 0)
      .labelerOptions({
        scaleType: this.model.scales.xScaleType,
        toolMargin: margin
      });

    this.yAxis.scale(this.yScale)
      .tickSize(6, 0)
      .tickSizeMinor(3, 0)
      .labelerOptions({
        scaleType: this.model.scales.yScaleType,
        toolMargin: margin
      });


    this.xAxisEl.attr("transform", "translate(0," + height + ")");
    this.xAxisEl.call(this.xAxis);
    this.yAxisEl.call(this.yAxis);

    //TODO: remove. make font sizing through plain CSS
    //this.xAxisEl.selectAll("text").style('font-size',this.model.show.labelSize);
    //this.yAxisEl.selectAll("text").style('font-size',this.model.show.labelSize);


    const path = this.graph.selectAll(".vzb-al-line").data([0]);
    path.enter().append("path")
      .attr("class", "vzb-al-line");
    path.datum(this.mockData).attr("d", this.line);

    const pathInvert = this.graph.selectAll(".vzb-al-line-invert").data([0]);
    pathInvert.enter().append("path")
      .attr("class", "vzb-al-line-invert");
    pathInvert.datum(this.mockData).attr("d", this.lineInvert);

    const format = d3.format(".4r");

    const dots = this.graph.selectAll(".vzb-al-dots").data(this.mockData);
    dots.enter().append("circle")
      .attr("class", "vzb-al-dots")
      .attr("r", 5)
      .on("mouseenter", (d, i) => {
        console.log("Point #" + i + ": " + d + " x=" + format(_this.xScale(d)) + " y=" + format(_this.yScale(d)));
      });
    dots.exit().remove();
    dots.attr("cx", d => _this.xScale(d))
      .attr("cy", d => _this.yScale(d));

    const dotsInvert = this.graph.selectAll(".vzb-al-dots-invert").data(this.mockData);
    dotsInvert.enter().append("circle")
      .attr("class", "vzb-al-dots-invert")
      .attr("r", 5)
      .on("mouseenter", (d, i) => {
        console.log("Point #" + i + ": " + d + " x=" + format(_this.xScale(d)) + " y=" + format(_this.yScale(d)));
      });
    dotsInvert.exit().remove();
    dotsInvert.attr("cx", d => _this.xInvert(d))
      .attr("cy", d => _this.yInvert(d));
  }
});


export default AxisLabelerComponent;
