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

        init: function(context, options) {
            this.name = 'line-chart';
            this.template = 'components/_gapminder/' + this.name + '/' + this.name;

            //define expected models for this component
            this.model_expects = ["time", "entities", "marker", "data"];

            this._super(context, options);

            this.xScale = null;
            this.yScale = null;

            this.xAxis = d3.svg.axis();
            this.yAxis = d3.svg.axis();

            this.isDataPreprocessed = false;
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

            //model events
            this.model.on({
                "change": function(evt) {
                    console.log("Changed!");
                },
                "load_start": function(evt) {
                    console.log("Started to load!");
                },
                "load_end": function() {
                    console.log("Finished Loading!");
                }
            });

            //component events
            this.on("resize", function() {
                console.log("Ops! Gotta resize...");
            })
        },


        /*
         * modelReady:
         * Executed whenever this.data is changed
         * Ideally, it contains only operations related to this.data events
         */
        modelReady: function() {
            var _this = this,
                year = parseInt(d3.time.format("%Y")(this.model.time.value), 10)

            this.data = this.model.marker.axis_y.getItems();

            if (!this.isDataPreprocessed) {
                geos = _.uniq(_.map(this.model.marker.label.getItems(), function(d) {
                    return {
                        geo: d.geo,
                        name: d.value,
                        region: d['geo.region'] || "world",
                        category: d['geo.category']
                    };
                }), false, function(d) {
                    return d.geo;
                });

                this.isDataPreprocessed = true;
            }

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


            if (this.isDataPreprocessed) {
                this.setScale();                
                
                this.resize();
                this.resizeStage();
                this.resizeMargins();
                

                this.drawAxes();
                this.drawLines();
                this.drawEntities();
            }
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

        setScale: function() {
            var _this = this,
                indicator = this.model.marker.axis_y.value,
                year = parseInt(d3.time.format("%Y")(this.model.time.value), 10),
                colors = ["#00D8ED", "#FC576B", "#FBE600", "#82EB05"],
                padding = 2;

            //scales
            this.yScale = this.model.marker.axis_y.getDomain();
            this.xScale = this.model.marker.axis_x.getDomain();

            if (this.model.marker.axis_y.scale !== "ordinal") {
                this.yScale.range([this.height, 0]).nice();
            } else {
                this.yScale.rangePoints([this.height, 0], padding).range();
            }
            if (this.model.marker.axis_x.scale !== "ordinal") {
                this.xScale.range([0, this.width]).nice();
            } else {
                this.xScale.rangePoints([0, this.width], padding).range();
            }

            this.colorScale = d3.scale.ordinal().range(colors)
                .domain(_.map(geos, function(geo) {
                    return geo.region;
                }));
        },


        drawAxes: function() {
            var _this = this;

            this.yAxis.scale(this.yScale)
                .orient("left")
                .ticks(Math.max(this.height / this.tick_spacing, 2))
                .tickSize(6, 0)
                .tickFormat(function(d) {
                    return _this.model.marker.axis_y.getTick(d);
                });


            this.xAxis.scale(this.xScale)
                .orient("bottom")
                .ticks(Math.max(this.width / this.tick_spacing, 2))
                .tickSize(6, 0)
                .tickFormat(function(d) {
                    return _this.model.marker.axis_x.getTick(d);
                });

            this.xAxisEl.attr("transform", "translate(0," + this.height + ")");

            this.yAxisEl.call(this.yAxis);
            this.xAxisEl.call(this.xAxis);
        },

        drawEntities: function() {

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
        },

        drawLines: function() {
            var _this = this;

            this.line = d3.svg.line()
                .interpolate("cardinal")
                .x(function(d) {
                    return this.xScale(d.time);
                })
                .y(function(d) {
                    return this.yScale(d.value);
                });

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
                    return "translate(" + _this.xScale(d.value.time) + "," + _this.yScale(d.value.value) + ")";
                })
                .attr("x", _this.profiles[_this.getLayoutProfile()].text_padding);
        }
    });

    return LineChart;
});