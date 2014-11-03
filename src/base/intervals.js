/*
 * Controls intervals in a scoped manner
 */

define([
    "base/class"
], function(Class) {

    var Intervals = Class.extend({

        /**
         * Initializes intervals
         */
        init: function() {
            this.intervals = {};
        },

        /**
         * Sets an interval
         * @param {String} name name of interval
         * @param {Function} func function to be executed
         * @param {Number} duration duration in milliseconds
         */
        setInterval: function(name, func, duration) {
            this.clearInterval(name);
            this.intervals[name] = setInterval(func, duration);
        },

        /**
         * Clears an interval
         * @param {String} name name of interval to be removed
         */
        clearInterval: function(name) {
            clearInterval(this.intervals[name]);
        },

        /**
         * Clears all intervals
         */
        clearAllIntervals: function() {
            for (var i in this.intervals) {
                this.clearInterval(i);
            }
        }

    });

    return Intervals;
});