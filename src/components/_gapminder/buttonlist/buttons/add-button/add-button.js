define([
    'jquery',
    'base/utils',
    'base/component',
    'base/model'
], function($, utils, Component, Model) {

    var picker,
        countries;

    var AddButton = Component.extend({
        init: function(parent, options) {
            this.name = 'add-button';
            this.id = 'plus';
            this.title = 'Add';

            this.placeholder = options.placeholder;
            
            this.template = 'components/_gapminder/buttonlist/buttons/button';
            this.template_data = this.template_data || {
                name: this.name,
                title: this.title,
                id: this.id
            };

            this._super(parent, options);
        },

        postRender: function() {
        },


        resize: function() {

        },


        update: function() {

        }

    });

    return AddButton;
});