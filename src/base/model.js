import * as utils from 'utils';
import Promise from 'promise';
import Data from 'data';
import EventSource, {DefaultEvent, ChangeEvent} from 'events';
import Intervals from 'intervals';
import * as models from 'models/_index';

var _DATAMANAGER = new Data();

var ModelLeaf = EventSource.extend({

  _name: '',
  _parent: null,
  _persistent: true,

  init: function(name, value, parent, binds) {

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
    this.value = value;
    this.on(binds); // after super so there is an .events object
  },

  // if they want a persistent value and the current value is not persistent, return the last persistent value
  get: function(persistent) {
    return (persistent && !this._persistent) ? this._persistentVal : this._val;
  },

  set: function(val, force, persistent) {
    if (force || (this._val !== val && JSON.stringify(this._val) !== JSON.stringify(val))) {

      // persistent defaults to true
      persistent = (typeof persistent !== 'undefined') ? persistent : true;

      // set leaf properties
      if (persistent) this._persistentVal = val; // set persistent value if change is persistent.
      this._val = val;
      this._persistent = persistent;

      // trigger change event
      this.trigger(new ChangeEvent(this), this._name);
    }
  },

  // duplicate from Model. Should be in a shared parent class.
  setTreeFreezer: function(freezerStatus) {
    if (freezerStatus) {
      this.freeze();
    } else {
      this.unfreeze();
    }
  }

})

var Model = EventSource.extend({
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
    this._name = name;
    this._ready = false;
    this._readyOnce = false;
    //has this model ever been ready?
    this._loadedOnce = false;
    this._loading = [];
    //array of processes that are loading
    this._intervals = getIntervals(this);
    //holds the list of dependencies for virtual models
    this._deps = {
      parent: [],
      children: []
    };
    //will the model be hooked to data?
    this._space = {};
    this._spaceDims = {};

    this._dataId = false;
    this.cachedFrames = {};
    this._limits = {};
    //stores limit values
    this._super();

    //initial values
    if(values) {
      this.set(values);
    }
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
    if (isModel(this._data[attr]))
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

    //we are currently setting the model
    this._setting = true;

    // Freeze the whole model tree if not frozen yet, so no events are fired while setting
    if (!this._freeze) {
      freezeCall = true;
      this.setTreeFreezer(true);
    }

    // init/set all given values
    var newSubmodels = false;
    for(var a in attrs) {
      val = attrs[a];

      var bothModel = utils.isPlainObject(val) && this._data[a] instanceof Model;
      var bothModelLeaf = !utils.isPlainObject(val) && this._data[a] instanceof ModelLeaf;

      if (this._data[a] && (bothModel || bothModelLeaf)) {
        // data type does not change (model or leaf and can be set through set-function)
        this._data[a].set(val, force, persistent);
      } else {
        // data type has changed or is new, so initializing the model/leaf
        this._data[a] = initSubmodel(a, val, this);
        newSubmodels = true;
      }
    }

    // only if there's new submodels, we have to set new getters/setters
    if (newSubmodels)
      bindSettersGetters(this);

    if(this.validate && !setting) {
      this.validate();
    }

    if(!setting || force) {
      this._setting = false;
      if(!this.isHook()) {
        this.setReady();
      }
    }

    // if this set()-call was the one freezing the tree, now the tree can be unfrozen (i.e. all setting is done)
    if (freezeCall) {
      this.setTreeFreezer(false);
    }

  },


  setTreeFreezer: function(freezerStatus) {
    // first traverse down
    // this ensures deepest events are triggered first
    utils.forEach(this._data, function(submodel) {
      submodel.setTreeFreezer(freezerStatus);
    });

    // then freeze/unfreeze
    if (freezerStatus) {
      this.freeze();
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
   * @param {Function} fn Validation function
   * @returns {Array} submodels
   */
  getSubmodels: function(object, fn) {
    var submodels = (object) ? {} : [];
    var fn = fn || function() {
      return true;
    };
    var _this = this;
    utils.forEach(this._data, function(s, name) {
      if(s && typeof s._id !== 'undefined' && isModel(s) && fn(s)) {
        if(object) {
          submodels[name] = s;
        } else {
          submodels.push(s);
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
    utils.forEach(this._data, function(dataItem, i) {
      // if it's a submodel
      if(dataItem instanceof Model) {
        obj[i] = dataItem.getPlainObject(persistent);
      }
      // if it's a modelLeaf
      else {
        obj[i] = dataItem.get(persistent);
      }
    });
    return obj;
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
    this._spaceDims = {};
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

  /**
   * checks whether this model is loading anything
   * @param {String} optional process id (to check only one)
   * @returns {Boolean} is it loading?
   */
  isLoading: function(p_id) {
    if(this.isHook() && (!this._loadedOnce || this._loadCall)) {
      return true;
    }
    if(p_id) {
      return this._loading.indexOf(p_id) !== -1;
    } //if loading something
    else if(this._loading.length > 0) {
      return true;
    } //if not loading anything, check submodels
    else {
      var submodels = this.getSubmodels();
      var i;
      for(i = 0; i < submodels.length; i += 1) {
        if(submodels[i].isLoading()) {
          return true;
        }
      }
      for(i = 0; i < this._deps.children.length; i += 1) {
        var d = this._deps.children[i];
        if(d.isLoading() || !d._ready) {
          return true;
        }
      }
      return false;
    }
  },

  /**
   * specifies that the model is loading data
   * @param {String} id of the loading process
   */
  setLoading: function(p_id) {
    //if this is the first time we're loading anything
    if(!this.isLoading()) {
      this.trigger('load_start');
    }
    //add id to the list of processes that are loading
    this._loading.push(p_id);
  },

  /**
   * specifies that the model is done with loading data
   * @param {String} id of the loading process
   */
  setLoadingDone: function(p_id) {
    this._loading = utils.without(this._loading, p_id);
    this.setReady();
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
    this._ready = !this.isLoading() && !this._setting && !this._loadCall;
    // if now ready and wasn't ready yet
    if(this._ready && prev_ready !== this._ready) {
      if(!this._readyOnce) {
        this._readyOnce = true;
        this.trigger('readyOnce');
      }
      this.trigger('ready');
    }
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
  load: function(opts) {

    opts = opts || {};
    var splashScreen = opts.splashScreen || false;

    var _this = this;
    var data_hook = this._dataModel;
    var language_hook = this._languageModel;
    var query = this.getQuery(splashScreen);
    var promiseLoad = new Promise();
    var promises = [];
    //useful to check if in the middle of a load call
    this._loadCall = true;

    //load hook
    //if its not a hook, the promise will not be created
    if(this.isHook() && data_hook && query) {
      //hook changes, regardless of actual data loading
      this.trigger('hook_change');
      //get reader info
      var reader = data_hook.getPlainObject();
      reader.parsers = this._getAllParsers();

      var lang = language_hook ? language_hook.id : 'en';
      var promise = new Promise();
      var evts = {
        'load_start': function() {
          _this.setLoading('_hook_data');
          EventSource.freezeAll([
            'load_start',
            'resize',
            'dom_ready'
          ]);
        }
      };

      utils.timeStamp('Vizabi Model: Loading Data: ' + _this._id);
      _DATAMANAGER.load(query, lang, reader, evts).then(function(dataId) {
        _this._dataId = dataId;
        utils.timeStamp('Vizabi Model: Data loaded: ' + _this._id);
        _this.afterLoad();
        promise.resolve();
      }, function(err) {
        utils.warn('Problem with query: ', JSON.stringify(query));
        promise.reject(err);
      });
      promises.push(promise);
    }

    //load submodels as well
    utils.forEach(this.getSubmodels(true), function(sm, name) {
      promises.push(sm.load(opts));
    });

    //when all promises/loading have been done successfully
    //we will consider this done
    var wait = promises.length ? Promise.all(promises) : new Promise.resolve();
    wait.then(function() {

      //only validate if not showing splash screen to avoid fixing the year
      if(_this.validate) {
        _this.validate();
      }
      utils.timeStamp('Vizabi Model: Model loaded: ' + _this._id);
      //end this load call
      _this._loadedOnce = true;

      //we need to defer to make sure all other submodels
      //have a chance to call loading for the second time
      _this._loadCall = false;
      promiseLoad.resolve();
      utils.defer(function() {
        _this.setReady();
      });
    }, function() {
      _this.trigger('load_error');
      promiseLoad.reject();
    });

    return promiseLoad;
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

  /**
   * executes after data has actually been loaded
   */
  afterLoad: function() {
    EventSource.unfreezeAll();
    this.setLoadingDone('_hook_data');
  },

  /**
   * removes all external dependency references
   */
  resetDeps: function() {
    this._deps.children = [];
  },

  /**
   * add external dependency ref to this model
   */
  addDep: function(child) {
    this._deps.children.push(child);
    child._deps.parent.push(this);
  },

  /**
   * gets query that this model/hook needs to get data
   * @returns {Array} query
   */
  getQuery: function(splashScreen) {

    var dimensions, filters, select, grouping, orderBy, q;

    //if it's not a hook, no query is necessary
    if(!this.isHook()) return true;
    //error if there's nothing to hook to
    if(Object.keys(this._space).length < 1) {
      utils.error('Error:', this._id, 'can\'t find the space');
      return true;
    }

    var prop = (this.use === "property");
    var exceptions = (prop) ? { exceptType: 'time' } : {};

    // select
    dimensions = this._getAllDimensions(exceptions);
    if(this.use !== 'constant') dimensions = dimensions.concat([this.which]);
    select = utils.unique(dimensions);

    // where
    filters = this._getAllFilters(exceptions, splashScreen);

    // grouping
    grouping = this._getGrouping();

    // order by
    orderBy = (!prop) ? this._space.time.dim : null;

    //return query
    return {
      'select': select,
      'where': filters,
      'grouping': grouping,
      'orderBy': orderBy // should be _space.animatable, but that's time for now
    };
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
   * Hooks all hookable submodels to data
   */
  setHooks: function() {
    if(this.isHook()) {
      //what should this hook to?
      this.hookModel();
    } else {
      //hook submodels
      var submodels = this.getSubmodels();
      utils.forEach(submodels, function(s) {
        s.setHooks();
      });
    }
  },

  /**
   * Hooks this model to data, entities and time
   * @param {Object} h Object containing the hooks
   */
  hookModel: function() {
    var _this = this;
    var spaceRefs = getSpace(this);
    // assuming all models will need data and language support
    this._dataModel = getClosestModel(this, 'data');
    this._languageModel = getClosestModel(this, 'language');
    //check what we want to hook this model to
    utils.forEach(spaceRefs, function(name) {
      //hook with the closest prefix to this model
      _this._space[name] = getClosestModel(_this, name);
      //if hooks change, this should load again
      //TODO: remove hardcoded 'show"
      if(_this._space[name].show) {
        _this._space[name].on('change:show', function(evt) {
          //hack for right size of bubbles
          if(_this._type === 'size' && _this.which === _this.which_1) {
            _this.which_1 = '';
          };
          //defer is necessary because other events might be queued.
          //load right after such events
          utils.defer(function() {
            _this.load().then(function() {

            }, function(err) {
              utils.warn(err);
            });
          });
        });
      }
    });
    //this is a hook, therefore it needs to reload when data changes
    this.on('change:which', function(evt) {
      //defer is necessary because other events might be queued.
      //load right after such events
      _this.load();
    });
    //this is a hook, therefore it needs to reload when data changes
    this.on('hook_change', function() {
      _this._spaceDims = {};
      _this.setReady(false);
    });
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
   * gets filtered dataset with fewer keys
   * @param {Object} filter
   * @returns {Object} filtered items object
   */
  getFilteredItems: function(filter) {
    if(!filter) return utils.warn("No filter provided to getFilteredItems(<filter>)");
    return _DATAMANAGER.get(this._dataId, 'filtered', filter);
  },

  /**
   * gets nested dataset
   * @param {Array} keys define how to nest the set
   * @returns {Object} hash-map of key-value pairs
   */
  getNestedItems: function(keys) {
    if(!keys) return utils.warn("No keys provided to getNestedItems(<keys>)");
    return _DATAMANAGER.get(this._dataId, 'nested', keys);
  },


  /**
   * Gets formatter for this model
   * @returns {Function|Boolean} formatter function
   */
  getParser: function() {
    //TODO: default formatter is moved to utils. need to return it to hook prototype class, but retest #1212 #1230 #1253
    return null;
  },

  getDataManager: function(){
    return _DATAMANAGER;
  },

  /**
   * Gets limits
   * @param {String} attr parameter
   * @returns {Object} limits (min and max)
   */
  getLimits: function(attr) {
    return _DATAMANAGER.get(this._dataId, 'limits', attr);
  },

  /**
   * gets all hook dimensions
   * @param {Object} opts options with exceptType or onlyType
   * @returns {Array} all unique dimensions
   */
  _getAllDimensions: function(opts) {

    var optsStr = JSON.stringify(opts);
    if(optsStr in this._spaceDims) {
      return this._spaceDims[optsStr];
    }

    opts = opts || {};
    var dims = [];
    var dim;

    var models = this._space;
    //in case it's a parent of hooks
    if(!this.isHook() && this.space) {
      models = [];
      var _this = this;
      utils.forEach(this.space, function(name) {
        models.push(getClosestModel(_this, name));
      });
    }

    utils.forEach(models, function(m) {
      if(opts.exceptType && m.getType() === opts.exceptType) {
        return true;
      }
      if(opts.onlyType && m.getType() !== opts.onlyType) {
        return true;
      }
      if(dim = m.getDimension()) {
        dims.push(dim);
      }
    });

    this._spaceDims[optsStr] = dims;

    return dims;
  },

  /**
   * gets first dimension that matches type
   * @param {Object} options
   * @returns {Array} all unique dimensions
   */
  _getFirstDimension: function(opts) {
    opts = opts || {};

    var models = this._space;
    //in case it's a parent of hooks
    if(!this.isHook() && this.space) {
      models = [];
      var _this = this;
      utils.forEach(this.space, function(name) {
        models.push(getClosestModel(_this, name));
      });
    }

    var dim = false;
    utils.forEach(models, function(m) {
      if(opts.exceptType && m.getType() !== opts.exceptType) {
        dim = m.getDimension();
        return false;
      } else if(opts.type && m.getType() === opts.type) {
        dim = m.getDimension();
        return false;
      } else if(!opts.exceptType && !opts.type) {
        dim = m.getDimension();
        return false;
      }
    });
    return dim;
  },

  /**
   * gets all hook filters
   * @param {Boolean} splashScreen get filters for first screen only
   * @returns {Object} filters
   */
  _getAllFilters: function(opts, splashScreen) {
    opts = opts || {};
    var filters = {};
    utils.forEach(this._space, function(h) {
      if(opts.exceptType && h.getType() === opts.exceptType) {
        return true;
      }
      if(opts.onlyType && h.getType() !== opts.onlyType) {
        return true;
      }
      filters = utils.extend(filters, h.getFilter(splashScreen));
    });
    return filters;
  },

  /**
   * gets grouping for each of the used entities
   * @param {Boolean} splashScreen get filters for first screen only
   * @returns {Object} filters
   */
  _getGrouping: function() {
    var groupings = {};
    utils.forEach(this._space, function(h) {
      groupings[h.dim] = h.grouping || undefined;
    });
    return groupings;
  },

  /**
   * gets all hook filters
   * @returns {Object} filters
   */
  _getAllParsers: function() {

    var parsers = {};

    function addParser(model) {
      // get parsers from model
      var parser = model.getParser();
      var column = model.getDimensionOrWhich();
      if (parser && column) {
        parsers[column] = parser;
      }
    }

    // loop through all models which can have filters
    utils.forEach(this._space, function(h) {
      addParser(h);
    });
    addParser(this);

    return parsers;
  },

  getDefaults: function() {
    // if defaults are set, does not care about defaults from children
    if(this._defaults) return this._defaults;
    var d = {};
    utils.forEach(this.getSubmodels(true), function(model, name) {
      d[name] = model.getDefaults();
    });
    return d;
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
function isModel(model, includeLeaf) {
  return model && (model.hasOwnProperty('_data') || (includeLeaf &&  model.hasOwnProperty('_val')));
}

/**
 * Binds all attributes in _data to magic setters and getters
 */
function bindSettersGetters(model) {
  for(var prop in model._data) {
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
}

/**
 * Loads a submodel, when necessaary
 * @param {String} attr Name of submodel
 * @param {Object} val Initial values
 * @param {Object} ctx context / parent model
 * @returns {Object} model new submodel
 */
function initSubmodel(attr, val, ctx) {

  var submodel;

  // if value is a value -> leaf
  if(!utils.isPlainObject(val) || utils.isArray(val)) {

    var binds = {
      //the submodel has changed (multiple times)
      'change': onChange
    }
    submodel = new ModelLeaf(attr, val, ctx, binds);
  }

  // if value is an object -> model
  else {

    var binds = {
      //the submodel has changed (multiple times)
      'change': onChange,
      //loading has started in this submodel (multiple times)
      'hook_change': onHookChange,
      //loading has started in this submodel (multiple times)
      'load_start': onLoadStart,
      //loading has failed in this submodel (multiple times)
      'load_error': onLoadError,
        //loading has ended in this submodel (multiple times)
      'ready': onReady
    };

    // if the value is an already instantiated submodel (Model or ModelLeaf)
    // this is the case for example when a new componentmodel is made (in Component._modelMapping)
    // it takes the submodels from the toolmodel and creates a new model for the component which refers
    // to the instantiated submodels (by passing them as model values, and thus they reach here)
    if (isModel(val, true)) {
      submodel = val;
      submodel.on(binds);
    }
    // if it's just a plain object, create a new model
    else {
      // construct model
      var modelType = attr.split('_')[0];
      var Modl = Model.get(modelType, true) || models[modelType] || Model;
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
  function onLoadStart(evt, vals) {
    ctx.setReady(false);
    ctx.trigger(evt, vals);
  }
  function onLoadError(evt, vals) {
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

/**
 * gets closest prefix model moving up the model tree
 * @param {String} prefix
 * @returns {Object} submodel
 */
function getClosestModel(ctx, name) {
  var model = findSubmodel(ctx, name);
  if(model) {
    return model;
  } else if(ctx._parent) {
    return getClosestModel(ctx._parent, name);
  }
}

/**
 * find submodel with name that starts with prefix
 * @param {String} prefix
 * @returns {Object} submodel or false if nothing is found
 */
function findSubmodel(ctx, name) {
  for(var i in ctx._data) {
    //found submodel
    if(i === name && isModel(ctx._data[i])) {
      return ctx._data[i];
    }
  }
}

/**
 * Learn what this model should hook to
 * @returns {Array} space array
 */
function getSpace(model) {
  if(utils.isArray(model.space)) {
    return model.space;
  } else if(model._parent) {
    return getSpace(model._parent);
  } else {
    utils.error(
      'ERROR: space not found.\n You must specify the objects this hook will use under the "space" attribute in the state.\n Example:\n space: ["entities", "time"]'
    );
  }
}



export default Model;
