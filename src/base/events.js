define(['jquery', 'underscore'], function($, _) {
    
    var Events = {
        events: {}, //holds each event, identified by name

        //bind a function to a certain event
        bind: function(name, func) {

            //bind multiple at a time
            if(_.isArray(name)) {
                for (var i = 0; i < name.length; i++) {
                    this.bind(name[i], func);
                };
                return;
            }

            if(!_.isArray(this.events[name])) {
                this.events[name] = [];
            }
            if(_.isFunction(func)) {
                this.events[name].push(func);
            } else {
                throw_msg("Can't bind '"+func+"' to event '"+name+"'. It must be a function!");
            }
        },
        unbind: function(name, func) {

            //unbind multiple at a time
            if(_.isArray(name)) {
                for (var i = 0; i < name.length; i++) {
                    this.unbind(name[i], func);
                };
                return;
            }

            if(_.isFunction(func)) {
                this.events[name] = _.without(this.events[name], func);
            } else {
                this.events[name] = [];
            }
        },
        unbindAll: function() {
            this.events = {};
        },
        //trigger a certain event, executing each function
        trigger: function(name, args) {

            if($.type(this.events[name]) === 'undefined') return;
            for (var i = 0, size=this.events[name].length; i < size; i++) {
                var f = this.events[name][i];
                if($.isFunction(f)) {
                    if($.type(args) === "undefined") {
                        f();
                    } else {
                        f(args);
                    }
                } else {
                    throw_msg("Can't execute '"+func+"' on event '"+name+"'. It must be a function!");
                }
            };
        }
    }

    return Events;
});
