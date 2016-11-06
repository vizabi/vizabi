import * as utils from 'base/utils';
import Model from 'base/model';
import Promise from 'promise';

var LanguageModel = Model.extend({

  /**
   * Default values for this model
   */
  _defaults: {
    id: "en",
    filePath: ""
  },

  dataChildren: ["id"],
  strings: {},

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

  load: function() {
    var _this, promise;

    promise = this._super()

    _this = this;
    promise.then(function() {
      _this.trigger('translate');
    });

    return promise;
  },

  checkDataChanges: function(attributes) {
    var _this = this;

    if (!attributes || !this.dataChildren)
      return

    if (!utils.isArray(attributes) && utils.isObject(attributes)) 
      attributes = Object.keys(attributes);

    if (attributes.length == 0 || this.dataChildren.length == 0)
      return

    var changedDataChildren = attributes.filter(checkDataChildren);

    if (changedDataChildren.length > 0) {
      this.trigger('dataChange');
      this.load();
    }

    function checkDataChildren(attribute) { 
      return _this.dataChildren.indexOf(attribute) !== -1 
    }
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