define([
    'jquery',
    'd3',
    'underscore',
    'base/component'
], function($, d3, _, Component) {

    var profiles = {
        "small": {
            margin: {
                top: 30,
                right: 20,
                left: 40,
                bottom: 40
            },
            tick_spacing: 60,
            text_padding: 5
        },
        "medium": {
            margin: {
                top: 30,
                right: 60,
                left: 60,
                bottom: 40
            },
            tick_spacing: 80,
            text_padding: 10
        },
        "large": {
            margin: {
                top: 30,
                right: 60,
                left: 60,
                bottom: 40
            },
            tick_spacing: 100,
            text_padding: 15
        }
    };

    var size,
        //scales
        xScale,
        yScale,
        colorScale,
        colors,
        line,
        //axis
        xAxis,
        yAxis,
        //elements
        graph,
        lines,
        xAxisEl,
        yAxisEl,
        //sizes
        height,
        width,
        margin,
        tick_spacing,
        //data
        data,
        selected_countries,
        indicator;

    function color(d) {
        return d.region;
    }

    function position(line) {}

    var LineChart = Component.extend({
        init: function(context, options) {
            this.name = 'line-chart';
            this.template = 'components/' + this.name + '/' + this.name;
            this.tool = context;
            this._super(context, options);
        },

        // After loading template, select HTML elements
        postRender: function() {

            graph = this.element.select('#graph');
            yAxisEl = graph.select('#y_axis');
            xAxisEl = graph.select('#x_axis');
            yTitleEl = graph.select('#y_axis_title');
            xTitleEl = graph.select('#x_axis_title');
            yearEl = graph.select('#year');
            lines = graph.select('#lines');

            this.update();
        },


        /*
         * UPDATE:
         * Executed whenever data is changed
         * Ideally, it contains only operations related to data events
         */
        update: function() {
            data = this.model.getData()[0];
            indicator = this.model.getState("indicator")[0];

            var _this = this,
                year = this.model.getState("time"),
                minValue = d3.min(data, function(d) {
                    return +d[indicator];
                }),
                maxValue = d3.max(data, function(d) {
                    return +d[indicator];
                }),
                scale = this.model.getState("scale")[0],
                geos = _.uniq(_.map(data, function(d) {
                    return {
                        geo: d.geo,
                        name: d['geo.name'],
                        region: d['geo.region'],
                        category: d['geo.category']
                    };
                }), false, function(d) {
                    return d.geo;
                });

            //10% difference margin in min and max
            min = ((scale == "log") ? 1 : (minValue - (maxValue - minValue) / 10)),
            max = maxValue + (maxValue - minValue) / 10,
            unit = this.model.getState("unit")[0] || 1;

            //axis
            yScale = d3.scale[scale]()
                .domain([min, max]);

            xScale = d3.scale.linear()
                .domain(d3.extent(data, function(d) {
                    return d['time'];
                }));

            yAxis = d3.svg.axis()
                .tickFormat(function(d) {
                    return d / unit;
                }).tickSize(6, 0);

            xAxis = d3.svg.axis()
                .tickFormat(function(d) {
                    return d;
                }).tickSize(6, 0);

            colorScale = d3.scale.category20()
                .domain(_.map(geos, function(geo) {
                    return geo.region;
                }));

            line = d3.svg.line()
                .interpolate("basis")
                .x(function(d) {
                    return xScale(d.time);
                })
                .y(function(d) {
                    return yScale(d[indicator]);
                });

            //data up to year
            data = _.filter(data, function(d) {
                return d.time <= year;
            });

            //modify the data format
            data = _.map(geos, function(g) {
                //ordered values of current geo
                var geo_values = _.sortBy(_.filter(data, function(d) {
                    return d.geo === g.geo;
                }), function(d) {
                    return d.time;
                });

                g.values = _.map(geo_values, function(d) {
                    return _.omit(d, ['geo', 'geo.name', 'geo.region', 'geo.category']);
                })
                return g;
            });

            /*
             * at this point, data is formatted as follows:
             *  data = [{
             *      "geo": "swe",
             *      "geo.name": "Sweden",
             *      "geo.region": "eur",
             *      "geo.category": ["country"],
             *      "geo.values": [
             *          { "time": "1990", "gdp": "65468" },
             *          { "time": "1991", "gdp": "65468" },
             *          ...
             *      ]
             *  }, ...];
             */

            //lines
            this.setYear(year);

            $.simpTooltip();

        },

        /*
         * RESIZE:
         * Executed whenever the container is resized
         * Ideally, it contains only operations related to size
         */
        resize: function() {

            margin = profiles[this.getLayoutProfile()].margin;
            tick_spacing = profiles[this.getLayoutProfile()].tick_spacing;

            this.resizeMargins();
            //size the stage
            this.resizeStage();
            //size the lines
            this.resizeLines();

            //size year
            widthAxisY = yAxisEl[0][0].getBBox().width;
            heightAxisX = xAxisEl[0][0].getBBox().height;

        },

        resizeMargins: function() {

            //adjust right margin according to biggest label
            var lineLabels = lines.selectAll(".label")[0];
            var biggest = _.max(_.map(lineLabels, function(label) {
                return label.getBBox().width;
            }));
            margin.right = Math.max(margin.right, biggest + 20);
        },

        resizeStage: function() {

            //stage
            height = parseInt(this.element.style("height"), 10) - margin.top - margin.bottom;
            width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;

            graph
                .attr("width", width + margin.right + margin.left)
                .attr("height", height + margin.top + margin.bottom)
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            //year
            widthAxisY = yAxisEl[0][0].getBBox().width;
            heightAxisX = xAxisEl[0][0].getBBox().height;
        },

        resizeLines: function() {
            //scales
            yScale = yScale.range([height, 0]).nice();
            xScale = xScale.range([0, width]).nice();

            //axis
            yAxis = yAxis.scale(yScale)
                .orient("left")
                .ticks(Math.max(height / tick_spacing, 2));

            xAxis = xAxis.scale(xScale)
                .orient("bottom")
                .ticks(Math.max(width / tick_spacing, 2));

            xAxisEl.attr("transform", "translate(0," + height + ")");

            yAxisEl.call(yAxis);
            xAxisEl.call(xAxis);

            line = d3.svg.line()
                .interpolate("cardinal")
                .x(function(d) {
                    return xScale(d.time);
                })
                .y(function(d) {
                    return yScale(d[indicator]);
                });

            //lines
            lines.selectAll(".line")
                .attr("d", function(d) {
                    return line(d.values);
                });

            lines.selectAll(".label")
                .attr("transform", function(d) {
                    return "translate(" + xScale(d.value.time) + "," + yScale(d.value[indicator]) + ")";
                })
                .attr("x", profiles[this.getLayoutProfile()].text_padding);
        },

        setYear: function(year) {

            lines.selectAll(".entity").remove();
            var entity = lines.selectAll(".entity")
                .data(data)
                .enter().append("g")
                .attr("class", "entity");

            entity.append("path")
                .attr("class", "line")
                .attr("d", function(d) {
                    return line(d.values);
                })
                .style("stroke", function(d) {
                    return colorScale(color(d));
                })
                .attr("data-tooltip", function(d) {
                    return d.name;
                });

            entity.append("text")
                .attr("class", "label")
                .datum(function(d) {
                    return {
                        name: d.name,
                        value: d.values[d.values.length - 1]
                    };
                })
                .attr("dy", ".35em")
                .text(function(d) {
                    return d.name;
                });

            this.resize();
            this.resizeStage();
            this.resizeLines();
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

    return LineChart;
});