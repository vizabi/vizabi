//TODO: Rename postrender & resize
define([
    'd3',
    'underscore',
    'base/utils',
    'base/component'
], function(d3, _, utils, Component) {

    var
        // SVG related
        width, height, svg, itemsHolder, item, selectedItem, x, minX, maxX,

        // Data related
        indicator, data, year, currentYearData, minValue, maxValue, scale, unit, decimal,

        // HTML refs
        $headerName, $headerRank, $headerIndicator, $barRankWrapper,

        // Postioning and spacing
        margin = {top: 5, right: 5, bottom: 5, left: 5},
        nameOffset = 100,
        rankOffset = 30,
        barOffset = nameOffset + rankOffset + 30,
        valueOffset = 40,
        totalOffset = barOffset + valueOffset,
        itemHeight = 25,
        barHeight = 15;

    var BarChart = Component.extend({
        init: function(context, options) {
            this.name = 'bar-rank';
            this.template = 'components/_gapminder/' + this.name + '/' + this.name;
            this.tool = context;
            this._super(context, options);
        },

        // After loading template, build the chart
        postRender: function() {
            var _this = this;

            // Get the wrapper ref
            $barRankWrapper = $('#bar-rank-wrapper');

            // Get header refs
            $headerName = $('#header-name');
            $headerRank = $('#header-rank');
            $headerIndicator = $('#header-indicator');

            // Subscribe to events
            _this.events.bind('item:filtered', _this.selectHandler.bind(_this));
            _this.events.bind('infobox:closed', _this.deselectHandler.bind(_this));

             // Initialize SVG and place
            svg = d3.select('#bar-rank-chart-holder').append('svg');
            itemsHolder = svg.append('g').attr('class', 'items-wrapper');

            this.update();
        },


        //TODO: Optimize data binding
        update: function() {
            var _this = this;

            indicator = this.model.getState('indicator');
            year = this.model.getState('time');
            data = this.model.getData()[0];
            currentYearData = data.filter(function(row) { return (row.time == year); });
            minValue = d3.min(data, function(d) { return +d[indicator]; });
            maxValue = d3.max(data, function(d) { return +d[indicator]; });
            minX = this.model.getState('min') || ((scale == 'log') ? minValue : 0);
            maxX = this.model.getState('max') || (maxValue + maxValue / 10);
            unit = this.model.getState('unit') || 1;
            decimal = this.model.getState('decimal') || 0;

            $headerIndicator.html(indicator);

            x = d3.scale.linear()
                .domain([minX, maxX]);

            // Add labeled bars for each item
            item = itemsHolder.selectAll('.item')
                .data(currentYearData, function (d) { return d.geo; });

            itemEnter = item
                .enter().append('g')
                .attr('class', 'item')
                .attr('id', function (d) { return d.geo; })
                .on('click', function(d) {
                    var i = d3.select(this);


                    if (i.attr('data-active')) {
                        _this.deselectItem(i);
                    } else {
                        _this.selectItem(i, true);
                    }
                });

            // Item name
            itemEnter.append('text')
                .attr('text-anchor', 'end')
                .attr('class', 'name-label')
                .text(function (d) { return d['geo.name']});


            // Item rank
            itemEnter.append('text')
                .attr('class', 'item-rank')
                .attr('text-anchor', 'middle')
                .text(function(item, i) {
                    return i + 1;
                });

            // Item value
            itemEnter.append('text')
                .attr('dx', 5)
                .attr('text-anchor', 'start')
                .attr('class', 'value-label')
                .text(_this.getValue);

            // Item bar
            itemEnter.append('rect')
                .attr('class', 'bar');

            // Remove bars for removed data
            item.exit().remove();

            // Update bars for changed data
            // Item name
            item.select('.name-label')
                .text(function (d) { return d['geo.name']});

            // Item rank
            item.select('.item-rank')
                .text(function(item, i) {
                    return i + 1;
                });

            // Item value
            item.select('.value-label')
                .attr('x', function(d) { return x(d[indicator] || 0) + barOffset; })
                .text(_this.getValue);

            // Item bar
            item.select('.bar')
                .attr('width', function (d) { return x(d[indicator] || 0); });

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
                    margin = {top: 5, right: 5, bottom: 5, left: 5};
                    break;

                case 'medium':
                    nameOffset = 150;
                    itemHeight = 25;
                    barHeight = 15;
                    margin = {top: 10, right: 10, bottom: 10, left: 10};
                    break;

                case 'large':
                default:
                    nameOffset = 200;
                    itemHeight = 30;
                    barHeight = 20;
                    margin = {top: 20, right: 20, bottom: 20, left: 20};
            }

            barOffset = nameOffset + rankOffset + 30;
            totalOffset = barOffset + valueOffset;

            height = (itemHeight * currentYearData.length) - margin.top - margin.bottom;
            width = $barRankWrapper.width() - margin.left - margin.right;

            // Adjust the width to account for the scrollbar
            if ($barRankWrapper.height() < height) {
                width -= this.getScrollbarWidth();
            }

            x.range([0, width - totalOffset]);

            svg
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom);

            itemsHolder.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            // Setup headers
            $headerName.width(nameOffset + margin.left);
            $headerRank.width(rankOffset * 2);

            item
                .attr('height', itemHeight)
                .attr('data-position', function(item, i) {
                    return i * itemHeight;
                })
                .attr('transform', function(item, i) {
                    return 'translate(0,' + (i * itemHeight) + ')';
                });

            item.select('.name-label')
                .attr('x', nameOffset)
                .attr('y', function (d) {
                    var textHeight = this.getBBox().height;
                    return barHeight - ((barHeight - textHeight));
                });

            // Item rank
            item.select('.item-rank')
                .attr('x', nameOffset + rankOffset)
                .attr('y', function (d) {
                    var textHeight = this.getBBox().height;
                    return barHeight - ((barHeight - textHeight));
                });

            // Item value
            item.select('.value-label')
                .attr('x', function(d) { return x(d[indicator] || 0) + barOffset; })
                .attr('y', function (d) {
                    var textHeight = this.getBBox().height;
                    return barHeight - ((barHeight - textHeight));
                });

            item.select('.bar')
                .attr('x', barOffset)
                .attr('y', 2)
                .attr('height', barHeight)
                .attr('width', function (d) { return x(d[indicator] || 0); });
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
                .attr('transform', function(item, i) {
                    return 'translate(0, ' + (i * itemHeight) + ')';
                });

            item.select('.item-rank')
                .text(function(item, i) {
                    return i + 1;
                });
        },

        updateDetails: function (d) {
            $('#details').html(d['geo.name']);
        },

        selectHandler: function (id) {
            var el = d3.select('#' + id);
            this.selectItem(el, id, true);
        },

        deselectHandler: function (id) {
            var el;
            if (selectedItem) {
                el = d3.select('#' + id);
                this.deselectItem(el);
            }
        },

        selectItem: function (selected, scroll) {
            var id = selected.attr('id');
            selectedItem = selected;

            itemsHolder.selectAll('.item')
                .attr('class', 'item opaque')
                .attr('data-active', null);

            selected
                .attr('class', 'item')
                .attr('data-active', true);

            if (scroll) {
                this.scrollToSelected(selected, true);
            }

            this.events.trigger('item:selected', id);
        },

        deselectItem: function (selected) {
            selectedItem = null;

            itemsHolder.selectAll('.item')
                .attr('class', 'item')
                .attr('data-active', null);

            this.events.trigger('item:deselected');
        },

        scrollToSelected: function (selected, animate) {
            var $holder = $('#bar-rank-chart-holder'),
                holderHeight = $holder.height(),
                selectedPosition = parseInt(selected.attr('data-position'));

            $('#bar-rank-chart-holder').animate({
                'scrollTop': (selectedPosition + itemHeight - holderHeight / 2)
            }, animate ? 150 : 0);
        },

        getValue: function (d) {
            return (parseFloat(d[indicator] || 0) / unit).toFixed(decimal);
        },

        getScrollbarWidth: function () {
            var $outer, $inner, widthNoScroll, widthWithScroll;

            $outer = $('<div />', {css: {'visibility': 'hidden', 'width': '100px'}}).appendTo($('body'));
            widthNoScroll = $outer[0].offsetWidth;
            // force scrollbars
            $outer.css('overflow', 'scroll');
            // add innerdiv
            $inner = $('<div />', {css: {'width': '100%'}}).appendTo($outer);
            widthWithScroll = $inner[0].offsetWidth;
            // remove divs
            $outer.remove;

            return widthNoScroll - widthWithScroll;
        }
    });

    return BarChart;
});