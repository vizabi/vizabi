//TODO: Rename postrender & resize 
define([
    'd3',
    'underscore',
    'base/component'
], function(d3, _, Component) {

    var profiles = {
        "small": {
            margin: {
                top: 30,
                right: 20,
                left: 40,
                bottom: 40
            },
            tick_spacing: 60
        },
        "medium": {
            margin: {
                top: 30,
                right: 60,
                left: 60,
                bottom: 40
            },
            tick_spacing: 80
        },
        "large": {
            margin: {
                top: 30,
                right: 60,
                left: 60,
                bottom: 40
            },
            tick_spacing: 100
        }
    };

    var size,
        //scales
        xScale,
        yScale,
        radiusScale,
        //axis
        xAxis,
        yAxis,
        //elements
        graph,
        bubbles,
        xAxisEl,
        yAxisEl,
        yearEl,
        //sizes
        height,
        width,
        margin,
        tick_spacing,
        //data
        data, 
        countries = [],
        labels, 
        labels_selected_country,
        indicators;

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

    function key(d) {
        return d.name;
    }

    function position(dot) {

        dot.attr("cy", function(d) {
            return yScale(y(d, indicators[0]));
        })
            .attr("cx", function(d) {
                return xScale(x(d, indicators[1]));
            })  
            .attr("r", function(d) {
                return radiusScale(radius(d, indicators[2]));
            });
    }

    function order(a, b) {
        return radius(b) - radius(a);
    }

    var BubbleChart = Component.extend({
        init: function(context, options) {
            this.name = 'bubble-chart';
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
            bubbles = graph.select('#bubbles');

            this.update();
        },


        /*
         * UPDATE:
         * Executed whenever data is changed
         * Ideally, it contains only operations related to data events
         */
        update: function() {
            data = this.model.getData()[1][0];
            labels = this.model.getData()[0][0];
            indicators = this.model.getState("indicator"),
            categories = this.model.getState("show")["geo.categories"],
            countries = this.model.getState("show")["geo"],
            labels_selected_country = labels.filter(function(row) {
                    return countries.indexOf(row["geo"])>= 0;
            });

            var _this = this,
                year = this.model.getState("time"),
                minValue = _.map(indicators, function(indicator) {
                    return d3.min(data, function(d) {
                        return +d[indicator];
                    })
                }),
                maxValue = _.map(indicators, function(indicator) {
                    return d3.max(data, function(d) {
                        return +d[indicator];
                    })
                }),
                scales = this.model.getState("scale"),

                //10% difference margin in min and max
                min = _.map(scales, function(scale, i) {
                    return ((scale == "log") ? 1 : (minValue[i] - (maxValue[i] - minValue[i]) / 10));
                }),
                max = _.map(scales, function(scale, i) {
                    return maxValue[i] + (maxValue[i] - minValue[i]) / 10;
                }),
                units = this.model.getState("unit") || [1, 1, 1],
                indicator_names = indicators;

            //axis
            yScale = d3.scale[scales[0]]()
                .domain([min[0], max[0]]);

            xScale = d3.scale[scales[1]]()
                .domain([min[1], max[1]]);

            radiusScale = d3.scale[scales[2]]()
                .domain([min[2], max[2]]);

            yAxis = d3.svg.axis()
                .tickFormat(function(d) {
                    return d / units[0];
                }).tickSize(6, 0);

            xAxis = d3.svg.axis()
                .tickFormat(function(d) {
                    return d / units[1];
                }).tickSize(6, 0);

            //bubbles
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

            //size the stage
            this.resizeStage();
            //size the bubbles
            this.resizeBubbles();

            //size year
            widthAxisY = yAxisEl[0][0].getBBox().width;
            heightAxisX = xAxisEl[0][0].getBBox().height;

            yearEl.attr("x", "50%")
                .attr("y", "50%")
                .attr("transform", "translate(" + (-1 * widthAxisY) + ", " + (heightAxisX) + ")");

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

            yearEl.attr("x", "50%")
                .attr("y", "50%")
                .attr("transform", "translate(" + (-1 * widthAxisY) + ", " + (heightAxisX) + ")");
        },

        resizeBubbles: function() {
            //scales
            yScale = yScale.range([height, 0]).nice();
            xScale = xScale.range([0, width]).nice();

            var maxRadius = (this.getLayoutProfile() == "large") ? 50 : 30;
            radiusScale = radiusScale.range([1, maxRadius]);

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

            //bubbles
            bubbles.selectAll(".bubble")
                .call(position)
                .sort(order);
        },

        setYear: function(year) {

            yearEl.text(year);
            bubbles.selectAll(".bubble").remove();
            bubbles.selectAll(".bubble")
                .data(interpolateData(data, labels_selected_country , indicators, year))
                .enter().append("circle")
                .attr("class", "bubble");

            this.resize();
            this.resizeStage();
            this.resizeBubbles();
        }


    });

    // Interpolates the dataset for the given (fractional) year.
    function interpolateData(data, labels, indicators, year) {

        yearData = _.filter(data, function(d) {
            return (d.time == year && 
                        countries.indexOf(d["geo"]) >= 0);
        });

        return yearData.map(function(d) {
            var obj = {
                name: _.findWhere(labels, {
                    "geo.name": d["geo.name"]
                })["geo.name"],
            };
            _.each(indicators, function(indicator) {
                obj[indicator] = d[indicator];
            });

            return obj;
        });
    }

    return BubbleChart;
});