define([
    'lodash',
    'base/utils',
    'base/model'
], function(_, utils, Model) {

    var TimeModel = Model.extend({

        /**
         * Initializes the language model.
         * @param {Object} values The initial values of this model
         * @param intervals A parent intervals handler (from tool)
         * @param {Object} bind Initial events to bind
         */
        init: function(values, intervals, bind) {

            //default values for time model
            values = _.extend({
                value: 1800,
                start: 2014,
                end: 2014,
                step: 1,
                speed: 500,
                playable: true,
                playing: false,
                loop: false,
                roundOnPause: true
            }, values);

            //same constructor
            this._super(values, intervals, bind);

            var _this = this;
            this._playing_now = false;

            //bing play method to model change
            this.on("change:playing", function() {
                if (_this.playing === true) {
                    _this._startPlaying();
                } else {
                    _this._stopPlaying();
                }
            });

            //auto play if playing is true by reseting variable
            if (this.playing === true) {
                this.playing = true;
            }
        },

        /**
         * Validates the model
         * @param {boolean} silent Block triggering of events
         */
        validate: function(silent) {
            //don't cross validate everything
            var atomic = true;
            //end has to be >= than start
            if (this.end < this.start) {
                this.set('end', this.start, silent, atomic);
            }
            //value has to be between start and end
            if (this.value < this.start) {
                this.set('value', this.start, silent, atomic);
            } else if (this.value > this.end) {
                this.set('value', this.end, silent, atomic);
            }

            if (this.playable === false && this.playing === true) {
                this.set('playing', false, silent, atomic);
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
         * Starts playing the time, initializing the interval
         */
        _startPlaying: function() {
            //don't play if it's not playable or if it's already playing
            if (!this.playable || this._playing_now) return;

            this._playing_now = true;

            var _this = this,
                time = this.value,
                interval = this.speed * this.step;

            //go to start if we start from end point
            if (time === _this.end) {
                time = this.start;
                _this.value = time
            }

            //create interval

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
                    var decs = utils.countDecimals(_this.step)
                    time = time + _this.step;
                    time = +time.toFixed(decs);
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
            if(this.roundOnPause) {
                var op = 'floor';
                if(this.roundOnPause === 'ceil') op = 'ceil';
                if(this.roundOnPause === 'round') op = 'round';
                var time = this.value;
                time = Math[op](time);
                this.value = time;
            }

            this.trigger("pause");
        }

    });

    return TimeModel;
});
