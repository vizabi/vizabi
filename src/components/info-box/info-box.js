define([
    'jquery',
    'underscore',
    'base/component'
], function($, _, Component) {

    var data,
        year,
        currentYearData,
        indicator,
        $infoValue,
        $infoPercent,
        totalValue,
        top5Value,
        top5Percent,
        selectedItem,
        unit;

    var Filter = Component.extend({
        init: function(context, options) {
            this.name = 'info-box';
            this.template = 'components/' + this.name + '/' + this.name;
            this.tool = context;
            this._super(context, options);
        },

        postRender: function() {
            var _this = this;

            $infoValue = $('#info-box-value');
            $infoPercent = $('#info-box-percent');

            // Subscribe to events
            _this.events.bind('item:selected', _this.updateSelectedInfo.bind(_this));
            _this.events.bind('item:deselected', _this.resetInfo.bind(_this));

            this.update();
        },

        update: function() {
            data = this.model.getData()[0];
            year = this.model.getState("time");
            currentYearData = data.filter(function(row) {
                return (row.time == year);
            });
            indicator = this.model.getState("indicator");
            unit = this.model.getState("unit") || 1;

            currentYearData.sort(function (a, b) {
                return parseInt(b[indicator]) - parseInt(a[indicator]);
            });


            totalValue = currentYearData.reduce(function(pv, cv) { return pv + parseFloat(cv[indicator]); }, 0);
            top5Value = currentYearData.slice(0, 5).reduce(function(pv, cv) { return pv + parseFloat(cv[indicator]); }, 0);
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
                value = parseFloat(itemData[indicator]),
                percent = (value / totalValue * 100).toFixed(2);

            $infoValue.html(indicator + ' for ' + itemData['geo.name'] + ': ' + (value / unit).toFixed(2));
            $infoPercent.html(percent + '% of the Wolrd.');

            selectedItem = selected;
        },

        resetInfo: function (selected) {
            $infoValue.html(indicator + ' for top 5 countries : ' + (top5Value / unit).toFixed(2));
            $infoPercent.html(top5Percent + '% of the Wolrd');

            selectedItem = false;
        }

    });

    return Filter;
});