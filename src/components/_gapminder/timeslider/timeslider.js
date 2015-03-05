//TODO: different sizes according to resolution

define([
    'd3',
    'lodash',
    'base/component',
    'models/time'
], function(d3, _, Component, TimeModel) {

    //constants
    var class_playing = "vzb-playing",
        class_hide_play = "vzb-ts-hide-play-button",
        class_dragging = "vzb-ts-dragging",
        class_show_value = "vzb-ts-show-value";

    var time_formats = {
        "year": d3.time.format("%Y"),
        "month": d3.time.format("%b"),
        "week": d3.time.format("week %U"),
        "day": d3.time.format("%d/%m/%Y"),
        "hour": d3.time.format("%d/%m/%Y %H"),
        "minute": d3.time.format("%d/%m/%Y %H:%M"),
        "second": d3.time.format("%d/%m/%Y %H:%M:%S")
    };

    //margins for slider
    var profiles = {
        small: {
            margin: {
                top: 9,
                right: 15,
                bottom: 10,
                left: 15
            },
            radius: 8,
            label_spacing: 10
        },
        medium: {
            margin: {
                top: 9,
                right: 15,
                bottom: 10,
                left: 15
            },
            radius: 10,
            label_spacing: 12
        },
        large: {
            margin: {
                top: 9,
                right: 15,
                bottom: 10,
                left: 15
            },
            radius: 11,
            label_spacing: 14
        }
    };

    var Timeslider = Component.extend({

        /**
         * Initializes the timeslider.
         * Executed once before any template is rendered.
         * @param config The options passed to the component
         * @param context The component's parent
         */
        init: function(config, context) {
            this.template = this.template||"components/_gapminder/timeslider/timeslider";

            //define expected models/hooks for this component
            this.model_expects = [{
                name: "time",
                type: "time"
            }];

            var _this = this;

            //binds methods to this model
            this.model_binds = {
                'ready': function(evt) {
                    _this.changeTime();
                },
                'change': function(evt, original) {
                    _this.changeTime();
                }
            };

            // Same constructor as the superclass
            this._super(config, context);

            //default ui
            this.ui = _.extend({
                show_limits: false,
                show_value: false,
                show_button: true
            }, this.ui);
            
            
            //defaults
            this.width = 0;
            this.height = 0;
        },

        /**
         * Executes after the template is loaded and rendered.
         * Ideally, it contains HTML instantiations related to template
         * At this point, this.element and this.placeholder are available as a d3 objects
         */
        domReady: function() {
            var _this = this;

            //html elements
            this.slider_outer = this.element.select(".vzb-ts-slider");
            this.slider = this.slider_outer.select("g");
            this.axis = this.element.select(".vzb-ts-slider-axis");
            this.slide = this.element.select(".vzb-ts-slider-slide");
            this.handle = this.slide.select(".vzb-ts-slider-handle");
            this.valueText = this.slide.select('.vzb-ts-slider-value');

            var play = this.element.select(".vzb-ts-btn-play"),
                pause = this.element.select(".vzb-ts-btn-pause");

            play.on('click', function() {
                _this.model.time.play();
            });

            pause.on('click', function() {
                _this.model.time.pause();
            });

            //Scale
            this.xScale = d3.time.scale()
                .clamp(true);
            //Axis
            this.xAxis = d3.svg.axis()
                .orient("bottom")
                .tickSize(0);

            //Value
            this.valueText.attr("text-anchor", "middle").attr("dy","-1em");

            var brushed = _this._getBrushed(),
                brushedEnd = _this._getBrushedEnd();

            //Brush for dragging
            this.brush = d3.svg.brush()
                .x(this.xScale)
                .extent([0, 0])
                .on("brush", brushed)
                .on("brushend", brushedEnd);

            //Slide
            this.slide.call(this.brush);
            this.slide.selectAll(".extent,.resize")
                .remove();


            var _this = this;

        },

        changeTime: function() {
            this.ui.format = this.model.time.unit;

            //time slider should always receive a time model
            var time = this.model.time.value,
                minValue = this.model.time.start,
                maxValue = this.model.time.end,
                _this = this;

            //format
            this.format = time_formats[this.ui.format];

            //scale
            this.xScale.domain([minValue, maxValue]);
            //axis
            this.xAxis.tickValues([minValue, maxValue])
                .tickFormat(this.format);

            //special classes
            this._optionClasses();
            //resize
            this.resize();
        },

        /**
         * Executes everytime the container or vizabi is resized
         * Ideally,it contains only operations related to size
         */
        resize: function() {

            this.profile = profiles[this.getLayoutProfile()];

            var slider_w = parseInt(this.slider_outer.style("width"), 10);
            var slider_h = parseInt(this.slider_outer.style("height"), 10);
            this.width = slider_w - this.profile.margin.left - this.profile.margin.right;
            this.height = slider_h - this.profile.margin.bottom - this.profile.margin.top;
            var _this = this;

            //translate according to margins
            this.slider.attr("transform", "translate(" + this.profile.margin.left + "," + this.profile.margin.top + ")");

            //adjust scale with width
            this.xScale.range([0, this.width]);

            //adjust axis with scale
            this.xAxis = this.xAxis.scale(this.xScale)
                .tickPadding(this.profile.label_spacing);

            this.axis.attr("transform", "translate(0," + this.height / 2 + ")")
                .call(this.xAxis);

            this.slide.select(".background")
                .attr("height", this.height);

            //size of handle
            this.handle.attr("transform", "translate(0," + this.height / 2 + ")")
                .attr("r", this.profile.radius);

            //set handle at current position
            this._setHandle(this.model.time.playing);

        },
        
        
        /**
         * Getter and setter for styling profile
         * @returns {Structure} current profile if not set
         * @returns {class} this if set
         */
        getSetProfile: function(arg){
            if (!arguments.length) return profiles;
            profiles = arg;
            return this;
        },

        /**
         * Gets brushed function to be executed when dragging
         * @returns {Function} brushed function
         */
        _getBrushed: function() {
            var _this = this;
            return function() {
                if (!_this._blockUpdate) {
                    _this.model.time.pause();
                    _this._optionClasses();
                    _this._blockUpdate = true;
                    _this.element.classed(class_dragging, true);
                }

                var value = _this.brush.extent()[0];

                //set brushed properties
                if (d3.event.sourceEvent) {
                    value = _this.xScale.invert(d3.mouse(this)[0]);
                }

                //set time according to dragged position
                if (value - _this.model.time.value !== 0) {
                    _this._setTime(value);
                }
                //position handle
                _this._setHandle();
            }
        },

        /**
         * Gets brushedEnd function to be executed when dragging ends
         * @returns {Function} brushedEnd function
         */
        _getBrushedEnd: function() {
            var _this = this;
            return function() {
                _this._blockUpdate = false;
                _this.model.time.pause();
                _this.element.classed(class_dragging, false);
            }
        },

        /**
         * Sets the handle to the correct position
         * @param {Boolean} transition whether to use transition or not
         */
        _setHandle: function(transition) {
            var value = this.model.time.value;
            this.slide.call(this.brush.extent([value, value]));
            this.valueText.text(this.format(value));

            if (this.model.time.start - this.model.time.value === 0) {
                transition = false;
            }

            if (transition) {
                var speed = this.model.time.speed,
                    old_pos = this.handle.attr("cx"),
                    new_pos = this.xScale(value);

                this.handle.attr("cx", old_pos)
                    .transition()
                    .duration(speed)
                    .ease("linear")
                    .attr("cx", new_pos);

                this.valueText.attr("transform", "translate(" + old_pos + ","+(this.height/2)+")")
                    .transition()
                    .duration(speed)
                    .ease("linear")
                    .attr("transform", "translate(" + new_pos + ","+(this.height/2)+")");

            } else {
                var pos = this.xScale(value);
                this.handle.attr("cx", pos);
                this.valueText.attr("transform", "translate(" + pos + ","+(this.height/2)+")");
            }
        },

        /**
         * Sets the current time model to time
         * @param {number} time The time
         */
        _setTime: function(time) {
            //update state
            this.model.time.value = time;
        },

        /**
         * Applies some classes to the element according to options
         */
        _optionClasses: function() {
            //show/hide classes

            var show_limits = this.ui.show_limits,
                show_value = this.ui.show_value,
                show_play = (this.ui.show_button) && (this.model.time.playable);

            if (!show_limits) this.xAxis.tickValues([]).ticks(0);

            this.element.classed(class_hide_play, !show_play);
            this.element.classed(class_playing, this.model.time.playing);
            this.element.classed(class_show_value, show_value);
        },
    });

    return Timeslider;
});