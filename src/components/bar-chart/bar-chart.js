define([
    'd3',
    'underscore',
    'components/component'
], function(d3, _, Component) {
    // TODO: Move these into barchart's space
    var margin = {
        left: 55,
        right: 15,
        top: 15,
        bottom: 10
    },
        formatValue = d3.format(',.1s'),
        x = d3.scale.ordinal(),
        y = d3.scale.linear().nice(),
        xAxis = d3.svg.axis().scale(x).orient('bottom'),
        yAxis = d3.svg.axis().scale(y).orient('left')
            .tickFormat(function(d) {
                return formatValue(d);
            })
            .tickSize(5, 5, 0);

    var barChart = Component.extend({
        init: function(context, options) {
            this.name = 'bar-chart';
            this.template = 'components/' + this.name + '/' + this.name;
            this._super(context, options);
        },

        postRender: function() {
            // Loads data
            var indicator = this.state.yaxis.indicator;
            var indicatorFile = indicator + '.json';
            var waffleFile = 'waffle-' + this.state.language + '.json';
            var dataMan = this.dataManager;

            $.when(
                dataMan.loadWaffle(this.state.waffle.path + waffleFile),
                dataMan.loadStats(this.state.stats.path + indicatorFile, indicator)
            ).done(function() {
                var measures = this.placeholder.node().getBoundingClientRect(),
                    width = measures.width - margin.left - margin.right,
                    height = measures.height - margin.top - margin.bottom;

                x.rangeRoundBands([0, width], .1, .3);
                y.range([height, 0]);

                this.chartArea = this.element
                    .append('g')
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

                this.bar_chart = {}

                this.element.attr('class', this.name);

                this.chartArea.append('g')
                    .attr('class', 'y axis')
                    .call(yAxis);

                this.chartArea.append('g')
                    .attr('class', 'x axis')
                    .attr('transform', 'translate(0,' + height + ')')
                    .call(xAxis);

                // Aliases
                var _this = this;
                var stats = this.dataManager.getStats();
                var waffle = this.dataManager.getWaffle();
                var time = this.state.time;

                // Prepare data
                var show = _.flatten(
                    _.map(this.state.show, function(object, region) {
                        if (object.filter) {
                            return _.map(object.filter, function(d) {
                                return {
                                    category: region,
                                    id: d
                                }
                            });
                        } else {
                            return {
                                category: region,
                                id: undefined
                            }
                        }
                    })
                );

                var things = _this.dataManager.getThing(show);
                var ids = _.map(things, function(t) {
                    return t.id;
                });
                var data = _.pick(stats[indicator], ids);

                // save data preparations
                this.bar_chart.data = {
                    show: show,
                    things: things,
                    ids: ids,
                    data: data
                };

                // Sets x scale domain
                x.domain(_.map(things, function(d) {
                    return d.name;
                }));

                // Sets y scale domain
                y.domain([0, _.max(_.map(data, function(d) {
                    return _.max(_.pluck(d, 'v'));
                }))]);

                // draw axis
                var chart = this.chartArea.selectAll('.bar')
                    .data(ids)
                    .enter();

                chart.append('rect')
                    .attr('class', 'bar')
                    .attr('x', function(d) {
                        return x(things[d].name);
                    })
                    .attr('width', x.rangeBand())
                    .attr('y', function(d) {
                        return y(data[d][time].v);
                    })
                    .attr('height', function(d) {
                        return height - y(data[d][time].v);
                    });

                chart.append('text')
                    .attr('class', 'bar-title')
                    .attr('y', function(d) {
                        return y(data[d][time].v) - 5;
                    })
                    .attr('x', function(d) {
                        return x(things[d].name) + (x.rangeBand() / 2);
                    })
                    .text(function(d) {
                        return things[d].name;
                    });

                this.chartArea.select('.x.axis')
                    .attr('transform', 'translate(0,' + height + ')')
                    .call(xAxis)
                    .selectAll('.tick text')
                    .remove();

                this.chartArea.select('.y.axis')
                    .call(yAxis);

                this.chartArea.append('text')
                    .attr('class', 'title')
                    .attr('transform', 'translate(' + 10 + ',' + 20 + ')')
                    .text(waffle.definitions.indicators[indicator].name);
            }.bind(this));
        },

        resize: function() {
            if (!this.chartArea) return;

            var measures = this.placeholder.node().getBoundingClientRect(),
                width = measures.width - margin.left - margin.right,
                height = measures.height - margin.top - margin.bottom;

            this.element
                .attr('height', measures.height)
                .attr('width', measures.width);

            this.chartArea
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            x.rangeRoundBands([0, width], .1, .3);
            y.range([height, 0]);

            this.chartArea.select('.x.axis')
                .attr('transform', 'translate(0,' + height + ')')
                .call(xAxis);

            this.chartArea.select('.y.axis')
                .call(yAxis);

            // If we have data, be responsive on resize
            if (this.bar_chart.data) {
                var things = this.bar_chart.data.things,
                    data = this.bar_chart.data.data,
                    time = this.state.time;

                // reposition rectangles
                this.chartArea.selectAll('.bar')
                    .each(function(d) {
                        var rect = d3.select(this),
                            rectdata = rect.data();
                        // re-calc bars
                        rect.attr('x', x(things[rectdata].name))
                            .attr('width', x.rangeBand())
                            .attr('y', y(data[rectdata][time].v))
                            .attr('height', height - y(data[rectdata][time].v));
                    });

                // re-position titles
                this.chartArea.selectAll('.bar-title')
                    .each(function(d) {
                        var text = d3.select(this),
                            textData = text.data();
                        // recalc position
                        text.attr('y', y(data[textData][time].v) - 5)
                            .attr('x', x(things[textData].name) + (x.rangeBand() / 2))
                    })
            }
        }
    });

    return barChart;
});