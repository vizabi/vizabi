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
      name: "side",
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
      name: "marker_side",
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
      "change:time.value": function(evt) {
        _this._updateEntities();
      },
      "change:entities.show": function(evt) {
        console.log('Trying to change show');
      },
      "change:stack.select": function(evt) {
        _this._selectBars();
      },
      "change:marker.color.palette": function (evt) {
        if (!_this._readyOnce) return;
        _this._updateEntities();
      },
      "change:marker.color.scaleType":function (evt) {
        if (!_this._readyOnce) return;
        _this._updateEntities();
      },
      "change:ui.chart.inpercent":function (evt) {
        if (!_this._readyOnce) return;
        _this._updateLimits();
        _this.resize();
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

  // afterPreload: function() {
  //   var obj = {};
  //   obj["which"] = this.model.marker.axis_x.which;
  //   obj["use"] = this.model.marker.axis_x.use;
  //   this.model.marker_side.hook_total.set(obj);
  // },
  
  /**
   * DOM is ready
   */
  readyOnce: function() {

    this.el = (this.el) ? this.el : d3.select(this.element);
    this.element = this.el;
    
    this.interaction = this._interaction();

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
    this.SIDEDIM = this.model.marker.side.which;//this.model.side.getDimension();
    this.STACKDIM = this.model.marker.color.which;//this.model.stack.getDimension();
    this.AGEDIM = this.model.age.getDimension();
    this.TIMEDIM = this.model.time.getDimension();

    this.updateUIStrings();
    this._updateIndicators();
    this._updateLimits();
    this.resize();
    this._updateEntities();
    this._selectBars();
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
    
    var sideDim = this.SIDEDIM;
    var stackDim = this.STACKDIM;
    var sides = this.model.marker.getKeys(sideDim);
    _this.sideKeys = [];
    _this.sideKeys = sides.map(function(m) {
        return m[sideDim];
      });
    var stacks = this.model.marker.getKeys(stackDim);
    _this.stackKeys = [];
    if(this.ui.chart.stacked || this.model.marker.color.use == "constant") {
      _this.stackKeys = utils.without(stacks.map(function(m) {
        if(m[stackDim] == _this.totalFieldName) _this.dataWithTotal = true;
        return m[stackDim];
      }), this.totalFieldName);
    } else {
      _this.stackKeys = [this.totalFieldName];
    }
    
    this.twoSided = sides.length > 1; 
    if(this.twoSided) {
      this.xScaleLeft = this.xScale.copy();
    }  
  },

  _updateLimits: function() {
    var _this = this; 
    var limits, domain;
    var axisX = this.model.marker.axis_x;
    if(this.ui.chart.inpercent) {
      limits = axisX.getLimitsByDimensions([this.SIDEDIM, this.TIMEDIM]);      
      var totalLimits = this.model.marker_side.hook_total.getLimitsByDimensions([this.SIDEDIM, this.TIMEDIM]);
      var totalCoeff = this.dataWithTotal ? .5 : 1;
      var timeKeys = axisX.getUnique();
      var maxLimits = []; 
      utils.forEach(this.sideKeys, function(key) {
        utils.forEach(timeKeys, function(time) {
          maxLimits.push(limits[key][time].max / (totalLimits[key][time].max * totalCoeff));          
        });
      });
      domain = [0, Math.max.apply(Math, maxLimits)];
    } else {
      limits = axisX.getLimits(axisX.which);
      domain = (axisX.domainMin!=null && axisX.domainMax!=null) ? [+axisX.domainMin, +axisX.domainMax] : limits;
    }
    this.xScale.domain(domain);
    if(this.xScaleLeft) this.xScaleLeft.domain(this.xScale.domain());
  },

  /**
   * Updates entities
   */
  _updateEntities: function() {

    var _this = this;
    var time = this.model.time;
    var sideDim = this.SIDEDIM;
    var ageDim = this.AGEDIM;
    var stackDim = this.STACKDIM;
    var timeDim = this.TIMEDIM;
    var duration = (time.playing) ? time.delayAnimations : 0;

    var group_by = this.model.age.grouping || 1;
    //var group_offset = this.model.marker.group_offset ? Math.abs(this.model.marker.group_offset % group_by) : 0;

    if(this.ui.chart.inpercent) {
      var filter = {};
      filter[this.TIMEDIM] = this.model.time.value;
      
      this.totalValues = this.model.marker_side.getValues(filter,[this.SIDEDIM]).hook_total;
      if(this.dataWithTotal) {
        utils.forEach(this.sideKeys, function(key) {
          _this.totalValues[key] *= .5;
        });
      }
    } 

    var filter = {};
    filter[timeDim] = time.value;
    var markers = this.model.marker.getKeys(ageDim);
    var sides = this.model.marker.getKeys(sideDim);
    var stacks = this.model.marker.getKeys(stackDim);

    _this.values1 = this.model.marker.getValues(filter,[ ageDim, sideDim, stackDim]);
    var sideValues = this.model.marker.getValues(filter,[sideDim]);
    var stackValues = this.model.marker.getValues(filter,[stackDim]);
    var values = this.model.marker.getValues(filter,[this.AGEDIM]);
    var domain = this.yScale.domain();
        
    this.cScale = this.model.marker.color.getScale();
 
    this.model.age.setVisible(markers);

    this.entityBars = this.bars.selectAll('.vzb-bc-bar')
      .data(markers);

    this.entityLabels = this.labels.selectAll('.vzb-bc-label')
      .data(markers);

    //exit selection
    this.entityBars.exit().remove();
    this.entityLabels.exit().remove();

    //var highlight = this._highlightBar.bind(this);
    //var unhighlight = this._unhighlightBars.bind(this)

    var one_bar_height = this.height / (domain[1] - domain[0]);
    var bar_height = one_bar_height * group_by; // height per bar is total domain height divided by the number of possible markers in the domain
    var first_bar_y_offset = this.height - bar_height;

    //enter selection -- init bars
    var ageBars = this.entityBars.enter().append("g")
      .attr("class", function(d) {
        return "vzb-bc-bar " + "vzb-bc-bar-" + d[ageDim];
      })
      // .on("mouseover", highlight)
      // .on("mouseout", unhighlight)
      // .on("click", function(d, i) {
      //   if(utils.isTouchDevice()) return;
      //   _this.model.age.selectEntity(d);
      // })
      // .onTap(function(d) {
      //   d3.event.stopPropagation();
      //   _this.model.age.selectEntity(d);
      // })
      
    var sideBars = ageBars.selectAll('.vzb-bc-side').data(function(d) {
      return sides.map(function(m) {
          var r = {};    
          r[ageDim] = d[ageDim];
          r[sideDim] = m[sideDim];
          return r;
        });
      })
    
    sideBars.exit().remove();  
    sideBars.enter().append("g")
        .attr("class", function(d, i) {
          return "vzb-bc-side " + "vzb-bc-side-" + (i ? "right": "left");
        })
        
    var stackBars = sideBars.selectAll('.vzb-bc-stack').data(function(d,i) {
          return _this.stackKeys.map(function(m) {
            var r = {};
            r[ageDim] = d[ageDim];
            r[sideDim] = d[sideDim];
            r[stackDim] = m;
            return r;  
          });
        })
        
    stackBars.exit().remove();    
    stackBars.enter().append("rect")
          .attr("class", function(d, i) {
            return "vzb-bc-stack " + "vzb-bc-stack-" + i;
          })
          .attr("y", 0)
          .on("mouseover", _this.interaction.highlightBar)
          .on("mouseout", _this.interaction.unhighlightBars)
          .on("click", function(d, i) {
            if(utils.isTouchDevice()) return;
            _this.model.stack.selectEntityMD(d);
          })
          .onTap(function(d) {
            d3.event.stopPropagation();
            _this.model.stack.selectEntityMD(d);
          })

        
    this.stackBars = this.bars.selectAll('.vzb-bc-bar')
      .attr("transform", function(d, i) {
        return "translate(0," + (first_bar_y_offset - (d[ageDim] - domain[0]) * one_bar_height) + ")";
      })
      .selectAll('.vzb-bc-side').attr("transform", function(d, i) {
          return i ? ("scale(-1,1) translate(" + _this.activeProfile.centerWidth + ",0)") : "";
        })
      .selectAll('.vzb-bc-stack')
        .attr("fill", function(d) {
          //return _this._temporaryBarsColorAdapter(values, d, ageDim);
          //return _this.cScale(values.color[d[ageDim]]);
          return _this.cScale(d[stackDim]);
        })
        //.attr("shape-rendering", "crispEdges") // this makes sure there are no gaps between the bars, but also disables anti-aliasing
        .each(function(d, i) {
          var total = _this.ui.chart.inpercent ? _this.totalValues[d[sideDim]] : 1;
          d["width_"] = _this.xScale(_this.values1.axis_x[d[ageDim]][d[sideDim]][d[stackDim]] / total);
          var prevSbl = this.previousSibling;
          if(prevSbl) {
            var prevSblDatum = d3.select(prevSbl).datum();
            d["x_"] = prevSblDatum.x_ + prevSblDatum.width_;          
          } else {
            d["x_"] = 0;
          }
        })
        
    this.stackBars.transition().duration(duration).ease("linear")
        .attr("width", function(d, i) {
          return d.width_;
        })    
        .attr("x", function(d, i){
          return d.x_;
        })
        .attr("height", bar_height);

    this.entityLabels.enter().append("g")
      .attr("class", "vzb-bc-label")
      .attr("id", function(d) {
        return "vzb-bc-label-" + d[ageDim];
      })
      .append('text')
      .attr("class", "vzb-bc-age");

    this.labels.selectAll('.vzb-bc-label > .vzb-bc-age')
      .each(function(d, i) {
        var yearOlds = _this.translator("agepyramid/yearOlds");

        var age = parseInt(d[ageDim], 10);

        if(group_by > 1) {
          age = age + "-to-" + (age + group_by - 1);
        }

        d["text"] = age + yearOlds;
      })
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

  },

  _temporaryBarsColorAdapter: function(values, d, ageDim) {
    return this.cScale(values.color[d[ageDim]]);
  },

  
  _interaction: function() {
    var _this = this; 
  /**
   * Highlight and unhighlight labels
   */
    return {
      unhighlightBars: function() {
        if(utils.isTouchDevice()) return;
          
        _this.stackBars.classed('vzb-dimmed', false).classed('vzb-hovered', false);
        _this.labels.selectAll('.vzb-hovered').classed('vzb-hovered', false);
      },

      highlightBar: function(d) {
        if(utils.isTouchDevice()) return;
          
        var formatter = _this.ui.chart.inpercent ? d3.format(".1%") : _this.model.marker.axis_x.getTickFormatter();
        var sideDim = _this.SIDEDIM;
        var ageDim = _this.AGEDIM;
        var stackDim = _this.STACKDIM;
      
        _this.stackBars.classed('vzb-dimmed', true);
        var curr = d3.select(this); 
        //_this.bars.select("#vzb-bc-bar-" + d[this.AGEDIM]);
        curr.classed('vzb-hovered', true);
        var left = _this.sideKeys.indexOf(d[sideDim]);
        var label = _this.labels.select("#vzb-bc-label-" + d[ageDim]);
        label.selectAll('.vzb-bc-age')
          .text(function(textData) { 
            var total = _this.ui.chart.inpercent ? _this.totalValues[d[sideDim]] : 1;
            var text = _this.stackKeys.length > 1 ? d[stackDim]: textData.text;
            text = _this.twoSided ? text : textData.text + " " + d[stackDim];
            return text + ": " + formatter(_this.values1.axis_x[d[ageDim]][d[sideDim]][d[stackDim]] / total);
          })
          .attr("x", (left?-1:1) * (_this.activeProfile.centerWidth * .5 + 7))
          .classed("vzb-text-left", left);
        
        label.classed('vzb-hovered', true);
      }
    }
  },

  /**
   * Select Entities
   */
  _selectBars: function() {
    var _this = this;
    var stackDim = this.STACKDIM;
    var ageDim = this.AGEDIM;
    var sideDim = this.SIDEDIM;
    var selected = this.model.stack.select;

    this._unselectBars();

    if(selected.length) {
      this.stackBars.classed('vzb-dimmed-selected', true);
      utils.forEach(selected, function(d) {
        var indexSide = _this.sideKeys.indexOf(d[sideDim]);
        var indexStack = _this.stackKeys.indexOf(d[stackDim]);
        var side = indexSide ? "right": "left";
        _this.bars.selectAll(".vzb-bc-bar-" + d[ageDim]).selectAll(".vzb-bc-side-" + side).selectAll(".vzb-bc-stack-" + indexStack).classed('vzb-selected', true);
        //_this.labels.select("#vzb-bc-label-" + d[ageDim]).classed('vzb-selected', true);
      });
    }
  },

  _unselectBars: function() {
    this.stackBars.classed('vzb-dimmed-selected', false);
    this.stackBars.classed('vzb-selected', false);
    //this.labels.selectAll('.vzb-selected').classed('vzb-selected', false);
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

    var format = this.ui.chart.inpercent ? d3.format("%") : this.model.marker.axis_x.getTickFormatter();  

    this.xAxis.scale(this.xScale)
      .orient("bottom")
      .tickFormat(format)
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
        .tickFormat(format)
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
