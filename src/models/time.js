import * as utils from 'base/utils';
import Model from 'base/model';

/*!
 * VIZABI Time Model
 */

//constant time formats
var time_formats = {
  "year": "%Y",
  "month": "%Y-%m",
  "week": "%Y-W%W",
  "day": "%Y-%m-%d",
  "hour": "%Y-%m-%d %H",
  "minute": "%Y-%m-%d %H:%M",
  "second": "%Y-%m-%d %H:%M:%S"
};

//constant delay thresholds
var delayThresholdX2 = 300;
var delayThresholdX4 = 150;

var time_units = Object.keys(time_formats);
var formatters = utils.values(time_formats);

var TimeModel = Model.extend({

  /**
   * Default values for this model
   */
  _defaults: {
    dim: "time",
    value: "1800",
    start: "1800",
    end: "2014",
    playable: true,
    playing: false,
    loop: false,
    round: 'floor',
    delay: 300,
    delayAnimations: 300,
    delayStart: 1000,
    delayEnd: 75,
    delaySet: false,
    unit: "year",
    step: 1, //step must be integer
    adaptMinMaxZoom: false, //TODO: remove from here. only for bubble chart
    formatInput: "%Y", //defaults to year format
    xLogStops: [], //TODO: remove from here. only for mountain chart
    yMaxMethod: "latest", //TODO: remove from here. only for mountain chart
    record: false,
    dragging: false,
    probeX: 0, //TODO: remove from here. only for mountain chart
    tailFatX: 1, //TODO: remove from here. only for mountain chart
    tailCutX: 0, //TODO: remove from here. only for mountain chart
    tailFade: 1, //TODO: remove from here. only for mountain chart
    xScaleFactor: 1, //TODO: remove from here. only for mountain chart
    xScaleShift: 0, //TODO: remove from here. only for mountain chart
    xPoints: 50 //TODO: remove from here. only for mountain chart
  },

  /**
   * Initializes the language model.
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init: function(values, parent, bind) {

    this._type = "time";
    //default values for time model
    var defaults = utils.deepClone(this._defaults);
    values = utils.extend(defaults, values);

    values.formatOutput = values.formatOutput || values.formatInput;

    //same constructor
    this._super(values, parent, bind);

    var _this = this;
    this._playing_now = false;

    //bing play method to model change
    this.on({
      "change:playing": function() {
        if(_this.playing === true) {
          _this._startPlaying();
        } else {
          _this._stopPlaying();
        }
      },
      "set": function() {
        //auto play if playing is true by reseting variable
        if(_this.playing === true) {
          _this.set('playing', true, true); //3rd argumennt forces update
        }

        this.snap("start");
        this.snap("end");
        this.snap("value");
      }
    });
  },

  /**
   * Formats value, start and end dates to actual Date objects
   */
  _formatToDates: function() {

    var date_attr = ["value", "start", "end"];
    var fmts = [this.formatInput].concat(formatters);
    for(var i = 0; i < date_attr.length; i++) {
      var attr = date_attr[i];
      if(!utils.isDate(this[attr])) {
        for(var j = 0; j < fmts.length; j++) {
          var formatter = d3.time.format(fmts[j]);
          var date = formatter.parse(this[attr].toString());
          if(utils.isDate(date)) {
            this.set(attr, date);
            break;
          }
        }
      }
    }
  },

  /**
   * Validates the model
   */
  validate: function() {

    //unit has to be one of the available_time_units
    if(time_units.indexOf(this.unit) === -1) {
      this.unit = "year";
    }

    if(this.step < 1) {
      this.step = "year";
    }

    //make sure dates are transformed into dates at all times
    if(!utils.isDate(this.start) || !utils.isDate(this.end) || !utils.isDate(this.value)) {
      this._formatToDates();
    }

    //end has to be >= than start
    if(this.end < this.start) {
      this.end = this.start;
    }
    //value has to be between start and end
    if(this.value < this.start) {
      this.value = this.start;
    } else if(this.value > this.end) {
      this.value = this.end;
    }

    if(this.playable === false && this.playing === true) {
      this.playing = false;
    }
  },

  /**
   * Plays time
   */
  play: function() {
    this.playing = true;
  },

  /**
   * Pauses time
   */
  pause: function() {
    this.playing = false;
  },

  /**
   * Indicates dragging of time
   */
  dragStart: function() {
    this.dragging = true;
  },
  dragStop: function() {
    this.dragging = false;
  },


  /**
   * gets time range
   * @returns range between start and end
   */
  getRange: function() {
    return d3.time[this.unit].range(this.start, this.end, this.step);
  },

  /**
   * Gets filter for time
   * @param {Boolean} firstScreen get filter for current year only
   * @returns {Object} time filter
   */
  getFilter: function(firstScreen) {
    var start = d3.time.format(this.formatInput || "%Y")(this.start);
    var end = d3.time.format(this.formatInput || "%Y")(this.end);
    var value = d3.time.format(this.formatInput || "%Y")(this.value);
    var dim = this.getDimension();
    var filter = {};

    filter[dim] = (firstScreen) ? [
      [value]
    ] : [
      [start, end]
    ];
    return filter;
  },

  /**
   * Gets formatter for this model
   * @returns {Function} formatter function
   */
  getFormatter: function() {
    var f = d3.time.format(this.formatInput || "%Y");
    return function(d) {
      return f.parse(d);
    }
  },

  /**
   * Gets an array with all time steps for this model
   * @returns {Array} time array
   */
  getAllSteps: function() {
    var arr = [];
    var curr = this.start;
    while(curr <= this.end) {
      arr.push(curr);
      curr = d3.time[this.unit].offset(curr, this.step);
    }
    return arr;
  },

  /**
   * Snaps the time to integer
   * possible inputs are "start", "end", "value". "value" is default
   */
  snap: function(what) {
    if(!this.round) return;
    if(what == null) what = "value";
    var op = 'round';
    if(this.round === 'ceil') op = 'ceil';
    if(this.round === 'floor') op = 'floor';
    var time = d3.time[this.unit][op](this[what]);

    this.set(what, time, true); //3rd argumennt forces update
  },

  /**
   * Starts playing the time, initializing the interval
   */
  _startPlaying: function() {
    //don't play if it's not playable or if it's already playing
    if(!this.playable || this._playing_now) return;

    this._playing_now = true;

    var _this = this;
    var time = this.value;

    this.snap();

    //go to start if we start from end point
    if(_this.end - time <= 0) {
      time = this.start;
      _this.value = time;
    }

    this.playInterval();

    this.trigger("play");
  },

  playInterval: function(){
    var _this = this;
    var time = this.value;
    this.delayAnimations = this.delay;
    if(this.delay < delayThresholdX2) this.delayAnimations*=2;
    if(this.delay < delayThresholdX4) this.delayAnimations*=2;

    this._intervals.setInterval('playInterval_' + this._id, function() {
      if(time >= _this.end) {
        if(_this.loop) {
          time = _this.start;
          _this.value = time
        } else {
          _this.playing = false;
        }
        return;
      } else {
        var step = _this.step;
        if(_this.delay < delayThresholdX2) step*=2;
        if(_this.delay < delayThresholdX4) step*=2;          
        time = d3.time[_this.unit].offset(time, step);
        _this.value = time;

        _this._intervals.clearInterval('playInterval_' + _this._id);
        _this.playInterval();
      }
    }, this.delayAnimations);

  },

  /**
   * Stops playing the time, clearing the interval
   */
  _stopPlaying: function() {
    this._playing_now = false;
    this._intervals.clearInterval('playInterval_' + this._id);
    this.snap();
    this.trigger("pause");
  }

});

export default TimeModel;
