define([
    'underscore',
    'base/model'
], function(_, Model) {

    var LanguageModel = Model.extend({
        init: function(values) {
            //default values for state model
            values = _.extend({
                value: "en",
                ui_strings: {}
            }, values);
            this._super(values);
        },

        getUIString: function(string) {
            var lang = this.get("value");
            var ui_strings = this.get("ui_strings");

            if (ui_strings && ui_strings.hasOwnProperty(lang) && ui_strings[lang].hasOwnProperty(string)) {
                return ui_strings[lang][string];
            } else {
                return string;
            }
        },

        getTFunction: function() {
            var lang = this.get("value");
            var ui_strings = this.get("ui_strings");

            return function(string) {
                if (ui_strings && ui_strings.hasOwnProperty(lang) && ui_strings[lang].hasOwnProperty(string)) {
                    return ui_strings[lang][string];
                } else {
                    return string;
                }
            }
        }

    });

    return LanguageModel;
});