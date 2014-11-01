define([
    'd3',
    'base/component',
    'models/time-model'
], function(d3, Component, TimeModel) {

    //contants
    var class_playing = "vzb-playing",
        class_hide_play = "vzb-ts-hide-play-button",
        class_show_limits = "vzb-ts-show-limits",
        class_show_limits_no_start = "vzb-ts-show-limits-no-start",
        class_show_limits_no_end = "vzb-ts-show-limits-no-end",
        class_show_value = "vzb-ts-show-value";

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
            this.start = this.element.select('.vzb-ts-slider-limit-start');
            this.end = this.element.select('.vzb-ts-slider-limit-end');

            var play = this.element.select(".vzb-ts-btn-play"),
                pause = this.element.select(".vzb-ts-btn-pause");

            //model and related events
            this.range.on('input', function() {
                _this._setTime(parseFloat(_this.model.value));
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
            var time = this.model.value,
                minValue = this.model.start
            maxValue = this.model.end
            step = this.model.step;

            this.range.attr("min", minValue)
                .attr("max", maxValue)
                .attr("step", step);

            this.range[0][0].value = time;
            time = Math.floor(time); //without decimals for display
            this.value.html(time);
            this.start.html(minValue);
            this.end.html(maxValue);

            this._setTimePosition();

            this.element.classed(class_hide_play, !this.model.playable);
            this.element.classed(class_playing, this.model.playing);

            var show_limits = false,
                show_value = false;
            try {
                show_limits = (this.ui.timeslider.show_limits);
            } catch (e) {}
            try {
                show_value = (this.ui.timeslider.show_value);
            } catch (e) {}

            this.element.classed(class_show_limits, show_limits);
            this.element.classed(class_show_value, show_value);
        },

        /**
         * Executes everytime the container or vizabi is resized
         * Ideally,it contains only operations related to size
         */
        resize: function() {
            this._setTimePosition();
        },

        /**
         * Sets the time to current time model
         * @param {number} time The time
         * @param {boolean} silent Silent option does not trigger events
         */
        _setTime: function(time, silent) {
            //update state
            this.model.value = time;
        },

        /**
         * Sets position of time value string
         */
        _setTimePosition: function() {
            var offset = 10,
                rangeW = parseInt(this.range.style('width'), offset) - 16,
                timeRange = this.model.end - this.model.start,
                currTime = this.model.value - this.model.start,
                newPosition = (timeRange > 0) ? Math.round(rangeW * currTime / timeRange) : 0;
            newPosition += offset;
            this.value.style("left", newPosition + "px");

            var hide_start = (newPosition < offset + 10),
                hide_end = (newPosition > rangeW);
            this.element.classed(class_show_limits_no_start, hide_start);
            this.element.classed(class_show_limits_no_end, hide_end);
        }
    });

    return Timeslider;
});