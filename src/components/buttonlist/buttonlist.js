define([
    'jquery',
    'utils',
    'widgets/widget',
], function($, utils, Widget) {

    var buttonList = function(sandbox, options) {

        //instantiate new visualization
        var wid = new Widget(sandbox, options);

        //set properties
        wid.name = 'buttonlist';
        wid.template = "widgets/"+wid.name+"/"+wid.name;

        wid.template_data = {
            buttons: [
                {
                    name: "find",
                    title: "Find",
                    icon: "search"
                },
                {
                    name: "options",
                    title: "Options",
                    icon: "gear"
                },
                {
                    name: "colors",
                    title: "Colors",
                    icon: "pencil"
                },
                {
                    name: "speed",
                    title: "Speed",
                    icon: "dashboard"
                },
                {
                    name: "find",
                    title: "Find",
                    icon: "search"
                },
                {
                    name: "options",
                    title: "Options",
                    icon: "gear"
                }
            ]
        };

        wid.update = function() {
            var $buttons = $('#buttonlist .button'),
                $button_more = $('#buttonlist #button-more'),
                offset = 30;

            var size_button = {
                width: $buttons.first().outerWidth(),
                height: $buttons.first().outerHeight()
            };
            var size_container = this.containerSize(),
                vertical = size_container.width < size_container.height,
                number_buttons = $buttons.length - 1,
                compare = (vertical) ? "height" : "width";

            offset = size_button[compare] / 2;
            if((number_buttons * size_button[compare]) <= size_container[compare] - offset) {
                $buttons.removeClass('hidden');
                $button_more.addClass('hidden');
            } else {
                var max = Math.floor((size_container[compare] - offset) / size_button[compare]) - 1,
                    i = 0;
                $buttons.addClass('hidden');
                $buttons.each(function() {
                    i++;
                    $(this).removeClass('hidden');
                    if(i >= max) return false;
                });
                $button_more.removeClass('hidden');
            }

        }

        return wid;
    };

    return buttonList;
});
