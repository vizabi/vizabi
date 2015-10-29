import * as utils from 'base/utils';
import Component from 'base/component';
import DynamicBackground from 'helpers/d3.dynamicBackground';
import axisWithLabelPicker from 'helpers/d3.axisWithLabelPicker';


/*!
 * VIZABI POP BY AGE Component
 */


//POP BY AGE CHART COMPONENT
var BarRankChart = Component.extend({

  values: {}, // values for all the hooks

  /**
   * Initializes the component (Bar Chart).
   * Executed once before any template is rendered.
   * @param {Object} config The options passed to the component
   * @param {Object} context The component's parent
   */
  init: function(config, context) {

    this.name = 'barrankchart';
    this.template = 'barrank.html';

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
      name: "language",
      type: "language"
    }, {
      name: "ui",
      type: "model"
    }];

    var _this = this;
    this.model_binds = {
      "change:time:value": function(evt) {
        _this.onTimeChange();
      }
    };

    //contructor is the same as any component
    this._super(config, context);

    // set up the scales
    this.xScale = null;
    this.cScale = d3.scale.category10();

    // set up the axes
    this.xAxis = axisWithLabelPicker();
  },

  onTimeChange: function() {
    this.year.setText(this.timeFormatter(this.model.time.value));

    this.loadData();
    this.draw();
  },

  /**
   * DOM and model are ready
   */
  readyOnce: function() {
    this.element = d3.select(this.element);

    // reference elements
    this.graph = this.element.select('.vzb-br-graph');
    this.yearEl = this.graph.select('.vzb-br-year');
    this.year = new DynamicBackground(this.yearEl);
    this.barContainer = this.graph.select('.vzb-br-bars');
    this.xAxisEl = this.graph.select('.vzb-br-axis-x');

    // set up time formatter for time
    this.timeFormatter = d3.time.format(this.model.time.formatOutput);

    // set up scales and axes
    this.xScale = this.model.marker.axis_x.getScale(false);
    this.cScale = this.model.marker.color.getScale();

    this.xAxis.tickFormat(this.model.marker.axis_x.tickFormatter);

  },

  /*
   * Both model and DOM are ready
   */
  ready: function() {

    this.loadData();
    this.draw();

  },

  resize: function() {
    this.draw();
  },

  loadData: function() {

    // get data, for the active year. Nest them using the entity of the graph
    var filter = {};
    filter[this.model.time.dim] = this.model.time.value;
    this.values = this.model.marker.getValues(filter, [this.model.entities.dim]);

    // sort the data
    this.sorted_entities = this.sortByIndicator(this.values.axis_x);
  },

  /*
  * draw the chart/stage
  */
  draw: function() {

    this.bar_height = 20;
    var margin = {top: 20, bottom: 40, left: 90, right: 20};

    //stage
    this.height = parseInt(this.element.style("height"), 10) - margin.top - margin.bottom;
    this.width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;

    this.graph
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    if(this.model.marker.axis_x.scaleType !== "ordinal") {
      this.xScale.range([0, this.width]);
    } else {
      this.xScale.rangePoints([0, this.width]).range();
    }

    // redraw the limits
    var limits = this.model.marker.axis_x.getLimits(this.model.marker.axis_x.which);
    this.xScale = this.xScale.domain([limits.min, limits.max]);

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

    this.xAxisEl.call(this.xAxis);

    this.drawData();
  },

  drawData: function() {

    var _this = this;
    var bar_margin = 2;
    var duration = (this.model.time.playing) ? this.model.time.delayAnimations : 0;

    var updatedBars = this.barContainer
      .selectAll('.vzb-br-bar')
      .data(this.sorted_entities, getDataKey)
      .order();

    // update the shown bars for new data-set
    this.createAndDeleteBars(updatedBars);

    // set position of the bars
    this.barContainer
      .selectAll('.vzb-br-bar > rect')
      .data(this.sorted_entities, getDataKey)     
      .transition().duration(duration).ease("linear")
      .attr("width", function(d) {
        var width = _this.xScale(d.value);
        return width > 0 ? width : 0;
      })
      .attr("y", function(d, i) {
        return (_this.bar_height+bar_margin)*i;
      });

    // it would be nice if the two y-attribute setting below could be combined, but due to the .data you can't
    // set position of all labels
    this.barContainer
      .selectAll('.vzb-br-bar > text.vzb-br-label') 
      .data(this.sorted_entities, getDataKey)      
      .transition().duration(duration).ease("linear")
      .attr("y", text_y_position)

    // end of the values
    this.barContainer
      .selectAll('.vzb-br-bar > text.vzb-br-value') 
      .data(this.sorted_entities, getDataKey)   
      .text(function(d, i) {
        return _this.model.marker.axis_x.tickFormatter(d.value);
      })
      .transition().duration(duration).ease("linear") 
      .attr("y", text_y_position)  

    function getDataKey(d) {          
      return d.entity;  
    }
    function text_y_position(d, i) {  
      return (_this.bar_height+bar_margin)*(i)+(_this.bar_height/2); 
    }

  },

  createAndDeleteBars: function(updatedBars) {

    var _this = this;

    // remove groups for entities that are gone
    updatedBars.exit().remove();

    // make the groups for the entities which were not drawn yet (.data.enter() does this)
    var newGroups = updatedBars.enter().append("g")
        .attr("class", 'vzb-br-bar')
        .attr("id", function(d) {
          return "vzb-br-bar-" + d.entity;
        })
        .on("mousemove", this.highlightBar.bind(this))
        .on("mouseout", this.unhighlightBar.bind(this))
        .on("click", function(d, i) {
          //_this.model[entityDim].selectEntity(d);
        });

    // draw new bars per group
    newGroups.append('rect')
        .attr("x", 0)
        .attr("rx", this.bar_height/4)
        .attr("ry", this.bar_height/4)
        .attr("height", this.bar_height)
        .attr("fill", function(d) {
          var color = _this.cScale(_this.values.color[d.entity]);
          return d3.rgb(color);
        });

    // draw new labels per group
    newGroups.append('text')
        .attr("class", "vzb-br-label") 
        .attr("x", -5)
        .attr("text-anchor", "end")
        .attr("alignment-baseline", "middle")
        .text(function(d, i) {
          return _this.values.label[d.entity];
        })
        .style("fill", function(d) {
          var color = _this.cScale(_this.values.color[d.entity]);
          return d3.rgb(color).darker(2);
        });

    // draw new values on each bar
    newGroups.append('text')
        .attr("class", "vzb-br-value") 
        .attr("x", 5)
        .attr("alignment-baseline", "middle")
        .style("fill", function(d) {
          var color = _this.cScale(_this.values.color[d.entity]);
          return d3.rgb(color).darker(2);
        });
  },


  /**
  * DATA HELPER FUNCTIONS
  */  

  sortByIndicator: function(values) {
    var data_array = [];
    // first put the data in an array (objects aren't sortable)
    utils.forEach(values, function(indicator_value, entity) {
      data_array.push({ entity: entity, value: indicator_value });
    });
    data_array.sort(function(a, b) {
      // if a is bigger, a comes first, i.e. descending sort
      return b.value - a.value;
    });  
    return data_array;  
  },

  /**
  * UI METHODS
  */
  highlightBar: function(d) {
    this.barContainer.classed('vzb-dimmed', true);
    var curr = this.barContainer.select("#vzb-bc-bar-" + d[this.AGEDIM]);
    curr.classed('vzb-hovered', true);
    //var label = this.labels.select("#vzb-bc-label-" + d[this.AGEDIM]);
    //label.classed('vzb-hovered', true);
  },

  unhighlightBar: function() {
    this.barContainer.classed('vzb-dimmed', false);
    //this.barContainer.selectAll('.vzb-bc-bar.vzb-hovered').classed('vzb-hovered', false);
    //this.labels.selectAll('.vzb-hovered').classed('vzb-hovered', false);
  }

});

export default BarRankChart;