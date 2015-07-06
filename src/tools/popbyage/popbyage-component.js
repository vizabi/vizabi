/*!
 * VIZABI POP BY AGE Component
 */

(function () {

  "use strict";

  var Vizabi = this.Vizabi;
  var utils = Vizabi.utils;

  //warn client if d3 is not defined
  if (!Vizabi._require('d3')) return;

  //POP BY AGE CHART COMPONENT
  Vizabi.Component.extend('gapminder-popbyage', {

    /**
     * Initializes the component (Bar Chart).
     * Executed once before any template is rendered.
     * @param {Object} config The options passed to the component
     * @param {Object} context The component's parent
     */
    init: function (config, context) {
      this.name = 'popbyage';
      this.template = 'src/tools/popbyage/popbyage.html';

      //define expected models for this component
      this.model_expects = [{
        name: "time",
        type: "time"
      }, {
        name: "entities",
        type: "entities"
      }, {
        name: "age",
        type: "entities"
      },{
        name: "marker",
        type: "model"
      }, {
        name: "language",
        type: "language"
      }];

      var _this = this;
      this.model_binds = {
        "change:time:value": function (evt) {
          _this.updateEntities();
        }
      };

      //contructor is the same as any component
      this._super(config, context);

      this.xScale = null;
      this.yScale = null;
      this.cScale = d3.scale.category10();

      this.xAxis = d3.svg.axisSmart();
      this.yAxis = d3.svg.axisSmart();
    },

    /**
     * DOM is ready
     */
    readyOnce: function () {

      this.element = d3.select(this.element);

      this.graph = this.element.select('.vzb-bc-graph');
      this.yAxisEl = this.graph.select('.vzb-bc-axis-y');
      this.xAxisEl = this.graph.select('.vzb-bc-axis-x');
      this.yTitleEl = this.graph.select('.vzb-bc-axis-y-title');
      this.bars = this.graph.select('.vzb-bc-bars');

      var _this = this;
      this.on("resize", function () {
        _this.updateEntities();
      });
    },

    /*
     * Both model and DOM are ready
     */
    ready: function () {
      this.updateIndicators();
      this.resize();
      this.updateEntities();
    },

    /**
     * Changes labels for indicators
     */
    updateIndicators: function () {
      var _this = this;
      this.translator = this.model.language.getTFunction();
      this.duration = this.model.time.speed;

      var titleStringY = this.translator("indicator/" + this.model.marker.axis_y.which);

      var yTitle = this.yTitleEl.selectAll("text").data([0]);
      yTitle.enter().append("text");
      yTitle
        .attr("y", "-6px")
        .attr("x", "-9px")
        .attr("dx", "-0.72em")
        .text(titleStringY);

      this.yScale = this.model.marker.axis_y.getScale(false);
      this.xScale = this.model.marker.axis_x.getScale(false);
      this.cScale = this.model.marker.color.getScale();

      this.yAxis.tickFormat(_this.model.marker.axis_y.tickFormatter);
      this.xAxis.tickFormat(_this.model.marker.axis_x.tickFormatter);
    },

    /**
     * Updates entities
     */
    updateEntities: function () {

      var _this = this;
      var time = this.model.time;
      var timeDim = time.getDimension();
      var ageDim = this.model.age.getDimension();
      var duration = (time.playing) ? time.speed : 0;
      var filter = {};
      filter[timeDim] = time.value;
      var items = this.model.marker.getKeys(filter);
      var values = this.model.marker.getValues(filter, [ageDim]);

      this.entityBars = this.bars.selectAll('.vzb-bc-bar')
        .data(items);

      //exit selection
      this.entityBars.exit().remove();

      //enter selection -- init circles
      this.entityBars.enter().append("rect")
        .attr("class", "vzb-bc-bar")
        .on("mousemove", function (d, i) {
          _this.bars.selectAll('.vzb-bc-bar').classed('vzb-dimmed', true);
          var curr = d3.select(this);
          curr.classed('vzb-dimmed', false);
          curr.classed('vzb-hovered', true);
        })
        .on("mouseout", function (d, i) {
          _this.bars.selectAll('.vzb-bc-bar.vzb-dimmed').classed('vzb-dimmed', false);
          _this.bars.selectAll('.vzb-bc-bar.vzb-hovered').classed('vzb-hovered', false);
        })
        .on("click", function (d, i) {
        });

      //positioning and sizes of the bars

      var bars = this.bars.selectAll('.vzb-bc-bar');
      var barWidth = this.height / items.length;

      this.bars.selectAll('.vzb-bc-bar')
        .attr("fill", function (d) {
          return _this.cScale(values.color[d[ageDim]]);
        })
        .style("stroke", function (d) {
          return _this.cScale(values.color[d[ageDim]]);
        })
        .attr("x", 0)
        .transition().duration(duration).ease("linear")
        .attr("y", function (d) {
          return _this.yScale(values.axis_y[d[ageDim]]) - barWidth;
        })
        .attr("height", barWidth)
        .attr("width", function (d) {
          return _this.xScale(values.axis_x[d[ageDim]]);
        });
    },

    /**
     * Executes everytime the container or vizabi is resized
     * Ideally,it contains only operations related to size
     */
    resize: function () {

      var _this = this;

      this.profiles = {
        "small": {
          margin: {
            top: 30,
            right: 20,
            left: 40,
            bottom: 40
          },
          minRadius: 2,
          maxRadius: 40
        },
        "medium": {
          margin: {
            top: 30,
            right: 60,
            left: 60,
            bottom: 40
          },
          minRadius: 3,
          maxRadius: 60
        },
        "large": {
          margin: {
            top: 30,
            right: 60,
            left: 60,
            bottom: 40
          },
          minRadius: 4,
          maxRadius: 80
        }
      };

      this.activeProfile = this.profiles[this.getLayoutProfile()];
      var margin = this.activeProfile.margin;


      //stage
      this.height = parseInt(this.element.style("height"), 10) - margin.top - margin.bottom;
      this.width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;

      this.graph
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      //update scales to the new range
      if (this.model.marker.axis_y.scaleType !== "ordinal") {
        this.yScale.range([this.height, 0]);
      } else {
        this.yScale.rangePoints([this.height, 0]).range();
      }
      if (this.model.marker.axis_x.scaleType !== "ordinal") {
        this.xScale.range([0, this.width]);
      } else {
        this.xScale.rangePoints([0, this.width]).range();
      }

      //apply scales to axes and redraw
      this.yAxis.scale(this.yScale)
        .orient("left")
        .tickSize(6, 0)
        .tickSizeMinor(3, 0)
        .labelerOptions({
          scaleType: this.model.marker.axis_y.scaleType,
          toolMargin: margin,
          limitMaxTickNumber: 6
        });

      this.xAxis.scale(this.xScale)
        .orient("bottom")
        .tickSize(6, 0)
        .tickSizeMinor(3, 0)
        .labelerOptions({
          scaleType: this.model.marker.axis_x.scaleType,
          toolMargin: margin,
          limitMaxTickNumber: 6
        });

      this.xAxisEl.attr("transform", "translate(0," + this.height + ")")
        .call(this.xAxis);

      this.yAxisEl.call(this.yAxis);
      this.xAxisEl.call(this.xAxis);

    },

    drawBars: function () {

    }
  });


}).call(this);
