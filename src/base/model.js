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

        get: function(attr) {
            return (attr) ? this._data[attr] : this._data;
        },

        //set an attribute for the model, or an entire object
        set: function(attr, val, silent, block_validation) {

            if (typeof attr !== 'object') {
                this._data[attr] = (typeof val === 'object') ? _.clone(val) : val;
                if (!silent) this.events.trigger("change:"+attr, this._data);
            } else {
                block_validation = silent;
                silent = val;
                for (var att in attr) {
                    var val = attr[att];
                    this._data[att] = (typeof val === 'object') ? _.clone(val) : val;
                    if (!silent) this.events.trigger("change:"+att, this._data);
                }
            }
            //trigger change if not silent
            if (!silent) this.events.trigger("change", this._data);
            //if we don't block validation, validate
            if (!block_validation) this.validate(silent);
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
                if(this._data[i]
                   && typeof this._data[i].getObject === 'function') {
                    obj[i] = this._data[i].getObject();
                }
                else {
                    obj[i] = this._data[i];
                }
            }
            return obj;
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
        },

        /*
         * Other methods
         */

        //model is able to interpolate values
        interpolate: function(value1, value2, fraction) {
            return value1 + ((value2 - value1) * fraction);
        },

        interpolateSet: function(set, step) {
            var result = [];
            for (var i = 0, size = set.length; i < (size - 1); i++) {
                var j = i + 1;
                for (var k = 0; k < 1; k += step) {
                    result.push(this.interpolate(set[i], set[j], k));
                }
            }
            result.push(set[set.length - 1]); //add the last element
            return result;
        }

    });

    return model;

});