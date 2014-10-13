define([
    'jquery',
    'base/utils',
    'base/component',
], function($, utils, Component) {

    var Timeslider = Component.extend({
        init: function(parent, options) {
            this.template = "components/_gapminder/timeslider/timeslider";

            //add sub components
            this.addComponent('_gapminder/timeslider-play-button', {
                placeholder: '#timeslider-button'
            });
            this.addComponent('_gapminder/timeslider-slider', {
                placeholder: '#timeslider-slider-wrapper'
            });

            // Same constructor as the superclass
            this._super(parent, options);
        }

    });

    return Timeslider;
});