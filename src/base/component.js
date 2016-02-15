import * as utils from 'utils';
import Events from 'events';
import Model from 'model';
import Promise from 'promise';

var class_loading = 'vzb-loading';
var class_loading_first = 'vzb-loading-first';
var class_error = 'vzb-error';

var templates = {};


var ComponentModel = Model.extend({
  loadSubmodels: function() {
    var promises = [];
    var subModels = this.getSubmodels();
    utils.forEach(subModels, function(subModel) {
      // don't load them submodels, just listen to their promises
      promises.push(subModel._loadPromise);
    });
    return promises.length > 0 ? Promise.all(promises) : new Promise().resolve();
  }
});

var Component = Events.extend({

  /**
   * Initializes the component
   * @param {Object} config Initial config, with name and placeholder
   * @param {Object} parent Reference to tool
   */
  init: function(config, parent) {
    this._id = this._id || utils.uniqueId('c');
    this._ready = new Promise();
    this._readyOnce = new Promise();
    this._domReady = new Promise();
    this.name = this.name || config.name;
    this.template = this.template || '<div></div>';
    this.placeholder = this.placeholder || config.placeholder;
    this.template_data = this.template_data || {
      name: this.name
    };
    //make sure placeholder is DOM element
    if(this.placeholder && !utils.isElement(this.placeholder)) {
      try {
        this.placeholder = parent.placeholder.querySelector(this.placeholder);
      } catch(e) {
        utils.error('Error finding placeholder \'' + this.placeholder + '\' for component \'' + this.name + '\'');
      }
    }
    this.parent = parent || this;
    this.root = this.parent.root || this;

    this.components = this.components || [];
    this._components_config = this.components.map(function(x) {
      return utils.clone(x);
    });
    this._frameRate = 10;
    //define expected models for this component
    this.model_expects = this.model_expects || [];
    this.model_binds   = this.model_binds   || {};
    this.initiateModel(config.model);

    this._super();

    var _this = this;

    this._readyOnce.then(this.readyOnce.bind(this));
    this._ready.then(function() {
      _this.ready();
    });
    this._domReady.then(this.domReady.bind(this));

    this.on({
      'resize': function() {
        if(typeof _this.resize === 'function') {
          _this.resize();
        }
      }
    });
  },

  initiateModel: function(configModel) {
    this.model = this._modelMapping(configModel);
  },

  /**
   * Preloads data before anything else
   */
  preload: function(promise) {
    promise.resolve(); //by default, load nothing
  },

  /**
   * Executes after preloading is finished
   */
  afterPreload: function() {
    if(this.model) {
      this.model.afterPreload();
    }
  },


  loadComponentModels: function() {
    utils.forEach(this.components, function(subcomp) {
      subcomp.loadComponentModels();
    });

    return this.model.load();
  },

  /**
   * Renders the component (after data is ready)
   */
  render: function() {
    var _this = this;
    this.loadTemplate();
    this.loadSubComponents();
    //render each subcomponent
    utils.forEach(this.components, function(subcomp) {
      subcomp.render();
      _this.on('resize', function() {
        subcomp.trigger('resize');
      });
    });

    this.model._readyPromise.then(
      this.setReady.bind(this),
      renderError.bind(this)
    );

/*
    //if it's a root component with model
    if(this.isRoot() && this.model) {

      var splashScreen = this.model && this.model.data && this.model.data.splash;

      preloader(this).then(function() {
        var timeMdl = _this.model.state.time;
        if(splashScreen) {

          //TODO: cleanup hardcoded splash screen
          timeMdl.splash = true;
          timeMdl.beyondSplash = utils.clone(timeMdl.getPlainObject(), ['start', 'end']);

          _this.model.load({
            splashScreen: true
          }).then(function() {
            //delay to avoid conflicting with setReady
            utils.delay(function() {
              //force loading because we're restoring time.
              _this.model.setLoading('restore_orig_time');
              //restore because validation kills the original start/end
              timeMdl.start = timeMdl.beyondSplash.start;
              timeMdl.end = timeMdl.beyondSplash.end;
              delete timeMdl.beyondSplash;

              _this.model.load().then(function() {
                _this.model.setLoadingDone('restore_orig_time');
                timeMdl.splash = false;
                timeMdl.trigger('change', timeMdl.getPlainObject());
              });
            }, 300);

          }, function() {
            renderError();
          });
        }
      });

    }
*/


    function renderError() {
      utils.removeClass(this.placeholder, class_loading);
      utils.addClass(this.placeholder, class_error);
      this.setError({
        type: 'data'
      });
    }

  },

  setReady: function() {
    utils.removeClass(this.placeholder, class_loading);
    utils.removeClass(this.placeholder, class_loading_first);
    this._readyOnce.resolve();
    this._ready.resolve();  
  },


  setError: function(opts) {
    if(typeof this.error === 'function') {
      this.error(opts);
    }
  },

  /**
   * Loads the template
   * @returns defer a promise to be resolved when template is loaded
   */
  loadTemplate: function() {
    var tmpl = this.template;
    var data = this.template_data;
    var _this = this;
    var rendered = '';
    if(!this.placeholder) {
      return;
    }
    //todo: improve t function getter + generalize this
    data = utils.extend(data, {
      t: this.getTranslationFunction(true)
    });
    if(this.template) {
      try {
        rendered = templateFunc(tmpl, data);
      } catch(e) {
        utils.error('Templating error for component: \'' + this.name +
          '\' - Check if template name is unique and correct. E.g.: \'bubblechart\'');

        utils.removeClass(this.placeholder, class_loading);
        utils.addClass(this.placeholder, class_error);
        this.setError({
          type: 'template'
        });
      }
    }
    //add loading class and html
    utils.addClass(this.placeholder, class_loading);
    utils.addClass(this.placeholder, class_loading_first);
    this.placeholder.innerHTML = rendered;
    this.element = this.placeholder.children[0];

    this.handleResize();

    this._domReady.resolve();
  },

  handleResize: function() {
    // tool handles resize
  },

  getActiveProfile: function(profiles, presentationProfileChanges) {
    // get layout values
    var layoutProfile = this.getLayoutProfile();
    var presentationMode = this.getPresentationMode();
    var activeProfile = utils.deepClone(profiles[layoutProfile]); // clone so it can be extended without changing the original profile

    // extend the profile with presentation mode values
    if (presentationMode && presentationProfileChanges[layoutProfile]) {
      utils.deepExtend(activeProfile, presentationProfileChanges[layoutProfile]);
    }

    return activeProfile;
  },

  /*
   * Loads all subcomponents
   */
  loadSubComponents: function() {
    var _this = this;
    var config;
    var comp;
    //use the same name for collection
    this.components = [];
    //external dependencies let this model know what it
    //has to wait for
    if(this.model) {
      this.model.resetDeps();
    }
    // Loops through components, loading them.
    utils.forEach(this._components_config, function(component_config) {

      component_config.model = component_config.model || [];

      if(!component_config.component) {
        utils.error('Error loading component: component not provided');
        return;
      }

      comp = (utils.isString(component_config.component)) ? Component.get(component_config.component) : component_config.component;

      if(!comp) return;

      //instantiate new subcomponent TODO: move model to component constructor
      var subcomp = new comp(component_config, _this);
      _this.components.push(subcomp);
    });
  },

  /**
   * Checks whether this is the root component
   * @returns {Boolean}
   */
  isRoot: function() {
    return this.parent === this;
  },

  /**
   * Returns subcomponent by name
   * @returns {Boolean}
   */
  findChildByName: function(name) {
    return utils.find(this.components, function(f) {
      return f.name === name
    });
  },

  /**
   * Get layout profile of the current resolution
   * @returns {String} profile
   */
  getLayoutProfile: function() {
    //get profile from parent if layout is not available
    if(this.model.ui) {
      return this.model.ui.currentProfile();
    } else {
      return this.parent.getLayoutProfile();
    }
  },

  /**
   * Get if presentation mode is set of the current tool
   * @returns {Bool} presentation mode
   */
  getPresentationMode: function() {
    //get profile from parent if layout is not available
    if(this.model.ui) {
      return this.model.ui.getPresentationMode();
    } else {
      return this.parent.getPresentationMode();
    }
  },

  /**
   * Maps the current model to the subcomponents
   * @param {String|Array} model_config Configuration of model
   * @returns {Object} the model
   */
  _modelMapping: function(model_config) {

    var _this = this;
    var values = {};
    //If model_config is an array, we map it
    if(utils.isArray(model_config) && utils.isArray(this.model_expects)) {

      //if there's a different number of models received and expected
      if(this.model_expects.length !== model_config.length) {
        utils.groupCollapsed('DIFFERENCE IN NUMBER OF MODELS EXPECTED AND RECEIVED');
        utils.warn('Please, configure the \'model_expects\' attribute accordingly in \'' + this.name +
          '\' or check the models passed in \'' + this.parent.name + '\'.\n\nComponent: \'' + this.parent.name +
          '\'\nSubcomponent: \'' + this.name + '\'\nNumber of Models Expected: ' + this.model_expects.length +
          '\nNumber of Models Received: ' + model_config.length);
        utils.groupEnd();
      }
      utils.forEach(model_config, function(m, i) {
        var model_info = _mapOne(m);
        var new_name;
        if(_this.model_expects[i]) {
          new_name = _this.model_expects[i].name;
          if(_this.model_expects[i].type && model_info.type !== _this.model_expects[i].type && (!utils.isArray(
                _this.model_expects[i].type) ||
              _this.model_expects[i].type.indexOf(model_info.type) === -1)) {

            utils.groupCollapsed('UNEXPECTED MODEL TYPE: \'' + model_info.type + '\' instead of \'' +
              _this.model_expects[i].type + '\'');
            utils.warn('Please, configure the \'model_expects\' attribute accordingly in \'' + _this.name +
              '\' or check the models passed in \'' + _this.parent.name + '\'.\n\nComponent: \'' + _this.parent.name +
              '\'\nSubcomponent: \'' + _this.name + '\'\nExpected Model: \'' + _this.model_expects[i].type +
              '\'\nReceived Model\'' + model_info.type + '\'\nModel order: ' + i);
            utils.groupEnd();
          }
        } else {

          utils.groupCollapsed('UNEXPECTED MODEL: \'' + model_config[i] + '\'');
          utils.warn("Please, configure the 'model_expects' attribute accordingly in '" + _this.name + 
            "' or check the models passed in '" + _this.parent.name + "'.\n\nComponent: '" + _this.parent.name +
            "\nSubcomponent: '" + _this.name + "'\nNumber of Models Expected: " + _this.model_expects.length +
            "\nNumber of Models Received: " + model_config.length);
          utils.groupEnd();
          new_name = model_info.name;
        }
        values[new_name] = model_info.model;
      });

      // fill the models that weren't passed with empty objects
      // e.g. if expected = [ui, language, color] and passed/existing = [ui, language]
      // it will fill values up to [ui, language, {}]
      var existing = model_config.length;
      var expected = this.model_expects.length;
      if(expected > existing) {
        //skip existing
        this.model_expects.splice(0, existing);
        //adds new expected models if needed
        utils.forEach(expected, function(m) {
          values[m.name] = {};
        });
      }
    } else {
      return;
    }
    //return a new model with the defined submodels
    return new ComponentModel(this.name, values, null, this.model_binds);

    /**
     * Maps one model name to current submodel and returns info
     * @param {String} name Full model path. E.g.: "state.marker.color"
     * @returns {Object} the model info, with name and the actual model
     */
    function _mapOne(name) {
      var parts = name.split('.');
      var current = _this.parent.model;
      var current_name = '';
      while(parts.length) {
        current_name = parts.shift();
        current = current[current_name];
      }
      return {
        name: name,
        model: current,
        type: current ? current.getType() : null
      };
    }
  },

  /**
   * Get translation function for templates
   * @param {Boolean} wrap wrap in spam tags
   * @returns {Function}
   */
  getTranslationFunction: function(wrap) {
    var t_func;
    try {
      t_func = this.model.get('language').getTFunction();
    } catch(err) {
      if(this.parent && this.parent !== this) {
        t_func = this.parent.getTranslationFunction();
      }
    }
    if(!t_func) {
      t_func = function(s) {
        return s;
      };
    }
    if(wrap) {
      return this._translatedStringFunction(t_func);
    } else {
      return t_func;
    }
  },

  /**
   * Get function for translated string
   * @param {Function} translation_function The translation function
   * @returns {Function}
   */
  _translatedStringFunction: function(translation_function) {
    return function(string) {
      var translated = translation_function(string);
      return '<span data-vzb-translate="' + string + '">' + translated + '</span>';
    };
  },

  /**
   * Translate all strings in the template
   */
  translateStrings: function() {
    var t = this.getTranslationFunction();
    var strings = this.placeholder.querySelectorAll('[data-vzb-translate]');
    if(strings.length === 0) {
      return;
    }
    utils.forEach(strings, function(str) {
      if(!str || !str.getAttribute) {
        return;
      }
      str.innerHTML = t(str.getAttribute('data-vzb-translate'));
    });
  },

  /**
   * Checks whether this component is a tool or not
   * @returns {Boolean}
   */
  isTool: function() {
    return this._id[0] === 't';
  },

  /**
   * Executes after the template is loaded and rendered.
   * Ideally, it contains HTML instantiations related to template
   * At this point, this.element and this.placeholder are available
   * as DOM elements
   */
  readyOnce: function() {},

  /**
   * Executes after the template and model (if any) are ready
   */
  ready: function() {},  

  /**
   * Executes after template is done loading
   */
  domReady: function() {},

  /**
   * Executes when the resize event is triggered.
   * Ideally, it only contains operations related to size
   */
  resize: function() {},

  /**
   * Clears a component
   */
  clear: function() {
    this.freeze();
    if(this.model) this.model.freeze();
    utils.forEach(this.components, function(c) {
      c.clear();
    });
  }
});

// Based on Simple JavaScript Templating by John Resig
//generic templating function
function templateFunc(str, data) {

  var func = function(obj) {
    return str.replace(/<%=([^\%]*)%>/g, function(match) {
      //match t("...")
      var s = match.match(/t\s*\(([^)]+)\)/g);
      //replace with translation
      if(s.length) {
        s = obj.t(s[0].match(/\"([^"]+)\"/g)[0].split('"').join(''));
      }
      //use object[name]
      else {
        s = match.match(/([a-z\-A-Z]+([a-z\-A-Z0-9]?[a-zA-Z0-9]?)?)/g)[0];
        s = obj[s] || s;
      }
      return s;
    });
  }
  // Figure out if we're getting a template, or if we need to
  // load the template - and be sure to cache the result.
  var fn = !/<[a-z][\s\S]*>/i.test(str) ? templates[str] = templates[str] || templateFunc(document.getElementById(
      str).innerHTML) : func;

  // Provide some basic currying to the user
  return data ? fn(data) : fn;
}

//utility function to check if a component is a component
//TODO: Move to utils?
Component.isComponent = function(c) {
  return c._id && (c._id[0] === 't' || c._id[0] === 'c');
};

export default Component;
