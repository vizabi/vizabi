import * as utils from 'base/utils';
import Class from 'base/class';

export default Class.extend({

  init: function(context) {
    this.context = context;
    this._isCreated = null;

  },

  toggle: function(arg) {
    var _this = this.context;

    if(arg) {
      _this._trails.create();
      _this._trails.run(["resize", "recolor", "opacityHandler", "findVisible", "reveal"]);
    } else {
      _this._trails.run("remove");
      _this.model.entities.select.forEach(function(d) {
        d.trailStartTime = null;
      });
    }
  },

  create: function(selection) {
    var _this = this;
    var context = this.context;
    this._isCreated = new Promise(function(resolve, reject) {
      var KEY = context.KEY;

      //quit if the function is called accidentally
      if(!context.model.time.trails || !context.model.entities.select.length) return;

      var start = +context.model.time.timeFormat(context.model.time.start);
      var end = +context.model.time.timeFormat(context.model.time.end);
      var step = context.model.time.step;
      var timePoints = [];
      for(var time = start; time <= end; time += step) timePoints.push(time);

      //work with entities.select (all selected entities), if no particular selection is specified
      selection = selection == null ? context.model.entities.select : [selection];
      selection.forEach(function(d) {

        var trailSegmentData = timePoints.map(function(m) {
          return {
            t: context.model.time.timeFormat.parse("" + m)
          }
        });

        var trail = context.entityTrails
          .filter(function(f) {
            return f[KEY] == "trail-" + d[KEY]
          })
          .selectAll("g")
          .data(trailSegmentData);

        trail.exit().remove();

        trail.enter().append("g")
          .attr("class", "vzb-bc-trailsegment")
          .on("mouseover", function(segment, index) {
            if(utils.isTouchDevice()) return;
            var _key = d3.select(this.parentNode).data()[0][KEY];

            var pointer = {};
            pointer[KEY] = _key.replace("trail-", "");
            pointer.time = segment.t;

            context._axisProjections(pointer);
            var text = context.model.time.timeFormat(segment.t);
            var labelData = context.entityLabels
              .filter(function(f) {
                return f[KEY] == pointer[KEY]
              })
              .classed("vzb-highlighted", true)
              .datum();
            if(text !== labelData.trailStartTime) {
              context.model.marker.getFrame(pointer.time, function(values) {
                var x = context.xScale(values.axis_x[pointer[KEY]]);
                var y = context.yScale(values.axis_y[pointer[KEY]]);
                var s = utils.areaToRadius(context.sScale(values.size[pointer[KEY]]));
                context._setTooltip(text, x, y, s);
              });
            }
            //change opacity to OPACITY_HIGHLT = 1.0;
            d3.select(this).style("opacity", 1.0);
          })
          .on("mouseout", function(segment, index) {
            if(utils.isTouchDevice()) return;
            context._axisProjections();
            context._setTooltip();
            context.entityLabels.classed("vzb-highlighted", false);
            d3.select(this).style("opacity", context.model.entities.opacityRegular);
          })
          .each(function(segment, index) {
            var view = d3.select(this);
            view.append("circle");
            view.append("line");
          });


        //update segment data (maybe for new indicators)
        var promises = [];
        context.model.marker.getFrame(null, function(frames) { //call without time parameter to use cache instead force frame calculation
          trail.each(function(segment, index) {
            promises.push(new Promise(function(res, rej) {
              context.model.marker.getFrame(segment.t, function(frame) {
                segment.valueY = frame.axis_y[d[KEY]];
                segment.valueX = frame.axis_x[d[KEY]];
                segment.valueS = frame.size[d[KEY]];
                segment.valueC = frame.color[d[KEY]];
                res();
              });
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
      });
    });
    return this._isCreated;
  },


  run: function(actions, selection, duration) {
    var _this = this;
    var context = this.context;
    var KEY = context.KEY;

    this._isCreated.then(function() {

      //quit if function is called accidentally
      if((!context.model.time.trails || !context.model.entities.select.length) && actions != "remove") return;

      if(!duration) duration = 0;

      actions = [].concat(actions);

      //work with entities.select (all selected entities), if no particular selection is specified
      selection = selection == null ? context.model.entities.select : [selection];
      selection.forEach(function(d) {

        var trail = context.entityTrails
          .filter(function(f) {
            return f[KEY] == "trail-" + d[KEY]
          })
          .selectAll("g")

        //do all the actions over "trail"
        actions.forEach(function(action) {
          context._trails["_" + action](trail, duration, d);
        })
      });
    });
  },


  _remove: function(trail, duration, d) {
    trail.remove();
  },

  _resize: function(trail, duration, d) {
    var _this = this;
    if (this.context.model.time.splash) {
      return;
    }
//    this._isCreated.then(function() {

      trail.each(function (segment, index) {
        _this._redrawPoint(this, segment, index);
      });

//    });
  },

  _redrawPoint:function(node, segment, index) {
    var context = this.context;
    var view = d3.select(node);
    view.select("circle")
      //.transition().duration(duration).ease("linear")
      .attr("cy", context.yScale(segment.valueY))
      .attr("cx", context.xScale(segment.valueX))
      .attr("r", utils.areaToRadius(context.sScale(segment.valueS)));

    var next = node.parentNode.childNodes[(index + 1)];
    if (next == null) return;
    next = next.__data__;

    var lineLength = Math.sqrt(
      Math.pow(context.xScale(segment.valueX) - context.xScale(next.valueX), 2) +
      Math.pow(context.yScale(segment.valueY) - context.yScale(next.valueY), 2)
    );

    view.select("line")
      //.transition().duration(duration).ease("linear")
      .attr("x1", context.xScale(next.valueX))
      .attr("y1", context.yScale(next.valueY))
      .attr("x2", context.xScale(segment.valueX))
      .attr("y2", context.yScale(segment.valueY))
      .style("stroke-dasharray", lineLength)
      .style("stroke-dashoffset", utils.areaToRadius(context.sScale(segment.valueS)));
  },

  _recolor: function(trail, duration, d) {
    var _this = this.context;
    trail.each(function(segment, index) {

      var view = d3.select(this);

      var strokeColor = _this.model.marker.color.which == "geo.region"?
        //use predefined shades for color palette for "geo.region" (hardcoded)
        _this.model.marker.color.getColorShade({
          colorID: segment.valueC,
          shadeID: "shade"
        })
        :
        //otherwise use color of the bubble with a fallback to bubble stroke color (blackish)
        (segment.valueC!=null?_this.cScale(segment.valueC):_this.COLOR_BLACKISH);

      view.select("circle")
        //.transition().duration(duration).ease("linear")
        .style("fill", segment.valueC!=null?_this.cScale(segment.valueC):_this.COLOR_WHITEISH);
      view.select("line")
        //.transition().duration(duration).ease("linear")
        .style("stroke", strokeColor);
    });
  },

  _opacityHandler: function(trail, duration, d) {
    var _this = this.context;

    trail.each(function(segment, index) {

      var view = d3.select(this);

      view
        //.transition().duration(duration).ease("linear")
        .style("opacity", d.opacity || _this.model.entities.opacityRegular);
    });
  },


  _findVisible: function(trail, duration, d) {
    var _this = this.context;
    var KEY = _this.KEY;
    var firstVisible = true;
    var trailStartTime = _this.model.time.timeFormat.parse("" + d.trailStartTime);

    trail.each(function(segment, index) {

      // segment is transparent if it is after current time or before trail StartTime
      segment.transparent = (segment.t - _this.time >= 0) || (trailStartTime - segment.t > 0)
          //no trail segment should be visible if leading bubble is shifted backwards
        || (d.trailStartTime - _this.model.time.timeFormat(_this.time) >= 0);

      if(firstVisible && !segment.transparent) {
        if(_this.cached[d[KEY]] == null) _this.cached[d[KEY]] = {};
        _this.cached[d[KEY]].maxMinValues = {
          valueXmax: null,
          valueXmin: null,
          valueYmax: null,
          valueYmin: null,
          valueSmax: null
        };

        _this.cached[d[KEY]].labelX0 = segment.valueX;
        _this.cached[d[KEY]].labelY0 = segment.valueY;
        _this.cached[d[KEY]].scaledS0 = utils.areaToRadius(_this.sScale(segment.valueS));

        var maxmin = _this.cached[d[KEY]].maxMinValues;

        if(segment.valueX > maxmin.valueXmax || maxmin.valueXmax == null) maxmin.valueXmax = segment.valueX;
        if(segment.valueX < maxmin.valueXmin || maxmin.valueXmin == null) maxmin.valueXmin = segment.valueX;
        if(segment.valueY > maxmin.valueYmax || maxmin.valueYmax == null) maxmin.valueYmax = segment.valueY;
        if(segment.valueY < maxmin.valueYmin || maxmin.valueYmin == null) maxmin.valueYmin = segment.valueY;
        if(segment.valueS > maxmin.valueSmax || maxmin.valueSmax == null) maxmin.valueSmax = segment.valueS;

        firstVisible = false;
      }
    });
  },


  _reveal: function(trail, duration, d) {
    var _this = this.context;
    var KEY = _this.KEY;

    trail.each(function(segment, index) {

      var view = d3.select(this);

      view.classed("vzb-invisible", segment.transparent);

      if(segment.transparent) return;

      var next = this.parentNode.childNodes[(index + 1)];
      if(next == null) return;
      next = next.__data__;

      if(segment.t - _this.time <= 0 && _this.time - next.t <= 0) {
        next = _this.cached[d[KEY]];

        view.select("line")
          .attr("x2", _this.xScale(segment.valueX))
          .attr("y2", _this.yScale(segment.valueY))
          .attr("x1", _this.xScale(segment.valueX))
          .attr("y1", _this.yScale(segment.valueY))
          //.transition().duration(duration).ease("linear")
          .attr("x1", _this.xScale(next.valueX))
          .attr("y1", _this.yScale(next.valueY));
      } else {
        view.select("line")
          .attr("x2", _this.xScale(segment.valueX))
          .attr("y2", _this.yScale(segment.valueY))
          .attr("x1", _this.xScale(next.valueX))
          .attr("y1", _this.yScale(next.valueY));
      }
    });

  }


});
