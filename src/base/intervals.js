import utils from './utils';
import Class from './class';

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
    return name ? clearInterval(this.intervals[name]) : this.clearAllIntervals();
  },

  /**
   * Clears all intervals
   */
  clearAllIntervals: function() {
    for(var i in this.intervals) {
      this.clearInterval(i);
    }
  }
});

export default Intervals;