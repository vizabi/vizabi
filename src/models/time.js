import * as utils from 'base/utils';
import Model from 'base/model';

/*!
 * VIZABI Time Model
 */

var time_units = Object.keys(utils.timeFormats);

var TimeModel = Model.extend({

  /**
   * Default values for this model
   */
  _defaults: {
    dim: "time",
    value: "2015",
    start: "1800",
    end: "2015",
    playable: true,
    playing: false,
    loop: false,
    round: 'round',
    delay: 300,
    delayAnimations: 300,
    delayStart: 1200,
    delayEnd: 75,
    delayThresholdX2: 300,
    delayThresholdX4: 150,
    delaySet: false,
    unit: "year",
    step: 1, //step must be integer
    adaptMinMaxZoom: false, //TODO: remove from here. only for bubble chart
    xLogStops: [], //TODO: remove from here. only for mountain chart
    yMaxMethod: "latest", //TODO: remove from here. only for mountain chart
    record: false,
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
  init: function(name, values, parent, bind) {

    this._type = "time";
    //default values for time model
    var defaults = utils.deepClone(this._defaults);
    values = utils.extend(defaults, values);

    //same constructor
    this._super(name, values, parent, bind);

    var _this = this;
    this.dragging = false;
    this.postponePause = false;
    this.allSteps = {};

    //bing play method to model change
    this.on({

      "change:playing": function() {
        if(_this.playing === true) {
          _this._startPlaying();
        } else {
          _this._stopPlaying();
        }
      },

    });
  },

  /**
   * Formats value, start and end dates to actual Date objects
   */
  _formatToDates: function() {

    var date_attr = ["value", "start", "end"];
    for(var i = 0; i < date_attr.length; i++) {
      var attr = date_attr[i];
      if(!utils.isDate(this[attr])) {
        var date = utils.parseTime(this[attr].toString(), this.unit);
        this.set(attr, date);
      }
    }
  },

  /**
   * Validates the model
   */
  validate: function() {

    //unit has to be one of the available_time_units
    if(time_units.indexOf(this.unit) === -1) {
      utils.warn(this.unit + ' is not a valid time unit, using "year" instead.');
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
    this._startPlaying();
  },

  /**
   * Pauses time
   */
  pause: function(soft) {
    if(soft) {
      this.postponePause = true;
    } else {
      this.playing = false;
    }
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
    return d3.time[this.unit].utc.range(this.start, this.end, this.step);
  },

  /**
   * Gets filter for time
   * @param {Boolean} firstScreen get filter for current year only
   * @returns {Object} time filter
   */
  getFilter: function(firstScreen) {
    var start = utils.formatTime(this.start, this.unit);
    var end = utils.formatTime(this.end, this.unit);
    var value = utils.formatTime(this.value, this.unit);
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
  getParser: function() {
    var timeFormat = utils.getTimeFormat(this.unit);
    return function(d) {
      return timeFormat.parse(d);
    }
  },

  /**
   * Gets an array with all time steps for this model
   * @returns {Array} time array
   */
  getAllSteps: function() {
    var hash = "" + this.start + this.end + this.step;
    
    //return if cached
    if(this.allSteps[hash]) return this.allSteps[hash];
      
    this.allSteps[hash] = [];
    var curr = this.start;
    while(curr <= this.end) {
      this.allSteps[hash].push(curr);
      curr = d3.time[this.unit].utc.offset(curr, this.step);
    }
    return this.allSteps[hash];
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
    var time = d3.time[this.unit].utc[op](this[what]);
    this.set(what, time, true); //3rd argumennt forces update
  },

  /**
   * Starts playing the time, initializing the interval
   */
  _startPlaying: function() {
    //don't play if it's not playable
    if(!this.playable) return;

    var _this = this;
    var time = this.value;

    //go to start if we start from end point
    if(_this.end - time <= 0) {
      time = this.start;
      _this.value = time;
    } else {
      //the assumption is that the time is already snapped when we start playing
      //because only dragging the timeslider can un-snap the time, and it snaps on drag.end
      //so we don't need this line. let's see if we survive without.
      //as a consequence, the first time update in playing sequence will have this.playing flag up
      //so the bubble chart will zoom in smoothly. Closes #1213
      //this.snap();
    }
    this.playing = true;
    this.playInterval();

    this.trigger("play");
  },

  playInterval: function(){
    if(!this.playing) return;
    var _this = this;
    var time = this.value;
    this.delayAnimations = this.delay;
    if(this.delay < this.delayThresholdX2) this.delayAnimations*=2;
    if(this.delay < this.delayThresholdX4) this.delayAnimations*=2;

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

        _this._intervals.clearInterval('playInterval_' + _this._id);

        if(_this.postponePause || !_this.playing) {
          _this.playing = false;
          _this.postponePause = false;
          _this.getModelObject('value').set(_this.value, true, true /*force the change and make it persistent for URL and history*/);
        } else {
          var step = _this.step;
          if(_this.delay < _this.delayThresholdX2) step*=2;
          if(_this.delay < _this.delayThresholdX4) step*=2;
          time = d3.time[_this.unit].utc.offset(time, step);
          _this.getModelObject('value').set(time, null, false /*make change non-persistent for URL and history*/);
          _this.playInterval();
        }
      }
    }, this.delayAnimations);

  },

  /**
   * Stops playing the time, clearing the interval
   */
  _stopPlaying: function() {
    this._intervals.clearInterval('playInterval_' + this._id);
    //this.snap();
    this.trigger("pause");
  }

});

export default TimeModel;
