define([
    'jquery',
    'base/utils',
    'components/component',
], function($, utils, Component) {

    var Timeslider2 = Component.extend({
        init: function(parent, options) {
            this.template = "components/timeslider2/timeslider2";

            this.components = {
                'play-button': '#timeslider-button',
                'slider': '#timeslider-slider',
            };

            // Same constructor as the superclass
            this._super(parent, options);
        }

    });

    return Timeslider2;
});