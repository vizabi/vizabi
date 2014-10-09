//TODO: Rename postrender & resize
define([
    'd3',
    'underscore',
    'base/component'
], function(d3, _, Component) {

    var width,
        height,
        chart,
        itemsWrapper,
        item,
        headers,
        indicator,
        data,
        year,
        currentYearData,
        minValue,
        maxValue,
        scale,
        x,
        minX,
        maxX,
        unit,
        nameOffset = 100,
        rankOffset = 30,
        barOffset = nameOffset + rankOffset + 30,
        valueOffset = 40,
        totalOffset = barOffset + valueOffset,
        barSpacing = 2,
        itemHeight = 20,
        barHeight = 10,
        headersHeight = 20;

    var BarChart = Component.extend({
        init: function(context, options) {
            this.name = 'bar-rank';
            this.template = 'components/' + this.name + '/' + this.name;
            this.tool = context;
            this._super(context, options);
        },

        // After loading template, build the chart
        postRender: function() {
            indicator = this.model.getState("indicator");
            data = this.model.getData()[0];
            year = this.model.getState("time");
            currentYearData = data.filter(function(row) {
                return (row.time == year);
            });
            minValue = d3.min(data, function(d) {
                return +d[indicator];
            });
            maxValue = d3.max(data, function(d) {
                return +d[indicator];
            });
            minX = this.model.getState("min") || ((scale == "log") ? minValue : 0);
            maxX = this.model.getState("max") || (maxValue + maxValue / 10);
            scale = this.model.getState("scale");
            unit = this.model.getState("unit") || 1;

            height = headersHeight + itemHeight * currentYearData.length;
            width = $("#bar-rank-wrapper").width();

            x = d3.scale.linear()
                .domain([minX, maxX])
                .range([0, width - totalOffset]);

            chart = d3.select("#bar-rank-wrapper")
                .append('svg')
                .attr('width', width)
                .attr('height', height);


            // Headers for the chart
            headers = chart.append("g")
                .attr("class", "item-headers");

            headers.append("rect")
                .attr("class", "item-headers")
                .attr("width", width)
                .attr("height", headersHeight);

            headers.append("text")
                .text("Name")
                .attr("class", "name-title header-title")
                .attr("x", nameOffset)
                .attr("y", 15)
                .attr("text-anchor", "end")

            headers.append("text")
                .text("Rank")
                .attr("class", "rank-title header-title")
                .attr("x", nameOffset + rankOffset)
                .attr("y", 15)
                .attr("text-anchor", "middle");

            headers.append("text")
                .text("Population")
                .attr("class", "population-title header-title")
                .attr("x", barOffset)
                .attr("y", 15);

            // Wrapper for the items
            itemsWrapper = chart.append('g')
                .attr('class', 'items-wrapper')
                .attr('transform', 'translate(0, ' + headersHeight + ')');

            this.update();
        },


        //TODO: Optimize data binding
        update: function() {
            var _this = this;

            year = this.model.getState("time");
            data = this.model.getData()[0];
            currentYearData = data.filter(function(row) {
                return (row.time == year);
            });
            minValue = d3.min(data, function(d) {
                return +d[indicator];
            });
            maxValue = d3.max(data, function(d) {
                return +d[indicator];
            });
            minX = this.model.getState("min") || ((scale == "log") ? minValue : 0);
            maxX = this.model.getState("max") || (maxValue + maxValue / 10);

            x.domain([minX, maxX]);

            // Add labeled bars for each item
            item = itemsWrapper.selectAll(".item")
                .data(currentYearData, function (d) { return d.geo; });

            itemEnter = item
                .enter().append("g")
                .attr("class", "item")
                .attr("transform", function(item, i) {
                    return "translate(0," + (i * itemHeight) + ")";
                })
                .on("click", function(d) {
                    var i = d3.select(this);

                    if (!i.attr('data-active')) {
                        itemsWrapper.selectAll('.item').attr('class', 'item opaque');
                        i
                            .attr('class', 'item')
                            .attr('data-active', true);
                        // _this.updateDetails(d);
                    } else {
                        itemsWrapper.selectAll('.item').attr('class', 'item');
                        i.attr('data-active', null);
                    }
                });

            // Item name
            itemEnter.append("text")
                .attr("x", nameOffset)
                .attr("y", 15)
                .attr("text-anchor", "end")
                .attr('class', 'name-label')
                .text(function (d) { return d['geo.name']});


            // Item rank
            itemEnter.append("text")
                .attr("class", "item-rank")
                .attr("x", nameOffset + rankOffset)
                .attr("y", 15)
                .attr("text-anchor", "middle")
                .text(function(item, i) {
                    return i + 1;
                });

            // Item value
            itemEnter.append("text")
                .attr("x", function(d) { return x(d[indicator]) + barOffset; })
                .attr("y", 15)
                .attr("dx", 5)
                .attr("text-anchor", "start")
                .attr('class', 'value-label')
                .text(function (d) {
                    var value = d[indicator]
                    num = parseInt(value, 10) / unit,
                    rounded = Math.round(num * 10) / 10;
                    return rounded;
                });

            // Item bar
            itemEnter.append("rect")
                .attr("class", "bar")
                .attr("x", barOffset)
                .attr("y", 5)
                .attr("width", function (d) { return x(d[indicator]); })
                .attr("height", barHeight);

            // Remove bars for removed data
            item.exit().remove();

            // Update bars for changed data
            // Item name
            item.select(".name-label")
                .text(function (d) { return d['geo.name']});

            // Item rank
            item.select(".item-rank")
                .text(function(item, i) {
                    return i + 1;
                });

            // Item value
            item.select(".value-label")
                .attr("x", function(d) { return x(d[indicator]) + barOffset; })
                .text(function (d) {
                    var value = d[indicator]
                    num = parseInt(value, 10) / unit,
                    rounded = Math.round(num * 10) / 10;
                    return rounded;
                });

            // Item bar
            item.select(".bar")
                .attr("width", function (d) { return x(d[indicator]); });

            this.sortBars();
            this.resize();
        },

        resize: function() {
            var layout = this.getLayoutProfile();

            switch(layout) {
                case 'small':
                    nameOffset = 100;
                    break;

                case 'medium':
                    nameOffset = 150;
                    break;

                case 'large':
                default:
                    nameOffset = 200;
            }

            barOffset = nameOffset + rankOffset + 30;
            totalOffset = barOffset + valueOffset;

            height = headersHeight + itemHeight * currentYearData.length;
            width = $("#bar-rank-wrapper").width();

            x.range([0, width - totalOffset]);

            chart
                .attr('width', width)
                .attr('height', height);

            headers.select("rect")
                .attr("width", width);

            headers.select(".name-title")
                .attr("x", nameOffset);

            headers.select(".rank-title")
                .attr("x", nameOffset + rankOffset);

            headers.select(".population-title")
                .attr("x", barOffset);

            item.select(".name-label")
                .attr("x", nameOffset);

            // Item rank
            item.select(".item-rank")
                .attr("x", nameOffset + rankOffset);

            // Item value
            item.select(".value-label")
                .attr("x", function(d) { return x(d[indicator]) + barOffset; })
                .text(function (d) {
                    var value = d[indicator]
                    num = parseInt(value, 10) / unit,
                    rounded = Math.round(num * 10) / 10;
                    return rounded;
                });

            item.select(".bar")
                .attr("x", barOffset)
                .attr("width", function (d) { return x(d[indicator]); });
        },

        sortBars: function () {

            var sortItems = function (a, b) {
                return parseInt(b[indicator]) - parseInt(a[indicator]);
            }

            item
                .sort(sortItems)
                .transition()
                // .delay(function (d, i) {
                //     return i * 20;
                // })
                .duration(150)
                .attr("transform", function(item, i) {
                    return "translate(0, " + (i * itemHeight) + ")";
                });

            item.select(".item-rank")
                .text(function(item, i) {
                    return i + 1;
                });
        },

        updateDetails: function (d) {
            $("#details").html(d['geo.name']);
        }
    });

    return BarChart;
});