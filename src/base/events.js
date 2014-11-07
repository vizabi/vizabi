define([
    "lodash",
    "base/class"
], function(_, Class) {

    var Events = Class.extend({

        /**
         * Initializes the event class
         */
        init: function() {
            this.events = {};
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

            if (!_.isArray(this.events[name])) {
                this.events[name] = [];
            }
            if (_.isFunction(func)) {
                this.events[name].push(func);
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
                this.events[name] = _.without(this.events[name], func);
            } else {
                this.events[name] = [];
            }
        },

        /**
         * Unbinds all events
         */
        unbindAll: function() {
            this.events = {};
        },

        /**
         * Triggers an event
         * @param {String|Array} name name of event or array with names
         * @param args Optional arguments (values to be passed)
         */
        trigger: function(name, args, original) {
            if (_.isArray(name)) {
                for (var i = 0, size = name.length; i < size; i++) {
                    this.trigger(name[i], args);
                }
            } else {
                if (_.isUndefined(this.events[name])) return;
                for (var i = 0; i < this.events[name].length; i++) {
                    var f = this.events[name][i];
                    if (_.isFunction(f)) {
                        if (_.isUndefined(args)) {
                            f((original || name));
                        } else {
                            f((original || name), args);
                        }
                    } else {
                        console.log("Can't execute event '" + name + ". The following must be a function: ");
                        console.log(func);
                    }
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

    });

    return Events;
});
