define([
    'jquery',
    'd3',
    'base/utils',
    'base/component',
], function($, d3, utils, Component) {

    var container,
        play,
        pause,
        tooltip,
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
            tooltip = container.find("#play-button-tooltip");

            play.click(function() {
                _this.play();
            });

            pause.click(function() {
                _this.pause();
            });

            this.events.bind('timeslider:dragging', function() {
                _this.pause();
            });

            this.update();
        },

        update: function() {

            var _this = this;
            play.hover(function() {
                tooltip.text(_this.getUIString("timeslider/play"));
                tooltip.addClass('visible');
            }, function() {
                tooltip.removeClass('visible');
            });

            pause.hover(function() {
                tooltip.text(_this.getUIString("timeslider/pause"));
                tooltip.addClass('visible');
            }, function() {
                tooltip.removeClass('visible');
            });

        },

        play: function() {
            //return if already playing
            if (playing) return;

            container.addClass("playing");
            var _this = this,
                yearValue = this.model.getState("time"),
                data = this.model.getData()[0][0],
                timeRange = this.model.getState("timeRange")[0].split("-"),
                countries = this.model.getState("show").geo,
                minYear = timeRange[0],
                maxYear = timeRange[1],
                filtered = data.filter(function(row) {
                    return (countries.indexOf(row.geo) >=0 && row.time >= minYear && row.time <= maxYear);
                });
                minValue = d3.min(filtered, function(d) {
                    return +d.time;
                }),
                maxValue = d3.max(filtered, function(d) {
                    return +d.time;
                });

            range = [minValue, maxValue];

            playInterval = setInterval(function() {
                if (yearValue > range[1]) {
                    _this.pause();
                    return;
                } else {
                    _this.model.setState({
                        time: yearValue++
                    });
                }
            }, 100);
        },

        pause: function() {
            container.removeClass("playing");
            clearInterval(playInterval);
        }

    });

    return PlayButton;
});