 define([
    'base/component-model',
    'base/time-model',
    'base/show-model'
], function(ComponentModel, TimeModel, ShowModel) {


    var BarChartModel = ComponentModel.extend({
        init: function(state) {
            this.timeModel = new TimeModel(state.time);
            this.showModel = new ShowModel(state.show);

            this._super();
        }
    });

    return BarChartModel;
});