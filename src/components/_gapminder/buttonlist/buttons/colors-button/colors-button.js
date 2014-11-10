this.template = 'components/_gapminder/button-list/button.html';
define([
    'jquery',
    'base/utils',
    'base/component',
    'base/model'
], function($, utils, Component, Model) {

    var picker,
        countries;

    var ColorsButton = Component.extend({
        init: function(config, parent) {
            this.name = 'colors-button';
            this.id = 'globe';
            this.title = 'Colors';

            this.placeholder = options.placeholder;
            
            this.template = 'components/_gapminder/button-list/button.html';
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

    return ColorsButton;
});