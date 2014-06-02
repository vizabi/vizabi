// http://bost.ocks.org/mike/nations/

define([
    'visualizations/vizabi'
], function(Vizabi) {
    var newVizabi = function(core, options) {
        var bubbleChart = new Vizabi(core, options);

        bubbleChart.name = 'bubble-chart';
        bubbleChart.getSVG().classed('bubble-chart', true);
        bubbleChart.data = {};

        bubbleChart.state = {
            year: 1800
        };

        var pushElement = function (svg) {
            if (svg.node().getBBox().x < 0) {
                var offset = -svg.node().getBBox().x;
                svg.select('g').attr('transform', 'translate(' + offset + ',0)');
            } else if (svg.node().getBBox().y < 0) {
                var offset = - svg.node().getBBox().y;
                svg.select('g').attr('transform', 'translate(0,' + offset + ')');
            }
        };

        // Various accessors that specify the four dimensions of data to visualize.
        function x(d) { return d.income; }
        function y(d) { return d.lifeExpectancy; }
        function radius(d) { return d.population; }
        function color(d) { return d.region; }
        function key(d) { return d.name; }

        // Various scales. These domains make assumptions of data, naturally.
        var xScale = d3.scale.log().domain([300, 1e5]),
            yScale = d3.scale.linear().domain([10, 85]),
            radiusScale = d3.scale.sqrt().domain([0, 5e8]).range([0, 40]),
            colorScale = d3.scale.category10();

        // The x & y axes.
        var xAxis = d3.svg.axis().orient("bottom").scale(xScale).ticks(12, d3.format(",d")),
            yAxis = d3.svg.axis().scale(yScale).orient("left");

        var overlay;

        // Create the SVG container and set the origin.
        var chart = bubbleChart.getSVG().append('g').attr('id', 'chart');
        var yGroup = bubbleChart.getSVG().append('g').attr('id', 'yAxis');
        var xGroup = bubbleChart.getSVG().append('g').attr('id', 'xAxis');

        var renderXAxis = function(width, height) {
            if (!bubbleChart.data) return;

            xScale.range([0, +width]);

            xGroup.selectAll('g').remove();
            xGroup.selectAll('text').remove();

            // Add the x-axis.
            xGroup.append("g")
                .attr("class", "x axis")
                .call(xAxis);

            xGroup.append("text")
                .attr("class", "x label")
                .attr("text-anchor", "end")
                .attr("x", width)
                .attr("y", -6)
                .text("income per capita, inflation-adjusted (dollars)");
        }.bind(bubbleChart);

        var renderYAxis = function(width, height) {
            if (!bubbleChart.data) return;

            yGroup.selectAll('g').remove();
            yGroup.selectAll('text').remove();

            yScale.range([+height, 0]);

            yGroup.append("g")
                .attr("class", "y axis")
                .call(yAxis);
            
            pushElement(yGroup);

            yGroup.append("text")
                .attr("class", "y label")
                .attr("text-anchor", "end")
                .attr("y", 22)
                .attr("dy", ".75em")
                .attr("transform", "rotate(-90)")
                .text("life expectancy (years)");
        }.bind(bubbleChart);

        var renderChart = function(width, height) {
            if (!bubbleChart.data) return;

            chart.selectAll('g').remove();
            chart.selectAll('text').remove();
            chart.selectAll('rect').remove();

            var label = chart.append("text")
                .attr("class", "year label")
                .attr("text-anchor", "end")
                .attr("y", height - 24)
                .attr("x", width)
                .text(1800);

            // Add an overlay for the year label.
            var box = label.node().getBBox();

            overlay = chart.append("rect")
                .attr("class", "overlay")
                .attr("x", box.x)
                .attr("y", box.y)
                .attr("width", box.width)
                .attr("height", box.height)
                .on("mouseover", enableInteraction);

          // Add a dot per nation. Initialize the data at 1800, and set the colors.
          var dot = chart.append("g")
              .attr("class", "dots")
            .selectAll(".dot")
              .data(interpolateData(1800))
            .enter().append("circle")
              .attr("class", "dot")
              .style("fill", function(d) { return colorScale(color(d)); })
              .call(position)
              .sort(order);

          // Add a title.
          dot.append("title")
              .text(function(d) { return d.name; });

           // Start a transition that interpolates the data based on year.
           bubbleChart.getSVG().transition()
               .duration(30000)
               .ease("linear")
               .tween("year", tweenYear)
               .each("end", enableInteraction);

               // Tweens the entire chart by first tweening the year, and then the data.
          // For the interpolated data, the dots and label are redrawn.
          function tweenYear() {
            var year = d3.interpolateNumber(bubbleChart.state.year, 2009);
            return function(t) { console.log(t); displayYear(year(t)); };
          }

          // Updates the display to show the specified year.
          function displayYear(year) {
            dot.data(interpolateData(year), key).call(position).sort(order);
            label.text(Math.round(year));
          }

          // Positions the dots based on data.
          function position(dot) {
            dot
                .attr("cx", function(d) { return xScale(x(d)); })
                .attr("cy", function(d) { return yScale(y(d)); })
                .attr("r", function(d) { return radiusScale(radius(d)); });
          }

          // Defines a sort order so that the smallest dots are drawn on top.
          function order(a, b) {
            return radius(b) - radius(a);
          }

          // After the transition finishes, you can mouseover to change the year.
          function enableInteraction() {
            var yearScale = d3.scale.linear()
                .domain([1800, 2009])
                .range([box.x + 10, box.x + box.width - 10])
                .clamp(true);

            // Cancel the current transition, if any.
            bubbleChart.getSVG().transition().duration(0);

            overlay
                .on("mouseover", mouseover)
                .on("mouseout", mouseout)
                .on("mousemove", mousemove)
                .on("touchmove", mousemove);

            function mouseover() {
              label.classed("active", true);
            }

            function mouseout() {
              label.classed("active", false);
            }

            function mousemove() {
                var thisYear = yearScale.invert(d3.mouse(this)[0]);
                bubbleChart.state.year = thisYear;
                displayYear(bubbleChart.state.year);
            }
          }

          // Finds (and possibly interpolates) the value for the specified year.
          function interpolateValues(values, year) {
            // A bisector since many nation's data is sparsely-defined.
            var bisect = d3.bisector(function(d) { return d[0]; });

            var i = bisect.left(values, year, 0, values.length - 1),
                a = values[i];
            if (i > 0) {
              var b = values[i - 1],
                  t = (year - a[0]) / (b[0] - a[0]);
              return a[1] * (1 - t) + b[1] * t;
            }
            return a[1];
          }

          // Interpolates the dataset for the given (fractional) year.
          function interpolateData(year) {
            if (!bubbleChart.data) return;
            return bubbleChart.data.map(function(d) {
              return {
                name: d.name,
                region: d.region,
                income: interpolateValues(d.income, year),
                population: interpolateValues(d.population, year),
                lifeExpectancy: interpolateValues(d.lifeExpectancy, year)
              };
            });
          }
        }.bind(bubbleChart);

        // Load the data.
        d3.json("nations.json", function(nations) {
            bubbleChart.data = nations;
            bubbleChart.managers.layout.update();
        });

        bubbleChart.setLayout({
            desktop: {
                yAxis: {
                    element: yGroup,
                    render: renderYAxis,
                    top: 20,
                    left: 10,
                    bottom: {
                        parent: 'stage',
                        anchor: 'height',
                        padding: -35
                    }
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
                        anchor: 'width',
                        padding: -35
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
                }
            }
        });

        bubbleChart.start = function() {
            return this;
        };

        return bubbleChart;
    };

    return newVizabi;
});
