define([
    'widgets/widget'
], function(Widget) {
    var barChart = Widget.extend({
        init: function(context, options) {
            this.name = 'bar-chart';
            this._super(context, options);
        }
    });

    return barChart;
});
