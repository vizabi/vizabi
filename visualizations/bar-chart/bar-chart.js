define([
    'visualizations/vizabi'
], function(Vizabi) {
    var newVizabi = function(core, options) {
        var barChart = new Vizabi(core, options);

        barChart.name = 'bar-chart';
        barChart.getSVG().classed('bar-chart', true);

        // The visualization *state*. This contains the properties of the
        // visualization that is being displayed to the user.
        barChart.state = {
            data: undefined
        };

        // The language of this visualization (*strongly suggested to exist*)
        barChart.language = 'dev';

        var chart = barChart.getSVG().append('g').attr('id', 'chart');
        var xGroup = barChart.getSVG().append('g').attr('id', 'x axis');
        var yGroup = barChart.getSVG().append('g').attr('id', 'y axis');
        var x;
        var y;

        var pushElement = function (svg) {
            if (svg.node().getBBox().x < 0) {
                var offset = -svg.node().getBBox().x;
                svg.select('g').attr('transform', 'translate(' + offset + ',0)');
            } else if (svg.node().getBBox().y < 0) {
                var offset = - svg.node().getBBox().y;
                svg.select('g').attr('transform', 'translate(0,' + offset + ')');
            }
        };

        var renderYAxis = function(width, height) {
            if (!barChart.data) return;

            yGroup.selectAll('g').remove();

            height = +height || 500;

            y = d3.scale.linear()
                .range([height, 0]);

            var max = d3.max(barChart.data, function(d) { return d.value; });

            y.domain([0, max]);

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");

            yGroup.append("g")
              .attr("class", "y axis")
              .call(yAxis);

            pushElement(yGroup);
        }.bind(barChart);

        var renderXAxis = function(width) {
            if (!barChart.data) return;

            xGroup.selectAll('g').remove();

            width = +width || 900;

            x = d3.scale.ordinal()
                .rangeRoundBands([0, width], .1);

            x.domain(barChart.data.map(function(d) { return d.name; }));

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

            xGroup.append("g")
              .attr("class", "x axis")
              .call(xAxis);

            pushElement(xGroup);
        }.bind(barChart);

        var render = function (width, height) {
            if (!barChart.data) return;

            chart.selectAll('.bar').remove();

            width = +width || 900;
            height = +height || 500;

            chart.selectAll(".bar")
              .data(barChart.data)
            .enter().append("rect")
              .attr("class", "bar")
              .attr("x", function(d) { return x(d.name); })
              .attr("y", function(d) { return y(d.value); })
              .attr("height", function(d) { return height - y(d.value); })
              .attr("width", x.rangeBand());
        }.bind(barChart);

        d3.tsv("data.tsv", type, function(error, data) {
          barChart.data = data;
          renderXAxis();
          renderYAxis();
          render();
          barChart.managers.layout.update();
        });

        function type(d) {
          d.value = +d.value; // coerce to number
          return d;
        }

        render();

        barChart.setLayout({
            desktop: {
                yAxis: {
                    element: yGroup,
                    render: renderYAxis,
                    top: 20,
                    bottom: {
                        parent: 'stage',
                        anchor: 'height',
                        padding: -20
                    },
                    left: 20
                },
                xAxis: {
                    element: xGroup,
                    render: renderXAxis,
                    top: {
                        parent: 'yAxis',
                        anchor: 'bottom'
                    },
                    left: {
                        parent: 'yAxis',
                        anchor: 'right'
                    },
                    right: {
                        parent: 'stage',
                        anchor: 'width'
                    }
                },
                chart: {
                    element: chart,
                    render: render,
                    top: {
                        parent: 'yAxis',
                        anchor: 'top'
                    },
                    bottom: {
                        parent: 'yAxis',
                        anchor: 'bottom'
                    },
                    left: {
                        parent: 'xAxis',
                        anchor: 'left'
                    },
                    right: {
                        parent: 'xAxis',
                        anchor: 'right'
                    }
                }
            }
        });

        // console.log('here');
        barChart.managers.layout.update();

        barChart.start = function() {
            return this;
        };

        return barChart;
    };

    return newVizabi;
});
