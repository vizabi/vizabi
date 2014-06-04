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
                    .attr('height', height + margin * 2).attr('width', width + margin * 2)
                    .append('g'),
                x = d3.scale.ordinal(),
                y = d3.scale.linear(),
                xAxis = d3.svg.axis().scale(x).orient('bottom'),
                yAxis = d3.svg.axis().scale(y).orient('left');

            x.rangeRoundBands([0, width], 2, 2);
            y.range([height, 0]);

            svg.append('g')
                .attr('class', 'y axis')
                .attr('transform', 'translate(' + margin + ',' + margin + ')')
                .call(yAxis);

            svg.append('g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(' + margin + ',' + (margin + height) + ')')
                .call(xAxis);
        }
    });

    return barChart;
});
