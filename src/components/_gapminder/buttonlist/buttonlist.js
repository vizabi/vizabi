//TODO: refactor this whole thing!

define([
    'jquery',
    'underscore',
    'base/utils',
    'base/component'
], function($, _, utils, Component) {

    var geo_picker;

    var ButtonList = Component.extend({
        init: function(core, options) {
            //set properties
            this.name = 'buttonlist';
            this.template = "components/_gapminder/" + this.name + "/" + this.name;
            this.data = options.data;

            this.addButtons(options.buttons);
            this._super(core, options);

        },

        postRender: function() {
            this.placeholder = utils.d3ToJquery(this.placeholder);
        },

        //make button list responsive
        resize: function() {
            var $buttons = this.placeholder.find('.vzb-buttonlist .vzb-buttonlist-btn'),
                $button_more = this.placeholder.find('.vzb-buttonlist .vzb-buttonlist-btn-more'),
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
                $buttons.removeClass('vzb-hidden');
                $button_more.addClass('vzb-hidden');
            } else {
                var max = Math.floor((size_container[compare] - offset) / size_button[compare]) - 1,
                    i = 0;
                $buttons.addClass('vzb-hidden');
                $buttons.each(function() {
                    i++;
                    $(this).removeClass('vzb-hidden');
                    if (i >= max) return false;
                });
                $button_more.removeClass('vzb-hidden');
            }
        },

        geopicker: function(button_list) {
            geo_picker = this.components['picker-geo'];

            //show the picker when the correct button is pressed
            var geo_button = this.placeholder.find('.vzb-buttonlist-geo');
            geo_button.click(function() {
                geo_picker.show();
            });
        },

        addButtons: function(button_list) {
            var _this = this;

            button_list.map(function(btn) {
                switch (btn) {
                    case 'full-screen':
                        _this.addComponent('_gapminder/buttonlist/buttons/full-screen-button', {
                            data: _this.data,
                            root: '.vzb-tool-buttonlist .vzb-buttonlist'
                        });
                        break;

                    case 'add':
                        _this.addComponent('_gapminder/buttonlist/buttons/add-button', {
                            data: _this.data,
                            root: '.vzb-tool-buttonlist .vzb-buttonlist'
                        });
                        break;
                    case 'colors':
                        _this.addComponent('_gapminder/buttonlist/buttons/colors-button', {
                            data: _this.data,
                            root: '.vzb-tool-buttonlist .vzb-buttonlist'
                        });
                        break;
                    case 'find':
                        _this.addComponent('_gapminder/buttonlist/buttons/find-button', {
                            data: _this.data,
                            root: '.vzb-tool-buttonlist .vzb-buttonlist'
                        });
                        break;
                    case 'play':
                        _this.addComponent('_gapminder/buttonlist/buttons/play-button', {
                            data: _this.data,
                            root: '.vzb-tool-buttonlist .vzb-buttonlist'
                        });
                        break;
                    case 'more-options':
                        _this.addComponent('_gapminder/buttonlist/buttons/more-options-button', {
                            data: _this.data,
                            root: '.vzb-tool-buttonlist .vzb-buttonlist'
                        });
                        break;
                }
            })
        }

    });


    return ButtonList;
});