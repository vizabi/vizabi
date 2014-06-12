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

            var _this = this,
                defer = $.Deferred(),
                promise = this.loadData();

            graph = _this.element.select('#graph');
            xAxisEl = graph.select('#x_axis');
            yAxisEl = graph.select('#y_axis');
            bars = graph.select('#bars');
            year = _this.model.getState("time");

            promise.then(function() {

                var data_filter = prepareDataFilter(_this.model.getState("show")),
                    ids = _.map(data_filter, function(i) {
                        return i.id
                    });

                var indicator = _this.model.getState("yaxis").indicator,
                    stats = _this.dataManager.getStats();

                _this.things = _this.dataManager.getThing(data_filter);
                _this.data = _.pick(stats[indicator], ids);

                year = _this.model.getState("time");

                y.domain([0, 100000000000000]);

                yAxis.tickFormat(function(d) {
                    return d / 1000000000000;
                });
                yAxisEl.call(yAxis);

                x.domain(_.map(_this.data, function(d, i) {
                    return i;
                }));

                xAxis.tickFormat(function(d) {
                    return _this.things[d].name;
                });

                var year_data = _.map(_this.data, function(d, i) {
                    return {
                        id: i,
                        value: d[year].v
                    }
                });

                bars = bars.selectAll(".bar")
                            .data(year_data)
                            .enter()
                            .append("rect")
                            .attr("class", "bar");

                //this component is ready
                defer.resolve();

            });

            return defer;

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

            //TODO: adjust the number of ticks
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

        update: function() {

            if (this.data) {

                var _this = this,
                    data_filter = prepareDataFilter(this.model.getState("show")),
                    ids = _.map(data_filter, function(i) {
                        return i.id
                    });

                var indicator = this.model.getState("yaxis").indicator,
                    stats = this.dataManager.getStats();

                this.things = this.dataManager.getThing(data_filter);
                this.data = _.pick(stats[indicator], ids);

                //TODO: check the max value of all years
                y.domain([0, 100000000000000]);

                x.domain(_.map(this.data, function(d, i) {
                    return i;
                }));

                //TODO: read from data manager
                xAxis.tickFormat(function(d) {
                    return d;
                });

                xAxisEl.call(xAxis);

                yAxis.tickFormat(function(d) {
                    return d / 1000000000000;
                });

                year = this.model.getState("time");

                var year_data = _.map(this.data, function(d, i) {
                    return {
                        id: i,
                        value: d[year].v
                    }
                });

                bars.data(year_data)
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

            }

        },

        //load barchart data
        loadData: function() {

            var _this = this,
                defer = $.Deferred();

            var indicator = this.model.getState("yaxis").indicator,
                indicatorFile = 'stats/' + indicator + '.json',
                waffleFile = 'waffle-' + this.model.getState("language") + '.json',
                dataMan = this.dataManager;

            var data_filter = prepareDataFilter(this.model.getState("show")),
                ids = _.map(data_filter, function(i) {
                    return i.id
                });

            //load data and resolve the defer when it's done
            $.when(
                dataMan.loadWaffle(this.model.getData("path") + waffleFile),
                dataMan.loadStats(this.model.getData("path") + indicatorFile, indicator)
            ).done(function() {
                //getting data from data manager
                var stats = _this.dataManager.getStats();
                var waffle = _this.dataManager.getWaffle();
                //get more info about each thing
                _this.things = _this.dataManager.getThing(data_filter);
                //filter data by id
                _this.data = _.pick(stats[indicator], ids);

                defer.resolve();
            });

            return defer;
        }
    });

    function draw() {

    }


    //Transform data filter into shallow version

    function prepareDataFilter(show) {

        var result = [];
        //iterate over each category we want to show
        for (var reg_type in show) {
            //if category has sub filters, add them instead
            if (show[reg_type].hasOwnProperty("filter")) {
                for (var reg in show[reg_type].filter) {
                    result.push({
                        category: reg_type,
                        id: show[reg_type].filter[reg]
                    });
                }
            }
            //if not, add the category itself (e.g.: world)
            else {
                result.push({
                    category: reg_type,
                    id: reg_type
                });
            }
        }
        return result;
    };

    return BarChart;
});