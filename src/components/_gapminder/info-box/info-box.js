define([
    'jquery',
    'underscore',
    'base/component'
], function($, _, Component) {

    var data,
        year,
        currentYearData,
        indicator,
        $infoWrapper,
        totalValue,
        top5Value,
        top5Percent,
        selectedItems,
        unit,
        decimal,
        unitLabel,
        units = {
            '1000000': 'million'
        },
        infoTemplate = _.template([
            '<div id="<%= id %>">',
                '<a href="#" class="info-box-close">x</a>',
                '<div class="info-box-placeholder"><%= indicator %> for <%= name %>: <%= total %> <%= unitLabel %></div>',
                '<div class="info-box-placeholder"><%= percent %>% of the World</div>',
            '</div>'].join(''));

    var InfoBox = Component.extend({
        init: function(context, options) {
            this.name = 'info-box';
            this.template = 'components/_gapminder/' + this.name + '/' + this.name;
            this.tool = context;
            this._super(context, options);
        },

        postRender: function() {
            var _this = this;

            $infoWrapper = $('#info-box-wrapper');

            // Subscribe to events
            _this.events.bind('item:selected', _this.updateSelectedInfo.bind(_this));
            _this.events.bind('item:deselected', _this.deselectedHandler.bind(_this));

            $infoWrapper.on('click', '.info-box-close', function (event) {
                event.preventDefault();
                _this.deselectedHandler($(this).parent().data('selected'));
            });

            this.update();
        },

        update: function() {
            var _this = this;

            data = this.model.getData()[0];
            year = this.model.getState('time');
            indicator = this.model.getState('indicator');
            unit = this.model.getState('unit') || 1;
            unitLabel = units[unit] || '';
            decimal = this.model.getState('decimal') || 0;
            currentYearData = data.filter(function(row) {
                return (row.time == year);
            }).sort(function (a, b) {
                return _this.getValue(b) - _this.getValue(a);
            });
            selectedItems = selectedItems || _.clone(this.model.getState('selected'));

            totalValue = currentYearData.reduce(function(pv, cv) { return pv + _this.getValue(cv); }, 0);
            top5Value = currentYearData.slice(0, 5).reduce(function(pv, cv) { return pv + _this.getValue(cv); }, 0);
            top5Percent = (top5Value / totalValue * 100).toFixed(decimal);

            if (!selectedItems) {
                this.resetInfo();
            } else {
                selectedItems.forEach(function (item, index, items) { _this.updateSelectedInfo(item); });
            }

            this.resize();
        },

        resize: function() {
        },

        updateSelectedInfo: function (selected) {
            // TODO: Waiting for a final solution for double fired events
            // for now this simple check will prevent double update
            if ($('#info-' + selected).length) {
                return;
            }

            var itemData = currentYearData.filter(function (item) { return item.geo == selected; })[0],
                value = this.getValue(itemData),
                percent = (value / totalValue * 100).toFixed(decimal),
                currentHeight = $infoWrapper.height(),
                templateData = {
                    indicator: indicator,
                    name: itemData['geo.name'],
                    total: this.getFormattedValue(value),
                    percent: percent,
                    unitLabel: unitLabel,
                    id: 'info-' + selected
                }

            $(infoTemplate(templateData))
                .data('selected', selected)
                .prependTo($infoWrapper)
                .fadeIn(150);

            $('#info-top5').remove();

            selectedItems.push(selected);
            selectedItems = _.uniq(selectedItems);
        },

        deselectedHandler: function (item) {
            selectedItems = _.reject(selectedItems, function (i) { return i === item; });

            $('#info-' + item).fadeOut(150, function () { this.remove(); });

            if (selectedItems.length) {
                this.updateSelectedInfo(_.last(selectedItems));
            } else {
                this.resetInfo();
            }

            this.events.trigger('infobox:closed', item);
        },

        resetInfo: function () {
            var templateData = {
                    indicator: indicator,
                    name: 'top 5 countries',
                    total: this.getFormattedValue(top5Value),
                    percent: top5Percent,
                    unitLabel: unitLabel,
                    id: 'info-top5'
                }

            $infoWrapper.empty();
            $(infoTemplate(templateData))
                .appendTo($infoWrapper)
                .fadeIn(150);
        },

        getValue: function (d) {
            return parseFloat(d[indicator] || 0);
        },

        getFormattedValue: function (value) {
            return (value / unit).toFixed(decimal);
        }
    });

    return InfoBox;
});