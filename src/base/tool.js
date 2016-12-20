import * as utils from 'base/utils'
import Model from 'base/model'
import Component from 'base/component'
import { DefaultEvent } from 'base/events'
import { warn as warnIcon } from 'base/iconset'

var class_loading_first = 'vzb-loading-first';
var class_loading_data = 'vzb-loading-data';
var class_placeholder = 'vzb-placeholder';
var class_buttons_off = 'vzb-buttonlist-off';

var templates = {};

//tool model is quite simple and doesn't need to be registered
var ToolModel = Model.extend({
  /**
   * Initializes the tool model.
   * @param {Tool}   the tool this tool model belongs to
   * @param {Object} values The initial values of this model
   */
  init: function(tool, external_model) {
    this._id = utils.uniqueId('tm');
    this._type = 'tool';
    this._component = tool;

    // defaults are defined on the Tool
    // this way, each tool can have it's own default model
    this.getClassDefaults = () => tool.default_model;

    // combine listeners from tool and external page to one object
    var listeners = utils.extend(tool.getToolListeners(), external_model.bind);
    delete external_model.bind; // bind shouldn't go to model tree

    this._super(tool.name, external_model, null, listeners);
  },

  /**
   * @return {object} Defaults of tool model and children
   * Tool defaults overwrite other models' default
   */
  getDefaults: function() {
    return utils.deepExtend({}, this.getSubmodelDefaults(), this.getClassDefaults());
  },

  validate: function() {

    var max = 10;
    var c = 0;
    var _this = this;

    function validate_func(c) {
      // ToolModel uses validate function declared on Tool so each Tool can have its own validation.
      var model = JSON.stringify(_this.getPlainObject());
      _this._component.validate(_this);
      var model2 = JSON.stringify(_this.getPlainObject());

      if(c >= max) {
        utils.error('Max validation loop.');
      } else if(model !== model2) {
        validate_func(c++);
      }
    }

    validate_func(c);
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

    this.template = this.getToolTemplate();

    // super also calls createModel
    this._super({
      placeholder: placeholder,
      model: external_model
    });

    // 

    //splash
    this.model.ui.splash = this.model && this.model.data && this.model.data.splash;

    this.render();

    this.setCSSClasses();
    this.setResizeHandler();
  },

  createModel: function(external_model) {
    external_model      = external_model      || {}; //external model can be undefined
    external_model.bind = external_model.bind || {}; //bind functions can be undefined
    this.model = new ToolModel(this, external_model);
    this.model.setInterModelListeners();
  },
  
  getToolTemplate: function() {
    return this.template || 
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
  },

  getToolListeners: function() {
    var _this = this;
    return utils.extend( 
      this.model_binds, 
      {
        'change': function(evt, path) {
          if(_this._ready) {
            _this.model.validate();

            if (evt.source.persistent)
              _this.model.trigger(new DefaultEvent(evt.source, 'persistentChange'));
          }
        },
        'hook_change': function() {
          if (!_this.model.state.time.splash) { // not block when it initial splash screen
            _this.beforeLoading();
          }
        },
        'change:ui.presentation': function() {
          _this.model.ui.updatePresentation();
          _this.trigger('resize');
        },
        'resize:ui': function() {
          if(_this._ready) {
            _this.triggerResize();
          }
        },
        'translate:locale': function() {
          _this.translateStrings();
          _this.model.ui.setRTL(_this.model.locale.isRTL());
        },
        'load_error': this.renderError.bind(this)
      });
  },

  setResizeHandler: function() {
    //only tools have layout (manage sizes)
    this.model.ui.setContainer(this.element);
  },

  triggerResize: utils.throttle(function() {
    this.trigger('resize');
  }, 100),

  startLoading: function() {
    this._super();
    var splashScreen = this.model && this.model.data && this.model.data.splash;
    var _this = this;

    var preloadPromises = []; //holds all promises

    preloadPromises.push(this.model.startPreload());
    preloadPromises.push(this.startPreload());

    Promise.all(preloadPromises).then(function() {
      _this.afterPreload();


      var timeMdl = _this.model.state.time;

      if(splashScreen) {

        //TODO: cleanup hardcoded splash screen
        timeMdl.splash = true;

        _this.model.startLoading({
          splashScreen: true
        }).then(function() {
          //delay to avoid conflicting with setReady
          utils.delay(function() {
            //force loading because we're restoring time.

            _this.model.startLoading().then(function() {
              timeMdl.splash = false;
              _this.startEverything();
              //_this.model.data.splash = false;
            });
          }, 300);

        }, function() {
          _this.renderError();
        });
      } else {
        _this.model.startLoading().then(function() {
          utils.delay(function() {
            if(timeMdl) {
              timeMdl.splash = false;
              timeMdl.trigger('change');
            } else {
              _this.loadingDone();
            }
          }, 300);
        }, function() {
          _this.renderError();
        });
      }
    })
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
    removeFunctions(currentToolModel);
    return currentToolModel;
  },

  getPersistentMinimalModel: function(diffModel) {
    var defaultModel = this.model.getDefaults();
    var currentPersistentModel = this.getPersistentModel();
    var redundantModel = utils.deepExtend(defaultModel, diffModel);
    return utils.diffObject(currentPersistentModel, redundantModel);
  },

  /**
   * Clears a tool
   */

  clear: function() {
    this.model.ui.clear();
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
    this.setCSSClasses();
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
  beforeLoading: function() {
    utils.addClass(this.placeholder, class_loading_data);    
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

  setCSSClasses: function() {
    //add placeholder class
    utils.addClass(this.placeholder, class_placeholder);
    //add-remove buttonlist class
    if(!this.model.ui || !this.model.ui.buttons || !this.model.ui.buttons.length) {
      utils.addClass(this.element, class_buttons_off);
    } else {
      utils.removeClass(this.element, class_buttons_off);
    }
  }

});

export default Tool;
