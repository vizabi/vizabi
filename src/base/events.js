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
                    if (_.isFunction(f) && !this._inBuffer(name)) {
                        this._addToBuffer(name);
                        var _this = this;
                        _.defer(function() {
                            _this._removeFromBuffer(name);
                            if (_.isUndefined(args)) {
                                f.apply(_this, [(original || name)]);
                            } else {
                                f.apply(_this, [(original || name), args]);
                            }
                        });
                    }
                    //log error in case it's not even a function
                    else if (!_.isFunction(f)) {
                        console.log("Can't execute event '" + name + ". The following must be a function: ");
                        console.log(func);
                    }
                }
            }
        },

        /**
         * Checks whether an event is scheduled to be triggered already
         * @param {String} name name of event
         * returns {Boolean}
         */
        _inBuffer: function(name) {
            return this._buffer.indexOf(name) !== -1;
        },

        /**
         * Adds an event to the internal buffer
         * @param {String} name name of event
         */
        _addToBuffer: function(name) {
            this._buffer.push(name);
        },

        /**
         * Removes an event from the internal buffer
         * @param {String} name name of event
         */
        _removeFromBuffer: function(name) {
            var index = this._buffer.indexOf(name);
            if (index > -1) {
                this._buffer.splice(index, 1);
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

    });

    return Events;
});