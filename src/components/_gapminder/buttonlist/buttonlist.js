//TODO: refactor this whole thing!

define([
    'jquery',
    'lodash',
    'base/utils',
    'base/component'
], function($, _, utils, Component) {

    var geo_picker;

    var ButtonList = Component.extend({
        init: function(config, context) {
            //set properties
            this.name = 'buttonlist';
            this.template = "components/_gapminder/" + this.name + "/" + this.name;
            //this.data = this.model.data.getItems();
            this.components = [];

            this.addButtons(config.buttons);

            this._super(config, context);

        },

        postRender: function() {

        },

        //make button list responsive
        resize: function() {
            /*var buttons = this.placeholder.find('.vzb-buttonlist .vzb-buttonlist-btn'),
                offset = 30;

            var size_buttonlist = {
                width: buttons.first().outerWidth(),
                height: buttons.first().outerHeight()
            };

            var size_container = {
                    width: this.placeholder.outerWidth(),
                    height: this.placeholder.outerHeight()
                },
                vertical = size_container.width < size_container.height,

                number_buttons = buttons.length - 1,
                compare = (vertical) ? "height" : "width";

            offset = size_buttonlist[compare] / 2;

            if ((number_buttons * size_buttonlist[compare]) <= size_container[compare] - offset) {
                buttons.removeClass('vzb-hidden');
            } else {
                var max = Math.floor((size_container[compare] - offset) / size_buttonlist[compare]) - 1,
                    i = 0;
                buttons.addClass('vzb-hidden');
                buttons.each(function() {
                    i++;
                    $(this).removeClass('vzb-hidden');
                    if (i >= max) return false;
                });
            }

            var visible_bttons;
            switch (this.getLayoutProfile()) {
                case "small":
                    visible_bttons = ['play', 'add', 'colors', 'full-screen', 'more-options'];
                    break;
                case "medium":
                    visible_bttons = ['play', 'add', 'colors', 'full-screen', 'size', 'more-options'];
                    break;
                case "large":
                    visible_bttons = ['play', 'add', 'colors', 'full-screen', 'size', 'more-options'];
                default:
                    visible_bttons = ['play', 'add', 'colors', 'full-screen', 'more-options'];
                    break;
            }

            this.placeholder = utils.d3ToJquery(this.placeholder);
            buttons = this.placeholder.find('.vzb-buttonlist .vzb-buttonlist-btn');
            */
        },

        addButtons: function(button_list) {

            //add buttons to template to load a container for each
            this.template_data = {
                buttons: button_list
            }

            //add a component for each button
            for (var i = 0; i < button_list.length; i++) {
                var btn = button_list[i];
                this.components.push({
                    component: '_gapminder/buttonlist/buttons/'+btn+'-button',
                    placeholder: '.vzb-buttonlist-btn-' + btn
                });
            };

        }

    });


    return ButtonList;
});