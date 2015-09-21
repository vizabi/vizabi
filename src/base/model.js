/*!
 * VIZABI MODEL
 * Base Model
 */

(function () {

  'use strict';

  var root = this;
  var Vizabi = root.Vizabi;
  var Promise = Vizabi.Promise;
  var utils = Vizabi.utils;
  var globals = Vizabi._globals;

  var time_formats = {
    "year": "%Y",
    "month": "%b",
    "week": "week %U",
    "day": "%d/%m/%Y",
    "hour": "%d/%m/%Y %H",
    "minute": "%d/%m/%Y %H:%M",
    "second": "%d/%m/%Y %H:%M:%S"
  };

  //names of reserved hook properties
  //warn client if d3 is not defined
  Vizabi._require('d3');
  var _DATAMANAGER = new Vizabi.Data();

  var Model = Vizabi.Events.extend({
    /**
     * Initializes the model.
     * @param {Object} values The initial values of this model
     * @param {Object} parent reference to parent
     * @param {Object} bind Initial events to bind
     * @param {Boolean} freeze block events from being dispatched
     */
    init: function (values, parent, bind, freeze) {
      this._type = this._type || 'model';
      this._id = this._id || utils.uniqueId('m');
      this._data = {};
      //holds attributes of this model
      this._parent = parent;
      this._set = false;
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
      //bind initial events
      if (bind) {
        this.on(bind);
      }
      if (freeze) {
        //do not dispatch events
        this.freeze();
      }
      //initial values
      if (values) {
        this.set(values);
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
    get: function (attr) {
      if (!attr) {
        return this._data;
      }
      return this._data[attr];
    },

    /**
     * Sets an attribute or multiple for this model (inspired by Backbone)
     * @param attr property name
     * @param val property value (object or value)
     * @returns defer defer that will be resolved when set is done
     */
    set: function (attr, val, force) {
      var events = [];
      var changes = [];
      var setting = this._setting;
      var _this = this;
      var attrs;
      //expect object as default
      if (!utils.isPlainObject(attr)) {
        (attrs = {})[attr] = val;
      } else {
        attrs = attr;
        force = val;
      }
      //if it's the first time we are setting this, check previous
      if (!setting) {
        this._prevData = utils.clone(this._data);
        this._changedData = {};
      }
      this._setting = true;
      //we are currently setting the model
      //compute each change
      for (var a in attrs) {
        val = attrs[a];
        var curr = this._data[a];
        var prev = this._prevData[a];
        //if its a regular value
        if (!utils.isPlainObject(val) || utils.isArray(val)) {
          //change if it's not the same value
          if (curr !== val || force || JSON.stringify(curr) !== JSON.stringify(val)) {
            var p = typeof curr === 'undefined' ? 'init' : 'change';
            events.push(p + ':' + a);
          }
          if (prev !== val || force || JSON.stringify(prev) !== JSON.stringify(val)) {
            this._changedData[a] = val;
          } else {
            delete this._changedData[a];
          }
          this._data[a] = val;
        } //if it's an object, it's a submodel
        else {
          if (curr && isModel(curr)) {
            events.push('change:' + a);
            this._data[a].set(val, force);
          } //submodel doesnt exist, create it
          else {
            events.push('init:' + a);
            this._data[a] = initSubmodel(a, val, this);
            this._data[a].unfreeze();
          }
        }
      }

      bindSettersGetters(this);
      //for tool model when setting for the first time
      if (this.validate && !setting) {
        this.validate();
      }
      if (!setting || force) {
        //trigger set if not set
        if (!this._set) {
          this._set = true;
          events.push('set');
        } else if (events.length) {
          events.push('change');
        }
        _this._setting = false;
        _this.triggerAll(events, _this.getObject());
        if (!this.isHook()) {
          this.setReady();
        }
      }
    },

    /**
     * Gets the type of this model
     * @returns {String} type of the model
     */
    getType: function () {
      return this._type;
    },
      
    /**
     * Gets the metadata of the hooks
     * @returns {Object} metadata
     */
    getMetadata: function () {
      if (!this.isHook()) return {};
      return (globals.metadata && globals.metadata.indicators && (this.use === 'indicator' || this.use === 'property')) ? 
          globals.metadata.indicators[this.which] : {};
    },

    /**
     * Gets all submodels of the current model
     * @param object [object=false] Should it return an object?
     * @returns {Array} submodels
     */
    getSubmodels: function (object, fn) {
      var submodels = (object) ? {} : [];
      var fn = fn || function() { return true; };
      utils.forEach(this._data, function (s, name) {
        if (s && typeof s._id !== 'undefined' && fn(s)) {
          if(object) {
            submodels[name] = s;
          }
          else {
            submodels.push(s);
          }
        }
      });
      return submodels;
    },

    /**
     * Gets the current model and submodel values as a JS object
     * @returns {Object} All model as JS object
     */
    getObject: function () {
      var obj = {};
      for (var i in this._data) {
        //if it's a submodel
        if (this._data[i] && typeof this._data[i].getObject === 'function') {
          obj[i] = this._data[i].getObject();
        } else {
          obj[i] = this._data[i];
        }
      }
      return obj;
    },

    /**
     * Clears this model, submodels, data and events
     */
    clear: function () {
      var submodels = this.getSubmodels();
      for (var i in submodels) {
        submodels[i].clear();
      }
      this._spaceDims = {};
      this.setReady(false);
      this.unbindAll();
      this._intervals.clearAllIntervals();
      this._data = {};
    },

    /**
     * Validates data.
     * Interface for the validation function implemented by a model
     * @returns Promise or nothing
     */
    validate: function () {
    },

    /* ==========================
     * Model loading
     * ==========================
     */

    /**
     * checks whether this model is loading anything
     * @param {String} optional process id (to check only one)
     * @returns {Boolean} is it loading?
     */
    isLoading: function (p_id) {
      if (this.isHook() && (!this._loadedOnce || this._loadCall)) {
        return true;
      }
      if (p_id) {
        return this._loading.indexOf(p_id) !== -1;
      } //if loading something
      else if (this._loading.length > 0) {
        return true;
      } //if not loading anything, check submodels
      else {
        var submodels = this.getSubmodels();
        var i;
        for (i = 0; i < submodels.length; i += 1) {
          if (submodels[i].isLoading()) {
            return true;
          }
        }
        for (i = 0; i < this._deps.children.length; i += 1) {
          var d = this._deps.children[i];
          if (d.isLoading() || !d._ready) {
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
    setLoading: function (p_id) {
      //if this is the first time we're loading anything
      if (!this.isLoading()) {
        this.trigger('load_start');
      }
      //add id to the list of processes that are loading
      this._loading.push(p_id);
    },

    /**
     * specifies that the model is done with loading data
     * @param {String} id of the loading process
     */
    setLoadingDone: function (p_id) {
      this._loading = utils.without(this._loading, p_id);
      this.setReady();
    },

    /**
     * Sets the model as ready or not depending on its loading status
     */
    setReady: function (value) {
      if (value === false) {
        this._ready = false;
        if (this._parent && this._parent.setReady) {
          this._parent.setReady(false);
        }
        return;
      }
      //only ready if nothing is loading at all
      var prev_ready = this._ready;
      this._ready = !this.isLoading() && !this._setting && !this._loadCall;
      if (this._ready && prev_ready !== this._ready) {
        if (!this._readyOnce) {
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
    load: function (opts) {

      opts = opts || {};
      var splashScreen = opts.splashScreen || false;

      var _this = this;
      var data_hook = this._dataModel;
      var language_hook = this._languageModel;
      var query = this.getQuery(splashScreen);
      var formatters = this._getAllFormatters();
      var promiseLoad = new Promise();
      var promises = [];
      //useful to check if in the middle of a load call
      this._loadCall = true;

      //load hook
      //if its not a hook, the promise will not be created
      if (this.isHook() && data_hook && query) {
        //hook changes, regardless of actual data loading
        this.trigger('hook_change');
        //get reader info
        var reader = data_hook.getObject();
        reader.formatters = formatters;

        var lang = language_hook ? language_hook.id : 'en';
        var promise = new Promise();
        var evts = {
          'load_start': function () {
            _this.setLoading('_hook_data');
            Vizabi.Events.freezeAll([
              'load_start',
              'resize',
              'dom_ready'
            ]);
          }
        };

        utils.timeStamp('Vizabi Model: Loading Data: ' + _this._id);
        _DATAMANAGER.load(query, lang, reader, evts).then(function (dataId) {
          _this._dataId = dataId;
          utils.timeStamp('Vizabi Model: Data loaded: ' + _this._id);
          _this.afterLoad();
          promise.resolve();
        }, function (err) {
          _this.trigger('load_error', query);
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
      wait.then(function () {

        //only validate if not showing splash screen to avoid fixing the year
        if (_this.validate) {
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
      });

      return promiseLoad;
    },

    /**
     * executes after preloading processing is done
     */
    afterPreload: function () {
      var submodels = this.getSubmodels();
      utils.forEach(submodels, function(s) {
        s.afterPreload();
      });
    },

    /**
     * executes after data has actually been loaded
     */
    afterLoad: function () {
      Vizabi.Events.unfreezeAll();
      this.setLoadingDone('_hook_data');
      interpIndexes = {};
    },

    /**
     * removes all external dependency references
     */
    resetDeps: function () {
      this._deps.children = [];
    },

    /**
     * add external dependency ref to this model
     */
    addDep: function (child) {
      this._deps.children.push(child);
      child._deps.parent.push(this);
    },

    /**
     * gets query that this model/hook needs to get data
     * @returns {Array} query
     */
    getQuery: function (splashScreen) {

      var dimensions, filters, select, q;

      //if it's not a hook, no query is necessary
      if (!this.isHook()) return true;
      //error if there's nothing to hook to
      if (Object.keys(this._space).length < 1) {
        utils.error('Error:', this._id, 'can\'t find the space');
        return true;
      }
      dimensions = this._getAllDimensions();
      filters = this._getAllFilters(splashScreen);

      if(this.use !== 'value') dimensions = dimensions.concat([this.which]);
      select = utils.unique(dimensions);

      //return query
      return {
        'select': select,
        'where': filters
      };
    },

    /* ===============================
     * Hooking model to external data
     * ===============================
     */

    /**
     * is this model hooked to data?
     */
    isHook: function () {
      return this.use ? true : false;
    },
    /**
     * Hooks all hookable submodels to data
     */
    setHooks: function () {
      if (this.isHook()) {
        //what should this hook to?
        this.hookModel();
      }
      else {
        //hook submodels
        var submodels = this.getSubmodels();
        utils.forEach(submodels, function (s) {
          s.setHooks();
        });
      }
    },

    /**
     * Hooks this model to data, entities and time
     * @param {Object} h Object containing the hooks
     */
    hookModel: function () {
      var _this = this;
      var spaceRefs = getSpace(this);
      // assuming all models will need data and language support
      this._dataModel = getClosestModel(this, 'data');
      this._languageModel = getClosestModel(this, 'language');
      //check what we want to hook this model to
      utils.forEach(spaceRefs, function (name) {
        //hook with the closest prefix to this model
        _this._space[name] = getClosestModel(_this, name);
        //if hooks change, this should load again
        //TODO: remove hardcoded 'show"
        if (_this._space[name].show) {
          _this._space[name].on('change:show', function (evt) {
              _this.load();
          });
        }
      });
      //this is a hook, therefore it needs to reload when data changes
      this.on('change:which', function (evt) {
        _this.load();
      });
      //this is a hook, therefore it needs to reload when data changes
      this.on('hook_change', function () {
        _this._spaceDims = {};
        _this.setReady(false);
      });
    },

    /**
     * Gets all submodels of the current model that are hooks
     * @param object [object=false] Should it return an object?
     * @returns {Array|Object} hooks array or object
     */
    getSubhooks: function (object) {
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
    getHookWhich: function (type) {
      var values = [];
      if (this.use && this.use === type) {
        values.push(this.which);
      }
      //repeat for each submodel
      utils.forEach(this.getSubmodels(), function (s) {
        values = utils.unique(values.concat(s.getHookWhich(type)));
      });
      //now we have an array with all values in a type of hook for hooks.
      return values;
    },

    /**
     * gets all sub values for indicators in this model
     * @returns {Array} all unique values of indicator hooks
     */
    getIndicators: function () {
      return this.getHookWhich('indicator');
    },

    /**
     * gets all sub values for indicators in this model
     * @returns {Array} all unique values of property hooks
     */
    getProperties: function () {
      return this.getHookWhich('property');
    },

    /**
     * Gets the dimension of this model if it has one
     * @returns {String|Boolean} dimension
     */
    getDimension: function () {
      return this.dim || false; //defaults to dim if it exists
    },

    /**
     * Gets the filter for this model if it has one
     * @returns {Object} filters
     */
    getFilter: function () {
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

      if(this.isHook()) {
        return [];
      }

      var dimTime, time, filtered, next, fraction, u, w, value;
      this._dataCube = this._dataCube || this.getSubhooks(true);
      filter = utils.clone(filter, this._getAllDimensions());
      dimTime = this._getFirstDimension({type: 'time'});
      time = new Date(filter[dimTime]); //clone date
      filter = utils.clone(filter, null, dimTime);

      var response = {};
      var f_keys = Object.keys(filter);
      var f_values = f_keys.map(function(k) { return filter[k]; });

      //if there's a filter, interpolate only that
      if(f_keys.length) {
        utils.forEach(this._dataCube, function(hook, name) {
          next = next || d3.bisectLeft(hook.getUnique(dimTime), time);
          u = hook.use;
          w = hook.which;
          filtered = hook.getNestedItems(f_keys);
          utils.forEach(f_values, function(v) {
            filtered = filtered[v]; //get precise array (leaf)
          });
          if(!fraction) {
            fraction = (next===0) ? 1 : (time - filtered[next - 1][dimTime]) / (filtered[next][dimTime] - filtered[next - 1][dimTime]);
          }
          value = interpolatePoint(filtered, u, w, next, fraction);
          response[name] = hook.mapValue(value);

          //concat previous data points
          if(previous) {
            var values = utils.filter(filtered, filter).filter(function (d) {
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
          filtered = hook.getNestedItems(group_by);
          response[name] = {};
          //find position from first hook
          next = (typeof next === 'undefined') ? d3.bisectLeft(hook.getUnique(dimTime), time) : next;
          u = hook.use;
          w = hook.which;
          utils.forEach(filtered, function(arr, id) {
            if(!fraction) {
              fraction = (next===0) ? 1 : (time - arr[next - 1][dimTime]) / (arr[next][dimTime] - arr[next - 1][dimTime]);
            }
            value = interpolatePoint(arr, u, w, next, fraction);
            response[name][id] = hook.mapValue(value);

            //concat previous data points
            if(previous) {
              var values = utils.filter(arr, filter).filter(function (d) {
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

    /**
     * gets the value of the hook point
     * @param {Object} filter Id the row. e.g: {geo: "swe", time: "1999"}
     * @returns hooked value
     */
    getValue: function (filter) {
      //extract id from original filter
      filter = utils.clone(filter, this._getAllDimensions());
      if (!this.isHook()) {
        utils.warn('getValue method needs the model to be hooked to data.');
        return;
      }
      var value;
      if (this.use === 'value') {
        value = this.which;
      } else if (this._space.hasOwnProperty(this.use)) {
        value = this._space[this.use][this.which];
      } else {
        //TODO: get meta info about translatable data
        var l = (this.use !== 'property') ? null : this._languageModel.id;
        value = interpolateValue.call(this, filter, this.use, this.which, l);
      }
      return this.mapValue(value);
    },

    /**
     * maps the value to this hook's specifications
     * @param value Original value
     * @returns hooked value
     */
    mapValue: function (value) {
      return value;
    },

    /**
     * gets the items associated with this hook without values
     * @param filter filter
     * @returns hooked value
     */
    getKeys: function (filter) {
      if (this.isHook() && this._dataModel) {
        //all dimensions except time (continuous)
        var dimensions = this._getAllDimensions({
          exceptType: 'time'
        });
        var excluded = this._getAllDimensions({
          onlyType: 'time'
        });

        return this.getUnique(dimensions).map(function (item) {
          utils.forEach(excluded, function (e) {
            if (filter && filter[e]) {
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
    getFilteredItems: function (filter) {
      if (!filter) {
        utils.warn("No filter provided to getFilteredItems(<filter>)");
        return {};
      }
      //cache optimization
      var filter_id = JSON.stringify(filter);
      var filtered = _DATAMANAGER.get(this._dataId, 'filtered');
      var found = filtered[filter_id];
      if (filtered[filter_id]) {
        return filtered[filter_id];
      }
      var items = _DATAMANAGER.get(this._dataId);
      return filtered[filter_id] = utils.filter(items, filter);
    },

    /**
     * gets nested dataset
     * @param {Array} order
     * @returns {Object} nest items object
     */
    getNestedItems: function (order) {
      if (!order) {
        utils.warn("No order array provided to getNestedItems(<order>). E.g.: getNestedItems(['geo'])");
        return {};
      }
      //cache optimization
      var order_id, nested, items, nest;
      order_id = order.join("-");
      nested = this._dataId ? _DATAMANAGER.get(this._dataId, 'nested') : false;
      if (nested && order_id in nested) {
        return nested[order_id];
      }
      items = this._dataId ? _DATAMANAGER.get(this._dataId) : this.getKeys();
      nest = d3.nest();
      for (var i = 0; i < order.length; i++) {
        nest = nest.key((function(k) {
          return function(d) { return d[k]; };
        })(order[i]));
      };

      function nestToObj(arr) {
        if(!arr || !arr.length || !arr[0].key) return arr;
        var res = {};
        for (var i = 0; i < arr.length; i++) {
          res[arr[i].key] = nestToObj(arr[i].values);
        };
        return res;
      }

      return nested[order_id] = nestToObj(nest.entries(items));
    },

    /**
     * Gets formatter for this model
     * @returns {Function|Boolean} formatter function
     */
    getFormatter: function () {
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
        if(Math.abs(x)<1) {prec = 1; format = "r"};

        var prefix = "";
        if(formatterRemovePrefix) return d3.format("."+prec+format)(x);

        switch (Math.floor(Math.log10(Math.abs(x)))){
            case -13: x = x*1000000000000; prefix = "p"; break; //0.1p
            case -10: x = x*1000000000; prefix = "n"; break; //0.1n
            case  -7: x = x*1000000; prefix = "µ"; break; //0.1µ
            case  -6: x = x*1000000; prefix = "µ"; break; //1µ
            case  -5: x = x*1000000; prefix = "µ"; break; //10µ
            case  -4: break; //0.0001
            case  -3: break; //0.001
            case  -2: break; //0.01
            case  -1: break; //0.1
            case   0: break; //1
            case   1: break; //10
            case   2: break; //100
            case   3: break; //1000
            case   4: break; //10000
            case   5: x = x/1000; prefix = "k"; break; //0.1M
            case   6: x = x/1000000; prefix = "M"; prec = 1; break; //1M
            case   7: x = x/1000000; prefix = "M"; break; //10M
            case   8: x = x/1000000; prefix = "M"; break; //100M
            case   9: x = x/1000000000; prefix = "B"; prec = 1; break; //1B
            case  10: x = x/1000000000; prefix = "B"; break; //10B
            case  11: x = x/1000000000; prefix = "B"; break; //100B
            case  12: x = x/1000000000000; prefix = "T"; prec = 1; break; //1T
            //use the D3 SI formatting for the extreme cases
            default: return (d3.format("."+prec+"s")(x)).replace("G","B");
        }

        // use manual formatting for the cases above
        return (d3.format("."+prec+format)(x)+prefix).replace("G","B");

    },

    /**
     * Gets the d3 scale for this hook. if no scale then builds it
     * @returns {Array} domain
     */
    getScale: function (margins) {
      if (!this.scale) {
        this.buildScale(margins);
      }
      return this.scale;
    },

    /**
     * Gets the domain for this hook
     * @returns {Array} domain
     */
    buildScale: function () {
      if (!this.isHook()) {
        return;
      }
      var domain;
      var scaleType = this.scaleType || 'linear';
      switch (this.use) {
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
    getLimits: function (attr) {
      if (!this.isHook()) {
        return;
      }
      //store limits so that we stop rechecking.
      var cachedLimits = _DATAMANAGER.get(this._dataId, 'limits');
      if (cachedLimits[attr]) {
        return cachedLimits[attr];
      }
      var map = function (n) {
        return (utils.isDate(n)) ? n : parseFloat(n);
      };
      var items = _DATAMANAGER.get(this._dataId);
      var filtered = items.reduce(function (filtered, d) {
        var f = map(d[attr]);
        if (!isNaN(f)) {
          filtered.push(f);
        }
        //filter
        return filtered;
      }, []);
      var min;
      var max;
      var limits = {};
      for (var i = 0; i < filtered.length; i += 1) {
        var c = filtered[i];
        if (typeof min === 'undefined' || c < min) {
          min = c;
        }
        if (typeof max === 'undefined' || c > max) {
          max = c;
        }
      }
      limits.min = min || 0;
      limits.max = max || 100;
      cachedLimits[attr] = limits;
      return limits;
    },

    /**
     * Gets unique values in a column
     * @param {String|Array} attr parameter
     * @returns {Array} unique values
     */
    getUnique: function (attr) {
      if (!this.isHook()) {
        return;
      }
      if (!attr) {
        attr = this._getFirstDimension({type: "time"});
      }
      var uniqueItems = _DATAMANAGER.get(this._dataId, 'unique');
      var uniq_id = JSON.stringify(attr);
      var uniq;
      if (uniqueItems[uniq_id]) {
        return uniqueItems[uniq_id];
      }
      var items = _DATAMANAGER.get(this._dataId);
      //if not in cache, compute
      //if it's an array, it will return a list of unique combinations.
      if (utils.isArray(attr)) {
        var values = items.map(function (d) {
          return utils.clone(d, attr); //pick attrs
        });
        uniq = utils.unique(values, function (n) {
          return JSON.stringify(n);
        });
      } //if it's a string, it will return a list of values
      else {
        var values = items.map(function (d) {
          return d[attr];
        });
        uniq = utils.unique(values);
      }
      uniqueItems[uniq_id] = uniq;
      return uniq;
    },

    //TODO: Is this supposed to be here?
    /**
     * gets maximum, minimum and mean values from the dataset of this certain hook
     */
    getMaxMinMean: function (options) {
        var _this = this;
        var result = {};
        //TODO: d3 is global?
        //Can we do this without d3?
        //yes if we copy d3 nest to out utils https://github.com/mbostock/d3/blob/master/src/arrays/nest.js
        var dim = this._getFirstDimension({
            type: 'time'
        });

        d3.nest()
            .key(function (d) {return options.timeFormatter(d[dim]);})
            .entries(_DATAMANAGER.get(this._dataId))
            .forEach(function (d) {
                var values = d.values
                    .filter(function (f) {return f[_this.which] !== null;})
                    .map(function (m) {return +m[_this.which];});

                if(options.skipZeros) values = values.filter(function (f) {return f!=0})

                result[d.key] = {
                    max: d3.max(values),
                    min: d3.min(values),
                    mean: d3.mean(values)
                };
            });
        return result;
    },

    /**
     * gets all hook dimensions
     * @param {Object} opts options with exceptType or onlyType
     * @returns {Array} all unique dimensions
     */
    _getAllDimensions: function (opts) {

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
        utils.forEach(this.space, function (name) {
          models.push(getClosestModel(_this, name));
        });
      }

      utils.forEach(models, function (m) {
        if (opts.exceptType && m.getType() === opts.exceptType) {
          return true;
        }
        if (opts.onlyType && m.getType() !== opts.onlyType) {
          return true;
        }
        if (dim = m.getDimension()) {
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
    _getFirstDimension: function (opts) {
      opts = opts || {};

      var models = this._space;
      //in case it's a parent of hooks
      if(!this.isHook() && this.space) {
        models = [];
        var _this = this;
        utils.forEach(this.space, function (name) {
          models.push(getClosestModel(_this, name));
        });
      }

      var dim = false;
      utils.forEach(models, function (m) {
        if (opts.exceptType && m.getType() !== opts.exceptType) {
          dim = m.getDimension();
          return false;
        }
        else if (opts.type && m.getType() === opts.type) {
          dim = m.getDimension();
          return false;
        }
        else if (!opts.exceptType && !opts.type) {
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
    _getAllFilters: function (splashScreen) {
      var filters = {};
      utils.forEach(this._space, function (h) {
        filters = utils.extend(filters, h.getFilter(splashScreen));
      });
      return filters;
    },

    /**
     * gets all hook filters
     * @returns {Object} filters
     */
    _getAllFormatters: function () {
      var formatters = {};
      utils.forEach(this._space, function (h) {
        var f = h.getFormatter();
        if (f) {
          formatters[h.getDimension()] = f;
        }
      });
      return formatters;
    }

  });

  Vizabi.Model = Model;

  /* ===============================
   * Private Helper Functions
   * ===============================
   */

  /**
   * Checks whether an object is a model or not
   */
  function isModel(model) {
    return model.hasOwnProperty('_data');
  }

  /**
   * Binds all attributes in _data to magic setters and getters
   */
  function bindSettersGetters(model) {
    for (var prop in model._data) {
      Object.defineProperty(model, prop, {
        configurable: true,
        //allow reconfiguration
        get: function (p) {
          return function () {
            return model.get(p);
          };
        }(prop),
        set: function (p) {
          return function (value) {
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
   * @param {Object} ctx context
   * @returns {Object} model new submodel
   */
  function initSubmodel(attr, val, ctx) {
    var name = attr.split('_')[0];
    var binds = {
      //the submodel has changed (multiple times)
      'change': function (evt, vals) {
        if(!ctx._ready) return; //block change propagation if model isnt ready
        evt = evt.replace('change', 'change:' + name);
        ctx.triggerAll(evt, ctx.getObject());
      },
      //loading has started in this submodel (multiple times)
      'hook_change': function (evt, vals) {
        ctx.trigger(evt, ctx.getObject());
      },
      //loading has started in this submodel (multiple times)
      'load_start': function (evt, vals) {
        evt = evt.replace('load_start', 'load_start:' + name);
        ctx.setReady(false);
        ctx.triggerAll(evt, ctx.getObject());
      },
      //loading has failed in this submodel (multiple times)
      'load_error': function (evt, vals) {
        evt = evt.replace('load_error', 'load_error:' + name);
        ctx.triggerAll(evt, vals);
      },
      //loading has ended in this submodel (multiple times)
      'ready': function (evt, vals) {
        //trigger only for submodel
        evt = evt.replace('ready', 'ready:' + name);
        ctx.setReady(false);
        //wait to make sure it's not set false again in the next execution loop
        utils.defer(function() {
          ctx.setReady();
        });
        //ctx.trigger(evt, vals);
      }
    };
    if (isModel(val)) {
      val.on(binds);
      return val;
    } else {
      //special model
      var Modl = Vizabi.Model.get(name, true) || Model;
      return new Modl(val, ctx, binds, true);
    }
  }

  /**
   * gets closest interval from this model or parent
   * @returns {Object} Intervals object
   */
  function getIntervals(ctx) {
    if (ctx._intervals) {
      return ctx._intervals;
    } else if (ctx._parent) {
      return getIntervals(ctx._parent);
    } else {
      return new Vizabi.Intervals();
    }
  }

  /**
   * gets closest prefix model moving up the model tree
   * @param {String} prefix
   * @returns {Object} submodel
   */
  function getClosestModel(ctx, name) {
    var model = findSubmodel(ctx, name);
    if (model) {
      return model;
    } else if (ctx._parent) {
      return getClosestModel(ctx._parent, name);
    }
  }

  /**
   * find submodel with name that starts with prefix
   * @param {String} prefix
   * @returns {Object} submodel or false if nothing is found
   */
  function findSubmodel(ctx, name) {
    for (var i in ctx._data) {
      //found submodel
      if (i === name && isModel(ctx._data[i])) {
        return ctx._data[i];
      }
    }
  }

  /**
   * Learn what this model should hook to
   * @returns {Array} space array
   */
  function getSpace(model) {
    if (utils.isArray(model.space)) {
      return model.space;
    } else if (model._parent) {
      return getSpace(model._parent);
    } else {
      utils.error('ERROR: space not found.\n You must specify the objects this hook will use under the "space" attribute in the state.\n Example:\n space: ["entities", "time"]');
    }
  }

  //caches interpolation indexes globally.
  //TODO: what if there are 2 visualizations with 2 data sources?
  var interpIndexes = {};

  /**
   * interpolates the specific value missing
   * @param {Array} list
   * @param {String} use
   * @param {String} which
   * @param {Number} i the next item in the array
   * @param {Number} fraction
   * @returns interpolated value
   */
  function interpolatePoint(arr, use, which, i, fraction) {
    var value;

    if (arr === null || arr.length === 0) {
      utils.warn('interpolatePoint returning NULL: array is empty');
      return null;
    }
    // return constant for the use of "value"
    if (use === 'value') {
      return which;
    }
    // zero-order interpolation for the use of properties
    if (use === 'property' && i === 0) {
      return arr[0][which];
    }
    if (use === 'property') {
      return arr[i - 1][which];
    }

    // the rest is for the continuous measurements
    // check if the desired value is out of range. 0-order extrapolation
    if (i === 0) {
      return arr[0][which];
    }
    if (i === arr.length) {
      return arr[arr.length - 1][which];
    }
    //return null if data is missing
    if (arr[i][which] === null || arr[i-1][which] === null) {
      return null;
    }

    value = +arr[i-1][which] + (arr[i][which] - arr[i-1][which]) * fraction;
    // cast to time object if we are interpolating time
    if (utils.isDate(arr[0][which])) {
      value = new Date(value);
    }
    return value;
  }

  /**
   * interpolates the specific value if missing
   * @param {Object} _filter Id the row. e.g: {geo: "swe", time: "1999"}
   * filter SHOULD contain time property
   * @returns interpolated value
   */
  function interpolateValue(_filter, use, which) {

    var dimTime, time, filter, items, space_id, indexNext, fraction, value;

    dimTime = this._getFirstDimension({type: 'time'});
    time = new Date(_filter[dimTime]); //clone date
    filter = utils.clone(_filter, null, dimTime);


    items = this.getFilteredItems(filter);
    if (items === null || items.length === 0) {
      utils.warn('interpolateValue returns ' + which + ' = NULL because items array is empty in ' + JSON.stringify(filter));
      return null;
    }

    // return constant for the use of "value"
    if (use === 'value') {
      return items[0][which];
    }

    // search where the desired value should fall between the known points
    space_id = this._spaceId || (this._spaceId = Object.keys(this._space).join('-'));
    interpIndexes[space_id] = interpIndexes[space_id] || {};

    if(time in interpIndexes[space_id]) {
      indexNext = interpIndexes[space_id][time].next;
    }
    else {
      indexNext = d3.bisectLeft(this.getUnique(dimTime), time);
      //store indexNext and fraction
      interpIndexes[space_id][time] = {
        next: indexNext
      };
    }

    // zero-order interpolation for the use of properties
    if (use === 'property' && indexNext === 0) {
      return items[0][which];
    }
    if (use === 'property') {
      return items[indexNext - 1][which];
    }
    // the rest is for the continuous measurements
    // check if the desired value is out of range. 0-order extrapolation
    if (indexNext === 0) {
      return items[0][which];
    }
    if (indexNext === items.length) {
      return items[items.length - 1][which];
    }
    //return null if data is missing
    if (items[indexNext][which] === null || items[indexNext - 1][which] === null) {
      return null;
    }

    fraction = (time - items[indexNext - 1][dimTime]) / (items[indexNext][dimTime] - items[indexNext - 1][dimTime]);
    value = +items[indexNext - 1][which] + (items[indexNext][which] - items[indexNext - 1][which]) * fraction;
    // cast to time object if we are interpolating time
    if (Object.prototype.toString.call(items[0][which]) === '[object Date]') {
      value = new Date(value);
    }
    return value;
  };

}.call(this));
