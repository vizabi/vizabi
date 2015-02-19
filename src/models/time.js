define([
    'lodash',
    'd3',
    'base/utils',
    'base/model'
], function(_, d3, utils, Model) {

    //constant time formats
    var time_formats = {
        "year": d3.time.format("%Y"),
        "month": d3.time.format("%Y-%m"),
        "week": d3.time.format("%Y-W%W"),
        "day": d3.time.format("%Y-%m-%d"),
        "hour": d3.time.format("%Y-%m-%d %H"),
        "minute": d3.time.format("%Y-%m-%d %H:%M"),
        "second": d3.time.format("%Y-%m-%d %H:%M:%S")
    };

    var time_units = _.keys(time_formats),
        formatters = _.values(time_formats);

    var TimeModel = Model.extend({

        /**
         * Initializes the language model.
         * @param {Object} values The initial values of this model
         * @param parent A reference to the parent model
         * @param {Object} bind Initial events to bind
         */
        init: function(values, parent, bind) {

            this._type = "time";
            //default values for time model
            values = _.extend({
                value: "1800",
                start: "1800",
                end: "2014",
                playable: true,
                playing: false,
                loop: false,
                roundOnPause: true,
                speed: 500,
                unit: "year", //defaults to year
                step: 1 //step must be integer
            }, values);

            //same constructor
            this._super(values, parent, bind);

            var _this = this;
            this._playing_now = false;

            //bing play method to model change
            this.on({
                "change:playing": function() {
                    if (_this.playing === true) {
                        _this._startPlaying();
                    } else {
                        _this._stopPlaying();
                    }
                },
                "set": function() {
                    //auto play if playing is true by reseting variable
                    if (_this.playing === true) {
                        _this.set('playing', true, true); //3rd argumennt forces update
                    }

                    //snap values
                    if (_this.roundOnPause) {
                        var op = 'round';
                        if (_this.roundOnPause === 'ceil') op = 'ceil';
                        if (_this.roundOnPause === 'floor') op = 'floor';
                        var start = d3.time[_this.unit][op](new Date(_this.start)),
                            end = d3.time[_this.unit][op](new Date(_this.end)),
                            time = d3.time[_this.unit][op](new Date(_this.value));
                        _this.start = start;
                        _this.end = end;
                        _this.value = time;
                    }
                }
            });
        },

        /**
         * Formats value, start and end dates to actual Date objects
         */
        _formatToDates: function(silent) {

            var date_attr = ["value", "start", "end"];
            for (var i = 0; i < date_attr.length; i++) {
                var attr = date_attr[i];
                if (!_.isDate(this[attr])) {
                    for (var j = 0; j < formatters.length; j++) {
                        var formatter = formatters[j];
                        var date = formatter.parse(this[attr].toString());
                        if (_.isDate(date)) {
                            this.set(attr, date);
                            break;
                        }
                    };
                }
            };
        },

        /**
         * Validates the model
         * @param {boolean} silent Block triggering of events
         */
        validate: function() {

            //unit has to be one of the available_time_units
            if (time_units.indexOf(this.unit) === -1) {
                this.unit = "year";
            }

            if (this.step < 1) {
                this.step = "year";
            }

            //make sure dates are transformed into dates at all times
            if (!_.isDate(this.start) || !_.isDate(this.end) || !_.isDate(this.value)) {
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
         * gets time range
         * @returns range between start and end
         */
        getRange: function() {
            return d3.time[this.unit].range(this.start, this.end, this.step);
        },

        /**
         * Gets the dimensions in time
         * @returns {String} time dimension
         */
        getDimension: function() {
            return "time";
        },

        /**
         * Gets filter for time
         * @returns {Object} time filter
         */
        getFilter: function() {
            var start = d3.time.format(this.format || "%Y")(this.start),
                end = d3.time.format(this.format || "%Y")(this.end),
                filter = {
                    "time": [
                        [start, end]
                    ]
                };
            return filter;
        },

        /**
         * gets formatted value
         * @param {String} f Optional format. Defaults to YYYY
         * @param {String} attr Optional attribute. Defaults to "value"
         * @returns {String} formatted value
         */
        getFormatted: function(f, attr) {
            if (!f) f = "%Y";
            if (!attr) attr = "value";

            var format = d3.time.format(f);
            return format(this[attr]);
        },

        /**
         * Starts playing the time, initializing the interval
         */
        _startPlaying: function() {
            //don't play if it's not playable or if it's already playing
            if (!this.playable || this._playing_now) return;

            this._playing_now = true;

            var _this = this,
                time = this.value,
                interval = this.speed; // * this.step;

            //go to start if we start from end point
            if (_this.end - time <= 0) {
                time = this.start;
                _this.value = time;
            }

            //we don't create intervals directly
            this._intervals.setInterval('playInterval_' + this._id, function() {
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
        _stopPlaying: function() {
            this._playing_now = false;
            this._intervals.clearInterval('playInterval_' + this._id);

            //snap to integer
            if (this.roundOnPause) {
                var op = 'round';
                if (this.roundOnPause === 'ceil') op = 'ceil';
                if (this.roundOnPause === 'floor') op = 'floor';
                var time = d3.time[this.unit][op](this.value);
                this.value = time;
            }

            this.trigger("pause");
        }

    });

    return TimeModel;
});