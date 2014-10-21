define([
    'base/class',
    'base/events'
], function(Class, Events) {

    var model = Class.extend({

        init: function(values) {
            this._data = {};
            this.events = new Events();
            if (values) {
                this.set(values, true);
            }
        },

        get: function(attr) {
            return (attr) ? this._data[attr] : this._data;
        },

        //set an attribute for the model, or an entire object
        set: function(attr, value, silent, block_validation) {

            console.log("setting model");

            if (typeof attr !== 'object') {
                this._data[attr] = _.clone(value);
            } else {
                block_validation = silent;
                silent = value;
                for (var att in attr) {
                    this._data[att] = _.clone(attr[att]);
                }
            }
            //trigger change if not silent
            if (!silent) this.events.trigger("change");
            //if we don't block validation, validate
            if (!block_validation) this.validate(silent);
        },

        reset: function(values, silent) {
            this.data = {};
            this.set(values, silent);
        },

        on: function(name, func) {
            this.events.bind(name, func);
        },

        trigger: function(name, val) {
            this.events.trigger(name, val);
        },

        load: function(query, language, events) {
            var _this = this,
                defer = $.Deferred(),
                promise = this._dataManager.load(query, language, events);

            //when request is completed, set it
            $.when(promise).done(function() {
                _this.set(_this._dataManager.get());
                defer.resolve();
            });

            return defer;
        },

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
        },

        validate: function() {
            // placeholder for validate function
        }

    });

    return model;

});