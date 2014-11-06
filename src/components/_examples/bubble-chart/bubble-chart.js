define([
    'jquery',
    'd3',
    'base/component'
], function($, d3, Component) {

    var _this = null;

    var DURATION_FAST = 100; //ms
    var xScale;
    var yScale;
    var rScale;
    var colorScale;
    //axis
    var xAxis;
    var yAxis;
    //sizes
    var height;
    var width;

    // Various accessors that specify the dimensions of data to visualize.
    function x(d, indicator) {
        return d[indicator];
    }

    function y(d, indicator) {
        return d[indicator];
    }

    function radius(d, indicator) {
        return d[indicator] || 1;
    }

    function color(d) {
        return d.region;
    }

    function position(dot) {

        dot.attr("cy", function(d) {
                return yScale(y(d, _this.indicator[0]));
            })
            .attr("cx", function(d) {
                return xScale(x(d, _this.indicator[1]));
            })
            .attr("r", function(d) {
                return rScale(radius(d, _this.indicator[2]));
            });
    }

    function order(a, b) {
        return radius(b) - radius(a);
    }

    var BubbleChart = Component.extend({
        init: function(context, options) {
            _this = this;
            this.name = 'bubble-chart';
            this.template = 'components/_examples/' + this.name + '/' + this.name;
            this.tool = context;
            this._super(context, options);
        },

        /**
         * POST RENDER
         * Executes right after the template is in place
         */
        postRender: function() {

            // reference elements
            this.graph = this.element.select('.vzb-bc-graph');
            this.yAxisEl = this.graph.select('.vzb-bc-axis-y');
            this.xAxisEl = this.graph.select('.vzb-bc-axis-x');
            this.yTitleEl = this.graph.select('.vzb-bc-axis-y-title');
            this.xTitleEl = this.graph.select('.vzb-bc-axis-x-title');
            this.yearEl = this.graph.select('.vzb-bc-year');
            this.bubbles = this.graph.select('.vzb-bc-bubbles');
        },


        /*
         * UPDATE:
         * Updates the component as soon as the model/models change
         * Ideally, it contains only operations related to data events
         */
        //FIXME when sliding through years, data is not changing (only year),
        // but the function is still called. is it ok?
        update: function() {
            this.indicator = this.model.show.indicator;
            this.data = this.model.data.getItems();
            this.time = this.model.time.value;
            this.scale = this.model.show.scale;
            this.units = this.model.show.unit || [1, 1, 1];

            var minValue = this.indicator.map(function(ind) {
                    return d3.min(_this.data, function(d) {
                        return +d[ind];
                    });
                });
            var maxValue = this.indicator.map(function(ind) {
                    return d3.max(_this.data, function(d) {
                        return +d[ind];
                    });
                });

            //10% difference margin in min and max
            var min = this.scale.map(function(scale, i) {
                    return ((scale === "log") ? 1 : (minValue[i] - (maxValue[i] - minValue[i]) / 10));
                });
            var max = this.scale.map(function(scale, i) {
                    return maxValue[i] + (maxValue[i] - minValue[i]) / 10;
                });

            //axis
            yScale = d3.scale[this.scale[0]]()
                .domain([min[0], max[0]]);

            xScale = d3.scale[this.scale[1]]()
                .domain([min[1], max[1]]);

            rScale = d3.scale[this.scale[2]]()
                .domain([min[2], max[2]]);

            yAxis = d3.svg.axis()
                .tickFormat(function(d) {
                    return d / _this.units[0];
                }).tickSize(6, 0);

            xAxis = d3.svg.axis()
                .tickFormat(function(d) {
                    return d / _this.units[1];
                }).tickSize(6, 0);

            colorScale = d3.scale.category10();

            //bubbles
            this.setYear(this.time);

            $.simpTooltip();

        },

        /*
         * RESIZE:
         * Executed whenever the container is resized
         * Ideally, it contains only operations related to size
         */
        resize: function() {
            var margin;
            var tick_spacing;

            switch (this.getLayoutProfile()) {
                case "small":
                    margin = {top: 30, right: 20, left: 40, bottom: 40};
                    tick_spacing = 60;
                    break;
                case "medium":
                    margin = {top: 30, right: 60, left: 60, bottom: 40};
                    tick_spacing = 80;
                    break;
                case "large":
                    margin = {top: 30, right: 60, left: 60, bottom: 40};
                    tick_spacing = 100;
                    break;
            }

            //size the stage
            this.resizeStage(margin);
            //size the bubbles
            this.resizeBubbles(tick_spacing);
        },

        resizeStage: function(margin) {

            //stage
            height = parseInt(this.element.style("height"), 10) - margin.top - margin.bottom;
            width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;

            //graph group is shifted according to margins (while svg element is at 100 by 100%)
            this.graph
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            //year is centered
            var widthAxisY = this.yAxisEl[0][0].getBBox().width;
            var heightAxisX = this.xAxisEl[0][0].getBBox().height;
            this.yearEl
                .attr("x", "50%")
                .attr("y", "50%")
                .attr("transform", "translate(" + (-1 * widthAxisY) + ", " + (heightAxisX) + ")");
        },

        resizeBubbles: function(tick_spacing) {
            //scales
            yScale = yScale.range([height, 0]).nice();
            xScale = xScale.range([0, width]).nice();

            var maxRadius = (this.getLayoutProfile() === "large") ? 50 : 30;
            rScale = rScale.range([1, maxRadius]);

            //axis
            yAxis.scale(yScale)
                .orient("left")
                .ticks(Math.max(height / tick_spacing, 2));

            xAxis.scale(xScale)
                .orient("bottom")
                .ticks(Math.max(width / tick_spacing, 2));

            this.xAxisEl.attr("transform", "translate(0," + height + ")");

            this.yAxisEl.call(yAxis);
            this.xAxisEl.call(xAxis);

            //bubbles
            this.bubbles.selectAll(".vzb-bc-bubble")
                .transition().duration(DURATION_FAST).ease("linear")
                .call(position)
                .sort(order);
        },

        setYear: function(time) {

            this.yearEl.text(time);
            //this.bubbles.selectAll(".vzb-bc-bubble").remove();
            this.bubbles.selectAll(".vzb-bc-bubble")
                .data(interpolateData(_this.data, _this.indicator, time))
                .enter().append("circle")
                .attr("class", "vzb-bc-bubble")
                .style("fill", function(d) {
                    return colorScale(color(d));
                })
                .attr("data-tooltip", function(d) {
                    return d.name;
                });

            this.resize();
        }


    });

    // Interpolates the dataset for the given (fractional) year.
    function interpolateData(data, indicator, year) {

        var yearData = data.filter(function(d) {
            return (d.time == year);
        });

        return yearData.map(function(d) {
            var obj = {
                name: d["geo.name"],
                region: d["geo.region"] || "world"
            };
            indicator.forEach(function(indicator) {
                obj[indicator] = d[indicator];
            });

            return obj;
        });
    }

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
