//TODO: refactor this whole thing!

define([
    'jquery',
    'underscore',
    'base/utils',
    'components/component',
    'smartpicker'
], function($, _, utils, Component, SmartPicker) {

    var geo_picker;

    var ButtonList = Component.extend({
        init: function(core, options) {
            //set properties
            this.name = 'buttonlist';
            this.template = "components/" + this.name + "/" + this.name;

            //list of buttons to be rendered
            this.template_data = {
                buttons: [{
                    id: "geo",
                    title: "Country",
                    icon: "globe"
                },{
                    id: "find",
                    title: "Find",
                    icon: "search"
                }, {
                    id: "options",
                    title: "Options",
                    icon: "gear"
                }, {
                    id: "colors",
                    title: "Colors",
                    icon: "pencil"
                }, {
                    id: "speed",
                    title: "Speed",
                    icon: "dashboard"
                }, {
                    id: "find",
                    title: "Find",
                    icon: "search"
                }, {
                    id: "options",
                    title: "Options",
                    icon: "gear"
                }]
            };

            this._super(core, options);
        },

        postRender: function() {
            var _this = this;
            this.placeholder = utils.d3ToJquery(_this.placeholder);

            //instantiate a new geoMult picker
            geo_picker = new SmartPicker('geoMult', 'geo-picker', {
                width: 320,
                confirmButton: "OK",
                //what to do after user selects a country
                onSet: function(selected) {
                    //extract the value only
                    var countries = _.map(selected.selected, function(country) {
                        return country.value;
                    });
                    //pass the selected countries to state
                    _this.selectCountries(countries);
                }
            });

            //show the picker when the correct button is pressed
            var geo_button = this.placeholder.find('#geo');
            geo_button.click(function() {
                geo_picker.show();
            });
        },

        //make button list responsive
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
            } else {
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
        },

        //TODO: this should be separated from the buttonlist (it was hardcoded)
        //pass a list of countries to the state
        selectCountries: function(countriesArr) {
            var state = {
                show: {
                    //TODO: change this mapping (workaround)
                    region: {
                        filter: _.map(countriesArr, function(c) {
                                    return c.toLowerCase();
                                })
                    }
                }
            }
            this.setState(state);
        }

    });


    return ButtonList;
});