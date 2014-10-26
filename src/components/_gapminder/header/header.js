//TODO: refactor this whole thing!

define([
    'jquery',
    'underscore',
    'base/utils',
    'base/component',
], function($, _, utils, Component) {

    var Header = Component.extend({
        init: function(options, context) {
            //set properties
            this.name = 'header';
            this.template = "components/_gapminder/" + this.name + "/" + this.name;
            this._super(options, context);
        },

        postRender: function() {
        },

        //make button list responsive
        update: function() {
            //reload template to update text
            this.loadTemplate();
        }

    });

    return Header;
});