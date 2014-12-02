define([
    'lodash',
    'base/model'
], function(_, Model) {

    var LanguageModel = Model.extend({

        /**
         * Initializes the language model.
         * @param {Object} values The initial values of this model
         * @param parent A reference to the parent model
         * @param {Object} bind Initial events to bind
         */
        init: function(values, parent, bind) {
            //default values for state model
            values = _.extend({
                id: "en",
                strings: {}
            }, values);

            //same constructor, with same arguments
            this._super(values, parent, bind);
        },

        /**
         * Gets a certain UI string
         * @param {String} id string identifier
         * @param {String} lang language
         * @param {Object} ui_strings ui_strings object or model
         * @returns {string} translated string
         */
        getUIString: function(id, lang, strings) {
            lang = lang || this.id;
            strings = strings || this.strings;

            if (strings && strings.hasOwnProperty(lang) && strings[lang].hasOwnProperty(id)) {
                return strings[lang][id];
            } else {
                return id;
            }
        },

        /**
         * Gets the translation function
         * @returns {string} translation function
         */
        getTFunction: function() {
            var lang = this.id,
                strings = this.strings,
                _this = this;

            return function(string) {
                return _this.getUIString(string, lang, strings);
            }
        },

    });

    return LanguageModel;
});
