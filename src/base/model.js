define([
    'underscore',
    'base/utils',
    'base/class',
    'base/intervals',
    'base/events'
], function(_, utils, Class, Intervals, Events) {

    var model = Class.extend({

        //receives values and, optionally, external intervals and events
        init: function(values, intervals, events) {
            this._id = _.uniqueId("m"); //model unique id
            this._data = {};
            this.intervals = (this.intervals || intervals) || new Intervals();
            this.events = events || new Events();

            if (values) {
                this.set(values, true);
            }
        },

        /*
         * Getters and Setters
         */

        //get accepts multiple levels. e.g: get("model.object.property")
        get: function(attr) {
            //optimize for common cases
            if (!attr) return this._data;
            else if (attr.indexOf('.') === -1) return this._data[attr];
            //search deeper levels
            var attrs = attr.split('.'),
                current = this;
            while (attrs.length) {
                var curr_attr = attrs.shift();
                if (typeof current.get === 'function') {
                    current = current.get(curr_attr);
                } else {
                    current = current[curr_attr];
                }
            }
            return current;
        },

        // set an attribute for the model, or an entire object
        // accepts multiple levels. e.g: set("model.object.property", 3)
        set: function(attr, val, silent, block_validation) {

            var events = [];
            if (typeof attr !== 'object') {
                //if its a string, check for multiple levels
                if (attr.indexOf('.') === -1) {
                    this._data[attr] = _.clone(val);
                    events.push("change:" + attr);
                } else {
                    //todo: improve recursion
                    var attrs = attr.split('.'),
                        current = this.get(attrs.shift());
                    while (attrs.length) {
                        if (typeof current.set === 'function') {
                            current.set(attrs, val);
                        }
                        else if (attrs.length === 1){
                            current[attrs.shift()] = _.clone(val);
                        }
                        else {
                            current = current[attrs.shift()];
                        }
                    }
                }
            } else {
                block_validation = silent;
                silent = val;
                for (var att in attr) {
                    var val = attr[att];
                    this._data[att] = _.clone(val);
                    events.push("change:" + att);
                }
            }
            events.push("change");

            //if we don't block validation, validate
            if (!block_validation) this.validate(silent);
            //trigger change if not silent
            if (!silent) this.events.trigger(events, this._data);
        },

        reset: function(values, silent) {
            this.events.unbindAll();
            this.intervals.clearAllIntervals();
            this._data = {};
            this.set(values, silent);
        },

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

        /*
         * Model loading method
         */

        load: function() {
            // placeholder for load method
        },

        /*
         * Validation methods
         */

        validate: function() {
            // placeholder for validate function
        },

        /*
         * Event methods
         */

        on: function(name, func) {
            this.events.bind(name, func);
        },

        trigger: function(name, val) {
            this.events.trigger(name, val);
        }

    });

    return model;

});