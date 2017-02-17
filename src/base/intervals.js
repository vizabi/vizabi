import Class from "base/class";

const Intervals = Class.extend({

  /**
   * Initializes intervals
   */
  init() {
    this.intervals = {};
  },

  /**
   * Sets an interval
   * @param {String} name name of interval
   * @param {Function} func function to be executed
   * @param {Number} duration duration in milliseconds
   */
  setInterval(name, func, duration) {
    this.clearInterval(name);
    this.intervals[name] = setInterval(func, duration);
  },

  /**
   * Clears an interval
   * @param {String} name name of interval to be removed
   */
  clearInterval(name) {
    return name ? clearInterval(this.intervals[name]) : this.clearAllIntervals();
  },

  /**
   * Clears all intervals
   */
  clearAllIntervals() {
    for (const i in this.intervals) {
      this.clearInterval(i);
    }
  }
});

export default Intervals;
