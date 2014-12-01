define([
    'jquery',
    'd3',
    'lodash',
    'base/component'
], function($, d3, _, Component) {

    function color(d) {
        return d.region;
    }

    function position(line) {}

    var LineChart = Component.extend({

        /**
         * Initializes the linechart
         * @param config component configuration
         * @param context component context (parent)
         */
        init: function(config, context) {
            this.name = 'line-chart';
            this.template = 'components/_gapminder/' + this.name + '/' + this.name;
            this._super(config, context);
        },

        /*
         * domReady:
         * Executed after template is loaded
         * Ideally, it contains instantiations related to template
         */
        domReady: function() {
            this.graph = this.element.select('.vzb-lc-graph');
            this.yAxisEl = this.graph.select('.vzb-lc-axis-y');
            this.xAxisEl = this.graph.select('.vzb-lc-axis-x');
            this.yTitleEl = this.graph.select('.vzb-lc-axis-y-title');
            this.lines = this.graph.select('.vzb-lc-lines');
        },


        /*
         * dataReady:
         * Executed whenever this.data is changed
         * Ideally, it contains only operations related to this.data events
         */
        dataReady: function() {
            this.data = this.model.data.getItems();

            var _this = this,
                indicator = this.model.show.indicator,
                year = parseInt(d3.time.format("%Y")(this.model.time.value),10),
                minValue = d3.min(this.data, function(d) {
                    return +d[indicator];
                }),
                maxValue = d3.max(this.data, function(d) {
                    return +d[indicator];
                }),
                scale = this.model.show.scale,
                geos = _.uniq(_.map(this.data, function(d) {
                    return {
                        geo: d.geo,
                        name: d['geo.name'],
                        region: d['geo.region'],
                        category: d['geo.category']
                    };
                }), false, function(d) {
                    return d.geo;
                }),
                colors = ["#00D8ED", "#FC576B", "#FBE600", "#82EB05"],

            //10% difference this.margin in min and max
            min = ((scale == "log") ? 1 : (minValue - (maxValue - minValue) / 10)),
                max = maxValue + (maxValue - minValue) / 10,
                unit = this.model.show.unit || 1;

            //axis
            this.yScale = d3.scale[scale]()
                .domain([min, max]);

            this.xScale = d3.scale.linear()
                .domain(d3.extent(this.data, function(d) {
                    return d['time'];
                }));

            this.yAxis = d3.svg.axis()
                .tickFormat(function(d) {
                    return d / unit;
                }).tickSize(6, 0);

            this.xAxis = d3.svg.axis()
                .tickFormat(function(d) {
                    return d;
                }).tickSize(6, 0);

            this.colorScale = d3.scale.ordinal().range(colors)
                .domain(_.map(geos, function(geo) {
                    return geo.region;
                }));

            this.line = d3.svg.line()
                .interpolate("basis")
                .x(function(d) {
                    return _this.xScale(d.time);
                })
                .y(function(d) {
                    return _this.yScale(d[indicator]);
                });

            //this.data up to year
            this.data = _.filter(this.data, function(d) {
                return d.time <= year;
            });

            //modify the this.data format
            this.data = _.map(geos, function(g) {
                //ordered values of current geo
                var geo_values = _.sortBy(_.filter(_this.data, function(d) {
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
             * at this point, this.data is formatted as follows:
             *  this.data = [{
             *      "geo": "swe",
             *      "name": "Sweden",
             *      "region": "eur",
             *      "category": ["country"],
             *      "values": [
             *          { "time": "1990", "gdp": "65468" },
             *          { "time": "1991", "gdp": "65468" },
             *          ...
             *      ]
             *  }, ...];
             */

             this.setYear(year);
        },

        /*
         * RESIZE:
         * Executed whenever the container is resized
         * Ideally, it contains only operations related to size
         */
        resize: function() {

            this.profiles = {
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

            this.margin = this.profiles[this.getLayoutProfile()].margin;
            this.tick_spacing = this.profiles[this.getLayoutProfile()].tick_spacing;

            this.resizeMargins();
            //this.size the stage
            this.resizeStage();
            //this.size the this.lines
            this.resizeLines();

            //this.size year
            this.widthAxisY = this.yAxisEl[0][0].getBBox().width;
            this.heightAxisX = this.xAxisEl[0][0].getBBox().height;

        },

        resizeMargins: function() {

            //adjust right this.margin according to biggest label
            var lineLabels = this.lines.selectAll(".vzb-lc-label")[0],
                biggest = _.max(_.map(lineLabels, function(label) {
                    return label.getBBox().width;
                }));

            this.margin.right = Math.max(this.margin.right, biggest + 20);
        },

        resizeStage: function() {

            //stage
            this.height = parseInt(this.element.style("height"), 10) - this.margin.top - this.margin.bottom;
            this.width = parseInt(this.element.style("width"), 10) - this.margin.left - this.margin.right;

            this.graph
                .attr("width", this.width + this.margin.right + this.margin.left)
                .attr("height", this.height + this.margin.top + this.margin.bottom)
                .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

            //year
            this.widthAxisY = this.yAxisEl[0][0].getBBox().width;
            this.heightAxisX = this.xAxisEl[0][0].getBBox().height;
        },

        resizeLines: function() {

            var _this = this,
                indicator = this.model.show.indicator;

            //scales
            this.yScale = this.yScale.range([this.height, 0]).nice();
            this.xScale = this.xScale.range([0, this.width]).nice();

            //axis
            this.yAxis = this.yAxis.scale(this.yScale)
                .orient("left")
                .ticks(Math.max(this.height / this.tick_spacing, 2));

            this.xAxis = this.xAxis.scale(this.xScale)
                .orient("bottom")
                .ticks(Math.max(this.width / this.tick_spacing, 2));

            this.xAxisEl.attr("transform", "translate(0," + this.height + ")");

            this.yAxisEl.call(this.yAxis);
            this.xAxisEl.call(this.xAxis);

            this.line = d3.svg.line()
                .interpolate("cardinal")
                .x(function(d) {
                    return this.xScale(d.time);
                })
                .y(function(d) {
                    return this.yScale(d[indicator]);
                });

            //lines
            this.lines.selectAll(".vzb-lc-line-shadow")
                .attr("d", function(d) {
                    return _this.line(d.values);
                })
                .attr("transform", function(d) {
                    return "translate(0,2)";
                });

            this.lines.selectAll(".vzb-lc-line")
                .attr("d", function(d) {
                    return _this.line(d.values);
                });

            this.lines.selectAll(".vzb-lc-label")
                .attr("transform", function(d) {
                    return "translate(" + _this.xScale(d.value.time) + "," + _this.yScale(d.value[indicator]) + ")";
                })
                .attr("x", _this.profiles[_this.getLayoutProfile()].text_padding);
        },

        setYear: function(year) {

            var _this = this;

            this.lines.selectAll(".vzb-lc-entity").remove();
            var entity = this.lines.selectAll(".vzb-lc-entity")
                .data(this.data)
                .enter().append("g")
                .attr("class", "vzb-lc-entity");

            entity.append("path")
                .attr("class", "vzb-lc-line-shadow")
                .attr("d", function(d) {
                    return _this.line(d.values);
                })
                .style("stroke", function(d) {
                    return d3.rgb(_this.colorScale(color(d))).darker(0.3);
                });

            entity.append("path")
                .attr("class", "vzb-lc-line")
                .attr("d", function(d) {
                    return _this.line(d.values);
                })
                .style("stroke", function(d) {
                    return _this.colorScale(color(d));
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
                    return d3.rgb(_this.colorScale(color(d))).darker(0.3);
                });

            this.resize();
            this.resizeStage();
            this.resizeLines();
        }


    });

    return LineChart;
});
