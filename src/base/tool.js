import * as utils from 'utils'
import Model from 'model'
import Component from 'component'
import Layout from 'layout'
import { DefaultEvent } from 'events'
import { warn as warnIcon } from 'iconset'
import Promise from 'base/promise';

var class_loading_first = 'vzb-loading-first';
var class_loading_data = 'vzb-loading-data';
var class_loading_error = 'vzb-loading-error';
var class_placeholder = 'vzb-placeholder';
var class_buttons_off = 'vzb-buttonlist-off';

var templates = {};
var toolsList = {};
//tool model is quite simple and doesn't need to be registered
var ToolModel = Model.extend({
  /**
   * Initializes the tool model.
   * @param {Object} values The initial values of this model
   * @param {Object} binds contains initial bindings for the model
   * @param {Function|Array} validade validate rules
   */
  init: function(name, external_model, default_model, binds, validate) {
    this._id = utils.uniqueId('tm');
    this._type = 'tool';

    //generate validation function
    this.validate = generateValidate(this, validate);

    // defaults are taken from tool default model
    this._defaults = default_model;

    //constructor is similar to model
    this._super(name, external_model, null, binds);
  },

  /**
   * @return {object} Defaults of tool model and children
   * Tool defaults overwrite other models' default
   */
  getDefaults: function() {
    return utils.deepExtend({}, this.getSubmodelDefaults(), this._defaults);
  },

});
//tool
var Tool = Component.extend({
  /**
   * Initializes the tool
   * @param {Object} placeholder object
   * @param {Object} external_model External model such as state, data, etc
   */
  init: function(placeholder, external_model) {
    this._id = utils.uniqueId('t');
    this.template = this.template || 
      '<div class="vzb-tool vzb-tool-' + this.name + '">' + 
        '<div class="vzb-tool-stage">' + 
          '<div class="vzb-tool-viz">' + 
          '</div>' + 
          '<div class="vzb-tool-timeslider">' + 
          '</div>' + 
        '</div>' + 
        '<div class="vzb-tool-sidebar">' + 
          '<div class="vzb-tool-dialogs">' + 
          '</div>' +
          '<div class="vzb-tool-buttonlist">' + 
          '</div>' + 
        '</div>' +         
        '<div class="vzb-tool-datanotes vzb-hidden">' + 
        '</div>' + 
        '<div class="vzb-tool-treemenu vzb-hidden">' + 
        '</div>' + 
        '<div class="vzb-tool-datawarning vzb-hidden">' + 
        '</div>' + 
        '<div class="vzb-tool-labels vzb-hidden">' + 
        '</div>' + 
      '</div>';
    this.model_binds = this.model_binds || {};
    
    external_model = external_model || {}; //external model can be undefined
    external_model.bind = external_model.bind || {}; //bind functions can be undefined

    
    //bind the validation function with the tool
    var validate = this.validate.bind(this);
    var _this = this;

    // callbacks has to be an array so that it will not be turned into a submodel when the toolmodel is made.
    var callbacks = {
      'change': function(evt, path) {
        if(_this._ready) {
          _this.model.validate();

          if (evt.source.persistent)
            _this.model.trigger(new DefaultEvent(evt.source, 'persistentChange'), _this.getPersistentModel());
        }
      },
      'hook_change': function() {
        if (!_this.model.state.time.splash) { // not block when it initial splash screen
          _this.beforeLoading(true);
        }
      },
      'change:ui.presentation': function() {
        _this.layout.updatePresentation();
        _this.trigger('resize');
      },
      'translate:language': function() {
        _this.translateStrings();
      },
      'load_start': function() {
        _this.beforeLoading();
      },
      'ready': function(evt) {
        if(_this._ready) {
          _this.afterLoading();
        }
      }      
    };
    utils.extend(callbacks, this.model_binds, external_model.bind);
    delete external_model.bind;

    this.model = new ToolModel(this.name, external_model, this.default_model, callbacks, validate);

    this.ui = this.model.ui || {};

    this.layout = new Layout(this.ui);
    //splash
    this.ui.splash = this.model && this.model.data && this.model.data.splash;
    this._super({
      name: this.name || this._id,
      placeholder: placeholder
    }, this);

    this.render();
    this._setUIModel();
  },

  ready: function(){
    this.checkTimeLimits();  
  },
    
  checkTimeLimits: function() {
    if(!this.model.state.time) return;
    
    var time = this.model.state.time;
    
    if(this.model.state.marker) {
      var tLimits = this.model.state.marker.getTimeLimits(time.getDimension());

      if(!tLimits || !utils.isDate(tLimits.min) || !utils.isDate(tLimits.max)) 
          return utils.warn("checkTimeLimits(): min-max look wrong: " + tLimits.min + " " + tLimits.max + ". Expecting Date objects");

      // change start and end (but keep startOrigin and endOrigin for furhter requests)
      var newTime = {}
      if(time.start - tLimits.min != 0) newTime['start'] = d3.max([tLimits.min, time.parseToUnit(time.startOrigin)]);
      if(time.end - tLimits.max != 0) newTime['end'] = d3.min([tLimits.max, time.parseToUnit(time.endOrigin)]);
      if(time.value == null) newTime['value'] = time.parseToUnit(time.format(new Date())); // default to current date. Other option: newTime['start'] || newTime['end'] || time.start || time.end;

      time.set(newTime, false, false);
    }
      
    //force time validation because time.value might now fall outside of start-end
    time.validate(); 
  },

  getPersistentModel: function() {
    //try to find functions in properties of model. 
    var removeFunctions = function(model) {
      for(var childKey in model) {        
        if(typeof model[childKey] === 'function') {
          delete model[childKey];
          utils.warn('minModel validation. Function found in enumerable properties of ' + childKey + ". This key is deleted from minModel");
        } 
        else if(typeof model[childKey] === 'object') 
          removeFunctions(model[childKey]);
      }
    }
   
    var currentToolModel = this.model.getPlainObject(true); // true = get only persistent model values
    var result = utils.flattenDates(currentToolModel, this.model.state.time.timeFormat);
    
    removeFunctions(result);
    return result;
  },

  getPersistentMinimalModel: function(diffModel) {
    var defaultModel = this.model.getDefaults();
    var currentPersistentModel = this.getPersistentModel();
    var redundantModel = Vizabi.utils.deepExtend(defaultModel, diffModel);
    return Vizabi.utils.diffObject(currentPersistentModel, redundantModel);
  },

  /**
   * Clears a tool
   */

  clear: function() {
    this.layout.clear();
    this.setModel = this.getModel = function() {
      return;
    };
    this._super();
  },

  /**
   * Visually display errors
   */
  error: function(opts) {

    var msg = (opts && opts.type === "data") ? "Error loading chart data. <br>Please, try again soon." : "Error loading chart";

    this.placeholder.innerHTML = '<div class="vzb-error-message"><h1>'+warnIcon+'</h1><p>'+msg+'</p></div>';
  },

  /**
   * Sets model from external page
   * @param {Object} JSONModel new model in JSON format
   * @param {Boolean} overwrite overwrite everything instead of extending
   */
  setModel: function(newModelJSON, overwrite) {
    if(overwrite) {
      this.model.reset(newModelJSON);
    } else {
      this.model.set(newModelJSON);
    }
    this._setUIModel();
  },

  /**
   * get model
   * @return {Object} JSON object of model
   */
  getModel: function() {
    return this.model.getPlainObject() || {};
  },
  /**
   * Displays loading class
   */
  beforeLoading: function(loadingData) {
    if(!this._readyOnce) {
        utils.addClass(this.placeholder, class_loading_first);    
    }
    if(loadingData) {
        utils.addClass(this.placeholder, class_loading_data);    
    }
  },
  /**
   * Removes loading class
   */
  afterLoading: function() {
    utils.removeClass(this.placeholder, class_loading_first);
    utils.removeClass(this.placeholder, class_loading_data);
  },
  /**
   * Adds loading error class
   */
  errorLoading: function() {
    utils.addClass(this.placeholder, class_loading_error);
  },
  /* ==========================
   * Validation and query
   * ==========================
   */
  /**
   * Validating the tool model
   * @param model the current tool model to be validated
   */
  validate: function(model) {
    model = this.model || model;

    if(!model || !model.state) return utils.warn("tool validation aborted: model.state looks wrong: " + model);
  },

  _setUIModel: function() {
    //add placeholder class
    utils.addClass(this.placeholder, class_placeholder);
    //add-remove buttonlist class
    if(!this.ui || !this.ui.buttons || !this.ui.buttons.length) {
      utils.addClass(this.element, class_buttons_off);
    } else {
      utils.removeClass(this.element, class_buttons_off);
    }
  },

  preloadLanguage: function() {
    return Promise.resolve();
  }
});

/* ==========================
 * Validation methods
 * ==========================
 */

/**
 * Generates a validation function based on specific model validation
 * @param {Object} m model
 * @param {Function} validate validation function
 * @returns {Function} validation
 */
function generateValidate(m, validate) {
  var max = 10;

  function validate_func() {
    var model = JSON.stringify(m.getPlainObject());
    var c = arguments[0] || 0;
    //TODO: remove validation hotfix
    //while setting this.model is not available
    if(!this._readyOnce) {
      validate(this);
    } else {
      validate();
    }
    var model2 = JSON.stringify(m.getPlainObject());
    if(c >= max) {
      utils.error('Max validation loop.');
    } else if(model !== model2) {
      validate_func.call(this, [c += 1]);
    }
  }

  return validate_func;
}

export default Tool;
