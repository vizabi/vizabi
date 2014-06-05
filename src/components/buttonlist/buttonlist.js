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

            this._super(core, options);
        },

        render: function() {
            var _this = this;
            // Return the defer from the superclass 
            return this._super(function() {
                //TODO: refactor this callback into separate function
                _this.placeholder = utils.d3ToJquery(_this.placeholder);
            });

        },

        resize: function() {
            var $buttons = this.placeholder.find('#buttonlist .button'),
                $button_more = this.placeholder.find('#buttonlist #button-more'),
                offset = 30;

            var size_button = {
                width: $buttons.first().outerWidth(),
                height: $buttons.first().outerHeight()
            };
            
            var size_container = {
                    width: this.placeholder.outerWidth(),
                    height: this.placeholder.outerHeight()
                },
                vertical = size_container.width < size_container.height,
                number_buttons = $buttons.length - 1,
                compare = (vertical) ? "height" : "width";

            offset = size_button[compare] / 2;
            
            if ((number_buttons * size_button[compare]) <= size_container[compare] - offset) {
                $buttons.removeClass('hidden');
                $button_more.addClass('hidden');
            } 
            else {
                var max = Math.floor((size_container[compare] - offset) / size_button[compare]) - 1,
                    i = 0;
                $buttons.addClass('hidden');
                $buttons.each(function() {
                    i++;
                    $(this).removeClass('hidden');
                    if (i >= max) return false;
                });
                $button_more.removeClass('hidden');
            }
        }

    });


    return ButtonList;
});