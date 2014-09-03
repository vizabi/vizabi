//TODO: Rename postrender & resize 
define([
    'd3',
    'underscore',
    'base/component'
], function(d3, _, Component) {

    var margin = {
            top: 30,
            right: 60,
            left: 60,
            bottom: 40
        },
        size,
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
        //data
        data, labels, indicators;

    // Various accessors that specify the dimensions of data to visualize.
    function x(d, indicator) {
        return d[indicator];
    }

    function y(d, indicator) {
        return d[indicator];
    }

    function radius(d, indicator) {
        console.log(d, indicator);
        return d[indicator] || 1;
    }

    function key(d) {
        return d.name;
    }

    function position(dot) {

        console.log(">>>> INDICATORS:");
        console.log(indicators);

        console.log(">>>> DOT:");
        console.log(dot);


        dot.attr("cy", function(d) {
            return yScale(y(d, indicators[0]));
        })
            .attr("cx", function(d) {
                return xScale(x(d, indicators[1]));
            })
            .attr("r", function(d) {
                return radiusScale(radius(d, indicators[2]));
            });

        console.log("!!!!!!!!!!POSITIONED!!!!!!!!");
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


        //TODO: Optimize data binding
        update: function() {

            data = this.model.getData()[0];
            labels = this.model.getData()[1];
            indicators = this.model.getState("indicator");

            this.setYear(this.model.getState("time"));

        },

        //draw the graph for the first time
        resize: function() {

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
                data_curr_year = data.filter(function(row) {
                    return row.year == year
                }),
                scales = this.model.getState("scale"),

                min = _.map(scales, function(scale, i) {
                    return ((scale == "log") ? 1 : minValue[i]);
                }),
                max = _.map(scales, function(scale, i) {
                    return maxValue[i];
                }),
                units = this.model.getState("unit") || [1, 1, 1],
                indicator_names = indicators;

            var tick_spacing = 60;

            switch (this.getLayoutProfile()) {
                case "small":
                    margin = {
                        top: 30,
                        right: 20,
                        left: 40,
                        bottom: 40
                    };
                    tick_spacing = 60
                    break;
                case "medium":
                    margin = {
                        top: 30,
                        right: 60,
                        left: 60,
                        bottom: 40
                    };
                    tick_spacing = 80;
                    break;
                case "large":
                default:
                    margin = {
                        top: 30,
                        right: 60,
                        left: 60,
                        bottom: 40
                    };
                    tick_spacing = 100;
                    break;
            }

            height = parseInt(this.element.style("height"), 10) - margin.top - margin.bottom;
            width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;

            graph
                .attr("width", width + margin.right + margin.left)
                .attr("height", height + margin.top + margin.bottom)
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            //scales
            yScale = d3.scale[scales[0]]()
                .domain([min[0], max[0]])
                .range([height, 0])
                .nice();

            xScale = d3.scale[scales[1]]()
                .domain([min[1], max[1]])
                .range([0, width])
                .nice();

            console.log("SCALEEEEEE: ", min[2], max[2]);

            radiusScale = d3.scale[scales[2]]()
                .domain([min[2], max[2]])
                .range([1, 30]);

            //axis
            yAxis = d3.svg.axis()
                .scale(yScale)
                .orient("left");

            xAxis = d3.svg.axis()
                .scale(xScale)
                .orient("bottom");

            //year
            widthAxisY = yAxisEl[0][0].getBBox().width;
            heightAxisX = xAxisEl[0][0].getBBox().height;

            yearEl.attr("x", "50%")
                .attr("y", "50%")
                .attr("transform", "translate(" + (-1 * widthAxisY) + ", " + (heightAxisX) + ")");

            //axis
            xAxisEl
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            yAxis.ticks(Math.max(height / tick_spacing, 2))
                .tickFormat(function(d) {
                    return d / units[0];
                }).tickSize(6, 0);

            xAxis.ticks(Math.max(width / tick_spacing, 2))
                .tickFormat(function(d) {
                    return d / units[1];
                }).tickSize(6, 0);

            //setYear
            var startYear = this.model.getState("time");
            //add a bubble per country
            bubbles.selectAll(".bubble")
                .data(interpolateData(data, labels, indicators, startYear))
                .enter().append("circle")
                .attr("class", "bubble")
                .call(position)
                .sort(order);

            yAxisEl.call(yAxis);
            xAxisEl.call(xAxis);

            this.setYear(startYear);


        },

        setYear: function(year) {
            yearEl.text(year);
            bubbles.selectAll(".bubble")
                .data(interpolateData(data, labels, indicators, year)).call(position).sort(order);
        }


    });

    // Interpolates the dataset for the given (fractional) year.
    function interpolateData(data, labels, indicators, year) {

        yearData = _.filter(data, function(d) {
            return d.year == year;
        });

        return yearData.map(function(d) {
            var obj = {
                name: _.findWhere(labels, {
                    entity: d.entity
                }).name,
            };
            _.each(indicators, function(indicator) {
                obj[indicator] = d[indicator];
            });

            return obj;
        });
    }

    return BubbleChart;
});