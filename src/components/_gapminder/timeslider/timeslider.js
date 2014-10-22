define([
    'jquery',
    'd3',
    'base/utils',
    'base/component',
    'models/time-model'
], function($, d3, utils, Component, TimeModel) {

    //contants
    var class_playing = "vzb-playing",
        class_hide_play = "vzb-ts-hide-play-button";


    var Timeslider = Component.extend({
        init: function(parent, options) {
            this.template = "components/_gapminder/timeslider/timeslider";

            if(!options.model) options.model = new TimeModel();

            // Same constructor as the superclass
            this._super(parent, options);
        },

        postRender: function() {
            var _this = this;

            /* 
             * html elements
             */
            this.container = utils.d3ToJquery(this.element);
            this.range = this.container.find(".vzb-ts-slider");
            this.value = this.container.find('.vzb-ts-slider-value');

            var play = this.container.find(".vzb-ts-btn-play"),
                pause = this.container.find(".vzb-ts-btn-pause");

            /* 
             * model and related events
             */

            this.range.on('input', function(){
                _this._setTime(parseFloat(this.value));
                _this.model.pause();
            });

            //play action
            play.click(function() {
                _this.model.play();
            });
            this.model.on("play", function() {
                _this.container.addClass(class_playing);
            });

            //pause action
            pause.click(function() {
                _this.model.pause();
            });
            this.model.on("pause", function() {
                _this.container.removeClass(class_playing);
            });

            this.update();
        },


        resize: function() {
            //
        },

        update: function() {
            //time slider should always receive a time model
            var time = this.model.get("value"),
                minValue = this.model.get("start")
                maxValue = this.model.get("end")
                step = this.model.get("step");
            
            this.range.attr("min", minValue)
                 .attr("max", maxValue)
                 .attr("step", step)
                 .val(time);        

            if (!this.model.get("playable")) {
                this.container.addClass(class_hide_play);
            } else {
                this.container.removeClass(class_hide_play);
            }

            this.value.html(time);
            this._setTimePosition();
        },

        _setTime: function(time, silent) {
            //update state
            this.model.set("value", time, silent);
            this.update();
        },

        _setTimePosition: function () {
            var inputWidth = this.range.width() - 16,
                timeRange = this.model.get("end") - this.model.get("start"),
                currTime = this.model.get("value") - this.model.get("start"),
                newPosition = Math.round(inputWidth * currTime / timeRange) + 10;
                
            this.value.css("left", newPosition + "px");
        }
    });

    return Timeslider;
});