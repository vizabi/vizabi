define([
    "lodash",
    "base/class"
], function(_, Class) {

    var Events = Class.extend({

        /**
         * Initializes the event class
         */
        init: function() {
            this._events = {};
            //events should not be triggered twice simultaneously,
            //therefore, we keep them in a buffer for 1 execution loop
            this._buffer = [];

            //keep track of events to be triggered once
            this._frameWindow = 10;
            this._once = [];
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
                for(var i in name) {
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
        trigger: function(name, args, original) {
            if (_.isArray(name)) {
                for (var i = 0, size = name.length; i < size; i++) {
                    this.trigger(name[i], args);
                }
            } else {
                if (_.isUndefined(this._events[name])) return;
                for (var i = 0; i < this._events[name].length; i++) {
                    var f = this._events[name][i];
                    //if not in buffer, add and execute
                    this._executeFunction(f, name, original, args);
                }
            }
        },

        /**
         * Triggers an and all parent events
         * @param {String|Array} name name of event or array with names
         * @param args Optional arguments (values to be passed)
         */
        triggerAll: function(name, args) {

            if (_.isArray(name)) {
                for (var i = 0, size = name.length; i < size; i++) {
                    this.triggerAll(name[i], args);
                }
            } else {
                var original = name,
                    parts = name.split(":");
                while (parts.length) {
                    this.trigger(name, args, original);
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
        triggerOnce: function(name, args) {

            if (_.isArray(name)) {
                for (var i = 0, size = name.length; i < size; i++) {
                    this.triggerOnce(name[i], args);
                }
            } else if(this._once.indexOf(name) === -1) {
                //now we can trigger
                this._once.push(name);
                this.trigger(name, args);

                var _this = this;
                _.delay(function() {
                    _this._once = _.without(_this._once, name); //allow
                }, this._frameWindow);

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
        _executeFunction: function(func, name, original, args) {

            //execute it if it's not in the buffer
            if (_.isFunction(func) && !this._inBuffer(func)) {
                this._addToBuffer(func);
                var _this = this;
                _.defer(function() {
                    //remove it from buffer to allow new execution
                    _this._removeFromBuffer(func);
                    if (_.isUndefined(args)) {
                        func.apply(_this, [(original || name)]);
                    } else {
                        func.apply(_this, [(original || name), args]);
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