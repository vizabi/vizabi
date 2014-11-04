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
                value: 50,
                start: 0,
                end: 100,
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
                if (_this.get("playing") === true) {
                    _this._startPlaying();
                } else {
                    _this._stopPlaying();
                }
            });

            //auto play if playing is true by reseting variable
            if (this.get("playing") === true) {
                this.set("playing", true);
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
            if (this.get('end') < this.get('start')) {
                this.set('end', this.get('start'), silent, atomic);
            }
            //value has to be between start and end
            if (this.get('value') < this.get('start')) {
                this.set('value', this.get('start'), silent, atomic);
            } else if (this.get('value') > this.get('end')) {
                this.set('value', this.get('end'), silent, atomic);
            }

            if (this.get('playable') === false && this.get('playing') === true) {
                this.set('playing', false, silent, atomic);
            }
        },

        /**
         * Plays time
         */
        play: function() {
            this.set("playing", true);
        },

        /**
         * Pauses time
         */
        pause: function() {
            this.set("playing", false);
        },

        /**
         * Starts playing the time, initializing the interval
         */
        _startPlaying: function() {
            //don't play if it's not playable or if it's already playing
            if (!this.get("playable") || this._playing_now) return;

            this._playing_now = true;

            var _this = this,
                time = this.get("value"),
                interval = this.get("speed") * this.get("step");

            //go to start if we start from end point
            if (time === _this.get("end")) {
                time = this.get("start");
                _this.set("value", time);
            }

            //create interval

            //we don't create intervals directly
            this._intervals.setInterval('playInterval_' + this._id, function() {
                if (time >= _this.get("end")) {
                    if (_this.get("loop")) {
                        time = _this.get("start");
                        _this.set("value", time);
                    } else {
                        _this.set("playing", false);
                    }
                    return;
                } else {
                    var decs = utils.countDecimals(_this.get("step"))
                    time = time + _this.get("step");
                    time = +time.toFixed(decs);
                    _this.set("value", time);
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
            if(this.get("roundOnPause")) {
                var op = 'floor';
                if(this.get("roundOnPause") === 'ceil') op = 'ceil';
                if(this.get("roundOnPause") === 'round') op = 'round';
                var time = this.get("value");
                time = Math[op](time);
                this.set("value", time);
            }

            this.trigger("pause");
        }

    });

    return TimeModel;
});