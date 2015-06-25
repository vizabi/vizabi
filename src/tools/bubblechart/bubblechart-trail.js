(function () {

  var Vizabi = this.Vizabi;
  var utils = Vizabi.utils;

  Vizabi.Helper.extend("gapminder-bublechart-trails", {

    init: function (context) {
      this.context = context;
    },

    toggle: function (arg) {
      var _this = this.context;

      if (arg) {
        _this._trails.create();
        _this._trails.run(["resize", "recolor", "findVisible", "reveal"]);
      } else {
        _this._trails.run("remove");
        _this.model.entities.select.forEach(function (d) {
          d.trailStartTime = null;
        });
      }
    },

    create: function (selection) {
      var _this = this.context;
      var KEY = _this.KEY;

      //quit if the function is called accidentally
      if (!_this.model.time.trails || !_this.model.entities.select.length) return;

      var start = +_this.timeFormatter(_this.model.time.start);
      var end = +_this.timeFormatter(_this.model.time.end);
      var step = _this.model.time.step;
      var timePoints = [];
      for (var time = start; time <= end; time += step) timePoints.push(time);

      //work with entities.select (all selected entities), if no particular selection is specified
      selection = selection == null ? _this.model.entities.select : [selection];
      selection.forEach(function (d) {

        var trailSegmentData = timePoints.map(function (m) {
          return {t: _this.timeFormatter.parse("" + m)}
        });

        if (_this.cached[d[KEY]] == null) _this.cached[d[KEY]] = {};

        _this.cached[d[KEY]].maxMinValues = {
          valueXmax: null,
          valueXmin: null,
          valueYmax: null,
          valueYmin: null,
          valueSmax: null
        };

        var maxmin = _this.cached[d[KEY]].maxMinValues;

        var trail = _this.entityTrails
          .filter(function (f) {
            return f[KEY] == d[KEY]
          })
          .selectAll("g")
          .data(trailSegmentData);

        trail.exit().remove();

        trail.enter().append("g")
          .attr("class", "trailSegment")
          .on("mousemove", function (segment, index) {
            var _key = d3.select(this.parentNode).data()[0][KEY];

            var pointer = {};
            pointer[KEY] = _key;
            pointer.time = segment.t;

            _this._axisProjections(pointer);
            _this._setTooltip(_this.timeFormatter(segment.t));
            _this.entityLabels
              .filter(function (f) {
                return f[KEY] == _key
              })
              .classed("vzb-highlighted", true);
          })
          .on("mouseout", function (segment, index) {
            _this._axisProjections();
            _this._setTooltip();
            _this.entityLabels.classed("vzb-highlighted", false);
          })
          .each(function (segment, index) {
            var view = d3.select(this);
            view.append("circle");
            view.append("line");
          });


        trail.each(function (segment, index) {
          //update segment data (maybe for new indicators)
          var pointer = {};
          pointer[KEY] = d[KEY];
          pointer.time = segment.t;

          segment.valueY = _this.model.marker.axis_y.getValue(pointer);
          segment.valueX = _this.model.marker.axis_x.getValue(pointer);
          segment.valueS = _this.model.marker.size.getValue(pointer);
          segment.valueC = _this.model.marker.color.getValue(pointer);

          //update min max frame: needed to zoom in on the trail
          if (segment.valueX > maxmin.valueXmax || maxmin.valueXmax == null) maxmin.valueXmax = segment.valueX;
          if (segment.valueX < maxmin.valueXmin || maxmin.valueXmin == null) maxmin.valueXmin = segment.valueX;
          if (segment.valueY > maxmin.valueYmax || maxmin.valueYmax == null) maxmin.valueYmax = segment.valueY;
          if (segment.valueY < maxmin.valueYmin || maxmin.valueYmin == null) maxmin.valueYmin = segment.valueY;
          if (segment.valueS > maxmin.valueSmax || maxmin.valueSmax == null) maxmin.valueSmax = segment.valueS;
        });

      });
    },


    run: function (actions, selection, duration) {
      var _this = this.context;
      var KEY = _this.KEY;


      //quit if function is called accidentally
      if ((!_this.model.time.trails || !_this.model.entities.select.length) && actions != "remove") return;
      if (!duration)duration = 0;

      actions = [].concat(actions);

      //work with entities.select (all selected entities), if no particular selection is specified
      selection = selection == null ? _this.model.entities.select : [selection];
      selection.forEach(function (d) {

        var trail = _this.entityTrails
          .filter(function (f) {
            return f[KEY] == d[KEY]
          })
          .selectAll("g")

        //do all the actions over "trail"
        actions.forEach(function (action) {
          _this._trails["_" + action](trail, duration, d);
        })

      });
    },


    _remove: function (trail, duration, d) {
      trail.remove();
    },

    _resize: function (trail, duration, d) {
      var _this = this.context;

      trail.each(function (segment, index) {

        var view = d3.select(this);
        view.select("circle")
          //.transition().duration(duration).ease("linear")
          .attr("cy", _this.yScale(segment.valueY))
          .attr("cx", _this.xScale(segment.valueX))
          .attr("r", utils.areaToRadius(_this.sScale(segment.valueS)));

        var next = this.parentNode.childNodes[(index + 1)];
        if (next == null) return;
        next = next.__data__;

        view.select("line")
          //.transition().duration(duration).ease("linear")
          .attr("x1", _this.xScale(next.valueX))
          .attr("y1", _this.yScale(next.valueY))
          .attr("x2", _this.xScale(segment.valueX))
          .attr("y2", _this.yScale(segment.valueY));
      });
    },

    _recolor: function (trail, duration, d) {
      var _this = this.context;

      trail.each(function (segment, index) {

        var view = d3.select(this);

        view.select("circle")
          //.transition().duration(duration).ease("linear")
          .style("fill", _this.cScale(segment.valueC));
        view.select("line")
          //.transition().duration(duration).ease("linear")
          .style("stroke", _this.cScale(segment.valueC));
      });
    },


    _findVisible: function (trail, duration, d) {
      var _this = this.context;
      var KEY = _this.KEY;

      var firstVisible = true;
      var trailStartTime = _this.timeFormatter.parse("" + d.trailStartTime);

      trail.each(function (segment, index) {

        // segment is transparent if it is after current time or before trail StartTime
        segment.transparent = (segment.t - _this.time >= 0)
          || (trailStartTime - segment.t > 0)
            //no trail segment should be visible if leading bubble is shifted backwards
          || (d.trailStartTime - _this.timeFormatter(_this.time) >= 0);

        if (firstVisible && !segment.transparent) {
          _this.cached[d[KEY]].labelX0 = segment.valueX;
          _this.cached[d[KEY]].labelY0 = segment.valueY;
          _this.cached[d[KEY]].scaledS0 = utils.areaToRadius(_this.sScale(segment.valueS));
          firstVisible = false;
        }
      });
    },


    _reveal: function (trail, duration, d) {
      var _this = this.context;
      var KEY = _this.KEY;

      trail.each(function (segment, index) {

        var view = d3.select(this);

        view.classed("vzb-invisible", segment.transparent);

        if (segment.transparent) return;

        var next = this.parentNode.childNodes[(index + 1)];
        if (next == null) return;
        next = next.__data__;

        if (segment.t - _this.time <= 0 && _this.time - next.t <= 0) {
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

    },


  });


}).call(this);
