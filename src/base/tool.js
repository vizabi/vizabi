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
    values = defaultOptions(values, defaults);
    //constructor is similar to model
    this._super(name, values, null, binds, true);
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
   * @param {Object} options Options such as state, data, etc
   */
  init: function(placeholder, options) {
    this._id = utils.uniqueId('t');
    this.template = this.template || '<div class="vzb-tool vzb-tool-' + this.name +
      '"><div class="vzb-tool-content"><div class="vzb-tool-stage"><div class="vzb-tool-viz"></div><div class="vzb-tool-timeslider"></div></div><div class="vzb-tool-buttonlist"></div><div class="vzb-tool-treemenu vzb-hidden"></div><div class="vzb-tool-datawarning vzb-hidden"></div></div></div>';
    this.model_binds = this.model_binds || [];
    
    options = options || {}; //options can be undefined
    options.bind = options.bind || {}; //bind functions can be undefined

    this.default_options = this.default_options || {};
    
    //bind the validation function with the tool
    var validate = this.validate.bind(this);
    var _this = this;

    // callbacks has to be an array so that it will not be turned into a submodel when the toolmodel is made.
    var callbacks = {
      'change': function(evt, path) {
        if(_this._ready) {
          _this.model.validate();

          if (evt.persistent)
            _this.model.trigger(new DefaultEvent(evt.source, 'persistentChange'));
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
      },
      'load_start': function() {
        _this.beforeLoading();
      },
      'ready': function(evt) {
        if(_this._ready) {
          _this.afterLoading();
          _this.model.trigger('historyUpdate', _this.minState());
        }
      }
    };
    utils.extend(callbacks, this.model_binds, options.bind);
    delete options.bind;

    this.model = new ToolModel(this.name, options, this.default_options, callbacks, validate);

    //ToolModel starts in frozen state. unfreeze;
    this.model.unfreeze();

    this.ui = this.model.ui || {};

    this.layout = new Layout(this.ui);
    //splash
    this.ui.splash = this.model && this.model.data && this.model.data.splash;
    this._super({
      name: this.name || this._id,
      placeholder: placeholder
    }, this);
    this.render();
    this._setUIOptions();
  },

  minState: function() {
    var state = this.model.state.getObject();
    var d_state = this.default_options.state;
    //flattens _defs_ object
    d_state = utils.flattenDefaults(d_state);
    //compares with chart default options
    var d = utils.flattenDates(utils.diffObject(state, d_state));
    //compares with model's defaults
    return utils.diffObject(d, this.model.state.getDefaults());
  },

  /**
   * Clears a tool
   */

  clear: function() {
    this.layout.clear();
    this.setOptions = this.getOptions = function() {
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
   * Sets options from external page
   * @param {Object} options new options
   * @param {Boolean} overwrite overwrite everything instead of extending
   */
  setOptions: function(options, overwrite) {
    if(overwrite) {
      this.model.reset(options);
    } else {
      this.model.set(changedObj(options, this.getOptions()));
    }
    this._setUIOptions();
  },

  /**
   * gets all options
   * @return {Object} JSON object with options
   */
  getOptions: function() {
    return this.model.getObject() || {};
  },
  /**
   * Displays loading class
   */
  beforeLoading: function() {
    if(!this._readyOnce) {
      utils.addClass(this.placeholder, class_loading_first);
    }
    if(!utils.hasClass(this.placeholder, class_loading_data)) {
      utils.addClass(this.placeholder, class_loading_data);
    }
  },
  /**
   * Removes loading class
   */
  afterLoading: function() {
    utils.removeClass(this.placeholder, class_loading_data);
    utils.removeClass(this.placeholder, class_loading_first);
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

    if(!marker) {
      utils.warn("tool validation aborted: marker looks wrong: " + label);
      return;
    };

    //don't validate anything if data hasn't been loaded
    if(model.isLoading() || !marker.getKeys() || marker.getKeys().length < 1) return;

    var dateMin = marker.getLimits(time.getDimension()).min;
    var dateMax = marker.getLimits(time.getDimension()).max;

    if(!utils.isDate(dateMin)) utils.warn("tool validation: min date looks wrong: " + dateMin);
    if(!utils.isDate(dateMax)) utils.warn("tool validation: max date looks wrong: " + dateMax);

    if(time.start < dateMin) time.start = dateMin;
    if(time.end > dateMax) time.end = dateMax;
  },

  _setUIOptions: function() {
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
    var model = JSON.stringify(m.getObject());
    var c = arguments[0] || 0;
    //TODO: remove validation hotfix
    //while setting this.model is not available
    if(!this._readyOnce) {
      validate(this);
    } else {
      validate();
    }
    var model2 = JSON.stringify(m.getObject());
    if(c >= max) {
      utils.error('Max validation loop.');
    } else if(model !== model2) {
      validate_func.call(this, [c += 1]);
    }
  }

  return validate_func;
}

/* ==========================
 * Default options methods
 * ==========================
 */

/**
 * Generates a valid state based on default options
 */
function defaultOptions(values, defaults) {
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
        values[field] = defaultOptions({}, blueprint);
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
      values[field] = defaultOptions(values[field], blueprint);
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
      var comp2 = compare[name].getFullYear().toString();
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

export default Tool;
