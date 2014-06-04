define([
    'd3',
    'widgets/widget'
], function(d3, Widget) {
    var barChart = Widget.extend({
        init: function(context, options) {
            this.name = 'bar-chart';
            this._super(context, options);
        },

        render: function() {
            var height = 500,
                width = 900,
                margin = 50,
                svg = d3.select(this.placeholder).append('svg')
                    .classed(this.name, true)
                    .attr('height', height + margin * 2).attr('width', width + margin * 2)
                    .append('g'),
                x = d3.scale.ordinal().rangeRoundBands([0, width], .1, .3),
                y = d3.scale.linear().range([height, 0]),
                xAxis = d3.svg.axis().scale(x).orient('bottom'),
                yAxis = d3.svg.axis().scale(y).orient('left');

            var mock = [
                { name: 'Sweden', value: 10 },
                { name: 'Angola', value: 100 },
                { name: 'Magnolia', value: 80 },
                { name: 'Nicole Kidman', value: 50 }
            ];

            x.domain(mock.map(function(d) { return d.name; }));
            y.domain([0, d3.max(mock, function(d) { return d.value; })]);


            svg.append('g')
                .attr('class', 'y axis')
                .attr('transform', 'translate(' + margin + ',' + margin + ')')
                .call(yAxis);

            var chart = svg.selectAll(".bar")
                .data(mock)
                .enter();

            chart.append("rect")
                .attr("class", "bar")
                .attr("x", function(d) { return margin + x(d.name); })
                .attr("width", x.rangeBand())
                .attr("y", function(d) { return margin + 15 + y(d.value); })
                .attr("height", function(d) { return height - 15 - y(d.value); });
            
            chart.append('text')
                .attr('y', function(d) { return margin + 5 + y(d.value); })
                .attr('x', function(d) { return margin + x(d.name) + (x.rangeBand() / 2); })
                .text(function(d) { return d.name; });

            svg.append('g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(' + margin + ',' + (margin + height) + ')')
                .call(xAxis)
                .selectAll('.tick text')
                .remove();
          }
    });

    return barChart;
});
