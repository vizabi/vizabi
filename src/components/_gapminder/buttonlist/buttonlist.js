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
            }*/

            var numOfVisibleButtons;
            switch (this.getLayoutProfile()) {
                case "small":
                    numOfVisibleButtons = 5;
                    break;
                case "medium":
                    numOfVisibleButtons = 7;
                    break;
                case "large":
                    numOfVisibleButtons = 10;
                default:
                    numOfVisibleButtons = 5;
                    break;
            }

            console.log(this.components.placeholder);
        },

        geopicker: function(button_list) {

        },

        addButtons: function(button_list) {
            var _this = this;

            button_list.map(function(btn) {
                switch (btn) {
                    case 'full-screen':
                        _this.addComponent('_gapminder/buttonlist/buttons/full-screen-button', {
                            data: _this.data,
                            placeholder: '.vzb-tool-buttonlist .vzb-buttonlist'
                        });
                        break;

                    case 'add':
                        _this.addComponent('_gapminder/buttonlist/buttons/add-button', {
                            data: _this.data,
                            placeholder: '.vzb-tool-buttonlist .vzb-buttonlist'
                        });
                        break;
                    case 'colors':
                        _this.addComponent('_gapminder/buttonlist/buttons/colors-button', {
                            data: _this.data,
                            placeholder: '.vzb-tool-buttonlist .vzb-buttonlist'
                        });
                        break;
                    case 'find':
                        _this.addComponent('_gapminder/buttonlist/buttons/find-button', {
                            data: _this.data,
                            placeholder: '.vzb-tool-buttonlist .vzb-buttonlist'
                        });
                        break;
                    case 'play':
                        _this.addComponent('_gapminder/buttonlist/buttons/play-button', {
                            data: _this.data,
                            placeholder: '.vzb-tool-buttonlist .vzb-buttonlist'
                        });
                        break;
                    case 'more-options':
                        _this.addComponent('_gapminder/buttonlist/buttons/more-options-button', {
                            data: _this.data,
                            placeholder: '.vzb-tool-buttonlist .vzb-buttonlist'
                        });
                        break;
                    case 'size':
                        _this.addComponent('_gapminder/buttonlist/buttons/size-button', {
                            data: _this.data,
                            placeholder: '.vzb-tool-buttonlist .vzb-buttonlist'
                        });
                        break;
                }
            })
        }

    });


    return ButtonList;
});