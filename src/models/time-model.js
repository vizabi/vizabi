define([
    'underscore',
    'base/model'
], function(_, Model) {

    var playInterval,
        playing;

    var TimeModel = Model.extend({
        init: function(values) {

            //default values for time model
            values = _.extend({
                value: 50,
                start: 0,
                end: 100,
                show_playpause: true,
                playable: true,
                playing: false,
                step: 1,
                speed: 5
            }, values);

            this._super(values);
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
        },

        play: function(silent) {
            //don't play if it's not playable or if it's already playing
            if (!this.get("playable") || this.get("playing")) return;

            var _this = this,
                time = this.get("value"),
                interval = 100/this.get("speed");

            //go to start if we start from end point
            if(time === _this.get("end")) {
                time = this.get("start");
                _this.set("value", time);
            }

            //create interval
            this.set("playing", true);
            playInterval = setInterval(function() {
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

        pause: function(silent) {
            this.set("playing", false);
            clearInterval(playInterval);

            this.trigger("pause");
        },

    });

    return TimeModel;
});