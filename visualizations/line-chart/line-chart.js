// http://bl.ocks.org/mbostock/3883245 in Vizabi
// Credits to Mike Bostock for the d3 'original' implementation

define([
    'visualizations/vizabi'
], function(Vizabi) {
    var newVizabi = function(core, options) {
        var lineChart = new Vizabi(core, options);

        lineChart.name = 'line-chart';
        lineChart.getSVG().classed('line-chart', true);

        lineChart.data = [];

        var parseDate = d3.time.format("%d-%b-%y").parse;

        var x = d3.time.scale();
        var y = d3.scale.linear();
        var xGroup = lineChart.getSVG().append('g').attr('id', 'x axis');
        var yGroup = lineChart.getSVG().append('g').attr('id', 'y axis');
        var chart = lineChart.getSVG().append('g').attr('id', 'chart');

        var pushElement = function (svg) {
            if (svg.node().getBBox().x < 0) {
                var offset = -svg.node().getBBox().x;
                svg.select('g').attr('transform', 'translate(' + offset + ',0)');
            } else if (svg.node().getBBox().y < 0) {
                var offset = - svg.node().getBBox().y;
                svg.select('g').attr('transform', 'translate(0,' + offset + ')');
            }
        };

        var renderXAxis = function(width, height) {
            if (!lineChart.data) return;

            xGroup.selectAll('g').remove();

            width = +width || 900;
            x.range([0, width]);

            var xAxis = d3.svg.axis().scale(x).orient("bottom");
            
            xGroup.append("g")
              .attr("class", "x axis")
              .call(xAxis);

            pushElement(xGroup);
        }.bind(lineChart);

        var renderYAxis = function(width, height) {
            if (!lineChart.data) return;

            yGroup.selectAll('g').remove();

            height = +height || 500;

            y.range([height, 0]);

            var yAxis = d3.svg.axis().scale(y).orient("left");

            yGroup.append("g")
              .attr("class", "y axis")
              .call(yAxis)
            .append("text")
              .attr("transform", "rotate(-90)")
              .attr("y", 6)
              .attr("dy", ".71em")
              .style("text-anchor", "end")
              .text("Price ($)");

            pushElement(yGroup);
        }.bind(lineChart);

        var renderChart = function(width, height) {
            if (!lineChart.data) return;

            chart.selectAll('path').remove();

            var line = d3.svg.line()
                .x(function(d) { return x(d.date); })
                .y(function(d) { return y(d.close); });

            chart.append("path")
              .datum(lineChart.data)
              .attr("class", "line")
              .attr("d", line);
        }.bind(lineChart);

        lineChart.setLayout({
            desktop: {
                yAxis: {
                    element: yGroup,
                    render: renderYAxis,
                    top: 20,
                    bottom: {
                        parent: 'stage',
                        anchor: 'height',
                        padding: -25
                    },
                    left: 20
                },
                xAxis: {
                    element: xGroup,
                    render: renderXAxis,
                    left: {
                        parent: 'yAxis',
                        anchor: 'right'
                    },
                    right: {
                        parent: 'stage',
                        anchor: 'width',
                        padding: -20
                    },
                    top: {
                        parent: 'yAxis',
                        anchor: 'bottom'
                    }
                },
                chart: {
                    element: chart,
                    render: renderChart,
                    top: {
                        parent: 'yAxis',
                        anchor: 'top'
                    },
                    bottom: {
                        parent: 'xAxis',
                        anchor: 'top'
                    },
                    left: {
                        parent: 'xAxis',
                        anchor: 'left'
                    },
                    right: {
                        parent: 'xAxis',
                        anchor: 'right'
                    }
                },
            }
        });

        lineChart.start = function() {
            d3.tsv("linechart_data.tsv", function(error, data) {
              data.forEach(function(d) {
                d.date = parseDate(d.date);
                d.close = +d.close;
              });

              x.domain(d3.extent(data, function(d) { return d.date; }));
              y.domain(d3.extent(data, function(d) { return d.close; }));

              lineChart.data = data;

              renderYAxis();
              renderXAxis();
              renderChart();

              lineChart.managers.layout.update();
            });

            return this;
        };

        return lineChart;
    };

    return newVizabi;
});
