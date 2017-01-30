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
    this.template = require('./agepyramid.html');

    //define expected models for this component
    this.model_expects = [{
      name: "time",
      type: "time"
    }, {
      name: "marker",
      type: "model"
    }, {
      name: "locale",
      type: "locale"
    }, {
      name: "ui",
      type: "ui"
    }];

    var _this = this;
    this.model_binds = {
      "change:time.value": function(evt) {
        if (!_this._readyOnce) return;
        if(_this.model.time.step != 1 && !_this.snapped && !_this.model.time.playing && !_this.model.time.dragging) {
          var next = d3.bisectLeft(_this.timeSteps, _this.model.time.value);
          if(next != 0 && (_this.timeSteps[next] - _this.model.time.value)) {
            _this.snapped = true;
            var time = _this.model.time.value;
            var prev = _this.timeSteps[next - 1];
            var next = _this.timeSteps[next];
            var snapTime = (time - prev) < (next - time) ? prev : next;
            _this.model.time.value = new Date(snapTime);
          }
        }
        if(!_this.snapped) {
          _this._updateEntities();
          _this.updateBarsOpacity();
        }
        _this.snapped = false;
      },
      "change:marker.select": function(evt) {
        _this.someSelected = (_this.model.marker.select.length > 0);
        _this.nonSelectedOpacityZero = false;
      },
      "change:marker.highlight": function(evt, path) {
        if(!_this._readyOnce) return;
        _this._highlightBars();
      },
      "change:marker.opacitySelectDim": function() {
        _this.updateBarsOpacity();
      },
      "change:marker.opacityRegular": function() {
        _this.updateBarsOpacity();
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
      },
      "change:ui.chart.flipSides":function (evt) {
        if (!_this._readyOnce) return;
        _this._updateIndicators();
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
    this.SHIFTEDAGEDIM = "s_age";

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
    var _this = this;
    this.el = (this.el) ? this.el : d3.select(this.element);
    this.element = this.el;

    this.interaction = this._interaction();

    this.graph = this.element.select('.vzb-bc-graph');
    this.yAxisEl = this.graph.select('.vzb-bc-axis-y');
    this.xAxisEl = this.graph.select('.vzb-bc-axis-x');
    this.xAxisLeftEl = this.graph.select('.vzb-bc-axis-x-left');
    this.yTitleEl = this.graph.select('.vzb-bc-axis-y-title');
    this.barsCrop = this.graph.select('.vzb-bc-bars-crop');
    this.labelsCrop = this.graph.select('.vzb-bc-labels-crop');
    this.bars = this.graph.select('.vzb-bc-bars');
    this.labels = this.graph.select('.vzb-bc-labels');

    this.title = this.element.select('.vzb-bc-title');
    this.titleRight = this.element.select('.vzb-bc-title-right');
    this.year = this.element.select('.vzb-bc-year');

    var _this = this;
    this.on("resize", function() {
      _this._updateEntities();
    });
    
    this._attributeUpdaters = {
      _newWidth: function(d, i) {
        d["x_"] = 0;
        d["width_"] =  _this.xScale(_this.shiftedValues[d[_this.AGEDIM]] ? _this.shiftedValues[d[_this.AGEDIM]][d[_this.SIDEDIM]][d[_this.STACKDIM]] : 0);
        if(_this.ui.chart.inpercent) {
          d["width_"] /= _this.total[d[_this.SIDEDIM]];
        }
        return d.width_;
      },
      _newX: function(d, i) {
        var prevSbl = this.previousSibling;
        if(prevSbl) {
          var prevSblDatum = d3.select(prevSbl).datum();
          d["x_"] = prevSblDatum.x_ + prevSblDatum.width_;
        } else {
          d["x_"] = 0;
        }
        return d.x_;
      }
    }
  },

  /*
   * Both model and DOM are ready
   */
  ready: function() {

    this.timeSteps = this.model.time.getAllSteps();

    this.shiftScale = d3.scale.linear()
      .domain([this.timeSteps[0], this.timeSteps[this.timeSteps.length - 1]])
      .range([0, this.timeSteps.length - 1]);

    this.side = this.model.marker.label_side.getEntity();
    this.SIDEDIM = this.side.getDimension();
    this.stack = this.model.marker.label_stack.getEntity();
    this.STACKDIM = this.stack.getDimension() || this.model.marker.color.which;
    this.age = this.model.marker.axis_y.getEntity();
    this.AGEDIM = this.age.getDimension();
    this.TIMEDIM = this.model.time.getDimension();

    this.updateUIStrings();
    this._updateIndicators();
    this._updateLimits();
    this._createStepData(this.model.marker.axis_x);

    this.resize();
    this._updateEntities(true);
    this.updateBarsOpacity();
  },

  updateUIStrings: function() {
    this.translator = this.model.locale.getTFunction();

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
    this.xScale = this.model.marker.axis_x.getScale();
    this.yAxis.tickFormat(_this.model.marker.axis_y.getTickFormatter());
    this.xAxis.tickFormat(_this.model.marker.axis_x.getTickFormatter());
    this.xAxisLeft.tickFormat(_this.model.marker.axis_x.getTickFormatter());

    var sideDim = this.SIDEDIM;
    var stackDim = this.STACKDIM;
    var ageDim = this.AGEDIM;
    var group_by = this.age.grouping || 1;

    var ages = this.model.marker.getKeys(ageDim);
    var ageKeys = [];
    ageKeys = ages.map(function(m) {
        return m[ageDim];
      });
    this.ageKeys = ageKeys;

    this.shiftedAgeKeys = this.timeSteps.map(function(m, i) {return -i * group_by;}).slice(1).reverse().concat(ageKeys);

    var sides = this.model.marker.getKeys(sideDim);
    var sideKeys = [];
    sideKeys = sides.map(function(m) {
        return m[sideDim];
      });

    if(sideKeys.length > 1) {
      var sortFunc = this.ui.chart.flipSides ? d3.ascending : d3.descending;
      sideKeys.sort(sortFunc);
    }
    if(sideKeys.length > 2) sideKeys.length = 2;

    this.sideKeys = sideKeys;

    var stacks = this.model.marker.getKeys(stackDim);
    var stackKeys = [];
    var stackKeys = utils.without(stacks.map(function(m) {
      if(m[stackDim] == _this.totalFieldName) _this.dataWithTotal = true;
      return m[stackDim];
    }), this.totalFieldName);

    var sortedStackKeys = utils.keys(this.model.marker.color.getPalette()).reduce(function(arr, val) {
      if(stackKeys.indexOf(val) != -1) arr.push(val);
      return arr;
    }, []);

    if(sortedStackKeys.length != stackKeys.length) {
      sortedStackKeys = stackKeys.reduce(function(arr, val) {
        if(arr.indexOf(val) == -1) arr.push(val);
        return arr;
      }, sortedStackKeys);
    }
    this.stackKeys = sortedStackKeys;
    this.stackItems = this.model.marker.label_stack.getItems();

    this.stacked = this.ui.chart.stacked && this.model.marker.color.use != "constant" && this.stack.getDimension();

    var sideItems = this.model.marker.label_side.getItems();
    this.twoSided = this.sideKeys.length > 1;
    this.titleRight.classed("vzb-hidden", !this.twoSided);
    if(this.twoSided) {
      this.xScaleLeft = this.xScale.copy();
      this.title.text(sideItems[this.sideKeys[1]]);
      this.titleRight.text(sideItems[this.sideKeys[0]]);
    } else {
      var title = this.sideKeys.length ? sideItems[this.sideKeys[0]] : this.translator("indicator/" + this.model.marker.axis_x.which);
      this.title.text(title);
    }

    this.cScale = this.model.marker.color.getScale();

    var shiftedAgeDim = this.SHIFTEDAGEDIM;
    this.markers = this.model.marker.getKeys(ageDim);
  },

  _updateLimits: function() {
    var _this = this;
    var limits, domain;
    var axisX = this.model.marker.axis_x;
    if(this.ui.chart.inpercent) {
      limits = axisX.getLimitsByDimensions([this.TIMEDIM, this.SIDEDIM, this.AGEDIM, this.STACKDIM]);
      var totals = {};
      var totalCoeff = this.dataWithTotal ? .5 : 1;
      var timeKeys = axisX.getUnique();
      var maxLimits = [];
      utils.forEach(timeKeys, function(time) {
        totals[time] = {};
        utils.forEach(_this.sideKeys, function(side) {
          var ageSum = 0;
          var sideMaxLimits = [];
          utils.forEach(_this.ageKeys, function(age) {
            var stackSum = 0;
            utils.forEach(_this.stackKeys, function(stack) {
              if (limits[time][side][age] && limits[time][side][age][stack])
                stackSum += limits[time][side][age][stack].max;
                ageSum += stackSum;
            });
            sideMaxLimits.push(stackSum);
          });
          totals[time][side] = ageSum;
          sideMaxLimits.map(v => maxLimits.push(v / ageSum));
        });
        _this.totals = totals;
      });
      domain = [0, Math.max.apply(Math, maxLimits)];
    } else {
      limits = axisX.getLimitsByDimensions([this.TIMEDIM, this.SIDEDIM, this.AGEDIM, this.STACKDIM]);
      var timeKeys = axisX.getUnique();
      var maxLimits = [];
      utils.forEach(timeKeys, function(time) {
        utils.forEach(_this.sideKeys, function(side) {
          utils.forEach(_this.ageKeys, function(age) {
            var stackSum = 0;
            utils.forEach(_this.stackKeys, function(stack) {
              if (limits[time][side][age] && limits[time][side][age][stack])
                stackSum += limits[time][side][age][stack].max;
            });
            maxLimits.push(stackSum);
          });
        });
      });

      domain = (axisX.domainMin!=null && axisX.domainMax!=null) ? [+axisX.domainMin, +axisX.domainMax] : [0, Math.max.apply(Math, maxLimits)];
    }
    this.xScale.domain(domain);
    if(this.xScaleLeft) this.xScaleLeft.domain(this.xScale.domain());
  },

  getShiftedValues: function(hook, time, ageData) {
    var _this = this;
    var iterateGroupKeys = function(data, deep, result, cb) {
        deep--;
        utils.forEach(data, function(d, id) {
          if(deep) {
            result[id] = {};
            iterateGroupKeys(d, deep, result[id], cb);
          } else {
            cb(d, result, id);
          }
        });
      }

    var which = hook.which;
    var use = hook.use;
    var dimTime = this.TIMEDIM;
    var response = {};
    var method = hook.getConceptprops ? hook.getConceptprops().interpolation : null;
    var ageDim = this.AGEDIM;
    var deep = this.stepDataDeep - 1;

    utils.forEach(ageData, function(d, id) {
      var age = d[ageDim];
      response[age] = {};
      iterateGroupKeys(_this.stepDataMoved[age], deep, response[age], function(arr, result, id) {
        var next = d3.bisectLeft(arr.map(function(m){return m[dimTime]}), time);

        var value = utils.interpolatePoint(arr, use, which, next, dimTime, time, method);
        result[id] = hook.mapValue(value);
      });
    });

    return response;
  },

  _createStepData: function(hook) {
    var _this = this;
    var timeDim = this.TIMEDIM;
    var sideDim = this.SIDEDIM;
    var stackDim = this.STACKDIM;
    var ageDim = this.AGEDIM;

    this.stepData = {};

    var ageShift = 0;
    var group_by = this.age.grouping || 1;

    var groupArray = [ageDim, sideDim, stackDim];
    this.stepDataDeep = groupArray.length;

    utils.forEach(this.timeSteps, function(time, i) {
      var filter = {};
      filter[timeDim] = time;
      var values = _this.model.marker.getValues(filter, groupArray).axis_x;
      var stepData = _this.stepData[time] = {};
      utils.forEach(_this.shiftedAgeKeys, function(key) {
        var shiftedKey = +key + ageShift;
        var value = values[shiftedKey];
        if(!value) {
          if(shiftedKey < 0) {
            value = values[0];
          } else {
            stepData["null"] = values[0];
          }
        }
        stepData[key] = value;
      });
      ageShift += group_by;
    });

    var stepData = this.stepData;
    var stepDataMoved = {};
    var which = hook.which;
    var use = hook.use;
    utils.forEach(stepData, function(time, timeKey) {
      utils.forEach(time, function(age, ageKey) {
        var allToNull = false;
        if(ageKey == "null") return;
        if(!age && age != 0) {
          age = stepData[timeKey]["null"];
          allToNull = true;
        }
        utils.forEach(age, function(side, sideKey) {
          utils.forEach(side, function(value, stackKey) {
            var age = stepDataMoved[ageKey] || {};
            var side = age[sideKey] || {};
            var stack = side[stackKey] || [];
            var point = {};
            point[timeDim] = new Date(timeKey);
            point[which] = allToNull || value == null ? 0 : value;
            stack.push(point);
            side[stackKey] = stack;
            age[sideKey] = side;
            stepDataMoved[ageKey] = age;
          })
        })
      })
    });

    this.stepDataMoved = stepDataMoved;
  },

  _interpolateBetweenTotals: function(timeSteps, totals, time) {
    var nextStep = d3.bisectLeft(timeSteps, time);
    var fraction = (time - timeSteps[nextStep - 1]) / (timeSteps[nextStep] - timeSteps[nextStep - 1]);
    var total = {};
    utils.forEach(this.sideKeys, side => {
      total[side] = totals[timeSteps[nextStep]][side] * fraction + totals[timeSteps[nextStep - 1]][side] * (1 - fraction);
    });
    return total;
  },

  /**
   * Updates entities
   */
  _updateEntities: function(reorder) {

    var _this = this;
    var time = this.model.time;
    var sideDim = this.SIDEDIM;
    var ageDim = this.AGEDIM;
    var stackDim = this.STACKDIM;
    var timeDim = this.TIMEDIM;
    var duration = (time.playing) ? time.delayAnimations : 0;
    var total;

    var group_by = this.age.grouping || 1;
    //var group_offset = this.model.marker.group_offset ? Math.abs(this.model.marker.group_offset % group_by) : 0;

    if(this.ui.chart.inpercent) {
      this.total = this.totals[time.value] ? this.totals[time.value] : this._interpolateBetweenTotals(this.timeSteps, this.totals, time.value);
    }

    // this.model.marker.getFrame(time.value, function(frame) {
    //   _this.frame = frame;
    // })

    var domain = this.yScale.domain();

    //this.model.age.setVisible(markers);

    var nextStep = d3.bisectLeft(this.timeSteps, time.value);

    var shiftedAgeDim = this.SHIFTEDAGEDIM;

    var markers = this.markers.map(function(data) {
      var o = {};
      o[ageDim] = o[shiftedAgeDim] = +data[ageDim];
      o[ageDim] -= nextStep * group_by;
      return o;
    })

    var ageBars = markers.slice(0);

    var outAge = {};
    outAge[shiftedAgeDim] = markers.length * group_by;
    outAge[ageDim] = outAge[shiftedAgeDim] - nextStep * group_by;

    if (nextStep) ageBars.push(outAge);

    this.shiftedValues = this.stepData[time.value];
    if(!this.shiftedValues) this.shiftedValues = this.getShiftedValues(this.model.marker.axis_x, time.value, ageBars);
    var shiftedValues = this.shiftedValues;

    this.entityBars = this.bars.selectAll('.vzb-bc-bar')
      .data(ageBars, function(d) {return d[ageDim]});

    this.entityLabels = this.labels.selectAll('.vzb-bc-label')
      .data(markers);

    //exit selection
    this.entityBars.exit().remove();
    this.entityLabels.exit().remove();

    var oneBarHeight = this.oneBarHeight;
    var barHeight = this.barHeight;
    var firstBarOffsetY = this.firstBarOffsetY;

    //enter selection -- init bars
    this.entityBars.enter().append("g")
      .attr("class", function(d) {
        return "vzb-bc-bar " + "vzb-bc-bar-" + d[ageDim];
      })

    this.entityBars.attr("class", function(d) {
        return "vzb-bc-bar " + "vzb-bc-bar-" + d[ageDim];
      })


    this.sideBars = this.entityBars.selectAll('.vzb-bc-side').data(function(d) {
      return _this.sideKeys.map(function(m) {
          var r = {};
          r[ageDim] = d[ageDim];
          r[shiftedAgeDim] = d[shiftedAgeDim];
          r[sideDim] = m;
          return r;
        });
      }, function(d) {return d[sideDim]})

    this.sideBars.exit().remove();
    this.sideBars.enter().append("g")
        .attr("class", function(d, i) {
          return "vzb-bc-side " + "vzb-bc-side-" + (!i != !_this.twoSided ? "right": "left");
        })
    this.sideBars.attr("transform", function(d, i) {
          return i ? ("scale(-1,1) translate(" + _this.activeProfile.centerWidth + ",0)") : "";
        })
    
    if(reorder) {
      this.sideBars.attr("transform", function(d, i) {
        return i ? ("scale(-1,1) translate(" + _this.activeProfile.centerWidth + ",0)") : "";
      })
    }

    this.stackBars = this.sideBars.selectAll('.vzb-bc-stack').data(function(d,i) {
          var stacks = _this.stacked ? _this.stackKeys : [_this.totalFieldName];
          return stacks.map(function(m) {
            var r = {};
            r[ageDim] = d[ageDim];
            r[shiftedAgeDim] = d[shiftedAgeDim];
            r[sideDim] = d[sideDim];
            r[stackDim] = m;
            return r;
          });
    }, function(d) {return d[stackDim]});

    this.stackBars.exit().remove();
    this.stackBars.enter().append("rect")
          .attr("class", function(d, i) {
            return "vzb-bc-stack " + "vzb-bc-stack-" + i + (_this.highlighted ? " vzb-dimmed" : "");
          })
          .attr("y", 0)
          .attr("height", barHeight)
          .attr("fill", function(d) {
            return _this.cScale(d[stackDim]);
          })
          .on("mouseover", _this.interaction.mouseover)
          .on("mouseout", _this.interaction.mouseout)
          .on("click", _this.interaction.click)
          .onTap(_this.interaction.tap);

    if(reorder) this.stackBars.order();

    // this.stackBars = this.bars.selectAll('.vzb-bc-bar')
    //   .selectAll('.vzb-bc-side')
    //     .attr("transform", function(d, i) {
    //       return i ? ("scale(-1,1) translate(" + _this.activeProfile.centerWidth + ",0)") : "";
    //     })
    //   .selectAll('.vzb-bc-stack')
    //     .attr("height", barHeight)
    //     .attr("fill", function(d) {
    //       //return _this._temporaryBarsColorAdapter(values, d, ageDim);
    //       //return _this.cScale(values.color[d[ageDim]]);
    //       return _this.cScale(d[stackDim]);
    //     })
    //     //.attr("shape-rendering", "crispEdges") // this makes sure there are no gaps between the bars, but also disables anti-aliasing
    //     .each(function(d, i) {
    //       var total = _this.ui.chart.inpercent ? _this.totalValues[d[sideDim]] : 1;
    //       var sum = 0;
    //       if(shiftedValues[d[ageDim]]) {
    //         if(_this.stacked) {
    //           sum = shiftedValues[d[ageDim]][d[sideDim]][d[stackDim]];
    //         } else {
    //           var stacksData = shiftedValues[d[ageDim]][d[sideDim]];
    //           utils.forEach(stacksData, function(val) {
    //             sum += val;
    //           });
    //         }
    //       }
    //       //var prevWidth = +this.getAttribute("width");
    //       d["width_"] = _this.xScale(sum / total);
    //       //d3.select(this).classed("vzb-hidden", d["width_"] < 1 && prevWidth < 1);

    //       var prevSbl = this.previousSibling;
    //       if(prevSbl) {
    //         var prevSblDatum = d3.select(prevSbl).datum();
    //         d["x_"] = prevSblDatum.x_ + prevSblDatum.width_;
    //       } else {
    //         d["x_"] = 0;
    //       }
    //     });

    var stepShift = (ageBars[0][shiftedAgeDim] - ageBars[0][ageDim]) - this.shiftScale(time.value) * group_by;

    this.entityBars
      .attr("transform", function(d, i) {
        return "translate(0," + (firstBarOffsetY - (d[shiftedAgeDim] - group_by - domain[0]) * oneBarHeight) + ")";
      })
      .transition('age')
      .duration(duration)
      .ease("linear")
      .attr("transform", function(d, i) {
        return "translate(0," + (firstBarOffsetY - (d[shiftedAgeDim] - domain[0] - stepShift) * oneBarHeight) + ")";
      })

    var _attributeUpdaters = this._attributeUpdaters;
    if(duration) {
      this.stackBars
        .transition().duration(duration*.95).ease("linear")
        .attr("width", _attributeUpdaters._newWidth)
        .attr("x", _attributeUpdaters._newX);
    } else {
      this.stackBars.interrupt()
        .attr("width", _attributeUpdaters._newWidth)
        .attr("x", _attributeUpdaters._newX)
        .transition();
    }

    this.entityLabels.enter().append("g")
      .attr("class", "vzb-bc-label")
      .attr("id", function(d) {
        return "vzb-bc-label-" + d[shiftedAgeDim] + "-" + _this._id;
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
        return firstBarOffsetY - (d[shiftedAgeDim] - domain[0]) * oneBarHeight - 10;
      });
      // .style("fill", function(d) {
      //   var color = _this.cScale(values.color[d[ageDim]]);
      //   return d3.rgb(color).darker(2);
      // });

    if(duration) {
      this.year.transition().duration(duration).ease("linear")
        .each("end", this._setYear(time.value));
    } else {
      this.year.interrupt().text(time.formatDate(time.value)).transition();
    }
  },

  _setYear: function(timeValue) {
      var formattedTime = this.model.time.formatDate(timeValue);
      return function() { d3.select(this).text(formattedTime);};
  },

  _interaction: function() {
    var _this = this;
    return {
      mouseover: function(d, i) {
        if(utils.isTouchDevice()) return;
        _this.model.marker.highlightMarker(d);
        _this._showLabel(d);
      },
      mouseout: function(d, i) {
        if(utils.isTouchDevice()) return;
        _this.model.marker.clearHighlighted();
      },
      click: function(d, i) {
        if(utils.isTouchDevice()) return;
        _this.model.marker.selectMarker(d);
      },
      tap: function(d) {
        d3.event.stopPropagation();
        _this.model.marker.selectMarker(d);
      }
    }
  },

  _highlightBars: function(d) {
    var _this = this;
    
    _this.someHighlighted = (_this.model.marker.highlight.length > 0);

    _this.updateBarsOpacity();

    if(!_this.someHighlighted) {
      //hide labels
      _this.labels.selectAll('.vzb-hovered').classed('vzb-hovered', false);
    }
  },

  _showLabel: function(d) {
    var _this = this;
    var formatter = _this.ui.chart.inpercent ? d3.format(".1%") : _this.model.marker.axis_x.getTickFormatter();
    var sideDim = _this.SIDEDIM;
    var ageDim = _this.AGEDIM;
    var stackDim = _this.STACKDIM;
    var shiftedAgeDim = "s_age";

    var left = _this.sideKeys.indexOf(d[sideDim]);
    var label = _this.labels.select("#vzb-bc-label-" + d[shiftedAgeDim] + "-" + _this._id);
    label.selectAll('.vzb-bc-age')
      .text(function(textData) {
        //var total = _this.ui.chart.inpercent ? _this.totalValues[d[sideDim]] : 1;
        var text = _this.stackKeys.length > 1 ? _this.stackItems[d[stackDim]]: textData.text;
        text = _this.twoSided ? text : textData.text + " " + _this.stackItems[d[stackDim]];
        var value = _this.xScale.invert(d["width_"]);
        //var value = (_this.dataWithTotal || _this.stacked) ? _this.values1.axis_x[d[shiftedAgeDim]][d[sideDim]][d[stackDim]] / total : _this.xScale.invert(d["width_"]);
        return text + ": " + formatter(value);
      })
      .attr("x", (left?-1:1) * (_this.activeProfile.centerWidth * .5 + 7))
      .classed("vzb-text-left", left);

    label.classed('vzb-hovered', true);
  },

  /**
   * Executes everytime the container or vizabi is resized
   * Ideally,it contains only operations related to size
   */


  presentationProfileChanges: {
    medium: {
      margin: { right: 80, bottom: 80 },
      infoElHeight: 32
    },
    large: {
      margin: { top: 100, right: 100, left: 100, bottom: 80 },
      infoElHeight: 32
    }
  },

  profiles: {
    "small": {
      margin: {
        top: 70,
        right: 20,
        left: 40,
        bottom: 40
      },
      minRadius: 2,
      maxRadius: 40,
      centerWidth: 2,
      titlesSpacing: 5
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
      centerWidth: 2,
      titlesSpacing: 10
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
      centerWidth: 2,
      titlesSpacing: 20
    }
  },

  resize: function() {

    var _this = this;

    this.activeProfile = this.getActiveProfile(this.profiles, this.presentationProfileChanges);

    //this.activeProfile = this.profiles[this.getLayoutProfile()];
    var margin = this.activeProfile.margin;

    //stage
    this.height = (parseInt(this.element.style("height"), 10) - margin.top - margin.bottom) || 0;
    this.width = (parseInt(this.element.style("width"), 10) - margin.left - margin.right) || 0;

    if(this.height<=0 || this.width<=0) return utils.warn("Pop by age resize() abort: vizabi container is too little or has display:none");

    this.graph
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    this.barsCrop
      .attr("width", this.width)
      .attr("height", Math.max(0, this.height));    

    this.labelsCrop
      .attr("width", this.width)
      .attr("height", Math.max(0, this.height));    
    
    var group_by = this.age.grouping || 1;

    var domain = this.yScale.domain();
    this.oneBarHeight = this.height / (domain[1] - domain[0]);
    var barHeight = this.barHeight = this.oneBarHeight * group_by; // height per bar is total domain height divided by the number of possible markers in the domain
    this.firstBarOffsetY = this.height - this.barHeight;

    if(this.stackBars) this.stackBars.attr("height", barHeight);

    if(this.sideBars) this.sideBars
      .attr("transform", function(d, i) {
        return i ? ("scale(-1,1) translate(" + _this.activeProfile.centerWidth + ",0)") : "";
      })


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
      .tickSize(-this.width, 0)
      .tickPadding(6)
      .tickSizeMinor(-this.width, 0)
      .labelerOptions({
        scaleType: this.model.marker.axis_y.scaleType,
        toolMargin: margin,
        limitMaxTickNumber: 19
      });

    var format = this.ui.chart.inpercent ? d3.format((group_by > 3 ? "":".1") + "%") : this.model.marker.axis_x.getTickFormatter();

    this.xAxis.scale(this.xScale)
      .orient("bottom")
      .tickFormat(format)
      .tickSize(-this.height, 0)
      .tickPadding(6)
      .tickSizeMinor(-this.height, 0)
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
    this.xAxisLeftEl.classed("vzb-hidden", !this.twoSided);
    if(this.twoSided) {
      if(this.model.marker.axis_x.scaleType !== "ordinal") {
        this.xScaleLeft.range([(this.width - this.activeProfile.centerWidth) * .5, 0]);
      } else {
        this.xScaleLeft.rangePoints([(this.width - this.activeProfile.centerWidth) * .5, 0]).range();
      }

      this.xAxisLeft.scale(this.xScaleLeft)
        .orient("bottom")
        .tickFormat(format)
        .tickSize(-this.height, 0)
        .tickPadding(6)
        .tickSizeMinor(-this.height, 0)
        .labelerOptions({
          scaleType: this.model.marker.axis_x.scaleType,
          toolMargin: margin,
          limitMaxTickNumber: 6
        });

      this.xAxisLeftEl.attr("transform", "translate(0," + this.height + ")")
        .call(this.xAxisLeft);
      var zeroTickEl = this.xAxisEl.select(".tick text");
      if(!zeroTickEl.empty()) {
        var zeroTickWidth = zeroTickEl.node().getBBox().width;
        zeroTickEl.attr("dx", -(this.activeProfile.centerWidth + zeroTickWidth) * .5)
      }
    }

    this.bars.attr("transform", "translate(" + translateX + ",0)");
    this.labels.attr("transform", "translate(" + translateX + ",0)");

    this.title
      .attr('x', margin.left + (this.twoSided ? translateX - this.activeProfile.titlesSpacing : 0))
      .style('text-anchor', this.twoSided ? "end":"")
      .attr('y', margin.top / 2);
    this.titleRight
      .attr('x', margin.left + translateX + this.activeProfile.titlesSpacing)
      .attr('y', margin.top / 2);

    this.year.attr('x', this.width + margin.left).attr('y', margin.top / 2);

  },

  updateBarsOpacity: function(duration) {
    var _this = this;
    //if(!duration)duration = 0;

    var OPACITY_HIGHLT = 1.0;
    var OPACITY_HIGHLT_DIM = this.model.marker.opacityHighlightDim;
    var OPACITY_SELECT = this.model.marker.opacityRegular;
    var OPACITY_REGULAR = this.model.marker.opacityRegular;
    var OPACITY_SELECT_DIM = this.model.marker.opacitySelectDim;

    this.stackBars
      //.transition().duration(duration)
      .style("opacity", function(d) {

        if(_this.someHighlighted) {
          //highlight or non-highlight
          if(_this.model.marker.isHighlighted(d)) return OPACITY_HIGHLT;
        }

        if(_this.someSelected) {
          //selected or non-selected
          return _this.model.marker.isSelected(d) ? OPACITY_SELECT : OPACITY_SELECT_DIM;
        }

        if(_this.someHighlighted) return OPACITY_HIGHLT_DIM;

        return OPACITY_REGULAR;
      });


    var nonSelectedOpacityZero = _this.model.marker.opacitySelectDim < .01;

    // when pointer events need update...
    if(nonSelectedOpacityZero != this.nonSelectedOpacityZero) {
      this.stackBars.style("pointer-events", function(d) {
        return(!_this.someSelected || !nonSelectedOpacityZero || _this.model.marker.isSelected(d)) ?
          "visible" : "none";
      });
    }

    this.nonSelectedOpacityZero = _this.model.marker.opacitySelectDim < .01;
  }

});

export default AgePyramid;
