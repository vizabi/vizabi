define([
    'visualizations/vizabi'
], function(Vizabi) {
    var newVizabi = function(core, options) {
        var barChart = new Vizabi(core, options);

        barChart.name = 'bar-chart';
        barChart.setContainerClass('bar-chart');

        // The visualization *state*. This contains the properties of the
        // visualization that is being displayed to the user.
        barChart.state = {
        
        };

        // The language of this visualization (*strongly suggested to exist*)
        barChart.language = 'dev';

        barChart.setLayout({
            desktop: {

            }
        });

        barChart.start = function() {
            var margin = {top: 20, right: 30, bottom: 30, left: 40},
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

            var x = d3.scale.ordinal()
                .rangeRoundBands([0, width], .1);

            var y = d3.scale.linear()
                .range([height, 0]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");

            var chart = this.getSVG()
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            d3.tsv("data.tsv", type, function(error, data) {
                console.log(data)
              x.domain(data.map(function(d) { return d.name; }));
              y.domain([0, d3.max(data, function(d) { return d.value; })]);

              chart.append("g")
                  .attr("class", "x axis")
                  .attr("transform", "translate(0," + height + ")")
                  .call(xAxis);

              chart.append("g")
                  .attr("class", "y axis")
                  .call(yAxis);

              chart.selectAll(".bar")
                  .data(data)
                .enter().append("rect")
                  .attr("class", "bar")
                  .attr("x", function(d) { return x(d.name); })
                  .attr("y", function(d) { return y(d.value); })
                  .attr("height", function(d) { return height - y(d.value); })
                  .attr("width", x.rangeBand());
            });

            function type(d) {
              d.value = +d.value; // coerce to number
              return d;
            }

            return this;
        };

        return barChart;
    };

    return newVizabi;
});
