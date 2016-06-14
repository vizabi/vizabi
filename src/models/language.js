import * as utils from 'base/utils';
import Model from 'base/model';

var LanguageModel = Model.extend({

  /**
   * Default values for this model
   */
  _defaults: {
    id: "en",
    strings: {}
  },

  /**
   * Initializes the language model.
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init: function(name, values, parent, bind) {

    this._type = "language";
    //default values for state model
    var defaults = utils.deepClone(this._defaults);
    values = utils.extend(defaults, values);

    //same constructor, with same arguments
    this._super(name, values, parent, bind);
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

    if(strings && strings[lang] && (strings[lang][id] || strings[lang][id]==="")) {
      return strings[lang][id];
    } else {
      if(!strings || !strings[lang]) utils.warn("Strings are not loaded for the " + lang + " language. Check if translation JSON is valid");
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
  }

});

export default LanguageModel;