define([
    'jquery',
    'd3',
    'base/utils',
    'base/component',
    'jqueryui_slider'
], function($, d3, utils, Component) {

    var container,
        timeslider,
        range,
        value,
        data,
        minValue,
        maxValue,
        playing,
        playInterval,
        hidePlayButton,
        step;

    var class_playing = "vzb-playing",
        class_hide_play = "vzb-hide-play-button";


    var TimeTimeslider = Component.extend({
        init: function(parent, options) {
            this.template = "components/_gapminder/timeslider/timeslider";
            hidePlayButton = options.hidePlayButton || false;
            step = options.step || 1;

            // Same constructor as the superclass
            this._super(parent, options);
        },

        postRender: function() {
            var _this = this;
            playing = false;

            container = utils.d3ToJquery(this.element);

            range = container.find(".vzb-ts-slider");
            value = container.find('.vzb-ts-slider-value');
            play = container.find(".vzb-ts-btn-play"),
            pause = container.find(".vzb-ts-btn-pause");

            range.on('input', function(){
                _this._setTime(parseFloat(this.value));
            });

            play.click(function() {
                _this._play();
            });

            pause.click(function() {
                _this._pause();
            });

            this.update();
        },


        resize: function() {
            if (hidePlayButton == true) container.addClass(class_hide_play);
            this.update();
        },

        update: function() {
            //time slider should always receive a time model
            var time = this.model.get("value"),
                minValue = this.model.get("start")
                maxValue = this.model.get("end")
                step = this.model.get("step");
            
            range.attr("min", minValue)
                 .attr("max", maxValue)
                 .attr("step", step)
                 .val(time);        

            value.html(time);
            this._setTimePosition();
        },

        _setTime: function(time, silent) {
            //update state
            this.model.set("value", time, silent);
            this.update();
        },

       _play: function() {
            //return if already playing
            if (playing) return;

            container.addClass(class_playing);

            var _this = this,
                year = this.model.get("value");
                
            playInterval = setInterval(function() {
                if (year >= maxValue) {
                    _this._pause();
                    return;
                } else {
                    year = year + step;
                    _this._setTime(year);
                }
            }, 100);
        },

        _pause: function() {
            container.removeClass(class_playing);
            clearInterval(playInterval);
        },

        _setTimePosition: function () {
            var inputWidth = range.width() - 16,
                timeRange = this.model.get("end") - this.model.get("start"),
                currTime = this.model.get("value") - this.model.get("start"),
                newPosition = Math.round(inputWidth * currTime / timeRange) + 10;
                
            value.css("left", newPosition + "px");
        }
    });

    return TimeTimeslider;
});