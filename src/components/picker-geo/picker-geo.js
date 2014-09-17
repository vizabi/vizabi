define([
    'jquery',
    'base/utils',
    'base/component',
    'smartpicker'
], function($, utils, Component, SmartPicker) {

    var picker;

    var PickerGeo = Component.extend({
        init: function(parent, options) {
            this._super(parent, options);
        },

        postRender: function() {
            var _this = this;
            //instantiate a new geoMult picker
            picker = new SmartPicker('mult', 'geo-picker', {
                contentData: {
                    text: "Select the countries",
                    options: [{
                        value: "swe",
                        name: "Sweden"
                    }, {
                        value: "nor",
                        name: "Norway"
                    }, {
                        value: "fin",
                        name: "Finland"
                    }, ]
                },
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
        },

        //TODO: this should be separated from the buttonlist (it was hardcoded)
        //pass a list of countries to the state
        selectCountries: function(countriesArr) {
            var state = {
                show: {
                    'geo': countriesArr,
                    'geo.categories': ['country']
                },
            };
            this.setState(state);
        },

        show: function() {
            picker.show();
        },

        update: function() {
           
        }

    });

    return PickerGeo;
});