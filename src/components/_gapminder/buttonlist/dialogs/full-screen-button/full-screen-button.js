define([
    'jquery',
    'base/utils',
    'base/component',
    'base/model'
], function($, utils, Component, Model) {

    var picker,
        countries;

    var FullScreenButton = Component.extend({
        init: function(config, parent) {
            this.name = 'full-screen-button';
            this.id = 'arrows-alt';
            this.title = 'Full Screen';


            this.template = 'components/_gapminder/buttonlist/buttons/button';
            this.template_data = this.template_data || {
                name: this.name,
                title: this.title,
                id: this.id
            };

            this._super(config, parent);
        },

        postRender: function() {
        },


        resize: function() {

        },


        update: function() {

        }

    });

    return FullScreenButton;
});