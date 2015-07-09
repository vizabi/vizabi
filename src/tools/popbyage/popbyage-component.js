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
          _this._updateEntities();
        },
        "change:age:select": function (evt) {
          _this._selectBars();
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
      this.labels = this.graph.select('.vzb-bc-labels');

      //only allow selecting one at a time
      this.model.age.selectMultiple(false);

      var _this = this;
      this.on("resize", function () {
        _this._updateEntities();
      });
    },

    /*
     * Both model and DOM are ready
     */
    ready: function () {

      this.AGEDIM = this.model.age.getDimension();
      this.TIMEDIM = this.model.time.getDimension();

      this._updateIndicators();
      this.resize();
      this._updateEntities();
    },

    /**
     * Changes labels for indicators
     */
    _updateIndicators: function () {
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
    _updateEntities: function () {

      var _this = this;
      var time = this.model.time;
      var timeFormatter = d3.time.format(this.model.time.formatInput);
      var ageDim = this.AGEDIM;
      var timeDim = this.TIMEDIM;
      var duration = (time.playing) ? time.speed : 0;
      var filter = {};
      filter[timeDim] = time.value;
      var items = this.model.marker.getKeys(filter);
      var values = this.model.marker.getValues(filter, [ageDim]);

      this.model.age.setVisible(items);

      this.entityBars = this.bars.selectAll('.vzb-bc-bar')
        .data(items);

      this.entityLabels = this.labels.selectAll('.vzb-bc-label')
        .data(items);

      //exit selection
      this.entityBars.exit().remove();
      this.entityLabels.exit().remove();

      var highlight = this._highlightBar.bind(this);
      var unhighlight = this._unhighlightBars.bind(this)

      //enter selection -- init bars
      this.entityBars.enter().append("g")
          .attr("class", "vzb-bc-bar")
          .attr("id", function(d) {
            return  "vzb-bc-bar-"+d[ageDim];
          })
          .on("mousemove", highlight)
          .on("mouseout", unhighlight)
          .on("click", function (d, i) {
            _this.model.age.selectEntity(d);
          })
          .append('rect');

      this.entityLabels.enter().append("g")
          .attr("class", "vzb-bc-label")
          .attr("id", function(d) {
            return  "vzb-bc-label-"+d[ageDim];
          })
          .on("mousemove", highlight)
          .on("mouseout", unhighlight)
          .append('text')
          .attr("class", "vzb-bc-age");


      var barWidth = this.height / items.length;

      this.bars.selectAll('.vzb-bc-bar > rect')
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

      this.labels.selectAll('.vzb-bc-label > .vzb-bc-age')
               .text(function(d) {
                  var formatter = _this.model.marker.axis_x.tickFormatter;
                  return values.axis_y[d[ageDim]] + "-year-olds in "+timeFormatter(time.value) + ": "+formatter(values.axis_x[d[ageDim]]);
               })
               .attr("x", 7)
               .attr("y", function (d) {
                  return _this.yScale(values.axis_y[d[ageDim]]) - barWidth - 10;
               })
               .style("fill", function (d) {
                  var color = _this.cScale(values.color[d[ageDim]]);
                  return d3.rgb(color).darker(2);
               });
    },

    /**
     * Highlight and unhighlight labels
     */
    _unhighlightBars: function() {
      this.bars.classed('vzb-dimmed', false);
      this.bars.selectAll('.vzb-bc-bar.vzb-hovered').classed('vzb-hovered', false);
      this.labels.selectAll('.vzb-hovered').classed('vzb-hovered', false);
    },

    _highlightBar: function(d) {
      this.bars.classed('vzb-dimmed', true);
      var curr =  this.bars.select("#vzb-bc-bar-"+d[this.AGEDIM]);
      curr.classed('vzb-hovered', true);
      var label = this.labels.select("#vzb-bc-label-"+d[this.AGEDIM]);
      label.classed('vzb-hovered', true);
    },

    /**
     * Select Entities
     */
    _selectBars: function() {
      var _this = this;
      var AGEDIM = this.AGEDIM;
      var selected = this.model.age.select;

      this._unselectBars();

      if(selected.length) {
        this.bars.classed('vzb-dimmed-selected', true);
        utils.forEach(selected, function(s) {
          _this.bars.select("#vzb-bc-bar-"+s[AGEDIM]).classed('vzb-selected', true);
          _this.labels.select("#vzb-bc-label-"+s[AGEDIM]).classed('vzb-selected', true);
        });
      }
    },

    _unselectBars: function() {
      this.bars.classed('vzb-dimmed-selected', false);
      this.bars.selectAll('.vzb-bc-bar.vzb-selected').classed('vzb-selected', false);
      this.labels.selectAll('.vzb-selected').classed('vzb-selected', false);
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

    }
  });


}).call(this);
