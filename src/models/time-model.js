define([
    'underscore',
    'base/utils',
    'base/model'
], function(_, utils, Model) {

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
                speed: 500
            }, values);

            this._super(values, intervals);

            var _this = this;
            this.playing_now = false;

            //bing play method to model change
            this.on("change:playing", function() {
                if(_this.get("playing") === true) {
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
            //end has to be >= than start
            if(this.get('end') < this.get('start')) {
                this.set('end', this.get('start'), silent, atomic);
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

        play: function() {
            this.set("playing", true);
        },

        pause: function() {
            this.set("playing", false);
        },

        _startPlaying: function() {
            //don't play if it's not playable or if it's already playing
            if (!this.get("playable") || this.playing_now) return;

            this.playing_now = true;

            var _this = this,
                time = this.get("value"),
                interval = this.get("speed") * this.get("step");

            //go to start if we start from end point
            if(time === _this.get("end")) {
                time = this.get("start");
                _this.set("value", time);
            }

            //create interval

            //we don't create intervals directly
            this.intervals.setInterval('playInterval_'+this._id, function() {
                if (time >= _this.get("end")) {
                    _this.set("playing", false);
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

        _stopPlaying: function() {
            this.playing_now = false;
            this.intervals.clearInterval('playInterval_'+this._id);
            this.trigger("pause");
        }

    });

    return TimeModel;
});