import * as utils from "base/utils";
import Component from "base/component";


const precision = 1;

//constants
const class_playing = "vzb-playing";
const class_loading = "vzb-ts-loading";
const class_hide_play = "vzb-ts-hide-play-button";
const class_dragging = "vzb-ts-dragging";
const class_axis_aligned = "vzb-ts-axis-aligned";
const class_show_value = "vzb-ts-show-value";
const class_show_value_when_drag_play = "vzb-ts-show-value-when-drag-play";

//margins for slider
const profiles = {
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


const presentationProfileChanges = {
  "medium": {
    margin: {
      top: 9
    }
  },
  "large": {
    margin: {
    }
  }
};

const TimeSlider = Component.extend({
  /**
   * Initializes the timeslider.
   * Executed once before any template is rendered.
   * @param model The model passed to the component
   * @param context The component's parent
   */
  init(model, context) {

    this.name = "gapminder-timeslider";
    this.template = this.template || require("./timeslider.html");
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

    const _this = this;
    //binds methods to this model
    this.model_binds = {
      "change:time": function(evt, path) {
        if (_this.slide) {
          if ((["time.start", "time.end"]).indexOf(path) !== -1) {
            if (!_this.xScale) return;
            _this.changeLimits();
          }
          _this._optionClasses();
          //only set handle position if change is external
          if (!_this.model.time.dragging) _this._setHandle(_this.model.time.playing);
        }
      },
      "change:time.start": function(evt, path) {
        if (_this.slide) {
          //only set handle position if change is external
          if (!_this.model.time.dragging) _this._setHandle(_this.model.time.playing);
        }
      },
      "change:time.end": function(evt, path) {
        if (_this.slide) {
          //only set handle position if change is external
          if (!_this.model.time.dragging) _this._setHandle(_this.model.time.playing);
        }
      },
      "change:time.startSelected": function(evt, path) {
        if (_this.slide) {
          _this.updateSelectedStartLimiter();
        }
      },
      "change:time.endSelected": function(evt, path) {
        if (_this.slide) {
          _this.updateSelectedEndLimiter();
        }
      },
      "change:marker.select": function(evt, path) {
        _this.setSelectedLimits();
      }
    };


    // Same constructor as the superclass
    this._super(model, context);

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

  //template is ready
  readyOnce() {

    const _this = this;

    //DOM to d3
    //TODO: remove this ugly hack
    this.element = utils.isArray(this.element) ? this.element : d3.select(this.element);

    //html elements
    this.slider_outer = this.element.select(".vzb-ts-slider");
    this.slider = this.slider_outer.select("g");
    this.axis = this.element.select(".vzb-ts-slider-axis");
    this.select = this.element.select(".vzb-ts-slider-select");
    this.progressBar = this.element.select(".vzb-ts-slider-progress");
    this.slide = this.element.select(".vzb-ts-slider-slide");
    this.handle = this.element.select(".vzb-ts-slider-handle");
    this.valueText = this.element.select(".vzb-ts-slider-value");
    //Scale
    this.xScale = d3.time.scale.utc()
      .clamp(true);

    //Axis
    this.xAxis = d3.axisBottom()
      .tickSize(0);
    //Value
    this.valueText.attr("text-anchor", "middle").attr("dy", "-0.7em");

    const brushed = _this._getBrushed();
    const brushedEnd = _this._getBrushedEnd();

    //Brush for dragging
    // this.brush = d3.brushX()
    //   //.x(this.xScale)
    //   .extent([[0, 0], [0, 0]])
    //   .on("start brush", function () {
    //     brushed.call(this);
    //   })
    //   .on("end", function () {
    //     brushedEnd.call(this);
    //   });

    // //Slide
    // this.slide.call(this.brush);

    this.brush = d3.drag()
      //.on("start.interrupt", function() { _this.slide.interrupt(); })
      .on("start drag", function() {
        brushed.call(this);
      })
      .on("end", function() {
        brushedEnd.call(this);
      });

    //Slide
    this.slide.call(this.brush);

    this.slider_outer.on("mousewheel", () => {
        //do nothing and dont pass the event on if we are currently dragging the slider
      if (_this.model.time.dragging) {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        d3.event.returnValue = false;
        return false;
      }
    });

    //this.slide.selectAll(".extent,.resize")
    //  .remove();

    this._setSelectedLimitsId = 0; //counter for setSelectedLimits

    if (this.model.time.startSelected > this.model.time.start) {
      _this.updateSelectedStartLimiter();
    }

    if (this.model.time.endSelected < this.model.time.end) {
      _this.updateSelectedEndLimiter();
    }

    // special for linechart: resize timeslider to match time x-axis length
    this.parent.on("myEvent", (evt, arg) => {
      const layoutProfile = _this.getLayoutProfile();

      if (arg.profile && arg.profile.margin) {
        profiles[layoutProfile].margin = arg.profile.margin;
      }

      // set the right margin that depends on longest label width
      _this.element.select(".vzb-ts-slider-wrapper")
        .style("right", (arg.mRight - profiles[layoutProfile].margin.right) + "px");

      _this.updateSize([0, arg.rangeMax]);
    });

    this.on("resize", () => {
      _this.updateSize();
    });
  },

  //template and model are ready
  ready() {
    if (this.model.time.splash) return;

    this.element.classed(class_loading, false);

    const play = this.element.select(".vzb-ts-btn-play");
    const pause = this.element.select(".vzb-ts-btn-pause");
    const _this = this;
    const time = this.model.time;

    play.on("click", () => {

      _this.model.time.play();
    });

    pause.on("click", () => {
      _this.model.time.pause("soft");
    });

    this.changeLimits();
    this.changeTime();
    this.updateSize();

    _this._updateProgressBar();
    _this.model.marker.listenFramesQueue(null, time => {
      _this._updateProgressBar(time);
    });
    _this.setSelectedLimits(true);
  },

  changeLimits() {
    const minValue = this.model.time.start;
    const maxValue = this.model.time.end;
    //scale
    this.xScale.domain([minValue, maxValue]);
    //axis
    this.xAxis.tickValues([minValue, maxValue])
      .tickFormat(this.model.time.getFormatter());
  },

  changeTime() {
    //time slider should always receive a time model
    const time = this.model.time.value;
    //special classes
    this._optionClasses();
  },

  /**
   * Executes everytime the container or vizabi is resized
   * Ideally,it contains only operations related to size
   */
  updateSize(range) {
    if (this.model.time.splash) return;

    this.model.time.pause();

    this.profile = this.getActiveProfile(profiles, presentationProfileChanges);

    const slider_w = parseInt(this.slider_outer.style("width"), 10) || 0;
    const slider_h = parseInt(this.slider_outer.style("height"), 10) || 0;

    if (!slider_h || !slider_w) return utils.warn("time slider resize() aborted because element is too small or has display:none");

    this.width = slider_w - this.profile.margin.left - this.profile.margin.right;
    this.height = slider_h - this.profile.margin.bottom - this.profile.margin.top;
    const _this = this;

    //translate according to margins
    this.slider.attr("transform", "translate(" + this.profile.margin.left + "," + this.profile.margin.top + ")");

    this.xScale.range(range || [0, this.width]);

    this.slide
      .attr("transform", "translate(0," + this.height / 2 + ")")
      .attr("x1", this.xScale.range()[0])
      .attr("x2", this.xScale.range()[1])
      .style("stroke-width", this.profile.radius * 2 + "px");
    //.call(this.brush
    //.extent([[this.xScale.range()[0], 0], [this.xScale.range()[1], this.height]]));

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

  setSelectedLimits(force) {
    const _this = this;
    this._setSelectedLimitsId++;
    const _setSelectedLimitsId = this._setSelectedLimitsId;

    const select = _this.model.marker.select;
    if (select.length == 0) {
      _this.model.time.set({
        startSelected: new Date(_this.model.time.start),
        endSelected: new Date(_this.model.time.end)
      }, null, false  /*make change non-persistent for URL and history*/);
      return;
    }
    const KEY = _this.model.entities.getDimension();
    const proms = [];
    utils.forEach(select, entity => {
      proms.push(_this.model.marker.getEntityLimits(entity[KEY]));
    });
    Promise.all(proms).then(limits => {
      if (_setSelectedLimitsId != _this._setSelectedLimitsId) return;
      const first = limits.shift();
      let min = first.min;
      let max = first.max;
      utils.forEach(limits, limit => {
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

  updateSelectedStartLimiter() {
    const _this = this;
    this.select.select("#clip-start-" + _this._id).remove();
    this.select.select(".selected-start").remove();
    if (this.model.time.startSelected && this.model.time.startSelected > this.model.time.start) {
      this.select.append("clipPath")
        .attr("id", "clip-start-" + _this._id)
        .append("rect");
      this.select.append("path")
        .attr("clip-path", "url(" + location.pathname + "#clip-start-" + _this._id + ")")
        .classed("selected-start", true);
      this.resizeSelectedLimiters();
    }
  },

  updateSelectedEndLimiter() {
    const _this = this;
    this.select.select("#clip-end-" + _this._id).remove();
    this.select.select(".selected-end").remove();
    if (this.model.time.endSelected && this.model.time.endSelected < this.model.time.end) {
      this.select.append("clipPath")
        .attr("id", "clip-end-" + _this._id)
        .append("rect");
      this.select.append("path")
        .attr("clip-path", "url(" + location.pathname + "#clip-end-" + _this._id + ")")
        .classed("selected-end", true);
      this.resizeSelectedLimiters();
    }
  },

  resizeSelectedLimiters() {
    const _this = this;
    this.select.select(".selected-start")
      .attr("d", "M0,0H" + this.xScale(this.model.time.startSelected));
    this.select.select("#clip-start-" + _this._id).select("rect")
      .attr("x", -this.height / 2)
      .attr("y", -this.height / 2)
      .attr("height", this.height)
      .attr("width", this.xScale(this.model.time.startSelected) + this.height / 2);
    this.select.select(".selected-end")
      .attr("d", "M" + this.xScale(this.model.time.endSelected) + ",0H" + this.xScale(this.model.time.end));
    this.select.select("#clip-end-" + _this._id).select("rect")
      .attr("x", this.xScale(this.model.time.endSelected))
      .attr("y", -this.height / 2)
      .attr("height", this.height)
      .attr("width", this.xScale(this.model.time.end) - this.xScale(this.model.time.endSelected) + this.height / 2);
  },

  _resizeProgressBar() {
    const _this = this;
    this.progressBar.selectAll("path")
      .each(function(d) {
        d3.select(this)
          .attr("d", "M" + _this.xScale(d[0]) + ",0H" + _this.xScale(d[1]));
      });
  },

  _updateProgressBar(time) {
    const _this = this;
    if (time) {
      if (_this.completedTimeFrames.indexOf(time) != -1) return;
      _this.completedTimeFrames.push(time);
      let next = _this.model.time.incrementTime(time);
      const prev = _this.model.time.decrementTime(time);
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
        for (let i = 0; i < _this.availableTimeFrames.length; i++) {
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
      _this.completedTimeFrames = [];
    }

    const progress = this.progressBar.selectAll("path").data(_this.availableTimeFrames);
    progress.exit().remove();
    progress.enter()
      .append("path")
      .attr("class", "domain")
      .merge(progress)
      .each(function(d) {
        const element = d3.select(this);
        element.attr("d", "M" + _this.xScale(d[0]) + ",0H" + _this.xScale(d[1]))
          .classed("rounded", _this.availableTimeFrames.length == 1);

      });
  },


  /**
   * Returns width of slider text value.
   * Parameters in this function needed for memoize function, so they are not redundant.
   */
  getValueWidth(layout, value) {
    return this.valueText.node().getBoundingClientRect().width;
  },

  /**
   * Gets brushed function to be executed when dragging
   * @returns {Function} brushed function
   */
  _getBrushed() {
    const _this = this;
    return function() {

      if (_this.model.time.playing)
        _this.model.time.pause();

      _this._optionClasses();
      _this.element.classed(class_dragging, true);

      let value;// = _this.brush.extent()[0];
      //var value = d3.brushSelection(_this.slide.node());

      //if(!value) return;

      //set brushed properties

      if (d3.event.sourceEvent) {
        // Prevent window scrolling on cursor drag in Chrome/Chromium.
        d3.event.sourceEvent.preventDefault();

        _this.model.time.dragStart();
        let posX = utils.roundStep(Math.round(d3.mouse(this)[0]), precision);
        value = _this.xScale.invert(posX);
        const maxPosX = _this.width;

        if (posX > maxPosX) {
          posX = maxPosX;
        } else if (posX < 0) {
          posX = 0;
        }

        //set handle position
        _this.handle.attr("cx", posX);
        _this.valueText.attr("transform", "translate(" + posX + "," + (_this.height / 2) + ")");
        _this.valueText.text(_this.model.time.formatDate(value, "ui"));
      }

      //set time according to dragged position
      if (value - _this.model.time.value !== 0) {
        _this._setTime(value);
      }
    };
  },

  /**
   * Gets brushedEnd function to be executed when dragging ends
   * @returns {Function} brushedEnd function
   */
  _getBrushedEnd() {
    const _this = this;
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
  _setHandle(transition) {
    const _this = this;
    const value = this.model.time.value;
    //this.slide.call(this.brush.extent([value, value]));
    const new_pos = this.xScale(value);
    //this.brush.move(this.slide, [new_pos, new_pos])

    this.element.classed("vzb-ts-disabled", this.model.time.end <= this.model.time.start);
//    this.valueText.text(this.model.time.formatDate(value));

//    var old_pos = this.handle.attr("cx");
    //var new_pos = this.xScale(value);
    if (_this.prevPosition == null) _this.prevPosition = new_pos;
    const delayAnimations = new_pos > _this.prevPosition ? this.model.time.delayAnimations : 0;
    if (transition) {
      this.handle.attr("cx", _this.prevPosition)
        .transition()
        .duration(delayAnimations)
        .ease(d3.easeLinear)
        .attr("cx", new_pos);

      this.valueText.attr("transform", "translate(" + _this.prevPosition + "," + (this.height / 2) + ")")
        .transition("text")
        .delay(delayAnimations)
        .text(this.model.time.formatDate(value, "ui"));
      this.valueText
        .transition()
        .duration(delayAnimations)
        .ease(d3.easeLinear)
        .attr("transform", "translate(" + new_pos + "," + (this.height / 2) + ")");
    } else {
      this.handle
        //cancel active transition
        .interrupt()
        .attr("cx", new_pos);

      this.valueText
        //cancel active transition
        .interrupt()
        .interrupt("text")
        .transition("text");
      this.valueText
        .attr("transform", "translate(" + new_pos + "," + (this.height / 2) + ")")
        .text(this.model.time.formatDate(value, "ui"));
    }
    _this.prevPosition = new_pos;

  },

  /**
   * Sets the current time model to time
   * @param {number} time The time
   */
  _setTime(time) {
    //update state
    const _this = this;
    //  frameRate = 50;

    //avoid updating more than once in "frameRate"
    //var now = new Date();
    //if (this._updTime != null && now - this._updTime < frameRate) return;
    //this._updTime = now;
    const persistent = !this.model.time.dragging && !this.model.time.playing;
    _this.model.time.getModelObject("value").set(time, false, persistent); // non persistent
  },


  /**
   * Applies some classes to the element according to options
   */
  _optionClasses() {
    //show/hide classes

    const show_limits = this.ui.show_limits;
    const show_value = this.ui.show_value;
    const show_value_when_drag_play = this.ui.show_value_when_drag_play;
    const axis_aligned = this.ui.axis_aligned;
    const show_play = (this.ui.show_button) && (this.model.time.playable);

    if (!show_limits) {
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
