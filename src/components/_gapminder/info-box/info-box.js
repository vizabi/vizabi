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
        $infoValue,
        $infoPercent,
        $infoCloseButton,
        totalValue,
        top5Value,
        top5Percent,
        selectedItems,
        unit,
        decimal;

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
            $infoValue = $('#info-box-value');
            $infoPercent = $('#info-box-percent');
            $infoCloseButton = $('#info-box-close');

            // Subscribe to events
            _this.events.bind('item:selected', _this.updateSelectedInfo.bind(_this));
            _this.events.bind('item:deselected', _this.deselectedHandler.bind(_this));

            $infoCloseButton.on('click', function (event) {
                event.preventDefault();
                _this.deselectedHandler($(this).data('selected'));
            });

            this.update();
        },

        update: function() {
            var _this = this;

            data = this.model.getData()[0];
            year = this.model.getState('time');
            indicator = this.model.getState('indicator');
            unit = this.model.getState('unit') || 1;
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
                this.updateSelectedInfo(_.last(selectedItems));
            }

            this.resize();
        },

        resize: function() {
        },

        updateSelectedInfo: function (selected) {
            var itemData = currentYearData.filter(function (item) { return item.geo == selected; })[0],
                value = this.getValue(itemData),
                percent = (value / totalValue * 100).toFixed(decimal);

            $infoValue.html(indicator + ' for ' + itemData['geo.name'] + ': ' + this.getFormattedValue(value));
            $infoPercent.html(percent + '% of the Wolrd');

            $infoWrapper.addClass('selected');
            $infoCloseButton.data('selected', selected);

            selectedItems.push(selected);
            selectedItems = _.uniq(selectedItems);
        },

        deselectedHandler: function (item) {
            selectedItems = _.reject(selectedItems, function (i) { return i === item; });

            if (selectedItems.length) {
                this.updateSelectedInfo(_.last(selectedItems));
            } else {
                this.resetInfo();
            }

            this.events.trigger('infobox:closed', item);
        },

        resetInfo: function () {
            $infoValue.html(indicator + ' for top 5 countries: ' + this.getFormattedValue(top5Value));
            $infoPercent.html(top5Percent + '% of the Wolrd');

            $infoWrapper.removeClass('selected');
            $infoCloseButton.data('selected', '');
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