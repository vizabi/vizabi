define([
    'jquery',
    'base/utils',
    'base/component',
], function($, utils, Component) {

    var Timeslider2 = Component.extend({
        init: function(parent, options) {
            this.template = "components/timeslider2/timeslider2";

            //add sub components
            this.addComponent('play-button', {
                placeholder: '#timeslider-button'
            });
            this.addComponent('slider', {
                placeholder: '#timeslider-slider'
            });

            // Same constructor as the superclass
            this._super(parent, options);
        }

    });

    return Timeslider2;
});