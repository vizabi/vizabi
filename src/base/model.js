define([
    'jquery',
    'd3',
    'lodash',
    'base/utils',
    'base/class',
    'base/intervals',
    'base/events',
    'base/data',
], function($, d3, _, utils, Class, Intervals, Events, DataManager) {

    var model = Class.extend({

        /**
         * Initializes the model.
         * @param {Object} values The initial values of this model
         * @param {Object} parent reference to parent
         * @param {Object} bind Initial events to bind
         */
        init: function(values, parent, bind) {

            this._type = this._type || "model"; //type of this model
            this._id = _.uniqueId("m"); //model unique id
            this._data = {}; //holds attributes of this model
            this._parent = parent; //parent model
            this._set = false; //is this model set?
            this._ready = false; //is this model ready?
            this._debugEvents = this._debugEvents || false;

            //intervals should be the same from tool
            this._intervals = this.getIntervals();
            //each model has its own event handling
            this._events = new Events();

            //will the model be hooked to data?
            this._hooks = {};
            this._dataModel = null;
            this._languageModel = null;
            this._loading = []; //array of processes that are loading
            this._items = []; //holds hook items for this hook
            this._unique = {}; //stores unique values per column
            this._filtered = {}; //stores filtered values

            //bind initial events
            if (bind) {
                this.on(bind);
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
        get: function(attr) {
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
        set: function(attr, val, force) {

            var defer = $.Deferred(),
                promises = [],
                events = [],
                changes = [],
                setting = this._setting,
                _this = this,
                attrs;

            //expect object as default
            if (!_.isPlainObject(attr)) {
                (attrs = {})[attr] = val;
            } else {
                attrs = attr;
                force = val;
            }

            //if it's the first time we are setting this, check previous
            if (!setting) {
                this._prevData = _.clone(this._data);
                this._changedData = {};
            }

            this._setting = true; //we are currently setting the model
            this.setReady(false);

            //compute each change
            for (var a in attrs) {
                var val = attrs[a],
                    promise;

                //if its a regular value
                if (!_.isPlainObject(val)) {
                    //change if it's not the same value
                    if (!_.isEqual(this._data[a], val) || force) {
                        var p;
                        p = (_.isUndefined(this._data[a])) ? 'init' : 'change';
                        events.push(p + ":" + a);
                    }
                    if (!_.isEqual(this._prevData[a], val) || force) {
                        this._changedData[a] = val;
                    } else {
                        delete this._changedData[a];
                    }
                    this._data[a] = val;
                    promise = true;
                }
                //if it's an object, it's a submodel
                else {
                    if (this._data[a] && utils.isModel(this._data[a])) {
                        events.push('change:' + a);
                        promise = this._data[a].set(val, force);
                    }
                    //submodel doesnt exist, create it
                    else {
                        events.push('init:' + a);
                        promise = this._initSubmodel(a, val);
                    }
                }
                promises.push(promise);
            }

            //after all is done
            var size = promises.length;
            $.when.apply(null, promises).then(function() {

                //bind magic getters and setters
                _this._bindSettersGetters();

                //attempt to validate
                var val_promise = false;
                //only validate is it's the first time setting (no loop)
                if (_this.validate && !setting) {
                    val_promise = _this.validate();
                }

                //if validation is not a promise, make it a confirmed one
                if (!val_promise || !val_promise.always) {
                    val_promise = $.when.apply(null, [this]);
                }
                //confirm that the model has been validated
                val_promise.always(function() {

                    //setting is true when validation takes place
                    if (!setting) {
                        //trigger set if not set
                        if (!_this._set) {
                            _this._set = true;
                            events.push("set");
                        } else if (events.length) {
                            events.push("change");
                        }


                        //trigger after defer is resolved
                        _.defer(function() {
                            _this.triggerAll(events, _this.getObject());
                        });

                        _this._setting = false;
                    }

                    defer.resolve();
                });
            });

            return defer;
        },

        /**
         * Gets the type of this model
         * @returns {String} type of the model
         */
        getType: function() {
            return this._type;
        },

        /**
         * Loads a submodel, when necessaary
         * @param attr Name of submodel
         * @param val Initial values
         * @returns defer defer that will be resolved when submodel is ready
         */
        _initSubmodel: function(attr, val) {
            //naming convention: underscore -> time, time_2, time_overlay
            var name = attr.split("_")[0],
                modl = 'models/' + name,
                defer = $.Deferred(),
                _this = this;

            //special model
            //hotfix: global _vzb_available_plugins has all variable modules
            if (_vzb_available_plugins.indexOf(modl) !== -1) {
                require([modl], function(model) {
                    _this._instantiateSubmodel(attr, val, model, defer);
                });
            } else {
                //always implement base model if not found
                var model = _getBaseModelClass();
                this._instantiateSubmodel(attr, val, model, defer);
            }
            return defer;
        },

        /**
         * Instantiates a new model as a submodel of this one
         * @param name Name of submodel
         * @param values Initial values
         * @param model Model class
         * @param defer defer to be resolved when model is ready
         */
        _instantiateSubmodel: function(name, values, model, defer) {

            var _this = this;

            this._data[name] = new model(values, this, {
                //the submodel has been set (only once)
                'set': function(evt, vals) {
                    //solve the defer after it's been set
                    defer.resolve();
                },
                //the submodel has initialized (only once)
                'init': function(evt, vals) {
                    evt = evt.replace('init', 'init:' + name);
                    _this.triggerAll(evt, _this.getObject());
                },
                //the submodel has changed (multiple times)
                'change': function(evt, vals) {
                    evt = evt.replace('change', 'change:' + name);
                    _this.triggerAll(evt, _this.getObject());
                },
                //loading has started in this submodel (multiple times)
                'load_start': function(evt, vals) {
                    evt = evt.replace('load_start', 'load_start:' + name);
                    _this.triggerAll(evt, _this.getObject());
                },
                //loading has failed in this submodel (multiple times)
                'load_error': function(evt, vals) {
                    evt = evt.replace('load_error', 'load_error:' + name);
                    _this.triggerAll(evt, vals);
                },
                //loading has ended in this submodel (multiple times)
                'ready': function(evt, vals) {
                    //trigger only for submodel
                    evt = evt.replace('ready', 'ready:' + name);
                    _this.triggerAll(evt, vals);

                    _this.setReady();
                }
            });
        },

        /**
         * Generate getter for a certain attribute
         * @param prop name of attribute
         * @returns {Function} getter function
         */
        _funcGetter: function(prop) {
            var _this = this;
            return function() {
                return _this.get(prop);
            };
        },

        /**
         * Generate setter for a certain attribute
         * @param prop name of attribute
         * @returns {Function} setter function
         */
        _funcSetter: function(prop) {
            var _this = this;
            return function(val) {
                return _this.set(prop, val);
            };
        },

        /**
         * Binds all attributes in _data to magic setters and getters
         */
        _bindSettersGetters: function() {
            for (var prop in this._data) {
                this.__defineGetter__(prop, this._funcGetter(prop));
                this.__defineSetter__(prop, this._funcSetter(prop));
            }
        },

        /**
         * Gets all submodels of the current model
         */
        getSubmodels: function() {
            return _.filter(this._data, function(s) {
                return !_.isUndefined(s._id);
            });
        },


        /**
         * Resets this model
         * @param values new values
         * @returns defer defer that will be resolved when reset is done
         */
        reset: function(values) {
            this.clear();
            return this.set(values);
        },

        /**
         * Clears this model, submodels, data and events
         */
        clear: function() {
            var submodels = this.getSubmodels();
            for (var i in submodels) {
                submodels[i].clear();
            }
            this.setReady(false);
            this._events.unbindAll();
            this._intervals.clearAllIntervals();
            this._data = {};
        },

        /**
         * Gets the current model and submodel values as a JS object
         * @returns {Object} All model as JS object
         */
        getObject: function() {
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
         * gets intervals from this model or parent
         * @returns {Object} Intervals object
         */
        getIntervals: function() {
            if (this.intervals) {
                return this.intervals;
            } else if (this._parent && this._parent.getIntervals) {
                return this._parent.getIntervals();
            } else {
                return new Intervals();
            }
        },


        /* ==========================
         * Model loading method
         * ==========================
         */

        /**
         * checks whether this model is loading anything
         * @param {String} optional process id (to check only one)
         * @returns {Boolean} is it loading?
         */
        isLoading: function(p_id) {
            if (p_id) {
                return (this._loading.indexOf(p_id) !== -1);
            }
            //if loading something
            else if (this._loading.length > 0) {
                return true;
            }
            //if not loading anything, check submodels
            else {
                return !_.every(this.getSubmodels(), function(sm) {
                    return !sm.isLoading();
                });
            }
        },

        /**
         * specifies that the model is loading data
         * @param {String} id of the loading process
         */
        setLoading: function(p_id) {
            //if this is the first time we're loading anything
            if (!this.isLoading()) {
                this.trigger("load_start");
            }
            //add id to the list of processes that are loading
            this._loading.push(p_id);
        },

        /**
         * specifies that the model is done with loading data
         * @param {String} id of the loading process
         */
        setLoadingDone: function(p_id) {
            //remove he process from the list of things that are loading
            this._loading = _.without(this._loading, p_id);
            //set ready if it is ready
            this.setReady();
        },

        /**
         * Sets the model as ready or not depending on its loading status
         */
        setReady: function(value) {


            if (!_.isUndefined(value) && value === false) {
                this._ready = false;
                if (this._parent && this._parent.setReady) {
                    this._parent.setReady(false);
                }
            } else if (this._ready = (!this.isLoading() && !this._setting && !this._loadCall)) {

                var _this = this;
                _.defer(function() {
                    _this.triggerOnce("ready");
                });
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
        load: function() {
            //we dont need to load if it's a hook
            var _this = this,
                promises = [],
                submodels = this.getSubmodels(),
                data_hook = this._dataModel,
                language_hook = this._languageModel,
                defer = $.Deferred(),
                query = this.getQuery();

            //useful to check if in the middle of a load call
            this._loadCall = true;

            //load hook
            //if its not a hook, the promise will not be created
            if (this.isHook() && data_hook && query.length) {

                //get reader omfp
                var promise = $.Deferred(),
                    reader = data_hook.getObject(),
                    lang = "en";

                //get current language
                if (language_hook) {
                    lang = language_hook.id || "en";
                }

                var evts = {
                    'load_start': function() {
                        _this.setLoading("_hook_data");
                        _this.freezeEvents(true, true, ['load_start']);
                    },
                    'load_end': function() {
                        _this.freezeEvents(false, true);
                        _this.setLoadingDone("_hook_data");
                    }
                };

                console.timeStamp("Vizabi Model: Loading Data: " + _this._id);

                this._dataManager.load(query, lang, reader, evts)
                    .done(function(data) {
                        if (data === 'error') {
                            _this.trigger("load_error", query);
                            promise.resolve();
                        } else {

                            _this._items = _.flatten(data);

                            //TODO this is a temporary solution that does preprocessing of data
                            // data should have time as Dates and be sorted by time
                            // put me in the proper place please!
                            _this._items = _this._items
                                // try to restore "geo" from "geo.name" if it's missing (ebola data has that problem)
                                .map(function(d) {
                                    if (d["geo"] == null) d["geo"] = d["geo.name"];
                                    return d
                                })
                                // convert time to Date()
                                .map(function(d) {
                                    d.time = new Date(d.time);
                                    d.time.setHours(0);
                                    return d;
                                })
                                // sort records by time
                                .sort(function(a, b) {
                                    return a.time - b.time
                                });

                            console.timeStamp("Vizabi Model: Data loaded: " + _this._id);

                            _this._unique = {};
                            _this._filtered = {};
                            _this.afterLoad();

                            promise.resolve();
                        }
                    });

                promises.push(promise);

            }

            //load submodels as well
            for (var i in submodels) {
                promises.push(submodels[i].load());
            }

            //when all promises/loading have been done successfully
            //we will consider this done
            $.when.apply(null, promises).then(function() {

                //but first, we need to validate
                var val_promise = false;
                if (_this.validate) {
                    val_promise = _this.validate();
                }

                //if validation is not a promise, confirm it
                if (!val_promise || !val_promise.always) {
                    val_promise = $.when.apply(null, [this]);
                }

                //confirm that the model has been validated
                val_promise.always(function() {

                    console.timeStamp("Vizabi Model: Model loaded: " + _this._id);

                    //end this load call
                    _this._loadCall = false;
                    _this.setReady();

                    defer.resolve();
                });
            });

            return defer;
        },

        /**
         * executes after data has actually been loaded
         */
        afterLoad: function() {
            //placeholder method
        },

        /* ==========================
         * Validation
         * ==========================
         */

        /**
         * Validates data.
         * Interface for the validation function implemented by a model
         * @returns Promise or nothing
         */
        validate: function() {
            //placeholder for validate function
        },

        /* ==========================
         * Event binding methods
         * ==========================
         */

        /**
         * Binds function to an event in this model
         * @param {String} name name of event
         * @param {Function} func function to be executed
         */
        on: function(name, func) {
            if (this._debugEvents && this._debugEvents !== "trigger") {
                if (_.isPlainObject(name)) {
                    for (var i in name) {
                        console.log("Model", this._id, "> bind:", i);
                    }
                } else if (_.isArray(name)) {
                    for (var i in name) {
                        console.log("Model", this._id, "> bind:", name[i]);
                    }
                } else {
                    console.log("Model", this._id, "> bind:", name);
                }
            }
            this._events.on(name, func);
        },

        /**
         * Triggers an event from this model
         * @param {String} name name of event
         * @param val Optional values to be sent to callback function
         */
        trigger: function(name, val) {
            if (this._debugEvents && this._debugEvents !== "bind") {
                console.log("============================================")
                if (_.isArray(name)) {
                    for (var i in name) {
                        console.log("Model", this._id, "> triggered:", name[i]);
                    }
                } else {
                    console.log("Model", this._id, "> triggered:", name);
                }
                console.log('\n')
                console.info(utils.formatStacktrace(utils.stacktrace()));
                console.log("____________________________________________")
            }
            this._events.trigger(this, name, val);
        },

        /**
         * Triggers an event from this model only once
         * @param {String} name name of event
         * @param val Optional values to be sent to callback function
         */
        triggerOnce: function(name, val) {
            if (this._debugEvents && this._debugEvents !== "bind") {
                console.log("============================================")
                if (_.isArray(name)) {
                    for (var i in name) {
                        console.log("Model", this._id, "> triggered once:", name[i]);
                    }
                } else {
                    console.log("Model", this._id, "> triggered once:", name);
                }
                console.log('\n')
                console.info(utils.formatStacktrace(utils.stacktrace()));
                console.log("____________________________________________")
            }
            this._events.triggerOnce(this, name, val);
        },

        /**
         * Triggers an event from this model and all parent events
         * @param {String} name name of event
         * @param val Optional values to be sent to callback function
         */
        triggerAll: function(name, val) {
            if (this._debugEvents && this._debugEvents !== "bind") {
                console.log("============================================")
                if (_.isArray(name)) {
                    for (var i in name) {
                        console.log("Model", this._id, "> triggered all:", name[i]);
                    }
                } else {
                    console.log("Model", this._id, "> triggered all:", name);
                }
                console.log('\n')
                console.info(utils.formatStacktrace(utils.stacktrace()));
                console.log("____________________________________________")
            }
            this._events.triggerAll(this, name, val);
        },

        /**
         * Prevents all events from being triggered or unlock them
         * @param {Boolean} value Freeze events
         * @param {Boolean} all Freeze events globally
         * @param {Array} exception array with event exceptions
         */
        freezeEvents: function(value, all, exceptions) {
            if (all) {
                if (value) this._events.freezeAll(exceptions);
                else this._events.unfreezeAll();
            } else {
                if (value) this._events.freeze(exceptions);
                else this._events.unfreeze();
            }
        },

        /* ===============================
         * Hooking model to external data
         * ===============================
         */

        /**
         * Hooks all hookable submodels to data
         */
        setHooks: function() {
            if (this.isHook()) {

                //what should this hook to?
                this.dimensions = this._getHookTo();
                this.hookModel();
            }

            //hook submodels
            var submodels = this.getSubmodels();
            for (var i in submodels) {
                submodels[i].setHooks();
            }
        },

        /**
         * Hooks this model to data, entities and time
         * @param {Object} h Object containing the hooks
         */
        hookModel: function() {

            this._dataManager = new DataManager();

            // get data and language model references
            // assuming all models will need data and language support
            this._dataModel = this._getClosestModel("data");
            this._languageModel = this._getClosestModel("language");

            //check what we want to hook this model to
            for (var i = 0; i < this.dimensions.length; i++) {
                var name = this.dimensions[i];
                //hook with the closest prefix to this model
                this._hooks[name] = this._getClosestModel(name);
            }

            //this is a hook, therefore it needs to reload when date changes
            var _this = this;
            this.on("change", function() {
                _this.load();
            });
        },

        /**
         * is this model hooked to data?
         */
        isHook: function() {
            return (this.use) ? true : false;
        },

        /**
         * gets a certain hook reference
         * @returns {Object} defined hook or undefined
         */
        getHook: function(hook) {
            return this._hooks[hook];
        },

        /**
         * Learn what this model should hook to
         * @returns {Array} dimensions array
         */
        _getHookTo: function() {
            if (_.isArray(this.dimensions) && !_.rest(this.dimensions, _.isString).length) {
                return this.dimensions;
            } else if (this._parent) {
                return this._parent._getHookTo();
            } else {

                console.error('ERROR: dimensions not found.\n You must specify the objects this hook will use under the dimensions attribute in the state.\n Example:\n dimensions: ["entities", "time"]');

                //DEPRECATED: returning default hooks
                //return ["entities", "time"]; //default
            }
        },

        /**
         * gets all sub values for a certain hook
         * only hooks have the "hook" attribute.
         * @param {String} type specific type to lookup
         * @returns {Array} all unique values with specific hook use
         */
        getHookValues: function(type) {
            var values = [];
            if (this.use && this.use === type) {
                //add if it has "hook" and it's a string
                var val = this.value; //e.g. this.value = "lex"
                if (val && _.isString(val)) {
                    values.push(val);
                }
            }
            //repeat for each submodel
            var submodels = this.getSubmodels();
            for (var i in submodels) {
                values = _.union(values, submodels[i].getHookValues(type));
            }
            //now we have an array with all values in a type of hook for hooks.
            return values;
        },

        /**
         * gets all sub values for indicators in this model
         * @returns {Array} all unique values of indicator hooks
         */
        getIndicators: function() {
            return this.getHookValues("indicator");
        },

        /**
         * gets all sub values for indicators in this model
         * @returns {Array} all unique values of property hooks
         */
        getProperties: function() {
            return this.getHookValues("property");
        },

        /**
         * gets all hook dimensions
         * @returns {Array} all unique dimensions
         */
        _getAllDimensions: function() {
            var dimensions = [];
            for (var i in this._hooks) {
                var dim = this._hooks[i].getDimension();
                if (dim) dimensions.push(dim);
            };
            return dimensions;
        },

        /**
         * gets all hook filters
         * @returns {Object} filters
         */
        _getAllFilters: function() {
            var filters = {};
            for (var i in this._hooks) {
                filters = _.extend(filters, this._hooks[i].getFilter());
            };
            return filters;
        },

        /**
         * gets number of hooks
         * @returns {Number} number of hooks
         */
        _numberHooks: function() {
            var n = 0;
            for (var i in this._hooks) n++;
            return n;
        },

        /**
         * gets the value specified by this hook
         * @param {Object} filter Reference to the row. e.g: {geo: "swe", time: "1999", ... }
         * @returns hooked value
         */

        getValue: function(filter) {
            //extract id from original filter
            var id = _.pick(filter, this._getAllDimensions());
            return this.mapValue(this._getHookedValue(id));
        },

        /**
         * gets multiple values from the hook
         * @param {Object} filter Reference to the row. e.g: {geo: "swe", time: "1999", ... }
         * @returns an array of values
         */

        getValues: function(filter) {
            //extract id from original filter
            var id = _.pick(filter, this._getAllDimensions());
            return this._getHookedValues(id);
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
         * gets the items associated with this hook with values
         * @param value Original value
         * @returns hooked value
         */
        getItems: function(filter) {
            if (this.isHook() && this._dataModel) {

                //all dimensions except time (continuous)
                var dimensions = _.without(this._getAllDimensions(), "time");

                return _.map(this.getUnique(dimensions), function(item) {
                    // Forcefully write the time to item
                    // TODO: Clean this hack
                    if (filter && filter['time']) {
                        item['time'] = filter['time'];
                    }
                    return item;
                })

                return values;
            } else {
                return [];
            }
        },

        /**
         * Gets the dimension of this model if it has one
         * @returns {String|Boolean} dimension
         */
        getDimension: function() {
            return false; //defaults to no dimension
        },

        /**
         * Gets the filter for this model if it has one
         * @returns {Object} filters
         */
        getFilter: function() {
            return {}; //defaults to no filter
        },


        /**
         * gets query that this model/hook needs to get data
         * @returns {Array} query
         */
        getQuery: function() {
            //only perform query in these two uses
            var needs_query = ["property", "indicator"];
            //if it's not a hook, property or indicator, no query is necessary
            if (!this.isHook() || needs_query.indexOf(this.use) === -1) {
                return [];
            }
            //error if there's nothing to hook to
            else if (this._numberHooks() < 0) {
                console.error("Error:", this._id, "can't find any dimension");
                return [];
            }
            //else, its a hook (indicator or property) and it needs to query
            else {

                var dimensions = this._getAllDimensions(),
                    select = _.union(dimensions, [this.value]),
                    filters = this._getAllFilters();

                //return query
                return [{
                    "from": "data",
                    "select": select,
                    "where": filters
                }];
            }
        },

        /**
         * Gets the domain for this hook
         * @returns {Array} domain
         */
        getDomain: function() {

            if (!this.isHook()) {
                return;
            }

            var domain,
                scale = this.scale || "linear";
            switch (this.use) {
                case "indicator":
                    var limits = this.getLimits(this.value);
                    domain = [limits.min, limits.max];
                    break;
                case "property":
                    domain = this.getUnique(this.value);
                    break;
                case "value":
                default:
                    domain = [this.value];
                    break;
            }

            return d3.scale[scale]().domain(domain);
        },

        /**
         * Gets limits
         * @param {String} attr parameter
         * @returns {Object} limits (min and max)
         */
        //TODO: improve way limits are checked
        getLimits: function(attr) {

            if (!this.isHook()) {
                return;
            }

            if (!attr) {
                attr = 'time'; //fallback in case no attr is provided
            }
            var limits = {
                    min: 0,
                    max: 0
                },
                filtered = _.map(this._items, function(d) {
                    //TODO: Move this up to readers ?
                    return (attr !== "time") ? parseFloat(d[attr]) : new Date(d[attr].toString());
                });
            if (filtered.length > 0) {
                limits.min = _.min(filtered);
                limits.max = _.max(filtered);
            }
            return limits;
        },

        /**
         * Gets unique values in a column
         * @param {String} attr parameter
         * @returns {Array} unique values
         */
        getUnique: function(attr) {

            if (!this.isHook()) return;

            if (!attr) attr = 'time'; //fallback in case no attr is provided

            //cache optimization
            var uniq_id = JSON.stringify(attr),
                uniq;
            if (this._unique[uniq_id]) {
                return this._unique[uniq_id];
            }

            //if not in cache, compute
            //if it's an array, it will return a list of unique combinations.
            if (_.isArray(attr)) {
                var values = _.map(this._items, function(d) {
                    return _.pick(d, attr);
                });
                //TODO: Move this up to readers ?
                if (_.indexOf(attr, "time") !== -1) {
                    for (var i = 0; i < values.length; i++) {
                        values[i]['time'] = new Date(values[i]['time']);
                    };
                }
                uniq = _.unique(values, function(n) {
                    return JSON.stringify(n);
                });
            }
            //if it's a string, it will return a list of values
            else {
                var values = _.map(this._items, function(d) {
                    //TODO: Move this up to readers ?
                    return (attr !== "time") ? d[attr] : new Date(d[attr]);
                });
                uniq = _.unique(values);
            }

            this._unique[uniq_id] = uniq;
            return uniq;
        },

        /**
         * gets the value of the hook point
         * @param {Object} filter Id the row. e.g: {geo: "swe", time: "1999"}
         * @returns hooked value
         */
        _getHookedValue: function(filter) {

            if (!this.isHook()) {
                console.warn("_getHookedValue method needs the model to be hooked to data.");
                return;
            }

            var value;

            if (this.use === "value") {
                value = this.value;
            } else if (_.has(this._hooks, this.use)) {
                value = this.getHook(this.use)[this.value];
            } else {
                value = this._interpolateValue(this._items, filter, this.use);
            }

            return value;
        },

        /**
         * gets the values of the hook point
         * @param {Object} filter Id the row. e.g: {geo: "swe", time: "1999"}
         * @returns an array of hooked values
         */
        _getHookedValues: function(filter) {
            var _this = this;

            if (!this.isHook()) {
                console.warn("_getHookedValue method needs the model to be hooked to data.");
                return;
            }

            var values;

            if (this.use === "value") {
                values = [this.value];
            } else if (_.has(this._hooks, this.use)) {
                //TODO: this might be wrong. i didn't fully understand what it does :)          
                values = [this.getHook(this.use)[this.value]];
            } else {
                // if a specific time is requested -- return values up to this time
                if (filter.time != null) {
                    // save time into variable
                    var time = new Date(filter.time);
                    // filter.time will be removed during interpolation
                    var lastValue = this._interpolateValue(this._items, filter, this.use);
                    // return values up to the requested time point, append an interpolated value as the last one
                    values = _.filter(this._items, filter)
                        .filter(function(d) {
                            return d.time <= time
                        })
                        .map(function(d) {
                            return d[_this.value]
                        })
                        .concat(lastValue);
                } else {
                    // if time not requested -- return just all values
                    values = _.filter(this._items, filter)
                        .map(function(d) {
                            return d[_this.value]
                        });
                }
            }


            return values;
        },

        /**
         * gets filtered dataset with fewer keys
         */
        _getFilteredItems: function(filter) {
            var filterId = JSON.stringify(filter);
            //cache optimization
            var filter_id = JSON.stringify(filter);
            if (this._filtered[filter_id]) {
                return this._filtered[filter_id];
            }
            return this._filtered[filter_id] = _.filter(this._items, filter);
        },


        /**
         * interpolates the specific value if missing
         * @param {Object} filter Id the row. e.g: {geo: "swe", time: "1999"}
         * filter SHOULD contain time property
         * @returns interpolated value
         */
        _interpolateValue: function(items, filter, hook) {
            if (items == null || this._items.length == 0) {
                console.warn("_interpolateValue returning NULL because items array is empty");
                return null;
            }

            // fetch time from filter object and remove it from there
            var time = new Date(filter.time);
            delete filter.time;

            // filter items so that we only have a dataset for certain keys, like "geo"
            var items = this._getFilteredItems(filter);

            // return constant for the hook of "values"
            if (hook == "value") return items[0][this.value];

            // search where the desired value should fall between the known points
            var indexNext = d3.bisectLeft(items.map(function(d) {
                return d.time
            }), time);

            // zero-order interpolation for the hook of properties
            if (hook == "property" && indexNext == 0) return items[0][this.value];
            if (hook == "property") return items[indexNext - 1][this.value];

            // the rest is for the continuous measurements

            // check if the desired value is out of range. 0-order extrapolation
            if (indexNext == 0) return items[0][this.value];
            if (indexNext == items.length) return items[items.length - 1][this.value];

            // perform a simple linear interpolation
            var fraction =
                (time - items[indexNext - 1].time) / (items[indexNext].time - items[indexNext - 1].time);
            var value = +items[indexNext - 1][this.value] + (items[indexNext][this.value] - items[indexNext - 1][this.value]) * fraction;

            // cast to time object if we are interpolating time
            if (_.isDate(items[0][this.value])) value = new Date(value);


            return value;
        },

        /**
         * gets closest prefix model moving up the model tree
         * @param {String} prefix
         * @returns {Object} submodel
         */
        _getClosestModel: function(name) {
            var model = this._findSubmodel(name);
            if (model) {
                return model;
            } else if (this._parent) {
                return this._parent._getClosestModel(name);
            }
        },

        /**
         * find submodel with name that starts with prefix
         * @param {String} prefix
         * @returns {Object} submodel or false if nothing is found
         */
        _findSubmodel: function(name) {
            for (var i in this._data) {
                //found submodel
                if (i == name && _.isObject(this._data[i])) {
                    return this._data[i];
                }
            }
        }

    });

    /**
     * //todo: remove from global scope
     * get base Model Class;
     */
    function _getBaseModelClass() {
        return model;
    }

    return model;

});