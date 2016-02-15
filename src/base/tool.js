import * as utils from 'utils'
import Model from 'model'
import Component from 'component'
import Layout from 'layout'
import { DefaultEvent } from 'events'
import { warn as warnIcon } from 'iconset'
import Promise from 'base/promise';

var class_loading = 'vzb-loading';
var class_loading_first = 'vzb-loading-first';
var class_loading_data = 'vzb-loading';
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
  init: function(name, values, defaults, binds, validate) {
    this._id = utils.uniqueId('tm');
    this._type = 'tool';
    //generate validation function
    this.validate = generateValidate(this, validate);
    //default submodels
    values = values || {};
    defaults = defaults || {};
    values = defaultModel(values, defaults);
    //constructor is similar to model
    this._super(name, values, null, binds);
    // change language
    if(values.language) {
      var _this = this;
      this.on('change:language.id', function() {
        _this.trigger('translate');
      });
    }
  }
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
        '<div class="vzb-tool-treemenu vzb-hidden">' + 
        '</div>' + 
        '<div class="vzb-tool-datawarning vzb-hidden">' + 
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
            _this.model.trigger(new DefaultEvent(evt.source, 'persistentChange'), _this.getMinModel());
        }
      },
      'change:ui.presentation': function() {
        _this.layout.updatePresentation();
        _this.trigger('resize');
      },
      'translate': function(evt, val) {
        if(_this._ready) {
          Promise.all([_this.preloadLanguage(), _this.model.load()])
            .then(function() {
              _this.model.validate();
              _this.translateStrings();
            });
        }
      }
    };
    utils.extend(callbacks, this.model_binds, external_model.bind);
    delete external_model.bind;

    this.model = new ToolModel(this.name, external_model, this.default_model, callbacks, validate);

    // default model is the model set in the tool
    this.default_model = this.default_model || {};

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

    preloader(this).then(
      this.loadModels.bind(this)
    );

  },

  loadModels: function() {
    var _this = this;
    this.loadComponentModels().then(function() {
      _this.model.state.time.trigger('change', _this.model.state.time.getPlainObject());
    });
  },

  getMinModel: function() {
    var currentToolModel = this.model.getPlainObject(true); // true = get only persistent model values
    var defaultToolModel = this.default_model;
    var defaultsFromModels = this.model.getDefaults();
    //flattens _defs_ object
    defaultToolModel = utils.flattenDefaults(defaultToolModel);
    // compares with chart default model
    var modelChanges = utils.diffObject(currentToolModel, defaultToolModel);
    // change date object to string according to current format
    modelChanges = utils.flattenDates(modelChanges, this.model.state.time.timeFormat);
    //compares with model's defaults
    return utils.diffObject(modelChanges, defaultsFromModels);
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

    if(!model || !model.state) {
      utils.warn("tool validation aborted: model.state looks wrong: " + model);
      return;
    };

    var time = model.state.time;
    var marker = model.state.marker;

    if(!time) {
      utils.warn("tool validation aborted: time looks wrong: " + time);
      return;
    };
    if(!marker) {
      utils.warn("tool validation aborted: marker looks wrong: " + marker);
      return;
    };
    
    if(!marker.getKeys() || marker.getKeys().length < 1) return;

    var dateMin = marker.getLimits(time.getDimension()).min;
    var dateMax = marker.getLimits(time.getDimension()).max;

    if(!utils.isDate(dateMin)) utils.warn("tool validation: min date looks wrong: " + dateMin);
    if(!utils.isDate(dateMax)) utils.warn("tool validation: max date looks wrong: " + dateMax);

    // change is not persistent if it's splashscreen change
    if(time.start < dateMin && utils.isDate(dateMin)) time.getModelObject('start').set(dateMin, false, !time.splash);
    if(time.end > dateMax && utils.isDate(dateMax)) time.getModelObject('end').set(dateMax, false, !time.splash);
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

/* ==========================
 * Default model methods
 * ==========================
 */

/**
 * Generates a valid state based on default model
 */
function defaultModel(values, defaults) {
  var keys = Object.keys(defaults);
  var size = keys.length;
  var field;
  var blueprint;
  var original;
  var type;
  for(var i = 0; i < size; i += 1) {
    field = keys[i];
    if(field === '_defs_') {
      continue;
    }
    blueprint = defaults[field];
    original = values[field];
    type = typeof blueprint;
    if(type === 'object') {
      type = utils.isPlainObject(blueprint) && blueprint._defs_ ? 'object' : utils.isArray(blueprint) ? 'array' :
        'model';
    }
    if(typeof original === 'undefined') {
      if(type !== 'object' && type !== 'model') {
        values[field] = blueprint;
      } else {
        values[field] = defaultModel({}, blueprint);
      }
    }
    original = values[field];
    if(type === 'number' && isNaN(original)) {
      values[field] = 0;
    } else if(type === 'string' && typeof original !== 'string') {
      values[field] = '';
    } else if(type === 'array' && !utils.isArray(original)) {
      values[field] = [];
    } else if(type === 'model') {
      if(!utils.isObject(original)) {
        values[field] = {};
      }
      values[field] = defaultModel(values[field], blueprint);
    } else if(type === 'object') {
      if(!utils.isObject(original) || Object.keys(original).length === 0) {
        original = false; //will be overwritten
      }
      if(!utils.isObject(blueprint._defs_)) {
        blueprint._defs_ = {};
      }
      values[field] = original || blueprint._defs_;
    }
  }
  return values;
}

/**
 * Outputs the difference between two objects
 * @param {Object} obj prevailing object
 * @param {Object} compare comparison object
 * @returns {Object} resulting diff object
 */
function changedObj(obj, compare) {
  var acc = {};
  utils.forEach(obj, function(val, name) {
    if(!(name in compare)) {
      acc[name] = val;
      return true;
    }
    //if the same, no need to check deeper
    if(JSON.stringify(val) === JSON.stringify(compare[name])) return true;
    else if(utils.isArray(val)) {
      acc[name] = val;
    } else if(utils.isObject(val)) {
      acc[name] = changedObj(val, compare[name]);
    } else if(utils.isDate(compare[name])) {
      var comp1 = val.toString();
      //TODO: workaround for years only
      var comp2 = compare[name].getUTCFullYear().toString();
      if(comp1 !== comp2) {
        acc[name] = val;
      }
    } else {
      acc[name] = val;
    }
  });
  return acc;
}

//utility function to check if a component is a tool
//TODO: Move to utils?
Tool.isTool = function(c) {
  return c._id && c._id[0] === 't';
};

/**
 * Preloader implementation with promises
 * @param {Object} comp any component
 * @returns {Promise}
 */
function preloader(comp) {
  var promise = new Promise();
  var promises = []; //holds all promises

  //preload all subcomponents first
  utils.forEach(comp.components, function(subcomp) {
    promises.push(preloader(subcomp));
  });

  var wait = promises.length ? Promise.all(promises) : new Promise.resolve();
  wait.then(function() {
    comp.preload(promise);
  }, function(err) {
    utils.error("Error preloading data:", err);
  });

  return promise.then(function() {
    comp.afterPreload();
    return true;
  });
}

export default Tool;
