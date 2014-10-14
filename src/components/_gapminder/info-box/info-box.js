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
        selectedItem,
        unit;

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
                _this.deselectedHandler(true);
            });

            this.update();
        },

        update: function() {
            var _this = this;

            data = this.model.getData()[0];
            year = this.model.getState("time");
            indicator = this.model.getState("indicator");
            unit = this.model.getState("unit") || 1;
            currentYearData = data.filter(function(row) {
                return (row.time == year);
            }).sort(function (a, b) {
                return _this.getValue(b) - _this.getValue(a);
            });


            totalValue = currentYearData.reduce(function(pv, cv) { return pv + _this.getValue(cv); }, 0);
            top5Value = currentYearData.slice(0, 5).reduce(function(pv, cv) { return pv + _this.getValue(cv); }, 0);
            top5Percent = (top5Value / totalValue * 100).toFixed(2);

            if (!selectedItem) {
                this.resetInfo();
            } else {
                this.updateSelectedInfo(selectedItem);
            }

            this.resize();
        },

        resize: function() {
        },

        updateSelectedInfo: function (selected) {
            var itemData = currentYearData.filter(function (item) { return item.geo == selected; })[0],
                value = this.getValue(itemData),
                percent = (value / totalValue * 100).toFixed(2);

            $infoValue.html(indicator + ' for ' + itemData['geo.name'] + ': ' + this.getFormattedValue(value));
            $infoPercent.html(percent + '% of the Wolrd');

            $infoWrapper.addClass('selected');
            selectedItem = selected;
        },

        deselectedHandler: function (silent) {
            if (selectedItem) {
                this.events.trigger('infobox:closed', selectedItem);
                this.resetInfo();
            }
        },

        resetInfo: function () {
            $infoValue.html(indicator + ' for top 5 countries: ' + this.getFormattedValue(top5Value));
            $infoPercent.html(top5Percent + '% of the Wolrd');

            $infoWrapper.removeClass('selected');
            selectedItem = false;
        },

        getValue: function (d) {
            return parseFloat(d[indicator] || 0);
        },

        getFormattedValue: function (value) {
            return (value / unit).toFixed(2);
        }
    });

    return InfoBox;
});