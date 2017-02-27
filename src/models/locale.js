import * as utils from "base/utils";
import DataConnected from "models/dataconnected";

// this and many other locale information should at some point be stored in an external file with locale information (rtl, date formats etc)
const rtlLocales = ["ar", "ar-SA"];

const LocaleModel = DataConnected.extend({

  /**
   * Default values for this model
   */
  getClassDefaults() {
    const defaults = {
      id: "en",
      filePath: "assets/translation/"
    };
    return utils.deepExtend(this._super(), defaults);
  },

  dataConnectedChildren: ["id"],
  strings: {},

  /**
   * Initializes the locale model.
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init(name, values, parent, bind) {
    this._type = "locale";

    //same constructor, with same arguments
    this._super(name, values, parent, bind);
  },

  _isLoading() {
    return (!this._loadedOnce || this._loadCall);
  },

  preloadData() {
    return this.loadData();
  },

  loadData() {
    this.setReady(false);
    this._loadCall = true;

    // load new concept properties for each data source.
    // this should be done with listeners, but the load promise can't be returned
    // through the listeners

    const promises = [];
    utils.forEach(this._root._data, mdl => {
      if (mdl._type === "data") promises.push(mdl.loadConceptProps());
    });
    promises.push(new Promise((resolve, reject) => {
      d3.json(this.filePath + this.id + ".json", (error, strings) => {
        if (error) reject(error);
        this.handleNewStrings(strings);
        resolve();
      });
    }));

    return Promise.all(promises)
      .then(() => this.trigger("translate"));
  },

  handleNewStrings(receivedStrings) {
    this.strings[this.id] = this.strings[this.id]
      ? utils.extend(this.strings[this.id], receivedStrings)
      : receivedStrings;
  },

  /**
   * Gets a certain UI string
   * @param {String} stringId string identifier
   * @returns {string} translated string
   */
  getUIString(stringId) {
    if (this.strings && this.strings[this.id] && (this.strings[this.id][stringId] || this.strings[this.id][stringId] === "")) {
      return this.strings[this.id][stringId];
    }
    if (!this.strings || !this.strings[this.id]) utils.warn("Strings are not loaded for the " + this.id + " locale. Check if translation JSON is valid");
    return stringId;
  },

  /**
   * Gets the translation function
   * @returns {string} translation function
   */
  getTFunction() {
    return (stringId, payload = {}) => (
      Object.keys(payload).reduce((result, key) => {
        const regexp = new RegExp("{{" + key + "}}", "g");
        return result.replace(regexp, payload[key]);
      },
        this.getUIString(stringId)
      )
    );
  },

  isRTL() {
    return (rtlLocales.indexOf(this.id) !== -1);
  }

});

export default LocaleModel;
