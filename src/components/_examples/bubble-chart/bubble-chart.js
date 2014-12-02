define([
    'jquery',
    'd3',
    'base/component'
], function($, d3, Component) {

    function order(a, b) {
        return radius(b) - radius(a);
    }

    function radius(d, indicator) {
        return d.pop;
    }

    var BubbleChart = Component.extend({
        init: function(context, options) {
            var _this = this;
            this.name = 'bubble-chart';
            this.template = 'components/_examples/' + this.name + '/' + this.name;

            //define expected models for this component
            this.model_expects = ["time", "entities", "marker", "data"];

            this._super(context, options);

            this.xScale = null;
            this.yScale = null;
            this.rScale = null;
            this.cScale = d3.scale.category10();

            this.xAxis = d3.svg.axis();
            this.yAxis = d3.svg.axis();

            this.isDataPreprocessed = false;
        },


        /**
         * Executes right after the template is in place
         */
        domReady: function() {

            // reference elements
            this.graph = this.element.select('.vzb-bc-graph');
            this.yAxisEl = this.graph.select('.vzb-bc-axis-y');
            this.xAxisEl = this.graph.select('.vzb-bc-axis-x');
            this.yTitleEl = this.graph.select('.vzb-bc-axis-y-title');
            this.xTitleEl = this.graph.select('.vzb-bc-axis-x-title');
            this.yearEl = this.graph.select('.vzb-bc-year');
            this.bubbleContainer = this.graph.select('.vzb-bc-bubbles');
            this.bubbles = null;
        },


        /*
         * Updates the component as soon as the model/models change
         */
        modelReady: function() {
            var _this = this;

            //TODO: preprocessing should go somewhere else, when the data is loaded
            if (!this.isDataPreprocessed) {
                _this.model.marker.label.getItems().forEach(function(d) {
                    d["geo.region"] = d["geo.region"] || "world";
                });
                this.isDataPreprocessed = true;
            }

            this.data = this.model.marker.label.getItems();
            this.time = parseInt(d3.time.format("%Y")(this.model.time.value), 10);

            if (this.isDataPreprocessed) {
                //TODO: #32 run only if data or show models changed
                this.updateShow();
                //TODO: #32 run only if data or time models changed
                this.updateTime();
                //TODO: #32 run only on resize or on init
                this.resize();
            }
        },


        /*
         * UPDATE SHOW:
         * Ideally should only update when show parameters change or data changes
         */
        updateShow: function() {

            //scales
            this.yScale = this.model.marker.axis_y.getDomain();
            this.xScale = this.model.marker.axis_x.getDomain();
            this.rScale = this.model.marker.size.getDomain();

            var _this = this;
            this.yAxis.tickFormat(function(d) {
                return _this.model.marker.axis_y.getTick(d);
            });
            this.xAxis.tickFormat(function(d) {
                return _this.model.marker.axis_x.getTick(d);
            });

            $.simpTooltip();
        },


        /*
         * UPDATE TIME:
         * Ideally should only update when time or data changes
         */
        updateTime: function() {
            var _this = this;

            this.yearEl.text(this.time);
            this.bubbles = this.bubbleContainer.selectAll('.vzb-bc-bubble')
                .data(this.data.filter(function(d) {
                    return (+d.time === _this.time);
                }));
        },

        /*
         * RESIZE:
         * Executed whenever the container is resized
         */
        resize: function() {

            if (!this.isDataPreprocessed) return;

            var _this = this,
                margin,
                tick_spacing,
                maxRadius,
                minRadius,
                maxRadiusNormalized = this.model.marker.size.max,
                minRadiusNormalized = this.model.marker.size.min,
                padding = 2;

            switch (this.getLayoutProfile()) {
                case "small":
                    margin = {
                        top: 30,
                        right: 20,
                        left: 40,
                        bottom: 40
                    };
                    tick_spacing = 60;
                    maxRadius = 20;
                    break;
                case "medium":
                    margin = {
                        top: 30,
                        right: 60,
                        left: 60,
                        bottom: 40
                    };
                    tick_spacing = 80;
                    maxRadius = 40;
                    break;
                case "large":
                    margin = {
                        top: 30,
                        right: 60,
                        left: 60,
                        bottom: 40
                    };
                    tick_spacing = 100;
                    maxRadius = 60;
                    break;
            }

            minRadius = maxRadius * minRadiusNormalized;
            maxRadius = maxRadius * maxRadiusNormalized;

            //stage
            var height = parseInt(this.element.style("height"), 10) - margin.top - margin.bottom;
            var width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;

            //graph group is shifted according to margins (while svg element is at 100 by 100%)
            this.graph
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            //center year 
            var widthAxisY = this.yAxisEl[0][0].getBBox().width;
            var heightAxisX = this.xAxisEl[0][0].getBBox().height;
            
            this.yearEl
                .attr("x", "50%")
                .attr("y", "50%")
                .attr("transform", "translate(" + (-1 * widthAxisY) + ", " + (heightAxisX) + ")");

            //update scales to the new range
            if (this.model.marker.axis_y.scale !== "ordinal") {
                this.yScale.range([height, 0]).nice();
            } else {
                this.yScale.rangePoints([height, 0], padding).range();
            }
            if (this.model.marker.axis_x.scale !== "ordinal") {
                this.xScale.range([0, width]).nice();
            } else {
                this.xScale.rangePoints([0, width], padding).range();
            }
            if (this.model.marker.size.scale !== "ordinal") {
                this.rScale.range([minRadius, maxRadius]);
            } else {
                this.rScale.rangePoints([minRadius, maxRadius], 0).range();
            }

            //apply scales to axes and redraw
            this.yAxis.scale(this.yScale)
                .orient("left")
                .tickSize(6, 0)
                .ticks(Math.max(height / tick_spacing, 2));

            this.xAxis.scale(this.xScale)
                .orient("bottom")
                .tickSize(6, 0)
                .ticks(Math.max(width / tick_spacing, 2));

            this.xAxisEl.attr("transform", "translate(0," + height + ")");

            this.yAxisEl.call(this.yAxis);
            this.xAxisEl.call(this.xAxis);

            this.redrawDataPoints();
        },

        /*
         * REDRAW DATA POINTS:
         * Here plotting happens
         */
        redrawDataPoints: function() {
            var _this = this;

            //exit selection
            this.bubbles.exit().remove();

            //enter selection -- init circles
            this.bubbles.enter().append("circle")
                .attr("class", "vzb-bc-bubble");

            //update selection
            var speed = this.model.time.speed;
            this.bubbles
                .style("fill", function(d) {
                    var id = getPointId(d);
                    return _this.model.marker.color.getValue(id);
                })
                .attr("data-tooltip", function(d) {
                    var id = getPointId(d);
                    return _this.model.marker.label.getValue(id);
                })
                .transition().duration(speed).ease("linear")
                .attr("cy", function(d) {
                    var id = getPointId(d),
                        value = _this.model.marker.axis_y.getValue(id);
                    return _this.yScale(value);
                })
                .attr("cx", function(d) {
                    var id = getPointId(d),
                        value = _this.model.marker.axis_x.getValue(id);
                    return _this.xScale(value);
                })
                .attr("r", function(d) {
                    var id = getPointId(d),
                        value = _this.model.marker.size.getValue(id);
                    var val = _this.rScale(value);
                    return Math.sqrt(val / Math.PI) * 10;
                });

            //todo: remove id funciton
            function getPointId(point) {
                return _.pick(point, ["geo", "time"]);
            }
        }

    });




    //tooltip plugin (hotfix)
    //TODO: remove this plugin from here
    $.extend({
        simpTooltip: function(options) {
            var defaults = {
                position_x: -30,
                position_y: 20,
                target: "[data-tooltip]",
                extraClass: ""
            };
            options = $.extend(defaults, options);
            var targets = $(options.target);
            var xOffset = options.position_x;
            var yOffset = options.position_y;
            targets.hover(function(e) {
                var t = $(this).attr('data-tooltip');
                $("body").append("<div id='simpTooltip' class='simpTooltip " + options.extraClass + "'>" + t + "</div>");
                $("#simpTooltip").css("top", (e.pageY - xOffset) + "px").css("left", (e.pageX + yOffset) + "px").fadeIn("fast");
            }, function() {
                $("#simpTooltip").remove();
            });
            targets.mousemove(function(e) {
                $("#simpTooltip").css("top", (e.pageY + yOffset) + "px").css("left", (e.pageX + xOffset) + "px");
            });
        }
    });

    return BubbleChart;
});