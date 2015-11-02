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
      },
      "change:entities:select": function(evt) {
        _this.selectBars();
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


    // set up formatters
    this.timeFormatter = d3.time.format(this.model.time.formatOutput);
    this.xAxis.tickFormat(this.model.marker.axis_x.tickFormatter);

    // set up scales and axes
    this.xScale = this.model.marker.axis_x.getScale(false);
    this.cScale = this.model.marker.color.getScale();

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
    this.sortedEntities = this.sortByIndicator(this.values.axis_x);
  },

  draw: function() {
    this.drawAxes();
    this.drawData();
  },

  /*
  * draw the chart/stage
  */
  drawAxes: function() {


    // these should go in some style-config
    this.barHeight = 20; 
    var margin = {top: 20, bottom: 40, left: 90, right: 20};

    // draw the stage - copied from popbyage, should figure out what it exactly does and what is necessary.
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

  },

  drawData: function() {

    var _this = this;
    var bar_margin = 2; // should go in some config
    var duration = (this.model.time.playing) ? this.model.time.delayAnimations : 0;

    // apply the current data to the bars (including ordering)
    var updatedBars = this.barContainer
      .selectAll('.vzb-br-bar')
      .data(this.sortedEntities, getDataKey)
      .order();

    // update the shown bars for new data-set
    this.createAndDeleteBars(updatedBars);

    // set position of the bars
    this.barContainer
      .selectAll('.vzb-br-bar > rect')
      .data(this.sortedEntities, getDataKey)     
      .transition().duration(duration).ease("linear")
      .attr("width", function(d) {
        var width = _this.xScale(d.value);
        return width > 0 ? width : 0;
      })
      .attr("y", getBarPosition);

    // it would be nice if the two y-attribute setting below could be combined, but due to the .data you can't
    // set position of all entity-labels
    this.barContainer
      .selectAll('.vzb-br-bar > text.vzb-br-label') 
      .data(this.sortedEntities, getDataKey)      
      .transition().duration(duration).ease("linear")
      .attr("y", getTextPosition)

    // set positions of the entity-values
    this.barContainer
      .selectAll('.vzb-br-bar > text.vzb-br-value') 
      .data(this.sortedEntities, getDataKey)   
      .text(function(d, i) {
        return _this.model.marker.axis_x.tickFormatter(d.value);
      })
      .transition().duration(duration).ease("linear") 
      .attr("y", getTextPosition)  

    // helper functions
    function getDataKey(d) {          
      return d.entity;  
    }
    function getBarPosition(d, i) {
        return (_this.barHeight+bar_margin)*i;
    }
    function getTextPosition(d, i) {  
      return getBarPosition(d, i)+(_this.barHeight/2); 
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
        .on("mousemove", function(bar) { _this.setHover(bar, true)  })
        .on("mouseout",  function(bar) { _this.setHover(bar, false) })
        .on("click", function(d) {

          utils.forEach(_this.model.marker.space, function(entity) {
            if (_this.model[entity].getDimension() !== 'time')
              _this.model[entity].selectEntity(d); // this will trigger a change in the model, which the tool listens to
          });

        });

    // draw new bars per group
    newGroups.append('rect')
        .attr("x", 0)
        .attr("rx", this.barHeight/4)
        .attr("ry", this.barHeight/4)
        .attr("stroke", "white")
        .attr("stroke-opacity", 0)
        .attr("stroke-width", 2)
        .attr("height", this.barHeight)
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
    var _this = this;
    var data_array = [];
    // first put the data in an array (objects aren't sortable)
    utils.forEach(values, function(indicator_value, entity) {
      var row = { entity: entity, value: indicator_value };
      row[_this.model.entities.dim] = entity;
      data_array.push(row);
      //data_array.push({ entity: entity, value: indicator_value });
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

  /**
   * setting hover
   */
  setHover: function(bar, hover) {
    this.barContainer.classed('vzb-dimmed', hover);
    this.barContainer.select("#vzb-br-bar-" + bar.entity).classed('vzb-hovered', hover);
  },

  /**
   * Select Entities
   */
  selectBars: function() {
    var _this = this;
    var entityDim = this.model.entities.dim;
    var selected = this.model.entities.select;

    // unselect all bars
    this.barContainer.classed('vzb-dimmed-selected', false);
    this.barContainer.selectAll('.vzb-br-bar.vzb-selected').classed('vzb-selected', false);

    // select the selected ones
    if(selected.length) {
      this.barContainer.classed('vzb-dimmed-selected', true);
      utils.forEach(selected, function(selectedBar) {
        _this.barContainer.select("#vzb-br-bar-" + selectedBar[entityDim]).classed('vzb-selected', true);
      });
    }

  },

});

export default BarRankChart;