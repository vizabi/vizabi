import * as utils from 'utils';
import Promise from 'promise';
import Data from 'data';
import EventSource, {DefaultEvent, ChangeEvent} from 'events';
import Intervals from 'intervals';
import globals from 'globals';
import * as models from 'models/_index';

var time_formats = {
  "year": "%Y",
  "month": "%b",
  "week": "week %U",
  "day": "%d/%m/%Y",
  "hour": "%d/%m/%Y %H",
  "minute": "%d/%m/%Y %H:%M",
  "second": "%d/%m/%Y %H:%M:%S"
};

var _DATAMANAGER = new Data();

var ModelLeaf = EventSource.extend({

  _name: '',
  _parent: null,
  _val: null,

  init: function(name, value, parent, binds) {

    // getter and setter for the value
    Object.defineProperty(this, 'value', {
      get: this.get,
      set: this.set
    });

    this._super();

    // after super so there is a .events object
    this._name = name;
    this._parent = parent;
    this.value = value;
    this.on(binds);
  },

  get: function() {
    return this._val;
  },

  set: function(val, force, persistent) {
    if (force || (this._val !== val && JSON.stringify(this._val) !== JSON.stringify(val))) {
      this._val = val;
      this.trigger(new ChangeEvent(this, persistent), this._name);
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

    // if this set()-call was the one freezing the tree, now the tree can be unfrozen (i.e. all setting is done)
    if (freezeCall) {
      this.setTreeFreezer(false);
    }

    if(!setting || force) {
      this._setting = false;
      if(!this.isHook()) {
        this.setReady();
      }
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
   * Gets the metadata of the hooks
   * @returns {Object} metadata
   */
  getMetadata: function() {
    if(!this.isHook()) return {};
    return(globals.metadata && globals.metadata.indicators && (this.use === 'indicator' || this.use ===
        'property')) ?
      globals.metadata.indicators[this.which] : {};
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
  getPlainObject: function() {
    var obj = {};
    utils.forEach(this._data, function(dataItem, i) {
      //if it's a submodel
      if(dataItem instanceof Model) {
        obj[i] = dataItem.getPlainObject();
      } else {
        obj[i] = dataItem.value;
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
      reader.formatters = this._getAllFormatters();

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
    interpIndexes = {};
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

    var dimensions, filters, select, grouping, q;

    //if it's not a hook, no query is necessary
    if(!this.isHook()) return true;
    //error if there's nothing to hook to
    if(Object.keys(this._space).length < 1) {
      utils.error('Error:', this._id, 'can\'t find the space');
      return true;
    }

    var prop = globals.metadata.indicatorsDB[this.which] && globals.metadata.indicatorsDB[this.which].use === "property";
    var exceptions = (prop) ? { exceptType: 'time' } : {};

    dimensions = this._getAllDimensions(exceptions);

    filters = this._getAllFilters(exceptions, splashScreen);
    grouping = this._getGrouping();

    if(this.use !== 'constant') dimensions = dimensions.concat([this.which]);
    select = utils.unique(dimensions);

    //return query
    return {
      'select': select,
      'where': filters,
      'grouping': grouping,
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
   * gets multiple values from the hook
   * @param {Object} filter Reference to the row. e.g: {geo: "swe", time: "1999", ... }
   * @param {Array} group_by How to nest e.g: ["geo"]
   * @param {Boolean} [previous = false] previous Append previous data points
   * @returns an array of values
   */
  getValues: function(filter, group_by, previous) {
    var _this = this;

    if(this.isHook()) {
      return [];
    }

    var dimTime, time, filtered, next, method, u, w, value, method;
    this._dataCube = this._dataCube || this.getSubhooks(true);
    filter = utils.clone(filter, this._getAllDimensions());
    dimTime = this._getFirstDimension({
      type: 'time'
    });
    time = new Date(filter[dimTime]); //clone date
    filter = utils.clone(filter, null, dimTime);

    var response = {};
    var f_keys = Object.keys(filter);
    var f_values = f_keys.map(function(k) {
      return filter[k];
    });

    //if there's a filter, interpolate only that
    if(f_keys.length) {
      utils.forEach(this._dataCube, function(hook, name) {
        u = hook.use;
        w = hook.which;

        if(!globals.metadata.indicatorsDB[w] || globals.metadata.indicatorsDB[w].use !== "property") {
          next = next || d3.bisectLeft(hook.getUnique(dimTime), time);
        }

        method = globals.metadata.indicatorsDB[w].interpolation;
        filtered = _DATAMANAGER.get(hook._dataId, 'nested', f_keys);
        utils.forEach(f_values, function(v) {
          filtered = filtered[v]; //get precise array (leaf)
        });
        value = utils.interpolatePoint(filtered, u, w, next, dimTime, time, method);
        response[name] = hook.mapValue(value);

        //concat previous data points
        if(previous) {
          var values = utils.filter(filtered, filter).filter(function(d) {
            return d[dimTime] <= time;
          }).map(function(d) {
            return hook.mapValue(d[w]);
          }).concat(response[name]);
          response[name] = values;
        }
      });
    }
    //else, interpolate all with time
    else {
      utils.forEach(this._dataCube, function(hook, name) {
          
        filtered = _DATAMANAGER.get(hook._dataId, 'nested', group_by);
            
        response[name] = {};
        //find position from first hook
        u = hook.use;
        w = hook.which;
          
        if(!globals.metadata.indicatorsDB[w] || globals.metadata.indicatorsDB[w].use !== "property") {
          next = (typeof next === 'undefined') ? d3.bisectLeft(hook.getUnique(dimTime), time) : next;
        }

        method = globals.metadata.indicatorsDB[w]?globals.metadata.indicatorsDB[w].interpolation:null;


        utils.forEach(filtered, function(arr, id) {
          //TODO: this saves when geos have different data length. line can be optimised. 
          next = d3.bisectLeft(arr.map(function(m){return m.time}), time);
            
          value = utils.interpolatePoint(arr, u, w, next, dimTime, time, method);
          response[name][id] = hook.mapValue(value);

          //concat previous data points
          if(previous) {
            var values = utils.filter(arr, filter).filter(function(d) {
              return d[dimTime] <= time;
            }).map(function(d) {
              return hook.mapValue(d[w]);
            }).concat(response[name][id]);
            response[name][id] = values;
          }

        });
      });
    }

    return response;
  },
    
getFrame: function(time){
    var _this = this;
    var steps = this._parent.time.getAllSteps();
    
    var cachePath = "";
    utils.forEach(this._dataCube, function(hook, name) {
        cachePath = cachePath + "," + name + ":" + hook.which + " " + _this._parent.time.start +" " + _this._parent.time.end;
        });     
    if(!this.cachedFrames || !this.cachedFrames[cachePath]) this.getFrames();
    
    if(this.cachedFrames[cachePath][time]) return this.cachedFrames[cachePath][time];
    
    var next = d3.bisectLeft(steps, time);

    if(next === 0) {
      return this.cachedFrames[cachePath][steps[0]];
    }
    if(next > steps.length) {
      return this.cachedFrames[cachePath][steps[steps.length - 1]];
    }

    var fraction = (time - steps[next - 1]) / (steps[next] - steps[next - 1]);

    var pValues = this.cachedFrames[cachePath][steps[next - 1]];
    var nValues = this.cachedFrames[cachePath][steps[next]];

    var curr = {};
    utils.forEach(pValues, function(values, hook) {
      curr[hook] = {};
      utils.forEach(values, function(val, id) {
        var val2 = nValues[hook][id];
        curr[hook][id] = (!utils.isNumber(val)) ? val : val + ((val2 - val) * fraction);
      });
    });

    return curr;
},
    
    getFrames: function(){
        var _this = this;
        
        var cachePath = "";
        utils.forEach(this._dataCube, function(hook, name) {
            cachePath = cachePath + "," + name + ":" + hook.which + " " + _this._parent.time.start +" " + _this._parent.time.end;
        });        
        
        if(!this.cachedFrames) this.cachedFrames = {};
        if(this.cachedFrames[cachePath]) return this.cachedFrames[cachePath];
        
        var steps = this._parent.time.getAllSteps();
        
        this._dataCube = this._dataCube || this.getSubhooks(true)
        
        var result = {};
        var resultKeys = [];
        
        // Assemble the list of keys as an intersection of keys in all queries of all hooks
        utils.forEach(this._dataCube, function(hook, name) {
            
            // If hook use is constant, then we can provide no additional info about keys
            // We can just hope that we have something else than constants =) 
            if(hook.use==="constant")return;
            
            // Get keys in data of this hook
            var nested = _DATAMANAGER.get(hook._dataId, 'nested', ["geo", "time"]);
            var keys = Object.keys(nested);
            
            if(resultKeys.length==0){
                // If ain't got nothing yet, set the list of keys to result
                resultKeys = keys;
            }else{
                // If there is result accumulated aleready, remove the keys from it that are not in this hook
                resultKeys = resultKeys.filter(function(f){ return keys.indexOf(f)>-1;})
            }
        });
        
        steps.forEach(function(t){ 
            result[t] = {};
        });
        
        utils.forEach(this._dataCube, function(hook, name) {
            
            if(hook.use === "constant") {
                steps.forEach(function(t){ 
                    result[t][name] = {};
                    resultKeys.forEach(function(key){
                        result[t][name][key] = hook.which;
                    });
                });
                
            }else if(hook.which==="geo"){
                steps.forEach(function(t){ 
                    result[t][name] = {};
                    resultKeys.forEach(function(key){
                        result[t][name][key] = key;
                    });
                });
                
            }else if(hook.which==="time"){
                steps.forEach(function(t){ 
                    result[t][name] = {};
                    resultKeys.forEach(function(key){
                        result[t][name][key] = new Date(t);
                    });
                });
                
            }else{
                var frames = _DATAMANAGER.get(hook._dataId, 'frames', steps, globals.metadata.indicatorsDB);
                utils.forEach(frames, function(frame, t){ 
                    result[t][name] = frame[hook.which];
                });    
            }
        });
    
        this.cachedFrames[cachePath] = result;
        return result;
    },
    


  /**
   * gets the value of the hook point
   * @param {Object} filter Id the row. e.g: {geo: "swe", time: "1999"}
   * @returns hooked value
   */
  getValue: function(filter) {
    //extract id from original filter
    filter = utils.clone(filter, this._getAllDimensions());
    if(!this.isHook()) {
      utils.warn('getValue method needs the model to be hooked to data.');
      return;
    }
    var value;
    if(this.use === 'constant') {
      value = this.which;
    } else if(this._space.hasOwnProperty(this.use)) {
      value = this._space[this.use][this.which];
    } else {
      //TODO: get meta info about translatable data
      var method = globals.metadata.indicatorsDB[this.which].interpolation;
      value = interpolateValue.call(this, filter, this.use, this.which, method);
    }
    return this.mapValue(value);
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
   * gets the items associated with this hook without values
   * @param filter filter
   * @returns hooked value
   */
  getKeys: function(filter) {
    if(this.isHook() && this._dataModel) {
      //all dimensions except time (continuous)
      var dimensions = this._getAllDimensions({
        exceptType: 'time'
      });
      var excluded = this._getAllDimensions({
        onlyType: 'time'
      });

      return this.getUnique(dimensions).map(function(item) {
        utils.forEach(excluded, function(e) {
          if(filter && filter[e]) {
            item[e] = filter[e];
          }
        });
        return item;
      });
    } else {
      var sub = this.getSubhooks();
      var found = [];
      if(sub.length > 1) {
        utils.forEach(sub, function(s) {
          found = s.getKeys();
          return false;
        });
      }
      return found;
    }
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
  getFormatter: function() {
    // default formatter turns empty strings in null and converts numeric values into number
    return function (f) {
      if(f === ""){
        return null;
      } else {
        var new_val = parseFloat(f);
        if (!isNaN(new_val) && isFinite(f)) {
          return new_val;
        }
      }  
      return f;
    }
  },

  /**
   * Gets tick values for this hook
   * @returns {Number|String} value The value for this tick
   */
  tickFormatter: function(x, formatterRemovePrefix) {

    //TODO: generalize for any time unit
    if(utils.isDate(x)) return d3.time.format(time_formats["year"])(x);
    if(utils.isString(x)) return x;

    var format = "f";
    var prec = 0;
    if(Math.abs(x) < 1) {
      prec = 1;
      format = "r"
    };

    var prefix = "";
    if(formatterRemovePrefix) return d3.format("." + prec + format)(x);

//    switch(Math.floor(Math.log10(Math.abs(x)))) {
    switch(Math.floor(Math.log(Math.abs(x))/Math.LN10)) {
      case -13:
        x = x * 1000000000000;
        prefix = "p";
        break; //0.1p
      case -10:
        x = x * 1000000000;
        prefix = "n";
        break; //0.1n
      case -7:
        x = x * 1000000;
        prefix = "µ";
        break; //0.1µ
      case -6:
        x = x * 1000000;
        prefix = "µ";
        break; //1µ
      case -5:
        x = x * 1000000;
        prefix = "µ";
        break; //10µ
      case -4:
        break; //0.0001
      case -3:
        break; //0.001
      case -2:
        break; //0.01
      case -1:
        break; //0.1
      case 0:
        break; //1
      case 1:
        break; //10
      case 2:
        break; //100
      case 3:
        break; //1000
      case 4:
        break; //10000
      case 5:
        x = x / 1000;
        prefix = "k";
        break; //0.1M
      case 6:
        x = x / 1000000;
        prefix = "M";
        prec = 1;
        break; //1M
      case 7:
        x = x / 1000000;
        prefix = "M";
        break; //10M
      case 8:
        x = x / 1000000;
        prefix = "M";
        break; //100M
      case 9:
        x = x / 1000000000;
        prefix = "B";
        prec = 1;
        break; //1B
      case 10:
        x = x / 1000000000;
        prefix = "B";
        break; //10B
      case 11:
        x = x / 1000000000;
        prefix = "B";
        break; //100B
      case 12:
        x = x / 1000000000000;
        prefix = "T";
        prec = 1;
        break; //1T
        //use the D3 SI formatting for the extreme cases
      default:
        return(d3.format("." + prec + "s")(x)).replace("G", "B");
    }

    // use manual formatting for the cases above
    return(d3.format("." + prec + format)(x) + prefix).replace("G", "B");

  },

  /**
   * Gets the d3 scale for this hook. if no scale then builds it
   * @returns {Array} domain
   */
  getScale: function(margins) {
    if(!this.scale) {
      this.buildScale(margins);
    }
    return this.scale;
  },

  /**
   * Gets the domain for this hook
   * @returns {Array} domain
   */
  buildScale: function() {
    if(!this.isHook()) {
      return;
    }
    var domain;
    var scaleType = this.scaleType || 'linear';
    switch(this.use) {
      case 'indicator':
        var limits = this.getLimits(this.which);
        domain = [
          limits.min,
          limits.max
        ];
        break;
      case 'property':
        domain = this.getUnique(this.which);
        break;
      default:
        domain = [this.which];
        break;
    }
    //TODO: d3 is global?
    this.scale = scaleType === 'time' ? d3.time.scale().domain(domain) : d3.scale[scaleType]().domain(domain);
  },

  /**
   * Gets limits
   * @param {String} attr parameter
   * @returns {Object} limits (min and max)
   */
  getLimits: function(attr) {
    if(!this.isHook()) {
      //if there's subhooks, find the one which is an indicator
      var limits = {};
      utils.forEach(this.getSubhooks(), function(s) {
        var prop = globals.metadata.indicatorsDB[s.which].use === "property";
        if(!prop) {
          limits = s.getLimits(attr);
          return false;
        }
      });
      return limits;
    }

    return _DATAMANAGER.get(this._dataId, 'limits', attr);
  },

  /**
   * Gets unique values in a column
   * @param {String|Array} attr parameter
   * @returns {Array} unique values
   */
  getUnique: function(attr) {
    if(!this.isHook()) {
      return;
    }
    if(!attr) {
      attr = this._getFirstDimension({
        type: "time"
      });
    }
    return _DATAMANAGER.get(this._dataId, 'unique', attr);
  },

  //TODO: this should go down to datamanager, hook should only provide interface
  /**
   * gets maximum, minimum and mean values from the dataset of this certain hook
   */
  gerLimitsPerFrame: function() {
      
    if(this.use === "property") return utils.warn("getMaxMinMean: strange that you ask min max mean of a property"); 
    if(!this.isHook) return utils.warn("getMaxMinMean: only works for hooks");
      
    var result = {};
    var values = [];
    var value = null;
      
    var steps = this._parent._parent.time.getAllSteps();
      
    if(this.use === "constant") {
        steps.forEach(function(t){ 
            value = this.which;
            result[t] = {
                min: value,
                max: value
            }
        });

    }else if(this.which==="time"){
        steps.forEach(function(t){ 
            value = new Date(t);
            result[t] = {
                min: value,
                max: value
            }
        });

    }else{
        var args = {framesArray: steps, which: this.which};
        result = _DATAMANAGER.get(this._dataId, 'limitsPerFrame', args, globals.metadata.indicatorsDB);   
    }
      
    return result;
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
  _getAllFormatters: function() {
    var formatters = {};

    function addFormatter(model) {
      // get formatters from model
      var formatter = model.getFormatter();
      var column = model.getDimensionOrWhich();
      if (formatter && column) {
        formatters[column] = formatter;
      }
    }

    // loop through all models which can have filters
    utils.forEach(this._space, function(entity, entityName) {
      addFormatter(entity);
    });
    addFormatter(this);

    return formatters;
  },

  getDefaults: function() {
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

//caches interpolation indexes globally.
//TODO: what if there are 2 visualizations with 2 data sources?
var interpIndexes = {};



/**
 * interpolates the specific value if missing
 * @param {Object} _filter Id the row. e.g: {geo: "swe", time: "1999"}
 * filter SHOULD contain time property
 * @returns interpolated value
 */
function interpolateValue(_filter, use, which, method) {

  var dimTime, time, filter, items, space_id, indexNext, result;

  dimTime = this._getFirstDimension({
    type: 'time'
  });
  time = new Date(_filter[dimTime]); //clone date
  filter = utils.clone(_filter, null, dimTime);


  items = this.getFilteredItems(filter);
  if(items === null || items.length === 0) {
    utils.warn('interpolateValue returns ' + which + ' = NULL because items array is empty in ' + JSON.stringify(filter));
    return null;
  }

  // return constant for the use of "constant"
  if(use === 'constant') {
    return items[0][which];
  }

  // search where the desired value should fall between the known points
  space_id = this._spaceId || (this._spaceId = Object.keys(this._space).join('-'));
  interpIndexes[space_id] = interpIndexes[space_id] || {};

  if(time in interpIndexes[space_id]) {
    indexNext = interpIndexes[space_id][time].next;
  } else {
    indexNext = d3.bisectLeft(this.getUnique(dimTime), time);
    //store indexNext
    interpIndexes[space_id][time] = {
      next: indexNext
    };
  }

  // zero-order interpolation for the use of properties
  if(use === 'property') {
    return items[0][which];
  }
  // the rest is for the continuous measurements
  // check if the desired value is out of range. 0-order extrapolation
  if(indexNext === 0) {
    return +items[0][which];
  }
  if(indexNext === items.length) {
    return +items[items.length - 1][which];
  }

};



export default Model;
