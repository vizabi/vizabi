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
    this.template = this.template || "timeslider.html";
    this.prevPosition = null;
    //define expected models/hooks for this component
    this.model_expects = [{
      name: "time",
      type: "time"
    },{
      name: "ui",
      type: "ui"
    }];


    // Same constructor as the superclass
    this._super(model, context);

    //starts as splash if this is the option
    this._splash = this.model.ui.splash;

    var _this = this;
    //binds methods to this model
    this.model_binds = {
      'change:time': function(evt, path) {

        //TODO: readyOnce CANNOT be run twice
        //if(_this._splash !== _this.model.time.splash) {
          _this._splash = _this.model.time.splash;
          _this.readyOnce();
          _this.ready();
        //}

        //if(!_this._splash) {

          if((['time.start', 'time.end']).indexOf(path) !== -1) {
            _this.changeLimits();
          }
          _this._optionClasses();
        //}
      },
      'change:time.value': function(evt, path) {
        //if(!_this._splash) {
          //only set handle position if change is external
          if(!_this.model.time.dragging) _this._setHandle(_this.model.time.playing);
        //}
      }
    };

    this.model.ui = utils.extend({
      show_limits: false,
      show_value: false,
      show_value_when_drag_play: true,
      show_button: true,
      class_axis_aligned: false
    }, this.model.ui.getPlainObject());

    //defaults
    this.width = 0;
    this.height = 0;

    this.getValueWidth = utils.memoize(this.getValueWidth);
    this._setTime = utils.throttle(this._setTime, 50);
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
    this.slide.selectAll(".extent,.resize")
      .remove();


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
    this.model.ui.format = this.model.time.unit;
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

    this.model.time.pause();

    this.profile = this.getActiveProfile(profiles, presentationProfileChanges);

    var slider_w = parseInt(this.slider_outer.style("width"), 10);
    var slider_h = parseInt(this.slider_outer.style("height"), 10);
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

    this.slide.select(".background")
      .attr("height", this.height);

    //size of handle
    this.handle.attr("transform", "translate(0," + this.height / 2 + ")")
      .attr("r", this.profile.radius);

    this.sliderWidth = _this.slider.node().getBoundingClientRect().width;

    this._setHandle();

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
    this.valueText.text(this.model.time.timeFormat(value));

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
        .attr("transform", "translate(" + new_pos + "," + (this.height / 2) + ")");
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

    var show_limits = this.model.ui.show_limits;
    var show_value = this.model.ui.show_value;
    var show_value_when_drag_play = this.model.ui.show_value_when_drag_play;
    var axis_aligned = this.model.ui.axis_aligned;
    var show_play = (this.model.ui.show_button) && (this.model.time.playable);

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
