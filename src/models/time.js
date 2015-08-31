/*!
 * VIZABI Time Model
 */

(function () {

  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;

  //do not create model if d3 is not defined
  if (!Vizabi._require('d3')) return;

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

  var time_units = Object.keys(time_formats);
  var formatters = utils.values(time_formats);

  Vizabi.Model.extend('time', {

    /**
     * Initializes the language model.
     * @param {Object} values The initial values of this model
     * @param parent A reference to the parent model
     * @param {Object} bind Initial events to bind
     */
    init: function (values, parent, bind) {

      this._type = "time";
      //default values for time model
      values = utils.extend({
        dim: "time",
        value: "1800",
        start: "1800",
        end: "2014",
        playable: true,
        playing: false,
        loop: false,
        round: 'floor',
        speed: 300,
        unit: "year",
        step: 1, //step must be integer
        adaptMinMaxZoom: false, //TODO: remove from here. only for bubble chart
        formatInput: "%Y", //defaults to year format
        xLogStops: [], //TODO: remove from here. only for mountain chart
        yMaxMethod: "latest", //TODO: remove from here. only for mountain chart
        record: false,
        dragging: false,
        povertyline: 0, //TODO: remove from here. only for mountain chart
        povertyCutoff: 0, //TODO: remove from here. only for mountain chart
        povertyFade: 1, //TODO: remove from here. only for mountain chart
        gdpFactor: 1, //TODO: remove from here. only for mountain chart
        gdpShift: 0, //TODO: remove from here. only for mountain chart
        xPoints: 50 //TODO: remove from here. only for mountain chart
      }, values);

      values.formatOutput = values.formatOutput || values.formatInput;

      //same constructor
      this._super(values, parent, bind);

      var _this = this;
      this._playing_now = false;

      //bing play method to model change
      this.on({
        "change:playing": function () {
          if (_this.playing === true) {
            _this._startPlaying();
          } else {
            _this._stopPlaying();
          }
        },
        "set": function () {
          //auto play if playing is true by reseting variable
          if (_this.playing === true) {
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
    _formatToDates: function () {

      var date_attr = ["value", "start", "end"];
      var fmts = [this.formatInput].concat(formatters);
      for (var i = 0; i < date_attr.length; i++) {
        var attr = date_attr[i];
        if (!utils.isDate(this[attr])) {
          for (var j = 0; j < fmts.length; j++) {
            var formatter = d3.time.format(fmts[j]);
            var date = formatter.parse(this[attr].toString());
            if (utils.isDate(date)) {
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
    validate: function () {

      //unit has to be one of the available_time_units
      if (time_units.indexOf(this.unit) === -1) {
        this.unit = "year";
      }

      if (this.step < 1) {
        this.step = "year";
      }

      //make sure dates are transformed into dates at all times
      if (!utils.isDate(this.start) || !utils.isDate(this.end) || !utils.isDate(this.value)) {
        this._formatToDates();
      }

      //end has to be >= than start
      if (this.end < this.start) {
        this.end = this.start;
      }
      //value has to be between start and end
      if (this.value < this.start) {
        this.value = this.start;
      } else if (this.value > this.end) {
        this.value = this.end;
      }

      if (this.playable === false && this.playing === true) {
        this.playing = false;
      }
    },

    /**
     * Plays time
     */
    play: function () {
      this.playing = true;
    },

    /**
     * Pauses time
     */
    pause: function () {
      this.playing = false;
    },
      
    /**
     * Indicates dragging of time
     */
    dragStart: function () {
      this.dragging = true;
    },
     dragStop: function () {
      this.dragging = false;
    },

    /**
     * gets time range
     * @returns range between start and end
     */
    getRange: function () {
      return d3.time[this.unit].range(this.start, this.end, this.step);
    },

    /**
     * Gets filter for time
     * @returns {Object} time filter
     */
    getFilter: function () {
      var start = d3.time.format(this.formatInput || "%Y")(this.start),
        end = d3.time.format(this.formatInput || "%Y")(this.end),
        dim = this.getDimension(),
        filter = {};
      filter[dim] = [[start, end]];
      return filter;
    },

    /**
     * Gets formatter for this model
     * @returns {Function} formatter function
     */
    getFormatter: function () {
      var f = d3.time.format(this.formatInput || "%Y");
      return function (d) {
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
    snap: function (what) {
      if (!this.round) return;
      if (what == null) what = "value";
      var op = 'round';
      if (this.round === 'ceil') op = 'ceil';
      if (this.round === 'floor') op = 'floor';
      var time = d3.time[this.unit][op](this[what]);

      this.set(what, time, true); //3rd argumennt forces update
    },

    /**
     * Starts playing the time, initializing the interval
     */
    _startPlaying: function () {
      //don't play if it's not playable or if it's already playing
      if (!this.playable || this._playing_now) return;

      this._playing_now = true;

      var _this = this,
        time = this.value,
        interval = this.speed; // * this.step;

      this.snap();

      //go to start if we start from end point
      if (_this.end - time <= 0) {
        time = this.start;
        _this.value = time;
      }

      //we don't create intervals directly
      this._intervals.setInterval('playInterval_' + this._id, function () {
        if (time >= _this.end) {
          if (_this.loop) {
            time = _this.start;
            _this.value = time
          } else {
            _this.playing = false;
          }
          return;
        } else {
          time = d3.time[_this.unit].offset(time, _this.step);
          _this.value = time;
        }
      }, interval);

      this.trigger("play");
    },

    /**
     * Stops playing the time, clearing the interval
     */
    _stopPlaying: function () {
      this._playing_now = false;
      this._intervals.clearInterval('playInterval_' + this._id);
      this.snap();
      this.trigger("pause");
    }

  });


}).call(this);
