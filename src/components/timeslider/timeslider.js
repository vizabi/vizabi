import * as utils from 'base/utils';
import Component from 'base/component';


var precision = 1;

//constants
var class_playing = "vzb-playing";
var class_loading = "vzb-ts-loading";
var class_hide_play = "vzb-ts-hide-play-button";
var class_dragging = "vzb-ts-dragging";
var class_axis_aligned = "vzb-ts-axis-aligned";
var class_show_value = "vzb-ts-show-value";
var class_show_value_when_drag_play = "vzb-ts-show-value-when-drag-play";

//margins for slider
var profiles = {
  small: {
    margin: {
      top: 7,
      right: 15,
      bottom: 10,
      left: 15
    },
    radius: 8,
    label_spacing: 10
  },
  medium: {
    margin: {
      top: 16,
      right: 15,
      bottom: 10,
      left: 15
    },
    radius: 9,
    label_spacing: 12
  },
  large: {
    margin: {
      top: 14,
      right: 15,
      bottom: 10,
      left: 15
    },
    radius: 11,
    label_spacing: 14
  }
};


var presentationProfileChanges = {
  "medium": {
    margin: {
      top: 9
    }
  },
  "large": {
    margin: {
    }
  }
}

var TimeSlider = Component.extend({
  /**
   * Initializes the timeslider.
   * Executed once before any template is rendered.
   * @param model The model passed to the component
   * @param context The component's parent
   */
  init: function(model, context) {

    this.name = "gapminder-timeslider";
    this.template = this.template || require('./timeslider.html');
    this.prevPosition = null;
    //define expected models/hooks for this component
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
      name: "ui",
      type: "ui"
    }];

    var _this = this;
    //binds methods to this model
    this.model_binds = {
      'change:time': function(evt, path) {
        if(!_this._splash && _this.slide) {

          if((['time.start', 'time.end']).indexOf(path) !== -1) {
            if (!_this.xScale) return;
            _this.changeLimits();
          }
          _this._optionClasses();
          //only set handle position if change is external
          if(!_this.model.time.dragging) _this._setHandle(_this.model.time.playing);
        }
      },
      'change:time.start': function(evt, path) {
        if(!_this._splash && _this.slide) {
          //only set handle position if change is external
          if(!_this.model.time.dragging) _this._setHandle(_this.model.time.playing);
        }
      },
      'change:time.end': function(evt, path) {
        if(!_this._splash && _this.slide) {
          //only set handle position if change is external
          if(!_this.model.time.dragging) _this._setHandle(_this.model.time.playing);
        }
      },
      'change:time.startSelected': function(evt, path) {
        if(!_this._splash && _this.slide) {
          _this.updateSelectedStartLimiter();
        }
      },
      'change:time.endSelected': function(evt, path) {
        if(!_this._splash && _this.slide) {
          _this.updateSelectedEndLimiter();
        }
      },
      'change:marker.select': function(evt, path) {
        _this.setSelectedLimits();
      }
    };



    // Same constructor as the superclass
    this._super(model, context);

    //starts as splash if this is the option
    this._splash = this.model.ui.splash;

    // Sort of defaults. Actually should be in ui default or bubblechart. 
    // By not having "this.model.ui =" we prevent it from going to url (not defined in defaults)
    // Should be in defaults when we make components config part of external config (& every component gets own config)
    this.ui = utils.extend({
      show_limits: false,
      show_value: false,
      show_value_when_drag_play: true,
      show_button: true,
      class_axis_aligned: false
    }, model.ui, this.ui);


    //defaults
    this.width = 0;
    this.height = 0;
    this.availableTimeFrames = [];
    this.completedTimeFrames = [];
    this.getValueWidth = utils.memoize(this.getValueWidth);
    this._setTime = utils.throttle(this._setTime, 50);
  },

  startEverything() {
    //TODO: readyOnce CANNOT be run twice
    if(this._splash !== this.model.time.splash) {
      this._splash = this.model.time.splash;
      this.readyOnce();
      this.ready();
    }
  },

  //template is ready
  readyOnce: function () {

    if(this._splash) return;

    var _this = this;

    //DOM to d3
    //TODO: remove this ugly hack
    this.element = utils.isArray(this.element) ? this.element : d3.select(this.element);
    this.element.classed(class_loading, false);

    //html elements
    this.slider_outer = this.element.select(".vzb-ts-slider");
    this.slider = this.slider_outer.select("g");
    this.axis = this.element.select(".vzb-ts-slider-axis");
    this.select = this.element.select(".vzb-ts-slider-select");
    this.progressBar = this.element.select(".vzb-ts-slider-progress");
    this.slide = this.element.select(".vzb-ts-slider-slide");
    this.handle = this.slide.select(".vzb-ts-slider-handle");
    this.valueText = this.slide.select('.vzb-ts-slider-value');
    //Scale
    this.xScale = d3.time.scale.utc()
      .clamp(true);

    //Axis
    this.xAxis = d3.svg.axis()
      .orient("bottom")
      .tickSize(0);
    //Value
    this.valueText.attr("text-anchor", "middle").attr("dy", "-0.7em");

    var brushed = _this._getBrushed(),
      brushedEnd = _this._getBrushedEnd();

    //Brush for dragging
    this.brush = d3.svg.brush()
      .x(this.xScale)
      .extent([0, 0])
      .on("brush", function () {
        brushed.call(this);
      })
      .on("brushend", function () {
        brushedEnd.call(this);
      });

    //Slide
    this.slide.call(this.brush);

    this.slider_outer.on("mousewheel", function () {
        //do nothing and dont pass the event on if we are currently dragging the slider
        if(_this.model.time.dragging){
            d3.event.stopPropagation();
            d3.event.preventDefault();
            d3.event.returnValue = false;
            return false;
        }
    });

    this.slide.selectAll(".extent,.resize")
      .remove();

    this._setSelectedLimitsId = 0; //counter for setSelectedLimits

    utils.forEach(_this.model.marker.getSubhooks(), function(hook) {
      if(hook._important) hook.on('change:which', function() {
        _this._needRecalcSelectedLimits = true;
        _this.model.time.set({
          startSelected: new Date(_this.model.time.start),
          endSelected: new Date(_this.model.time.end)
        }, null, false  /*make change non-persistent for URL and history*/);
      });
    });

    if(this.model.time.startSelected > this.model.time.start) {
      _this.updateSelectedStartLimiter();
    }

    if(this.model.time.endSelected < this.model.time.end) {
      _this.updateSelectedEndLimiter();
    }

    this.parent.on('myEvent', function (evt, arg) {
      var layoutProfile = _this.getLayoutProfile();

      if (arg.profile && arg.profile.margin) {
        profiles[layoutProfile].margin = arg.profile.margin;
      }

      // set the right margin that depends on longest label width
      _this.element.select(".vzb-ts-slider-wrapper")
        .style("right", (arg.mRight - profiles[layoutProfile].margin.right) + "px");

      _this.xScale.range([0, arg.rangeMax]);
      _this.resize();
    });
  },

  //template and model are ready
  ready: function () {
    if(this._splash) return;

    var play = this.element.select(".vzb-ts-btn-play");
    var pause = this.element.select(".vzb-ts-btn-pause");
    var _this = this;
    var time = this.model.time;

    play.on('click', function () {

      _this.model.time.play();
    });

    pause.on('click', function () {
      _this.model.time.pause("soft");
    });

    this.changeLimits();
    this.changeTime();
    this.resize();

    _this._updateProgressBar();
    _this.model.marker.listenFramesQueue(null, function(time) {
      _this._updateProgressBar(time);
    });
    _this.setSelectedLimits(true);
  },

  changeLimits: function() {
    var minValue = this.model.time.start;
    var maxValue = this.model.time.end;
    //scale
    this.xScale.domain([minValue, maxValue]);
    //axis
    this.xAxis.tickValues([minValue, maxValue])
      .tickFormat(this.model.time.timeFormat);
  },

  changeTime: function() {
    //time slider should always receive a time model
    var time = this.model.time.value;
    //special classes
    this._optionClasses();
  },

  /**
   * Executes everytime the container or vizabi is resized
   * Ideally,it contains only operations related to size
   */
  resize: function () {
    if(this._splash) return;

    this.model.time.pause();

    this.profile = this.getActiveProfile(profiles, presentationProfileChanges);

    var slider_w = parseInt(this.slider_outer.style("width"), 10) || 0;
    var slider_h = parseInt(this.slider_outer.style("height"), 10) || 0;
    this.width = slider_w - this.profile.margin.left - this.profile.margin.right;
    this.height = slider_h - this.profile.margin.bottom - this.profile.margin.top;
    var _this = this;

    //translate according to margins
    this.slider.attr("transform", "translate(" + this.profile.margin.left + "," + this.profile.margin.top + ")");

    //adjust scale width if it was not set manually before
    if (this.xScale.range()[1] = 1) this.xScale.range([0, this.width]);

    //adjust axis with scale
    this.xAxis = this.xAxis.scale(this.xScale)
      .tickPadding(this.profile.label_spacing);

    this.axis.attr("transform", "translate(0," + this.height / 2 + ")")
      .call(this.xAxis);

    this.select.attr("transform", "translate(0," + this.height / 2 + ")");
    this.progressBar.attr("transform", "translate(0," + this.height / 2 + ")");

    this.slide.select(".background")
      .attr("height", this.height);

    //size of handle
    this.handle.attr("transform", "translate(0," + this.height / 2 + ")")
      .attr("r", this.profile.radius);

    this.sliderWidth = _this.slider.node().getBoundingClientRect().width;

    this.resizeSelectedLimiters();
    this._resizeProgressBar();
    this._setHandle();

  },

  setSelectedLimits: function(force) {
    var _this = this;
    this._setSelectedLimitsId++;
    var _setSelectedLimitsId = this._setSelectedLimitsId;

    var select = _this.model.marker.select;
    if(select.length == 0) {
      _this.model.time.set({
        startSelected: new Date(_this.model.time.start),
        endSelected: new Date(_this.model.time.end)
      }, null, false  /*make change non-persistent for URL and history*/);
      return;
    }
    var KEY = _this.model.entities.getDimension();
    var proms = [];
    utils.forEach(select, function(entity) {
      proms.push(_this.model.marker.getEntityLimits(entity[KEY]));
    });
    Promise.all(proms).then(function(limits) {
      if(_setSelectedLimitsId != _this._setSelectedLimitsId) return;
      var first = limits.shift();
      var min = first.min;
      var max = first.max;
      utils.forEach(limits, function(limit) {
        if (min - limit.min > 0) min = limit.min;
        if (max - limit.max < 0) max = limit.max;
      });
      _this.model.time
        .set({
          startSelected: d3.max([min, new Date(_this.model.time.start)]),
          endSelected: d3.min([max, new Date(_this.model.time.end)])
        }, force, false  /*make change non-persistent for URL and history*/);
    });
  },

  updateSelectedStartLimiter: function() {
    var _this = this;
    this.select.select('#clip-start-' + _this._id).remove();
    this.select.select(".selected-start").remove();
    if(this.model.time.startSelected && this.model.time.startSelected > this.model.time.start) {
      this.select.append("clipPath")
        .attr("id", "clip-start-" + _this._id)
        .append('rect')
      this.select.append('path')
        .attr("clip-path", "url(" + location.pathname + "#clip-start-" + _this._id + ")")
        .classed('selected-start', true);
      this.resizeSelectedLimiters();
    }
  },

  updateSelectedEndLimiter: function() {
    var _this = this;
    this.select.select('#clip-end-' + _this._id).remove();
    this.select.select(".selected-end").remove();
    if(this.model.time.endSelected && this.model.time.endSelected < this.model.time.end) {
      this.select.append("clipPath")
        .attr("id", "clip-end-" + _this._id)
        .append('rect')
      this.select.append('path')
        .attr("clip-path", "url(" + location.pathname + "#clip-end-" + _this._id + ")")
        .classed('selected-end', true);
      this.resizeSelectedLimiters();
    }
  },

  resizeSelectedLimiters: function() {
    var _this = this;
    this.select.select('.selected-start')
      .attr('d', "M0,0H" + this.xScale(this.model.time.startSelected));
    this.select.select("#clip-start-" + _this._id).select('rect')
      .attr("x", -this.height / 2)
      .attr("y", -this.height / 2)
      .attr("height", this.height)
      .attr("width", this.xScale(this.model.time.startSelected) + this.height / 2);
    this.select.select('.selected-end')
      .attr('d', "M" + this.xScale(this.model.time.endSelected) + ",0H" + this.xScale(this.model.time.end));
    this.select.select("#clip-end-" + _this._id).select('rect')
      .attr("x", this.xScale(this.model.time.endSelected))
      .attr("y", -this.height / 2)
      .attr("height", this.height)
      .attr("width", this.xScale(this.model.time.end) - this.xScale(this.model.time.endSelected) + this.height / 2);
  },

  _resizeProgressBar: function() {
    var _this = this;
    this.progressBar.selectAll('path')
    .each(function(d) {
        d3.select(this)
          .attr('d', "M" + _this.xScale(d[0]) + ",0H" + _this.xScale(d[1]));
      });
  },

  _updateProgressBar: function(time) {
    var _this = this;
    if (time) {
      if (_this.completedTimeFrames.indexOf(time) != -1) return;
      _this.completedTimeFrames.push(time);
      var next = _this.model.time.incrementTime(time);
      var prev = _this.model.time.decrementTime(time);
      if (next > _this.model.time.end) {
        if (time - _this.model.time.end == 0) {
          next = time;
          time = prev;
        } else {
          return;
        }
      }
      if (_this.availableTimeFrames.length == 0 || _this.availableTimeFrames[_this.availableTimeFrames.length - 1][1] < time) {
        _this.availableTimeFrames.push([time, next]);
      } else if (next < _this.availableTimeFrames[0][0]) {
        _this.availableTimeFrames.unshift([time, next]);
      } else {
        for (var i = 0; i < _this.availableTimeFrames.length; i++) {
          if (time - _this.availableTimeFrames[i][1] == 0) {
            if (i + 1 < _this.availableTimeFrames.length && next - _this.availableTimeFrames[i + 1][0] == 0) {
              _this.availableTimeFrames[i][1] = _this.availableTimeFrames[i + 1][1];
              _this.availableTimeFrames.splice(i + 1, 1);
            } else {
              _this.availableTimeFrames[i][1] = next;
            }
            break;
          }
          if (next - _this.availableTimeFrames[i][0] == 0) {
            _this.availableTimeFrames[i][0] = time;
            break;
          }
          if (time - _this.availableTimeFrames[i][1] > 0 && next - _this.availableTimeFrames[i + 1][0] < 0) {
            _this.availableTimeFrames.splice(i + 1, 0, [time, next]);
            break;
          }
        }
      }
    } else {
      _this.availableTimeFrames = [];
      _this.completedTimeFrames = []
    }

    var progress = this.progressBar.selectAll('path').data(_this.availableTimeFrames);
    progress.exit().remove();
    progress.enter().append('path').attr('class', 'domain');
    progress.each(function(d) {
        var element = d3.select(this);
        element.attr('d', "M" + _this.xScale(d[0]) + ",0H" + _this.xScale(d[1]))
        .classed("rounded", _this.availableTimeFrames.length == 1);

      });
  },


  /**
   * Returns width of slider text value.
   * Parameters in this function needed for memoize function, so they are not redundant.
   */
  getValueWidth: function(layout, value) {
    return this.valueText.node().getBoundingClientRect().width;
  },

  /**
   * Gets brushed function to be executed when dragging
   * @returns {Function} brushed function
   */
  _getBrushed: function() {
    var _this = this;
    return function() {

      if (_this.model.time.playing)
        _this.model.time.pause();

      _this._optionClasses();
      _this.element.classed(class_dragging, true);

      var value = _this.brush.extent()[0];

      //set brushed properties

      if(d3.event.sourceEvent) {
        // Prevent window scrolling on cursor drag in Chrome/Chromium.
        d3.event.sourceEvent.preventDefault();

        _this.model.time.dragStart();
        var posX = utils.roundStep(Math.round(d3.mouse(this)[0]), precision);
        value = _this.xScale.invert(posX);
        var maxPosX = _this.width;

        if(posX > maxPosX) {
          posX = maxPosX;
        } else if(posX < 0) {
          posX = 0;
        }

        //set handle position
        _this.handle.attr("cx", posX);
        _this.valueText.attr("transform", "translate(" + posX + "," + (_this.height / 2) + ")");
        _this.valueText.text(_this.model.time.timeFormat(value));
      }

      //set time according to dragged position
      if(value - _this.model.time.value !== 0) {
        _this._setTime(value);
      }
    };
  },

  /**
   * Gets brushedEnd function to be executed when dragging ends
   * @returns {Function} brushedEnd function
   */
  _getBrushedEnd: function() {
    var _this = this;
    return function() {
      _this._setTime.recallLast();
      _this.element.classed(class_dragging, false);
      _this.model.time.dragStop();
      _this.model.time.snap();
    };
  },

  /**
   * Sets the handle to the correct position
   * @param {Boolean} transition whether to use transition or not
   */
  _setHandle: function(transition) {
    var _this = this;
    var value = this.model.time.value;
    this.slide.call(this.brush.extent([value, value]));

    this.element.classed("vzb-ts-disabled", this.model.time.end <= this.model.time.start);
//    this.valueText.text(this.model.time.timeFormat(value));

//    var old_pos = this.handle.attr("cx");
    var new_pos = this.xScale(value);
    if(_this.prevPosition == null) _this.prevPosition = new_pos;
    var delayAnimations = new_pos > _this.prevPosition ? this.model.time.delayAnimations : 0;
    if(transition) {
      this.handle.attr("cx", _this.prevPosition)
        .transition()
        .duration(delayAnimations)
        .ease("linear")
        .attr("cx", new_pos);

      this.valueText.attr("transform", "translate(" + _this.prevPosition + "," + (this.height / 2) + ")")
        .transition('text')
        .delay(delayAnimations)
        .text(this.model.time.timeFormat(value));
      this.valueText
        .transition()
        .duration(delayAnimations)
        .ease("linear")
        .attr("transform", "translate(" + new_pos + "," + (this.height / 2) + ")");
    } else {
      this.handle
        //cancel active transition
        .interrupt()
        .attr("cx", new_pos);

      this.valueText
        //cancel active transition
        .interrupt()
        .interrupt('text')
        .transition('text');
      this.valueText
        .attr("transform", "translate(" + new_pos + "," + (this.height / 2) + ")")
        .text(this.model.time.timeFormat(value));
    }
    _this.prevPosition = new_pos;

  },

  /**
   * Sets the current time model to time
   * @param {number} time The time
   */
  _setTime: function(time) {
    //update state
    var _this = this;
    //  frameRate = 50;

    //avoid updating more than once in "frameRate"
    //var now = new Date();
    //if (this._updTime != null && now - this._updTime < frameRate) return;
    //this._updTime = now;
    var persistent = !this.model.time.dragging && !this.model.time.playing;
    _this.model.time.getModelObject('value').set(time, false, persistent); // non persistent
  },


  /**
   * Applies some classes to the element according to options
   */
  _optionClasses: function() {
    //show/hide classes

    var show_limits = this.ui.show_limits;
    var show_value = this.ui.show_value;
    var show_value_when_drag_play = this.ui.show_value_when_drag_play;
    var axis_aligned = this.ui.axis_aligned;
    var show_play = (this.ui.show_button) && (this.model.time.playable);

    if(!show_limits) {
      this.xAxis.tickValues([]).ticks(0);
    }

    this.element.classed(class_hide_play, !show_play);
    this.element.classed(class_playing, this.model.time.playing);
    this.element.classed(class_show_value, show_value);
    this.element.classed(class_show_value_when_drag_play, show_value_when_drag_play);
    this.element.classed(class_axis_aligned, axis_aligned);
  }
});

export default TimeSlider;
