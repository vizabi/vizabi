import * as utils from 'base/utils';
import DataConnected from 'models/dataconnected';
import Promise from 'base/promise';

var LanguageModel = DataConnected.extend({

  /**
   * Default values for this model
   */
  _defaults: {
    id: "en",
    filePath: ""
  },

  dataConnectedChildren: ["id"],
  strings: {},

  /**
   * Initializes the language model.
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init: function(name, values, parent, bind) {
    this._type = "language";

    //same constructor, with same arguments
    this._super(name, values, parent, bind);
  },

  _isLoading: function() {
    return (!this._loadedOnce || this._loadCall);
  },

  loadData: function() {

    var _this = this;
    this.setReady(false);
    this._loadCall = true;

    var promise = new Promise(function(resolve, reject) {

      if(_this.filePath) {
        // if a path to external tranlation file is provided, extend the default strings with the ones from that file
        d3.json(_this.filePath + _this.id + ".json", function(receivedStrings) {
          var knownStrings = {};
          if(_this.strings[_this.id]) knownStrings = _this.strings[_this.id];
          _this.strings[_this.id] = utils.extend(knownStrings, receivedStrings);
          resolve();
        });
      } else {
        resolve();
      }

    });

    promise.then(
      () => this.trigger('translate')
    );

    return promise;
  },

  /**
   * Gets a certain UI string
   * @param {String} id string identifier
   * @param {String} lang language
   * @param {Object} ui_strings ui_strings object or model
   * @returns {string} translated string
   */
  getUIString: function(stringId) {
    if(this.strings && this.strings[this.id] && (this.strings[this.id][stringId] || this.strings[this.id][stringId]==="")) {
      return this.strings[this.id][stringId];
    } else {
      if(!this.strings || !this.strings[this.id]) utils.warn("Strings are not loaded for the " + this.id + " language. Check if translation JSON is valid");
      return stringId;
    }
  },

  /**
   * Gets the translation function
   * @returns {string} translation function
   */
  getTFunction: function() {
    var _this = this;
    return function(stringId) {
      return _this.getUIString(stringId)
    }
  }

});

export default LanguageModel;
