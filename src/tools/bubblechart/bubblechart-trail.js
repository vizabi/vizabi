import * as utils from 'base/utils';
import Class from 'base/class';
import Promise from 'promise';

export default Class.extend({

  init: function(context) {
    this.context = context;
    this._isCreated = null;
    this.actionsQueue = {};
    this.entityTrails = {};

  },

  toggle: function(arg) {
    var _context = this.context;

    if(arg) {
      _context._trails.create();
      _context._trails.run(["resize", "recolor", "opacityHandler", "findVisible", "reveal"]);
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
      if(!_context.model.ui.chart.trails || !_context.model.entities.select.length) return;

      var timePoints = _context.model.time.getAllSteps();

      //work with entities.select (all selected entities), if no particular selection is specified
      var promises = [];
      selection = selection == null ? _context.model.entities.select : [selection];
      selection.forEach(function(d) {
        var defer = new Promise();
        promises.push(defer);
        var trailSegmentData = timePoints.map(function(m) {
          return {
            t: m,
            key: d[KEY]
          }
        });
        if (!_this.entityTrails[d[KEY]]) {
          _this.entityTrails[d[KEY]] = _context.trailsContainer
            .insert("g")
            .attr("class", "vzb-bc-entity trail-" + d[KEY])
            .selectAll("g").data(trailSegmentData);
          
          _this.entityTrails[d[KEY]].exit().remove();
          
          _this.entityTrails[d[KEY]]
            .enter().append("g")
            .attr("class", "vzb-bc-trailsegment")
            .on("mouseover", function(segment, index) {
              if(utils.isTouchDevice()) return;

              var pointer = {};
              pointer[KEY] = segment.key;
              pointer.time = segment.t;

              _context._axisProjections(pointer);
              var text = _context.model.time.timeFormat(segment.t);
              var labelData = _context.entityLabels
                .filter(function(f) {
                  return f[KEY] == pointer[KEY]
                })
                .classed("vzb-highlighted", true)
                .datum();
              if(text !== labelData.trailStartTime) {
                _context.model.marker.getFrame(pointer.time, function(values) {
                  var x = _context.xScale(values.axis_x[pointer[KEY]]);
                  var y = _context.yScale(values.axis_y[pointer[KEY]]);
                  var s = utils.areaToRadius(_context.sScale(values.size[pointer[KEY]]));
                  _context._setTooltip(text, x, y, s);
                });
              }
              //change opacity to OPACITY_HIGHLT = 1.0;
              d3.select(this).style("opacity", 1.0);
            })
            .on("mouseout", function(segment, index) {
              if(utils.isTouchDevice()) return;
              _context._axisProjections();
              _context._setTooltip();
              _context.entityLabels.classed("vzb-highlighted", false);
              d3.select(this).style("opacity", _context.model.entities.opacityRegular);
            })
            .each(function(segment, index) {
              var view = d3.select(this);
              view.append("circle");
              view.append("line");
            });
        }

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
  _getNextAction(key) {
    return this.actionsQueue[key].shift();
  },
  
  run: function(actions, selection, duration) {
    var _context = this.context;
    var _this = this;
    var KEY = _context.KEY;
    if (!this._isCreated) return;
    this._isCreated.then(function() {
      //quit if function is called accidentally
      if((!_context.model.ui.chart.trails || !_context.model.entities.select.length) && actions != "remove") return;

      if(!duration) duration = 0;

      //work with entities.select (all selected entities), if no particular selection is specified
      selection = selection == null ? _context.model.entities.select : [selection];
      _this._addActions(selection, actions);
      selection.forEach(function(d) {

        var trail = _this.entityTrails[d[KEY]];
        //do all the actions over "trail"
        var executeSequential = function(index) { // some function can be async, but we should run next when previous completed
          var action = _this._getNextAction(d[KEY]);
          if (action) {
            var response = _context._trails["_" + action](trail, duration, d);
            if (response && response instanceof Promise) {
              response.then(function() {
                executeSequential(index + 1);
              })
            } else {
              executeSequential(index + 1);
            }
          }
        };
        executeSequential(0);
      });
    });

  },


  _remove: function(trail, duration, d) {
    this.actionsQueue[d[this.context.KEY]] = []; 
    if (trail) { // TODO: in some reason run twice 
      trail.remove();
      this.entityTrails[d[this.context.KEY]] = null;
    }
  },

  _resize: function(trail, duration, d) {
    var _context = this.context;
    if (_context.model.time.splash) {
      return;
    }
//    this._isCreated.then(function() {

    trail.each(function(segment, index) {
        
      if(segment.valueY==null || segment.valueX==null || segment.valueS==null) return;

      var view = d3.select(this);
      view.select("circle")
        //.transition().duration(duration).ease("linear")
        .attr("cy", _context.yScale(segment.valueY))
        .attr("cx", _context.xScale(segment.valueX))
        .attr("r", utils.areaToRadius(_context.sScale(segment.valueS)));

      var next = d3.select(this.nextSibling).node();
      if(next == null) return;
      next = next.__data__;
      if(next.valueY==null || next.valueX==null) return;
        
      var lineLength = Math.sqrt(
          Math.pow(_context.xScale(segment.valueX) - _context.xScale(next.valueX),2) +
          Math.pow(_context.yScale(segment.valueY) - _context.yScale(next.valueY),2)
      );
      view.select("line")
        //.transition().duration(duration).ease("linear")
        .attr("x1", _context.xScale(next.valueX))
        .attr("y1", _context.yScale(next.valueY))
        .attr("x2", _context.xScale(segment.valueX))
        .attr("y2", _context.yScale(segment.valueY))
        .style("stroke-dasharray", lineLength)
        .style("stroke-dashoffset", utils.areaToRadius(_context.sScale(segment.valueS)));
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

    var firstVisible = true;
    var trailStartTime = _context.model.time.timeFormat.parse("" + d.trailStartTime);

    if (_context.time - trailStartTime < 0) { // move trail start time with trail label back if need
      d.trailStartTime = _context.model.time.timeFormat(_context.time);
      trailStartTime = _context.model.time.timeFormat.parse("" + d.trailStartTime);
      _context.cached[d[KEY]].labelX0 = _context.frame.axis_x[d[KEY]];
      _context.cached[d[KEY]].labelY0 = _context.frame.axis_y[d[KEY]];
      _context.cached[d[KEY]].scaledS0 = utils.areaToRadius(_context.sScale(_context.frame.size[d[KEY]]));

      _context._updateLabel(d, 0, _context.frame.axis_x[d[KEY]], _context.frame.axis_y[d[KEY]], _context.frame.size[d[KEY]], _context.frame.label[d[KEY]], _context.frame.size_label[d[KEY]], 0, true);
    }
    trail.each(function(segment, index) {
      // segment is transparent if it is after current time or before trail StartTime
      segment.transparent = d.trailStartTime == null || (segment.t - _context.time >= 0) || (trailStartTime - segment.t > 0)
        //no trail segment should be visible if leading bubble is shifted backwards, beyond start time
        || (d.trailStartTime - _context.model.time.timeFormat(_context.time) >= 0);


    });
  },


  _reveal: function(trail, duration, d) {
    var _context = this.context;
    var KEY = _context.KEY;
    var trailStartTime = _context.model.time.timeFormat.parse("" + d.trailStartTime);
    var generateTrailSegment = function(trail, index) {
      return new Promise(function(resolve, reject) {
        var view = d3.select(trail[0][index]);
        var segment = view.datum();
        if(segment.transparent) {
          view.classed("vzb-invisible", segment.transparent);
          resolve();
        } else {
          _context.model.marker.getFrame(segment.t, function(frame) {
            if (!frame) return resolve();
            segment.valueY = frame.axis_y[d[KEY]];
            segment.valueX = frame.axis_x[d[KEY]];
            segment.valueS = frame.size[d[KEY]];
            segment.valueC = frame.color[d[KEY]];

            if(segment.valueY==null || segment.valueX==null || segment.valueS==null) {
              if (_context.time - trailStartTime > 0) { // move trail start time forward because previous values are empty
                d.trailStartTime = _context.model.time.timeFormat(_context.model.time.incrementTime(trailStartTime));
                trailStartTime = _context.model.time.timeFormat.parse("" + d.trailStartTime);
              }
              resolve();
            } else {
              // fix label position if it not in correct place
              if (trailStartTime && trailStartTime.toString() == segment.t.toString() && _context.cached[d[KEY]].labelX0 != segment.valueX) {
                _context.cached[d[KEY]].labelX0 = segment.valueX;
                _context.cached[d[KEY]].labelY0 = segment.valueY;
                _context.cached[d[KEY]].scaledS0 = utils.areaToRadius(_context.sScale(segment.valueS));
                _context._updateLabel(d, index, segment.valueX, segment.valueY, segment.valueS, frame.label[d[KEY]], frame.size_label[d[KEY]], 0, true);
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

              view.classed("vzb-invisible", segment.transparent);

              var next = trail[0][index + 1];
              if(next == null) {
                resolve();
              } else {
                next = next.__data__;
                _context.model.marker.getFrame(next.t, function(nextFrame) {

                  // TODO: find why data in segment sometimes become null
                  segment.valueY = frame.axis_y[d[KEY]];
                  segment.valueX = frame.axis_x[d[KEY]];
                  segment.valueS = frame.size[d[KEY]];
                  segment.valueC = frame.color[d[KEY]];

                  if(!nextFrame || segment.valueY==null || segment.valueX==null || segment.valueS==null) {
                    resolve();
                  } else {
                    if(nextFrame.axis_x[d[KEY]]==null || nextFrame.axis_y[d[KEY]]==null) {
                      resolve();
                    } else {
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
                        .attr("x1", _context.xScale(nextFrame.axis_x[d[KEY]]))
                        .attr("y1", _context.yScale(nextFrame.axis_y[d[KEY]]))
                        .attr("x2", _context.xScale(segment.valueX))
                        .attr("y2", _context.yScale(segment.valueY))
                        .style("stroke-dasharray", lineLength)
                        .style("stroke-dashoffset", utils.areaToRadius(_context.sScale(segment.valueS)))
                        .style("stroke", strokeColor);
                      resolve();
                    }
                  }
                });
              }

            }
          });          
        }
      });
    };
    var defer = new Promise();
    /**
     * update for generate next trail segment when previous segment finished
     * @param trail
     * @param index
     */
    var generateTrails = function(trail, index) {
      if (index < 0 || index >= trail[0].length) {
        return defer.resolve();
      }
      generateTrailSegment(trail, index).then(function() {
        generateTrails(trail, index + 1);
      });
    };
    generateTrails(trail, 0);
    return defer;
  }


});
