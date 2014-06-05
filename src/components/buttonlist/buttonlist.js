//TODO: refactor this whole thing!

define([
    'jquery',
    'base/utils',
    'components/component'
], function($, utils, Component) {

    var ButtonList = Component.extend({
        init: function(core, options) {
            //set properties
            this.name = 'buttonlist';
            this.template = "components/" + this.name + "/" + this.name;

            this.template_data = {
                buttons: [{
                    name: "find",
                    title: "Find",
                    icon: "search"
                }, {
                    name: "options",
                    title: "Options",
                    icon: "gear"
                }, {
                    name: "colors",
                    title: "Colors",
                    icon: "pencil"
                }, {
                    name: "speed",
                    title: "Speed",
                    icon: "dashboard"
                }, {
                    name: "find",
                    title: "Find",
                    icon: "search"
                }, {
                    name: "options",
                    title: "Options",
                    icon: "gear"
                }]
            };

            this._super(core,options);
        },

    });


    return ButtonList;
});
