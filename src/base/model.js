define([
    'jquery',
    'lodash',
    'base/utils',
    'base/class',
    'base/intervals',
    'base/events'
], function($, _, utils, Class, Intervals, Events) {

    var model = Class.extend({

        /**
         * Initializes the model.
         * @param {Object} values The initial values of this model
         * @param intervals A parent intervals handler (from tool)
         * @param {Object} bind Initial events to bind
         */
        init: function(values, intervals, bind) {
            this._id = _.uniqueId("m"); //model unique id
            this._data = {};
            this._intervals = (this._intervals || intervals) || new Intervals();
            //each model has its own event handling
            this._events = new Events();

            //bind initial events
            for (var evt in bind) {
                if (typeof bind[evt] === 'function') {
                    this.on(evt, bind[evt]);
                }
            }
            //initial values
            if (values) {
                this.set(values, true);
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
            if (!attr) return this._data;
            return this._data[attr];
        },

        /**
         * Sets an attribute or multiple for this model
         * @param attr property name
         * @param val property value (object or value)
         * @param {boolean} silent Prevents events from being fired
         * @param {boolean} block_validation prevents model validation
         * @returns defer defer that will be resolved when set is done
         */
        set: function(attr, val, silent, block_validation) {

            var defer = $.Deferred(),
                promises = [],
                events = [];

            //expect object as default
            if (!_.isPlainObject(attr)) {
                var obj = {};
                obj[attr] = val;
                return this.set(obj, silent, block_validation);
            }

            //correct format
            block_validation = silent;
            silent = val;
            for (var a in attr) {
                var vals = attr[a];
                //if it's an object, set or create submodel
                if (_.isPlainObject(vals)) {
                    if (this._data[a] && utils.isModel(this._data[a])) {
                        promise = this._data[a].set(vals, silent, block_validation);
                    }
                    //submodel doesnt exist, create it
                    else {
                        promise = this._initSubmodel(a, vals);
                    }
                }
                //otherwise, just set value :)
                else {
                    this._data[a] = vals;
                    promise = true;
                    events.push("change:" + a);
                }
                promises.push(promise);
            }

            //after all is done
            var _this = this;
            $.when.apply(null, promises).then(function() {
                //bind magic getters and setters
                _this._bindSettersGetters();
                //if we don't block validation, validate
                if (!block_validation) _this.validate(silent);
                //trigger change if not silent
                if (!silent) _this.triggerAll(events, _this.getObject());
                //ready is always triggered, even when silent
                _this.trigger("ready", _this.getObject());
                defer.resolve();
            });

            return defer;
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
                module = 'models/' + name,
                defer = $.Deferred(),
                _this = this;

            //special model
            if (require.defined(module)) {
                require([module], function(model) {
                    _this._instantiateSubmodel(attr, val, model, defer);
                });
                //regular model
            } else {
                var model = Class.extend(_this);
                _this._instantiateSubmodel(attr, val, model, defer);
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
            this._data[name] = new model(values, this._intervals, {
                'change': function(evt, vals) {
                    evt = evt.replace('change', 'change:' + name);
                    _this.triggerAll(evt, _this.getObject());
                },
                'ready': function() {
                    defer.resolve();
                }
            });
        },

        /**
         * Generate getter for a certain attribute
         * @param prop name of attribute
         * @returns {function} getter function
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
         * @returns {function} setter function
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
         * Resets this model
         * @param values new values
         * @param {boolean} prevent events from being fired
         * @returns defer defer that will be resolved when reset is done
         */
        reset: function(values, silent) {
            this.clear();
            return this.set(values, silent);
        },

        /**
         * Clears this model, submodels, data and events
         */
        clear: function() {
            var submodels = this.get();
            for (var i in submodels) {
                var submodel = submodels[i];
                if (submodel.clear) {
                    submodel.clear();
                }
            }
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

        /* ==========================
         * Model loading method
         * ==========================
         */

        /**
         * Loads data.
         * Interface for the load function implemented by a model
         */
        load: function() {
            return true; // by default it just returns true
        },

        /* ==========================
         * Validation
         * ==========================
         */

        /**
         * Validates data.
         * Interface for the validation function implemented by a model
         */
        validate: function() {
            // placeholder for validate function
        },

        /* ==========================
         * Event binding methods
         * ==========================
         */

        /**
         * Binds function to an event in this model
         * @param {string} name name of event
         * @param {function} func function to be executed
         */
        on: function(name, func) {
            this._events.bind(name, func);
        },

        /**
         * Triggers an event from this model
         * @param {string} name name of event
         * @param val Optional values to be sent to callback function
         */
        trigger: function(name, val) {
            this._events.trigger(name, val);
        },

        /**
         * Triggers an event from this model and all parent events
         * @param {string} name name of event
         * @param val Optional values to be sent to callback function
         */
        triggerAll: function(name, val) {
            this._events.triggerAll(name, val);
        }

    });

    return model;

});