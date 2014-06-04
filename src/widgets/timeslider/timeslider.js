define([
    'underscore',
    'widgets/widget'
], function(_, Widget) {

    var timeslider = Widget.extend({
        init: function(context, options) {
            this.name = 'timeslider';
            this.template = "widgets/timeslider/timeslider";

            this._super(context, options);
        }
    });

    return timeslider;
});