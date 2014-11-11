define([
    'd3',
    'base/component',
    'models/time'
], function(d3, Component, TimeModel) {

    //constants
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
         * @param config The options passed to the component
         * @param context The component's parent
         */
        init: function(config, context) {
            this.template = "components/_gapminder/timeslider/timeslider";
            //default model if none is provided
            this.default_model = TimeModel;
            // Same constructor as the superclass
            this._super(config, context);
        },

        /**
         * Executes after the template is loaded and rendered.
         * Ideally, it contains HTML instantiations related to template
         * At this point, this.element and this.placeholder are available as a d3 objects
         */
        postRender: function() {
            var _this = this;

            //html elements
            this.slider_outer = this.element.select(".vzb-ts-slider");
            this.slider = this.slider_outer.select("g");
            this.axis = this.element.select(".vzb-ts-slider-axis");
            this.slide = this.element.select(".vzb-ts-slider-slide");
            this.handle = this.slide.select(".vzb-ts-slider-handle");
            this.value = this.slide.select('.vzb-ts-slider-value');

            var play = this.element.select(".vzb-ts-btn-play"),
                pause = this.element.select(".vzb-ts-btn-pause");

            //model and related events
            // this.range.on('input', function() {
            //     _this._setTime(parseFloat(this.value));
            //     _this.model.pause();
            // });

            play.on('click', function() {
                _this.model.play();
            });

            pause.on('click', function() {
                _this.model.pause();
            });

            //Scale
            this.xScale = d3.time.scale()
                .clamp(true);
            //Axis
            this.xAxis = d3.svg.axis()
                .orient("bottom")
                .tickSize(0);

            //Brush for dragging
            this.brush = d3.svg.brush()
                .x(this.xScale)
                .extent([0, 0])
                .on("brush", function() {
                    _this._brushed(this);
                })
                .on("brushend", function() {
                    _this._brushedEnd(this);
                });

            //Slide
            this.slide.call(this.brush);
            this.slide.selectAll(".extent,.resize")
                .remove();


        },

        /**
         * Executes everytime there's an update event.
         * Ideally, only operations related to changes in the model
         * At this point, this.element is available as a d3 object
         */
        update: function() {

            if(this._blockUpdate) return;

            //time slider should always receive a time model
            var time = this.model.value,
                minValue = this.model.start,
                maxValue = this.model.end,
                unit = this.model.unit,
                _this = this;

            //scale
            this.xScale.domain([minValue, maxValue]);
            //axis
            this.xAxis.tickValues([minValue, maxValue])
                .tickFormat(d3.time.format('%Y'));

            this.resize();

        },

        /**
         * Executes everytime the container or vizabi is resized
         * Ideally,it contains only operations related to size
         */
        resize: function() {

            //margins for slider
            var margin = {
                top: 8,
                right: 15,
                bottom: 12,
                left: 15
            };

            var slider_w = parseInt(this.slider_outer.style("width"), 10),
                slider_h = parseInt(this.slider_outer.style("height"), 10),
                width = slider_w - margin.left - margin.right,
                height = slider_h - margin.bottom - margin.top,
                _this = this;

            //translate according to margins
            this.slider.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            //adjust scale with width
            this.xScale.range([0, width]);

            //adjust axis with scale
            this.xAxis = this.xAxis.scale(this.xScale)
                .tickPadding(12);

            this.axis.attr("transform", "translate(0," + height / 2 + ")")
                .call(this.xAxis);

            this.slide.select(".background")
                .attr("height", height);

            //size of handle
            this.handle.attr("transform", "translate(0," + height / 2 + ")")
                .attr("r", 8);

        },

        _brushed: function(target) {
            this._blockUpdate = true;
            var value = this.brush.extent()[0];

            //set brushed properties
            if (d3.event.sourceEvent) {
                value = this.xScale.invert(d3.mouse(target)[0]);
                this.brush.extent([value, value]);
            }

            //set time according to dragged position
            if (value - this.model.value !== 0) {
                this._setTime(value);
            }
            //position handle
            this.handle.attr("cx", this.xScale(value));
        },

        _brushedEnd: function(target) {
            this._blockUpdate = false;
        },

        _setValue: function(transition) {
            var value = this.model.value,
                speed = this.model.speed;

            if (transition) {
                this.slide.call(this.brush.event)
                    .transition()
                    .duration(speed)
                    .ease("linear")
                    .call(this.brush.extent([value, value]))
                    .call(this.brush.event);
            } else {
                this.slide.call(this.brush.extent([value, value]))
                    .call(this.brush.event);
            }

        },

        /**
         * Sets the time to current time model
         * @param {number} time The time
         */
        _setTime: function(time) {
            //update state
            this.model.value = time;
        },

        /**
         * Sets position of time value string
         */
        _setTimePosition: function() {
            // var offset = 10,
            //     rangeW = parseInt(this.range.style('width'),10) - 16,
            //     timeRange = this.model.end - this.model.start,
            //     currTime = this.model.value - this.model.start,
            //     newPosition = (timeRange > 0) ? Math.round(rangeW * currTime / timeRange) : 0;
            //     newPosition += offset;
            // this.value.style("left", newPosition + "px");

            // var hide_start = (newPosition < offset + 10),
            //     hide_end = (newPosition > rangeW);
            // this.element.classed(class_show_limits_no_start, hide_start);
            // this.element.classed(class_show_limits_no_end, hide_end);
        }
    });

    return Timeslider;
});