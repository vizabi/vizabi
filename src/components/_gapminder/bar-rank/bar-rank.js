//TODO: Rename postrender & resize
define([
    'd3',
    'underscore',
    'base/utils',
    'base/component'
], function(d3, _, utils, Component) {

    var
        // SVG related
        svg, itemsHolder, item, selectedItems, x, gradient, tooltip,

        // Data related
        data, displayData, minValue, maxValue, scale, unit, decimal, indicator, year,

        // HTML refs
        $headerName, $headerRank, $headerIndicator, $barRankWrapper,

        // General sizing
        itemHeight, barHeight, textVerticalOffset;

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
            _this.events.bind('item:filtered', _this.triggerSelect.bind(_this));
            _this.events.bind('infobox:closed', _this.triggerDeselect.bind(_this));

             // Initialize SVG and place
            svg = d3.select('#bar-rank-chart-holder').append('svg');
            itemsHolder = svg.append('g')
                .attr('class', 'items-wrapper')
                .on('click', function(d) {
                    var $target = $(d3.event.target)
                        item = $target.parent('.item');

                    if (!item) {
                        return;
                    }

                    item = utils.jQueryToD3(item);
                    if (item.attr('data-active')) {
                        _this.deselectItem(item);
                    } else {
                        _this.selectItem(item);
                    }
                });

            // Define gradient fading the long names
            gradient = svg.append("svg:defs")
                .append("svg:linearGradient")
                .attr("id", "name-cover");

            // Define the gradient colors
            gradient.append("svg:stop")
                .attr("offset", "0")
                .attr("stop-color", "#ffffff")
                .attr("stop-opacity", 0.5);

            gradient.append("svg:stop")
                .attr("offset", "50%")
                .attr("stop-color", "#ffffff")
                .attr("stop-opacity", 1);

            gradient.append("svg:stop")
                .attr("offset", "100%")
                .attr("stop-color", "#ffffff")
                .attr("stop-opacity", 1);

            this.update();
        },

        //TODO: Optimize data binding
        update: function() {
            var _this = this,
                minX, maxX;

            indicator = this.model.getState('indicator');
            scale = this.model.getState('scale');
            year = this.model.getState('time');
            data = this.model.getData()[0];
            displayData = data.filter(function(row) { return (row.time == year); });
            minValue = d3.min(data, function(d) { return +d[indicator]; });
            maxValue = d3.max(data, function(d) { return +d[indicator]; });
            minX = this.model.getState('min') || ((scale == 'log') ? minValue : 0);
            maxX = this.model.getState('max') || (maxValue + maxValue / 10);
            unit = this.model.getState('unit') || 1;
            decimal = this.model.getState('decimal') || 0;

            // Keep current version if it's already selected or get it from the state
            selectedItems = selectedItems || _.clone(this.model.getState('selected'));

            $headerIndicator.html(indicator);

            x = d3.scale.linear()
                .domain([minX, maxX]);

            // Add labeled bars for each item
            item = itemsHolder.selectAll('.item')
                .data(displayData, function (d) { return d.geo; });

            itemEnter = item
                .enter().append('g')
                .attr('class', 'item')
                .attr('id', function (d) { return d.geo; });

            // Item background it makes the whole "row" clickable
            itemEnter.append('rect')
                .attr('class', 'item-bg');

            // Item name
            itemEnter.append('text')
                .attr('class', 'name-label')
                .attr('title', function (d) { return d['geo.name']})
                .text(function (d) { return d['geo.name']});

            // Item rank
            itemEnter.append('text')
                .attr('class', 'item-rank')
                .attr('text-anchor', 'middle')
                .text(function(item, i) {
                    return i + 1;
                });

            // Fade out the long name
            itemEnter.append('rect')
                .attr('class', 'name-cover')
                .attr('fill', 'url(#name-cover)');

            // Cover for the name if it's too long when it slips into the bar area
            itemEnter.append('rect')
                .attr('class', 'bar-bg');

            // Item bar
            itemEnter.append('rect')
                .attr('class', 'bar');

            // Item value
            itemEnter.append('text')
                .attr('dx', 5)
                .attr('text-anchor', 'start')
                .attr('class', 'value-label')
                .text(_this.getValue);

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
                .text(_this.getValue);

            this.resize();
            this.sortBars();

            // If there is a selected item, update the scroll position
            if (selectedItems.length) {
                selectedItems.forEach(function (item, index, items) { _this.triggerSelect(item) });
            }
        },

        resize: function() {
            var _this = this,
                layout = this.getLayoutProfile(),
                width, height,
                margin, nameOffset, nameWidth, rankOffset, barOffset, valueOffset, totalOffset;

            switch(layout) {
                case 'small':
                    nameOffset = 20;
                    nameWidth = 100;
                    itemHeight = 25;
                    barHeight = 15;
                    rankOffset = 20;
                    valueOffset = 40;
                    textVerticalOffset = 1.5;
                    margin = {top: 5, right: 5, bottom: 5, left: 5};
                    break;

                case 'medium':
                    nameOffset = 20;
                    nameWidth = 150;
                    itemHeight = 25;
                    barHeight = 15;
                    rankOffset = 20;
                    valueOffset = 40;
                    textVerticalOffset = 1.5;
                    margin = {top: 5, right: 10, bottom: 10, left: 10};
                    break;

                case 'large':
                default:
                    nameOffset = 30;
                    nameWidth = 200;
                    itemHeight = 30;
                    barHeight = 20;
                    rankOffset = 30;
                    valueOffset = 40;
                    textVerticalOffset = 1.2;
                    margin = {top: 5, right: 20, bottom: 20, left: 20};
            }

            barOffset = nameWidth + nameOffset + (rankOffset * 2);
            totalOffset = barOffset + valueOffset;

            height = (itemHeight * displayData.length) - margin.top - margin.bottom;
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
            $headerName.width(nameWidth + nameOffset);
            $headerRank.width(rankOffset * 2 + margin.left);

            item
                .attr('height', itemHeight)
                .attr('data-position', function(item, i) {
                    return i * itemHeight;
                })
                .attr('transform', function(item, i) {
                    return 'translate(0,' + (i * itemHeight) + ')';
                });

            item.select('.name-label')
                .attr('x', nameOffset + rankOffset)
                .attr('y', _this.getTextPosition)
                .attr('width', nameOffset + nameWidth);

            // Item rank
            item.select('.item-rank')
                .attr('x', rankOffset)
                .attr('y', _this.getTextPosition);

            item.select('.name-cover')
                .attr('x', barOffset - 30)
                .attr('y', 0)
                .attr('height', itemHeight)
                .attr('width', 30);

            item.select('.item-bg')
                .attr('x', 0)
                .attr('y', 0)
                .attr('height', itemHeight)
                .attr('width', width);

            item.select('.bar-bg')
                .attr('x', barOffset)
                .attr('y', 0)
                .attr('height', itemHeight)
                .attr('width', width - totalOffset);

            item.select('.bar')
                .attr('x', barOffset)
                .attr('y', (itemHeight - barHeight) / 2)
                .attr('height', barHeight)
                .attr('width', function (d) { return x(d[indicator] || 0); });

            // Item value
            item.select('.value-label')
                .attr('x', function(d) { return x(d[indicator] || 0) + barOffset; })
                .attr('y', _this.getTextPosition);
        },

        sortBars: function () {

            var sortItems = function (a, b) {
                return parseFloat(b[indicator] || 0) - parseFloat(a[indicator] || 0);
            }

            item
                .sort(sortItems)
                .attr('data-position', function(item, i) {
                    return i * itemHeight;
                })
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

        triggerSelect: function (id) {
            var el = d3.select('#' + id);
            this.selectItem(el, true);
        },

        triggerDeselect: function (id) {
            var el;
            if (selectedItems.length && selectedItems.indexOf(id) > -1) {
                el = d3.select('#' + id);
                this.deselectItem(el);
            }
        },

        selectItem: function (selected, scroll) {
            var id = selected.attr('id');

            selectedItems.push(id);
            selectedItems = _.uniq(selectedItems);

            itemsHolder.selectAll('.item')
                .filter(function (d, i) {
                    return selectedItems.indexOf(d.geo) === -1;
                    // return !d3.select(this).attr('data-active');
                })
                .attr('class', 'item opaque')
                .attr('data-active', null);

            selected
                .attr('class', 'item selected')
                .attr('data-active', true);

            if (scroll) {
                this.scrollToSelected(selected, true);
            }

            this.events.trigger('item:selected', id);
        },

        deselectItem: function (selected) {
            var id = selected.attr('id');

            selectedItems = _.reject(selectedItems, function (item) { return item === id; });

            selected
                .attr('data-active', null);

            // Clear all items if nothing is left selected
            if (!selectedItems.length) {
                itemsHolder.selectAll('.item')
                    .attr('class', 'item')
                    .attr('data-active', null);
            } else {
                selected
                    .attr('class', 'item opaque');

                this.scrollToSelected(d3.select('#' + _.last(selectedItems)), true);
            }

            this.events.trigger('item:deselected', id);
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

        getTextPosition: function (d) {
            var textHeight = Math.floor(this.getBBox().height),
                diff = itemHeight - textHeight;

            return itemHeight - diff  / textVerticalOffset;
        },

        getTextWidth: function (d) {
            return this.getBBox().width;
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
            $outer.remove();

            return widthNoScroll - widthWithScroll
        }
    });

    return BarChart;
});