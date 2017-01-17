import * as utils from 'base/utils';
import DataConnected from 'models/dataconnected';

/*!
 * VIZABI Time Model
 */

// short-cut for developers to get UTC date strings
// not meant to be used in code!!!
Date.prototype.utc = Date.prototype.toUTCString;

/*
 * Time formats for internal data
 * all in UTC
 */
var formats = {
  'year':    { data: d3.time.format.utc('%Y'),            ui: d3.time.format.utc('%Y') },
  'month':   { data: d3.time.format.utc('%Y-%m'),         ui: d3.time.format.utc('%b %Y') }, // month needs separator according to ISO to not confuse YYYYMM with YYMMDD
  'day':     { data: d3.time.format.utc('%Y%m%d'),        ui: d3.time.format.utc('%c') },
  'hour':    { data: d3.time.format.utc("%Y%m%dT%H"),     ui: d3.time.format.utc('%b %d %Y, %H') },
  'minute':  { data: d3.time.format.utc("%Y%m%dT%H%M"),   ui: d3.time.format.utc('%b %d %Y, %H:%M') },
  'second':  { data: d3.time.format.utc("%Y%m%dT%H%M%S"), ui: d3.time.format.utc('%b %d %Y, %H:%M:%S') },
  'week':    { data: weekFormat(),    ui: weekFormat() },   // %Yw%W d3 week format does not comply with ISO
  'quarter': { data: quarterFormat(), ui: quarterFormat() } // %Yq%Q d3 does not support quarters
};

var TimeModel = DataConnected.extend({

  objectLeafs: ['autogenerate'],

  /**
   * Default values for this model
   */
  getClassDefaults: function() {
    var defaults = {
      dim: null,
      value: null,
      start: null,
      end: null,
      startOrigin: null,
      endOrigin: null,
      startSelected: null,
      endSelected: null,
      playable: true,
      playing: false,
      loop: false,
      round: 'round',
      delay: 150, //delay between animation frames
      delayThresholdX2: 90, //delay X2 boundary: if less -- then every other frame will be dropped and animation dely will be double the value
      delayThresholdX4: 45, //delay X4 boundary: if less -- then 3/4 frame will be dropped and animation dely will be 4x the value
      unit: "year",
      format: { data: null, ui: null }, // overwrite of default formats
      step: 1, //step must be integer, and expressed in units
      immediatePlay: true,
      record: false
    };
    return utils.deepExtend(this._super(), defaults);
  },

  dataConnectedChildren: ['startOrigin', 'endOrigin', 'dim'],

  /**
   * Initializes the locale model.
   * @param {String} name
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init: function(name, values, parent, bind) {
    this._type = "time";

    //same constructor
    this._super(name, values, parent, bind);
    var _this = this;
    this.initFormatters();
    this.dragging = false;
    this.postponePause = false;
    this.allSteps = {};
    this.delayAnimations = this.delay;

    //bing play method to model change
    this.on({

      "change:playing": function() {
        if(_this.playing === true) {
          _this._startPlaying();
        } else {
          _this._stopPlaying();
        }
      },

      "change:format": function() {
        _this.initFormatters();
      }

    });
  },

  initFormatters: function() {
    if (formats[this.unit]) {
      this.formatters = formats[this.unit];
    }
    // specifically set formats overwrite unit defaults
    if (typeof this.format == 'string') {
      this.formatters.data = this.formatters.ui = d3.time.format.utc(this.format);
    } else {
      if (this.format.data) {
        this.formatters.data = d3.time.format.utc(this.format.data);
      }
      if (this.format.ui) {
        this.formatters.ui = d3.time.format.utc(this.format.ui);
      }
    }
    this.validateFormatting();
  },

  afterPreload: function() {
    if (this.dim == null && this.autogenerate) {
      var dataSource = this.getClosestModel(this.autogenerate.data);
      this.dim = dataSource.getConceptByIndex(this.autogenerate.conceptIndex, this.autogenerate.conceptType).concept;
    }
  },

  /**
   * Formats value, start and end dates to actual Date objects
   */
  _formatToDates: function() {
    var persistentValues = ["value"];
    var date_attr = ["value", "start", "end", "startSelected", "endSelected"];
    for(var i = 0; i < date_attr.length; i++) {
      var attr = date_attr[i];
      if(!utils.isDate(this[attr])) {
        var date = this.parse(this[attr]);
        this.set(attr, date, null, (persistentValues.indexOf(attr) !== -1));
      }
    }
  },

  /*
   * Formatting and parsing functions
   * @param {Date} dateObject
   * @param {String} type Either data or ui.
   * @returns {String}
   */
  formatDate: function(dateObject, type = 'data') {
    if (['data','ui'].indexOf(type) === -1) {
      utils.warn('Time.formatDate type parameter (' + type + ') invalid. Using "data".');
      type = data;
    }
    if (dateObject == null) return null;
    return this.formatters[type](dateObject);
  },
  /* parse to predefined unit */
  parse: function(timeString, type = 'data') {
    if (timeString == null) return null;
    return this.formatters[type].parse(timeString.toString());
  },

  /* auto-determines unit from timestring */
  findFormat: function(timeString) {
    var keys = Object.keys(formats), i = 0;
    for (; i < keys.length; i++) {
      var dateObject = formats[keys[i]].data.parse(timeString);
      if (dateObject) return { unit: keys[i], time: dateObject, type: 'data' };
      var dateObject = formats[keys[i]].ui.parse(timeString);
      if (dateObject) return { unit: keys[i], time: dateObject, type: 'ui' };
    }
    return null;
  },


  /**
   * Validates the model
   */
  validate: function() {

    //check if time start and end are not defined but start and end origins are defined
    if(this.start == null && this.startOrigin) this.set("start", this.startOrigin, null, false);
    if(this.end == null && this.endOrigin) this.set("end", this.endOrigin, null, false);

    if (this.formatters) {
      this.validateFormatting();
    }

    //unit has to be one of the available_time_units
    if(!formats[this.unit]) {
      utils.warn(this.unit + ' is not a valid time unit, using "year" instead.');
      this.unit = "year";
    }

    if(this.step < 1) {
      this.step = 1;
    }

    //end has to be >= than start
    if(this.end < this.start && this.start != null) {
      this.set("end", new Date(this.start), null, false);
    }

    if(this.value < this.startSelected && this.startSelected != null) {
      this.value = new Date(this.startSelected);
    }

    if(this.value > this.endSelected && this.endSelected != null) {
      this.value = new Date(this.endSelected);
    }
    if (this.splash === false) {
      if(this.startSelected < this.start && this.start != null) {
        this.set({startSelected: new Date(this.start)}, null, false /*make change non-persistent for URL and history*/);
      }

      if(this.endSelected > this.end && this.end != null) {
        this.set({endSelected: new Date(this.end)}, null, false /*make change non-persistent for URL and history*/);
      }
    }

    //value has to be between start and end
    if(this.value < this.start && this.start != null) {
      this.value = new Date(this.start);
    } else if(this.value > this.end && this.end != null) {
      this.value = new Date(this.end);
    }

    if(this.playable === false && this.playing === true) {
      this.set("playing", false, null, false);
    }
  },

  validateFormatting: function() {
    // default to current date. Other option: newTime['start'] || newTime['end'] || time.start || time.end;
    if(this.value == null) this.set("value", this.parse(this.formatDate(new Date())), null, false);

    //make sure dates are transformed into dates at all times
    if(!utils.isDate(this.start) || !utils.isDate(this.end) || !utils.isDate(this.value)
      || !utils.isDate(this.startSelected) || !utils.isDate(this.endSelected)) {
      this._formatToDates();
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
      this.set("playing", false, null, false);
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
    var is = this.getIntervalAndStep();
    return d3.time[is.interval].utc.range(this.start, this.end, is.step);
  },

  /**
   * gets the d3 interval and stepsize for d3 time interval methods
   * D3's week-interval starts on sunday and d3 does not support a quarter interval
   **/
  getIntervalAndStep: function() {
    var d3Interval, step;
    switch (this.unit) {
      case 'week': d3Interval = 'monday'; step = this.step; break;
      case 'quarter': d3Interval = 'month'; step = this.step*3; break;
      default: d3Interval = this.unit; step = this.step; break;
    }
    return { interval: d3Interval, step: step };
  },

  /**
   * Gets filter for time
   * @param {Boolean} splash: get filter for current year only
   * @returns {Object} time filter
   */
  getFilter: function(splash) {
    var defaultStart = this.parse(this.startOrigin);
    var defaultEnd = this.parse(this.endOrigin);

    var dim = this.getDimension();
    var filter = null;

    if (splash) {
      if (this.value != null) {
        filter = {};
        filter[dim] = this.formatters.data(this.value);
      }
    } else {
      var gte, lte;
      if (defaultStart != null) {
        gte = this.formatters.data(defaultStart);
      }
      if (defaultEnd != null) {
        lte = this.formatters.data(defaultEnd);
      }
      if (gte || lte) {
        filter = {};
        filter[dim] = {};
        if (gte) filter[dim]["$gte"] = gte;
        if (lte) filter[dim]["$lte"] = lte;
      }
    }
    return filter;
  },

  /**
   * Gets parser for this model
   * @returns {Function} parser function
   */
  getParser: function(type = 'data') {
    return this.formatters[type].parse;
  },

  /**
  * Gets formatter for this model
  * @returns {Function} formatter function
  */
  getFormatter: function(type = 'data') {
    return this.formatters[type];
  },

  /**
   * Gets an array with all time steps for this model
   * @returns {Array} time array
   */
  getAllSteps: function() {
    if(!this.start || !this.end) {
      utils.warn("getAllSteps(): invalid start/end time is detected: " + this.start + ", " + this.end);
      return [];
    }
    var hash = "" + this.start + this.end + this.step;

    //return if cached
    if(this.allSteps[hash]) return this.allSteps[hash];

    this.allSteps[hash] = [];
    var curr = this.start;
    while(curr <= this.end) {
      var is = this.getIntervalAndStep();
      this.allSteps[hash].push(curr);
      curr = d3.time[is.interval].utc.offset(curr, is.step);
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
    var is = this.getIntervalAndStep();
    var time = d3.time[is.interval].utc[op](this[what]);
    this.set(what, time, true); //3rd argumennt forces update
  },

  /**
   * Starts playing the time, initializing the interval
   */
  _startPlaying: function() {
    //don't play if it's not playable
    if(!this.playable) return;

    var _this = this;

    //go to start if we start from end point
    if(this.value >= this.endSelected) {
      _this.getModelObject('value').set(_this.startSelected, null, false /*make change non-persistent for URL and history*/);
    } else {
      //the assumption is that the time is already snapped when we start playing
      //because only dragging the timeslider can un-snap the time, and it snaps on drag.end
      //so we don't need this line. let's see if we survive without.
      //as a consequence, the first time update in playing sequence will have this.playing flag up
      //so the bubble chart will zoom in smoothly. Closes #1213
      //this.snap();
    }
    this.set("playing", true, null, false);
    this.playInterval(this.immediatePlay);

    this.trigger("play");
  },

  playInterval: function(immediatePlay){
    if(!this.playing) return;
    var _this = this;
    this.delayAnimations = this.delay;
    if(this.delay < this.delayThresholdX2) this.delayAnimations*=2;
    if(this.delay < this.delayThresholdX4) this.delayAnimations*=2;

    var delayAnimations = immediatePlay ? 1 : this.delayAnimations;

    this._intervals.setInterval('playInterval_' + this._id, function() {
      // when time is playing and it reached the end
      if(_this.value >= _this.endSelected) {
        // if looping
        if(_this.loop) {
          // reset time to start, silently
          _this.getModelObject('value').set(_this.startSelected, null, false /*make change non-persistent for URL and history*/);
        } else {
          _this.set("playing", false, null, false);
        }
        return;
      } else {

        _this._intervals.clearInterval('playInterval_' + _this._id);

        if(_this.postponePause || !_this.playing) {
          _this.set("playing", false, null, false);
          _this.postponePause = false;
          _this.getModelObject('value').set(_this.value, true, true /*force the change and make it persistent for URL and history*/);
        } else {
          var is = _this.getIntervalAndStep();
          if(_this.delay < _this.delayThresholdX2) is.step*=2;
          if(_this.delay < _this.delayThresholdX4) is.step*=2;
          var time = d3.time[is.interval].utc.offset(_this.value, is.step);
          if(time >= _this.endSelected) {
            // if no playing needed anymore then make the last update persistent and not overshooting
            _this.getModelObject('value').set(_this.endSelected, null, true /*force the change and make it persistent for URL and history*/);
          }else{
            _this.getModelObject('value').set(time, null, false /*make change non-persistent for URL and history*/);
          }
          _this.playInterval();
        }
      }
    }, delayAnimations);

  },

  incrementTime: function(time) {
    var is = this.getIntervalAndStep();
    return d3.time[is.interval].utc.offset(time, is.step);
  },

  decrementTime: function(time) {
    var is = this.getIntervalAndStep();
    return d3.time[is.interval].utc.offset(time, -is.step);
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

/*
 * Week Format to format and parse dates
 * Conforms with ISO8601
 * Follows format: YYYYwWW: 2015w04, 3845w34, 0020w53
 */
function weekFormat() {

  var format = function(d) {
    return formatWeekYear(d) + 'w' + formatWeek(d);
  }

  format.parse = function parse(dateString) {
    var matchedDate = dateString.match(/^(\d{4})w(\d{2})$/);
    return matchedDate ? getDateFromWeek(matchedDate[1], matchedDate[2]): null;
  };

  var formatWeekYear = function(d) {
      var origin = +d;
      return new Date(origin + ((4 - (d.getUTCDay() || 7)) * 86400000)).getUTCFullYear();
  };

  var formatWeek = function(d) {
    var origin = +d;
    var quote = new Date(origin + ((4 - (d.getUTCDay() || 7)) * 86400000))
    var week = Math.ceil(((quote.getTime() - quote.setUTCMonth(0, 1)) / 86400000 + 1) / 7);
    return week < 10 ? '0' + week : week;
  };

  var getDateFromWeek = function(p1, p2) {
    var week = parseInt(p2);
    var year = p1;
    var startDateOfYear = new Date(); // always 4th of January (according to standard ISO 8601)
    startDateOfYear.setUTCFullYear(year);
    startDateOfYear.setUTCMonth(0);
    startDateOfYear.setUTCDate(4);
    var startDayOfWeek = startDateOfYear.getUTCDay() || 7;
    var dayOfWeek = 1; // Monday === 1
    var dayOfYear = week * 7 + dayOfWeek - (startDayOfWeek + 4);

    var date = formats['year'].parse(year);
    date = new Date(date.getTime() + dayOfYear * 24 * 60 * 60 * 1000);

    return date;
  }

  return format;

};

/*
 * Quarter Format to format and parse quarter dates
 * A quarter is the month%3
 * Follows format: YYYYqQ: 2015q4, 5847q1, 0040q2
 */
function quarterFormat() {

  var format = function(d) {
    return formats['year'](d) + 'q' + formatQuarter(d)
  }

  format.parse = function(dateString) {
    var matchedDate = dateString.match(/^(\d{4})q(\d)$/);
    return matchedDate ? getDateFromQuarter(matchedDate[1], matchedDate[2]): null;
  }

  var formatQuarter = function(d) {
    return ((d.getUTCMonth() / 3) | 0) + 1;
  };

  var getDateFromQuarter = function(p1, p2) {
    var quarter = parseInt(p2);
    var month = 3 * quarter - 2; // first month in quarter
    var year = p1;
    return formats['month'].parse([year, (month < 9 ? '0': '') + month].join(''));
  }

  return format;
}

export default TimeModel;
