import * as utils from 'base/utils';
import Component from 'base/component';

var precision = 3;

//constants
var class_playing = "vzb-playing";
var class_loading = "vzb-ts-loading";
var class_hide_play = "vzb-ts-hide-play-button";
var class_dragging = "vzb-ts-dragging";
var class_axis_aligned = "vzb-ts-axis-aligned";
var class_show_value = "vzb-ts-show-value";
var class_show_value_when_drag_play = "vzb-ts-show-value-when-drag-play";

var time_formats = {
  "year": "%Y",
  "month": "%b",
  "week": "week %U",
  "day": "%d/%m/%Y",
  "hour": "%d/%m/%Y %H",
  "minute": "%d/%m/%Y %H:%M",
  "second": "%d/%m/%Y %H:%M:%S"
};

//margins for slider
var profiles = {
  small: {
    margin: {
      top: 9,
      right: 15,
      bottom: 10,
      left: 15
    },
    radius: 8,
    label_spacing: 10
  },
  medium: {
    margin: {
      top: 9,
      right: 15,
      bottom: 10,
      left: 15
    },
    radius: 10,
    label_spacing: 12
  },
  large: {
    margin: {
      top: 9,
      right: 15,
      bottom: 10,
      left: 15
    },
    radius: 11,
    label_spacing: 14
  }
};

var TimeSlider = Component.extend({
  /**
   * Initializes the timeslider.
   * Executed once before any template is rendered.
   * @param config The options passed to the component
   * @param context The component's parent
   */
  init: function(config, context) {

    this.name = "gapminder-timeslider";

    this.template = this.template || "timeslider.html";

    //define expected models/hooks for this component
    this.model_expects = [{
      name: "time",
      type: "time",
      speed: "speed"
    }];

    var _this = this;

    //starts as splash if this is the option
    this._splash = config.ui.splash;

    //binds methods to this model
    this.model_binds = {
      'change:time': function(evt, original) {
        if(_this._splash !== _this.model.time.splash) {
          _this._splash = _this.model.time.splash;
          _this.readyOnce();
          _this.ready();
        }

        if(!_this._splash) {

          if((['change:time:start', 'change:time:end']).indexOf(evt) !== -1) {
            _this.changeLimits();
          }
          _this._optionClasses();
          //only set handle position if change is external
          if(!_this._dragging) {
            _this._setHandle(_this.model.time.playing);
          }
        }
      }
    };

    this.ui = utils.extend({
      show_limits: false,
      show_value: false,
      show_value_when_drag_play: true,
      show_button: true,
      class_axis_aligned: false
    }, config.ui, this.ui);

    // Same constructor as the superclass
    this._super(config, context);

    this._dragging = false;
    //defaults
    this.width = 0;
    this.height = 0;

    this.getValueWidth = utils.memoize(this.getValueWidth);
    this._setTime = utils.throttle(this._setTime, 50);
    this._setSpeed = utils.throttle(this._setSpeed, 1000);
  },

  //template is ready
  readyOnce: function () {

    if(this._splash) return;

    var _this = this;

    //DOM to d3
    this.element = d3.select(this.element);
    this.element.classed(class_loading, false);

    //html elements
    this.slider_outer = this.element.select(".vzb-ts-slider");
    this.slider = this.slider_outer.select("g");
    this.axis = this.element.select(".vzb-ts-slider-axis");
    this.slide = this.element.select(".vzb-ts-slider-slide");
    this.handle = this.slide.select(".vzb-ts-slider-handle");
    this.valueText = this.slide.select('.vzb-ts-slider-value');

    //html elements for the speed_slider
    this.speed_slider_outer = this.element.select(".vzb-ts-speed-slider");
    this.speed_slider = this.speed_slider_outer.select("g");
    this.speed_axis = this.element.select(".vzb-ts-speed-slider-axis");
    this.speed_slide = this.element.select(".vzb-ts-speed-slider-slide");
    this.speed_handle = this.speed_slide.select(".vzb-ts-speed-slider-handle");
    this.speed_valueText = this.speed_slide.select('.vzb-speed-ts-slider-value');

    /*var speedContainer = this.element.select(".vzb-ts-speed-slider-wrapper");
    var icon_speed_slow = speedContainer.append("div")
              .attr("class", "vzb-speed-slow vzb-speed")
              .html(iconset['snail-slow']);

    var iconSpeedFast = speedContainer.append("div")
              .attr("class", "vzb-speed-fast vzb-speed")
              .html(iconset['cheetah-fast']);
*/

    //Scale
    this.xScale = d3.time.scale()
      .clamp(true);

    //Speed Scale
    this.xSpeedScale = d3.scale.linear()
      .clamp(true);

    //Axis
    this.xAxis = d3.svg.axis()
      .orient("bottom")
      .tickSize(0);

    //Speed Axis
    this.xSpeedAxis = d3.svg.axis()
      .orient("bottom")
      .tickSize(0);

    //Value
    this.valueText.attr("text-anchor", "middle").attr("dy", "-1em");

    var brushed = _this._getBrushed(),
      brushedEnd = _this._getBrushedEnd();

    var speedBrushed = _this._getSpeedBrushed(),
      speedBrushedEnd = _this._getSpeedBrushedEnd();

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

    //Speed Brush for dragging
    this.speed_brush = d3.svg.brush()
      .x(this.xSpeedScale)
      .extent([0, 0])
      .on("brush", function () {
        speedBrushed.call(this);
      })
      .on("brushend", function () {
        speedBrushedEnd.call(this);
      });

    //Slide
    this.slide.call(this.brush);
    this.speed_slide.call(this.speed_brush);
    this.slide.selectAll(".extent,.resize")
      .remove();

    this.speed_slide.selectAll(".extent,.resize")
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
    var speed = this.model.time.speed;

    play.on('click', function () {
      _this._dragging = false;
      _this.model.time.play();
    });

    pause.on('click', function () {
      _this._dragging = false;
      _this.model.time.pause();
    });//format

    var fmt = time.formatOutput || time_formats[time.unit];
    this.format = d3.time.format(fmt);

    this.changeLimits();
    this.changeSpeedLimits();
    this.changeTime();
    this.changeSpeed();
    this.resize();
    this._setHandle(this.model.time.playing);
    this._setSpeedHandle(this.model.time.playing);
    //this._toggleSpeedSlider();
  },

  changeLimits: function() {
    var minValue = this.model.time.start;
    var maxValue = this.model.time.end;
    //scale
    this.xScale.domain([minValue, maxValue]);
    //axis
    this.xAxis.tickValues([minValue, maxValue])
      .tickFormat(this.format);
  },

  changeSpeedLimits: function () {
      var minValue = this.model.time.speedStart;
      var maxValue = this.model.time.speedEnd;
      //scale
      this.xSpeedScale.domain([minValue, maxValue]);
      //axis
      this.xSpeedAxis.tickValues([minValue, maxValue])
        .tickFormat(this.format);
    },

  changeTime: function() {
    this.ui.format = this.model.time.unit;
    //time slider should always receive a time model
    var time = this.model.time.value;
    //special classes
    this._optionClasses();
  },

  changeSpeed: function () {
    var speed = this.model.time.speed;
    //special classes
    this._optionClasses();
    },

  /**
   * Executes everytime the container or vizabi is resized
   * Ideally,it contains only operations related to size
   */
   resize: function () {

     this.model.time.pause();

     this.profile = profiles[this.getLayoutProfile()];

     var slider_w = parseInt(this.slider_outer.style("width"), 10);
     var slider_h = parseInt(this.slider_outer.style("height"), 10);
     this.width = slider_w - this.profile.margin.left - this.profile.margin.right;
     this.height = slider_h - this.profile.margin.bottom - this.profile.margin.top;
     var _this = this;

     //translate according to margins
     this.slider.attr("transform", "translate(" + this.profile.margin.left + "," + this.profile.margin.top + ")");

     this.speed_slider.attr("transform", "translate(" + this.profile.margin.left + "," + this.profile.margin.top/2 + ")");

     //adjust scale width if it was not set manually before
     if (this.xScale.range()[1] = 1) this.xScale.range([0, this.width]);

     if (this.xSpeedScale.range()[1] = 1) this.xSpeedScale.range([0, this.width/6]);

     //adjust axis with scale
     this.xAxis = this.xAxis.scale(this.xScale)
       .tickPadding(this.profile.label_spacing);

     this.xSpeedAxis = this.xSpeedAxis.scale(this.xSpeedScale)
       .tickFormat("");

     this.axis.attr("transform", "translate(0," + this.height / 2 + ")")
       .call(this.xAxis);

     this.speed_axis.attr("transform", "translate(0," + this.height / 2 + ")")
       .call(this.xSpeedAxis);

     this.slide.select(".background")
       .attr("height", this.height);

     this.speed_slide.select(".background")
       .attr("height", this.height);

     //size of handle
     this.handle.attr("transform", "translate(0," + this.height / 2 + ")")
       .attr("r", this.profile.radius);

     this.speed_handle.attr("transform", "translate(0," + this.height / 2 + ")")
       .attr("r", this.profile.radius - 2);

     this.sliderWidth = _this.slider.node().getBoundingClientRect().width;

     this._setHandle();
     this._setSpeedHandle();

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
      _this.model.time.pause();

      if(!_this._blockUpdate) {
        _this._optionClasses();
        _this._blockUpdate = true;
        _this.element.classed(class_dragging, true);
      }

      var value = _this.brush.extent()[0];

      //set brushed properties
      if(d3.event.sourceEvent) {
        _this._dragging = true;
        setTimeout(function() {
          _this.model.time.dragStart();
          if (_this._dragging) {
          }
        }, 500);
        var posX = utils.roundStep(Math.round(d3.mouse(this)[0]), precision);
        value = _this.xScale.invert(posX);
        var layoutProfile = _this.getLayoutProfile();
        var textWidth = _this.getValueWidth(layoutProfile, value);
        var maxPosX = _this.sliderWidth - textWidth / 2;
        if(posX > maxPosX)
          posX = maxPosX;
        else if(posX < 0)
          posX = 0;

        //set handle position
        _this.handle.attr("cx", posX);
        _this.valueText.attr("transform", "translate(" + posX + "," + (_this.height / 2) + ")");
        _this.valueText.text(_this.format(value));
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
      _this._dragging = false;
      _this._blockUpdate = false;
      _this.element.classed(class_dragging, false);
      _this.model.time.pause();
      _this.model.time.snap();
      if (_this.model.time.dragging) {
      }
      _this.model.time.dragStop();
    };
  },

  /**
   * Gets brushed function to be executed when dragging
   * @returns {Function} brushed function
   */
  _getSpeedBrushed: function () {
    var _this = this;
    return function () {

      if (!_this._blockUpdate) {
        _this._optionClasses();
        _this._blockUpdate = true;
        _this.element.classed(class_dragging, true);
      }

      var value = _this.speed_brush.extent()[0];
      //set brushed properties
      if (d3.event.sourceEvent) {
        //_this.model.time.dragStart();
        var posX = utils.roundStep(Math.round(d3.mouse(this)[0]), precision);
        value = _this.xSpeedScale.invert(posX);

        var layoutProfile = _this.getLayoutProfile();
        var textWidth = _this.getValueWidth(layoutProfile, value);
        var maxPosX = _this.sliderWidth - textWidth / 2;
        if (posX > maxPosX)
          posX = maxPosX;
        else if (posX < 0)
          posX = 0;

        //set handle position
        _this.speed_handle.attr("cx", posX);
        _this.valueText.attr("transform", "translate(" + posX + "," + (_this.height / 2) + ")");
        _this.valueText.text(Math.round(value).toFixed(2));
      }
      //set time according to dragged position
      if (value - _this.model.time.speed.value !== 0) {
        _this._setSpeed(value);
      }
    };
  },

  /**
   * Gets brushedEnd function to be executed when dragging ends
   * @returns {Function} brushedEnd function
   */
  _getSpeedBrushedEnd: function () {
    var _this = this;
    return function () {
      _this._blockUpdate = false;
      _this.element.classed(class_dragging, false);
    };

  },

  /**
   * Sets the handle to the correct position
   * @param {Boolean} transition whether to use transition or not
   */
  _setHandle: function(transition) {
    var value = this.model.time.value;
    this.slide.call(this.brush.extent([value, value]));

    this.valueText.text(this.format(value));

    var old_pos = this.handle.attr("cx");
    var new_pos = this.xScale(value);

    if(old_pos == null) old_pos = new_pos;
    var speed = new_pos > old_pos ? this.model.time.speed : 0;


    if(transition) {
      this.handle.attr("cx", old_pos)
        .transition()
        .duration(speed)
        .ease("linear")
        .attr("cx", new_pos);
    } else {
      // issues: 445 & 456
      this.handle.transition()
        .duration(0)
        .attr("cx", new_pos);
      d3.timer.flush();
    }

    this.valueText.attr("transform", "translate(" + old_pos + "," + (this.height / 2) + ")")
      .transition()
      .duration(speed)
      .ease("linear")
      .attr("transform", "translate(" + new_pos + "," + (this.height / 2) + ")");
  },

  /**
   * Sets the handle to the correct position
   * @param {Boolean} transition whether to use transition or not
   */
  _setSpeedHandle: function (transition) {
    var value = Math.round(this.model.time.speed).toFixed(2);
    this.speed_slide.call(this.speed_brush.extent([value, value]));

    this.valueText.text(value);

    var old_pos = this.speed_handle.attr("cx");
    var new_pos = this.xSpeedScale(value);

    if(old_pos==null) old_pos = new_pos;
    var speed = new_pos > old_pos ? this.model.time.speed : 0;

    if (transition) {
      this.speed_handle.attr("cx", old_pos)
        .transition()
        .duration(speed)
        .ease("linear")
        .attr("cx", new_pos);
    }
    else {
      // issues: 445 & 456
      this.speed_handle.transition()
        .duration(0)
        .attr("cx", new_pos);
      d3.timer.flush();
    }

    this.valueText.attr("transform", "translate(" + old_pos + "," + (this.height / 2) + ")")
      .transition()
      .duration(speed)
      .ease("linear")
      .attr("transform", "translate(" + new_pos + "," + (this.height / 2) + ")");
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

    _this.model.time.value = time;
  },

    /**
   * Sets the current speed model to speed
   * @param {number} time The time
   */
  _setSpeed: function (speed) {
    //update state
    var _this = this;

    _this.model.time.speed = speed;
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
  },

  /*
   * Shows and hides Speed Slider
   */
  _toggleSpeedSlider: function () {
    //show/hide speed slider

    var speed_slider_outer = this.element.select(".vzb-ts-speed-slider").select("g");
    //default value
    speed_slider_outer.style("opacity", 0);

    speed_slider_outer.on("mouseover", function(){
        speed_slider_outer.style("opacity", 1);
    });
    speed_slider_outer.on("mouseout", function(){
        speed_slider_outer.style("opacity", 0);
    });
  }
});

export default TimeSlider;
