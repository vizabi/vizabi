import * as utils from 'base/utils';
import EventSource, {DefaultEvent, ChangeEvent} from 'base/events';
import Intervals from 'base/intervals';

var ModelLeaf = EventSource.extend({

  _name: '',
  _parent: null,
  _persistent: true,

  init: function(name, value, parent, binds, persistent) {

    // getter and setter for the value
    Object.defineProperty(this, 'value', {
      get: this.get,
      set: this.set
    });
    Object.defineProperty(this, 'persistent', {
      get: function() { return this._persistent; }
    });

    this._super();

    this._name = name;
    this._parent = parent;
    this._root = parent._root;
    this.set(value, false, persistent);
    this.on(binds); // after super so there is an .events object
  },

  // if they want a persistent value and the current value is not persistent, return the last persistent value
  get: function(persistent) {
    return (persistent && !this._persistent) ? this._persistentVal : this._val;
  },

  set: function(val, force, persistent) {
    if (this.isSetAllowed(val, force)) {
      // persistent defaults to true
      persistent = (typeof persistent !== 'undefined') ? persistent : true;

      // set leaf properties
      if (persistent) this._persistentVal = val; // set persistent value if change is persistent.
      this._previousVal = utils.deepClone(this._val);
      this._val = val;
      this._persistent = persistent;

      // trigger change event
      this.trigger(new ChangeEvent(this), this._name);

      return true;
    }
    return false;
  },

  isSetAllowed: function(val, force) {
    return force || (this._val !== val && JSON.stringify(this._val) !== JSON.stringify(val));
  },

  // duplicate from Model. Should be in a shared parent class.
  setTreeFreezer: function(freezerStatus) {
    if (freezerStatus) {
      this.freeze(['hook_change']);
    } else {
      this.unfreeze();
    }
  }

})

var Model = EventSource.extend({

  getClassDefaults: () => ({}),

  /**
   * A leaf model which has an object as value.
   * Needed when parsing plain JS objects. Enables distinction between models and leafs with object values.
   **/
  objectLeafs: [],

  /**
   * Initializes the model.
   * @param {Object} values The initial values of this model
   * @param {Object} parent reference to parent
   * @param {Object} bind Initial events to bind
   * @param {Boolean} freeze block events from being dispatched
   */
  init: function(name, values, parent, bind) {
    this._type = this._type || 'model';
    this._id = this._id || utils.uniqueId('m');
    this._data = {};
    //holds attributes of this model
    this._parent = parent;
    this._root = parent? parent._root : this;
    this._name = name;
    this._ready = false;
    this._readyOnce = false;
    //has this model ever been ready?
    this._loadedOnce = false;
    //array of processes that are loading
    this._intervals = getIntervals(this);

    //will the model be hooked to data?
    this._space = {};

    this._dataId = false;
    this._limits = {};
    //stores limit values
    this._super();

    // initial values
    // add defaults to initialValues
    var initialValues = utils.deepExtend({}, this.getClassDefaults(), values)
    this.set(initialValues);

    // bind initial events
    // bind after setting, so no events are fired by setting initial values
    if(bind) {
      this.on(bind);
    }
  },

  /* ==========================
   * Getters and Setters
   * ==========================
   */

  /**
   * Gets an attribute from this model or all fields.
   * @param attr Optional attribute
   * @returns attr value or all values if attr is undefined
   */
  get: function(attr) {
    if(!attr) {
      return this._data;
    }
    if (Model.isModel(this._data[attr]))
      return this._data[attr];
    else
      return this._data[attr].value; // return leaf value
  },

  /**
   * Sets an attribute or multiple for this model (inspired by Backbone)
   * @param attr property name
   * @param val property value (object or value)
   * @param {Boolean} force force setting of property to value and triggers set event
   * @param {Boolean} persistent true if the change is a persistent change
   * @returns defer defer that will be resolved when set is done
   */
  set: function(attr, val, force, persistent) {
    var setting = this._setting;
    var attrs;
    var freezeCall = false; // boolean, indicates if this .set()-call froze the modelTree

    //expect object as default
    if(!utils.isPlainObject(attr)) {
      (attrs = {})[attr] = val;
    } else {
      // move all arguments one place
      attrs = attr;
      persistent = force;
      force = val;
    }
    
    //do nothing if setting an empty object
    if (Object.keys(attrs).length === 0) return;

    //we are currently setting the model
    this._setting = true;

    // Freeze the whole model tree if not frozen yet, so no events are fired while setting
    if (!this._freeze) {
      freezeCall = true;
      this.setTreeFreezer(true);
    }

    // init/set all given values
    var changes = [];
    for(var attribute in attrs) {
      val = attrs[attribute];

      var bothModel = utils.isPlainObject(val) && this._data[attribute] instanceof Model;
      var bothModelLeaf = (!utils.isPlainObject(val) || this.isObjectLeaf(attribute)) && this._data[attribute] instanceof ModelLeaf;

      if (this._data[attribute] && (bothModel || bothModelLeaf)) {
        // data type does not change (model or leaf and can be set through set-function)
        var setSuccess = this._data[attribute].set(val, force, persistent);
        if (bothModelLeaf && setSuccess) {
          changes.push(attribute);
        }
      } else {
        // data type has changed or is new, so initializing the model/leaf
        this._data[attribute] = initSubmodel(attribute, val, this, persistent);
        bindSetterGetter(this, attribute);
      }
    }

    if (!setting) {
      this.checkDataChanges(changes);
      if(this.validate) {
        this.validate();
      }
    }

    if(!setting || force) {
      this._setting = false;
      if (freezeCall && (!this.isHook() || !this.isLoading())) {
        this.setTreeFreezer(false);
      }
      if (!this.isHook() && !this.isLoading()) {
        this.setReady();
      }
    }

    // if this set()-call was the one freezing the tree, now the tree can be unfrozen (i.e. all setting is done)

  },

  // standard model doesn't do anything with data
  // overloaded by hook/entities
  checkDataChanges: function() { },

  setTreeFreezer: function(freezerStatus) {
    // first traverse down
    // this ensures deepest events are triggered first
    utils.forEach(this._data, function(submodel) {
      submodel.setTreeFreezer(freezerStatus);
    });

    // then freeze/unfreeze
    if (freezerStatus) {
      this.freeze(['hook_change']);
    } else {
      this.unfreeze();
    }
  },

  /**
   * Gets the type of this model
   * @returns {String} type of the model
   */
  getType: function() {
    return this._type;
  },

  /**
   * Gets all submodels of the current model
   * @param {Object} object [object=false] Should it return an object?
   * @param {Function} validationFunction Validation function
   * @returns {Array} submodels
   */
  getSubmodels: function(object = false, validationFunction) {
    var submodels = (object) ? {} : [];
    var validationFunction = validationFunction || function() {
      return true;
    };
    var _this = this;
    utils.forEach(this._data, function(subModel, name) {
      if(subModel && typeof subModel._id !== 'undefined' && Model.isModel(subModel) && validationFunction(subModel)) {
        if(object) {
          submodels[name] = subModel;
        } else {
          submodels.push(subModel);
        }
      }
    });
    return submodels;
  },

  /**
   * Gets the current model and submodel values as a JS object
   * @returns {Object} All model as JS object, leafs will return their values
   */
  getPlainObject: function(persistent) {
    var obj = {};
    var _this = this;
    utils.forEach(this._data, function(dataItem, i) {
      // if it's a submodel
      if(dataItem instanceof Model) {
        obj[i] = dataItem.getPlainObject(persistent);
      }
      // if it's a modelLeaf
      else {
        //if asked for persistent then add value to result only if modelLeaf state is
        //persistent
        if(!persistent || dataItem.persistent) {
          var leafValue = dataItem.get(persistent);
          if (utils.isDate(leafValue))
            leafValue = _this.formatDate(leafValue);
          obj[i] = leafValue;
        }
      }
    });
    return obj;
  },

  formatDate: function(dateObject) {
    return dateObject.toString();
  },

  /**
   * Gets the requested object, including the leaf-object, not the value
   * @returns {Object} Model or ModelLeaf object.
   */
  getModelObject: function(name) {
    if (name)
      return this._data[name];
    else
      return this;
  },

  /**
   * Clears this model, submodels, data and events
   */
  clear: function() {
    var submodels = this.getSubmodels();
    for(var i in submodels) {
      submodels[i].clear();
    }
    this.setReady(false);
    this.off();
    this._intervals.clearAllIntervals();
    this._data = {};
  },

  /**
   * Validates data.
   * Interface for the validation function implemented by a model
   * @returns Promise or nothing
   */
  validate: function() {},

  /* ==========================
   * Model loading
   * ==========================
   */

   // normal model is never loading
  _isLoading: function() {
    return false;
  },

  /**
   * checks whether this model is loading anything
   * @param {String} optional process id (to check only one)
   * @returns {Boolean} is it loading?
   */
  isLoading: function() {
    if(this._isLoading())
      return true;

    //if not loading anything, check submodels
    var submodels = this.getSubmodels();
    var i;
    for(i = 0; i < submodels.length; i += 1) {
      if(submodels[i].isLoading()) {
        return true;
      }
    }

    return false;
  },

  /**
   * Sets the model as ready or not depending on its loading status
   */
  setReady: function(value) {
    if(value === false) {
      this._ready = false;
      if(this._parent && this._parent.setReady) {
        this._parent.setReady(false);
      }
      return;
    }
    //only ready if nothing is loading at all
    var prev_ready = this._ready;
    this._ready = !this.isLoading() && !this._setting;
    // if now ready and wasn't ready yet
    if(this._ready && prev_ready !== this._ready) {
      if(!this._readyOnce) {
        this._readyOnce = true;
        this.trigger('readyOnce');
      }
      this.trigger('ready');
    }
  },

  setInterModelListeners: function() {
    utils.forEach(this.getSubmodels(),
      subModel => subModel.setInterModelListeners()
    );
  },

  startPreload: function() {

    var promises = [];
    promises.push(this.preloadData());

    utils.forEach(this.getSubmodels(),
      subModel => promises.push(subModel.startPreload())
    );

    return Promise.all(promises);
  },

  preloadData: function() {
    return Promise.resolve();
  },

  /**
   * loads data (if hook)
   * Hooks loads data, models ask children to load data
   * Basically, this method:
   * loads is theres something to be loaded:
   * does not load if there's nothing to be loaded
   * @param {Object} options (includes splashScreen)
   * @returns defer
   */
  startLoading: function(opts) {

    var promises = [];
    promises.push(this.loadData(opts));

    utils.forEach(this.getSubmodels(), 
      subModel => promises.push(subModel.startLoading(opts))
    );

    return Promise.all(promises).then(
      this.onSuccessfullLoad.bind(this),
      this.triggerLoadError.bind(this)
    );
  },

  loadData: function(opts) {
    if (this.isHook()) utils.warn('Hook ' + this._name + ' is not loading because it\'s not extending Hook prototype.')
    return Promise.resolve();
  },

  loadSubmodels: function(options) {
    var promises = [];
    var subModels = this.getSubmodels();
    utils.forEach(subModels, function(subModel) {
      promises.push(subModel.startLoading(options));
    });
    return promises.length > 0 ? Promise.all(promises) : Promise.resolve();
  },

  onSuccessfullLoad: function() {

    this.validate();
    utils.timeStamp('Vizabi Model: Model loaded: ' + this._name + '(' + this._id + ')');
    //end this load call
    this._loadedOnce = true;

    this._loadCall = false;
    this.setTreeFreezer(false);

    //we need to defer to make sure all other submodels
    //have a chance to call loading for the second time
    utils.defer(
      () => this.setReady()
    );
  },

  triggerLoadError: function(err) {
    utils.error(err);
    this.trigger('load_error');
  },

  /**
   * executes after preloading processing is done
   */
  afterPreload: function() {
    var submodels = this.getSubmodels();
    utils.forEach(submodels, function(s) {
      s.afterPreload();
    });
  },

  /* ===============================
   * Hooking model to external data
   * ===============================
   */

  /**
   * is this model hooked to data?
   */
  isHook: function() {
    return this.use ? true : false;
  },

  /**
   * Gets all submodels of the current model that are hooks
   * @param object [object=false] Should it return an object?
   * @returns {Array|Object} hooks array or object
   */
  getSubhooks: function(object) {
    return this.getSubmodels(object, function(s) {
      return s.isHook();
    });
  },

  /**
   * gets all sub values for a certain hook
   * only hooks have the "hook" attribute.
   * @param {String} type specific type to lookup
   * @returns {Array} all unique values with specific hook use
   */
  getHookWhich: function(type) {
    var values = [];
    if(this.use && this.use === type) {
      values.push(this.which);
    }
    //repeat for each submodel
    utils.forEach(this.getSubmodels(), function(s) {
      values = utils.unique(values.concat(s.getHookWhich(type)));
    });
    //now we have an array with all values in a type of hook for hooks.
    return values;
  },

  /**
   * gets all sub values for indicators in this model
   * @returns {Array} all unique values of indicator hooks
   */
  getIndicators: function() {
    return this.getHookWhich('indicator');
  },

  /**
   * gets all sub values for indicators in this model
   * @returns {Array} all unique values of property hooks
   */
  getProperties: function() {
    return this.getHookWhich('property');
  },

  /**
   * Gets the dimension of this model if it has one
   * @returns {String|Boolean} dimension
   */
  getDimension: function() {
    return this.dim || false; //defaults to dim if it exists
  },

  /**
   * Gets the dimension (if entity) or which (if hook) of this model
   * @returns {String|Boolean} dimension
   */
  getDimensionOrWhich: function() {
    return this.dim || (this.use != 'constant' ? this.which : false); //defaults to dim or which if it exists
  },

  /**
   * Gets the filter for this model if it has one
   * @returns {Object} filters
   */
  getFilter: function() {
    return {}; //defaults to no filter
  },


  /**
   * maps the value to this hook's specifications
   * @param value Original value
   * @returns hooked value
   */
  mapValue: function(value) {
    return value;
  },

  /**
   * Gets formatter for this model
   * @returns {Function|Boolean} formatter function
   */
  getParser: function() {
    //TODO: default formatter is moved to utils. need to return it to hook prototype class, but retest #1212 #1230 #1253
    return null;
  },

  /**
   * @return {Object} defaults of this model, and when available overwritten by submodel defaults
   */
  getDefaults: function() {
    return utils.deepExtend({}, this.getClassDefaults(), this.getSubmodelDefaults());
  },

  /**
   * @return {Object} All defaults coming from submodels
   */
  getSubmodelDefaults: function() {
    var d = {};
    utils.forEach(this.getSubmodels(true), function(model, name) {
      d[name] = model.getDefaults();
    });
    return d;
  },

  /**
   * @param  {name} name of the child to check
   * @return {Boolean} if the child is a leaf with a plain object as value
   */
  isObjectLeaf: function(name) {
    return (this.objectLeafs.indexOf(name) !== -1)
  },

  /**
   * gets closest prefix model moving up the model tree
   * @param {String} prefix
   * @returns {Object} submodel
   */
  getClosestModel: function(name) {
    var model = this.findSubmodel(name);
    if(model) {
      return model;
    } else if(this._parent) {
      return this._parent.getClosestModel(name);
    }
    return null;
  },

  /**
   * find submodel with name that starts with prefix
   * @param {String} prefix
   * @returns {Object} submodel or false if nothing is found
   */
  findSubmodel: function(name) {
    for(var i in this._data) {
      //found submodel
      if(i === name && Model.isModel(this._data[i])) {
        return this._data[i];
      }
    }
    return null;
  }

});

/* ===============================
 * Private Helper Functions
 * ===============================
 */

/**
 * Checks whether an object is a model or not
 * if includeLeaf is true, a leaf is also seen as a model
 */
Model.isModel = function(model, includeLeaf) {
  return model && (model.hasOwnProperty('_data') || (includeLeaf &&  model.hasOwnProperty('_val')));
}


function bindSetterGetter(model, prop) {
    Object.defineProperty(model, prop, {
    configurable: true,
    //allow reconfiguration
    get: function(p) {
      return function() {
        return model.get(p);
      };
    }(prop),
    set: function(p) {
      return function(value) {
        return model.set(p, value);
      };
    }(prop)
  });
}

/**
 * Loads a submodel, when necessaary
 * @param {String} attr Name of submodel
 * @param {Object} val Initial values
 * @param {Object} ctx context / parent model
 * @param {Boolean} persistent true if the change is a persistent change
 * @returns {Object} model new submodel
 */
function initSubmodel(attr, val, ctx, persistent) {

  var submodel;

  // if value is a value -> leaf
  if(!utils.isPlainObject(val) || utils.isArray(val) || ctx.isObjectLeaf(attr)) {

    var binds = {
      //the submodel has changed (multiple times)
      'change': onChange
    }
    submodel = new ModelLeaf(attr, val, ctx, binds, persistent);
  }

  // if value is an object -> model
  else {

    var binds = {
      //the submodel has changed (multiple times)
      'change': onChange,
      //loading has started in this submodel (multiple times)
      'hook_change': onHookChange,
      // error triggered in loading
      'load_error': evt => ctx.trigger(evt),
        //loading has ended in this submodel (multiple times)
      'ready': onReady
    };

    // if the value is an already instantiated submodel (Model or ModelLeaf)
    // this is the case for example when a new componentmodel is made (in Component._modelMapping)
    // it takes the submodels from the toolmodel and creates a new model for the component which refers
    // to the instantiated submodels (by passing them as model values, and thus they reach here)
    if (Model.isModel(val, true)) {
      submodel = val;
      submodel.on(binds);
    }
    // if it's just a plain object, create a new model
    else {
      // construct model
      var modelType = attr.split('_')[0];

      let Modl = Model.get(modelType, true);
      if (!Modl) {
        try {
          Modl = require('../models/' + modelType).default;
        } catch (err) {
          Modl = Model;
        }
      }

      submodel = new Modl(attr, val, ctx, binds);
      // model is still frozen but will be unfrozen at end of original .set()
    }
  }

  return submodel;

  // Default event handlers for models
  function onChange(evt, path) {
    if(!ctx._ready) return; //block change propagation if model isnt ready
    path = ctx._name + '.' + path
    ctx.trigger(evt, path);
  }
  function onHookChange(evt, vals) {
    ctx.trigger(evt, vals);
  }
  function onReady(evt, vals) {
    //trigger only for submodel
    ctx.setReady(false);
    //wait to make sure it's not set false again in the next execution loop
    utils.defer(function() {
      ctx.setReady();
    });
    //ctx.trigger(evt, vals);
  }
}

/**
 * gets closest interval from this model or parent
 * @returns {Object} Intervals object
 */
function getIntervals(ctx) {
  if(ctx._intervals) {
    return ctx._intervals;
  } else if(ctx._parent) {
    return getIntervals(ctx._parent);
  } else {
    return new Intervals();
  }
}



export default Model;
