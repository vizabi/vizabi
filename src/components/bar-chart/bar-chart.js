define([
    'd3',
    'components/component',
    'managers/data/jsonReader'
], function(d3, Component, Reader) {
    var barChart = Component.extend({
        init: function(context, options) {
            this.name = 'bar-chart';
            this.template = "components/" + this.name + "/" + this.name;
            this._super(context, options);
        },

        render: function() {
            this._super(function() {
                var measures = this.placeholder.node().getBoundingClientRect(),
                    margin = 45,
                    width = measures.width - margin * 2,
                    height = measures.height - margin * 2;

                this.chartArea = this.element
                    .append('g')
                    .attr('transform', 'translate(' + margin + ',' + margin + ')');
                this.bar_chart = {};

                this.bar_chart.scales = {
                    x: d3.scale.ordinal()
                        .range([0, width]),
                    y: d3.scale.linear()
                        .range([height, 0])
                        .nice()
                };

                this.bar_chart.xAxis = d3.svg.axis()
                    .scale(this.bar_chart.scales.x)
                    .orient('bottom');

                this.bar_chart.yAxis = d3.svg.axis()
                    .scale(this.bar_chart.scales.y)
                    .orient('left');

                this.element.attr('class', this.name);

                this.chartArea.append('g')
                    .attr('class', 'y axis')
                    .call(this.bar_chart.yAxis);

                this.chartArea.append('g')
                    .attr('class', 'x axis')
                    .attr('transform', 'translate(0,' + height + ')')
                    .call(this.bar_chart.xAxis);
            }.bind(this));
        },

        resize: function() {
            var margin = 45,
                measures = this.placeholder.node().getBoundingClientRect(),
                width = measures.width - margin * 2,
                height = measures.height - margin * 2;

            this.element
                .attr('height', measures.height)
                .attr('width', measures.width);

            this.chartArea
                .attr('transform', 'translate(' + margin + ',' + margin + ')');

            this.bar_chart.scales.x.range([0, width]);
            this.bar_chart.scales.y.range([height, 0]);
                console.log(height);

            this.chartArea.select('.x.axis')
                .attr('transform', 'translate(0,' + height + ')')
                .call(this.bar_chart.xAxis);

            this.chartArea.select('.y.axis')
                .call(this.bar_chart.yAxis);
        }
    });

    return barChart;
});
