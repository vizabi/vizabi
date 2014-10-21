define([
    "underscore",
    "base/class"
], function(_, Class) {

    var Events = Class.extend({

        init: function() {
            this.events = {};
        },

        //alias to bind
        on: function(name, func) {
            this.bind(name, func);
        },

        //bind a function to a certain event
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
                throw_msg("Can't bind '" + func + "' to event '" + name + "'. It must be a function!");
            }
        },
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
        unbindAll: function() {
            this.events = {};
        },

        //trigger event and all parents. E.g: change:language and change
        trigger: function(name, args) {

            if (_.isUndefined(this.events[name])) return;
            for (var i = 0, size = this.events[name].length; i < size; i++) {
                var f = this.events[name][i];
                if (_.isFunction(f)) {
                    if (_.isUndefined(args)) {
                        f(name);
                    } else {
                        f(name, args);
                    }
                } else {
                    throw_msg("Can't execute '" + func + "' on event '" + name + ". It must be a function!");
                }
            };

        }
    });

    return Events;
});