import * as utils from 'base/utils';
import Class from 'base/class';

export default Class.extend({

  init: function(context) {
    this.context = context;
    this._isCreated = null;
    this.actionsQueue = {};
    this.entityTrails = {};
    this.trailsData = [];
    this.trailsInProgress = {};
    this.activePromises = {};
    this.trailTransitions = {};
    this.delayedIterations = {};
    this.drawingQueue = {};
  },

  toggle: function(arg) {
    var _context = this.context;
    if(arg) {
      
      _context._trails.create().then(function() {
        _context._trails.run(["findVisible", "reveal", "opacityHandler"]);
      })
    } else {
      _context._trails.run("remove");
      _context.model.marker.select.forEach(function(d) {
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

      //work with marker.select (all selected entities), if no particular selection is specified
      var promises = [];
      selection = selection == null ? _context.model.marker.select : [selection];
      _this._clearActions(selection);
      _this.trailsData = _context.model.marker.select.map(function(d) {
        var r = {
          status: "created",
          selectedEntityData: d
        };
        r[KEY] = d[KEY];
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
          // used for prevent move trail start time forward when we have empty values at end of time range
        var trail = this;  
        promises.push(new Promise(function(resolve, reject) {
            var trailSegmentData = timePoints.map(function(m) {
              return {
                t: m,
                key: d[KEY]
              }
            });
            _this.entityTrails[d[KEY]] = d3.select(trail).selectAll("g")
              .data(trailSegmentData)
              .classed("vzb-invisible", true);

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
                var selectedData = utils.find(_context.model.marker.select, function(f) {
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
                  _context.model.marker.getModelObject("highlight").trigger('change', {'size': values.size[pointer[KEY]], 'color': values.color[pointer[KEY]]});
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
                _context.model.marker.getModelObject("highlight").trigger('change', null);
                d3.select(this).style("opacity", _context.model.marker.opacityRegular);
              })
              .each(function(segment, index) {
                var view = d3.select(this);
                view.append("circle");
                view.append("line");
              });
            resolve();
          }));
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
      _this.drawingQueue[d[KEY]] = {};
      _this.delayedIterations[d[KEY]] = {};
      if (!_this.activePromises[d[KEY]]) _this.activePromises[d[KEY]] = [];
      utils.forEach(_this.activePromises[d[KEY]], function(promise, key) {
        if (promise.status === "pending") promise.reject(); 
      });
      _this.trailsInProgress[d[KEY]] = null;
      _this.activePromises[d[KEY]] = [];
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
    if (typeof actions == "string") actions = [actions];

    this._isCreated.then(function() {
      //quit if function is called accidentally
      if((!_context.model.ui.chart.trails || !_context.model.marker.select.length) && actions != "remove") return;

      if(!duration) duration = 0;

      //work with marker.select (all selected entities), if no particular selection is specified
      selection = selection == null ? _context.model.marker.select : [selection];
      for (var i = 0; i < actions.length; i++) {
        if (["resize", "recolor"].indexOf(actions[i]) != -1) {
          var action = actions.splice(i, 1).pop();
          --i;
          _this.trailsData.forEach(function(d) {
            var trail = _this.entityTrails[d[KEY]];
            _context._trails["_" + action](trail, duration, d);
          });
        }
      }
      if (actions.length == 0) {
        return;
      }
      _this._addActions(selection, actions);
      _this.trailsData.forEach(function(d) {
        if (actions.indexOf('findVisible') != -1) {
          _this.drawingQueue[d[KEY]] = {};
          _this.delayedIterations[d[KEY]] = {};
        }
        var trail = _this.entityTrails[d[KEY]];
        //do all the actions over "trail"
        var executeSequential = function(index) { // some function can be async, but we should run next when previous completed
          var action = _this._getNextAction(d[KEY]);
          if (action) {
            _this.trailsInProgress[d[KEY]] = action;
            var response = _context._trails["_" + action](trail, duration, d);
            if (response && response instanceof Promise) {
              response.then(function() {
                _this.trailsInProgress[d[KEY]] = null;
                executeSequential(index + 1);
              }, function() {
                _this.trailsInProgress[d[KEY]] = null;
              })
            } else {
              _this.trailsInProgress[d[KEY]] = null;
              executeSequential(index + 1);
            }
          }
        };
        if (!_this.trailsInProgress[d[KEY]]) {
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

      if(!segment.next) return;
      var next = segment.next;
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
        .style("opacity", d.opacity || _context.model.marker.opacityRegular);
    });
  },


  _findVisible: function(trail, duration, d) {
    var _context = this.context;
    var _this = this;
    var KEY = _context.KEY;
    return new Promise(function(resolve, reject) {
      new Promise(function(resolve1, reject1) {
        if (!d.limits) {
          _context.model.marker.getEntityLimits(d[KEY]).then(function(limits) {
            d.limits = limits;
            resolve1();
          });
        } else {
          resolve1();
        }
      }).then(function() {
          if (!d.selectedEntityData.trailStartTime) {
            d.selectedEntityData.trailStartTime = _context.model.time.timeFormat(_context.time);
          }
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
            var valueS = _context.frame.size[d[KEY]];
            var valueC = _context.frame.color[d[KEY]];
            cache.labelX0 = _context.frame.axis_x[d[KEY]];
            cache.labelY0 = _context.frame.axis_y[d[KEY]];
            cache.scaledS0 = (valueS || valueS===0) ? utils.areaToRadius(_context.sScale(valueS)) : null;
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
            if (segment.transparent) {
              d3.select(trail[0][index]).classed("vzb-invisible", segment.transparent);
            }
          });
          _this.drawingQueue[d[KEY]] = {};
          _this.delayedIterations[d[KEY]] = {};
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
    d.status = "reveal";
    var trailStartTime = _context.model.time.timeFormat.parse("" + d.selectedEntityData.trailStartTime);
    var generateTrailSegment = function(trail, index, nextIndex, level) {
      return new Promise(function(resolve, reject) {
        var view = d3.select(trail[0][index]);

        var segment = view.datum();

        //console.log(d[KEY] + " transparent: " + segment.transparent + " vis_changed:" + segment.visibilityChanged);
        if (nextIndex - index == 1) {
          if(segment.transparent) {
            view.classed("vzb-invisible", segment.transparent);
            return resolve();
          } else if (!segment.visibilityChanged) { // pass segment if it is not changed
            return resolve();
          }
        }
        _context.model.marker.getFrame(segment.t, function(frame) {
          if (d.status != "reveal") return resolve();
          if (!frame) return resolve();
          segment.valueY = frame.axis_y[d[KEY]];
          segment.valueX = frame.axis_x[d[KEY]];
          segment.valueS = frame.size[d[KEY]];
          segment.valueC = frame.color[d[KEY]];

          if(segment.valueY==null || segment.valueX==null || segment.valueS==null) {
            return resolve();
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
              return resolve();
            } else {
              var next = d3.select(trail[0][nextIndex]);
              var nextSegment = next.datum();
              nextSegment.previous = segment;
              segment.next = nextSegment;
              var nextTime = nextSegment.t;
              if (_context.time - nextSegment.t < 0) { // time is not equal start of year
                segment.visibilityChanged = true; // redraw needed next time because line not have full length
                nextTime = _context.time;
              }
              _context.model.marker.getFrame(nextTime, function(nextFrame) {
                if (d.status != "reveal") return resolve();
                if(!nextFrame || segment.valueY==null || segment.valueX==null || segment.valueS==null) {
                  return resolve();
                } else {
                  if(nextFrame.axis_x[d[KEY]]==null || nextFrame.axis_y[d[KEY]]==null) {
                    return resolve();
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
                      addNewIntervals(index, nextIndex);
                      return resolve();
                    } else {
                      return resolve();
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

        if ((!previousSegment.previous && !previousSegment.next) || (!nextSegment.previous && !nextSegment.next)) {
          // segment data cleared by create action  
          return resolve();
        }

        _context.model.marker.getFrame(segment.t, function(frame) {
          if (d.status != "reveal") return resolve();
          if (!frame ||
            (typeof frame.axis_x == "undefined") ||  frame.axis_x[d[KEY]]==null ||
            (typeof frame.axis_y == "undefined") ||  frame.axis_y[d[KEY]]==null)
          {
            utils.warn("Frame for trail missed: " + segment.t);
            return resolve();
          }
          segment.valueY = frame.axis_y[d[KEY]];
          segment.valueX = frame.axis_x[d[KEY]];
          segment.valueS = frame.size[d[KEY]];
          segment.valueC = frame.color[d[KEY]];

          segment.previous = previousSegment;
          segment.next = nextSegment;
          previousSegment.next = segment;
          nextSegment.previous = segment;

          if(segment.valueY==null || segment.valueX==null || segment.valueS==null) {
            utils.warn("Data for trail point missed: " + segment.t);
            return resolve();
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
          addNewIntervals(previousIndex, index, nextIndex);
          resolve();
        });       
      });
    };
    var addNewIntervals = function(previousIndex, index, nextIndex) {
      var mediumIndex;
      if (index - previousIndex > 1) {
        mediumIndex = getPointBetween(previousIndex, index);
        _this.delayedIterations[d[KEY]][previousIndex] = {
          first: previousIndex,
          next: index,
          medium: mediumIndex
        };
      }
      if (nextIndex && nextIndex - index > 1) {
        mediumIndex = getPointBetween(index, nextIndex);
        _this.delayedIterations[d[KEY]][index] = {
          first: index,
          next: nextIndex,
          medium: mediumIndex
        };
      }
    };
    var getPointBetween = function(previous, next) {
      return Math.round(previous + (next - previous) / 2);
    };

    var _generateKeys = function(d, trail, div) {
      var response = [];
      var min = 0, max = 0;
      var maxValue = d3.min([d.limits.max, _context.time]);
      var minValue = d3.max([d.limits.min, _context.model.time.timeFormat.parse("" + d.selectedEntityData.trailStartTime)]);
      utils.forEach(trail[0], function(segment, index) {
        var data = segment.__data__;
        if (data.t -  minValue == 0) {
          min = index;
        } else if (data.t -  maxValue == 0) {
          max = index;
        } else {
          if (data.t >  minValue && data.t <  maxValue) {
            if (_context.model.time.timeFormat(data.t) % div == 0 || (data.next && data.previous)) {
              response.push(index);
            }
          }
        }
      });
      response.unshift(min);
      if (max > 0) {
        response.push(max);
      }
      return response;
    };

    var processPoints = function() {
      return new Promise(function(resolve, reject) {
        var processPoint = function() {
          var pointIndex = Object.keys(_this.drawingQueue[d[KEY]])[Math.floor(Math.random() *  Object.keys(_this.drawingQueue[d[KEY]]).length)];
          var point = JSON.parse(JSON.stringify(_this.drawingQueue[d[KEY]][pointIndex]));
          delete _this.drawingQueue[d[KEY]][pointIndex];
          addPointBetween(point.first, point.next, point.medium).then(function () {
              if (Object.keys(_this.drawingQueue[d[KEY]]).length > 0) {
                processPoint();
              } else {
                resolve();
              }
          });
        };
        if (Object.keys(_this.drawingQueue[d[KEY]]).length > 0) {
          processPoint(_this.drawingQueue[d[KEY]]);
        } else {
          resolve();
        }
      });
    };

    return new Promise(function(resolve, reject) {
      /**
       * iteration for each point from first segment to last
       * @param trail
       * @param index
       */
      var generateTrails = function(trail, index) {
        if (index < 0 || index >= trail[0].length) {
          return resolve();
        }
        generateTrailSegment(trail, index, index + 1).then(function() {
          generateTrails(trail, index + 1);
        }, function() {
          return resolve();
        });
      };

      /**
       * recursive iteration for drawing point between points calculated in previous step
       */
      var processPointsBetween = function() {
        processPoints().then(function() {
          if (Object.keys(_this.delayedIterations[d[KEY]]).length == 0) {
            return resolve();
          } else {
            _this.drawingQueue[d[KEY]] = _this.delayedIterations[d[KEY]];
            _this.delayedIterations[d[KEY]] = {};
            processPointsBetween();
          }
        }, function() {
          return resolve();
        });
      };

      if (_context.model.marker.framesAreReady()) {
        generateTrails(trail, 0);
      } else {
        _this.delayedIterations[d[KEY]] = {};
        _this.drawingQueue[d[KEY]] = {};
        var trailKeys = _generateKeys(d, trail, 50);
        var segments = [];
        if (trailKeys.length <= 1) {
          return resolve();
        }

        _this.delayedIterations[d[KEY]] = {};
        for (var i = 0; i < trailKeys.length - 1; i++) {
          segments.push(generateTrailSegment(trail, trailKeys[i], trailKeys[i + 1], 1));
        }
        Promise.all(segments).then(function() {
          if (Object.keys(_this.delayedIterations[d[KEY]]).length == 0) {
            resolve();
          } else {
            _this.drawingQueue[d[KEY]] = _this.delayedIterations[d[KEY]];
            _this.delayedIterations[d[KEY]] = {};
            processPointsBetween();
          }
        }, function() {
          resolve();
        });
      }
    });
  }
});
