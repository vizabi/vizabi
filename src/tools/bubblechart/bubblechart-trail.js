import * as utils from 'base/utils';
import Class from 'base/class';
import Promise from 'promise';

export default Class.extend({

  init: function(context) {
    this.context = context;
    this._isCreated = null;
    this.actionsQueue = {};
    this.entityTrails = {};
    this.trailsData = [];
    this.trailTransitions = {};
  },

  toggle: function(arg) {
    var _context = this.context;
    if(arg) {
      _context._trails.create();
      _context._trails.run(["findVisible", "reveal", "opacityHandler"]);
    } else {
      _context._trails.run("remove");
      _context.model.entities.select.forEach(function(d) {
        d.trailStartTime = null;
      });
    }
  },

  create: function(selection) {
    var _context = this.context;
    var _this = this;
    var KEY = _context.KEY;
    this._isCreated = new Promise(function(resolve, reject) {
      //quit if the function is called accidentally
      if(!_context.model.ui.chart.trails) return;

      var timePoints = _context.model.time.getAllSteps();

      //work with entities.select (all selected entities), if no particular selection is specified
      var promises = [];
      selection = selection == null ? _context.model.entities.select : [selection];
      _this._clearActions(selection);
      _this.trailsData = _context.model.entities.select.map(function(d) {
        var r = {};
        r[KEY] = d[KEY];
        // used for prevent move trail start time forward when we have empty values at end of time range
        r.actionInProgress = null;
        r["selectedEntityData"] = d;
        return r;
      });
      _this.trailTransitions = {};
      var _trails = _context.bubbleContainer.selectAll('g.vzb-bc-entity.entity-trail')
        .data(_this.trailsData, function(d) {
          return(d[KEY]);
        });
        
      _trails.exit().remove();
      _trails.enter()
        .insert("g", function(d) { 
          return this.querySelector(".bubble-" + d[KEY]);
        })
        .attr("class", function(d) {
          return "vzb-bc-entity entity-trail trail-" + d[KEY];
        });
      _trails.each(function(d, index) {
          var defer = new Promise();
          // used for prevent move trail start time forward when we have empty values at end of time range
          promises.push(defer);
          var trailSegmentData = timePoints.map(function(m) {
            return {
              t: m,
              key: d[KEY]
            }
          });
          _this.entityTrails[d[KEY]] = d3.select(this).selectAll("g").data(trailSegmentData);
          
          _this.entityTrails[d[KEY]].exit().remove();
          
          _this.entityTrails[d[KEY]].enter().append("g")
            .attr("class", "vzb-bc-trailsegment")
            .on("mouseover", function(segment, index) {
              if(utils.isTouchDevice()) return;

              var pointer = {};
              pointer[KEY] = segment.key;
              pointer.time = segment.t;

              _context._axisProjections(pointer);
              _context._labels.highlight(d, true);
              var text = _context.model.time.timeFormat(segment.t);
              var selectedData = utils.find(_context.model.entities.select, function(f) {
                return f[KEY] == d[KEY]
              });
              _context.model.marker.getFrame(pointer.time, function(values) {
                var x = _context.xScale(values.axis_x[pointer[KEY]]);
                var y = _context.yScale(values.axis_y[pointer[KEY]]);
                var s = utils.areaToRadius(_context.sScale(values.size[pointer[KEY]]));
                var c = values.color[pointer[KEY]]!=null?_context.cScale(values.color[pointer[KEY]]):_context.COLOR_WHITEISH;
                if(text !== selectedData.trailStartTime) {
                  _context._setTooltip(text, x, y, s + 3, c);
                }
                _context._setBubbleCrown(x, y, s, c);
                _context.model.entities.getModelObject("highlight").trigger('change', {'size': values.size[pointer[KEY]], 'color': values.color[pointer[KEY]]});
              });
              //change opacity to OPACITY_HIGHLT = 1.0;
              d3.select(this).style("opacity", 1.0);
            })
            .on("mouseout", function(segment, index) {
              if(utils.isTouchDevice()) return;
              _context._axisProjections();
              _context._setTooltip();
              _context._setBubbleCrown();
              _context._labels.highlight(null, false);
              _context.model.entities.getModelObject("highlight").trigger('change', null);
              d3.select(this).style("opacity", _context.model.entities.opacityRegular);
            })
            .each(function(segment, index) {
              var view = d3.select(this);
              view.append("circle");
              view.append("line");
            });
          defer.resolve();
        });
      if (promises.length > 0) {
        Promise.all(promises).then(function (segments) {
          resolve(true);
        });
      } else {
        resolve(true);
      }
    });
    return this._isCreated;
  },

  /**
   * add actions for each selected entities
   * @param selections
   * @param actions
   * @private
   */
  _addActions: function(selections, actions) {
    var _context = this.context;
    var _this = this;
    var KEY = _context.KEY;

    selections.forEach(function(d) {
      if (!_this.actionsQueue[d[KEY]]) _this.actionsQueue[d[KEY]] = [];
      _this.actionsQueue[d[KEY]] = [].concat(_this.actionsQueue[d[KEY]].filter(function(value) {
        return actions.indexOf(value) == -1;
      }), actions);
    });
  },

  _clearActions: function(selections) {
    var _context = this.context;
    var _this = this;
    var KEY = _context.KEY;

    selections.forEach(function(d) {
      if (!_this.actionsQueue[d[KEY]]) _this.actionsQueue[d[KEY]] = [];
      _this.actionsQueue[d[KEY]] = [];
    });
  },

  _getNextAction: function(key) {
    return this.actionsQueue[key].shift();
  },
  
  run: function(actions, selection, duration) {
    var _context = this.context;
    var _this = this;
    var KEY = _context.KEY;
    if (!this._isCreated || _context.model.time.splash) return;
    this._isCreated.then(function() {
      //quit if function is called accidentally
      if((!_context.model.ui.chart.trails || !_context.model.entities.select.length) && actions != "remove") return;

      if(!duration) duration = 0;

      //work with entities.select (all selected entities), if no particular selection is specified
      selection = selection == null ? _context.model.entities.select : [selection];
      _this._addActions(selection, actions);
      _this.trailsData.forEach(function(d) {

        var trail = _this.entityTrails[d[KEY]];
        //do all the actions over "trail"
        var executeSequential = function(index) { // some function can be async, but we should run next when previous completed
          var action = _this._getNextAction(d[KEY]);
          if (action) {
            d.actionInProgress = action;
            var response = _context._trails["_" + action](trail, duration, d);
            if (response && response instanceof Promise) {
              response.then(function() {
                d.actionInProgress = null;
                executeSequential(index + 1);
              })
            } else {
              d.actionInProgress = null;
              executeSequential(index + 1);
            }
          }
        };
        if (!d.actionInProgress) {
          executeSequential(0);
        }
      });
    });

  },


  _remove: function(trail, duration, d) {
    this.actionsQueue[d[this.context.KEY]] = []; 
    if (trail) { // TODO: in some reason run twice 
      d3.select(this.entityTrails[d[this.context.KEY]].node().parentNode).remove();
      this.entityTrails[d[this.context.KEY]] = null;
    }
  },

  _resize: function(trail, duration, d) {
    var _context = this.context;
    if (_context.model.time.splash) {
      return;
    }
//    this._isCreated.then(function() {
    var updateLabel = false;

    trail.each(function(segment, index) {
        
      if(segment.valueY==null || segment.valueX==null || segment.valueS==null) return;

      var view = d3.select(this);
      if (duration) {
        view.select("circle")
          .transition().duration(duration).ease("linear")
          .attr("cy", _context.yScale(segment.valueY))
          .attr("cx", _context.xScale(segment.valueX))
          .attr("r", utils.areaToRadius(_context.sScale(segment.valueS)));
      } else {
        view.select("circle").interrupt()
          .attr("cy", _context.yScale(segment.valueY))
          .attr("cx", _context.xScale(segment.valueX))
          .attr("r", utils.areaToRadius(_context.sScale(segment.valueS)))
          .transition();
      }

      if(!updateLabel && !segment.transparent) {
        updateLabel = true;
        _context._labels.updateLabelOnlyPosition(d, null, {'scaledS0': utils.areaToRadius(_context.sScale(segment.valueS))});
      }

      if(!this.nextSibling) return;
      var next = d3.select(this.nextSibling).datum();
      if(next == null) return;
      if(next.valueY==null || next.valueX==null) return;
        
      var lineLength = Math.sqrt(
          Math.pow(_context.xScale(segment.valueX) - _context.xScale(next.valueX),2) +
          Math.pow(_context.yScale(segment.valueY) - _context.yScale(next.valueY),2)
      );
      if (duration) {
        view.select("line")
          .transition().duration(duration).ease("linear")
          .attr("x1", _context.xScale(next.valueX))
          .attr("y1", _context.yScale(next.valueY))
          .attr("x2", _context.xScale(segment.valueX))
          .attr("y2", _context.yScale(segment.valueY))
          .style("stroke-dasharray", lineLength)
          .style("stroke-dashoffset", utils.areaToRadius(_context.sScale(segment.valueS)));
      } else {
        view.select("line").interrupt()
          .attr("x1", _context.xScale(next.valueX))
          .attr("y1", _context.yScale(next.valueY))
          .attr("x2", _context.xScale(segment.valueX))
          .attr("y2", _context.yScale(segment.valueY))
          .style("stroke-dasharray", lineLength)
          .style("stroke-dashoffset", utils.areaToRadius(_context.sScale(segment.valueS)))
          .transition();
      }
    });
  },

  _recolor: function(trail, duration, d) {
    var _context = this.context;

    trail.each(function(segment, index) {

      var view = d3.select(this);

      var strokeColor = _context.model.marker.color.which == "geo.world_4region"?
        //use predefined shades for color palette for "geo.world_4region" (hardcoded)
        _context.model.marker.color.getColorShade({
          colorID: segment.valueC,
          shadeID: "shade"
        })
        :
        //otherwise use color of the bubble with a fallback to bubble stroke color (blackish)
        (segment.valueC!=null?_context.cScale(segment.valueC):_context.COLOR_BLACKISH);

      view.select("circle")
        //.transition().duration(duration).ease("linear")
        .style("fill", segment.valueC!=null?_context.cScale(segment.valueC):_context.COLOR_WHITEISH);
      view.select("line")
        //.transition().duration(duration).ease("linear")
        .style("stroke", strokeColor);
    });
  },

  _opacityHandler: function(trail, duration, d) {
    var _context = this.context;

    trail.each(function(segment, index) {

      var view = d3.select(this);

      view
        //.transition().duration(duration).ease("linear")
        .style("opacity", d.opacity || _context.model.entities.opacityRegular);
    });
  },


  _findVisible: function(trail, duration, d) {
    var _context = this.context;
    var KEY = _context.KEY;
    return new Promise(function(resolve, reject) {
      var defer = new Promise();
      if (!d.limits) {
        _context.model.marker.getEntityLimits(d[KEY]).then(function(limits) {
          d.limits = limits;
          defer.resolve();
        });
      } else {
        defer.resolve();
      }
      defer.then(function() {
        var trailStartTime = _context.model.time.timeFormat.parse("" + d.selectedEntityData.trailStartTime);
        if (_context.time - trailStartTime < 0 || d.limits.min - trailStartTime > 0) {
          if (_context.time - trailStartTime < 0) {
            // move trail start time with trail label back if need
            d.selectedEntityData.trailStartTime = _context.model.time.timeFormat(d3.max([_context.time, d.limits.min]));
            trailStartTime = _context.model.time.timeFormat.parse("" + d.selectedEntityData.trailStartTime);
          } else {
            // move trail start time with trail label to start time if need
            d.selectedEntityData.trailStartTime = _context.model.time.timeFormat(d.limits.min);
            trailStartTime = _context.model.time.timeFormat.parse("" + d.selectedEntityData.trailStartTime);
          }
          var cache = _context._labels.cached[d[KEY]];
          cache.labelX0 = _context.frame.axis_x[d[KEY]];
          cache.labelY0 = _context.frame.axis_y[d[KEY]];
          var valueS = _context.frame.size[d[KEY]];
          cache.scaledS0 = (valueS || valueS===0) ? utils.areaToRadius(_context.sScale(valueS)) : null;
          var valueC = _context.frame.color[d[KEY]];
          cache.scaledC0 = valueC != null ? _context.cScale(valueC) : _context.COLOR_WHITEISH;
          _context._updateLabel(d, 0, _context.frame.axis_x[d[KEY]], _context.frame.axis_y[d[KEY]], _context.frame.size[d[KEY]], _context.frame.color[d[KEY]], _context.frame.label[d[KEY]], _context.frame.size_label[d[KEY]], 0, true);
        }
        trail.each(function(segment, index) {
          // segment is transparent if it is after current time or before trail StartTime
          var segmentVisibility = segment.transparent;
          segment.transparent = d.selectedEntityData.trailStartTime == null || (segment.t - _context.time > 0) || (trailStartTime - segment.t > 0)
              //no trail segment should be visible if leading bubble is shifted backwards, beyond start time
            || (d.selectedEntityData.trailStartTime - _context.model.time.timeFormat(_context.time) >= 0);
          // always update nearest 2 points
          if (segmentVisibility != segment.transparent || Math.abs(_context.model.time.timeFormat(segment.t) - _context.model.time.timeFormat(_context.time)) < 2) segment.visibilityChanged = true; // segment changed, so need to update it
        });
        resolve();
      });
    });
  },

  _abortAnimation: function() {
    var _context = this.context;
    var _this = this;
    var KEY = _context.KEY;
    _this.trailsData.forEach(function(d) {
      if (_this.trailTransitions[d[KEY]]) {
        _this.trailTransitions[d[KEY]].select('line').interrupt().transition();
      }
    });
  },

  _reveal: function(trail, duration, d) {
    var _context = this.context;
    var _this = this;
    var KEY = _context.KEY;
    var trailStartTime = _context.model.time.timeFormat.parse("" + d.selectedEntityData.trailStartTime);
    var generateTrailSegment = function(trail, index, nextIndex, level) {
      return new Promise(function(resolve, reject) {
        
        var view = d3.select(trail[0][index]);

        var segment = view.datum();
        
        //console.log(d[KEY] + " transparent: " + segment.transparent + " vis_changed:" + segment.visibilityChanged);
        if (nextIndex - index == 1) {
          if(segment.transparent) {
            view.classed("vzb-invisible", segment.transparent);
            resolve();
          } else if (!segment.visibilityChanged) { // pass segment if it is not changed
            resolve();
          }
        }
        _context.model.marker.getFrame(segment.t, function(frame) {
          if (!frame) return resolve();
          segment.valueY = frame.axis_y[d[KEY]];
          segment.valueX = frame.axis_x[d[KEY]];
          segment.valueS = frame.size[d[KEY]];
          segment.valueC = frame.color[d[KEY]];

          if(segment.valueY==null || segment.valueX==null || segment.valueS==null) {
            resolve();
          } else {
            // fix label position if it not in correct place
            if (trailStartTime && trailStartTime.toString() == segment.t.toString()) {
                var cache = _context._labels.cached[d[KEY]];
                cache.labelX0 = segment.valueX;
                cache.labelY0 = segment.valueY;
                var valueS = segment.valueS;
                cache.scaledS0 = (valueS || valueS===0) ? utils.areaToRadius(_context.sScale(valueS)) : null;
                cache.scaledC0 = segment.valueC!=null?_context.cScale(segment.valueC):_context.COLOR_WHITEISH;
                _context._updateLabel(d, index, segment.valueX, segment.valueY, segment.valueS, segment.valueC, frame.label[d[KEY]], frame.size_label[d[KEY]], 0, true);
            }
            view.select("circle")
              //.transition().duration(duration).ease("linear")
              .attr("cy", _context.yScale(segment.valueY))
              .attr("cx", _context.xScale(segment.valueX))
              .attr("r", utils.areaToRadius(_context.sScale(segment.valueS)))
              .style("fill", segment.valueC!=null?_context.cScale(segment.valueC):_context.COLOR_WHITEISH);

            view.select("line")
              .attr("x2", _context.xScale(segment.valueX))
              .attr("y2", _context.yScale(segment.valueY))
              .attr("x1", _context.xScale(segment.valueX))
              .attr("y1", _context.yScale(segment.valueY));

            // last point should have data for line but it is invisible
            if (_context.time - segment.t > 0) {
              segment.visibilityChanged = false;
              view.classed("vzb-invisible", segment.transparent);
            } else {
              view.classed("vzb-invisible", true);
            }

            if(!trail[0][nextIndex] || _context.time.toString() == segment.t.toString()) {
              resolve();
            } else {
              var next = d3.select(trail[0][nextIndex]);
              var nextSegment = next.datum();
              var nextTime = nextSegment.t;
              if (_context.time - nextSegment.t < 0) { // time is not equal start of year
                segment.visibilityChanged = true; // redraw needed next time because line not have full length
                nextTime = _context.time; 
              }
              _context.model.marker.getFrame(nextTime, function(nextFrame) {
                if(!nextFrame || segment.valueY==null || segment.valueX==null || segment.valueS==null) {
                  resolve();
                } else {
                  if(nextFrame.axis_x[d[KEY]]==null || nextFrame.axis_y[d[KEY]]==null) {
                    resolve();
                  } else {
                    nextSegment.valueY = nextFrame.axis_y[d[KEY]];
                    nextSegment.valueX = nextFrame.axis_x[d[KEY]];
                    nextSegment.valueS = nextFrame.size[d[KEY]];
                    nextSegment.valueC = nextFrame.color[d[KEY]];

                    _this.trailTransitions[d[KEY]] = view;
                    var strokeColor = _context.model.marker.color.which == "geo.world_4region"?
                      //use predefined shades for color palette for "geo.world_4region" (hardcoded)
                      _context.model.marker.color.getColorShade({
                        colorID: segment.valueC,
                        shadeID: "shade"
                      })
                      :
                      //otherwise use color of the bubble with a fallback to bubble stroke color (blackish)
                      (segment.valueC!=null?_context.cScale(segment.valueC):_context.COLOR_BLACKISH);

                    var lineLength = Math.sqrt(
                      Math.pow(_context.xScale(segment.valueX) - _context.xScale(nextFrame.axis_x[d[KEY]]),2) +
                      Math.pow(_context.yScale(segment.valueY) - _context.yScale(nextFrame.axis_y[d[KEY]]),2)
                    );
                    view.select("line")
                      .transition().duration(duration).ease("linear")
                      .attr("x1", _context.xScale(nextSegment.valueX))
                      .attr("y1", _context.yScale(nextSegment.valueY))
                      .attr("x2", _context.xScale(segment.valueX))
                      .attr("y2", _context.yScale(segment.valueY))
                      .style("stroke-dasharray", lineLength)
                      .style("stroke-dashoffset", utils.areaToRadius(_context.sScale(segment.valueS)))
                      .style("stroke", strokeColor);
                    if (nextIndex - index > 1) {
                      var mediumIndex = Math.round(index + (nextIndex - index) / 2);
                      _this.delayedIterations.push({
                        first: index,
                        next: nextIndex,
                        medium: mediumIndex
                      });
                      resolve();
                    } else {
                      resolve();
                    }
                  }
                }
              });
            }
          }
        });          
      });
    };
    var addPointBetween = function(previousIndex, nextIndex, index) {
      return new Promise(function(resolve, reject) {
        var previous = d3.select(trail[0][previousIndex]);
        var next = d3.select(trail[0][nextIndex]);
        var view = d3.select(trail[0][index]);
        var previousSegment = previous.datum();
        var nextSegment = next.datum();
        var segment = view.datum();
        _context.model.marker.getFrame(segment.t, function(frame) {
          if (!frame) return resolve();
          segment.valueY = frame.axis_y[d[KEY]];
          segment.valueX = frame.axis_x[d[KEY]];
          segment.valueS = frame.size[d[KEY]];
          segment.valueC = frame.color[d[KEY]];

          if(segment.valueY==null || segment.valueX==null || segment.valueS==null) {
            utils.warn("Data for trail point missed: " + segment.t);
            resolve();
            return;
          }

          var strokeColor = _context.model.marker.color.which == "geo.world_4region"?
            //use predefined shades for color palette for "geo.world_4region" (hardcoded)
            _context.model.marker.color.getColorShade({
              colorID: segment.valueC,
              shadeID: "shade"
            })
            :
            //otherwise use color of the bubble with a fallback to bubble stroke color (blackish)
            (segment.valueC!=null?_context.cScale(segment.valueC):_context.COLOR_BLACKISH);

          var firstLineLength = Math.sqrt(
            Math.pow(_context.xScale(previousSegment.valueX) - _context.xScale(segment.valueX), 2) +
            Math.pow(_context.yScale(previousSegment.valueY) - _context.yScale(segment.valueX), 2)
          );

          previous.select("line")
            .transition().duration(duration).ease("linear")
            .attr("x1", _context.xScale(segment.valueX))
            .attr("y1", _context.yScale(segment.valueY))
            .attr("x2", _context.xScale(previousSegment.valueX))
            .attr("y2", _context.yScale(previousSegment.valueY))
            .style("stroke-dasharray", firstLineLength)
            .style("stroke-dashoffset", utils.areaToRadius(_context.sScale(previousSegment.valueS)))
            .style("stroke", strokeColor);

          view.classed("vzb-invisible", segment.transparent);

          if (!segment.transparent) {
            view.select("circle")
              //.transition().duration(duration).ease("linear")
              .attr("cy", _context.yScale(segment.valueY))
              .attr("cx", _context.xScale(segment.valueX))
              .attr("r", utils.areaToRadius(_context.sScale(segment.valueS)))
              .style("fill", segment.valueC!=null?_context.cScale(segment.valueC):_context.COLOR_WHITEISH);

            var secondLineLength = Math.sqrt(
              Math.pow(_context.xScale(segment.valueX) - _context.xScale(nextSegment.valueX), 2) +
              Math.pow(_context.yScale(segment.valueY) - _context.yScale(nextSegment.valueY), 2)
            );

            view.select("line")
              .transition().duration(duration).ease("linear")
              .attr("x1", _context.xScale(nextSegment.valueX))
              .attr("y1", _context.yScale(nextSegment.valueY))
              .attr("x2", _context.xScale(segment.valueX))
              .attr("y2", _context.yScale(segment.valueY))
              .style("stroke-dasharray", secondLineLength)
              .style("stroke-dashoffset", utils.areaToRadius(_context.sScale(segment.valueS)))
              .style("stroke", strokeColor);
          }

          var promises = [], mediumIndex;
          if (index - previousIndex > 1) {
            mediumIndex = Math.round(previousIndex + (index - previousIndex) / 2);
            _this.delayedIterations.push({
              first: previousIndex,
              next: index,
              medium: mediumIndex
            });
          }
          if (nextIndex - index > 1) {
            mediumIndex = Math.round(index + (nextIndex - index) / 2);
            _this.delayedIterations.push({
              first: index,
              next: nextIndex,
              medium: mediumIndex
            });
          }
          resolve()
        });
      });
    }; 
    
    var defer = new Promise();

    var _generateKeys = function(d, trail, div) {
      var response = [];
      var min = 0, max = 0;
      utils.forEach(trail[0], function(segment, index) {
        var data = segment.__data__;
        if (data.t -  d.limits.min == 0) {
          min = index;
        } else if (data.t -  d.limits.max == 0) {
          max = index;
        } else {
          if (data.t >  d.limits.min && data.t <  d.limits.max) {
            if (_context.model.time.timeFormat(data.t) % div == 0) {
              response.push(index);
            }
          }
        }
      });
      response.unshift(min);
      response.push(max);
      return response;  
    };
    
    var processPointsBetween = function(points) {
      Promise.all(points).then(function () {
        if (_this.delayedIterations.length == 0) {
          defer.resolve();
        } else {
          var iterations = _this.delayedIterations;
          _this.delayedIterations = [];
          var segments = [];
          for (var i = 0; i < iterations.length - 1; i++) {
            segments.push(addPointBetween(iterations[i].first, iterations[i].next, iterations[i].medium));
          }
          processPointsBetween(segments);
        }
      });
    };
    
    var generateTrails = function(trail, index) {
      if (index < 0 || index >= trail[0].length) {
        return defer.resolve();
      }
      generateTrailSegment(trail, index, index + 1).then(function() {
        generateTrails(trail, index + 1);
      });
    };

    if (_context.model.marker.framesAreReady()) {
      generateTrails(trail, 0);
    } else {
      var trailKeys = _generateKeys(d, trail, 50);
      var segments = [];
      _this.delayedIterations = [];
      for (var i = 0; i < trailKeys.length - 1; i++) {
        segments.push(generateTrailSegment(trail, trailKeys[i], trailKeys[i + 1], 1));
      }
      Promise.all(segments).then(function() {
        if (_this.delayedIterations.length == 0) {
          defer.resolve();
        } else {
          var iterations = _this.delayedIterations;
          segments = [];
          for (var i = 0; i < iterations.length - 1; i++) {
            segments.push(addPointBetween(iterations[i].first, iterations[i].next, iterations[i].medium));
          }
          processPointsBetween(segments);
        }
      });
    }
    return defer;
  }


});
