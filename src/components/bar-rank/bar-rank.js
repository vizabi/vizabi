//TODO: Rename postrender & resize
define([
    'd3',
    'underscore',
    'base/utils',
    'base/component'
], function(d3, _, utils, Component) {

    var width,
        height,
        svg,
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
        selectedItem,
        margin = {top: 5, right: 5, bottom: 5, left: 5},
        nameOffset = 100,
        rankOffset = 30,
        barOffset = nameOffset + rankOffset + 30,
        valueOffset = 40,
        totalOffset = barOffset + valueOffset,
        barSpacing = 2,
        itemHeight = 25,
        barHeight = 15,
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
            var _this = this;

            // Subscribe to events
            _this.events.bind('select:item', _this.selectTrigger.bind(_this));
            _this.events.bind('deselect:item', _this.deselectTrigger.bind(_this));

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

            height = (headersHeight + itemHeight * currentYearData.length) - margin.top - margin.bottom;
            width = $("#bar-rank-wrapper").width() - margin.left - margin.right;

            x = d3.scale.linear()
                .domain([minX, maxX])
                .range([0, width - totalOffset]);

            svg = d3.select("#bar-rank-wrapper")
                .append('svg');

            chart = svg.append('g');

            // Headers for the chart
            headers = chart.append("g")
                .attr("class", "item-headers");

            headers.append("rect")
                .attr("class", "item-headers");

            headers.append("text")
                .text("Name")
                .attr("class", "name-title header-title")
                .attr("text-anchor", "end")

            headers.append("text")
                .text("Rank")
                .attr("class", "rank-title header-title")
                .attr("text-anchor", "middle");

            headers.append("text")
                .text(indicator)
                .attr("class", "indicator-title header-title");

            // Wrapper for the items
            itemsWrapper = chart.append('g')
                .attr('class', 'items-wrapper');

            this.update();
        },


        //TODO: Optimize data binding
        update: function() {
            var _this = this;

            indicator = this.model.getState("indicator");
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

            headers.select(".indicator-title")
                .text(indicator)

            // Add labeled bars for each item
            item = itemsWrapper.selectAll(".item")
                .data(currentYearData, function (d) { return d.geo; });

            itemEnter = item
                .enter().append("g")
                .attr("class", "item")
                .attr("id", function (d) { return d.geo; })
                .attr("transform", function(item, i) {
                    return "translate(0," + (i * itemHeight) + ")";
                })
                .on("click", function(d) {
                    var i = d3.select(this);

                    if (!i.attr('data-active')) {
                        _this.selectItem(i, true);
                    } else {
                        _this.deselectItem(i);
                    }
                });

            // Item name
            itemEnter.append("text")
                .attr("text-anchor", "end")
                .attr('class', 'name-label')
                .text(function (d) { return d['geo.name']});


            // Item rank
            itemEnter.append("text")
                .attr("class", "item-rank")
                .attr("text-anchor", "middle")
                .text(function(item, i) {
                    return i + 1;
                });

            // Item value
            itemEnter.append("text")
                .attr("dx", 5)
                .attr("text-anchor", "start")
                .attr('class', 'value-label')
                .text(function (d) {
                    var value = d[indicator],
                    num = parseInt(value, 10) / unit,
                    rounded = Math.round(num * 10) / 10;
                    return rounded;
                });

            // Item bar
            itemEnter.append("rect")
                .attr("class", "bar");

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
                    var value = d[indicator],
                    num = parseInt(value, 10) / unit,
                    rounded = Math.round(num * 10) / 10;
                    return rounded;
                });

            // Item bar
            item.select(".bar")
                .attr("width", function (d) { return x(d[indicator]); });

            // If there is a slected item, update the scroll position
            if (selectedItem) {
                _this.scrollToSelected(selectedItem, false);
            }

            this.sortBars();
            this.resize();
        },

        resize: function() {
            var layout = this.getLayoutProfile();

            switch(layout) {
                case 'small':
                    nameOffset = 100;
                    itemHeight = 25;
                    barHeight = 15;
                    headersHeight = 20;
                    margin = {top: 5, right: 5, bottom: 5, left: 5};
                    break;

                case 'medium':
                    nameOffset = 150;
                    itemHeight = 25;
                    barHeight = 15;
                    headersHeight = 25;
                    margin = {top: 10, right: 10, bottom: 10, left: 10};
                    break;

                case 'large':
                default:
                    nameOffset = 200;
                    itemHeight = 30;
                    barHeight = 20;
                    headersHeight = 30;
                    margin = {top: 20, right: 20, bottom: 20, left: 20};
            }

            barOffset = nameOffset + rankOffset + 30;
            totalOffset = barOffset + valueOffset;

            height = (headersHeight + itemHeight * currentYearData.length) - margin.top - margin.bottom;
            width = $("#bar-rank-wrapper").width() - margin.left - margin.right;

            x.range([0, width - totalOffset]);

            svg
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom);

            chart.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            headers.select("rect")
                .attr("width", width)
                .attr("height", headersHeight);

            headers.select(".name-title")
                .attr("x", nameOffset)
                .attr("y", headersHeight - 7);

            headers.select(".rank-title")
                .attr("x", nameOffset + rankOffset)
                .attr("y", headersHeight - 7);

            headers.select(".indicator-title")
                .attr("x", barOffset)
                .attr("y", headersHeight - 7);

            itemsWrapper.attr('transform', 'translate(0, ' + headersHeight + ')')

            item.attr('height', itemHeight);

            item.select(".name-label")
                .attr("x", nameOffset)
                .attr("y", function (d) {
                    var textHeight = this.getBBox().height;
                    return barHeight - ((barHeight - textHeight));
                });

            // Item rank
            item.select(".item-rank")
                .attr("x", nameOffset + rankOffset)
                .attr("y", function (d) {
                    var textHeight = this.getBBox().height;
                    return barHeight - ((barHeight - textHeight));
                });

            // Item value
            item.select(".value-label")
                .attr("x", function(d) { return x(d[indicator]) + barOffset; })
                .attr("y", function (d) {
                    var textHeight = this.getBBox().height;
                    return barHeight - ((barHeight - textHeight));
                })
                .text(function (d) {
                    var value = d[indicator],
                    num = parseFloat(value) / unit,
                    rounded = num.toFixed(2);
                    return rounded;
                });

            item.select(".bar")
                .attr("x", barOffset)
                .attr("y", 2)
                .attr("height", barHeight)
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
        },

        selectTrigger: function (id) {
            var el = d3.select('#' + id);
            this.selectItem(el, true);
        },

        deselectTrigger: function (id) {
            var el = d3.select('#' + id);
            this.deselectItem(el);
        },

        selectItem: function (selected, scroll) {
            selectedItem = selected;

            itemsWrapper.selectAll('.item')
            .attr('class', 'item opaque');

            selected
            .attr('class', 'item')
            .attr('data-active', true);

            if (scroll) {
                this.scrollToSelected(selected, true);
            }
        },

        deselectItem: function (selected) {
            selectedItem = null;

            itemsWrapper.selectAll('.item').attr('class', 'item');
            selected.attr('data-active', null);
        },

        scrollToSelected: function (selected, animate) {
            var $itemsWrapper, $selected, itemsWrapperHeight, selectedPosition;

            $itemsWrapper = $('#bar-rank-wrapper');
            $selected = utils.d3ToJquery(selected);
            itemsWrapperHeight = $itemsWrapper.height();
            // TODO:
            // Sure there must be a better way
            selectedPosition = selected.attr('transform').split(',')[1];
            selectedPosition = parseInt(selectedPosition.substring(0, selectedPosition.length - 1)) + headersHeight;
            $itemsWrapper.animate({'scrollTop': (selectedPosition - itemsWrapperHeight / 2)}, animate ? 150 : 0);
        }
    });

    return BarChart;
});