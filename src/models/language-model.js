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

        getUIString: function(string, lang, ui_strings) {
            lang = lang || this.get("value");
            ui_strings = ui_strings || this.get("ui_strings");

            if (ui_strings && ui_strings.hasOwnProperty(lang) && ui_strings[lang].hasOwnProperty(string)) {
                return ui_strings[lang][string];
            } else {
                return string;
            }
        },

        getTFunction: function() {
            var lang = this.get("value"),
                ui_strings = this.get("ui_strings"),
                _this = this;

            return function(string) {
                return _this.getUIString(string, lang, ui_strings);
            }
        },

    });

    return LanguageModel;
});