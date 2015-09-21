/*!
 * VIZABI COMPONENT
 * Base Component
 */
(function () {
  'use strict';
  var class_loading = 'vzb-loading';
  var class_loading_first = 'vzb-loading-first';
  var class_loading_data = 'vzb-loading';
  var class_loading_error = 'vzb-loading-error';
  var class_placeholder = 'vzb-placeholder';
  var class_buttons_off = 'vzb-buttonlist-off';
  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;
  var templates = {};
  var toolsList = {};
  //tool model is quite simple and doesn't need to be registered
  var ToolModel = Vizabi.Model.extend({
    /**
     * Initializes the tool model.
     * @param {Object} values The initial values of this model
     * @param {Object} binds contains initial bindings for the model
     * @param {Function|Array} validade validate rules
     */
    init: function (values, defaults, binds, validate) {
      this._id = utils.uniqueId('tm');
      this._type = 'tool';
      //generate validation function
      this.validate = generateValidate(this, validate);
      //default submodels
      values = values || {};
      defaults = defaults || {};
      values = defaultOptions(values, defaults);
      //constructor is similar to model
      this._super(values, null, binds, true);
      // change language
      if (values.language) {
        var _this = this;
        this.on('change:language', function () {
          _this.trigger('translate');
        });
      }
    }
  });
  //tool
  var Tool = Vizabi.Component.extend({
    /**
     * Initializes the tool
     * @param {Object} placeholder object
     * @param {Object} options Options such as state, data, etc
     */
    init: function (placeholder, options) {
      this._id = utils.uniqueId('t');
      this.layout = new Vizabi.Layout();
      this.template = this.template || '<div class="vzb-tool vzb-tool-' + this.name + '"><div class="vzb-tool-content"><div class="vzb-tool-stage"><div class="vzb-tool-viz"></div><div class="vzb-tool-timeslider"></div></div><div class="vzb-tool-buttonlist"></div><div class="vzb-tool-treemenu vzb-hidden"></div></div></div>';
      this.model_binds = this.model_binds || {};
      this.default_options = this.default_options || {};
      //bind the validation function with the tool
      var validate = this.validate.bind(this);
      var _this = this;
      var callbacks = utils.merge({
        'change': function (evt, val) {
          if (_this._ready) {
            _this.model.validate();
            _this.trigger(evt, val);
          }
        },
        'translate': function (evt, val) {
          if (_this._ready) {
            Vizabi.Promise.all([_this.preloadLanguage(), _this.model.load()])
                          .then(function() {
                            _this.model.validate();
                            _this.translateStrings();
                          });
          }
        },
        'load_start': function () {
          _this.beforeLoading();
        },
        'load_error': function () {
          _this.errorLoading();
        },
        'ready': function (evt) {
          if (_this._ready) {
            _this.afterLoading();
          }
        }
      }, this.model_binds);
      options = options || {};
      this.model = new ToolModel(options, this.default_options, callbacks, validate);
      //ToolModel starts in frozen state. unfreeze;
      this.model.unfreeze();
      this.ui = this.model.ui;
      //splash 
      this.ui.splash = this.model.data.splash;
      this._super({
        name: this.name || this._id,
        placeholder: placeholder
      }, this);
      this._bindEvents();
      this.render();
      this._setUIOptions();
    },
    /**
     * Binds events in model to outside world
     */
    _bindEvents: function () {
      if (!this.model.bind) {
        return;
      }
      this.on(this.model.bind.get());
    },

    /**
     * Sets options from external page
     * @param {Object} options new options
     * @param {Boolean} overwrite overwrite everything instead of extending
     */
    setOptions: function (options, overwrite) {
      if (overwrite) {
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
    getOptions: function () {
      return this.model.getObject() || {};
    },
    /**
     * Displays loading class
     */
    beforeLoading: function () {
      if (!this._readyOnce) {
        utils.addClass(this.placeholder, class_loading_first);
      }
      if (!utils.hasClass(this.placeholder, class_loading_data)) {
        utils.addClass(this.placeholder, class_loading_data);
      }
    },
    /**
     * Removes loading class
     */
    afterLoading: function () {
      utils.removeClass(this.placeholder, class_loading_data);
      utils.removeClass(this.placeholder, class_loading_first);
    },
    /**
     * Adds loading error class
     */
    errorLoading: function () {
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
    validate: function (model) {

        model = this.model || model;
        
        if(!model || !model.state) {utils.warn("tool validation aborted: model.state looks wrong: " + model); return;};

        var time = model.state.time;
        var marker = model.state.marker;
        
        if(!time) {utils.warn("tool validation aborted: time looks wrong: " + time); return;};
        if(!marker) {utils.warn("tool validation aborted: marker looks wrong: " + marker); return;};
        
        var label = marker.label;
        
        if(!label) {utils.warn("tool validation aborted: marker label looks wrong: " + label); return;};

        //don't validate anything if data hasn't been loaded
        if (model.isLoading() || !label.getKeys() || label.getKeys().length < 1) return;        

        var dateMin = label.getLimits(time.getDimension()).min;
        var dateMax = label.getLimits(time.getDimension()).max;

        if(!utils.isDate(dateMin)) utils.warn("tool validation: min date looks wrong: " + dateMin);
        if(!utils.isDate(dateMax)) utils.warn("tool validation: max date looks wrong: " + dateMax);
        
        if (time.start < dateMin) time.start = dateMin;
        if (time.end > dateMax) time.end = dateMax;
    },
      
    _setUIOptions: function () {
      //add placeholder class
      utils.addClass(this.placeholder, class_placeholder);
      //add-remove buttonlist class
      if (!this.ui || !this.ui.buttons || !this.ui.buttons.length) {
        utils.addClass(this.element, class_buttons_off);
      } else {
        utils.removeClass(this.element, class_buttons_off);
      }
    },

    preloadLanguage: function() {
      return Vizabi.Promise.resolve();
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
      if (!this._readyOnce) {
        validate(this);
      } else {
        validate();
      }
      var model2 = JSON.stringify(m.getObject());
      if (c >= max) {
        utils.error('Max validation loop.');
      } else if (model !== model2) {
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
    for (var i = 0; i < size; i += 1) {
      field = keys[i];
      if (field === '_defs_') {
        continue;
      }
      blueprint = defaults[field];
      original = values[field];
      type = typeof blueprint;
      if (type === 'object') {
        type = utils.isPlainObject(blueprint) && blueprint._defs_ ? 'object' : utils.isArray(blueprint) ? 'array' : 'model';
      }
      if (typeof original === 'undefined') {
        if (type !== 'object' && type !== 'model') {
          values[field] = blueprint;
        } else {
          values[field] = defaultOptions({}, blueprint);
        }
      }
      original = values[field];
      if (type === 'number' && isNaN(original)) {
        values[field] = 0;
      } else if (type === 'string' && typeof original !== 'string') {
        values[field] = '';
      } else if (type === 'array' && !utils.isArray(original)) {
        values[field] = [];
      } else if (type === 'model') {
        if (!utils.isObject(original)) {
          values[field] = {};
        }
        values[field] = defaultOptions(values[field], blueprint);
      } else if (type === 'object') {
        if (!utils.isObject(original) || Object.keys(original).length === 0) {
          original = false; //will be overwritten
        }
        if (!utils.isObject(blueprint._defs_)) {
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
      }
      else if(utils.isObject(val)) {
        acc[name] = changedObj(val, compare[name]);
      }
      else if(utils.isDate(compare[name])){
        var comp1 = val.toString();
        //TODO: workaround for years only
        var comp2 = compare[name].getFullYear().toString();
        if(comp1 !== comp2) {
          acc[name] = val;
        }
      }
      else {
        acc[name] = val;
      }
    });
    return acc;
  }

  //utility function to check if a component is a tool
  //TODO: Move to utils?
  Tool.isTool = function (c) {
    return c._id && c._id[0] === 't';
  };

  Vizabi.Tool = Tool;
}.call(this));
