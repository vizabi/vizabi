/*!
 * VIZABI COMPONENT
 * Base Component
 */
(function () {

  'use strict';

  var class_loading = 'vzb-loading';
  var class_loading_first = 'vzb-loading-first';
  var root = this;
  var Vizabi = root.Vizabi;
  var Promise = Vizabi.Promise;
  var utils = Vizabi.utils;
  var templates = {};
  var Component = Vizabi.Events.extend({

    /**
     * Initializes the component
     * @param {Object} config Initial config, with name and placeholder
     * @param {Object} parent Reference to tool
     */
    init: function (config, parent) {
      this._id = this._id || utils.uniqueId('c');
      this._ready = false;
      this._readyOnce = false;
      this.name = this.name || config.name;
      this.template = this.template || '<div></div>';
      this.placeholder = this.placeholder || config.placeholder;
      this.template_data = this.template_data || {
          name: this.name
        };
      //make sure placeholder is DOM element
      if (this.placeholder && !utils.isElement(this.placeholder)) {
        try {
          this.placeholder = parent.placeholder.querySelector(this.placeholder);
        } catch (e) {
          utils.error('Error finding placeholder \'' + this.placeholder + '\' for component \'' + this.name + '\'');
        }
      }
      this.parent = parent || this;
      this.root = this.parent.root || this;

      this.components = this.components || [];
      this._components_config = this.components.map(function (x) {
        return utils.clone(x);
      });
      this._frameRate = 10;
      //define expected models for this component
      this.model_expects = this.model_expects || [];
      this.model_binds = this.model_binds || {};
      this.ui = this.ui || config.ui;
      this._super();
      //readyOnce alias
      var _this = this;
      this.on({
        'readyOnce': function () {
          if (typeof _this.readyOnce === 'function') {
            _this.readyOnce();
          }
        },
        'ready': function () {
          if (typeof _this.ready === 'function') {
            _this.ready();
          }
        },
        'domReady': function () {
          if (typeof _this.domReady === 'function') {
            _this.domReady();
          }
        },
        'resize': function () {
          if (typeof _this.resize === 'function') {
            _this.resize();
          }
        }
      });
      this.triggerResize = utils.throttle(this.triggerResize);
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

    /**
     * Renders the component (after data is ready)
     */
    render: function () {
      var _this = this;
      this.loadTemplate();
      this.loadComponents();
      //render each subcomponent
      utils.forEach(this.components, function (subcomp) {
        subcomp.render();
        _this.on('resize', function () {
          subcomp.trigger('resize');
        });
      });

      //if it's a root component with model
      if (this.isRoot() && this.model) {
        this.model.on('ready', function () {
          done();
        });
        this.model.setHooks();

        var splashScreen = this.model.data.splash;

        preloader(this).then(function() {

          if(splashScreen) {

            //TODO: cleanup hardcoded splash screen
            var timeMdl = _this.model.state.time;
            timeMdl.splash = true;
            var temp = utils.clone(timeMdl.getObject(), ['start', 'end']);
            
            _this.model.load({ splashScreen: true }).then(function(){
              //delay to avoid conflicting with setReady
              utils.delay(function() {
                //force loading because we're restoring time.
                _this.model.setLoading('restore_orig_time');
                timeMdl.start = temp.start;
                timeMdl.end =  temp.end;
                _this.model.load().then(function() {
                  _this.model.setLoadingDone('restore_orig_time');
                  timeMdl.splash = false;
                  timeMdl.trigger('change');
                });
              }, 300);

            });
          }
          else {
            _this.model.load();
          }
        });

      } else if (this.model && this.model.isLoading()) {
        this.model.on('ready', function () {
          done();
        });
      } else {
        done();
      }

      function done() {
        utils.removeClass(_this.placeholder, class_loading);
        utils.removeClass(_this.placeholder, class_loading_first);
        _this.setReady();
      }
    },
    setReady: function (value) {
      if (!this._readyOnce) {
        this.trigger('readyOnce');
        this._readyOnce = true;
      }

      this._ready = true;
      this.trigger('ready');
    },

    /**
     * Loads the template
     * @returns defer a promise to be resolved when template is loaded
     */
    loadTemplate: function () {
      var tmpl = this.template;
      var data = this.template_data;
      var _this = this;
      var rendered = '';
      if (!this.placeholder) {
        return;
      }
      //todo: improve t function getter + generalize this
      data = utils.extend(data, {
        t: this.getTranslationFunction(true)
      });
      if (this.template) {
        try {
          rendered = templateFunc(tmpl, data);
        } catch (e) {
          utils.error('Templating error for component: \'' + this.name + '\' - Check if path to template is correct. E.g.: \'src/components/...\'');
        }
      }
      //add loading class and html
      utils.addClass(this.placeholder, class_loading);
      utils.addClass(this.placeholder, class_loading_first);
      this.placeholder.innerHTML = rendered;
      this.element = this.placeholder.children[0];
      //only tools have layout (manage sizes)
      if (this.layout) {
        this.layout.setContainer(this.element);
        this.layout.on('resize', function () {
          if (_this._ready) {
            _this.triggerResize();
          }
        });
      }
      //template is ready
      this.trigger('domReady');
    },

    triggerResize: function () {
      this.trigger('resize');
    },

    /*
     * Loads all subcomponents
     */
    loadComponents: function () {
      var _this = this;
      var config;
      var comp;
      //use the same name for collection
      this.components = [];
      //external dependencies let this model know what it
      //has to wait for
      if (this.model) {
        this.model.resetDeps();
      }
      // Loops through components, loading them.
      utils.forEach(this._components_config, function (c) {
        if (!c.component) {
          utils.error('Error loading component: name not provided');
          return;
        }
        if (!(comp = Vizabi.Component.get(c.component))) {
          return;
        }
        config = utils.extend(c, {
          name: c.component,
          ui: _this._uiMapping(c.placeholder, c.ui)
        });
        //instantiate new subcomponent
        var subcomp = new comp(config, _this);
        var c_model = c.model || [];
        subcomp.model = _this._modelMapping(subcomp.name, c_model, subcomp.model_expects, subcomp.model_binds);
        //subcomponent model is initialized in frozen state
        //unfreeze to dispatch events
        subcomp.model.unfreeze();
        _this.components.push(subcomp);
      });
    },

    /**
     * Checks whether this is the root component
     * @returns {Boolean}
     */
    isRoot: function () {
      return this.parent === this;
    },
      
    /**
     * Returns subcomponent by name
     * @returns {Boolean}
     */
    findChildByName: function (name) {
      return utils.find(this.components, function(f){return f.name === name});
    },

    /**
     * Get layout profile of the current resolution
     * @returns {String} profile
     */
    getLayoutProfile: function () {
      //get profile from parent if layout is not available
      if (this.layout) {
        return this.layout.currentProfile();
      } else {
        return this.parent.getLayoutProfile();
      }
    },

    //TODO: make ui mapping more powerful
    /**
     * Maps the current ui to the subcomponents
     * @param {String} id subcomponent id (placeholder)
     * @param {Object} ui Optional ui parameters to overwrite existing
     * @returns {Object} the UI object
     */
    _uiMapping: function (id, ui) {
      //if overwritting UI
      if (ui) {
        return new Vizabi.Model(ui);
      }
      if (id && this.ui) {
        id = id.replace('.', '');
        //remove trailing period
        var sub_ui = this.ui[id];
        if (sub_ui) {
          return sub_ui;
        }
      }
      return this.ui;
    },

    /**
     * Maps the current model to the subcomponents
     * @param {String} subcomponent name of the subcomponent
     * @param {String|Array} model_config Configuration of model
     * @param {String|Array} model_expects Expected models
     * @param {Object} model_binds Initial model bindings
     * @returns {Object} the model
     */
    _modelMapping: function (subcomponent, model_config, model_expects, model_binds) {
      var _this = this;
      var values = {};
      //If model_config is an array, we map it
      if (utils.isArray(model_config) && utils.isArray(model_expects)) {

        //if there's a different number of models received and expected
        if (model_expects.length !== model_config.length) {
          utils.groupCollapsed('DIFFERENCE IN NUMBER OF MODELS EXPECTED AND RECEIVED');
          utils.warn('Please, configure the \'model_expects\' attribute accordingly in \'' + subcomponent + '\' or check the models passed in \'' + _this.name + '\'.\n\nComponent: \'' + _this.name + '\'\nSubcomponent: \'' + subcomponent + '\'\nNumber of Models Expected: ' + model_expects.length + '\nNumber of Models Received: ' + model_config.length);
          utils.groupEnd();
        }
        utils.forEach(model_config, function (m, i) {
          var model_info = _mapOne(m);
          var new_name;
          if (model_expects[i]) {
            new_name = model_expects[i].name;
            if (model_expects[i].type && model_info.type !== model_expects[i].type && (!utils.isArray(model_expects[i].type) ||
              model_expects[i].type.indexOf(model_info.type) === -1)) {

              utils.groupCollapsed('UNEXPECTED MODEL TYPE: \'' + model_info.type + '\' instead of \'' + model_expects[i].type + '\'');
              utils.warn('Please, configure the \'model_expects\' attribute accordingly in \'' + subcomponent + '\' or check the models passed in \'' + _this.name + '\'.\n\nComponent: \'' + _this.name + '\'\nSubcomponent: \'' + subcomponent + '\'\nExpected Model: \'' + model_expects[i].type + '\'\nReceived Model\'' + model_info.type + '\'\nModel order: ' + i);
              utils.groupEnd();
            }
          } else {

            utils.groupCollapsed('UNEXPECTED MODEL: \'' + model_config[i] + '\'');
            utils.warn('Please, configure the \'model_expects\' attribute accordingly in \'' + subcomponent + '\' or check the models passed in \'' + _this.name + '\'.\n\nComponent: \'' + _this.name + '\'\nSubcomponent: \'' + subcomponent + '\'\nNumber of Models Expected: ' + model_expects.length + '\nNumber of Models Received: ' + model_config.length);
            utils.groupEnd();
            new_name = model_info.name;
          }
          values[new_name] = model_info.model;
        });
        var existing = model_config.length;
        var expected = model_expects.length;
        if (expected > existing) {
          //skip existing
          model_expects.splice(0, existing);
          //adds new expected models if needed
          utils.forEach(expected, function (m) {
            values[m.name] = {};
          });
        }
      } else {
        return;
      }
      //return a new model with the defined submodels
      return new Vizabi.Model(values, null, model_binds, true);
      /**
       * Maps one model name to current submodel and returns info
       * @param {String} name Full model path. E.g.: "state.marker.color"
       * @returns {Object} the model info, with name and the actual model
       */
      function _mapOne(name) {
        var parts = name.split('.');
        var current = _this.model;
        var current_name = '';
        while (parts.length) {
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
    getTranslationFunction: function (wrap) {
      var t_func;
      try {
        t_func = this.model.get('language').getTFunction();
      } catch (err) {
        if (this.parent && this.parent !== this) {
          t_func = this.parent.getTranslationFunction();
        }
      }
      if (!t_func) {
        t_func = function (s) {
          return s;
        };
      }
      if (wrap) {
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
    _translatedStringFunction: function (translation_function) {
      return function (string) {
        var translated = translation_function(string);
        return '<span data-vzb-translate="' + string + '">' + translated + '</span>';
      };
    },

    /**
     * Translate all strings in the template
     */
    translateStrings: function () {
      var t = this.getTranslationFunction();
      var strings = this.placeholder.querySelectorAll('[data-vzb-translate]');
      if (strings.length === 0) {
        return;
      }
      utils.forEach(strings, function (str) {
        if (!str || !str.getAttribute) {
          return;
        }
        str.innerHTML = t(str.getAttribute('data-vzb-translate'));
      });
    },

    /**
     * Checks whether this component is a tool or not
     * @returns {Boolean}
     */
    isTool: function () {
      return this._id[0] === 't';
    },

    /**
     * Executes after the template is loaded and rendered.
     * Ideally, it contains HTML instantiations related to template
     * At this point, this.element and this.placeholder are available
     * as DOM elements
     */
    readyOnce: function () {
    },

    /**
     * Executes after the template and model (if any) are ready
     */
    ready: function () {
    },

    /**
     * Executes when the resize event is triggered.
     * Ideally, it only contains operations related to size
     */
    resize: function () {
    }
  });

  /**
   * Preloader implementation with promises
   * @param {Object} comp any component
   * @returns {Promise}
   */
  function preloader(comp) {
    var promise = new Promise();
    var promises = []; //holds all promises

    //preload all subcomponents first
    utils.forEach(comp.components, function (subcomp) {
        promises.push(preloader(subcomp));
    });

    var wait = promises.length ? Promise.all(promises) : new Promise.resolve();
    wait.then(function () {
      comp.preload(promise);
    }, function(err) {
      utils.error("Error preloading data:", err);
    });

    return promise.then(function() {
      comp.afterPreload();
      return true;
    });
  }

  // Based on Simple JavaScript Templating by John Resig
  //generic templating function
  function templateFunc(str, data) {
    // Figure out if we're getting a template, or if we need to
    // load the template - and be sure to cache the result.
    var fn = !/<[a-z][\s\S]*>/i.test(str) ? templates[str] = templates[str] || templateFunc(root.document.getElementById(str).innerHTML) : // Generate a reusable function that will serve as a template
      // generator (and which will be cached).
      new Function('obj', 'var p=[],print=function(){p.push.apply(p,arguments);};' + // Introduce the data as local variables using with(){}
        'with(obj){p.push(\'' + // Convert the template into pure JavaScript
        str.replace(/[\r\t\n]/g, ' ').split('<%').join('\t').replace(/((^|%>)[^\t]*)'/g, '$1\r').replace(/\t=(.*?)%>/g, '\',$1,\'').split('\t').join('\');').split('%>').join('p.push(\'').split('\r').join('\\\'') + '\');}return p.join(\'\');');
    // Provide some basic currying to the user
    return data ? fn(data) : fn;
  }

  //utility function to check if a component is a component
  //TODO: Move to utils?
  Component.isComponent = function (c) {
    return c._id && (c._id[0] === 't' || c._id[0] === 'c');
  };

  Vizabi.Component = Component;

}.call(this));
