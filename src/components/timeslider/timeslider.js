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


var presentationProfileChanges = {
  "small": {
    margin: {
    }
  },
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
      delay: "delay"
    }];

    var _this = this;

    //starts as splash if this is the option
    this._splash = config.ui.splash;

    //binds methods to this model
    this.model_binds = {
      'change:time': function(evt, original) {

        //TODO: readyOnce CANNOT be run twice
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
          if(!_this.model.time.dragging) _this._setHandle(_this.model.time.playing);
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

    //html elements for the delay_handle
    this.delay_handle = this.element.select(".vzb-ts-btns");
    //Scale
    this.xScale = d3.time.scale()
      .clamp(true);

    //Delay Scale
    this.delayScale = d3.scale.linear()
      .domain([0, 90])
      .range([this.model.time.delayStart, this.model.time.delayEnd]);

    //Axis
    this.xAxis = d3.svg.axis()
      .orient("bottom")
      .tickSize(0);
    //Value
    this.valueText.attr("text-anchor", "middle").attr("dy", "-1em");

    var brushed = _this._getBrushed(),
      brushedEnd = _this._getBrushedEnd();

    //drag the new delay handle
    var drag = d3.behavior.drag()
    .on("drag", function () {_this._dragDelay(this, _this);});

    this.delay_handle.call(drag);

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
    var delay = this.model.time.delay;

    play.on('click', function () {
      _this.model.time.play();
    });

    pause.on('click', function () {
      _this.model.time.pause("soft");
    });

    var fmt = time.formatOutput || time_formats[time.unit];
    this.format = d3.time.format(fmt);

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
      .tickFormat(this.format);
  },

  changeTime: function() {
    this.ui.format = this.model.time.unit;
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
    var value = this.model.time.value;
    this.slide.call(this.brush.extent([value, value]));

    this.valueText.text(this.format(value));

    var old_pos = this.handle.attr("cx");
    var new_pos = this.xScale(value);
    if(old_pos == null) old_pos = new_pos;
    var delayAnimations = new_pos > old_pos ? this.model.time.delayAnimations : 0;


    if(transition) {
      this.handle.attr("cx", old_pos)
        .transition()
        .duration(delayAnimations)
        .ease("linear")
        .attr("cx", new_pos);
    } else {
      this.handle
        .attr("cx", new_pos);
    }

    this.valueText.attr("transform", "translate(" + old_pos + "," + (this.height / 2) + ")")
      .transition()
      .duration(delayAnimations)
      .ease("linear")
      .attr("transform", "translate(" + new_pos + "," + (this.height / 2) + ")");
  },

  /**
 * Drag the delay handle
 * @param {DOM Object} HTML element, targeted by the event
 * @param {Object} timeslider object
 *
 */
  _dragDelay: function (target, timeslider) {
    var elementLeftMargin = 5;
    // origin point y=25px, x=30
    var element = d3.select(target);
    var elementWidth = element.node().getBoundingClientRect().width;
    var elementHeight = element.node().getBoundingClientRect().height;
    var ox = (elementWidth / 2) + elementLeftMargin;
    var oy = elementHeight/2;
    var mx = d3.event.x;
    var my = d3.event.y;
    var angle = timeslider._angleBetweenPoints([ox,oy], [mx,my]);
    // the normal angle for the arrow is 45 degrees
    var angle = timeslider._toDegrees(angle) + 45;
    var delay = 0;

    if (angle > 0 && angle < 90){
      //change handler angle
      element.selectAll(".vzb-ts-btn").style("transform","rotate("+angle+"deg)");
      //correct icon angle
      element.selectAll(".vzb-icon").style("transform","rotate("+ -angle +"deg)");
      delay = timeslider.delayScale(angle);
      timeslider._setDelay(delay);
    }
  },

  /**
   * Returns the angle in radians, given two points
   * @param {Array} Array element containing the origin point
   * @param {Array} Array element containing the target point
   * @returns {number} Angle in radians
   */
  _angleBetweenPoints: function (p1, p2) {
    if (p1[0] == p2[0] && p1[1] == p2[1]){
        return Math.PI / 2;
    } else {
        return Math.atan2(p2[1] - p1[1], p2[0] - p1[0] );
      }
  },

  /**
   * Returns the angle in degrees, given an angle in radians
   * @param {number} angle in radians
   * @returns {number} Angle in degrees
   */
  _toDegrees: function(rad) {
    return rad * (180/Math.PI);
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
   * Sets the current delay model to delay
   * @param {number} time The time
   */
  _setDelay: function (delay) {
    //update state
    var _this = this;

    _this.model.time.delay = delay;
    _this.model.time.delaySet = true;
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
