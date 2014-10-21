define([
    'jquery',
    'd3',
    'base/utils',
    'base/component',
    'models/time-model'
], function($, d3, utils, Component, TimeModel) {

    var container,
        timeslider,
        range,
        value,
        data,
        minValue,
        maxValue,
        hidePlayButton,
        step;

    var class_playing = "vzb-playing",
        class_hide_play = "vzb-hide-play-button";


    var TimeTimeslider = Component.extend({
        init: function(parent, options) {
            this.template = "components/_gapminder/timeslider/timeslider";
            hidePlayButton = options.hidePlayButton || false;
            step = options.step || 1;

            if(!options.model) options.model = new TimeModel();

            // Same constructor as the superclass
            this._super(parent, options);
        },

        postRender: function() {
            var _this = this;

            /* 
             * html elements
             */
            container = utils.d3ToJquery(this.element);
            range = container.find(".vzb-ts-slider");
            value = container.find('.vzb-ts-slider-value');
            play = container.find(".vzb-ts-btn-play"),
            pause = container.find(".vzb-ts-btn-pause");

            /* 
             * model and related events
             */

            range.on('input', function(){
                _this._setTime(parseFloat(this.value));
                _this.model.pause();
            });

            //play action
            play.click(function() {
                _this.model.play();
            });
            this.model.on("play", function() {
                container.addClass(class_playing);
            });

            //pause action
            pause.click(function() {
                _this.model.pause();
            });
            this.model.on("pause", function() {
                container.removeClass(class_playing);
            });

            this.update();
        },


        resize: function() {
            if (!this.model.get("showPlayPause")) {
                container.addClass(class_hide_play);
            }
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