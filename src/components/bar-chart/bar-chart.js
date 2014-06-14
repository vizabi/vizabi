//TODO: make this more readable
define([
    'd3',
    'underscore',
    'components/component'
], function(d3, _, Component) {

    var width,
        height,
        margin = {
            top: 20,
            right: 20,
            bottom: 30,
            left: 40
        },
        x = d3.scale.ordinal(),
        y = d3.scale.linear(),
        xAxis = d3.svg.axis().scale(x).orient("bottom"),
        yAxis = d3.svg.axis().scale(y).orient("left"),
        graph = null,
        xAxisEl = null,
        yAxisEl = null,
        bars = null,
        year = null;

    var BarChart = Component.extend({
        init: function(context, options) {
            this.name = 'bar-chart';
            this.template = 'components/' + this.name + '/' + this.name;
            
            this._super(context, options);
        },

        //what to do after we load template
        postRender: function() {

            var _this = this;
            var range = this.model.getRange();
            var yearData = this.model.getYearData();

            graph = _this.element.select('#graph');
            xAxisEl = graph.select('#x_axis');
            yAxisEl = graph.select('#y_axis');
            bars = graph.select('#bars');

            y.domain([0, range.maxValue]);

            yAxis.tickFormat(function(d) {
                return d / 1000000000000;
            });
            
            yAxisEl.call(yAxis);

            x.domain(_.map(yearData, function(d, i) {
                return d.id;
            }));

            xAxis.tickFormat(function(d) {
                return _this.model.getData("things")[d].name;
            });

            bars = bars.selectAll(".bar")
                .data(yearData)
                .enter()
                .append("rect")
                .attr("class", "bar");
        },

        //draw the graph for the first time
        resize: function() {
            var tick_spacing = 60;

            switch (this.getLayoutProfile()) {
                case "small":
                    margin = {
                        top: 20,
                        right: 20,
                        bottom: 30,
                        left: 40
                    };
                    break;
                case "medium":
                    margin = {
                        top: 25,
                        right: 25,
                        bottom: 35,
                        left: 50
                    };
                    tick_spacing = 80;
                    break;
                case "large":
                default:
                    margin = {
                        top: 30,
                        right: 30,
                        bottom: 40,
                        left: 60
                    };
                    tick_spacing = 100;
                    break;
            }


            width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;
            height = parseInt(this.element.style("height"), 10) - margin.top - margin.bottom;

            x.rangeRoundBands([0, width], .1, .2);
            y.range([height, 0]);

            yAxis.ticks(Math.max(height / tick_spacing, 2));

            //graph
            graph.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            //axes
            xAxisEl.attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            yAxisEl.call(yAxis);

            bars.attr("x", function(d) {
                return x(d.id);
            })
                .attr("width", x.rangeBand())
                .attr("y", function(d) {
                    return y(d.value);
                })
                .attr("height", function(d) {
                    return height - y(d.value);
                });

        },

        update: function(data) {

            var range = this.model.getRange();
            var yearData = this.model.getYearData();

            y.domain([0, range.maxValue]);

            x.domain(_.map(yearData, function(d, i) {
                return d.id;
            }));

            //TODO: read from data manager
            xAxis.tickFormat(function(d) {
                return d;
            });

            xAxisEl.call(xAxis);

            yAxis.tickFormat(function(d) {
                return d / 1000000000000;
            });

            yAxisEl.call(yAxis);


            bars.data(yearData)
                .attr("x", function(d) {
                    return x(d.id);
                })
                .attr("width", x.rangeBand())
                .attr("y", function(d) {
                    return y(d.value);
                })
                .attr("height", function(d) {
                    return height - y(d.value);
                })
                .exit()
                .remove();
        },

        //load barchart data

    });


    return BarChart;
});