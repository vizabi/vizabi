define([
    'underscore',
    'base/model'
], function(_, Model) {

    var playing_now;

    var TimeModel = Model.extend({

        //receive intervals as well
        init: function(values, intervals) {

            //default values for time model
            values = _.extend({
                value: 50,
                start: 0,
                end: 100,
                playable: true,
                playing: false,
                step: 1,
                speed: 1
            }, values);

            this._super(values, intervals);

            var _this = this;
            //bing play method to model change
            this.on("change:playing", function() {
                if(_this.get("playing")) {
                    _this._startPlaying();
                }
                else {
                    _this._stopPlaying();
                }
            });

            //auto play if playing is true by reseting variable
            if(this.get("playing") === true) {
                this.set("playing", true);
            }
        },

        validate: function(silent) {
            //don't cross validate everything
            var atomic = true;
            //end has to be bigger than start
            if(this.get('end') < this.get('start')) {
                var temp = this.get('start');
                this.set('start', this.get('end'), silent, atomic);
                this.set('end', temp, silent, atomic);
            }

            //value has to be between start and end
            if(this.get('value') < this.get('start')) {
                this.set('value', this.get('start'), silent, atomic);
            }
            else if(this.get('value') > this.get('end')) {
                this.set('value', this.get('end'), silent, atomic);
            }

            if(this.get('playable') === false && this.get('playing') === true) {
                this.set('playing', false, silent, atomic);
            }
        },

        play: function(silent) {
            //don't play if it's not playable or if it's already playing
            if (!this.get("playable") || playing_now) return;
            this.set("playing", true);
        },

        pause: function(silent) {
            this.set("playing", false);
        },

        _startPlaying: function() {
            //don't play if it's not playable or if it's already playing
            if (!this.get("playable") || playing_now) return;

            var _this = this,
                time = this.get("value"),
                interval = 100/this.get("speed");

            //go to start if we start from end point
            if(time === _this.get("end")) {
                time = this.get("start");
                _this.set("value", time);
            }

            //create interval
            playing_now = true;

            //we don't create intervals directly
            this.intervals.setInterval('playInterval_'+this._id, function() {
                if (time >= _this.get("end")) {
                    _this.pause();
                    return;
                } else {
                    time = time + _this.get("step");
                    _this.set("value", time);
                }
            }, interval);

            this.trigger("play");
        },

        _stopPlaying: function() {
            this.intervals.clearInterval('playInterval_'+this._id);
            playing_now = false;
            this.trigger("pause");
        }

    });

    return TimeModel;
});