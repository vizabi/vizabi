define([
    'jquery',
    'base/utils',
    'base/component',
    'base/model',
    'smartpicker'
], function($, utils, Component, Model, SmartPicker) {

    var picker,
        countries;

    var PickerGeo = Component.extend({
        init: function(parent, options) {
            this._super(parent, options);
            this.data = options.data;
        },

        postRender: function() {
            var _this = this;
            
            //load countries and then initialize pickers
            this.loadCountries().then(function(country_list) {
                _this.initializePicker(country_list);
            });
        },

        //load list of countries
        loadCountries: function() {
            var _this = this,
                defer = $.Deferred(),
                language = this.model.get("language"),
                state = this.model.get("state"),
                query = this.getQuery(),
                countries = new Model();

            //set the correct source
            countries.setSource(this.data);

            //load data and resolve the defer when it's done
            $.when(
                countries.load(query, language, {})
            ).done(function() {
                country_list = countries.get();

                defer.resolve(country_list);
            });

            return defer;

        },

        //initialize picker with list of countries
        initializePicker: function(country_list) {
            //instantiate a new geoMult picker
            picker = new SmartPicker('mult', 'geo-picker', {
                contentData: {
                    text: "Select the countries",
                    options: country_list || []
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
            if (picker && picker.show) {
                picker.show();
            }
        },

        update: function() {

        },

        getQuery: function() {
          var query = [{
                    select: [
                        'geo',
                        'geo.name',
                    ],
                    where: {
                        geo: ["*"]
                    }}];

            return query;
        }

    });

    return PickerGeo;
});