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

    var colors = ["#00D8ED", "#FC576B", "#FBE600", "#82EB05"];

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
            this.template = 'components/_gapminder/' + this.name + '/' + this.name;
            this.tool = context;
            this._super(context, options);
        },

        /*
         * POSTRENDER:
         * Executed after template is loaded
         * Ideally, it contains instantiations related to template
         */
        postRender: function() {

            graph = this.element.select('.vzb-lc-graph');
            yAxisEl = graph.select('.vzb-lc-axis-y');
            xAxisEl = graph.select('.vzb-lc-axis-x');
            yTitleEl = graph.select('.vzb-lc-axis-y-title');
            lines = graph.select('.vzb-lc-lines');

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

            colorScale = d3.scale.ordinal().range(colors)
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
            var lineLabels = lines.selectAll(".vzb-lc-label")[0];
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
            lines.selectAll(".vzb-lc-line-shadow")
                .attr("d", function(d) {
                    return line(d.values);
                })
                .attr("transform", function(d) {
                    return "translate(0,2)";
                });

            lines.selectAll(".vzb-lc-line")
                .attr("d", function(d) {
                    return line(d.values);
                });

            lines.selectAll(".vzb-lc-label")
                .attr("transform", function(d) {
                    return "translate(" + xScale(d.value.time) + "," + yScale(d.value[indicator]) + ")";
                })
                .attr("x", profiles[this.getLayoutProfile()].text_padding);
        },

        setYear: function(year) {

            lines.selectAll(".vzb-lc-entity").remove();
            var entity = lines.selectAll(".vzb-lc-entity")
                .data(data)
                .enter().append("g")
                .attr("class", "vzb-lc-entity");

            entity.append("path")
                .attr("class", "vzb-lc-line-shadow")
                .attr("d", function(d) {
                    return line(d.values);
                })
                .style("stroke", function(d) {
                    return d3.rgb(colorScale(color(d))).darker(0.3);
                });

            entity.append("path")
                .attr("class", "vzb-lc-line")
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
                .attr("class", "vzb-lc-label")
                .datum(function(d) {
                    return {
                        name: d.name,
                        region: d.region,
                        value: d.values[d.values.length - 1]
                    };
                })
                .attr("dy", ".35em")
                .text(function(d) {
                    var size = d.name.length;
                    return (size < 13) ? d.name : d.name.substring(0, 10) + '...'; //only few first letters
                })
                .style("fill", function(d) {
                    return d3.rgb(colorScale(color(d))).darker(0.3);
                });

            this.resize();
            this.resizeStage();
            this.resizeLines();
        }


    });

    return LineChart;
});