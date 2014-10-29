/*
 * Controls intervals in a scoped manner
 */

define([
    "base/class"
], function(Class) {

    var Intervals = Class.extend({

        init: function() {
            this.intervals = {};
        },
        setInterval: function(name, func, duration) {
            this.clearInterval(name);
            this.intervals[name] = setInterval(func, duration);
        },
        clearInterval: function(name) {
            clearInterval(this.intervals[name]);
        },
        clearAllIntervals: function() {
            for (var i in this.intervals) {
                this.clearInterval(i);
            }
        }

    });

    return Intervals;
});