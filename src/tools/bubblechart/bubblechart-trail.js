import * as utils from 'base/utils';
import Class from 'base/class';
import Promise from 'promise';

export default Class.extend({

  init: function(context) {
    this.context = context;
    this._isCreated = null;
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

        //update segment data (maybe for new indicators)

        defer.resolve();
        
/*
        _this.model.marker.getFrame(null, function(frames) { //call without time parameter to use cache instead force frame calculation
          trail.each(function(segment, index) {
            var frame = frames[segment.t];
            segment.valueY = frame.axis_y[d[KEY]];
            segment.valueX = frame.axis_x[d[KEY]];
            segment.valueS = frame.size[d[KEY]];
            segment.valueC = frame.color[d[KEY]];
          });
        });
*/
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


  run: function(actions, selection, duration) {
    var _context = this.context;
    var _this = this;
    var KEY = _context.KEY;
    if (!this._isCreated) return;
    this._isCreated.then(function() {

      //quit if function is called accidentally
      if((!_context.model.ui.chart.trails || !_context.model.entities.select.length) && actions != "remove") return;

      if(!duration) duration = 0;

      actions = [].concat(actions);
      //work with entities.select (all selected entities), if no particular selection is specified
      selection = selection == null ? _context.model.entities.select : [selection];
      selection.forEach(function(d) {

        var trail = _this.entityTrails[d[KEY]];
        //do all the actions over "trail"
        var executeSequential = function(index) { // some function can be async, but we should run next when previous completed
          if (index < actions.length) {
            var response = _context._trails["_" + actions[index]](trail, duration, d);
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
/*
        actions.forEach(function(action) {
          _context._trails["_" + action](trail, duration, d);
        })
*/
      });
    });
  },


  _remove: function(trail, duration, d) {
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

    trail.each(function(segment, index) {
      // segment is transparent if it is after current time or before trail StartTime
      segment.transparent = d.trailStartTime == null || (segment.t - _context.time >= 0) || (trailStartTime - segment.t > 0)
        //no trail segment should be visible if leading bubble is shifted backwards, beyond start time
        || (d.trailStartTime - _context.model.time.timeFormat(_context.time) >= 0);
        //additionally, segment should not be visible if it has broken data
//        || segment.valueX == null || segment.valueY == null || segment.valueS == null;

/*
      if(firstVisible && !segment.transparent) {
        _this.cached[d[KEY]].labelX0 = segment.valueX;
        _this.cached[d[KEY]].labelY0 = segment.valueY;
        _this.cached[d[KEY]].scaledS0 = utils.areaToRadius(_this.sScale(segment.valueS));
        firstVisible = false;
      }
*/
    });
  },


  _reveal: function(trail, duration, d) {
    var _context = this.context;
    var KEY = _context.KEY;
    var trailStartTime = _context.model.time.timeFormat.parse("" + d.trailStartTime);
    trail.each(function(segment, index) {
      var view = d3.select(this);
      if(segment.transparent) {
        view.classed("vzb-invisible", segment.transparent);
        return;
      }
      (function(_view, _segment, _index) {
        _context.model.marker.getFrame(_segment.t, function(frame) {

          _segment.valueY = frame.axis_y[d[KEY]];
          _segment.valueX = frame.axis_x[d[KEY]];
          _segment.valueS = frame.size[d[KEY]];
          _segment.valueC = frame.color[d[KEY]];
          if(_segment.valueY==null || _segment.valueX==null || _segment.valueS==null) return;

          if (trailStartTime && trailStartTime.toString() == _segment.t.toString()) {
            _context.cached[d[KEY]].labelX0 = _segment.valueX;
            _context.cached[d[KEY]].labelY0 = _segment.valueY;
            _context.cached[d[KEY]].scaledS0 = utils.areaToRadius(_context.sScale(_segment.valueS));

            _context._updateLabel(d, _index, _segment.valueX, _segment.valueY, _segment.valueS, frame.label[d[KEY]], frame.size_label[d[KEY]], 0, true);
          }
          _view.select("circle")
            //.transition().duration(duration).ease("linear")
            .attr("cy", _context.yScale(_segment.valueY))
            .attr("cx", _context.xScale(_segment.valueX))
            .attr("r", utils.areaToRadius(_context.sScale(_segment.valueS)))
            .style("fill", _segment.valueC!=null?_context.cScale(_segment.valueC):_context.COLOR_WHITEISH);

          _view.select("line")
            .attr("x2", _context.xScale(_segment.valueX))
            .attr("y2", _context.yScale(_segment.valueY))
            .attr("x1", _context.xScale(_segment.valueX))
            .attr("y1", _context.yScale(_segment.valueY));

          _view.classed("vzb-invisible", _segment.transparent);
          
          var next = trail[0][_index + 1];
          if(next == null) return;
          next = next.__data__;
          _context.model.marker.getFrame(next.t, function(nextFrame) {
            if(nextFrame.axis_x[d[KEY]]==null || nextFrame.axis_y[d[KEY]]==null) return;

            var strokeColor = _context.model.marker.color.which == "geo.world_4region"?
              //use predefined shades for color palette for "geo.world_4region" (hardcoded)
              _context.model.marker.color.getColorShade({
                colorID: _segment.valueC,
                shadeID: "shade"
              })
              :
              //otherwise use color of the bubble with a fallback to bubble stroke color (blackish)
              (_segment.valueC!=null?_context.cScale(_segment.valueC):_context.COLOR_BLACKISH);

            var lineLength = Math.sqrt(
              Math.pow(_context.xScale(segment.valueX) - _context.xScale(next.valueX),2) +
              Math.pow(_context.yScale(segment.valueY) - _context.yScale(next.valueY),2)
            );

            _view.select("line")
              .transition().duration(duration).ease("linear")
              .attr("x2", _context.xScale(_segment.valueX))
              .attr("y2", _context.yScale(_segment.valueY))
              .attr("x1", _context.xScale(nextFrame.axis_x[d[KEY]]))
              .attr("y1", _context.yScale(nextFrame.axis_y[d[KEY]]))
              .style("stroke-dasharray", lineLength)
              .style("stroke-dashoffset", utils.areaToRadius(_context.sScale(_segment.valueS)))
              .style("stroke", strokeColor);

          });
        });
      }(view, segment, index));
    });
  }


});
