define([
    "lodash",
    "base/class"
], function(_, Class) {

    var _freezeAllEvents = false,
        _frozenEventInstances = [],
        _freezeAllExceptions = {};

    var Events = Class.extend({

        /**
         * Initializes the event class
         */
        init: function() {
            this._id = _.uniqueId("e");
            this._events = {};
            //events should not be triggered twice simultaneously,
            //therefore, we keep them in a buffer for 1 execution loop
            this._buffer = [];

            //keep track of events to be triggered once
            this._frameWindow = 10;
            this._once = [];

            //freezing events
            this._freeze = false;
            this._freezer = [];
            this._freezeExceptions = {};
        },

        /**
         * Alias to bind (@see: bind)
         * @param {String|Array} name name of event or array with names
         * @param {Function} func function to be linked with event
         */
        on: function(name, func) {
            this.bind(name, func);
        },

        /**
         * Binds a callback function to an event
         * @param {String|Array} name name of event or array with names
         * @param {Function} func function to be linked with event
         */
        bind: function(name, func) {

            //bind multiple at a time
            if (_.isArray(name)) {
                for (var i = 0; i < name.length; i++) {
                    this.bind(name[i], func);
                };
                return;
            }

            //multiple at a time with plain object format
            if (_.isPlainObject(name)) {
                for (var i in name) {
                    this.bind(i, name[i]);
                }
                return;
            }

            if (!_.isArray(this._events[name])) {
                this._events[name] = [];
            }
            if (_.isFunction(func)) {
                this._events[name].push(func);
            } else {
                console.log("Can't bind event '" + name + "'. It must be a function:");
                console.log(func);
            }
        },

        /**
         * Unbinds all events associated with a name or a specific one
         * @param {String|Array} name name of event or array with names
         * @param {Function} func function to be removed (if provided)
         */
        unbind: function(name, func) {

            //unbind multiple at a time
            if (_.isArray(name)) {
                for (var i = 0; i < name.length; i++) {
                    this.unbind(name[i], func);
                };
                return;
            }

            if (_.isFunction(func)) {
                this._events[name] = _.without(this._events[name], func);
            } else {
                this._events[name] = [];
            }
        },

        /**
         * Unbinds all events
         */
        unbindAll: function() {
            this._events = {};
        },

        /**
         * Triggers an event, adding it to the buffer
         * @param {String|Array} name name of event or array with names
         * @param args Optional arguments (values to be passed)
         */
        trigger: function(context, name, args, original) {

            if (_.isArray(name)) {
                for (var i = 0, size = name.length; i < size; i++) {
                    this.trigger(context, name[i], args);
                }
            } else {
                if (_.isUndefined(this._events[name])) return;
                for (var i = 0; i < this._events[name].length; i++) {
                    var f = this._events[name][i];
                    //if not in buffer, add and execute
                    var _this = this;
                    var execute = function() {
                        _this._executeFunction(context, f, name, original, args);
                    };

                    //TODO: improve readability of freezer code
                    //only execute if not frozen and exception doesnt exist
                    if (this._freeze || _freezeAllEvents) {

                        //if exception exists for freezing, execute
                        if ((_freezeAllEvents && !_.isUndefined(_freezeAllExceptions[name])) 
                            || (!_freezeAllEvents && this._freeze && !_.isUndefined(this._freezeExceptions[name]))) {
                            execute();
                        }
                        //otherwise, freeze it
                        else {
                            this._freezer.push(execute);
                            if (_freezeAllEvents && !_frozenEventInstances[this._id]) {
                                this.freeze();
                                _frozenEventInstances[this._id] = this;
                            }
                        }
                    } else {
                        execute();
                    }
                }
            }
        },

        /**
         * Triggers an and all parent events
         * @param {String|Array} name name of event or array with names
         * @param args Optional arguments (values to be passed)
         */
        triggerAll: function(context, name, args) {

            if (_.isArray(name)) {
                for (var i = 0, size = name.length; i < size; i++) {
                    this.triggerAll(context, name[i], args);
                }
            } else {
                var original = name,
                    parts = name.split(":");
                while (parts.length) {
                    this.trigger(context, name, args, original);
                    parts.pop();
                    name = parts.join(":");
                }
            }
        },

        /**
         * Triggers an and all parent events
         * @param {String|Array} name name of event or array with names
         * @param args Optional arguments (values to be passed)
         */
        triggerOnce: function(context, name, args) {

            if (_.isArray(name)) {
                for (var i = 0, size = name.length; i < size; i++) {
                    this.triggerOnce(context, name[i], args);
                }
            } else if (this._once.indexOf(name) === -1) {
                //now we can trigger
                this._once.push(name);
                this.trigger(context, name, args);

                var _this = this;
                _.delay(function() {
                    _this._once = _.without(_this._once, name); //allow
                }, this._frameWindow);

            }
        },

        /**
         * Prevents all events from being triggered, buffering them
         */
        freeze: function(exceptions) {
            this._freeze = true;
            if (!exceptions) return;
            for (var i = 0; i < exceptions.length; i++) {
                this._freezeExceptions[exceptions[i]] = true;
            }
        },

        /**
         * Prevents all events from all instances from being triggered
         */
        freezeAll: function(exceptions) {
            _freezeAllEvents = true;
            if (!exceptions) return;
            for (var i = 0; i < exceptions.length; i++) {
                _freezeAllExceptions[exceptions[i]] = true;
            }
        },

        /**
         * triggers all frozen events
         */
        unfreeze: function() {
            this._freeze = false;
            this._freezeExceptions = {};
            //execute old frozen events
            for (var i = 0; i < this._freezer.length; i++) {
                var execute = this._freezer.shift();
                execute();
            }
        },

        /**
         * triggers all frozen events form all instances
         */
        unfreezeAll: function() {
            _freezeAllEvents = false;
            _freezeAllExceptions = {};
            //unfreeze all instances
            for (var i in _frozenEventInstances) {
                var instance = _frozenEventInstances[i];
                instance.unfreeze();
                delete _frozenEventInstances[i];
            }
        },

        /**
         * Checks whether an event is scheduled to be triggered already
         * @param {Function} func function to be checked
         * returns {Boolean}
         */
        _inBuffer: function(func) {
            return this._buffer.indexOf(func) !== -1;
        },

        /**
         * Adds an event to the internal buffer
         * @param {Function} func function to be executed
         */
        _addToBuffer: function(func) {
            this._buffer.push(func);
        },

        /**
         * Removes an event from the internal buffer
         * @param {Function} func function to be removed
         */
        _removeFromBuffer: function(func) {
            var index = this._buffer.indexOf(func);
            if (index > -1) {
                this._buffer.splice(index, 1);
            }
        },

        /**
         * Executes function, making sure we only execute once per buffer time
         * @param {Function} func function to be executed
         * @param {String} name name of event that triggered this
         * @param {String} original original name of event that triggered this
         * @param {Array} args Arguments
         */
        _executeFunction: function(context, func, name, original, args) {

            //execute it if it's not in the buffer
            if (_.isFunction(func) && !this._inBuffer(func)) {
                this._addToBuffer(func);
                var _this = this;
                _.defer(function() {
                    //remove it from buffer to allow new execution
                    _this._removeFromBuffer(func);

                    console.timeStamp("Vizabi Event: " + name + " - " + original);

                    if (_.isUndefined(args)) {
                        func.apply(context, [(original || name)]);
                    } else {
                        func.apply(context, [(original || name), args]);
                    }
                });
            }
            //log error in case it's not even a function
            else if (!_.isFunction(func)) {
                console.log("Can't execute event '" + name + ". The following must be a function: ");
                console.log(func);
            }
        }

    });

    return Events;
});