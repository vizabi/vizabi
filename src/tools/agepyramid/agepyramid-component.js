import * as utils from 'base/utils';
import Component from 'base/component';

import axisSmart from 'helpers/d3.axisWithLabelPicker';


/*!
 * VIZABI POP BY AGE Component
 */


//POP BY AGE CHART COMPONENT
var AgePyramid = Component.extend({

  /**
   * Initializes the component (Bar Chart).
   * Executed once before any template is rendered.
   * @param {Object} config The config passed to the component
   * @param {Object} context The component's parent
   */
  init: function(config, context) {
    this.name = 'agepyramid';
    this.template = 'agepyramid.html';

    //define expected models for this component
    this.model_expects = [{
      name: "time",
      type: "time"
    }, {
      name: "entities",
      type: "entities"
    }, {
      name: "stack",
      type: "entities"
    }, {
      name: "age",
      type: "entities"
    }, {
      name: "marker",
      type: "model"
    }, {
      name: "language",
      type: "language"
    }];

    var _this = this;
    this.model_binds = {
      "change:time.value": function(evt) {
        _this._updateEntities();
      },
      "change:entities.show": function(evt) {
        console.log('Trying to change show');
      },
      "change:age.select": function(evt) {
        _this._selectBars();
      },
      "change:marker.color.palette": function (evt) {
        if (!_this._readyOnce) return;
        _this._updateEntities();
      },
      "change:marker.color.scaleType":function (evt) {
        if (!_this._readyOnce) return;
        _this._updateEntities();
      }
    };

    //contructor is the same as any component
    this._super(config, context);

    this.xScale = null;
    this.yScale = null;
    this.cScale = null;

    this.xAxis = axisSmart();
    this.xAxisLeft = axisSmart();
    this.yAxis = axisSmart();
    this.xScales = [];
    
    this.totalFieldName = "Total";
  },

  /**
   * DOM is ready
   */
  readyOnce: function() {

    this.el = (this.el) ? this.el : d3.select(this.element);
    this.element = this.el;

    this.graph = this.element.select('.vzb-bc-graph');
    this.yAxisEl = this.graph.select('.vzb-bc-axis-y');
    this.xAxisEl = this.graph.select('.vzb-bc-axis-x');
    this.xAxisLeftEl = this.graph.select('.vzb-bc-axis-x-left');
    this.yTitleEl = this.graph.select('.vzb-bc-axis-y-title');
    this.bars = this.graph.select('.vzb-bc-bars');
    this.labels = this.graph.select('.vzb-bc-labels');

    this.title = this.element.select('.vzb-bc-title');
    this.titleRight = this.element.select('.vzb-bc-title-right');
    this.year = this.element.select('.vzb-bc-year');

    //only allow selecting one at a time
    this.model.age.selectMultiple(true);

    var _this = this;
    this.on("resize", function() {
      _this._updateEntities();
    });
  },

  /*
   * Both model and DOM are ready
   */
  ready: function() {
    this.SIDEDIM = this.model.entities.getDimension();
    this.AGEDIM = this.model.age.getDimension();
    this.TIMEDIM = this.model.time.getDimension();
    this.STACKDIM = this.model.stack.getDimension();

    this.updateUIStrings();
    this._updateIndicators();
    this.resize();
    this._updateEntities();
    this._updateEntities();
  },

  updateUIStrings: function() {
    this.translator = this.model.language.getTFunction();

    var titleStringY = this.translator("indicator/" + this.model.marker.axis_y.which);

    var yTitle = this.yTitleEl.selectAll("text").data([0]);
    yTitle.enter().append("text");
    yTitle
      .attr("y", "-6px")
      .attr("x", "-9px")
      .attr("dx", "-0.72em")
      .text(titleStringY);
  },

  /**
   * Changes labels for indicators
   */
  _updateIndicators: function() {
    var _this = this;
    this.duration = this.model.time.delayAnimations;
    this.yScale = this.model.marker.axis_y.getScale();
    this.xScale = this.model.marker.axis_x.getScale(false);
    this.yAxis.tickFormat(_this.model.marker.axis_y.getTickFormatter());
    this.xAxis.tickFormat(_this.model.marker.axis_x.getTickFormatter());
    this.xAxisLeft.tickFormat(_this.model.marker.axis_x.getTickFormatter());
    
    var sides = this.model.marker.getKeys(this.SIDEDIM);
    this.twoSided = sides.length > 1; 
    if(this.twoSided) {
      this.xScaleLeft = this.xScale.copy();
    }      
  },

  /**
   * Updates entities
   */
  _updateEntities: function() {

    var _this = this;
    var time = this.model.time;
    var timeValue = time.timeFormat.parse(time.timeFormat(time.value));
    var sideDim = this.SIDEDIM;
    var ageDim = this.AGEDIM;
    var stackDim = this.STACKDIM;
    var timeDim = this.TIMEDIM;
    var duration = (time.playing) ? time.delayAnimations : 0;

    var group_by = this.model.age.grouping || 1;
    //var group_offset = this.model.marker.group_offset ? Math.abs(this.model.marker.group_offset % group_by) : 0;

    var filter = {};
    filter[timeDim] = time.value;
    var markers = this.model.marker.getKeys(ageDim);
    var sides = this.model.marker.getKeys(sideDim);
    var sidesKeys = [];
    sidesKeys = sides.map(function(m) {
        return m[sideDim];
      });     
    var stacks = this.model.marker.getKeys(stackDim);
    var stackKeys = [];
    if(this.ui.stacked) {
      stackKeys = utils.without(stacks.map(function(m) {
        return m[stackDim];
      }), this.totalFieldName);
    } else {
      stackKeys = [this.totalFieldName];
    }

    var values1 = this.model.marker.getValues(filter,[ sideDim, ageDim, stackDim]);
    var sideValues = this.model.marker.getValues(filter,[sideDim]);
    var stackValues = this.model.marker.getValues(filter,[stackDim]);
    var values = this.model.marker.getValues(filter,[this.AGEDIM]);
    var domain = this.yScale.domain();

    //var data = (this.model.marker.axis_x.getNestedItems([timeDim, sideDim, ageDim, stackDim]))[timeValue];
    
    this.cScale = this.model.marker.color.getScale();
    this.model.age.setVisible(markers);



    this.entityBars = this.bars.selectAll('.vzb-bc-bar')
      .data(markers);

    this.entityLabels = this.labels.selectAll('.vzb-bc-label')
      .data(markers);

    //exit selection
    this.entityBars.exit().remove();
    this.entityLabels.exit().remove();

    var highlight = this._highlightBar.bind(this);
    var unhighlight = this._unhighlightBars.bind(this)

    var one_bar_height = this.height / (domain[1] - domain[0]);
    var bar_height = one_bar_height * group_by; // height per bar is total domain height divided by the number of possible markers in the domain
    var first_bar_y_offset = this.height - bar_height;

    //enter selection -- init bars
    var ageBars = this.entityBars.enter().append("g")
      .attr("class", function(d) {
        return "vzb-bc-bar " + "vzb-bc-bar-" + d[ageDim];
      })
      .on("mouseover", highlight)
      .on("mouseout", unhighlight)
      .on("click", function(d, i) {
        if(utils.isTouchDevice()) return;
        _this.model.age.selectEntity(d);
      })
      .onTap(function(d) {
        d3.event.stopPropagation();
        _this.model.age.selectEntity(d);
      })
      
    var sideBars = ageBars.selectAll('.vzb-bc-side').data(function(d) {
      return sides.map(function(m) {
          var r = {};    
          r[ageDim] = d[ageDim];
          r[sideDim] = m[sideDim];
          return r;
        });
      }).enter().append("g")
        .attr("class", function(d, i) {
          return "vzb-bc-side " + "vzb-bc-side-" + (i ? "right": "left");
        })
        
    var stackBars = sideBars.selectAll('.vzb-bc-stack').data(function(d,i) {
          return stackKeys.map(function(m) {
            var r = {};
            r[ageDim] = d[ageDim];
            r[sideDim] = d[sideDim];
            r[stackDim] = m;
            return r;  
          });
        }).enter().append("rect")
          .attr("class", function(d, i) {
            return "vzb-bc-stack " + "vzb-bc-stack-" + i;
          })
          .attr("y", 0)
          .attr("height", bar_height);
        
    this.bars.selectAll('.vzb-bc-bar')
      .attr("transform", function(d, i) {
        return "translate(0," + (first_bar_y_offset - (d[ageDim] - domain[0]) * one_bar_height) + ")";
      })
      .selectAll('.vzb-bc-side').attr("transform", function(d, i) {
          return i ? ("scale(-1,1) translate(" + _this.activeProfile.centerWidth + ",0)") : "";
        })
      .selectAll('.vzb-bc-stack')
      .attr("width", function(d, i) {
        var width = _this.xScale(values1.axis_x[d[sideDim]][d[ageDim]][d[stackDim]]);
        return width;
      })    
      .attr("x", function(d, i){
        var prevSbl = this.previousSibling;
        if(prevSbl) {
          var bBox = prevSbl.getBBox();
          return bBox.x + bBox.width;          
        } else {
          return 0;
        }
      })
      .attr("fill", function(d) {
        //return _this._temporaryBarsColorAdapter(values, d, ageDim);
        //return _this.cScale(values.color[d[ageDim]]);
        return _this.cScale(d[stackDim]);
      });
        
      

    this.entityLabels.enter().append("g")
      .attr("class", "vzb-bc-label")
      .attr("id", function(d) {
        return "vzb-bc-label-" + d[ageDim];
      })
      .append('text')
      .attr("class", "vzb-bc-age");

    // this.bars.selectAll('.vzb-bc-bar > rect')
    //   .attr("fill", function(d) {
    //     return _this._temporaryBarsColorAdapter(values, d, ageDim);
    //     //    return _this.cScale(values.color[d[ageDim]]);
    //   })
    //   .attr("shape-rendering", "crispEdges") // this makes sure there are no gaps between the bars, but also disables anti-aliasing
    //   .attr("x", 0)
    //   .transition().duration(duration).ease("linear")
    //   .attr("y", function(d, i) {
    //     return first_bar_y_offset - (d[ageDim] - domain[0]) * one_bar_height;
    //   })
    //   .attr("height", bar_height)
    //   .attr("width", function(d) {
    //     return _this.xScale(values.axis_x[d[ageDim]]);
    //   });

    this.labels.selectAll('.vzb-bc-label > .vzb-bc-age')
      .text(function(d, i) {
        var formatter = _this.model.marker.axis_x.getTickFormatter();
        var yearOldsIn = _this.translator("popbyage/yearOldsIn");

        var age = parseInt(d[ageDim], 10);

        if(group_by > 1) {
          age = age + "-to-" + (age + group_by - 1);
        }

        return age + yearOldsIn + " " + _this.model.time.timeFormat(time.value) + ": " + formatter(values.axis_x[d[ageDim]]);
      })
      .attr("x", 7)
      .attr("y", function(d, i) {
        return first_bar_y_offset - (d[ageDim] - domain[0]) * one_bar_height - 10;
      })
      .style("fill", function(d) {
        var color = _this.cScale(values.color[d[ageDim]]);
        return d3.rgb(color).darker(2);
      });

    var label = utils.values(values.label_name).reverse()[0]; //get last name

    //TODO: remove hack
    //label = label === "usa" ? "United States" : "Sweden";
    if(this.twoSided) {
      this.title.text(sideValues.label_name[sides[1][sideDim]]);    
      this.titleRight.text(sideValues.label_name[sides[0][sideDim]]);
    } else {
      var title = this.translator("indicator/" + this.model.marker.axis_x.which);
      this.title.text(title);
    }

    this.year.text(this.model.time.timeFormat(this.model.time.value));

    //update x axis again
    //TODO: remove this when grouping is done at data level
    //var x_domain = this.xScale.domain();
    //var x_domain_max = Math.max.apply(null, utils.values(values.axis_x));
    //if(x_domain_max > this.xScale.domain()[1]) this.xScale = this.xScale.domain([x_domain[0], x_domain_max]);

    // should not be here
    var limits = this.model.marker.axis_x.getLimits(this.model.marker.axis_x.which);
    if (group_by == 1) {
      this.xScale.domain([limits.min, limits.max]);
    } else {
      var values = utils.values(values.axis_x);
      values.push(limits.max);
      this.xScale.domain([limits.min, Math.max.apply(Math, values)]);
    }
    if(this.xScaleLeft) this.xScaleLeft.domain(this.xScale.domain());    
    this.resize();

  },

  _temporaryBarsColorAdapter: function(values, d, ageDim) {
    return this.cScale(values.color[d[ageDim]]);
  },

  /**
   * Highlight and unhighlight labels
   */
  _unhighlightBars: function() {
    if(utils.isTouchDevice()) return;
      
    this.bars.classed('vzb-dimmed', false);
    this.bars.selectAll('.vzb-bc-bar.vzb-hovered').classed('vzb-hovered', false);
    this.labels.selectAll('.vzb-hovered').classed('vzb-hovered', false);
  },

  _highlightBar: function(d) {
    if(utils.isTouchDevice()) return;
      
    this.bars.classed('vzb-dimmed', true);
    var curr = this.bars.select("#vzb-bc-bar-" + d[this.AGEDIM]);
    curr.classed('vzb-hovered', true);
    var label = this.labels.select("#vzb-bc-label-" + d[this.AGEDIM]);
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
        _this.bars.select("#vzb-bc-bar-" + s[AGEDIM]).classed('vzb-selected', true);
        _this.labels.select("#vzb-bc-label-" + s[AGEDIM]).classed('vzb-selected', true);
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
  resize: function() {

    var _this = this;

    this.profiles = {
      "small": {
        margin: {
          top: 70,
          right: 20,
          left: 40,
          bottom: 40
        },
        minRadius: 2,
        maxRadius: 40,
        centerWidth: 2
      },
      "medium": {
        margin: {
          top: 80,
          right: 60,
          left: 60,
          bottom: 40
        },
        minRadius: 3,
        maxRadius: 60,
        centerWidth: 2
      },
      "large": {
        margin: {
          top: 100,
          right: 60,
          left: 60,
          bottom: 40
        },
        minRadius: 4,
        maxRadius: 80,
        centerWidth: 2
      }
    };

    this.activeProfile = this.profiles[this.getLayoutProfile()];
    var margin = this.activeProfile.margin;

    //stage
    this.height = (parseInt(this.element.style("height"), 10) - margin.top - margin.bottom) || 0;
    this.width = (parseInt(this.element.style("width"), 10) - margin.left - margin.right) || 0;
      
    if(this.height<=0 || this.width<=0) return utils.warn("Pop by age resize() abort: vizabi container is too little or has display:none");

    this.graph
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //update scales to the new range
    if(this.model.marker.axis_y.scaleType !== "ordinal") {
      this.yScale.range([this.height, 0]);
    } else {
      this.yScale.rangePoints([this.height, 0]).range();
    }

    var maxRange = this.twoSided ? ((this.width - this.activeProfile.centerWidth) * .5) : this.width; 
    
    if(this.model.marker.axis_x.scaleType !== "ordinal") {
      this.xScale.range([0, maxRange]);
    } else {
      this.xScale.rangePoints([0, maxRange]).range();
    }

    //apply scales to axes and redraw
    this.yAxis.scale(this.yScale)
      .orient("left")
      .tickSize(6, 6)
      .tickSizeMinor(3, 0)
      .labelerOptions({
        scaleType: this.model.marker.axis_y.scaleType,
        toolMargin: margin,
        limitMaxTickNumber: 19
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
      
    var translateX = this.twoSided ? ((this.width + _this.activeProfile.centerWidth) * .5) : 0;

    this.xAxisEl.attr("transform", "translate(" + translateX + "," + this.height + ")")
      .call(this.xAxis);

    this.yAxisEl.attr("transform", "translate(" + 0 + ",0)")
      .call(this.yAxis);
    //this.xAxisEl.call(this.xAxis);

    if(this.xScaleLeft) {
      if(this.model.marker.axis_x.scaleType !== "ordinal") {
        this.xScaleLeft.range([(this.width - this.activeProfile.centerWidth) * .5, 0]);
      } else {
        this.xScaleLeft.rangePoints([(this.width - this.activeProfile.centerWidth) * .5, 0]).range();
      }

      this.xAxisLeft.scale(this.xScaleLeft)
        .orient("bottom")
        .tickSize(6, 0)
        .tickSizeMinor(3, 0)
        .labelerOptions({
          scaleType: this.model.marker.axis_x.scaleType,
          toolMargin: margin,
          limitMaxTickNumber: 6
        });

      this.xAxisLeftEl.attr("transform", "translate(0," + this.height + ")")
        .call(this.xAxisLeft);
    }
    
    this.bars.attr("transform", "translate(" + translateX + ",0)");
    this.labels.attr("transform", "translate(" + translateX + ",0)");

    this.title
      .attr('x', margin.left + (this.twoSided ? translateX - 5 : 0))
      .style('text-anchor', this.twoSided ? "end":"null")
      .attr('y', margin.top / 2);
    this.titleRight
      .attr('x', margin.left + translateX + 5)
      .attr('y', margin.top / 2);

    this.year.attr('x', this.width + margin.left).attr('y', margin.top / 2);

  }
});

export default AgePyramid;
