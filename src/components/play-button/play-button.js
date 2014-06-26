define([
    'jquery',
    'base/utils',
    'components/component',
], function($, utils, Component) {

    var container,
        play,
        pause,
        playing,
        playInterval;

    var PlayButton = Component.extend({
        init: function(parent, options) {
            this.template = "components/play-button/play-button";
            this._super(parent, options);
        },

        postRender: function() {
            var _this = this;
            container = utils.d3ToJquery(this.element);
            playing = false;

            play = container.find("#play-button-play"),
            pause = container.find("#play-button-pause");

            play.click(function() {
                _this.play();
            });

            pause.click(function() {
                _this.pause();
            });
        },

        play: function() {
            //return if already playing
            if(playing) return;

            container.addClass("playing");
            var _this = this,
                yearValue = this.model.getState("time"),
                range = this.model.getState("timeRange");
                
            playInterval = setInterval(function() {
                if (yearValue > range[1]) {
                    _this.pause();
                    return;
                } else {
                    _this.model.setState({
                        time: yearValue++
                    });
                }
            }, 200);
        },

        pause: function() {
            container.removeClass("playing");
            clearInterval(playInterval);
        }

    });

    return PlayButton;
});