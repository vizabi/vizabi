define([
    'd3',
    'base/component',
    'models/time-model'
], function(d3, Component, TimeModel) {

    //contants
    var class_playing = "vzb-playing",
        class_hide_play = "vzb-ts-hide-play-button";

    var Timeslider = Component.extend({

        /**
         * Initializes the timeslider.
         * Executed once before any template is rendered.
         * @param options The options passed to the component
         * @param context The component's parent
         */
        init: function(options, context) {
            this.template = "components/_gapminder/timeslider/timeslider";
            if (!options.model) options.model = new TimeModel();
            // Same constructor as the superclass
            this._super(options, context);
        },

        /**
         * Executes after the template is loaded and rendered.
         * Ideally, it contains HTML instantiations related to template
         * At this point, this.element and this.placeholder are available as a d3 objects
         */
        postRender: function() {
            var _this = this;

            //html elements
            this.range = this.element.select(".vzb-ts-slider");
            this.value = this.element.select('.vzb-ts-slider-value');

            var play = this.element.select(".vzb-ts-btn-play"),
                pause = this.element.select(".vzb-ts-btn-pause");

            //model and related events
            this.range.on('input', function() {
                _this._setTime(parseFloat(this.value));
                _this.model.pause();
            });

            play.on('click', function() {
                _this.model.play();
            });

            pause.on('click', function() {
                _this.model.pause();
            });
        },

        /**
         * Executes everytime there's an update event.
         * Ideally, only operations related to changes in the model
         * At this point, this.element is available as a d3 object
         */
        update: function() {
            //time slider should always receive a time model
            var time = this.model.get("value"),
                minValue = this.model.get("start")
            maxValue = this.model.get("end")
            step = this.model.get("step");

            this.range.attr("min", minValue)
                .attr("max", maxValue)
                .attr("step", step);

            this.range[0][0].value = time;
            time = Math.floor(time); //without decimals for display
            this.value.html(time);
            this._setTimePosition();

            if (!this.model.get("playable")) {
                this.element.classed(class_hide_play, true);
            } else {
                this.element.classed(class_hide_play, false);
            }

            if (this.model.get("playing")) {
                this.element.classed(class_playing, true);
            } else {
                this.element.classed(class_playing, false);
            }
        },

        /**
         * Sets the time to current time model
         * @param {number} time The time
         * @param {boolean} silent Silent option does not trigger events
         */
        _setTime: function(time, silent) {
            //update state
            this.model.set("value", time, silent);
        },

        /**
         * Sets position of time value string
         */
        _setTimePosition: function() {
            var rangeW = parseInt(this.range.style('width'),10) - 16,
                timeRange = this.model.get("end") - this.model.get("start"),
                currTime = this.model.get("value") - this.model.get("start"),
                newPosition = (timeRange > 0) ? Math.round(rangeW * currTime / timeRange) : 0;
                newPosition += 10;
            this.value.style("left", newPosition + "px");
        }
    });

    return Timeslider;
});