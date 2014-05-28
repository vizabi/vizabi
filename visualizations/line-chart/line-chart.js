define([
    'visualizations/vizabi'
], function(Vizabi) {
    var newVizabi = function(core, options) {
        var lineChart = new Vizabi(core, options);

        lineChart.name = 'line-chart';
        lineChart.setContainerClass('line-chart');

        // The visualization *state*. This contains the properties of the
        // visualization that is being displayed to the user.
        lineChart.state = {
        
        };

        // The language of this visualization (*strongly suggested to exist*)
        lineChart.language = 'dev';

        lineChart.setLayout({
            desktop: {

            }
        });

        lineChart.start = function() {
            var margin = {top: 20, right: 20, bottom: 30, left: 50},
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

            var parseDate = d3.time.format("%d-%b-%y").parse;

            var x = d3.time.scale()
                .range([0, width]);

            var y = d3.scale.linear()
                .range([height, 0]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");

            var line = d3.svg.line()
                .x(function(d) { return x(d.date); })
                .y(function(d) { return y(d.close); });

            var svg = this.getSVG().append("g")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            d3.tsv("line-chart.tsv", function(error, data) {
              data.forEach(function(d) {
                d.date = parseDate(d.date);
                d.close = +d.close;
              });

              x.domain(d3.extent(data, function(d) { return d.date; }));
              y.domain(d3.extent(data, function(d) { return d.close; }));

              svg.append("g")
                  .attr("class", "x axis")
                  .attr("transform", "translate(0," + height + ")")
                  .call(xAxis);

              svg.append("g")
                  .attr("class", "y axis")
                  .call(yAxis)
                .append("text")
                  .attr("transform", "rotate(-90)")
                  .attr("y", 6)
                  .attr("dy", ".71em")
                  .style("text-anchor", "end")
                  .text("Price ($)");

              svg.append("path")
                  .datum(data)
                  .attr("class", "line")
                  .attr("d", line);
            });

            return this;
        };

        return lineChart;
    };

    return newVizabi;
});
