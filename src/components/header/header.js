//TODO: refactor this whole thing!

define([
    'jquery',
    'underscore',
    'base/utils',
    'base/component',
], function($, _, utils, Component) {

    var Header = Component.extend({
        init: function(core, options) {
            //set properties
            this.name = 'header';
            this.template = "components/" + this.name + "/" + this.name;
            
            this._super(core, options);

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