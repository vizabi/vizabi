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
     * Gets all submodels of the current model
     */
    getSubmodels: function () {
      var submodels = [];
      utils.forEach(this._data, function (s) {
        if (s && typeof s._id !== 'undefined') {
          submodels.push(s);
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
      if (this.isHook() && !this._loadedOnce) {
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
     * @returns defer
     */
    load: function () {
      var _this = this;
      var submodels = this.getSubmodels();
      var data_hook = this._dataModel;
      var language_hook = this._languageModel;
      var query = this.getQuery();
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
          },
          'load_end': function () {
            Vizabi.Events.unfreezeAll();
            _this.setLoadingDone('_hook_data');
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
      for (var i in submodels) {
        promises.push(submodels[i].load());
      }
      //when all promises/loading have been done successfully
      //we will consider this done
      var wait = promises.length ? Promise.all(promises) : new Promise.resolve();
      wait.then(function () {
        if (_this.validate) {
          _this.validate();
        }
        utils.timeStamp('Vizabi Model: Model loaded: ' + _this._id);
        //end this load call
        _this._loadedOnce = true;
        _this._loadCall = false;
        _this.setReady();
        promiseLoad.resolve();
      });
      return promiseLoad;
    },

    /**
     * executes after data has actually been loaded
     */
    afterLoad: function () {
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
      //hook submodels
      var submodels = this.getSubmodels();
      utils.forEach(submodels, function (s) {
        s.setHooks();
      });
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
      this.on('change', function () {
        _this.load();
      });
      //this is a hook, therefore it needs to reload when data changes
      this.on('hook_change', function () {
        _this._spaceDims = {};
        _this.setReady(false);
      });
    },

    /**
     * gets all sub values for a certain hook
     * only hooks have the "hook" attribute.
     * @param {String} type specific type to lookup
     * @returns {Array} all unique values with specific hook use
     */
    getHookValues: function (type) {
      var values = [];
      if (this.use && this.use === type) {
        values.push(this.which);
      }
      //repeat for each submodel
      utils.forEach(this.getSubmodels(), function (s) {
        values = utils.unique(values.concat(s.getHookValues(type)));
      });
      //now we have an array with all values in a type of hook for hooks.
      return values;
    },

    /**
     * gets all sub values for indicators in this model
     * @returns {Array} all unique values of indicator hooks
     */
    getIndicators: function () {
      return this.getHookValues('indicator');
    },

    /**
     * gets all sub values for indicators in this model
     * @returns {Array} all unique values of property hooks
     */
    getProperties: function () {
      return this.getHookValues('property');
    },

    /**
     * gets all hook dimensions
     * @param {Object} options
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
      utils.forEach(this._space, function (m) {
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
      var dim = false;
      utils.forEach(this._space, function (m) {
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
     * @returns {Object} filters
     */
    _getAllFilters: function () {
      var filters = {};
      utils.forEach(this._space, function (h) {
        filters = utils.extend(filters, h.getFilter());
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
    },

    /**
     * gets the value specified by this hook
     * @param {Object} filter Reference to the row. e.g: {geo: "swe", time: "1999", ... }
     * @returns hooked value
     */
    getValue: function (filter) {
      //extract id from original filter
      var id = utils.clone(filter, this._getAllDimensions());
      return this.mapValue(this._getHookedValue(id));
    },

    /**
     * gets multiple values from the hook
     * @param {Object} filter Reference to the row. e.g: {geo: "swe", time: "1999", ... }
     * @returns an array of values
     */
    getValues: function (filter) {
      //extract id from original filter
      var id = utils.clone(filter, this._getAllDimensions());
      return this._getHookedValues(id);
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
     * @param value Original valueg
     * @returns hooked value
     */
    getItems: function (filter) {
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
        var smdls = this.getSubmodels();
        var found = [];
        if(smdls.length > 1) {
          utils.forEach(smdls, function(s) {
            if(s.getItems) {
              found = s.getItems();
              return false;
            }
          });
        }
        return found;
      }
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
     * Gets formatter for this model
     * @returns {Function|Boolean} formatter function
     */
    getFormatter: function () {
    },

    /**
     * gets query that this model/hook needs to get data
     * @returns {Array} query
     */
    getQuery: function () {
      //only perform query in these two uses
      var needs_query = [
        'property',
        'indicator'
      ];
      //if it's not a hook, property or indicator, no query is necessary
      if (!this.isHook() || needs_query.indexOf(this.use) === -1) {
        return true;
      } //error if there's nothing to hook to
      else if (Object.keys(this._space).length < 1) {
        utils.error('Error:', this._id, 'can\'t find any dimension');
        return true;
      } //else, its a hook (indicator or property) and it needs to query
      else {
        var dimensions = this._getAllDimensions();
        var select = utils.unique(dimensions.concat([this.which]));
        var filters = this._getAllFilters();
        //return query
        return {
          'from': 'data',
          'select': select,
          'where': filters
        };
      }
    },

    /**
     * Gets tick values for this hook
     * @returns {Number|String} value The value for this tick
     */
    tickFormatter: function (x, formatterRemovePrefix) {

      if (utils.isDate(x)) {
        //find time model and use its format
        var timeModel;
        utils.forEach(this._space, function (m) {
          if (m.getType() === 'time') {
            timeModel = m;
            return false;
          }
        });
        if (!timeModel) return;
        var fmt = d3.time.format(timeModel.formatOutput || "%Y");
        return fmt(x);
      }
      if (utils.isString(x)) {
        return x;
      }
      var format = 'f';
      var prec = 0;
      if (Math.abs(x) < 1) {
        prec = 1;
        format = 'r';
      }
      var prefix = '';
      if (formatterRemovePrefix) {
        return d3.format('.' + prec + format)(x);
      }
      switch (Math.floor(Math.log10(Math.abs(x)))) {
        case -13:
          x = x * 1000000000000;
          prefix = 'p';
          break;
        //0.1p
        case -10:
          x = x * 1000000000;
          prefix = 'n';
          break;
        //0.1n
        case -7:
          x = x * 1000000;
          prefix = '\xB5';
          break;
        //0.1µ
        case -6:
          x = x * 1000000;
          prefix = '\xB5';
          break;
        //1µ
        case -5:
          x = x * 1000000;
          prefix = '\xB5';
          break;
        //10µ
        case -4:
          break;
        //0.0001
        case -3:
          break;
        //0.001
        case -2:
          break;
        //0.01
        case -1:
          break;
        //0.1
        case 0:
          break;
        //1
        case 1:
          break;
        //10
        case 2:
          break;
        //100
        case 3:
          break;
        //1000
        case 4:
          break;
        //10000
        case 5:
          x = x / 1000;
          prefix = 'k';
          break;
        //0.1M
        case 6:
          x = x / 1000000;
          prefix = 'M';
          prec = 1;
          break;
        //1M
        case 7:
          x = x / 1000000;
          prefix = 'M';
          break;
        //10M
        case 8:
          x = x / 1000000;
          prefix = 'M';
          break;
        //100M
        case 9:
          x = x / 1000000000;
          prefix = 'B';
          prec = 1;
          break;
        //1B
        case 10:
          x = x / 1000000000;
          prefix = 'B';
          break;
        //10B
        case 11:
          x = x / 1000000000;
          prefix = 'B';
          break;
        //100B
        case 12:
          x = x / 1000000000000;
          prefix = 'T';
          prec = 1;
          break;
        //1T
        //use the D3 SI formatting for the extreme cases
        default:
          return d3.format('.' + prec + 's')(x).replace('G', 'B');
      }
      // use manual formatting for the cases above
      return (d3.format('.' + prec + format)(x) + prefix).replace('G', 'B');
    },

    /**
     * Gets the d3 scale for this hook. if no scale then builds it
     * @returns {Array} domain
     */
    getScale: function () {
      if (!this.scale) {
        this.buildScale();
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
      this.scale = d3.scale[scaleType]().domain(domain);
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

    /**
     * gets the value of the hook point
     * @param {Object} filter Id the row. e.g: {geo: "swe", time: "1999"}
     * @returns hooked value
     */
    _getHookedValue: function (filter) {
      if (!this.isHook()) {
        utils.warn('_getHookedValue method needs the model to be hooked to data.');
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
      return value;
    },

    /**
     * gets the values of the hook point
     * @param {Object} filter Id the row. e.g: {geo: "swe", time: "1999"}
     * @returns an array of hooked values
     */
    _getHookedValues: function (filter) {
      var _this = this;
      if (!this.isHook()) {
        utils.warn('_getHookedValues method needs the model to be hooked to data.');
        return;
      }
      var values;
      var items = _DATAMANAGER.get(this._dataId);
      var dimTime = this._getFirstDimension({type: 'time'});

      if (this.use === 'value') {
        values = [this.which];
      } else if (this._space.hasOwnProperty(this.use)) {
        values = [this._space[this.use][this.which]];
      } else {
        // if a specific time is requested -- return values up to this time
        if (filter && filter.hasOwnProperty(dimTime)) {
          // save time into variable
          var time = new Date(filter[dimTime]);
          // filter time will be removed during interpolation

          //TODO: get meta info about translatable data
          var l = (this.use !== 'property') ? null : this._languageModel.id;
          var lastValue = interpolateValue.call(this, filter, this.use, this.which, l);
          
          // return values up to the requested time point, append an interpolated value as the last one
          values = utils.filter(items, filter).filter(function (d) {
            return d[dimTime] <= time;
          }).map(function (d) {
            return d[_this.which];
          }).concat(lastValue);
        } else {
          // if time not requested -- return just all values
          values = items.filter(filter).map(function (d) {
            return d[_this.which];
          });
        }
      }
      return values;
    },

    //TODO: Is this supposed to be here?
    /**
     * gets maximum, minimum and mean values from the dataset of this certain hook
     */
    getMaxMinMean: function (timeFormatter) {
      var _this = this;
      var result = {};
      //TODO: d3 is global?
      //Can we do this without d3?
      var dim = this._getFirstDimension({type: 'time'});

      d3.nest().key(function (d) {
        return timeFormatter(d[dim]);
      }).entries(_DATAMANAGER.get(this._dataId)).forEach(function (d) {
        var values = d.values.filter(function (f) {
          return f[_this.which] !== null;
        }).map(function (m) {
          return +m[_this.which];
        });
        result[d.key] = {
          max: d3.max(values),
          min: d3.min(values),
          mean: d3.mean(values)
        };
      });
      return result;
    },

    /**
     * gets filtered dataset with fewer keys
     */
    getFilteredItems: function (filter) {
      //cache optimization
      var filter_id = JSON.stringify(filter);
      var filtered = _DATAMANAGER.get(this._dataId, 'filtered');
      if (!filter) return filtered;
      var found = filtered[filter_id];
      if (filtered[filter_id]) {
        return filtered[filter_id];
      }
      var items = _DATAMANAGER.get(this._dataId);
      return filtered[filter_id] = utils.filter(items, filter);
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
    //naming convention: underscore -> time, time_2, time_overlay
    var name = attr.split('_')[0];
    var binds = {
      //the submodel has changed (multiple times)
      'change': function (evt, vals) {
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
        ctx.triggerAll(evt, ctx.getObject());
        ctx.setReady(false);
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
        ctx.trigger(evt, vals);
        //TODO: understand why we need to force it not to be ready
        ctx.setReady(false);
        ctx.setReady();
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
      utils.warn('interpolateValue returning NULL because items array is empty');
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
