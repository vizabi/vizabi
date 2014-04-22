define([], function() {
    var eventsManagerSingleton = {    
        events: {},

        instances: [],

        // Global scope bind
        bind: function(name, func) {
            bind(this, name, func);
        },

        // Global scope unbind
        unbind: function(name, func) {
            unbind(this, name, func);
        },

        // Global scope unbind all
        unbindAll: function() {
            this.events = {};
        },

        // Global scope trigger
        trigger: function(name, args) {
            trigger(this, name, args);

            // Global event triggers event on all instances
            for (var j = 0; j < this.instances.length; j++) {
                var instance = this.instances[j];
                instance.trigger(name, args);
            }
        },

        // Creates and returns an instance of the events Manager.
        instance: function() {
            var instance = {
                // this instance's events
                events: {},

                // Instance level binding
                bind: function(name, func) {
                    bind(this, name, func);
                },

                // Instance level unbinding
                unbind: function(name, func) {
                    unbind(this, name, func);
                },

                // Instance level unbind all
                unbindAll: function() {
                    this.events = {};
                },

                // Instance level triggering
                trigger: function(name, args) {
                    trigger(this, name, args);
                }
            };

            register(this, instance);
            
            return instance;
        }
    };

    // Registers an instance as child of another instance.
    function register(parentInstance, childInstance) {
        parentInstance.instances.push(childInstance);
    }

    // Adds an event to an instance
    //
    // @instance - events manager instance's object ('this')
    // @event - name of the event
    // @func - function to be triggered
    function addEvent(instance, event, func) {
        if (!instance) return;

        if (!instance.events[event]) {
            instance.events[event] = [];
        }

        if (typeof func === 'function') {
            instance.events[event].push(func);
        }
    }

    // Removes a binded function from the list of triggerable functions.
    // This is useful if you want to remove a particular function from the list
    // of triggerable functions. You can remove all by omitting the func
    // (third) argument. Note that the function deletion occurs by reference
    //
    // @instance - events manager instance's object
    // @event - name of the event
    // @func - function to be deleted
    function removeFunction(instance, event, func) {
        if (typeof event === 'string') {
            if (instance.events[event]) {
                if (typeof func === 'function') {
                    var evts = instance.events[event];
                    while (evts.indexOf(func) !== -1) {
                        evts.splice(evts.indexOf(func), 1);
                    }
                } else {
                    instance.events[event] = [];
                }
            }
        }
    }

    // Binds a function to an event
    //
    // @instance - events manager instance's object
    // @eventArray - event/array of events to be binded
    // @func - function to be triggered
    function bind(instance, eventArray, func) {
        if (typeof eventArray === 'string') {
            addEvent(instance, eventArray, func);
        } else if ((Array.isArray && Array.isArray(eventArray)) ||
            Object.prototype.toString.call(eventArray) === '[object Array]') {
            for (var i = 0; i < eventArray.length; i++) {
                if (typeof eventArray[i] === 'string') {
                    addEvent(instance, eventArray[i], func);
                }
            }
        }
    }

    // Unbinds a function from the list of triggerable functions by an event.
    // You can pass one event or an array of events to be unbinded.
    //
    // @instance - events manager instance's object
    // @eventArray - event/array of events to be unbinded
    // @func - function to be removed
    function unbind(instance, eventArray, func) {
        if (typeof eventArray === 'string') {
            removeFunction(instance, eventArray, func);
        } else if ((Array.isArray && Array.isArray(eventArray)) ||
            Object.prototype.toString.call(eventArray) === '[object Array]') {
            for (var i = 0; i < eventArray.length; i++) {
                removeFunction(instance, eventArray[i], func);
            }
        }
    }

    // Triggers a function 
    //
    // @instance - events manager instance's object
    // @event - event to be triggered
    // @args - arguments which are passed to the triggered function
    function trigger(instance, event, args) {
        if (typeof event !== 'string' || !instance.events[event]) return;

        args = Array.prototype.slice.call(arguments).slice(2);

        for (var i = 0; i < instance.events[event].length; i++) {
            var func = instance.events[event][i];
            func(args);
        }
    }

    return eventsManagerSingleton;
});
