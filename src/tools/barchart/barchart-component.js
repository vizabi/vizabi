import * as utils from "base/utils";
import Component from "base/component";

import axisSmart from "helpers/d3.axisWithLabelPicker";


//BAR CHART COMPONENT
const BarComponent = Component.extend({

  /**
   * Initializes the component (Bar Chart).
   * Executed once before any template is rendered.
   * @param {Object} config The options passed to the component
   * @param {Object} context The component's parent
   */
  init(config, context) {
    this.name = "barchart";
    this.template = require("./barchart.html");

    //define expected models for this component
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

    this.model_binds = {
      "change:time.value": function(evt) {
        _this.model.marker.getFrame(_this.model.time.value, values => {
          _this.values = values;
          _this.updateEntities();
        });
      },
      "change:marker": function(evt, path) {
        if (!_this._readyOnce) return;
        if (path.indexOf("color.palette") > -1) return;
        if (path.indexOf("which") > -1 || path.indexOf("use") > -1) return;

        _this.ready();
      },
      "change:marker.color.palette": utils.debounce(evt => {
        if (!_this._readyOnce) return;
        _this.updateEntities();
      }, 200)
    };

    //contructor is the same as any component
    this._super(config, context);

    this.xScale = null;
    this.yScale = null;
    this.cScale = d3.scale.category10();

    this.xAxis = axisSmart("bottom");
    this.yAxis = axisSmart("left");
  },

  /**
   * DOM is ready
   */
  readyOnce() {
    this.element = d3.select(this.element);

    this.graph = this.element.select(".vzb-bc-graph");
    this.yAxisEl = this.graph.select(".vzb-bc-axis-y");
    this.xAxisEl = this.graph.select(".vzb-bc-axis-x");
    this.yTitleEl = this.graph.select(".vzb-bc-axis-y-title");
    this.xTitleEl = this.graph.select(".vzb-bc-axis-x-title");
    this.bars = this.graph.select(".vzb-bc-bars");
    this.year = this.element.select(".vzb-bc-year");

    const _this = this;
    this.on("resize", () => {
      _this.updateEntities();
    });
  },

  /*
   * Both model and DOM are ready
   */
  ready() {
    const _this = this;
    this.model.marker.getFrame(this.model.time.value, values => {
      _this.values = values;
      _this.updateIndicators();
      _this.resize();
      _this.updateEntities();
    });

  },

  /**
   * Changes labels for indicators
   */
  updateIndicators() {

    const _this = this;
    this.translator = this.model.locale.getTFunction();
    this.duration = this.model.time.delayAnimations;

    const titleStringY = this.translator("indicator/" + this.model.marker.axis_y.which);
    const titleStringX = this.translator("indicator/" + this.model.marker.axis_x.which);

    const yTitle = this.yTitleEl.selectAll("text").data([0]);
    yTitle.enter().append("text");
    yTitle
      .attr("y", "-6px")
      .attr("x", "-9px")
      .attr("dx", "-0.72em")
      .text(titleStringY)
      .on("click", () => {
        //TODO: Optimise updateView
        _this.parent
          .findChildByName("gapminder-treemenu")
          .markerID("axis_y")
          .alignX("left")
          .alignY("top")
          .updateView()
          .toggle();
      });

    const xTitle = this.xTitleEl.selectAll("text").data([0]);
    xTitle.enter().append("text");
    xTitle
      .attr("y", "-3px")
      .attr("dx", "-0.72em")
      .text(titleStringX)
      .on("click", () => {
        //TODO: Optimise updateView
        _this.parent
          .findChildByName("gapminder-treemenu")
          .markerID("axis_x")
          .alignY("bottom")
          .alignX("center")
          .updateView()
          .toggle();
      });

    this.yScale = this.model.marker.axis_y.getScale();
    this.xScale = this.model.marker.axis_x.getScale();
    this.cScale = this.model.marker.color.getScale();

    const xFormatter = this.model.marker.axis_x.which == "geo.world_4region" ?
        function(x) { return _this.translator("entity/geo.world_4region/" + x); }
        :
        _this.model.marker.axis_x.getTickFormatter();

    this.yAxis.tickFormat(_this.model.marker.axis_y.getTickFormatter());
    this.xAxis.tickFormat(xFormatter);

  },

  /**
   * Updates entities
   */
  updateEntities() {

    const _this = this;
    const time = this.model.time;
    const timeDim = time.getDimension();
    const entityDim = this.model.entities.getDimension();
    const duration = (time.playing) ? time.delayAnimations : 0;
    const filter = {};
    filter[timeDim] = time.value;
    const items = this.model.marker.getKeys(filter);

    this.entityBars = this.bars.selectAll(".vzb-bc-bar")
      .data(items);

    //exit selection
    this.entityBars.exit().remove();

    //enter selection -- init circles
    this.entityBars.enter().append("rect")
      .attr("class", "vzb-bc-bar")
      .on("mousemove", (d, i) => {})
      .on("mouseout", (d, i) => {})
      .on("click", (d, i) => {});

    //positioning and sizes of the bars

    const bars = this.bars.selectAll(".vzb-bc-bar");
    const barWidth = this.xScale.rangeBand();

    this.bars.selectAll(".vzb-bc-bar")
      .attr("width", barWidth)
      .attr("fill", d => _this.cScale(_this.values.color[d[entityDim]]))
      .attr("x", d => _this.xScale(_this.values.axis_x[d[entityDim]]))
      .transition().duration(duration).ease(d3.easeLinear)
      .attr("y", d => _this.yScale(_this.values.axis_y[d[entityDim]]))
      .attr("height", d => _this.height - _this.yScale(_this.values.axis_y[d[entityDim]]));
    this.year.text(this.model.time.formatDate(this.model.time.value));
  },

  /**
   * Executes everytime the container or vizabi is resized
   * Ideally,it contains only operations related to size
   */
  resize() {

    const _this = this;

    this.profiles = {
      "small": {
        margin: {
          top: 30,
          right: 20,
          left: 40,
          bottom: 50
        },
        padding: 2,
        minRadius: 2,
        maxRadius: 40
      },
      "medium": {
        margin: {
          top: 30,
          right: 60,
          left: 60,
          bottom: 60
        },
        padding: 2,
        minRadius: 3,
        maxRadius: 60
      },
      "large": {
        margin: {
          top: 30,
          right: 60,
          left: 60,
          bottom: 80
        },
        padding: 2,
        minRadius: 4,
        maxRadius: 80
      }
    };

    this.activeProfile = this.profiles[this.getLayoutProfile()];
    const margin = this.activeProfile.margin;


    //stage
    this.height = (parseInt(this.element.style("height"), 10) - margin.top - margin.bottom) || 0;
    this.width = (parseInt(this.element.style("width"), 10) - margin.left - margin.right) || 0;

    if (this.height <= 0 || this.width <= 0) return utils.warn("Bar chart resize() abort: vizabi container is too little or has display:none");

    this.graph
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //update scales to the new range
    if (this.model.marker.axis_y.scaleType !== "ordinal") {
      this.yScale.range([this.height, 0]);
    } else {
      this.yScale.rangePoints([this.height, 0], _this.activeProfile.padding).range();
    }
    if (this.model.marker.axis_x.scaleType !== "ordinal") {
      this.xScale.range([0, this.width]);
    } else {
      this.xScale.rangePoints([0, this.width], _this.activeProfile.padding).range();
    }

    //apply scales to axes and redraw
    this.yAxis.scale(this.yScale)
      .tickSize(6, 0)
      .tickSizeMinor(3, 0)
      .labelerOptions({
        scaleType: this.model.marker.axis_y.scaleType,
        timeFormat: this.model.time.getFormatter(),
        toolMargin: { top: 5, right: margin.right, left: margin.left, bottom: margin.bottom },
        limitMaxTickNumber: 6
      });

    this.xAxis.scale(this.xScale)
      .tickSize(6, 0)
      .tickSizeMinor(3, 0)
      .labelerOptions({
        scaleType: this.model.marker.axis_x.scaleType,
        timeFormat: this.model.time.getFormatter(),
        toolMargin: margin,
        viewportLength: this.width
      });

    this.xAxisEl.attr("transform", "translate(0," + this.height + ")")
      .call(this.xAxis);

    this.xScale.rangeRoundBands([0, this.width], 0.1, 0.2);

    this.yAxisEl.call(this.yAxis);
    this.xAxisEl.call(this.xAxis);

    const xAxisSize = this.xAxisEl.node().getBoundingClientRect();
    const xTitleSize = this.xTitleEl.node().getBoundingClientRect();
    const xTitleXPos = xAxisSize.width / 2 - xTitleSize.width / 2;
    const xTitleYPos = this.height + xAxisSize.height + xTitleSize.height;
    this.xTitleEl.attr("transform", "translate(" + xTitleXPos + "," + xTitleYPos + ")");
    this.year.attr("x", this.width).attr("y", 0);
  }
});


export default BarComponent;
