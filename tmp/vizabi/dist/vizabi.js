/* VIZABI - http://www.gapminder.org - 2015-09-29 */

/*!
 * VIZABI MAIN
 */
(function () {
  'use strict';
  var root = this;
  var previous = root.Vizabi;

  var Vizabi = function (tool, placeholder, options) {
    return startTool(tool, placeholder, options);
  };
  //stores reference to each tool on the page
  Vizabi._instances = {};

  //stores global variables accessible by any tool or component
  Vizabi._globals = {};

  function startTool(name, placeholder, options) {
    var Tool = Vizabi.Tool.get(name);
    if (Tool) {
      var t = new Tool(placeholder, options);
      Vizabi._instances[t._id] = t;
      return t;
    } else {
      Vizabi.utils.error('Tool "' + name + '" was not found.');
    }
  }

  //TODO: clear all objects and intervals as well
  //garbage collection
  Vizabi.clearInstances = function (id) {
    if (id) {
      delete Vizabi._instances[id];
    } else {
      for(var i in Vizabi._instances) {
        Vizabi._instances[i].clear();
      }
      Vizabi._instances = {};
    }
  };

  /*
   * throws a warning if the required variable is not defined
   * returns false if the required variable is not defined
   * returns true if the required variable is defined
   * @param variable
   * @returns {Boolean}
   */
  Vizabi._require = function (variable) {
    if (typeof root[variable] === 'undefined') {
      Vizabi.utils.warn(variable + ' is required and could not be found.');
      return false;
    }
    return true;
  };

  //if AMD define
  if (typeof define === 'function' && define.amd) {
    define(function () {
      return Vizabi;
    });
  } else if (typeof module === 'object' && module.exports) {
    module.exports = Vizabi;
  }

  root.Vizabi = Vizabi;

}.call(this));

/*!
 * VIZABI UTILS
 * Util functions
 */
(function () {

  'use strict';

  var root = this;
  var Vizabi = root.Vizabi;

  Vizabi.utils = {

    /*
     * returns unique id with optional prefix
     * @param {String} prefix
     * @returns {String} id
     */
    uniqueId: function () {
      var id = 0;
      return function (p) {
        return p ? p + (id += 1) : id += 1;
      };
    }(),

    /*
     * checks whether obj is a DOM element
     * @param {Object} obj
     * @returns {Boolean}
     * from underscore: https://github.com/jashkenas/underscore/blob/master/underscore.js
     */
    isElement: function (obj) {
      return !!(obj && obj.nodeType === 1);
    },

    /*
     * checks whether obj is an Array
     * @param {Object} obj
     * @returns {Boolean}
     * from underscore: https://github.com/jashkenas/underscore/blob/master/underscore.js
     */
    isArray: Array.isArray || function (obj) {
      return toString.call(obj) === '[object Array]';
    },

    /*
     * checks whether obj is an object
     * @param {Object} obj
     * @returns {Boolean}
     * from underscore: https://github.com/jashkenas/underscore/blob/master/underscore.js
     */
    isObject: function (obj) {
      var type = typeof obj;
      return type === 'object' && !!obj;
    },

    /*
     * checks whether arg is a date
     * @param {Object} arg
     * @returns {Boolean}
     */
    isDate: function (arg) {
      return arg instanceof Date;
    },

    /*
     * checks whether arg is a string
     * @param {Object} arg
     * @returns {Boolean}
     */
    isString: function (arg) {
      return typeof arg === 'string';
    },

    /*
     * checks whether arg is a NaN
     * @param {*} arg
     * @returns {Boolean}
     * from lodash: https://github.com/lodash/lodash/blob/master/lodash.js
     */
    isNaN: function (arg) {
      // A `NaN` primitive is the only number that is not equal to itself
      return this.isNumber(arg) && arg !== +arg;
    },

    /*
     * checks whether arg is a number. NaN is a number too
     * @param {*} arg
     * @returns {Boolean}
     * from lodash: https://github.com/lodash/lodash/blob/master/lodash.js
     * dependencies are resolved and included here
     */
    isNumber: function (arg) {
      return typeof arg === 'number' || !!arg && typeof arg === 'object' && Object.prototype.toString.call(arg) === '[object Number]';
    },

    /*
     * checks whether obj is a plain object {}
     * @param {Object} obj
     * @returns {Boolean}
     */
    isPlainObject: function (obj) {
      return obj !== null && Object.prototype.toString.call(obj) === '[object Object]';
    },
      
    getViewportPosition: function(element) {
        var xPosition = 0;
        var yPosition = 0;

        while(element) {
            xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
            yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
            element = element.offsetParent;
        }

        return { x: xPosition, y: yPosition };
    },
      
    findScrollableAncestor: function(node) {
        var no = d3.select(node).node();
        var scrollable = ["scroll", "auto"];
        
        while(no && no.tagName !== "HTML" && scrollable.indexOf(d3.select(no).style("overflow")) == -1 ) {
            no = no.parentNode;
        }

        return no;
    },

    roundStep: function (number, step) {
      return Math.round(number / step) * step;
    },

    /*
     * transforms a string into a validated fload value
     * @param {string} string to be transformed
     */
    strToFloat: function (string) {
      return +string.replace(/[^\d.-]/g, '');
    },

    /*
     * loops through an object or array
     * @param {Object|Array} obj object or array
     * @param {Function} callback callback function
     * @param {Object} ctx context object
     */
    forEach: function (obj, callback, ctx) {
      if (!obj) {
        return;
      }
      var i;
      if (this.isArray(obj)) {
        for (i = 0; i < obj.length; i += 1) {
          if (callback.apply(ctx, [
              obj[i],
              i
            ]) === false) {
            break;
          }
        }
      } else {
        var keys = Object.keys(obj);
        var size = keys.length;
        for (i = 0; i < size; i += 1) {
          if (callback.apply(ctx, [
              obj[keys[i]],
              keys[i]
            ]) === false) {
            break;
          }
        }
      }
    },

    /*
     * extends an object
     * @param {Object} destination object
     * @returns {Object} extented object
     */
    extend: function (dest) {
      //objects to overwrite dest are next arguments
      var objs = Array.prototype.slice.call(arguments, 1);
      var _this = this;
      //loop through each obj and each argument, left to right
      this.forEach(objs, function (obj, i) {
        _this.forEach(obj, function (value, k) {
          if (obj.hasOwnProperty(k)) {
            dest[k] = value;
          }
        });
      });
      return dest;
    },

    /*
     * merges objects instead of replacing
     * @param {Object} destination object
     * @returns {Object} merged object
     */
    merge: function (dest) {
      //objects to overwrite dest are next arguments
      var objs = Array.prototype.slice.call(arguments, 1);
      var _this = this;
      //loop through each obj and each argument, left to right
      this.forEach(objs, function (obj, i) {
        _this.forEach(obj, function (value, k) {
          if (obj.hasOwnProperty(k)) {
            if (dest.hasOwnProperty(k)) {
              if (!_this.isArray(dest[k])) {
                dest[k] = [dest[k]];
              }
              dest[k].push(value);
            } else {
              dest[k] = value;
            }
          }
        });
      });
      return dest;
    },

    /*
     * clones an object (shallow copy)
     * @param {Object} src original object
     * @param {Array} arr filter keys
     * @returns {Object} cloned object
     */
    clone: function (src, arr, exclude) {
      if (this.isArray(src)) {
        return src.slice(0);
      }
      var clone = {};
      this.forEach(src, function (value, k) {
        if ((arr && arr.indexOf(k) === -1)
          || (exclude && exclude.indexOf(k) !== -1)) {
          return;
        }
        if (src.hasOwnProperty(k)) {
          clone[k] = value;
        }
      });
      return clone;
    },

    /*
     * deep clones an object (deep copy)
     * @param {Object} src original object
     * @returns {Object} cloned object
     */
    deepClone: function (src) {
      var clone = {};
      var _this = this;
      this.forEach(src, function (value, k) {
        if (src.hasOwnProperty(k)) {
          if (_this.isObject(value) || _this.isArray(value)) {
            clone[k] = _this.deepClone(value);
          } else {
            clone[k] = value;
          }
        }
      });
      return clone;
    },

    /*
     * Prints message to timestamp
     * @param {Arr} arr
     * @param {Object} el
     */
    without: function (arr, el) {
      var idx = arr.indexOf(el);
      if (idx !== -1) {
        arr.splice(idx, 1);
      }
      return arr;
    },

    /*
     * unique items in an array
     * @param {Array} arr original array
     * @param {Function} func optional evaluation function
     * @returns {Array} unique items
     * Based on:
     * http://stackoverflow.com/questions/1960473/unique-values-in-an-array
     */
    unique: function (arr, func) {
      var u = {};
      var a = [];
      if (!func) {
        func = function (d) {
          return d;
        };
      }
      for (var i = 0, l = arr.length; i < l; i += 1) {
        var key = func(arr[i]);
        if (u.hasOwnProperty(key)) {
          continue;
        }
        a.push(arr[i]);
        u[key] = 1;
      }
      return a;
    },

    /*
     * unique items in an array keeping the last item
     * @param {Array} arr original array
     * @param {Function} func optional evaluation function
     * @returns {Array} unique items
     * Based on the previous method
     */
    uniqueLast: function (arr, func) {
      var u = {};
      var a = [];
      if (!func) {
        func = function (d) {
          return d;
        };
      }
      for (var i = 0, l = arr.length; i < l; i += 1) {
        var key = func(arr[i]);
        if (u.hasOwnProperty(key)) {
          a.splice(u[key], 1); //remove old item from array
        }
        a.push(arr[i]);
        u[key] = a.length - 1;
      }
      return a;
    },

    /*
     * returns first value that passes the test
     * @param {Array} arr original collection
     * @returns {Function} func test function
     */
    find: function (arr, func) {
      var found;
      this.forEach(arr, function (i) {
        if (func(i)) {
          found = i;
          return false; //break
        }
      });
      return found;
    },

    /*
     * filters an array based on object properties
     * @param {Array} arr original array
     * @returns {Object} filter properties to use as filter
     */
    filter: function (arr, filter) {
      var index = -1;
      var length = arr.length;
      var resIndex = -1;
      var result = [];
      var keys = Object.keys(filter);
      var s_keys = keys.length;
      var i;
      var f;
      while ((index += 1) < length) {
        var value = arr[index];
        var match = true;
        for (i = 0; i < s_keys; i += 1) {
          f = keys[i];
          if (!value.hasOwnProperty(f) || value[f] !== filter[f]) {
            match = false;
            break;
          }
        }
        if (match) {
          result[resIndex += 1] = value;
        }
      }
      return result;
    },

    /*
     * filters an array based on object properties.
     * Properties may be arrays determining possible values
     * @param {Array} arr original array
     * @returns {Object} filter properties to use as filter
     */
    filterAny: function (arr, filter, wildcard) {
      var index = -1;
      var length = arr.length;
      var resIndex = -1;
      var result = [];
      var keys = Object.keys(filter);
      var s_keys = keys.length;
      var i, f;
      while ((index += 1) < length) {
        var value = arr[index];
        //normalize to array
        var match = true;
        for (i = 0; i < s_keys; i += 1) {
          f = keys[i];
          if (!value.hasOwnProperty(f) || !this.matchAny(value[f], filter[f], wildcard)) {
            match = false;
            break;
          }
        }
        if (match) {
          result[resIndex += 1] = value;
        }
      }
      return result;
    },

    /*
     * checks if the value matches the comparison value or any in array
     * compare may be an determining possible values
     * @param value original value
     * @param compare value or array
     * @param {String} wildc wildcard value
     * @returns {Boolean} try
     */
    matchAny: function (values, compare, wildc) {
      //normalize value
      if (!this.isArray(values)) values = [values];
      if (!wildc) wildc = "*"; //star by default
      var match = false;
      for (var e = 0; e < values.length; e++) {
        var value = values[e];

        if (!this.isArray(compare) && value == compare) {
          match = true;
          break;
        } else if (this.isArray(compare)) {
          var found = -1;
          for (var i = 0; i < compare.length; i++) {
            var c = compare[i];
            if (!this.isArray(c) && (c == value || c === wildc)) {
              found = i;
              break;
            } else if (this.isArray(c)) { //range
              var min = c[0];
              var max = c[1] || min;
              if (value >= min && value <= max) {
                found = i;
                break;
              }
            }
          }
          if (found !== -1) {
            match = true;
            break;
          }
        }
      }
      return match;
    },

    /*
     * maps all rows according to the formatters
     * @param {Array} original original dataset
     * @param {Object} formatters formatters object
     * @returns {Boolean} try
     */
    mapRows: function (original, formatters) {

      var _this = this;

      function mapRow(value, fmt) {
        if (!_this.isArray(value)) {
          return fmt(value);
        }
        else {
          var res = [];
          for (var i = 0; i < value.length; i++) {
            res[i] = mapRow(value[i], fmt);
          }
          return res;
        }
      }

      var columns = Object.keys(formatters);
      var columns_s = columns.length;
      original = original.map(function (row) {
        for (var i = 0; i < columns_s; i++) {
          var col = columns[i], new_val;
          try {
            new_val = mapRow(row[col], formatters[col]);
          }
          catch (e) {
            new_val = row[col];
          }
          row[col] = new_val;
        }
        return row;
      });

      return original;
    },

    /*
     * Converts radius to area, simple math
     * @param {Number} radius
     * @returns {Number} area
     */
    radiusToArea: function (r) {
      return r * r * Math.PI;
    },

    /*
     * Converts area to radius, simple math
     * @param {Number} area
     * @returns {Number} radius
     */
    areaToRadius: function (a) {
      return Math.sqrt(a / Math.PI);
    },

    /*
     * Prints message to timestamp
     * @param {String} message
     */
    timeStamp: function (message) {
      if (root.console && typeof root.console.timeStamp === 'function') {
        root.console.timeStamp(message);
      }
    },

    /*
     * Prints warning
     * @param {String} message
     */
    warn: function (message) {
      if (root.console && typeof root.console.warn === 'function') {
        root.console.warn(message);
      }
    },

    /*
     * Prints message for group
     * @param {String} message
     */
    groupCollapsed: function (message) {
      if (root.console && typeof root.console.groupCollapsed === 'function') {
        root.console.groupCollapsed(message);
      }
    },

    /*
     * Prints end of group
     * @param {String} message
     */
    groupEnd: function () {
      if (root.console && typeof root.console.groupEnd === 'function') {
        root.console.groupEnd();
      }
    },

    /*
     * Prints error
     * @param {String} message
     */
    error: function (message1, message2) {
      if (root.console && typeof root.console.error === 'function') {
        root.console.error(message1, message2);
      }
    },

    /*
     * Count the number of decimal numbers
     * @param {Number} number
     */
    countDecimals: function (number) {
      if (Math.floor(number.valueOf()) === number.valueOf()) {
        return 0;
      }
      return number.toString().split('.')[1].length || 0;
    },

    /*
     * Adds class to DOM element
     * @param {Element} el
     * @param {String} className
     */
    addClass: function (el, className) {
      if (el.classList) {
        el.classList.add(className);
      } else {
        //IE<10
        el.className += ' ' + className;
      }
    },

    /*
     * Remove class from DOM element
     * @param {Element} el
     * @param {String} className
     */
    removeClass: function (el, className) {
      if (el.classList) {
        el.classList.remove(className);
      } else {
        //IE<10
        el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
      }
    },

    /*
     * Adds or removes class depending on value
     * @param {Element} el
     * @param {String} className
     * @param {Boolean} value
     */
    classed: function (el, className, value) {
      if (value === true) {
        this.addClass(el, className);
      } else if (value === false) {
        this.removeClass(el, className);
      } else {
        return this.hasClass(el, className);
      }
    },

    /*
     * Checks whether a DOM element has a class or not
     * @param {Element} el
     * @param {String} className
     * @return {Boolean}
     */
    hasClass: function (el, className) {
      if (el.classList) {
        return el.classList.contains(className);
      } else {
        //IE<10
        return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
      }
    },

    ///*
    // * Throttles a function
    // * @param {Function} func
    // * @param {Number} ms duration
    // */
    //throttle: function () {
    //  var isThrottled = {};
    //  return function (func, ms) {
    //    if (isThrottled[func]) {
    //      return;
    //    }
    //    isThrottled[func] = true;
    //    setTimeout(function () {
    //      isThrottled[func] = false;
    //    }, ms);
    //    func();
    //  };
    //}(),

    /*
     * Throttles a function
     * @param {Function} func
     * @param {Number} ms duration
     */
    throttle: function (func, ms) {

      var isThrottled = false,
        savedArgs,
        savedThis;

      function wrapper() {

        if (isThrottled) {
          savedArgs = arguments;
          savedThis = this;
          return;
        }

        func.apply(this, arguments);

        isThrottled = true;

        setTimeout(function() {
          isThrottled = false;
          if (savedArgs) {
            wrapper.apply(savedThis, savedArgs);
            savedArgs = savedThis = null;
          }
        }, ms);
      }

      return wrapper;
    },

    /*
     * Returns keys of an object as array
     * @param {Object} arg
     * @returns {Array} keys
     */
    keys: function (arg) {
      return Object.keys(arg);
    },

    /*
     * returns the values of an object in an array format
     * @param {Object} obj
     * @return {Array}
     */
    values: function (obj) {
      var arr;
      var keys = Object.keys(obj);
      var size = keys.length;
      for (var i = 0; i < size; i += 1) {
        (arr = arr || []).push(obj[keys[i]]);
      }
      return arr;
    },


    /*
     * Computes the minumum value in an array
     * @param {Array} arr
     */
    arrayMin: function(arr) {
        return arr.reduce(function (p, v) {
            return (p < v ? p : v);
        });
    },

    /*
     * Computes the minumum value in an array
     * @param {Array} arr
     */
    arrayMax: function(arr) {
        return arr.reduce(function (p, v) {
            return (p > v ? p : v);
        });
    },

    /*
     * Computes the mean of an array
     * @param {Array} arr
     */
    arrayMean: function(arr) {
        return this.arraySum(arr)/arr.length;
    },

    /*
     * Computes the sum of an array
     * @param {Array} arr
     */
    arraySum: function(arr) {
        return arr.reduce(function(a, b) { return a + b; });
    },

    /*
     * Computes the median of an array
     * @param {Array} arr
     */
    arrayMedian: function(arr) {
        arr = arr.sort(function(a, b) {return a - b;});
        var middle = Math.floor((arr.length - 1) / 2);
        if (arr.length % 2) {
            return arr[middle];
        } else {
            return (arr[middle] + arr[middle + 1]) / 2;
        }
    },

    /*
     * Returns the last value of array
     * @param {Array} arr
     */
    arrayLast: function(arr) {
        if(!arr.length) return null;
        return arr[arr.length-1];
    },
      
    /*
     * Defers a function
     * @param {Function} func
     */
    defer: function (func) {
      setTimeout(func, 1);
    },

    /*
     * Defers a function
     * @param {Function} func
     */
    delay: function (func, delay) {
      setTimeout(func, delay);
    },

    /*
     * Creates a hashcode for a string or array
     * @param {String|Array} str
     * @return {Number} hashCode
     */
    hashCode: function (str) {
      if (!this.isString(str)) {
        str = JSON.stringify(str);
      }
      var hash = 0;
      var size = str.length;
      var c;
      if (size === 0) {
        return hash;
      }
      for (var i = 0; i < size; i += 1) {
        c = str.charCodeAt(i);
        hash = (hash << 5) - hash + c;
        hash = hash & hash; // Convert to 32bit integer
      }
      return hash.toString();
    },

    /*
     * Performs an ajax request
     * @param {Object} options
     * @param {String} className
     * @return {Boolean}
     */
    ajax: function (options) {
      var request = new XMLHttpRequest();
      request.open(options.method, options.url, true);
      if (options.method === 'POST' && !options.json) {
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
      }
      else if (options.method === 'POST' && options.json) {
        request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
      }
      request.onload = function () {
        if (request.status >= 200 && request.status < 400) {
          // Success!
          var data = options.json ? JSON.parse(request.responseText) : request.responseText;
          if (options.success) {
            options.success(data);
          }
        } else {
          if (options.error) {
            options.error();
          }
        }
      };
      request.onerror = function () {
        if (options.error) {
          options.error();
        }
      };
      request.send(options.data);
    },

    /*
     * Performs a GET http request
     */
    get: function (url, pars, success, error, json) {
      pars = pars || [];
      this.forEach(pars, function (value, key) {
        pars.push(key + '=' + value);
      });
      url = pars.length ? url + '?' + pars.join('&') : url;
      this.ajax({
        method: 'GET',
        url: url,
        success: success,
        error: error,
        json: json
      });
    },

    /*
     * Performs a POST http request
     */
    post: function (url, pars, success, error, json) {
      this.ajax({
        method: 'POST',
        url: url,
        success: success,
        error: error,
        json: json,
        data: pars
      });
    },

    /**
     * Make function memoized
     * @param {Function} fn
     * @returns {Function}
     */
    memoize: function (fn) {
      return function () {
        var args = Array.prototype.slice.call(arguments);
        var hash = '';
        var i = args.length;
        var currentArg = null;

        while (i--) {
          currentArg = args[i];
          hash += (currentArg === Object(currentArg)) ? JSON.stringify(currentArg) : currentArg;
          fn.memoize || (fn.memoize = {});
        }

        return (hash in fn.memoize) ? fn.memoize[hash] : fn.memoize[hash] = fn.apply(this, args);
      };
    },

    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    debounce: function (func, wait, immediate) {
      var timeout;
      return function() {
        var context = this, args = arguments;
        var later = function() {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
      }
    },

    isTouchDevice: function () {
      return !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
    }
  };
}.call(this));

/*!
 * VIZABI PROMISES
 * Util functions
 */
(function () {
  'use strict';
  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;
  Vizabi.Promise = Promise;
  function Promise(resolver) {
    if (!(this instanceof Promise)) {
      return new Promise(resolver);
    }
    this.status = 'pending';
    this.value;
    this.reason;
    // then may be called multiple times on the same promise
    this._resolves = [];
    this._rejects = [];
    if (isFn(resolver)) {
      resolver(this.resolve.bind(this), this.reject.bind(this));
    }
    return this;
  }

  Promise.prototype.then = function (resolve, reject) {
    var next = this._next || (this._next = Promise());
    var status = this.status;
    var x;
    if ('pending' === status) {
      isFn(resolve) && this._resolves.push(resolve);
      isFn(reject) && this._rejects.push(reject);
      return next;
    }
    if ('resolved' === status) {
      if (!isFn(resolve)) {
        next.resolve(resolve);
      } else {
        try {
          x = resolve(this.value);
          resolveX(next, x);
        } catch (e) {
          this.reject(e);
        }
      }
      return next;
    }
    if ('rejected' === status) {
      if (!isFn(reject)) {
        next.reject(reject);
      } else {
        try {
          x = reject(this.reason);
          resolveX(next, x);
        } catch (e) {
          this.reject(e);
        }
      }
      return next;
    }
  };
  Promise.prototype.resolve = function (value) {
    if ('rejected' === this.status) {
      throw Error('Illegal call.');
    }
    this.status = 'resolved';
    this.value = value;
    this._resolves.length && fireQ(this);
    return this;
  };
  Promise.prototype.reject = function (reason) {
    if ('resolved' === this.status) {
      throw Error('Illegal call. ' + reason);
    }
    this.status = 'rejected';
    this.reason = reason;
    this._rejects.length && fireQ(this);
    return this;
  };
  // shortcut of promise.then(undefined, reject)
  Promise.prototype.catch = function (reject) {
    return this.then(void 0, reject);
  };
  // return a promise with another promise passing in
  Promise.cast = function (arg) {
    var p = Promise();
    if (arg instanceof Promise) {
      return resolvePromise(p, arg);
    } else {
      return Promise.resolve(arg);
    }
  };
  // return a promise which resolved with arg
  // the arg maybe a thanable object or thanable function or other
  Promise.resolve = function (arg) {
    var p = Promise();
    if (isThenable(arg)) {
      return resolveThen(p, arg);
    } else {
      return p.resolve(arg);
    }
  };
  // accept a promises array,
  // return a promise which will resolsed with all promises's value,
  // if any promise passed rejectd, the returned promise will rejected with the same reason
  Promise.all = function (promises) {
    var len = promises.length;
    var promise = Promise();
    var r = [];
    var pending = 0;
    var locked;
    var test = promises;
    //modified
    utils.forEach(promises, function (p, i) {
      p.then(function (v) {
        r[i] = v;
        if ((pending += 1) === len && !locked) {
          promise.resolve(r);
        }
      }, function (e) {
        locked = true;
        promise.reject(e);
      });
    });
    return promise;
  };
  // accept a promises array,
  // return a promise which will resolsed with the first resolved promise passed,
  // if any promise passed rejectd, the returned promise will rejected with the same reason
  Promise.any = function (promises) {
    var promise = Promise();
    var called;
    //modified
    utils.forEach(promises, function (p, i) {
      p.then(function (v) {
        if (!called) {
          promise.resolve(v);
          called = true;
        }
      }, function (e) {
        called = true;
        promise.reject(e);
      });
    });
    return promise;
  };
  // return a promise which reject with reason
  // reason must be an instance of Error object
  Promise.reject = function (reason) {
    if (!(reason instanceof Error)) {
      throw Error('reason must be an instance of Error');
    }
    var p = Promise();
    p.reject(reason);
    return p;
  };

  function resolveX(promise, x) {
    if (x === promise) {
      promise.reject(new Error('TypeError'));
    }
    if (x instanceof Promise) {
      return resolvePromise(promise, x);
    } else if (isThenable(x)) {
      return resolveThen(promise, x);
    } else {
      return promise.resolve(x);
    }
  }

  function resolvePromise(promise1, promise2) {
    var status = promise2.status;
    if ('pending' === status) {
      promise2.then(promise1.resolve.bind(promise1), promise1.reject.bind(promise1));
    }
    if ('resolved' === status) {
      promise1.resolve(promise2.value);
    }
    if ('rejected' === status) {
      promise1.reject(promise2.reason);
    }
    return promise;
  }

  function resolveThen(promise, thanable) {
    var called;
    var resolve = once(function (x) {
      if (called) {
        return;
      }
      resolveX(promise, x);
      called = true;
    });
    var reject = once(function (r) {
      if (called) {
        return;
      }
      promise.reject(r);
      called = true;
    });
    try {
      thanable.then.call(thanable, resolve, reject);
    } catch (e) {
      if (!called) {
        throw e;
      } else {
        promise.reject(e);
      }
    }
    return promise;
  }

  function fireQ(promise) {
    var status = promise.status;
    var queue = promise['resolved' === status ? '_resolves' : '_rejects'];
    var arg = promise['resolved' === status ? 'value' : 'reason'];
    var fn;
    var x;
    while (fn = queue.shift()) {
      x = fn.call(promise, arg);
      x && resolveX(promise._next, x);
    }
    return promise;
  }

  function noop() {
  }

  function isFn(fn) {
    return 'function' === type(fn);
  }

  function isObj(o) {
    return 'object' === type(o);
  }

  function type(obj) {
    var o = {};
    return o.toString.call(obj).replace(/\[object (\w+)\]/, '$1').toLowerCase();
  }

  function isThenable(obj) {
    return obj && obj.then && isFn(obj.then);
  }

  function once(fn) {
    var called;
    var r;
    return function () {
      if (called) {
        return r;
      }
      called = true;
      return r = fn.apply(this, arguments);
    };
  }

  return Promise;
}.call(this));

/*!
 * VIZABI CLASS
 * Base class
 * Based on Simple JavaScript Inheritance by John Resig
 * Source http://ejohn.org/blog/simple-javascript-inheritance/
 */
(function () {

  'use strict';

  var root = this;
  var Vizabi = root.Vizabi;
  var initializing = false;
  var fnTest = /xyz/.test(function () {
    xyz;
  }) ? /\b_super\b/ : /.*/;

  function extend(name, extensions) {

    //in case there are two args
    extensions = arguments.length === 1 ? name : extensions;
    var _super = this.prototype;
    initializing = true;
    var prototype = new this();
    initializing = false;

    Vizabi.utils.forEach(extensions, function (method, name) {
      if (typeof extensions[name] === 'function' && typeof _super[name] === 'function' && fnTest.test(extensions[name])) {
        prototype[name] = function (name, fn) {
          return function () {
            var tmp = this._super;
            this._super = _super[name];
            var ret = fn.apply(this, arguments);
            this._super = tmp;
            return ret;
          };
        }(name, extensions[name]);
      } else {
        prototype[name] = method;
      }
    });

    function Class() {
      if (!initializing && this.init) {
        this.init.apply(this, arguments);
      }
    }

    // Populate our constructed prototype object
    Class.prototype = prototype;
    Class.prototype.constructor = Class;
    Class.extend = extend;
    Class._collection = {};
    Class.register = function (name, code) {
      if (typeof this._collection[name] !== 'undefined') {
        Vizabi.utils.warn('"' + name + '" is already registered. Overwriting...');
      }
      this._collection[name] = code;
    };

    Class.unregister = function (name) {
      delete this._collection[name];
    };

    Class.getCollection = function () {
      return this._collection;
    };

    //define a method or field in this prototype
    Class.define = function (name, value) {
      this.prototype[name] = value;
    };

    //get an item of the collection from this class
    Class.get = function (name, silent) {
      if (this._collection.hasOwnProperty(name)) {
        return this._collection[name];
      }
      if (!silent) {
        Vizabi.utils.warn('"' + name + '" was not found.');
      }
      return false;
    };
    //register extension by name
    if (arguments.length > 1 && this.register) {
      this.register(name, Class);
    }
    return Class;
  }

  Vizabi.Class = function () {
  };
  Vizabi.Class.extend = extend;
  Vizabi.Helper = Vizabi.Class.extend({});

}.call(this));

/*!
 * VIZABI DATA
 * Manages data
 */
(function () {
  'use strict';

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;
  var Promise = Vizabi.Promise;
  var Data = Vizabi.Class.extend({

    init: function () {
      this._collection = {};
    },

    /**
     * Loads resource from reader or cache
     * @param {Array} query Array with queries to be loaded
     * @param {String} language Language
     * @param {Object} reader Which reader to use - data reader info
     * @param {String} path Where data is located
     */
    load: function (query, language, reader, evts) {
      var _this = this;
      var promise = new Promise();
      var wait = new Promise().resolve();
      var cached = query === true ? true : this.isCached(query, language, reader);
      var loaded = false;
      //if result is cached, dont load anything
      if (!cached) {
        utils.timeStamp('Vizabi Data: Loading Data');
        if (evts && typeof evts.load_start === 'function') {
          evts.load_start();
        }
        wait = new Promise();
        this.loadFromReader(query, language, reader).then(function (queryId) {
          loaded = true;
          cached = queryId;
          wait.resolve();
        });
      }
      wait.then(function () {
        //pass the data forward
        var data = _this._collection[cached].data;
        //not loading anymore
        if (loaded && evts && typeof evts.load_end === 'function') {
          evts.load_end();
        }
        promise.resolve(cached);
      }, function () {
        //not loading anymore
        if (loaded && evts && typeof evts.load_end === 'function') {
          evts.load_end();
        }
        promise.reject('Error loading file...');
      });
      return promise;
    },

    /**
     * Loads resource from reader
     * @param {Array} query Array with queries to be loaded
     * @param {String} lang Language
     * @param {Object} reader Which reader to use. E.g.: "json-file"
     * @param {String} path Where data is located
     */
    loadFromReader: function (query, lang, reader) {
      var _this = this;
      var promise = new Promise();
      var reader_name = reader.reader;
      var queryId = utils.hashCode([
        query,
        lang,
        reader
      ]);
      var readerClass = Vizabi.Reader.get(reader_name);
      var r = new readerClass(reader);
      r.read(query, lang).then(function () {
          //success reading
          var values = r.getData();
          var q = query;

          //make sure all queried is returned
          values = values.map(function (d) {
            for (var i = 0; i < q.select.length; i += 1) {
              var col = q.select[i];
              if (typeof d[col] === 'undefined') {
                d[col] = null;
              }
            }
            return d;
          });

          _this._collection[queryId] = {};
          var col = _this._collection[queryId];
          col.data = values;
          col.filtered = {};
          col.nested = {};
          col.unique = {};
          col.limits = {};
          promise.resolve(queryId);
        }, //error reading
        function (err) {
          promise.reject(err);
        });
      return promise;
    },

    /**
     * get data
     */
    get: function (queryId, what) {
      if (!queryId) {
        return;
      }
      if (!what) {
        what = 'data';
      }
      return this._collection[queryId][what];
    },

    /**
     * checks whether this combination is cached or not
     */
    isCached: function (query, language, reader) {
      //encode in hashCode
      var q = utils.hashCode([
        query,
        language,
        reader
      ]);
      //simply check if we have this in internal data
      if (Object.keys(this._collection).indexOf(q) !== -1) {
        return q;
      }
      return false;
    }
  });

  /**
   * Initializes the reader.
   * @param {Object} reader_info Information about the reader
   */
  var Reader = Vizabi.Class.extend({
    init: function (reader_info) {
      this._name = this._name || reader_info.reader;
      this._data = reader_info.data || [];
      this._basepath = this._basepath || reader_info.path || null;
      this._formatters = reader_info.formatters;

      if (this._formatters) {
        this._data = utils.mapRows(this._data, this._formatters);
      }
    },

    /**
     * Reads from source
     * @param {Array} queries Queries to be performed
     * @param {String} language language
     * @returns a promise that will be resolved when data is read
     */
    read: function (queries, language) {
      return new Promise.resolve();
    },

    /**
     * Gets the data
     * @returns all data
     */
    getData: function () {
      return this._data;
    }
  });
  Vizabi.Reader = Reader;
  Vizabi.Data = Data;
}.call(this));

/*!
 * VIZABI EVENTS
 * Manages Vizabi events
 */
(function () {
  'use strict';
  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;
  var _freezeAllEvents = false;
  var _frozenEventInstances = [];
  var _freezeAllExceptions = {};
  var Events = Vizabi.Class.extend({

    /**
     * Initializes the event class
     */
    init: function () {
      this._id = this._id || utils.uniqueId('e');
      this._events = {};
      //freezing events
      this._freeze = false;
      this._freezer = [];
      this._freezeExceptions = {};
    },

    /**
     * Binds a callback function to an event
     * @param {String|Array} name name of event or array with names
     * @param {Function} func function to be linked with event
     */
    on: function (name, func) {
      var i;
      //bind multiple functions at the same time
      if (utils.isArray(func)) {
        for (i = 0; i < func.length; i += 1) {
          this.on(name, func[i]);
        }
        return;
      }
      //bind multiple at a time
      if (utils.isArray(name)) {
        for (i = 0; i < name.length; i += 1) {
          this.on(name[i], func);
        }
        return;
      }
      //multiple at a time with  object format
      if (utils.isObject(name)) {
        for (i in name) {
          this.on(i, name[i]);
        }
        return;
      }
      this._events[name] = this._events[name] || [];
      if (typeof func === 'function') {
        this._events[name].push(func);
      } else {
        utils.warn('Can\'t bind event \'' + name + '\'. It must be a function.');
      }
    },

    /**
     * Unbinds all events associated with a name or a specific one
     * @param {String|Array} name name of event or array with names
     */
    unbind: function (name) {
      //unbind multiple at a time
      if (utils.isArray(name)) {
        for (var i = 0; i < name.length; i += 1) {
          this.unbind(name[i]);
        }
        return;
      }
      if (this._events.hasOwnProperty(name)) {
        this._events[name] = [];
      }
    },

    /**
     * Unbinds all events
     */
    unbindAll: function () {
      this._events = {};
    },

    /**
     * Triggers an event, adding it to the buffer
     * @param {String|Array} name name of event or array with names
     * @param args Optional arguments (values to be passed)
     */
    trigger: function (name, args, original) {
      var i;
      var size;
      if (utils.isArray(name)) {
        for (i = 0, size = name.length; i < size; i += 1) {
          this.trigger(name[i], args);
        }
      } else {
        if (!this._events.hasOwnProperty(name)) {
          return;
        }
        for (i = 0; i < this._events[name].length; i += 1) {
          var f = this._events[name][i];
          //if not in buffer, add and execute
          var _this = this;
          var execute = function () {
            var msg = 'Vizabi Event: ' + name + ' - ' + original;
            utils.timeStamp(msg);
            f.apply(_this, [
              original || name,
              args
            ]);
          };
          //TODO: improve readability of freezer code
          //only execute if not frozen and exception doesnt exist
          if (this._freeze || _freezeAllEvents) {
            //if exception exists for freezing, execute
            if (_freezeAllEvents && _freezeAllExceptions.hasOwnProperty(name) || !_freezeAllEvents && this._freeze && this._freezeExceptions.hasOwnProperty(name)) {
              execute();
            } //otherwise, freeze it
            else {
              this._freezer.push(execute);
              if (_freezeAllEvents && !_frozenEventInstances[this._id]) {
                this.freeze();
                _frozenEventInstances[this._id] = this;
              }
            }
          } else {
            execute();
          }
        }
      }
    },

    /**
     * Triggers an event and all parent events
     * @param {String|Array} name name of event or array with names
     * @param args Optional arguments (values to be passed)
     */
    triggerAll: function (name, args, original) {
      var to_trigger = [];
      //default to array
      if (!utils.isArray(name)) {
        name = [name];
      }
      var i;
      var size;
      var n;
      for (i = 0, size = name.length; i < size; i += 1) {
        n = name[i];
        var original = n;
        var parts = n.split(':');
        while (parts.length) {
          to_trigger.push([
            n,
            args,
            original
          ]);
          parts.pop();
          n = parts.join(':');
        }
      }
      var once = utils.unique(to_trigger, function (d) {
        return d[0]; //name of the event
      });
      for (i = 0; i < once.length; i += 1) {
        this.trigger.apply(this, once[i]);
      }
    },

    /**
     * Prevents all events from being triggered, buffering them
     */
    freeze: function (exceptions) {
      this._freeze = true;
      if (!exceptions) {
        return;
      }
      if (!utils.isArray(exceptions)) {
        exceptions = [exceptions];
      }
      for (var i = 0; i < exceptions.length; i += 1) {
        this._freezeExceptions[exceptions[i]] = true;
      }
    },

    /**
     * triggers all frozen events
     */
    unfreeze: function () {
      this._freeze = false;
      this._freezeExceptions = {};
      //execute old frozen events
      while (this._freezer.length) {
        var execute = this._freezer.shift();
        execute();
      }
    },

    /**
     * clears all frozen events
     */
    clearFrozen: function () {
      this._freeze = false;
      this._freezeExceptions = {};
      this._freezer = [];
    }
  });

  //generic event functions
  /**
   * freezes all events
   */
  Events.freezeAll = function (exceptions) {
    _freezeAllEvents = true;
    if (!exceptions) {
      return;
    }
    if (!utils.isArray(exceptions)) {
      exceptions = [exceptions];
    }
    utils.forEach(exceptions, function (e) {
      _freezeAllExceptions[e] = true;
    });
  };

  /**
   * triggers all frozen events form all instances
   */
  Events.unfreezeAll = function () {
    _freezeAllEvents = false;
    _freezeAllExceptions = {};
    //unfreeze all instances
    for (var i in _frozenEventInstances) {
      var instance = _frozenEventInstances[i];
      instance.unfreeze();
      delete _frozenEventInstances[i];
    }
  };

  Vizabi.Events = Events;
}.call(this));

/*!
 * VIZABI INTERVALS
 * Manages Vizabi layout profiles and classes
 */
(function () {

  'use strict';

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;
  var Intervals = Vizabi.Class.extend({

    /**
     * Initializes intervals
     */
    init: function () {
      this.intervals = {};
    },

    /**
     * Sets an interval
     * @param {String} name name of interval
     * @param {Function} func function to be executed
     * @param {Number} duration duration in milliseconds
     */
    setInterval: function (name, func, duration) {
      this.clearInterval(name);
      this.intervals[name] = setInterval(func, duration);
    },

    /**
     * Clears an interval
     * @param {String} name name of interval to be removed
     */
    clearInterval: function (name) {
      return name ? clearInterval(this.intervals[name]) : this.clearAllIntervals();
    },

    /**
     * Clears all intervals
     */
    clearAllIntervals: function () {
      for (var i in this.intervals) {
        this.clearInterval(i);
      }
    }
  });

  Vizabi.Intervals = Intervals;

}.call(this));

/*!
 * VIZABI LAYOUT
 * Manages Vizabi layout profiles and classes
 */
(function () {

  'use strict';

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;
  //classes are vzb-portrait, vzb-landscape...
  var class_prefix = 'vzb-';
  var class_portrait = 'vzb-portrait';
  var class_lansdcape = 'vzb-landscape';

  var Layout = Vizabi.Events.extend({

    screen_profiles: {
      small: {
        min_width: 0,
        max_width: 749
      },
      medium: {
        min_width: 750,
        max_width: 969
      },
      large: {
        min_width: 970,
        max_width: Infinity
      }
    },

    /**
     * Initializes the layout manager
     */
    init: function () {
      this._container = null;
      //dom element
      this._curr_profile = null;
      this._prev_size = {};
      //resize when window resizes
      var _this = this;

      this.resizeHandler = this.resizeHandler || resize.bind(this);

      root.addEventListener('resize', this.resizeHandler);
      this._super();
    },

    /**
     * Calculates the size of the newly resized container
     */
    setSize: function () {
      var _this = this;
      var width = this._container.clientWidth;
      var height = this._container.clientHeight;
      if (this._prev_size && this._prev_size.width === width && this._prev_size.height === height) {
        return;
      }

      utils.forEach(this.screen_profiles, function (range, size) {
        //remove class
        utils.removeClass(_this._container, class_prefix + size);
        //find best fit
        if (width >= range.min_width && width <= range.max_width) {
          _this._curr_profile = size;
        }
      });

      //update size class
      utils.addClass(this._container, class_prefix + this._curr_profile);
      //toggle, untoggle classes based on orientation
      if (width < height) {
        utils.addClass(this._container, class_portrait);
        utils.removeClass(this._container, class_lansdcape);
      } else {
        utils.addClass(this._container, class_lansdcape);
        utils.removeClass(this._container, class_portrait);
      }
      this._prev_size.width = width;
      this._prev_size.height = height;
      this.trigger('resize');
    },

    /**
     * Sets the container for this layout
     * @param container DOM element
     */
    setContainer: function (container) {
      this._container = container;
      this.setSize();
    },

    /**
     * Gets the current selected profile
     * @returns {String} name of current profile
     */
    currentProfile: function () {
      return this._curr_profile;
    },

    clear: function() {
      root.removeEventListener('resize', this.resizeHandler);
    }

  });

  function resize() {
    if (this._container) {
      this.setSize();
    }
  }

  Vizabi.Layout = Layout;

}.call(this));

/*!
 * VIZABI MODEL
 * Base Model
 */

(function () {

  'use strict';

  var root = this;
  var Vizabi = root.Vizabi;
  var Promise = Vizabi.Promise;
  var utils = Vizabi.utils;
  var globals = Vizabi._globals;

  var time_formats = {
    "year": "%Y",
    "month": "%b",
    "week": "week %U",
    "day": "%d/%m/%Y",
    "hour": "%d/%m/%Y %H",
    "minute": "%d/%m/%Y %H:%M",
    "second": "%d/%m/%Y %H:%M:%S"
  };

  //names of reserved hook properties
  //warn client if d3 is not defined
  Vizabi._require('d3');
  var _DATAMANAGER = new Vizabi.Data();

  var Model = Vizabi.Events.extend({
    /**
     * Initializes the model.
     * @param {Object} values The initial values of this model
     * @param {Object} parent reference to parent
     * @param {Object} bind Initial events to bind
     * @param {Boolean} freeze block events from being dispatched
     */
    init: function (values, parent, bind, freeze) {
      this._type = this._type || 'model';
      this._id = this._id || utils.uniqueId('m');
      this._data = {};
      //holds attributes of this model
      this._parent = parent;
      this._set = false;
      this._ready = false;
      this._readyOnce = false;
      //has this model ever been ready?
      this._loadedOnce = false;
      this._loading = [];
      //array of processes that are loading
      this._intervals = getIntervals(this);
      //holds the list of dependencies for virtual models
      this._deps = {
        parent: [],
        children: []
      };
      //will the model be hooked to data?
      this._space = {};
      this._spaceDims = {};

      this._dataId = false;
      this._limits = {};
      //stores limit values
      this._super();
      //bind initial events
      if (bind) {
        this.on(bind);
      }
      if (freeze) {
        //do not dispatch events
        this.freeze();
      }
      //initial values
      if (values) {
        this.set(values);
      }
    },

    /* ==========================
     * Getters and Setters
     * ==========================
     */

    /**
     * Gets an attribute from this model or all fields.
     * @param attr Optional attribute
     * @returns attr value or all values if attr is undefined
     */
    get: function (attr) {
      if (!attr) {
        return this._data;
      }
      return this._data[attr];
    },

    /**
     * Sets an attribute or multiple for this model (inspired by Backbone)
     * @param attr property name
     * @param val property value (object or value)
     * @returns defer defer that will be resolved when set is done
     */
    set: function (attr, val, force) {
      var events = [];
      var changes = [];
      var setting = this._setting;
      var _this = this;
      var attrs;
      //expect object as default
      if (!utils.isPlainObject(attr)) {
        (attrs = {})[attr] = val;
      } else {
        attrs = attr;
        force = val;
      }
      //if it's the first time we are setting this, check previous
      if (!setting) {
        this._prevData = utils.clone(this._data);
        this._changedData = {};
      }
      this._setting = true;
      //we are currently setting the model
      //compute each change
      for (var a in attrs) {
        val = attrs[a];
        var curr = this._data[a];
        var prev = this._prevData[a];
        //if its a regular value
        if (!utils.isPlainObject(val) || utils.isArray(val)) {
          //change if it's not the same value
          if (curr !== val || force || JSON.stringify(curr) !== JSON.stringify(val)) {
            var p = typeof curr === 'undefined' ? 'init' : 'change';
            events.push(p + ':' + a);
          }
          if (prev !== val || force || JSON.stringify(prev) !== JSON.stringify(val)) {
            this._changedData[a] = val;
          } else {
            delete this._changedData[a];
          }
          this._data[a] = val;
        } //if it's an object, it's a submodel
        else {
          if (curr && isModel(curr)) {
            events.push('change:' + a);
            this._data[a].set(val, force);
          } //submodel doesnt exist, create it
          else {
            events.push('init:' + a);
            this._data[a] = initSubmodel(a, val, this);
            this._data[a].unfreeze();
          }
        }
      }

      bindSettersGetters(this);
      //for tool model when setting for the first time
      if (this.validate && !setting) {
        this.validate();
      }
      if (!setting || force) {
        //trigger set if not set
        if (!this._set) {
          this._set = true;
          events.push('set');
        } else if (events.length) {
          events.push('change');
        }
        _this._setting = false;
        _this.triggerAll(events, _this.getObject());
        if (!this.isHook()) {
          this.setReady();
        }
      }
    },

    /**
     * Gets the type of this model
     * @returns {String} type of the model
     */
    getType: function () {
      return this._type;
    },
      
    /**
     * Gets the metadata of the hooks
     * @returns {Object} metadata
     */
    getMetadata: function () {
      if (!this.isHook()) return {};
      return (globals.metadata && globals.metadata.indicators && (this.use === 'indicator' || this.use === 'property')) ? 
          globals.metadata.indicators[this.which] : {};
    },

    /**
     * Gets all submodels of the current model
     * @param object [object=false] Should it return an object?
     * @returns {Array} submodels
     */
    getSubmodels: function (object, fn) {
      var submodels = (object) ? {} : [];
      var fn = fn || function() { return true; };
      utils.forEach(this._data, function (s, name) {
        if (s && typeof s._id !== 'undefined' && fn(s)) {
          if(object) {
            submodels[name] = s;
          }
          else {
            submodels.push(s);
          }
        }
      });
      return submodels;
    },

    /**
     * Gets the current model and submodel values as a JS object
     * @returns {Object} All model as JS object
     */
    getObject: function () {
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

    /**
     * Clears this model, submodels, data and events
     */
    clear: function () {
      var submodels = this.getSubmodels();
      for (var i in submodels) {
        submodels[i].clear();
      }
      this._spaceDims = {};
      this.setReady(false);
      this.unbindAll();
      this._intervals.clearAllIntervals();
      this._data = {};
    },

    /**
     * Validates data.
     * Interface for the validation function implemented by a model
     * @returns Promise or nothing
     */
    validate: function () {
    },

    /* ==========================
     * Model loading
     * ==========================
     */

    /**
     * checks whether this model is loading anything
     * @param {String} optional process id (to check only one)
     * @returns {Boolean} is it loading?
     */
    isLoading: function (p_id) {
      if (this.isHook() && (!this._loadedOnce || this._loadCall)) {
        return true;
      }
      if (p_id) {
        return this._loading.indexOf(p_id) !== -1;
      } //if loading something
      else if (this._loading.length > 0) {
        return true;
      } //if not loading anything, check submodels
      else {
        var submodels = this.getSubmodels();
        var i;
        for (i = 0; i < submodels.length; i += 1) {
          if (submodels[i].isLoading()) {
            return true;
          }
        }
        for (i = 0; i < this._deps.children.length; i += 1) {
          var d = this._deps.children[i];
          if (d.isLoading() || !d._ready) {
            return true;
          }
        }
        return false;
      }
    },

    /**
     * specifies that the model is loading data
     * @param {String} id of the loading process
     */
    setLoading: function (p_id) {
      //if this is the first time we're loading anything
      if (!this.isLoading()) {
        this.trigger('load_start');
      }
      //add id to the list of processes that are loading
      this._loading.push(p_id);
    },

    /**
     * specifies that the model is done with loading data
     * @param {String} id of the loading process
     */
    setLoadingDone: function (p_id) {
      this._loading = utils.without(this._loading, p_id);
      this.setReady();
    },

    /**
     * Sets the model as ready or not depending on its loading status
     */
    setReady: function (value) {
      if (value === false) {
        this._ready = false;
        if (this._parent && this._parent.setReady) {
          this._parent.setReady(false);
        }
        return;
      }
      //only ready if nothing is loading at all
      var prev_ready = this._ready;
      this._ready = !this.isLoading() && !this._setting && !this._loadCall;
      if (this._ready && prev_ready !== this._ready) {
        if (!this._readyOnce) {
          this._readyOnce = true;
          this.trigger('readyOnce');
        }
        this.trigger('ready');
      }
    },

    /**
     * loads data (if hook)
     * Hooks loads data, models ask children to load data
     * Basically, this method:
     * loads is theres something to be loaded:
     * does not load if there's nothing to be loaded
     * @param {Object} options (includes splashScreen)
     * @returns defer
     */
    load: function (opts) {

      opts = opts || {};
      var splashScreen = opts.splashScreen || false;

      var _this = this;
      var data_hook = this._dataModel;
      var language_hook = this._languageModel;
      var query = this.getQuery(splashScreen);
      var formatters = this._getAllFormatters();
      var promiseLoad = new Promise();
      var promises = [];
      //useful to check if in the middle of a load call
      this._loadCall = true;

      //load hook
      //if its not a hook, the promise will not be created
      if (this.isHook() && data_hook && query) {
        //hook changes, regardless of actual data loading
        this.trigger('hook_change');
        //get reader info
        var reader = data_hook.getObject();
        reader.formatters = formatters;

        var lang = language_hook ? language_hook.id : 'en';
        var promise = new Promise();
        var evts = {
          'load_start': function () {
            _this.setLoading('_hook_data');
            Vizabi.Events.freezeAll([
              'load_start',
              'resize',
              'dom_ready'
            ]);
          }
        };

        utils.timeStamp('Vizabi Model: Loading Data: ' + _this._id);
        _DATAMANAGER.load(query, lang, reader, evts).then(function (dataId) {
          _this._dataId = dataId;
          utils.timeStamp('Vizabi Model: Data loaded: ' + _this._id);
          _this.afterLoad();
          promise.resolve();
        }, function (err) {
          _this.trigger('load_error', query);
          promise.reject(err);
        });
        promises.push(promise);
      }

      //load submodels as well
      utils.forEach(this.getSubmodels(true), function(sm, name) {
        promises.push(sm.load(opts));
      });

      //when all promises/loading have been done successfully
      //we will consider this done
      var wait = promises.length ? Promise.all(promises) : new Promise.resolve();
      wait.then(function () {

        //only validate if not showing splash screen to avoid fixing the year
        if (_this.validate) {
          _this.validate();
        }
        utils.timeStamp('Vizabi Model: Model loaded: ' + _this._id);
        //end this load call
        _this._loadedOnce = true;

        //we need to defer to make sure all other submodels
        //have a chance to call loading for the second time
        _this._loadCall = false;
        promiseLoad.resolve();
        utils.defer(function() {
          _this.setReady();
        });
      });

      return promiseLoad;
    },

    /**
     * executes after preloading processing is done
     */
    afterPreload: function () {
      var submodels = this.getSubmodels();
      utils.forEach(submodels, function(s) {
        s.afterPreload();
      });
    },

    /**
     * executes after data has actually been loaded
     */
    afterLoad: function () {
      Vizabi.Events.unfreezeAll();
      this.setLoadingDone('_hook_data');
      interpIndexes = {};
    },

    /**
     * removes all external dependency references
     */
    resetDeps: function () {
      this._deps.children = [];
    },

    /**
     * add external dependency ref to this model
     */
    addDep: function (child) {
      this._deps.children.push(child);
      child._deps.parent.push(this);
    },

    /**
     * gets query that this model/hook needs to get data
     * @returns {Array} query
     */
    getQuery: function (splashScreen) {

      var dimensions, filters, select, q;

      //if it's not a hook, no query is necessary
      if (!this.isHook()) return true;
      //error if there's nothing to hook to
      if (Object.keys(this._space).length < 1) {
        utils.error('Error:', this._id, 'can\'t find the space');
        return true;
      }
      dimensions = this._getAllDimensions();
      filters = this._getAllFilters(splashScreen);

      if(this.use !== 'value') dimensions = dimensions.concat([this.which]);
      select = utils.unique(dimensions);

      //return query
      return {
        'select': select,
        'where': filters
      };
    },

    /* ===============================
     * Hooking model to external data
     * ===============================
     */

    /**
     * is this model hooked to data?
     */
    isHook: function () {
      return this.use ? true : false;
    },
    /**
     * Hooks all hookable submodels to data
     */
    setHooks: function () {
      if (this.isHook()) {
        //what should this hook to?
        this.hookModel();
      }
      else {
        //hook submodels
        var submodels = this.getSubmodels();
        utils.forEach(submodels, function (s) {
          s.setHooks();
        });
      }
    },

    /**
     * Hooks this model to data, entities and time
     * @param {Object} h Object containing the hooks
     */
    hookModel: function () {
      var _this = this;
      var spaceRefs = getSpace(this);
      // assuming all models will need data and language support
      this._dataModel = getClosestModel(this, 'data');
      this._languageModel = getClosestModel(this, 'language');
      //check what we want to hook this model to
      utils.forEach(spaceRefs, function (name) {
        //hook with the closest prefix to this model
        _this._space[name] = getClosestModel(_this, name);
        //if hooks change, this should load again
        //TODO: remove hardcoded 'show"
        if (_this._space[name].show) {
          _this._space[name].on('change:show', function (evt) {
              _this.load();
          });
        }
      });
      //this is a hook, therefore it needs to reload when data changes
      this.on('change:which', function (evt) {
        _this.load();
      });
      //this is a hook, therefore it needs to reload when data changes
      this.on('hook_change', function () {
        _this._spaceDims = {};
        _this.setReady(false);
      });
    },

    /**
     * Gets all submodels of the current model that are hooks
     * @param object [object=false] Should it return an object?
     * @returns {Array|Object} hooks array or object
     */
    getSubhooks: function (object) {
      return this.getSubmodels(object, function(s) {
        return s.isHook();
      });
    },

    /**
     * gets all sub values for a certain hook
     * only hooks have the "hook" attribute.
     * @param {String} type specific type to lookup
     * @returns {Array} all unique values with specific hook use
     */
    getHookWhich: function (type) {
      var values = [];
      if (this.use && this.use === type) {
        values.push(this.which);
      }
      //repeat for each submodel
      utils.forEach(this.getSubmodels(), function (s) {
        values = utils.unique(values.concat(s.getHookWhich(type)));
      });
      //now we have an array with all values in a type of hook for hooks.
      return values;
    },

    /**
     * gets all sub values for indicators in this model
     * @returns {Array} all unique values of indicator hooks
     */
    getIndicators: function () {
      return this.getHookWhich('indicator');
    },

    /**
     * gets all sub values for indicators in this model
     * @returns {Array} all unique values of property hooks
     */
    getProperties: function () {
      return this.getHookWhich('property');
    },

    /**
     * Gets the dimension of this model if it has one
     * @returns {String|Boolean} dimension
     */
    getDimension: function () {
      return this.dim || false; //defaults to dim if it exists
    },

    /**
     * Gets the filter for this model if it has one
     * @returns {Object} filters
     */
    getFilter: function () {
      return {}; //defaults to no filter
    },

    /**
     * gets multiple values from the hook
     * @param {Object} filter Reference to the row. e.g: {geo: "swe", time: "1999", ... }
     * @param {Array} group_by How to nest e.g: ["geo"]
     * @param {Boolean} [previous = false] previous Append previous data points
     * @returns an array of values
     */
    getValues: function(filter, group_by, previous) {

      if(this.isHook()) {
        return [];
      }

      var dimTime, time, filtered, next, method, u, w, value, method;
      this._dataCube = this._dataCube || this.getSubhooks(true);
      filter = utils.clone(filter, this._getAllDimensions());
      dimTime = this._getFirstDimension({type: 'time'});
      time = new Date(filter[dimTime]); //clone date
      filter = utils.clone(filter, null, dimTime);

      var response = {};
      var f_keys = Object.keys(filter);
      var f_values = f_keys.map(function(k) { return filter[k]; });

      //if there's a filter, interpolate only that
      if(f_keys.length) {
        utils.forEach(this._dataCube, function(hook, name) {
          next = next || d3.bisectLeft(hook.getUnique(dimTime), time);
          u = hook.use;
          w = hook.which;
          method = globals.metadata.indicatorsDB[hook.which]? globals.metadata.indicatorsDB[hook.which].interpolation||"linear" : "linear";
          filtered = hook.getNestedItems(f_keys);
          utils.forEach(f_values, function(v) {
            filtered = filtered[v]; //get precise array (leaf)
          });
          value = interpolatePoint(filtered, u, w, next, dimTime, time, method);
          response[name] = hook.mapValue(value);

          //concat previous data points
          if(previous) {
            var values = utils.filter(filtered, filter).filter(function (d) {
                          return d[dimTime] <= time;
                         }).map(function(d) {
                          return hook.mapValue(d[w]);
                         }).concat(response[name]);
            response[name] = values;
          }
        });
      }
      //else, interpolate all with time
      else {
        utils.forEach(this._dataCube, function(hook, name) {
          filtered = hook.getNestedItems(group_by);
          response[name] = {};
          //find position from first hook
          next = (typeof next === 'undefined') ? d3.bisectLeft(hook.getUnique(dimTime), time) : next;
          u = hook.use;
          w = hook.which;
          method = globals.metadata.indicatorsDB[hook.which]? globals.metadata.indicatorsDB[hook.which].interpolation||"linear" : "linear";
          utils.forEach(filtered, function(arr, id) {
            value = interpolatePoint(arr, u, w, next, dimTime, time, method);
            response[name][id] = hook.mapValue(value);

            //concat previous data points
            if(previous) {
              var values = utils.filter(arr, filter).filter(function (d) {
                            return d[dimTime] <= time;
                           }).map(function(d) {
                            return hook.mapValue(d[w]);
                           }).concat(response[name][id]);
              response[name][id] = values;
            }

          });
        });
      }

      return response;
    },

    /**
     * gets the value of the hook point
     * @param {Object} filter Id the row. e.g: {geo: "swe", time: "1999"}
     * @returns hooked value
     */
    getValue: function (filter) {
      //extract id from original filter
      filter = utils.clone(filter, this._getAllDimensions());
      if (!this.isHook()) {
        utils.warn('getValue method needs the model to be hooked to data.');
        return;
      }
      var value;
      if (this.use === 'value') {
        value = this.which;
      } else if (this._space.hasOwnProperty(this.use)) {
        value = this._space[this.use][this.which];
      } else {
        //TODO: get meta info about translatable data
        var l = (this.use !== 'property') ? null : this._languageModel.id;
        var method = globals.metadata.indicatorsDB[this.which].interpolation || "linear";
        value = interpolateValue.call(this, filter, this.use, this.which, l, method);
      }
      return this.mapValue(value);
    },

    /**
     * maps the value to this hook's specifications
     * @param value Original value
     * @returns hooked value
     */
    mapValue: function (value) {
      return value;
    },

    /**
     * gets the items associated with this hook without values
     * @param filter filter
     * @returns hooked value
     */
    getKeys: function (filter) {
      if (this.isHook() && this._dataModel) {
        //all dimensions except time (continuous)
        var dimensions = this._getAllDimensions({
          exceptType: 'time'
        });
        var excluded = this._getAllDimensions({
          onlyType: 'time'
        });

        return this.getUnique(dimensions).map(function (item) {
          utils.forEach(excluded, function (e) {
            if (filter && filter[e]) {
              item[e] = filter[e];
            }
          });
          return item;
        });
      } else {
        var sub = this.getSubhooks();
        var found = [];
        if(sub.length > 1) {
          utils.forEach(sub, function(s) {
            found = s.getKeys();
            return false;
          });
        }
        return found;
      }
    },

    /**
     * gets filtered dataset with fewer keys
     * @param {Object} filter
     * @returns {Object} filtered items object
     */
    getFilteredItems: function (filter) {
      if (!filter) {
        utils.warn("No filter provided to getFilteredItems(<filter>)");
        return {};
      }
      //cache optimization
      var filter_id = JSON.stringify(filter);
      var filtered = _DATAMANAGER.get(this._dataId, 'filtered');
      var found = filtered[filter_id];
      if (filtered[filter_id]) {
        return filtered[filter_id];
      }
      var items = _DATAMANAGER.get(this._dataId);
      return filtered[filter_id] = utils.filter(items, filter);
    },

    /**
     * gets nested dataset
     * @param {Array} order
     * @returns {Object} nest items object
     */
    getNestedItems: function (order) {
      if (!order) {
        utils.warn("No order array provided to getNestedItems(<order>). E.g.: getNestedItems(['geo'])");
        return {};
      }
      //cache optimization
      var order_id, nested, items, nest;
      order_id = order.join("-");
      nested = this._dataId ? _DATAMANAGER.get(this._dataId, 'nested') : false;
      if (nested && order_id in nested) {
        return nested[order_id];
      }
      items = this._dataId ? _DATAMANAGER.get(this._dataId) : this.getKeys();
      nest = d3.nest();
      for (var i = 0; i < order.length; i++) {
        nest = nest.key((function(k) {
          return function(d) { return d[k]; };
        })(order[i]));
      };

      function nestToObj(arr) {
        if(!arr || !arr.length || !arr[0].key) return arr;
        var res = {};
        for (var i = 0; i < arr.length; i++) {
          res[arr[i].key] = nestToObj(arr[i].values);
        };
        return res;
      }

      return nested[order_id] = nestToObj(nest.entries(items));
    },

    /**
     * Gets formatter for this model
     * @returns {Function|Boolean} formatter function
     */
    getFormatter: function () {
    },

    /**
     * Gets tick values for this hook
     * @returns {Number|String} value The value for this tick
     */
    tickFormatter: function(x, formatterRemovePrefix) {

        //TODO: generalize for any time unit
        if(utils.isDate(x)) return d3.time.format(time_formats["year"])(x);
        if(utils.isString(x)) return x;

        var format = "f";
        var prec = 0;
        if(Math.abs(x)<1) {prec = 1; format = "r"};

        var prefix = "";
        if(formatterRemovePrefix) return d3.format("."+prec+format)(x);

        switch (Math.floor(Math.log10(Math.abs(x)))){
            case -13: x = x*1000000000000; prefix = "p"; break; //0.1p
            case -10: x = x*1000000000; prefix = "n"; break; //0.1n
            case  -7: x = x*1000000; prefix = "µ"; break; //0.1µ
            case  -6: x = x*1000000; prefix = "µ"; break; //1µ
            case  -5: x = x*1000000; prefix = "µ"; break; //10µ
            case  -4: break; //0.0001
            case  -3: break; //0.001
            case  -2: break; //0.01
            case  -1: break; //0.1
            case   0: break; //1
            case   1: break; //10
            case   2: break; //100
            case   3: break; //1000
            case   4: break; //10000
            case   5: x = x/1000; prefix = "k"; break; //0.1M
            case   6: x = x/1000000; prefix = "M"; prec = 1; break; //1M
            case   7: x = x/1000000; prefix = "M"; break; //10M
            case   8: x = x/1000000; prefix = "M"; break; //100M
            case   9: x = x/1000000000; prefix = "B"; prec = 1; break; //1B
            case  10: x = x/1000000000; prefix = "B"; break; //10B
            case  11: x = x/1000000000; prefix = "B"; break; //100B
            case  12: x = x/1000000000000; prefix = "T"; prec = 1; break; //1T
            //use the D3 SI formatting for the extreme cases
            default: return (d3.format("."+prec+"s")(x)).replace("G","B");
        }

        // use manual formatting for the cases above
        return (d3.format("."+prec+format)(x)+prefix).replace("G","B");

    },

    /**
     * Gets the d3 scale for this hook. if no scale then builds it
     * @returns {Array} domain
     */
    getScale: function (margins) {
      if (!this.scale) {
        this.buildScale(margins);
      }
      return this.scale;
    },

    /**
     * Gets the domain for this hook
     * @returns {Array} domain
     */
    buildScale: function () {
      if (!this.isHook()) {
        return;
      }
      var domain;
      var scaleType = this.scaleType || 'linear';
      switch (this.use) {
        case 'indicator':
          var limits = this.getLimits(this.which);
          domain = [
            limits.min,
            limits.max
          ];
          break;
        case 'property':
          domain = this.getUnique(this.which);
          break;
        default:
          domain = [this.which];
          break;
      }
      //TODO: d3 is global?
      this.scale = scaleType === 'time' ? d3.time.scale().domain(domain) : d3.scale[scaleType]().domain(domain);
    },

    /**
     * Gets limits
     * @param {String} attr parameter
     * @returns {Object} limits (min and max)
     */
    getLimits: function (attr) {
      if (!this.isHook()) {
        return;
      }
      //store limits so that we stop rechecking.
      var cachedLimits = _DATAMANAGER.get(this._dataId, 'limits');
      if (cachedLimits[attr]) {
        return cachedLimits[attr];
      }
      var map = function (n) {
        return (utils.isDate(n)) ? n : parseFloat(n);
      };
      var items = _DATAMANAGER.get(this._dataId);
      var filtered = items.reduce(function (filtered, d) {
        var f = map(d[attr]);
        if (!isNaN(f)) {
          filtered.push(f);
        }
        //filter
        return filtered;
      }, []);
      var min;
      var max;
      var limits = {};
      for (var i = 0; i < filtered.length; i += 1) {
        var c = filtered[i];
        if (typeof min === 'undefined' || c < min) {
          min = c;
        }
        if (typeof max === 'undefined' || c > max) {
          max = c;
        }
      }
      limits.min = min || 0;
      limits.max = max || 100;
      cachedLimits[attr] = limits;
      return limits;
    },

    /**
     * Gets unique values in a column
     * @param {String|Array} attr parameter
     * @returns {Array} unique values
     */
    getUnique: function (attr) {
      if (!this.isHook()) {
        return;
      }
      if (!attr) {
        attr = this._getFirstDimension({type: "time"});
      }
      var uniqueItems = _DATAMANAGER.get(this._dataId, 'unique');
      var uniq_id = JSON.stringify(attr);
      var uniq;
      if (uniqueItems[uniq_id]) {
        return uniqueItems[uniq_id];
      }
      var items = _DATAMANAGER.get(this._dataId);
      //if not in cache, compute
      //if it's an array, it will return a list of unique combinations.
      if (utils.isArray(attr)) {
        var values = items.map(function (d) {
          return utils.clone(d, attr); //pick attrs
        });
        uniq = utils.unique(values, function (n) {
          return JSON.stringify(n);
        });
      } //if it's a string, it will return a list of values
      else {
        var values = items.map(function (d) {
          return d[attr];
        });
        uniq = utils.unique(values);
      }
      uniqueItems[uniq_id] = uniq;
      return uniq;
    },

    //TODO: Is this supposed to be here?
    /**
     * gets maximum, minimum and mean values from the dataset of this certain hook
     */
    getMaxMinMean: function (options) {
        var _this = this;
        var result = {};
        //TODO: d3 is global?
        //Can we do this without d3?
        //yes if we copy d3 nest to out utils https://github.com/mbostock/d3/blob/master/src/arrays/nest.js
        var dim = this._getFirstDimension({
            type: 'time'
        });

        d3.nest()
            .key(function (d) {return options.timeFormatter(d[dim]);})
            .entries(_DATAMANAGER.get(this._dataId))
            .forEach(function (d) {
                var values = d.values
                    .filter(function (f) {return f[_this.which] !== null;})
                    .map(function (m) {return +m[_this.which];});

                if(options.skipZeros) values = values.filter(function (f) {return f!=0})

                result[d.key] = {
                    max: d3.max(values),
                    min: d3.min(values),
                    mean: d3.mean(values)
                };
            });
        return result;
    },

    /**
     * gets all hook dimensions
     * @param {Object} opts options with exceptType or onlyType
     * @returns {Array} all unique dimensions
     */
    _getAllDimensions: function (opts) {

      var optsStr = JSON.stringify(opts);
      if(optsStr in this._spaceDims) {
        return this._spaceDims[optsStr];
      }

      opts = opts || {};
      var dims = [];
      var dim;

      var models = this._space;
      //in case it's a parent of hooks
      if(!this.isHook() && this.space) {
        models = [];
        var _this = this;
        utils.forEach(this.space, function (name) {
          models.push(getClosestModel(_this, name));
        });
      }

      utils.forEach(models, function (m) {
        if (opts.exceptType && m.getType() === opts.exceptType) {
          return true;
        }
        if (opts.onlyType && m.getType() !== opts.onlyType) {
          return true;
        }
        if (dim = m.getDimension()) {
          dims.push(dim);
        }
      });

      this._spaceDims[optsStr] = dims;
      return dims;
    },

    /**
     * gets first dimension that matches type
     * @param {Object} options
     * @returns {Array} all unique dimensions
     */
    _getFirstDimension: function (opts) {
      opts = opts || {};

      var models = this._space;
      //in case it's a parent of hooks
      if(!this.isHook() && this.space) {
        models = [];
        var _this = this;
        utils.forEach(this.space, function (name) {
          models.push(getClosestModel(_this, name));
        });
      }

      var dim = false;
      utils.forEach(models, function (m) {
        if (opts.exceptType && m.getType() !== opts.exceptType) {
          dim = m.getDimension();
          return false;
        }
        else if (opts.type && m.getType() === opts.type) {
          dim = m.getDimension();
          return false;
        }
        else if (!opts.exceptType && !opts.type) {
          dim = m.getDimension();
          return false;
        }
      });
      return dim;
    },

    /**
     * gets all hook filters
     * @param {Boolean} splashScreen get filters for first screen only
     * @returns {Object} filters
     */
    _getAllFilters: function (splashScreen) {
      var filters = {};
      utils.forEach(this._space, function (h) {
        filters = utils.extend(filters, h.getFilter(splashScreen));
      });
      return filters;
    },

    /**
     * gets all hook filters
     * @returns {Object} filters
     */
    _getAllFormatters: function () {
      var formatters = {};
      utils.forEach(this._space, function (h) {
        var f = h.getFormatter();
        if (f) {
          formatters[h.getDimension()] = f;
        }
      });
      return formatters;
    }

  });

  Vizabi.Model = Model;

  /* ===============================
   * Private Helper Functions
   * ===============================
   */

  /**
   * Checks whether an object is a model or not
   */
  function isModel(model) {
    return model.hasOwnProperty('_data');
  }

  /**
   * Binds all attributes in _data to magic setters and getters
   */
  function bindSettersGetters(model) {
    for (var prop in model._data) {
      Object.defineProperty(model, prop, {
        configurable: true,
        //allow reconfiguration
        get: function (p) {
          return function () {
            return model.get(p);
          };
        }(prop),
        set: function (p) {
          return function (value) {
            return model.set(p, value);
          };
        }(prop)
      });
    }
  }

  /**
   * Loads a submodel, when necessaary
   * @param {String} attr Name of submodel
   * @param {Object} val Initial values
   * @param {Object} ctx context
   * @returns {Object} model new submodel
   */
  function initSubmodel(attr, val, ctx) {
    var name = attr.split('_')[0];
    var binds = {
      //the submodel has changed (multiple times)
      'change': function (evt, vals) {
        if(!ctx._ready) return; //block change propagation if model isnt ready
        evt = evt.replace('change', 'change:' + name);
        ctx.triggerAll(evt, ctx.getObject());
      },
      //loading has started in this submodel (multiple times)
      'hook_change': function (evt, vals) {
        ctx.trigger(evt, ctx.getObject());
      },
      //loading has started in this submodel (multiple times)
      'load_start': function (evt, vals) {
        evt = evt.replace('load_start', 'load_start:' + name);
        ctx.setReady(false);
        ctx.triggerAll(evt, ctx.getObject());
      },
      //loading has failed in this submodel (multiple times)
      'load_error': function (evt, vals) {
        evt = evt.replace('load_error', 'load_error:' + name);
        ctx.triggerAll(evt, vals);
      },
      //loading has ended in this submodel (multiple times)
      'ready': function (evt, vals) {
        //trigger only for submodel
        evt = evt.replace('ready', 'ready:' + name);
        ctx.setReady(false);
        //wait to make sure it's not set false again in the next execution loop
        utils.defer(function() {
          ctx.setReady();
        });
        //ctx.trigger(evt, vals);
      }
    };
    if (isModel(val)) {
      val.on(binds);
      return val;
    } else {
      //special model
      var Modl = Vizabi.Model.get(name, true) || Model;
      return new Modl(val, ctx, binds, true);
    }
  }

  /**
   * gets closest interval from this model or parent
   * @returns {Object} Intervals object
   */
  function getIntervals(ctx) {
    if (ctx._intervals) {
      return ctx._intervals;
    } else if (ctx._parent) {
      return getIntervals(ctx._parent);
    } else {
      return new Vizabi.Intervals();
    }
  }

  /**
   * gets closest prefix model moving up the model tree
   * @param {String} prefix
   * @returns {Object} submodel
   */
  function getClosestModel(ctx, name) {
    var model = findSubmodel(ctx, name);
    if (model) {
      return model;
    } else if (ctx._parent) {
      return getClosestModel(ctx._parent, name);
    }
  }

  /**
   * find submodel with name that starts with prefix
   * @param {String} prefix
   * @returns {Object} submodel or false if nothing is found
   */
  function findSubmodel(ctx, name) {
    for (var i in ctx._data) {
      //found submodel
      if (i === name && isModel(ctx._data[i])) {
        return ctx._data[i];
      }
    }
  }

  /**
   * Learn what this model should hook to
   * @returns {Array} space array
   */
  function getSpace(model) {
    if (utils.isArray(model.space)) {
      return model.space;
    } else if (model._parent) {
      return getSpace(model._parent);
    } else {
      utils.error('ERROR: space not found.\n You must specify the objects this hook will use under the "space" attribute in the state.\n Example:\n space: ["entities", "time"]');
    }
  }

  //caches interpolation indexes globally.
  //TODO: what if there are 2 visualizations with 2 data sources?
  var interpIndexes = {};

  /**
   * interpolates the specific value missing
   * @param {Array} list
   * @param {String} use
   * @param {String} which
   * @param {Number} i the next item in the array
   * @param {String} method
   * @returns interpolated value
   */
  function interpolatePoint(arr, use, which, i, dimTime, time, method) {

    if (arr === null || arr.length === 0) {
      utils.warn('interpolatePoint returning NULL: array is empty');
      return null;
    }
    // return constant for the use of "value"
    if (use === 'value') {
      return which;
    }
    // zero-order interpolation for the use of properties
    if (use === 'property' && i === 0) {
      return arr[0][which];
    }
    if (use === 'property') {
      return arr[i - 1][which];
    }

    // the rest is for the continuous measurements
    // check if the desired value is out of range. 0-order extrapolation
    if (i === 0) {
      return arr[0][which];
    }
    if (i === arr.length) {
      return arr[arr.length - 1][which];
    }
    //return null if data is missing
    if (arr[i][which] === null || arr[i-1][which] === null) {
      return null;
    }
      
    var result = _interpolator()[method](
        arr[i - 1][dimTime], 
        arr[i][dimTime], 
        arr[i - 1][which], 
        arr[i][which], 
        time
    );

    // cast to time object if we are interpolating time
    if (utils.isDate(arr[0][which])) result = new Date(result);
    
    return result;
  }

  /**
   * interpolates the specific value if missing
   * @param {Object} _filter Id the row. e.g: {geo: "swe", time: "1999"}
   * filter SHOULD contain time property
   * @returns interpolated value
   */
  function interpolateValue(_filter, use, which, l, method) {

    var dimTime, time, filter, items, space_id, indexNext, result;

    dimTime = this._getFirstDimension({type: 'time'});
    time = new Date(_filter[dimTime]); //clone date
    filter = utils.clone(_filter, null, dimTime);


    items = this.getFilteredItems(filter);
    if (items === null || items.length === 0) {
      utils.warn('interpolateValue returns ' + which + ' = NULL because items array is empty in ' + JSON.stringify(filter));
      return null;
    }

    // return constant for the use of "value"
    if (use === 'value') {
      return items[0][which];
    }

    // search where the desired value should fall between the known points
    space_id = this._spaceId || (this._spaceId = Object.keys(this._space).join('-'));
    interpIndexes[space_id] = interpIndexes[space_id] || {};

    if(time in interpIndexes[space_id]) {
      indexNext = interpIndexes[space_id][time].next;
    }
    else {
      indexNext = d3.bisectLeft(this.getUnique(dimTime), time);
      //store indexNext
      interpIndexes[space_id][time] = {
        next: indexNext
      };
    }

    // zero-order interpolation for the use of properties
    if (use === 'property' && indexNext === 0) {
      return items[0][which];
    }
    if (use === 'property') {
      return items[indexNext - 1][which];
    }
    // the rest is for the continuous measurements
    // check if the desired value is out of range. 0-order extrapolation
    if (indexNext === 0) {
      return items[0][which];
    }
    if (indexNext === items.length) {
      return items[items.length - 1][which];
    }
    //return null if data is missing
    if (items[indexNext][which] === null || items[indexNext - 1][which] === null) {
      return null;
    }

    result = _interpolator()[method](
        items[indexNext - 1][dimTime], 
        items[indexNext][dimTime], 
        items[indexNext - 1][which], 
        items[indexNext][which], 
        time
    );

    // cast to time object if we are interpolating time
    if (Object.prototype.toString.call(items[0][which]) === '[object Date]') {
      result = new Date(result);
    }
    return result;
  };
    
  function _interpolator(){
  
    return {
        linear: function(x1, x2, y1, y2, x){
            return +y1 + (y2 - y1) * (x - x1) / (x2 - x1);
        },
        exp: function(x1, x2, y1, y2, x){
            return Math.exp((Math.log(y1) * (x2 - x) - Math.log(y2) * (x1 - x)) / (x2 - x1));
        },
    }
  }

}.call(this));

/*!
 * VIZABI COMPONENT
 * Base Component
 */
(function () {

  'use strict';

  var class_loading = 'vzb-loading';
  var class_loading_first = 'vzb-loading-first';
  var root = this;
  var Vizabi = root.Vizabi;
  var Promise = Vizabi.Promise;
  var utils = Vizabi.utils;
  var templates = {};
  var Component = Vizabi.Events.extend({

    /**
     * Initializes the component
     * @param {Object} config Initial config, with name and placeholder
     * @param {Object} parent Reference to tool
     */
    init: function (config, parent) {
      this._id = this._id || utils.uniqueId('c');
      this._ready = false;
      this._readyOnce = false;
      this.name = this.name || config.name;
      this.template = this.template || '<div></div>';
      this.placeholder = this.placeholder || config.placeholder;
      this.template_data = this.template_data || {
          name: this.name
        };
      //make sure placeholder is DOM element
      if (this.placeholder && !utils.isElement(this.placeholder)) {
        try {
          this.placeholder = parent.placeholder.querySelector(this.placeholder);
        } catch (e) {
          utils.error('Error finding placeholder \'' + this.placeholder + '\' for component \'' + this.name + '\'');
        }
      }
      this.parent = parent || this;
      this.root = this.parent.root || this;

      this.components = this.components || [];
      this._components_config = this.components.map(function (x) {
        return utils.clone(x);
      });
      this._frameRate = 10;
      //define expected models for this component
      this.model_expects = this.model_expects || [];
      this.model_binds = this.model_binds || {};
      this.ui = this.ui || config.ui;
      this._super();
      //readyOnce alias
      var _this = this;
      this.on({
        'readyOnce': function () {
          if (typeof _this.readyOnce === 'function') {
            _this.readyOnce();
          }
        },
        'ready': function () {
          if (typeof _this.ready === 'function') {
            _this.ready();
          }
        },
        'domReady': function () {
          if (typeof _this.domReady === 'function') {
            _this.domReady();
          }
        },
        'resize': function () {
          if (typeof _this.resize === 'function') {
            _this.resize();
          }
        }
      });
      this.triggerResize = utils.throttle(this.triggerResize);
    },

    /**
     * Preloads data before anything else
     */
    preload: function(promise) {
      promise.resolve(); //by default, load nothing
    },

    /**
     * Executes after preloading is finished
     */
    afterPreload: function() {
      if(this.model) {
        this.model.afterPreload();
      }
    },

    /**
     * Renders the component (after data is ready)
     */
    render: function () {
      var _this = this;
      this.loadTemplate();
      this.loadComponents();
      //render each subcomponent
      utils.forEach(this.components, function (subcomp) {
        subcomp.render();
        _this.on('resize', function () {
          subcomp.trigger('resize');
        });
      });

      //if it's a root component with model
      if (this.isRoot() && this.model) {
        this.model.on('ready', function () {
          done();
        });
        this.model.setHooks();

        var splashScreen = this.model.data.splash;

        preloader(this).then(function() {

          if(splashScreen) {

            //TODO: cleanup hardcoded splash screen
            var timeMdl = _this.model.state.time;
            timeMdl.splash = true;
            var temp = utils.clone(timeMdl.getObject(), ['start', 'end']);
            
            _this.model.load({ splashScreen: true }).then(function(){
              //delay to avoid conflicting with setReady
              utils.delay(function() {
                //force loading because we're restoring time.
                _this.model.setLoading('restore_orig_time');
                timeMdl.start = temp.start;
                timeMdl.end =  temp.end;
                _this.model.load().then(function() {
                  _this.model.setLoadingDone('restore_orig_time');
                  timeMdl.splash = false;
                  timeMdl.trigger('change');
                });
              }, 300);

            });
          }
          else {
            _this.model.load();
          }
        });

      } else if (this.model && this.model.isLoading()) {
        this.model.on('ready', function () {
          done();
        });
      } else {
        done();
      }

      function done() {
        utils.removeClass(_this.placeholder, class_loading);
        utils.removeClass(_this.placeholder, class_loading_first);
        _this.setReady();
      }
    },
    setReady: function (value) {
      if (!this._readyOnce) {
        this.trigger('readyOnce');
        this._readyOnce = true;
      }

      this._ready = true;
      this.trigger('ready');
    },

    /**
     * Loads the template
     * @returns defer a promise to be resolved when template is loaded
     */
    loadTemplate: function () {
      var tmpl = this.template;
      var data = this.template_data;
      var _this = this;
      var rendered = '';
      if (!this.placeholder) {
        return;
      }
      //todo: improve t function getter + generalize this
      data = utils.extend(data, {
        t: this.getTranslationFunction(true)
      });
      if (this.template) {
        try {
          rendered = templateFunc(tmpl, data);
        } catch (e) {
          utils.error('Templating error for component: \'' + this.name + '\' - Check if path to template is correct. E.g.: \'src/components/...\'');
        }
      }
      //add loading class and html
      utils.addClass(this.placeholder, class_loading);
      utils.addClass(this.placeholder, class_loading_first);
      this.placeholder.innerHTML = rendered;
      this.element = this.placeholder.children[0];
      //only tools have layout (manage sizes)
      if (this.layout) {
        this.layout.setContainer(this.element);
        this.layout.on('resize', function () {
          if (_this._ready) {
            _this.triggerResize();
          }
        });
      }
      //template is ready
      this.trigger('domReady');
    },

    triggerResize: function () {
      this.trigger('resize');
    },

    /*
     * Loads all subcomponents
     */
    loadComponents: function () {
      var _this = this;
      var config;
      var comp;
      //use the same name for collection
      this.components = [];
      //external dependencies let this model know what it
      //has to wait for
      if (this.model) {
        this.model.resetDeps();
      }
      // Loops through components, loading them.
      utils.forEach(this._components_config, function (c) {
        if (!c.component) {
          utils.error('Error loading component: name not provided');
          return;
        }
        if (!(comp = Vizabi.Component.get(c.component))) {
          return;
        }
        config = utils.extend(c, {
          name: c.component,
          ui: _this._uiMapping(c.placeholder, c.ui)
        });
        //instantiate new subcomponent
        var subcomp = new comp(config, _this);
        var c_model = c.model || [];
        subcomp.model = _this._modelMapping(subcomp.name, c_model, subcomp.model_expects, subcomp.model_binds);
        //subcomponent model is initialized in frozen state
        //unfreeze to dispatch events
        subcomp.model.unfreeze();
        _this.components.push(subcomp);
      });
    },

    /**
     * Checks whether this is the root component
     * @returns {Boolean}
     */
    isRoot: function () {
      return this.parent === this;
    },
      
    /**
     * Returns subcomponent by name
     * @returns {Boolean}
     */
    findChildByName: function (name) {
      return utils.find(this.components, function(f){return f.name === name});
    },

    /**
     * Get layout profile of the current resolution
     * @returns {String} profile
     */
    getLayoutProfile: function () {
      //get profile from parent if layout is not available
      if (this.layout) {
        return this.layout.currentProfile();
      } else {
        return this.parent.getLayoutProfile();
      }
    },

    //TODO: make ui mapping more powerful
    /**
     * Maps the current ui to the subcomponents
     * @param {String} id subcomponent id (placeholder)
     * @param {Object} ui Optional ui parameters to overwrite existing
     * @returns {Object} the UI object
     */
    _uiMapping: function (id, ui) {
      //if overwritting UI
      if (ui) {
        return new Vizabi.Model(ui);
      }
      if (id && this.ui) {
        id = id.replace('.', '');
        //remove trailing period
        var sub_ui = this.ui[id];
        if (sub_ui) {
          return sub_ui;
        }
      }
      return this.ui;
    },

    /**
     * Maps the current model to the subcomponents
     * @param {String} subcomponent name of the subcomponent
     * @param {String|Array} model_config Configuration of model
     * @param {String|Array} model_expects Expected models
     * @param {Object} model_binds Initial model bindings
     * @returns {Object} the model
     */
    _modelMapping: function (subcomponent, model_config, model_expects, model_binds) {
      var _this = this;
      var values = {};
      //If model_config is an array, we map it
      if (utils.isArray(model_config) && utils.isArray(model_expects)) {

        //if there's a different number of models received and expected
        if (model_expects.length !== model_config.length) {
          utils.groupCollapsed('DIFFERENCE IN NUMBER OF MODELS EXPECTED AND RECEIVED');
          utils.warn('Please, configure the \'model_expects\' attribute accordingly in \'' + subcomponent + '\' or check the models passed in \'' + _this.name + '\'.\n\nComponent: \'' + _this.name + '\'\nSubcomponent: \'' + subcomponent + '\'\nNumber of Models Expected: ' + model_expects.length + '\nNumber of Models Received: ' + model_config.length);
          utils.groupEnd();
        }
        utils.forEach(model_config, function (m, i) {
          var model_info = _mapOne(m);
          var new_name;
          if (model_expects[i]) {
            new_name = model_expects[i].name;
            if (model_expects[i].type && model_info.type !== model_expects[i].type && (!utils.isArray(model_expects[i].type) ||
              model_expects[i].type.indexOf(model_info.type) === -1)) {

              utils.groupCollapsed('UNEXPECTED MODEL TYPE: \'' + model_info.type + '\' instead of \'' + model_expects[i].type + '\'');
              utils.warn('Please, configure the \'model_expects\' attribute accordingly in \'' + subcomponent + '\' or check the models passed in \'' + _this.name + '\'.\n\nComponent: \'' + _this.name + '\'\nSubcomponent: \'' + subcomponent + '\'\nExpected Model: \'' + model_expects[i].type + '\'\nReceived Model\'' + model_info.type + '\'\nModel order: ' + i);
              utils.groupEnd();
            }
          } else {

            utils.groupCollapsed('UNEXPECTED MODEL: \'' + model_config[i] + '\'');
            utils.warn('Please, configure the \'model_expects\' attribute accordingly in \'' + subcomponent + '\' or check the models passed in \'' + _this.name + '\'.\n\nComponent: \'' + _this.name + '\'\nSubcomponent: \'' + subcomponent + '\'\nNumber of Models Expected: ' + model_expects.length + '\nNumber of Models Received: ' + model_config.length);
            utils.groupEnd();
            new_name = model_info.name;
          }
          values[new_name] = model_info.model;
        });
        var existing = model_config.length;
        var expected = model_expects.length;
        if (expected > existing) {
          //skip existing
          model_expects.splice(0, existing);
          //adds new expected models if needed
          utils.forEach(expected, function (m) {
            values[m.name] = {};
          });
        }
      } else {
        return;
      }
      //return a new model with the defined submodels
      return new Vizabi.Model(values, null, model_binds, true);
      /**
       * Maps one model name to current submodel and returns info
       * @param {String} name Full model path. E.g.: "state.marker.color"
       * @returns {Object} the model info, with name and the actual model
       */
      function _mapOne(name) {
        var parts = name.split('.');
        var current = _this.model;
        var current_name = '';
        while (parts.length) {
          current_name = parts.shift();
          current = current[current_name];
        }
        return {
          name: name,
          model: current,
          type: current ? current.getType() : null
        };
      }
    },

    /**
     * Get translation function for templates
     * @param {Boolean} wrap wrap in spam tags
     * @returns {Function}
     */
    getTranslationFunction: function (wrap) {
      var t_func;
      try {
        t_func = this.model.get('language').getTFunction();
      } catch (err) {
        if (this.parent && this.parent !== this) {
          t_func = this.parent.getTranslationFunction();
        }
      }
      if (!t_func) {
        t_func = function (s) {
          return s;
        };
      }
      if (wrap) {
        return this._translatedStringFunction(t_func);
      } else {
        return t_func;
      }
    },

    /**
     * Get function for translated string
     * @param {Function} translation_function The translation function
     * @returns {Function}
     */
    _translatedStringFunction: function (translation_function) {
      return function (string) {
        var translated = translation_function(string);
        return '<span data-vzb-translate="' + string + '">' + translated + '</span>';
      };
    },

    /**
     * Translate all strings in the template
     */
    translateStrings: function () {
      var t = this.getTranslationFunction();
      var strings = this.placeholder.querySelectorAll('[data-vzb-translate]');
      if (strings.length === 0) {
        return;
      }
      utils.forEach(strings, function (str) {
        if (!str || !str.getAttribute) {
          return;
        }
        str.innerHTML = t(str.getAttribute('data-vzb-translate'));
      });
    },

    /**
     * Checks whether this component is a tool or not
     * @returns {Boolean}
     */
    isTool: function () {
      return this._id[0] === 't';
    },

    /**
     * Executes after the template is loaded and rendered.
     * Ideally, it contains HTML instantiations related to template
     * At this point, this.element and this.placeholder are available
     * as DOM elements
     */
    readyOnce: function () {
    },

    /**
     * Executes after the template and model (if any) are ready
     */
    ready: function () {
    },

    /**
     * Executes when the resize event is triggered.
     * Ideally, it only contains operations related to size
     */
    resize: function () {
    },

    /**
     * Clears a component
     */
    clear: function() {
      this.freeze();
      if(this.model) this.model.freeze();
      Vizabi.utils.forEach(this.components, function(c) {
        c.clear();
      });
    }
  });

  /**
   * Preloader implementation with promises
   * @param {Object} comp any component
   * @returns {Promise}
   */
  function preloader(comp) {
    var promise = new Promise();
    var promises = []; //holds all promises

    //preload all subcomponents first
    utils.forEach(comp.components, function (subcomp) {
        promises.push(preloader(subcomp));
    });

    var wait = promises.length ? Promise.all(promises) : new Promise.resolve();
    wait.then(function () {
      comp.preload(promise);
    }, function(err) {
      utils.error("Error preloading data:", err);
    });

    return promise.then(function() {
      comp.afterPreload();
      return true;
    });
  }

  // Based on Simple JavaScript Templating by John Resig
  //generic templating function
  function templateFunc(str, data) {
    // Figure out if we're getting a template, or if we need to
    // load the template - and be sure to cache the result.
    var fn = !/<[a-z][\s\S]*>/i.test(str) ? templates[str] = templates[str] || templateFunc(root.document.getElementById(str).innerHTML) : // Generate a reusable function that will serve as a template
      // generator (and which will be cached).
      new Function('obj', 'var p=[],print=function(){p.push.apply(p,arguments);};' + // Introduce the data as local variables using with(){}
        'with(obj){p.push(\'' + // Convert the template into pure JavaScript
        str.replace(/[\r\t\n]/g, ' ').split('<%').join('\t').replace(/((^|%>)[^\t]*)'/g, '$1\r').replace(/\t=(.*?)%>/g, '\',$1,\'').split('\t').join('\');').split('%>').join('p.push(\'').split('\r').join('\\\'') + '\');}return p.join(\'\');');
    // Provide some basic currying to the user
    return data ? fn(data) : fn;
  }

  //utility function to check if a component is a component
  //TODO: Move to utils?
  Component.isComponent = function (c) {
    return c._id && (c._id[0] === 't' || c._id[0] === 'c');
  };

  Vizabi.Component = Component;

}.call(this));

/*!
 * VIZABI COMPONENT
 * Base Component
 */
(function () {
  'use strict';
  var class_loading = 'vzb-loading';
  var class_loading_first = 'vzb-loading-first';
  var class_loading_data = 'vzb-loading';
  var class_loading_error = 'vzb-loading-error';
  var class_placeholder = 'vzb-placeholder';
  var class_buttons_off = 'vzb-buttonlist-off';
  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;
  var templates = {};
  var toolsList = {};
  //tool model is quite simple and doesn't need to be registered
  var ToolModel = Vizabi.Model.extend({
    /**
     * Initializes the tool model.
     * @param {Object} values The initial values of this model
     * @param {Object} binds contains initial bindings for the model
     * @param {Function|Array} validade validate rules
     */
    init: function (values, defaults, binds, validate) {
      this._id = utils.uniqueId('tm');
      this._type = 'tool';
      //generate validation function
      this.validate = generateValidate(this, validate);
      //default submodels
      values = values || {};
      defaults = defaults || {};
      values = defaultOptions(values, defaults);
      //constructor is similar to model
      this._super(values, null, binds, true);
      // change language
      if (values.language) {
        var _this = this;
        this.on('change:language', function () {
          _this.trigger('translate');
        });
      }
    }
  });
  //tool
  var Tool = Vizabi.Component.extend({
    /**
     * Initializes the tool
     * @param {Object} placeholder object
     * @param {Object} options Options such as state, data, etc
     */
    init: function (placeholder, options) {
      this._id = utils.uniqueId('t');
      this.layout = new Vizabi.Layout();
      this.template = this.template || '<div class="vzb-tool vzb-tool-' + this.name + '"><div class="vzb-tool-content"><div class="vzb-tool-stage"><div class="vzb-tool-viz"></div><div class="vzb-tool-timeslider"></div></div><div class="vzb-tool-buttonlist"></div><div class="vzb-tool-treemenu vzb-hidden"></div><div class="vzb-tool-datawarning vzb-hidden"></div></div></div>';
      this.model_binds = this.model_binds || {};
      this.default_options = this.default_options || {};
      //bind the validation function with the tool
      var validate = this.validate.bind(this);
      var _this = this;
      var callbacks = utils.merge({
        'change': function (evt, val) {
          if (_this._ready) {
            _this.model.validate();
            _this.trigger(evt, val);
          }
        },
        'translate': function (evt, val) {
          if (_this._ready) {
            Vizabi.Promise.all([_this.preloadLanguage(), _this.model.load()])
                          .then(function() {
                            _this.model.validate();
                            _this.translateStrings();
                          });
          }
        },
        'load_start': function () {
          _this.beforeLoading();
        },
        'load_error': function () {
          _this.errorLoading();
        },
        'ready': function (evt) {
          if (_this._ready) {
            _this.afterLoading();
          }
        }
      }, this.model_binds);
      options = options || {};
      this.model = new ToolModel(options, this.default_options, callbacks, validate);
      //ToolModel starts in frozen state. unfreeze;
      this.model.unfreeze();
      this.ui = this.model.ui;
      //splash 
      this.ui.splash = this.model.data.splash;
      this._super({
        name: this.name || this._id,
        placeholder: placeholder
      }, this);
      this._bindEvents();
      this.render();
      this._setUIOptions();
    },
    /**
     * Binds events in model to outside world
     */
    _bindEvents: function () {
      if (!this.model.bind) {
        return;
      }
      this.on(this.model.bind.get());
    },

    /**
     * Clears a tool
     */

    clear: function() {
      this.layout.clear();
      this.setOptions = this.getOptions = function() { return; };
      this._super();
    },

    /**
     * Sets options from external page
     * @param {Object} options new options
     * @param {Boolean} overwrite overwrite everything instead of extending
     */
    setOptions: function (options, overwrite) {
      if (overwrite) {
        this.model.reset(options);
      } else {
        this.model.set(changedObj(options, this.getOptions()));
      }
      this._setUIOptions();
    },

    /**
     * gets all options
     * @return {Object} JSON object with options
     */
    getOptions: function () {
      return this.model.getObject() || {};
    },
    /**
     * Displays loading class
     */
    beforeLoading: function () {
      if (!this._readyOnce) {
        utils.addClass(this.placeholder, class_loading_first);
      }
      if (!utils.hasClass(this.placeholder, class_loading_data)) {
        utils.addClass(this.placeholder, class_loading_data);
      }
    },
    /**
     * Removes loading class
     */
    afterLoading: function () {
      utils.removeClass(this.placeholder, class_loading_data);
      utils.removeClass(this.placeholder, class_loading_first);
    },
    /**
     * Adds loading error class
     */
    errorLoading: function () {
      utils.addClass(this.placeholder, class_loading_error);
    },
    /* ==========================
     * Validation and query
     * ==========================
     */
    /**
     * Validating the tool model
     * @param model the current tool model to be validated
     */
    validate: function (model) {

        model = this.model || model;
        
        if(!model || !model.state) {utils.warn("tool validation aborted: model.state looks wrong: " + model); return;};

        var time = model.state.time;
        var marker = model.state.marker;
        
        if(!time) {utils.warn("tool validation aborted: time looks wrong: " + time); return;};
        if(!marker) {utils.warn("tool validation aborted: marker looks wrong: " + marker); return;};
        
        var label = marker.label;
        
        if(!label) {utils.warn("tool validation aborted: marker label looks wrong: " + label); return;};

        //don't validate anything if data hasn't been loaded
        if (model.isLoading() || !label.getKeys() || label.getKeys().length < 1) return;        

        var dateMin = label.getLimits(time.getDimension()).min;
        var dateMax = label.getLimits(time.getDimension()).max;

        if(!utils.isDate(dateMin)) utils.warn("tool validation: min date looks wrong: " + dateMin);
        if(!utils.isDate(dateMax)) utils.warn("tool validation: max date looks wrong: " + dateMax);
        
        if (time.start < dateMin) time.start = dateMin;
        if (time.end > dateMax) time.end = dateMax;
    },
      
    _setUIOptions: function () {
      //add placeholder class
      utils.addClass(this.placeholder, class_placeholder);
      //add-remove buttonlist class
      if (!this.ui || !this.ui.buttons || !this.ui.buttons.length) {
        utils.addClass(this.element, class_buttons_off);
      } else {
        utils.removeClass(this.element, class_buttons_off);
      }
    },

    preloadLanguage: function() {
      return Vizabi.Promise.resolve();
    }
  });

  /* ==========================
   * Validation methods
   * ==========================
   */

  /**
   * Generates a validation function based on specific model validation
   * @param {Object} m model
   * @param {Function} validate validation function
   * @returns {Function} validation
   */
  function generateValidate(m, validate) {
    var max = 10;

    function validate_func() {
      var model = JSON.stringify(m.getObject());
      var c = arguments[0] || 0;
      //TODO: remove validation hotfix
      //while setting this.model is not available
      if (!this._readyOnce) {
        validate(this);
      } else {
        validate();
      }
      var model2 = JSON.stringify(m.getObject());
      if (c >= max) {
        utils.error('Max validation loop.');
      } else if (model !== model2) {
        validate_func.call(this, [c += 1]);
      }
    }

    return validate_func;
  }

  /* ==========================
   * Default options methods
   * ==========================
   */

  /**
   * Generates a valid state based on default options
   */
  function defaultOptions(values, defaults) {
    var keys = Object.keys(defaults);
    var size = keys.length;
    var field;
    var blueprint;
    var original;
    var type;
    for (var i = 0; i < size; i += 1) {
      field = keys[i];
      if (field === '_defs_') {
        continue;
      }
      blueprint = defaults[field];
      original = values[field];
      type = typeof blueprint;
      if (type === 'object') {
        type = utils.isPlainObject(blueprint) && blueprint._defs_ ? 'object' : utils.isArray(blueprint) ? 'array' : 'model';
      }
      if (typeof original === 'undefined') {
        if (type !== 'object' && type !== 'model') {
          values[field] = blueprint;
        } else {
          values[field] = defaultOptions({}, blueprint);
        }
      }
      original = values[field];
      if (type === 'number' && isNaN(original)) {
        values[field] = 0;
      } else if (type === 'string' && typeof original !== 'string') {
        values[field] = '';
      } else if (type === 'array' && !utils.isArray(original)) {
        values[field] = [];
      } else if (type === 'model') {
        if (!utils.isObject(original)) {
          values[field] = {};
        }
        values[field] = defaultOptions(values[field], blueprint);
      } else if (type === 'object') {
        if (!utils.isObject(original) || Object.keys(original).length === 0) {
          original = false; //will be overwritten
        }
        if (!utils.isObject(blueprint._defs_)) {
          blueprint._defs_ = {};
        }
        values[field] = original || blueprint._defs_;
      }
    }
    return values;
  }

  /**
   * Outputs the difference between two objects
   * @param {Object} obj prevailing object
   * @param {Object} compare comparison object
   * @returns {Object} resulting diff object
   */
  function changedObj(obj, compare) {
    var acc = {};
    utils.forEach(obj, function(val, name) {
      if(!(name in compare)) {
        acc[name] = val;
        return true;
      }
      //if the same, no need to check deeper
      if(JSON.stringify(val) === JSON.stringify(compare[name])) return true;
      else if(utils.isArray(val)) {
        acc[name] = val;
      }
      else if(utils.isObject(val)) {
        acc[name] = changedObj(val, compare[name]);
      }
      else if(utils.isDate(compare[name])){
        var comp1 = val.toString();
        //TODO: workaround for years only
        var comp2 = compare[name].getFullYear().toString();
        if(comp1 !== comp2) {
          acc[name] = val;
        }
      }
      else {
        acc[name] = val;
      }
    });
    return acc;
  }

  //utility function to check if a component is a tool
  //TODO: Move to utils?
  Tool.isTool = function (c) {
    return c._id && c._id[0] === 't';
  };

  Vizabi.Tool = Tool;
}.call(this));

/*!
 * Icon collection
 * source: https://github.com/encharm/Font-Awesome-SVG-PNG/
 */


(function () {

    'use strict';

    var root = this;
    var Vizabi = root.Vizabi;

    Vizabi.iconset = {
        'paint-brush': '<svg class="vzb-icon vzb-icon-paint-brush" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1615 0q70 0 122.5 46.5t52.5 116.5q0 63-45 151-332 629-465 752-97 91-218 91-126 0-216.5-92.5t-90.5-219.5q0-128 92-212l638-579q59-54 130-54zm-909 1034q39 76 106.5 130t150.5 76l1 71q4 213-129.5 347t-348.5 134q-123 0-218-46.5t-152.5-127.5-86.5-183-29-220q7 5 41 30t62 44.5 59 36.5 46 17q41 0 55-37 25-66 57.5-112.5t69.5-76 88-47.5 103-25.5 125-10.5z"/></svg>',
        'search': '<svg class="vzb-icon vzb-icon-search" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1216 832q0-185-131.5-316.5t-316.5-131.5-316.5 131.5-131.5 316.5 131.5 316.5 316.5 131.5 316.5-131.5 131.5-316.5zm512 832q0 52-38 90t-90 38q-54 0-90-38l-343-342q-179 124-399 124-143 0-273.5-55.5t-225-150-150-225-55.5-273.5 55.5-273.5 150-225 225-150 273.5-55.5 273.5 55.5 225 150 150 225 55.5 273.5q0 220-124 399l343 343q37 37 37 90z"/></svg>',
        'circle': '<svg class="vzb-icon vzb-icon-circle" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1664 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"/></svg>',
        'expand': '<svg class="vzb-icon vzb-icon-expand" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M883 1056q0 13-10 23l-332 332 144 144q19 19 19 45t-19 45-45 19h-448q-26 0-45-19t-19-45v-448q0-26 19-45t45-19 45 19l144 144 332-332q10-10 23-10t23 10l114 114q10 10 10 23zm781-864v448q0 26-19 45t-45 19-45-19l-144-144-332 332q-10 10-23 10t-23-10l-114-114q-10-10-10-23t10-23l332-332-144-144q-19-19-19-45t19-45 45-19h448q26 0 45 19t19 45z"/></svg>',
        'asterisk': '<svg class="vzb-icon vzb-icon-asterisk" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1546 1050q46 26 59.5 77.5t-12.5 97.5l-64 110q-26 46-77.5 59.5t-97.5-12.5l-266-153v307q0 52-38 90t-90 38h-128q-52 0-90-38t-38-90v-307l-266 153q-46 26-97.5 12.5t-77.5-59.5l-64-110q-26-46-12.5-97.5t59.5-77.5l266-154-266-154q-46-26-59.5-77.5t12.5-97.5l64-110q26-46 77.5-59.5t97.5 12.5l266 153v-307q0-52 38-90t90-38h128q52 0 90 38t38 90v307l266-153q46-26 97.5-12.5t77.5 59.5l64 110q26 46 12.5 97.5t-59.5 77.5l-266 154z"/></svg>',
        'trails': '<svg class="vzb-icon vzb-icon-trails" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M 1381.375 17.1875 C 1375.7825 17.176804 1370.1216 17.316078 1364.4375 17.5625 C 1273.4913 21.505489 1197.0982 57.199956 1135.2188 124.6875 C 1076.5961 188.62338 1047.6964 263.96059 1048.5312 350.65625 L 835.71875 433 C 797.77288 391.67699 749.96961 361.96416 692.3125 343.84375 C 604.96227 316.39162 520.95691 323.70366 440.25 365.8125 C 359.5432 407.92133 305.45225 472.64985 278 560 C 250.54783 647.35004 257.89117 731.38694 300 812.09375 C 342.10886 892.80075 406.83755 946.89147 494.1875 974.34375 C 576.9404 1000.3512 657.38873 994.58645 735.5625 957.09375 L 959.28125 1171.4375 L 972.375 1184.4062 C 966.2931 1198.3454 961.94845 1209.2226 959.34375 1217.0625 C 956.73915 1224.9024 953.7186 1236.224 950.25 1251.0312 L 711.03125 1285.1875 C 669.59175 1209.0324 607.72526 1157.2863 525.40625 1129.9375 C 438.51381 1101.0693 354.34933 1107.021 272.96875 1147.8125 C 191.58796 1188.6039 136.49335 1252.4513 107.625 1339.3438 C 78.756758 1426.2362 84.708528 1510.3694 125.5 1591.75 C 166.29138 1673.1307 230.1387 1728.2567 317.03125 1757.125 C 403.92369 1785.9933 488.05682 1780.0415 569.4375 1739.25 C 650.81799 1698.4587 705.94425 1634.6111 734.8125 1547.7188 C 737.41718 1539.8788 740.43763 1528.5573 743.90625 1513.75 L 983.125 1479.5938 C 1024.5644 1555.7487 1086.4309 1607.4948 1168.75 1634.8438 C 1255.6425 1663.7119 1339.8069 1657.7603 1421.1875 1616.9688 C 1502.5682 1576.1772 1557.6631 1512.3299 1586.5312 1425.4375 C 1615.3996 1338.5451 1609.4477 1254.4119 1568.6562 1173.0312 C 1527.8647 1091.6506 1464.0174 1036.5244 1377.125 1007.6562 C 1294.9259 980.34721 1214.5066 984.74084 1135.8438 1020.8125 L 1120.2812 1005.9062 L 898.0625 785.96875 C 902.79653 774.40321 906.33847 765.03422 908.5 758.15625 C 920.42249 720.22 925.7916 682.90194 924.59375 646.21875 L 1130.9688 566.34375 C 1141.2015 577.59424 1149.3796 586.0106 1155.4688 591.59375 C 1222.9566 653.47326 1302.1474 682.44278 1393.0938 678.5 C 1484.04 674.55731 1560.4642 638.83151 1622.3438 571.34375 C 1684.2232 503.85591 1713.1929 424.6337 1709.25 333.6875 C 1705.3072 242.74139 1669.5816 166.34819 1602.0938 104.46875 C 1538.8238 46.456824 1465.2625 17.347946 1381.375 17.1875 z "/></svg>',
        'lock': '<svg class="vzb-icon vzb-icon-lock" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M640 768h512v-192q0-106-75-181t-181-75-181 75-75 181v192zm832 96v576q0 40-28 68t-68 28h-960q-40 0-68-28t-28-68v-576q0-40 28-68t68-28h32v-192q0-184 132-316t316-132 316 132 132 316v192h32q40 0 68 28t28 68z"/></svg>',
        'unlock': '<svg class="vzb-icon vzb-icon-unlock" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1376 768q40 0 68 28t28 68v576q0 40-28 68t-68 28h-960q-40 0-68-28t-28-68v-576q0-40 28-68t68-28h32v-320q0-185 131.5-316.5t316.5-131.5 316.5 131.5 131.5 316.5q0 26-19 45t-45 19h-64q-26 0-45-19t-19-45q0-106-75-181t-181-75-181 75-75 181v320h736z"/></svg>',
        'unexpand': '<svg class="vzb-icon vzb-icon-unexpand" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M896 960v448q0 26-19 45t-45 19-45-19l-144-144-332 332q-10 10-23 10t-23-10l-114-114q-10-10-10-23t10-23l332-332-144-144q-19-19-19-45t19-45 45-19h448q26 0 45 19t19 45zm755-672q0 13-10 23l-332 332 144 144q19 19 19 45t-19 45-45 19h-448q-26 0-45-19t-19-45v-448q0-26 19-45t45-19 45 19l144 144 332-332q10-10 23-10t23 10l114 114q10 10 10 23z"/></svg>',
        'axes': '<svg class="vzb-icon vzb-icon-axes" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg"><path d="M430.25,379.655l-75.982-43.869v59.771H120.73V151.966h59.774l-43.869-75.983L92.767,0L48.898,75.983L5.029,151.966h59.775 v271.557c0,15.443,12.52,27.965,27.963,27.965h261.5v59.773l75.982-43.869l75.982-43.867L430.25,379.655z"/></svg>',
        'gear': '<svg class="vzb-icon vzb-icon-gear" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1152 896q0-106-75-181t-181-75-181 75-75 181 75 181 181 75 181-75 75-181zm512-109v222q0 12-8 23t-20 13l-185 28q-19 54-39 91 35 50 107 138 10 12 10 25t-9 23q-27 37-99 108t-94 71q-12 0-26-9l-138-108q-44 23-91 38-16 136-29 186-7 28-36 28h-222q-14 0-24.5-8.5t-11.5-21.5l-28-184q-49-16-90-37l-141 107q-10 9-25 9-14 0-25-11-126-114-165-168-7-10-7-23 0-12 8-23 15-21 51-66.5t54-70.5q-27-50-41-99l-183-27q-13-2-21-12.5t-8-23.5v-222q0-12 8-23t19-13l186-28q14-46 39-92-40-57-107-138-10-12-10-24 0-10 9-23 26-36 98.5-107.5t94.5-71.5q13 0 26 10l138 107q44-23 91-38 16-136 29-186 7-28 36-28h222q14 0 24.5 8.5t11.5 21.5l28 184q49 16 90 37l142-107q9-9 24-9 13 0 25 10 129 119 165 170 7 8 7 22 0 12-8 23-15 21-51 66.5t-54 70.5q26 50 41 98l183 28q13 2 21 12.5t8 23.5z"/></svg>',
        'stack': '<svg class="vzb-icon vzb-icon-stack" viewBox="0 0 54.849 54.849" xmlns="http://www.w3.org/2000/svg"><g><path d="M54.497,39.614l-10.363-4.49l-14.917,5.968c-0.537,0.214-1.165,0.319-1.793,0.319c-0.627,0-1.254-0.104-1.79-0.318     l-14.921-5.968L0.351,39.614c-0.472,0.203-0.467,0.524,0.01,0.716L26.56,50.81c0.477,0.191,1.251,0.191,1.729,0L54.488,40.33     C54.964,40.139,54.969,39.817,54.497,39.614z"/><path d="M54.497,27.512l-10.364-4.491l-14.916,5.966c-0.536,0.215-1.165,0.321-1.792,0.321c-0.628,0-1.256-0.106-1.793-0.321     l-14.918-5.966L0.351,27.512c-0.472,0.203-0.467,0.523,0.01,0.716L26.56,38.706c0.477,0.19,1.251,0.19,1.729,0l26.199-10.479     C54.964,28.036,54.969,27.716,54.497,27.512z"/><path d="M0.361,16.125l13.662,5.465l12.537,5.015c0.477,0.191,1.251,0.191,1.729,0l12.541-5.016l13.658-5.463     c0.477-0.191,0.48-0.511,0.01-0.716L28.277,4.048c-0.471-0.204-1.236-0.204-1.708,0L0.351,15.41     C-0.121,15.614-0.116,15.935,0.361,16.125z"/></g></svg>',
        'drag': '<svg class="vzb-icon vzb-icon-drag" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M896 384q-53 0-90.5 37.5t-37.5 90.5v128h-32v-93q0-48-32-81.5t-80-33.5q-46 0-79 33t-33 79v429l-32-30v-172q0-48-32-81.5t-80-33.5q-46 0-79 33t-33 79v224q0 47 35 82l310 296q39 39 39 102 0 26 19 45t45 19h640q26 0 45-19t19-45v-25q0-41 10-77l108-436q10-36 10-77v-246q0-48-32-81.5t-80-33.5q-46 0-79 33t-33 79v32h-32v-125q0-40-25-72.5t-64-40.5q-14-2-23-2-46 0-79 33t-33 79v128h-32v-122q0-51-32.5-89.5t-82.5-43.5q-5-1-13-1zm0-128q84 0 149 50 57-34 123-34 59 0 111 27t86 76q27-7 59-7 100 0 170 71.5t70 171.5v246q0 51-13 108l-109 436q-6 24-6 71 0 80-56 136t-136 56h-640q-84 0-138-58.5t-54-142.5l-308-296q-76-73-76-175v-224q0-99 70.5-169.5t169.5-70.5q11 0 16 1 6-95 75.5-160t164.5-65q52 0 98 21 72-69 174-69z"/></svg>',
        'warn': '<svg class="vzb-icon vzb-icon-warn" viewBox="0 0 512.209 512.209" xmlns="http://www.w3.org/2000/svg"><path d="M507.345,439.683L288.084,37.688c-3.237-5.899-7.71-10.564-13.429-13.988c-5.705-3.427-11.893-5.142-18.554-5.142   s-12.85,1.718-18.558,5.142c-5.708,3.424-10.184,8.089-13.418,13.988L4.859,439.683c-6.663,11.998-6.473,23.989,0.57,35.98   c3.239,5.517,7.664,9.897,13.278,13.128c5.618,3.237,11.66,4.859,18.132,4.859h438.529c6.479,0,12.519-1.622,18.134-4.859   c5.62-3.23,10.038-7.611,13.278-13.128C513.823,463.665,514.015,451.681,507.345,439.683z M292.655,411.132   c0,2.662-0.91,4.897-2.71,6.704c-1.807,1.811-3.949,2.71-6.427,2.71h-54.816c-2.474,0-4.616-0.899-6.423-2.71   c-1.809-1.807-2.713-4.042-2.713-6.704v-54.248c0-2.662,0.905-4.897,2.713-6.704c1.807-1.811,3.946-2.71,6.423-2.71h54.812   c2.479,0,4.62,0.899,6.428,2.71c1.803,1.807,2.71,4.042,2.71,6.704v54.248H292.655z M292.088,304.357   c-0.198,1.902-1.198,3.47-3.001,4.709c-1.811,1.238-4.046,1.854-6.711,1.854h-52.82c-2.663,0-4.947-0.62-6.849-1.854   c-1.908-1.243-2.858-2.807-2.858-4.716l-4.853-130.47c0-2.667,0.953-4.665,2.856-5.996c2.474-2.093,4.758-3.14,6.854-3.14h62.809   c2.098,0,4.38,1.043,6.854,3.14c1.902,1.331,2.851,3.14,2.851,5.424L292.088,304.357z"/></svg>',
        'pinIcon': '<svg class="vzb-icon" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M800 864v-448q0-14-9-23t-23-9-23 9-9 23v448q0 14 9 23t23 9 23-9 9-23zm672 352q0 26-19 45t-45 19h-429l-51 483q-2 12-10.5 20.5t-20.5 8.5h-1q-27 0-32-27l-76-485h-404q-26 0-45-19t-19-45q0-123 78.5-221.5t177.5-98.5v-512q-52 0-90-38t-38-90 38-90 90-38h640q52 0 90 38t38 90-38 90-90 38v512q99 0 177.5 98.5t78.5 221.5z"/></svg>'
    };
}.call(this));

(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/components/_gapminder/bubblesize/bubblesize.html');s.innerHTML = '<div class="vzb-bs-holder"> <input type="range" id="vzb-bs-slider" class="vzb-bs-slider" step="1"> </div> ';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/components/_gapminder/buttonlist/dialogs/axes-mc/axes-mc.html');s.innerHTML = '<div class="vzb-dialog-modal"> <span class="thumb-tack-class thumb-tack-class-ico-pin fa" data-dialogtype="axes-mc" data-click="pinDialog"></span> <span class="thumb-tack-class thumb-tack-class-ico-drag fa" data-dialogtype="axes-mc" data-click="dragDialog"></span> <div class="vzb-dialog-title"> <%=t ( "buttons/axes") %> </div> <div class="vzb-dialog-content"> <div class="vzb-yaxis-container"> <p class="vzb-dialog-sublabel"><%=t ( "hints/mount/maxYvalue") %></p> <br/> <form> <input type="radio" name="ymax" value="immediate"><%=t ( "mount/maxYmode/immediate") %> <input type="radio" name="ymax" value="latest"><%=t ( "mount/maxYmode/latest") %> </form> </div> <br/> <div class="vzb-xaxis-container"> <p class="vzb-dialog-sublabel"><%=t ( "hints/mount/logXstops") %></p> <br/> <form> <input type="checkbox" name="logstops" value="1">1 <input type="checkbox" name="logstops" value="2">2 <input type="checkbox" name="logstops" value="5">5 </form> </div> <br/> <p class="vzb-dialog-sublabel"><%=t ( "hints/mount/xlimits") %></p> <span class="vzb-xlimits-container"></span> <div class="vzb-povertyline-container"> <p><%=t ( "hints/mount/povertyline") %></p> <input type="text" class="vzb-povertyline-field" name="povertyline"> </div> </div> <div class="vzb-dialog-buttons"> <div data-click="closeDialog" class="vzb-dialog-button vzb-label-primary"> OK </div> </div> </div> ';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/components/_gapminder/buttonlist/dialogs/axes/axes.html');s.innerHTML = '<div class="vzb-dialog-modal"> <span class="thumb-tack-class thumb-tack-class-ico-pin fa" data-dialogtype="axes" data-click="pinDialog"></span> <span class="thumb-tack-class thumb-tack-class-ico-drag fa" data-dialogtype="axes" data-click="dragDialog"></span> <div class="vzb-dialog-title"> <%=t ( "buttons/axes") %> </div> <div class="vzb-dialog-content"> <p class="vzb-dialog-sublabel"><%=t ("buttons/axis_x") %></p> <div class="vzb-xaxis-container"></div> <p class="vzb-dialog-sublabel"><%=t ("buttons/axis_y") %></p> <div class="vzb-yaxis-container"></div> <div class="vzb-axes-options"></div> </div> <div class="vzb-dialog-buttons"> <div data-click="closeDialog" class="vzb-dialog-button vzb-label-primary"> OK </div> </div> </div> ';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/components/_gapminder/buttonlist/dialogs/colors/colors.html');s.innerHTML = '<div class="vzb-dialog-modal"> <span class="thumb-tack-class thumb-tack-class-ico-pin fa" data-dialogtype="colors" data-click="pinDialog"></span> <span class="thumb-tack-class thumb-tack-class-ico-drag fa" data-dialogtype="colors" data-click="dragDialog"></span> <div class="vzb-dialog-title"> <%=t ( "buttons/colors") %> </div> <div class="vzb-dialog-content"> <span class="vzb-caxis-container"></span> <div class="vzb-clegend-container"></div> </div> <div class="vzb-dialog-buttons"> <div data-click="closeDialog" class="vzb-dialog-button vzb-label-primary"> OK </div> </div> </div> ';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/components/_gapminder/buttonlist/dialogs/find/find.html');s.innerHTML = '<div class="vzb-dialog-modal"> <span class="thumb-tack-class thumb-tack-class-ico-pin fa" data-dialogtype="find" data-click="pinDialog"></span> <span class="thumb-tack-class thumb-tack-class-ico-drag fa" data-dialogtype="find" data-click="dragDialog"></span> <div class="vzb-dialog-title"> <%=t ( "buttons/find") %> </div> <div class="vzb-dialog-content vzb-find-filter"> <input id="vzb-find-search" class="vzb-dialog-input" type="text" placeholder="Search..."/> </div> <div class="vzb-dialog-content vzb-dialog-content-fixed"> <div class="vzb-find-list">  </div> </div> <div class="vzb-dialog-buttons"> <div class="vzb-dialog-bubbleopacity vzb-dialog-control"></div> <div id="vzb-find-deselect" class="vzb-dialog-button"> <%=t ( "buttons/deselect") %> </div> <div data-click="closeDialog" class="vzb-dialog-button vzb-label-primary"> <%=t ( "buttons/ok") %> </div> </div> </div> ';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/components/_gapminder/buttonlist/dialogs/moreoptions/moreoptions.html');s.innerHTML = '<div class="vzb-dialog-modal"> <span class="thumb-tack-class thumb-tack-class-ico-pin fa" data-dialogtype="moreoptions" data-click="pinDialog"></span> <span class="thumb-tack-class thumb-tack-class-ico-drag fa" data-dialogtype="moreoptions" data-click="dragDialog"></span> <div class="vzb-dialog-title"> <%=t ("buttons/more_options") %> </div> <div class="vzb-dialog-content"> <p class="vzb-dialog-sublabel"><%=t ("buttons/opacityRegular") %></p> <div class="vzb-dialog-bubbleopacity-regular"></div> <p class="vzb-dialog-sublabel"><%=t ("buttons/opacityNonselect") %></p> <div class="vzb-dialog-bubbleopacity-selectdim"></div> <div class="vzb-dialog-br"></div> <p class="vzb-dialog-sublabel"><%=t ("buttons/axis_x") %></p> <div class="vzb-xaxis-container"></div> <p class="vzb-dialog-sublabel"><%=t ("buttons/axis_y") %></p> <div class="vzb-yaxis-container"></div> <div class="vzb-axes-options"></div> <div class="vzb-dialog-br"></div> <p class="vzb-dialog-sublabel"><%=t ("buttons/size") %></p> <div class="vzb-saxis-container"></div> <p class="vzb-dialog-sublabel"><%=t ( "hints/bubbl/setminsize") %></p> <div class="vzb-dialog-bubblesize-min"></div> <p class="vzb-dialog-sublabel"><%=t ( "hints/bubbl/setmaxsize") %></p> <div class="vzb-dialog-bubblesize-max"></div> <div class="vzb-dialog-br"></div> <p class="vzb-dialog-sublabel"><%=t ("buttons/colors") %></p> <div class="vzb-caxis-container"></div> <div class="vzb-clegend-container"></div> </div> <div class="vzb-dialog-buttons"> <div data-click="closeDialog" class="vzb-dialog-button vzb-label-primary"> OK </div> </div> </div> ';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/components/_gapminder/buttonlist/dialogs/size/size.html');s.innerHTML = '<div class="vzb-dialog-modal"> <span class="thumb-tack-class thumb-tack-class-ico-pin fa" data-dialogtype="size" data-click="pinDialog"></span> <span class="thumb-tack-class thumb-tack-class-ico-drag fa" data-dialogtype="size" data-click="dragDialog"></span> <div class="vzb-dialog-title"> <%=t ( "buttons/size") %> </div> <div class="vzb-dialog-content"> <div class="vzb-saxis-container"></div> <p class="vzb-dialog-sublabel"><%=t ( "hints/bubbl/setminsize") %></p> <div class="vzb-dialog-bubblesize-min"></div> <p class="vzb-dialog-sublabel"><%=t ( "hints/bubbl/setmaxsize") %></p> <div class="vzb-dialog-bubblesize-max"></div> </div> <div class="vzb-dialog-buttons"> <div data-click="closeDialog" class="vzb-dialog-button vzb-label-primary"> OK </div> </div> </div> ';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/components/_gapminder/buttonlist/dialogs/stack/stack.html');s.innerHTML = '<div class="vzb-dialog-modal"> <span class="thumb-tack-class thumb-tack-class-ico-pin fa" data-dialogtype="stack" data-click="pinDialog"></span> <span class="thumb-tack-class thumb-tack-class-ico-drag fa" data-dialogtype="stack" data-click="dragDialog"></span> <div class="vzb-dialog-title"> <%=t ( "buttons/stack") %> </div> <div class="vzb-dialog-content"> <p><%=t ( "hints/mount/howtostack") %></p> <br/> <form id="vzb-howtostack"> <input type="radio" name="stack" value="geo.region"><%=t ( "mount/stacking/region") %> <input type="radio" name="stack" value="all"><%=t ( "mount/stacking/world") %> <input type="radio" name="stack" value="none"><%=t ( "mount/stacking/none") %> </form> <br/><br/> <form id="vzb-merge-grouped"> <input type="checkbox" name="mergeGrouped"><%=t ( "mount/mergegrouped") %> </form> <br/><br/> <form id="vzb-merge-stacked"> <input type="checkbox" name="mergeStacked"><%=t ( "mount/mergestacked") %> </form> <br/><br/> <form id="vzb-manual-sorting"> <%=t ( "mount/manualSorting") %><br/> <div class="vzb-dialog-draggablelist vzb-dialog-control"></div> </form> </div> <div class="vzb-dialog-buttons"> <div data-click="closeDialog" class="vzb-dialog-button vzb-label-primary"> OK </div> </div> </div> ';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/components/_gapminder/timeslider/timeslider.html');s.innerHTML = '<div class="vzb-timeslider vzb-ts-loading"> <div class="vzb-ts-slider-wrapper"> <svg class="vzb-ts-slider"> <g> <g class="vzb-ts-slider-axis"></g> <g class="vzb-ts-slider-slide"> <circle class="vzb-ts-slider-handle"></circle> <text class="vzb-ts-slider-value"></text> </g> </g> </svg> </div>  <div class="vzb-ts-btns"> <button class="vzb-ts-btn-loading vzb-ts-btn"> <div class="vzb-loader"></div> </button> <button class="vzb-ts-btn-play vzb-ts-btn"> <svg class="vzb-icon vzb-icon-play" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"> <path d="M1576 927l-1328 738q-23 13-39.5 3t-16.5-36v-1472q0-26 16.5-36t39.5 3l1328 738q23 13 23 31t-23 31z"/> </svg> </button> <button class="vzb-ts-btn-pause vzb-ts-btn"> <svg class="vzb-icon vzb-icon-pause" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"> <path d="M1664 192v1408q0 26-19 45t-45 19h-512q-26 0-45-19t-19-45v-1408q0-26 19-45t45-19h512q26 0 45 19t19 45zm-896 0v1408q0 26-19 45t-45 19h-512q-26 0-45-19t-19-45v-1408q0-26 19-45t45-19h512q26 0 45 19t19 45z"/> </svg> </button> </div> </div> ';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/tools/barchart/barchart.html');s.innerHTML = ' <svg class="vzb-barchart"> <g class="vzb-bc-graph"> <g class="vzb-bc-bars"></g> <g class="vzb-bc-bar-labels"></g> <g class="vzb-bc-axis-y-title"></g> <g class="vzb-bc-axis-x-title"></g> <g class="vzb-bc-axis-x"></g> <g class="vzb-bc-axis-y"></g> <g class="vzb-bc-axis-labels">  </g> </g> </svg> ';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/tools/bubblechart/bubblechart.html');s.innerHTML = ' <div class="vzb-bubblechart"> <svg class="vzb-bubblechart-svg"> <g class="vzb-bc-graph"> <text class="vzb-bc-year"></text> <svg class="vzb-bc-axis-x"> <g></g> </svg> <svg class="vzb-bc-axis-y"> <g></g> </svg> <line class="vzb-bc-projection-x"></line> <line class="vzb-bc-projection-y"></line> <svg class="vzb-bc-bubbles-crop"> <g class="vzb-bc-lines"></g> <g class="vzb-bc-trails"></g> <g class="vzb-bc-bubbles"></g> <g class="vzb-bc-labels"></g> </svg> <g class="vzb-bc-axis-y-title"></g> <g class="vzb-bc-axis-x-title"></g> <g class="vzb-bc-axis-s-title"></g> <g class="vzb-bc-axis-c-title"></g> <g class="vzb-bc-axis-y-info"> <circle></circle> <text>?</text> </g> <g class="vzb-bc-axis-x-info"> <circle></circle> <text>?</text> </g> <g class="vzb-data-warning"> <svg></svg> <text></text> </g> <rect class="vzb-bc-zoomRect"></rect> <g class="vzb-bc-tooltip vzb-hidden"> <rect class="vzb-bc-tooltip-border"></rect> <text class="vzb-bc-tooltip-text"></text> </g> </g> <filter id="vzb-bc-blur-effect"> <feGaussianBlur stdDeviation="2"/> </filter> </svg>  <div class="vzb-tooltip vzb-hidden vzb-tooltip-mobile"></div> </div> ';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/tools/linechart/linechart.html');s.innerHTML = ' <div class="vzb-linechart"> <svg class="vzb-lc-graph"> <g> <g class="vzb-lc-axis-x"></g> <text class="vzb-lc-axis-x-value"></text> <text class="vzb-lc-axis-y-value"></text> <svg class="vzb-lc-lines"></svg> <g class="vzb-lc-axis-y"></g> <line class="vzb-lc-projection-x"></line> ; <line class="vzb-lc-projection-y"></line> ; <g class="vzb-lc-labels"> <line class="vzb-lc-vertical-now"></line> ; </g> <g class="vzb-lc-axis-y-title"></g> <g class="vzb-lc-axis-x-title"></g> </g>  </svg> <div class="vzb-tooltip vzb-hidden"></div> </div> ';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/tools/mountainchart/mountainchart.html');s.innerHTML = ' <div class="vzb-mountainchart"> <svg class="vzb-mountainchart-svg"> <g class="vzb-mc-graph"> <rect class="vzb-mc-eventarea"></rect> <text class="vzb-mc-year"></text> <g class="vzb-mc-mountains-mergestacked"></g> <g class="vzb-mc-mountains-mergegrouped"></g> <g class="vzb-mc-mountains"></g> <g class="vzb-mc-mountains-labels"></g> <g class="vzb-mc-axis-y-title"> <text></text> </g> <g class="vzb-mc-axis-x-title"> <text></text> </g> <g class="vzb-mc-axis-info"> <circle></circle> <text>?</text> </g> <g class="vzb-data-warning"> <svg></svg> <text></text> </g> <g class="vzb-mc-axis-x"></g> <g class="vzb-mc-axis-labels"></g> <g class="vzb-mc-povertyline"> <text class="vzb-shadow vzb-mc-povertyline-valueUL"></text> <text class="vzb-shadow vzb-mc-povertyline-valueUR"></text> <text class="vzb-shadow vzb-mc-povertyline-valueDL"></text> <text class="vzb-shadow vzb-mc-povertyline-valueDR"></text> <text class="vzb-mc-povertyline-valueUL"></text> <text class="vzb-mc-povertyline-valueUR"></text> <text class="vzb-mc-povertyline-valueDL"></text> <text class="vzb-mc-povertyline-valueDR"></text> <text class="vzb-mc-povertyline-extremepoverty"></text> <line></line> </g> <g class="vzb-mc-tooltip vzb-hidden"> <rect class="vzb-bc-tooltip-border"></rect> <text class="vzb-bc-tooltip-text"></text> </g> </g> </svg> </div>';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/tools/popbyage/popbyage.html');s.innerHTML = ' <svg class="vzb-popbyage"> <g class="vzb-bc-header"> <text class="vzb-bc-title"></text> <text class="vzb-bc-year"></text> </g> <g class="vzb-bc-graph"> <g class="vzb-bc-bars"></g> <g class="vzb-bc-labels"></g> <text class="vzb-bc-axis-y-title"></text> <g class="vzb-bc-axis-x"></g> <g class="vzb-bc-axis-y"></g> <g class="vzb-bc-axis-labels">  </g> </g> </svg> ';root.document.body.appendChild(s);}).call(this);
/*!
 * VIZABI BUBBLE OPACITY CONTROL
 * Reusable OPACITY SLIDER
 */

(function () {

  "use strict";

  var Vizabi = this.Vizabi;
  var utils = Vizabi.utils;

  if (!Vizabi._require('d3')) return;

  Vizabi.Component.extend('gapminder-bubbleopacity', {

    init: function (config, context) {
      this.template = '<div class="vzb-bo-holder"><input type="range" id="vzb-bo-slider" class="vzb-bo-slider" step="1"></div>';

      this.model_expects = [{
        name: "entities",
        type: "entities"
      }];

      var _this = this;

      this.arg = config.arg;

      this.model_binds = {
        "change:entities:select": function (evt) {
          _this.updateView();
        }
      }
      this.model_binds["change:entities:" + this.arg] = function (evt) {
        _this.updateView();
      }


      //contructor is the same as any component
      this._super(config, context);
    },

    /**
     * Executes after the template is loaded and rendered.
     * Ideally, it contains HTML instantiations related to template
     * At this point, this.element and this.placeholder are available as a d3 object
     */
    readyOnce: function () {
      var _this = this;
      this.element = d3.select(this.element);
      this.slider = this.element.selectAll('#vzb-bo-slider');

      this.elementSize = this.element.node().getBoundingClientRect();
      this.sliderSize = this.slider.node().getBoundingClientRect();
      this.slider.style('left', (this.elementSize.left - this.sliderSize.left) + 'px');

      this.slider
        .attr('min', 0)
        .attr('max', 1)
        .attr('step', 0.1)
        .on('input', function () {
          _this._setModel();
        });

      this.updateView();
    },

    updateView: function () {
      var someSelected = this.model.entities.select.length;
      var value = this.model.entities[this.arg];

      this.slider.attr('value', value);
    },

    _setModel: function () {
      this.model.entities[this.arg] = +d3.event.target.value;
    }

  });


}).call(this);

/*!
 * VIZABI BUBBLE SIZE slider
 * Reusable bubble size slider
 */

(function () {

  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;

  //warn client if d3 is not defined
  if (!Vizabi._require('d3')) {
    return;
  }

  var min = 0.1, max = 100;

  Vizabi.Component.extend('gapminder-bubblesize', {

    /**
     * Initializes the timeslider.
     * Executed once before any template is rendered.
     * @param config The options passed to the component
     * @param context The component's parent
     */
    init: function (config, context) {
      this.template = this.template || "src/components/_gapminder/bubblesize/bubblesize.html";

      this.model_expects = [{
        name: "size",
        type: "size"
      }];

      this.field = config.field || 'max';

      var _this = this;
      this.model_binds = {
        'change:size': function(evt) {
          if(evt.indexOf(_this.field) > -1) {
            _this.sliderEl.node().value = _this.model.size[_this.field];
          }
        }
      };

      //contructor is the same as any component
      this._super(config, context);
    },

    /**
     * Executes after the template is loaded and rendered.
     * Ideally, it contains HTML instantiations related to template
     * At this point, this.element and this.placeholder are available as a d3 object
     */
    readyOnce: function () {
      var value = this.model.size[this.field],
        _this = this;
      this.element = d3.select(this.element);
      this.indicatorEl = this.element.select('#vzb-bs-indicator');
      this.sliderEl = this.element.selectAll('#vzb-bs-slider');

      this.sliderEl
        .attr('min', 0)
        .attr('max', 1)
        .attr('step', 0.01)
        .attr('value', value)
        .on('input', function () {
          _this.slideHandler();
        });
    },

    modelReady: function () {
      this.indicatorEl.text(this.model.size[this.field]);
    },

    slideHandler: function () {
      this._setValue(+d3.event.target.value);
    },

    /**
     * Sets the current value in model. avoid updating more than once in framerate
     * @param {number} value
     */
    _setValue: function (value) {
      var frameRate = 50;

      //implement throttle
      //TODO: use utils.throttle
      var now = new Date();
      if (this._updTime != null && now - this._updTime < frameRate) return;
      this._updTime = now;

      this.model.size[this.field] = value;
    }
  });

}).call(this);

/*!
 * VIZABI BUTTONLIST
 * Reusable buttonlist component
 */

(function () {

  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;
  var Promise = Vizabi.Promise;
  var utils = Vizabi.utils;
  var iconset = Vizabi.iconset;

  //warn client if d3 is not defined
  if (!Vizabi._require('d3')) {
    return;
  }

  //default existing buttons
  var class_active = "vzb-active";
  var class_active_locked = "vzb-active-locked";
  var class_unavailable = "vzb-unavailable";
  var class_vzb_fullscreen = "vzb-force-fullscreen";

  Vizabi.Component.extend('gapminder-buttonlist', {

    /**
     * Initializes the buttonlist
     * @param config component configuration
     * @param context component context (parent)
     */
    init: function (config, context) {

      //set properties
      var _this = this;
      this.name = 'buttonlist';
      this.template = '<div class="vzb-buttonlist"></div>';

      this.model_expects = [{
        name: "state",
        type: "model"
      }, {
        name: "ui",
        type: "model"
      }, {
        name: "language",
        type: "language"
      }];

      this._available_buttons = {
        'find': {
          title: "buttons/find",
          icon: "search",
          dialog: true,
          ispin:false
        },
        'moreoptions': {
          title: "buttons/more_options",
          icon: "gear",
          dialog: true,
          ispin:false
        },
        'colors': {
          title: "buttons/colors",
          icon: "paint-brush",
          dialog: true,
          ispin:false
        },
        'size': {
          title: "buttons/size",
          icon: "circle",
          dialog: true,
          ispin:false
        },
        'fullscreen': {
          title: "buttons/expand",
          icon: "expand",
          dialog: false,
          func: this.toggleFullScreen.bind(this)
        },
        'trails': {
          title: "buttons/trails",
          icon: "trails",
          dialog: false,
          func: this.toggleBubbleTrails.bind(this)
        },
        'lock': {
          title: "buttons/lock",
          icon: "lock",
          dialog: false,
          func: this.toggleBubbleLock.bind(this)
        },
        'axes': {
          title: "buttons/axes",
          icon: "axes",
          dialog: true,
          ispin:false
        },
        'axes-mc': {
          title: "buttons/axes-mc",
          icon: "axes",
          dialog: true,
          ispin:false
        },
        'stack': {
          title: "buttons/stack",
          icon: "stack",
          dialog: true,
          ispin:false
        },
        '_default': {
          title: "Button",
          icon: "asterisk",
          dialog: false
        }
      };

      this._active_comp = false;

      this.model_binds = {
        "change:state:entities:select": function () {
          if (!_this._readyOnce) return;

          if (_this.model.state.entities.select.length === 0) {
            _this.model.state.time.lockNonSelected = 0;
          }
          _this.setBubbleTrails();
          _this.setBubbleLock();


          //scroll button list to end if bottons appeared or disappeared
          if (_this.entitiesSelected_1 !== (_this.model.state.entities.select.length > 0)) {
            _this.scrollToEnd();
          }
          _this.entitiesSelected_1 = _this.model.state.entities.select.length > 0;
        }
      }

      this._super(config, context);

    },

    readyOnce: function () {

      var _this = this;

      this.element = d3.select(this.element);
      this.buttonContainerEl = this.element.append("div")
        .attr("class", "vzb-buttonlist-container-buttons");
      this.dialogContainerEl = this.element.append("div")
        .attr("class", "vzb-buttonlist-container-dialogs");

      //add buttons and render components
      if (this.model.ui.buttons) {
        this._addButtons();
      }

      var buttons = this.element.selectAll(".vzb-buttonlist-btn");

      //activate each dialog when clicking the button
      buttons.on('click', function () {
        d3.event.preventDefault();
        d3.event.stopPropagation();
        var btn = d3.select(this),
          id = btn.attr("data-btn"),
          classes = btn.attr("class"),
          btn_config = _this._available_buttons[id];

        //if it's a dialog, open
        if (btn_config && btn_config.dialog) {
          //close if it's open
          if (classes.indexOf(class_active) !== -1) {
            _this.closeDialog(id);
          } else {
            _this.openDialog(id);
          }
        }
        //otherwise, execute function
        else if (btn_config.func) {
          btn_config.func(id);
        }

      });

      var close_buttons = this.element.selectAll("[data-click='closeDialog']");
      close_buttons.on('click', function () {
        _this.closeAllDialogs(true);
      });
      var pinDialog = this.element.selectAll("[data-click='pinDialog']");
      pinDialog.on('click', function () {
        _this.pinDialog(this);
      });

       d3.selectAll(".vzb-buttonlist-container-dialogs").on('click', function(){
         d3.event.stopPropagation();
       });

      this.root.element.addEventListener('click', function(){
        _this.closeAllDialogs();
      });

      //store body overflow
      this._prev_body_overflow = document.body.style.overflow;

      this.setBubbleTrails();
      this.setBubbleLock();

      d3.select(this.root.element).on("mousedown", function (e) {
        if(!this._active_comp) return; //don't do anything if nothing is open

  			var target = d3.event.target;
        var closeDialog = true;
  			while (target)
  			{
          if(target.classList.contains("vzb-dialog-modal"))
          {
            closeDialog = false;
            break;
          }
  				target = target.parentElement;
  			}
  			if(closeDialog)
        {
          _this.closeAllDialogs();
        }
  		});
    },


    /*
     * adds buttons configuration to the components and template_data
     * @param {Array} button_list list of buttons to be added
     */
    _addButtons: function () {

      this._components_config = [];
      var button_list = this.model.ui.buttons;
      var details_btns = [];
      if (!button_list.length) return;
      //add a component for each button
      for (var i = 0; i < button_list.length; i++) {

        var btn = button_list[i];
        var btn_config = this._available_buttons[btn];

        //if it's a dialog, add component
        if (btn_config && btn_config.dialog) {
          var comps = this._components_config;

          //add corresponding component
          comps.push({
            component: 'gapminder-buttonlist-' + btn,
            placeholder: '.vzb-buttonlist-dialog[data-btn="' + btn + '"]',
            model: ["state", "ui", "language"]
          });

          btn_config.component = comps.length - 1;
        }

        //add template data
        var d = (btn_config) ? btn : "_default";
        var details_btn = this._available_buttons[d];

        details_btn.id = btn;
        details_btn.icon = iconset[details_btn.icon];
        details_btns.push(details_btn);
      }
      ;

      var t = this.getTranslationFunction(true);

      this.buttonContainerEl.selectAll('button').data(details_btns)
        .enter().append("button")
        .attr('class', 'vzb-buttonlist-btn')
        .attr('data-btn', function (d) {
          return d.id;
        })
        .html(function (btn) {
          return "<span class='vzb-buttonlist-btn-icon fa'>" +
            btn.icon + "</span><span class='vzb-buttonlist-btn-title'>" +
            t(btn.title) + "</span>";
        });

      this.dialogContainerEl.selectAll('div').data(details_btns)
        .enter().append("div")
        .attr('class', 'vzb-buttonlist-dialog')
        .attr('data-btn', function (d) {
          return d.id;
        });

      this.loadComponents();

      var _this = this;
      //render each subcomponent
      utils.forEach(this.components, function (subcomp) {
        subcomp.render();
        _this.on('resize', function () {
          subcomp.trigger('resize');
        });
      });
    },


    scrollToEnd: function () {
      var target = 0;
      var parent = d3.select(".vzb-tool");

      if (parent.classed("vzb-portrait") && parent.classed("vzb-small")) {
        if (this.model.state.entities.select.length > 0) target = this.buttonContainerEl[0][0].scrollWidth
        this.buttonContainerEl[0][0].scrollLeft = target;
      } else {
        if (this.model.state.entities.select.length > 0) target = this.buttonContainerEl[0][0].scrollHeight
        this.buttonContainerEl[0][0].scrollTop = target;
      }
    },


    /*
     * RESIZE:
     * Executed whenever the container is resized
     * Ideally, it contains only operations related to size
     */
    resize: function () {
      //TODO: what to do when resizing?
    },

    //TODO: make opening/closing a dialog via update and model
    /*
     * Activate a button dialog
     * @param {String} id button id
     */
    openDialog: function (id) {

        this.closeAllDialogs(true);

      var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']"),
        dialog = this.element.selectAll(".vzb-buttonlist-dialog[data-btn='" + id + "']");

      this._active_comp = this.components[this._available_buttons[id].component];

      this._active_comp.beforeOpen();
      //add classes
      btn.classed(class_active, true);
      dialog.classed(class_active, true);

      //call component function
      this._active_comp.open();
    },


      pinDialog: function (button) {
        var id = typeof button === 'string' ? button : button.getAttribute('data-dialogtype');
        var btn = this.element.select(".vzb-buttonlist-btn[data-btn='" + id + "']");
        var dialog = this.element.select(".vzb-buttonlist-dialog[data-btn='" + id + "']");
        if (this._available_buttons[id].ispin) {
         // button.textContent = '';
          btn.classed('pinned', false);
          this.element.select(".vzb-buttonlist-dialog[data-btn='" + id + "']").classed('pinned', false);
          this._available_buttons[id].ispin = false;
          this._active_comp.isPin = false;
        } else {
        //  button.textContent = '';
          btn.classed('pinned', true);
          dialog.classed('pinned', true);
          this._available_buttons[id].ispin = true;
          this._active_comp.isPin = true;
        }
      },


    /*
     * Closes a button dialog
     * @param {String} id button id
     */
    closeDialog: function (id) {

      var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']"),
        dialog = this.element.selectAll(".vzb-buttonlist-dialog[data-btn='" + id + "']");

      if (this._available_buttons[id].ispin)
        this.pinDialog(id);

      if (this._active_comp) {
        this._active_comp.beforeClose();
      }
      //remove classes
      btn.classed(class_active, false);
      dialog.classed(class_active, false);

      //call component close function
      if (this._active_comp) {
        this._active_comp.close();
      }
      this._active_comp = false;
    },

    /*
     * Close all dialogs
     */
    closeAllDialogs: function (forceclose) {
      //remove classes
      var btnClass = forceclose ? ".vzb-buttonlist-btn" : ".vzb-buttonlist-btn:not(.pinned)"
      var dialogClass = forceclose ? ".vzb-buttonlist-dialog" : ".vzb-buttonlist-dialog:not(.pinned)"
      var all_btns = this.element.selectAll(btnClass),
        all_dialogs = this.element.selectAll(dialogClass);
      if (forceclose)
        this.unpinAllDialogs();

      if (this._active_comp && (forceclose || !this._available_buttons[this._active_comp.name].ispin)) {
        this._active_comp.beforeClose();
      }

      all_btns.classed(class_active, false);
      all_dialogs.classed(class_active, false);

      //call component close function
      if (this._active_comp && (forceclose || !this._available_buttons[this._active_comp.name].ispin)) {
        this._active_comp.close();
      }
      if (this._active_comp && !this._available_buttons[this._active_comp.name].ispin)
        this._active_comp = false;

      this.model.state.entities.setNeedUpdate();
    },

    unpinAllDialogs: function () {
      var availBtns = this._available_buttons;
      var keys = Object.keys(availBtns);
      keys.forEach(function (dialogName) {
        if (availBtns[dialogName].ispin)
          this.pinDialog(dialogName);
      }.bind(this));
    },

    toggleBubbleTrails: function () {
      this.model.state.time.trails = !this.model.state.time.trails;
      this.setBubbleTrails();
    },
    setBubbleTrails: function () {
      var id = "trails";
      var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']");

      btn.classed(class_active_locked, this.model.state.time.trails);
      btn.style("display", this.model.state.entities.select.length == 0 ? "none" : "inline-block")
    },
    toggleBubbleLock: function (id) {
      if (this.model.state.entities.select.length == 0) return;

      var timeFormatter = d3.time.format(this.model.state.time.formatInput);
      var locked = this.model.state.time.lockNonSelected;
      locked = locked ? 0 : timeFormatter(this.model.state.time.value);
      this.model.state.time.lockNonSelected = locked;

      this.setBubbleLock();
    },
    setBubbleLock: function () {
      var id = "lock";
      var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']");
      var translator = this.model.language.getTFunction();

      var locked = this.model.state.time.lockNonSelected;

      btn.classed(class_unavailable, this.model.state.entities.select.length == 0);
      btn.style("display", this.model.state.entities.select.length == 0 ? "none" : "inline-block")

      btn.classed(class_active_locked, locked)
      btn.select(".vzb-buttonlist-btn-title")
        .text(locked ? locked : translator("buttons/lock"));

      btn.select(".vzb-buttonlist-btn-icon")
        .html(iconset[locked ? "lock" : "unlock"]);
    },
    toggleFullScreen: function (id) {

      var component = this;
      var pholder = component.placeholder;
      var pholder_found = false;
      var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']");
      var fs = !this.model.ui.fullscreen;
      var body_overflow = (fs) ? "hidden" : this._prev_body_overflow;

      while (!(pholder_found = utils.hasClass(pholder, 'vzb-placeholder'))) {
        component = this.parent;
        pholder = component.placeholder;
      }

      //TODO: figure out a way to avoid fullscreen resize delay in firefox
      if (fs) {
        launchIntoFullscreen(pholder);
        subscribeFullscreenChangeEvent.call(this, this.toggleFullScreen.bind(this, id));
      } else {
        exitFullscreen.call(this);
      }

      utils.classed(pholder, class_vzb_fullscreen, fs);
      this.model.ui.fullscreen = fs;
      var translator = this.model.language.getTFunction();
      btn.classed(class_active_locked, fs);

      btn.select(".vzb-buttonlist-btn-icon").html(iconset[fs ? "unexpand" : "expand"]);
      btn.select(".vzb-buttonlist-btn-title").text(
        translator("buttons/" + (fs ? "unexpand" : "expand"))
      );

      //restore body overflow
      document.body.style.overflow = body_overflow;

      //force window resize event
      (function () {
        event = root.document.createEvent("HTMLEvents");
        event.initEvent("resize", true, true);
        event.eventName = "resize";
        root.dispatchEvent(event);
      })();

    }

  });

  function isFullscreen() {
    if (root.document.webkitIsFullScreen !== undefined)
      return root.document.webkitIsFullScreen;
    if (root.document.mozFullScreen !== undefined)
      return root.document.mozFullScreen;
    if (root.document.msFullscreenElement !== undefined)
      return root.document.msFullscreenElement;

    return false;
  }

  function exitHandler(emulateClickFunc)
  {
    if (!isFullscreen())
    {
      emulateClickFunc();
    }
  }

  function subscribeFullscreenChangeEvent(exitFunc) {
    var doc = root.document;

    this.exitFullscreenHandler = exitHandler.bind(this, exitFunc);
    doc.addEventListener('webkitfullscreenchange', this.exitFullscreenHandler, false);
    doc.addEventListener('mozfullscreenchange', this.exitFullscreenHandler, false);
    doc.addEventListener('fullscreenchange', this.exitFullscreenHandler, false);
    doc.addEventListener('MSFullscreenChange', this.exitFullscreenHandler, false);
  }

  function removeFullscreenChangeEvent() {
    var doc = root.document;

    doc.removeEventListener('webkitfullscreenchange', this.exitFullscreenHandler);
    doc.removeEventListener('mozfullscreenchange', this.exitFullscreenHandler);
    doc.removeEventListener('fullscreenchange', this.exitFullscreenHandler);
    doc.removeEventListener('MSFullscreenChange', this.exitFullscreenHandler);
  }

  function launchIntoFullscreen(elem) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    }
  }

  function exitFullscreen() {
    removeFullscreenChangeEvent.call(this);

    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }

}).call(this);

/*!
 * VIZABI DIALOG
 * Reusable Dialog component
 */

(function () {

  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;
  var iconset = Vizabi.iconset;

  //warn client if d3 is not defined
  if (!Vizabi._require('d3')) {
    return;
  }

  Vizabi.Component.extend('gapminder-buttonlist-dialog', {
    /**
     * Initializes the dialog
     * @param {Object} config Initial config, with name and placeholder
     * @param {Object} parent Reference to tool
     */
    init: function (config, parent) {
      this.name = this.name || '';

      this.model_expects = this.model_expects || [{
          name: "state",
          type: "model"
        }, {
          name: "ui",
          type: "model"
        }, {
          name: "language",
          type: "language"
        }];

      this.template = 'src/components/_gapminder/buttonlist/' +
        'dialogs/' + this.name + '/' + this.name + '.html';

      this._super(config, parent);
    },

    /**
     * Executed when the dialog has been rendered
     */
    readyOnce: function () {
      this.element = d3.select(this.element);
    },

    ready: function () {
      var _this = this;
      this.placeholderEl = d3.select(this.placeholder);
      this.rootEl = d3.select(this.root.element);
      this.dragHandler = this.placeholderEl.select("[data-click='dragDialog']");
      this.dragHandler.html(iconset['drag']);
      this.pinIcon = this.placeholderEl.select("[data-click='pinDialog']");
      this.pinIcon.html(iconset['pinIcon']);

      var dg = dialogDrag(this.placeholderEl, d3.select('.vzb-tool-content'), 75);
      var dragBehavior = d3.behavior.drag()
        .on('dragstart', function D3dialogDragStart() {
          if (_this.rootEl.classed('vzb-portrait') || _this.isPin)
            return;
          dg.dragStart(d3.event);
        })
        .on('drag', function D3dialogDrag() {
          if (_this.rootEl.classed('vzb-portrait') || _this.isPin)
            return;
          dg.drag(d3.event);
        });
      this.dragHandler.call(dragBehavior);
    },

    resize: function () {
      if (this.placeholderEl) {
        var chartWidth = -parseInt(this.parent.parent.components[0].width, 10);
        var dialogLeft = parseInt(this.placeholderEl.style('left'), 10);
        if (utils.isNumber(dialogLeft) && dialogLeft < chartWidth) {
          this.placeholderEl.style('left', chartWidth + 'px');
          if (this.leftPos) {
            this.leftPos = chartWidth + 'px';
          }
        }
        if (this.rootEl.classed('vzb-portrait')) {
          this.leftPos = null;
          this.topPos = null;
          this.placeholderEl.attr('style', '');
        }
      }
    },

    beforeOpen: function () {
      var _this = this;

      this.transitionEvents = ['webkitTransitionEnd', 'transitionend', 'msTransitionEnd', 'oTransitionEnd'];
      this.transitionEvents.forEach(function (event) {
        _this.placeholderEl.on(event, _this.transitionEnd.bind(_this, event));
      });
      if (this.leftPos && !this.rootEl.classed('vzb-portrait')) {
        this.placeholderEl.style('left', this.leftPos);
      }
      if (this.rootEl.classed('vzb-portrait')) {
        this.placeholderEl.style('top', ''); // issues: 369 & 442
      }
    },

    /**
     * User has clicked to open this dialog
     */
    open: function () {
      this.isOpen = true;
      if (this.topPos && !this.rootEl.classed('vzb-portrait')) {
        this.placeholderEl.style('top', this.topPos);
      }
    },

    beforeClose: function () {
      if (this.rootEl.classed('vzb-portrait')) {
        this.placeholderEl.style('top', 'auto'); // issues: 369 & 442
      }
      this.placeholderEl.classed('notransition', false);
      this.placeholderEl.node().offsetHeight; // trigger a reflow (flushing the css changes)
    },

    /**
     * User has closed this dialog
     */
    close: function () {
      if (this.isOpen || !this.rootEl.classed('vzb-portrait')) {
        this.leftPos = this.placeholderEl.style('left');
        this.topPos = this.placeholderEl.style('top');
      }
      if (!this.rootEl.classed('vzb-portrait')) {
        this.placeholderEl.style('top', ''); // issues: 369 & 442
      }
      this.isOpen = false;
    },


    transitionEnd: function (eventName) {
      var _this = this;

      this.transitionEvents.forEach(function (event) {
        _this.placeholderEl.on(event, null);
      });
      this.placeholderEl.classed('notransition', true);
    }

  });

}).call(this);

function dialogDrag(element, container, xOffset) {
  var posX, posY, divTop, divLeft, eWi, eHe, cWi, cHe, diffX, diffY;

  return {
    move: function (x, y) {
      element.style('left', x + 'px');
      element.style('top', y + 'px');
    },

    dragStart: function (evt) {
      posX = evt.sourceEvent.clientX;
      posY = evt.sourceEvent.clientY;
      divTop = parseInt(element.style('top')) || 0;
      divLeft = parseInt(element.style('left')) || 0;
      eWi = parseInt(element.style('width'));
      eHe = parseInt(element.style('height'));
      cWi = parseInt(container.style('width')) + xOffset;
      cHe = parseInt(container.style('height'));
      diffX = posX - divLeft;
      diffY = posY - divTop;
    },

    drag: function(evt) {
      var posX = evt.sourceEvent.clientX,
        posY = evt.sourceEvent.clientY,
        aX = posX - diffX,
        aY = posY - diffY;
      if (aX > -xOffset) aX = -xOffset;
      if (aY < 0) aY = 0;
      if (-aX + eWi > cWi) aX = -cWi + eWi;
      if (eHe + aY > cHe) aY = cHe - eHe;

      this.move(aX, aY);
    }
  }
}

(function () {

  "use strict";

  var Vizabi = this.Vizabi;
  var Dialog = Vizabi.Component.get('gapminder-buttonlist-dialog');


  Vizabi.Component.register('gapminder-buttonlist-axes-mc', Dialog.extend({

    /**
     * Initializes the dialog component
     * @param config component configuration
     * @param context component context (parent)
     */
    init: function (config, parent) {
      this.name = 'axes-mc';
    var _this = this;

        this.model_binds = {
            'change:state:time:xLogStops': function () {
                _this.updateView();
            },
            'change:state:time:yMaxMethod': function () {
                _this.updateView();
            },
            'change:state:time:povertyline': function () {
                _this.updateView();
            }
        };

      this.components = [{
        component: 'gapminder-indicatorpicker',
        placeholder: '.vzb-xlimits-container',
        model: ["state.marker.axis_x", "language"],
        ui: {selectIndicator: false, selectScaletype: false, selectMinMax: true}
      }]


      this._super(config, parent);
    },

    readyOnce: function(){
        var _this = this;
        this.element = d3.select(this.element);

        this.yMaxRadio = this.element.select('.vzb-yaxis-container').selectAll('input')
            .on("change", function(){
                _this.setModel("yMaxMethod", d3.select(this).node().value);
            })

        this.xLogStops = this.element.select('.vzb-xaxis-container').selectAll('input')
            .on("change", function(){
                _this.setModel("xLogStops", d3.select(this).node().value);
            })

        this.povertyLineFieldEl = this.element.select(".vzb-povertyline-field")
            .on("change", function(){
                var result = parseFloat(this.value.replace(",","."));
                if(result <= _this.model.state.time.povertyCutoff) {
                    this.value = _this.model.state.time.povertyline;
                    return;
                }
                _this.setModel("povertyline", result);
            });
        
        this.updateView();

        this._super();
    },

    updateView: function(){
        var _this = this;

        this.yMaxRadio.property('checked', function(){
            return d3.select(this).node().value === _this.model.state.time.yMaxMethod;
        })
        this.xLogStops.property('checked', function(){
            return _this.model.state.time.xLogStops.indexOf(+d3.select(this).node().value) !== -1;
        })  
        this.povertyLineFieldEl.property("value", this.model.state.time.povertyline);
    },

    setModel: function(what, value) {
        var result;

        if(what == "yMaxMethod"){
            result = value;
        }
        if(what == "xLogStops"){
            result = [];
            this.xLogStops.each(function(){
                if(d3.select(this).property('checked')) result.push(+d3.select(this).node().value);
            })
        }
        if(what == "povertyline"){
            result = value;
        }
        
        this.model.state.time[what] = result;
    }
  }));

}).call(this);


(function () {

  "use strict";

  var Vizabi = this.Vizabi;
  var Dialog = Vizabi.Component.get('gapminder-buttonlist-dialog');


  Vizabi.Component.register('gapminder-buttonlist-axes', Dialog.extend({

    /**
     * Initializes the dialog component
     * @param config component configuration
     * @param context component context (parent)
     */
    init: function (config, parent) {
      this.name = 'axes';
      var _this = this;

      this.components = [{
        component: 'gapminder-indicatorpicker',
        placeholder: '.vzb-xaxis-container',
        model: ["state.marker.axis_x", "language"]
      }, {
        component: 'gapminder-indicatorpicker',
        placeholder: '.vzb-yaxis-container',
        model: ["state.marker.axis_y", "language"]
      }, {
        component: 'gapminder-simplecheckbox',
        placeholder: '.vzb-axes-options',
        model: ["state", "language"],
        submodel: 'time',
        checkbox: 'adaptMinMaxZoom'
      }];

      this._super(config, parent);
    }
  }));

}).call(this);


/*!
 * VIZABI COLOR DIALOG
 */

(function () {

  "use strict";

  var Vizabi = this.Vizabi;
  var utils = Vizabi.utils;
  var Dialog = Vizabi.Component.get('gapminder-buttonlist-dialog');

  if (!Vizabi._require('d3')) return;

  Vizabi.Component.register('gapminder-buttonlist-colors', Dialog.extend({

    /**
     * Initializes the dialog component
     * @param config component configuration
     * @param context component context (parent)
     */
    init: function (config, parent) {
      this.name = 'colors';

      this.components = [{
        component: 'gapminder-indicatorpicker',
        placeholder: '.vzb-caxis-container',
        model: ["state.marker.color", "language"]
      }, {
        component: 'gapminder-colorlegend',
        placeholder: '.vzb-clegend-container',
        model: ["state.marker.color", "state.entities", "language"]
      }];


      this._super(config, parent);
    }

  }));


}).call(this);

/*!
 * VIZABI FIND CONTROL
 * Reusable find dialog
 */

(function () {

  "use strict";

  var Vizabi = this.Vizabi;
  var utils = Vizabi.utils;
  var Dialog = Vizabi.Component.get('gapminder-buttonlist-dialog');

  if (!Vizabi._require('d3')) return;

  Vizabi.Component.register('gapminder-buttonlist-find', Dialog.extend({

    init: function (config, parent) {
      this.name = 'find';
      var _this = this;

      this.components = [{
        component: 'gapminder-bubbleopacity',
        placeholder: '.vzb-dialog-bubbleopacity',
        model: ["state.entities"],
        arg: "opacitySelectDim"
      }];

      this.model_binds = {
        "change:state:entities:select": function (evt) {
          _this.ready();
        },
        "change:state:time:value": function (evt) {
          if(!_this.model.state.time.playing && !_this.model.state.time.dragging) {
            _this.ready();
          }
        }
      }

      this._super(config, parent);
    },

    /**
     * Grab the list div
     */
    readyOnce: function () {
      this.element = d3.select(this.element);
      this.list = this.element.select(".vzb-find-list");
      this.input_search = this.element.select("#vzb-find-search");
      this.deselect_all = this.element.select("#vzb-find-deselect");
      this.opacity_nonselected = this.element.select(".vzb-dialog-bubbleopacity");

      this.KEY = this.model.state.entities.getDimension();

      var _this = this;
      this.input_search.on("input", function () {
        _this.showHideSearch();
      });

      this.deselect_all.on("click", function () {
        _this.deselectEntities();
      });

      this._super();
    },

    open: function () {
      this._super();

      this.input_search.node().value = "";
      this.showHideSearch();
    },

    /**
     * Build the list everytime it updates
     */
    //TODO: split update in render and update methods
    ready: function () {
      this._super();

      var _this = this;
      var KEY = this.KEY;
      var TIMEDIM = this.model.state.time.getDimension();
      var selected = this.model.state.entities.getSelected();
      var marker = this.model.state.marker;
      var filter = {};
      filter[TIMEDIM] = this.model.state.time.value;

      var values = marker.getValues(filter, [KEY])

      var data = marker.getKeys().map(function (d) {
        var pointer = {};
        pointer[KEY] = d[KEY];
        pointer.name = values.label[d[KEY]];
        return pointer;
      }).filter(function(d) {
        var include = true;
        utils.forEach(values, function(hook) {
          if(!hook[d[KEY]]) {
            include = false;
            return false;
          }
        });
        return include;
      })

      //sort data alphabetically
      data.sort(function (a, b) {
        return (a.name < b.name) ? -1 : 1;
      });

      this.list.html("");

      var items = this.list.selectAll(".vzb-find-item")
        .data(data)
        .enter()
        .append("div")
        .attr("class", "vzb-find-item vzb-dialog-checkbox")

      items.append("input")
        .attr("type", "checkbox")
        .attr("class", "vzb-find-item")
        .attr("id", function (d) {
          return "-find-" + d[KEY];
        })
        .property("checked", function (d) {
          return (selected.indexOf(d[KEY]) !== -1);
        })
        .on("change", function (d) {
          _this.model.state.entities.selectEntity(d);
        });

      items.append("label")
        .attr("for", function (d) {
          return "-find-" + d[KEY];
        })
        .text(function (d) {
          return d.name;
        })
        .on("mouseover", function (d) {
          _this.model.state.entities.highlightEntity(d);
        })
        .on("mouseout", function (d) {
          _this.model.state.entities.clearHighlighted();
        });

      this.showHideSearch();
      this.showHideDeselect();
    },

    showHideSearch: function () {

      var search = this.input_search.node().value || "";
      search = search.toLowerCase();

      this.list.selectAll(".vzb-find-item")
        .classed("vzb-hidden", function (d) {
          var lower = d.name.toLowerCase();
          return (lower.indexOf(search) === -1);
        });
    },

    showHideDeselect: function () {
      var someSelected = !!this.model.state.entities.select.length;
      this.deselect_all.classed('vzb-hidden', !someSelected);
      this.opacity_nonselected.classed('vzb-hidden', !someSelected);
    },

    deselectEntities: function () {
      this.model.state.entities.clearSelected();
    },

    transitionEnd: function (event) {
      this._super(event);

      if (!utils.isTouchDevice()) this.input_search.node().focus(); 
    }

  }));


}).call(this);

(function () {

  "use strict";

  var Vizabi = this.Vizabi;
  var Dialog = Vizabi.Component.get('gapminder-buttonlist-dialog');


  Vizabi.Component.register('gapminder-buttonlist-moreoptions', Dialog.extend({

    /**
     * Initializes the dialog component
     * @param config component configuration
     * @param context component context (parent)
     */
    init: function (config, parent) {
      this.name = 'moreoptions';

      this.components = [{
        component: 'gapminder-indicatorpicker',
        placeholder: '.vzb-xaxis-container',
        model: ["state.marker.axis_x", "language"],
        ui: {selectMinMax: true}
      }, {
        component: 'gapminder-indicatorpicker',
        placeholder: '.vzb-yaxis-container',
        model: ["state.marker.axis_y", "language"],
        ui: {selectMinMax: true}
      }, {
        component: 'gapminder-simplecheckbox',
        placeholder: '.vzb-axes-options',
        model: ["state", "language"],
        submodel: 'time',
        checkbox: 'adaptMinMaxZoom'
      }, {
        component: 'gapminder-bubblesize',
        placeholder: '.vzb-dialog-bubblesize-min',
        model: ["state.marker.size"],
        field: 'min'
      }, {
        component: 'gapminder-bubblesize',
        placeholder: '.vzb-dialog-bubblesize-max',
        model: ["state.marker.size"],
        field: 'max'
      }, {
        component: 'gapminder-indicatorpicker',
        placeholder: '.vzb-saxis-container',
        model: ["state.marker.size", "language"]
      }, {
        component: 'gapminder-indicatorpicker',
        placeholder: '.vzb-caxis-container',
        model: ["state.marker.color", "language"]
      }, {
        component: 'gapminder-colorlegend',
        placeholder: '.vzb-clegend-container',
        model: ["state.marker.color", "state.entities", "language"]
      }, {
        component: 'gapminder-bubbleopacity',
        placeholder: '.vzb-dialog-bubbleopacity-regular',
        model: ["state.entities"],
        arg: "opacityRegular"
      }, {
        component: 'gapminder-bubbleopacity',
        placeholder: '.vzb-dialog-bubbleopacity-selectdim',
        model: ["state.entities"],
        arg: "opacitySelectDim"
      }];

      this._super(config, parent);
    },

    readyOnce: function () {
      this.element = d3.select(this.element);
      this.resize();
    },

    resize: function () {
      var totalHeight = this.root.element.offsetHeight - 200;
      var content = this.element.select('.vzb-dialog-content');
      content.style('max-height', totalHeight + 'px');

      this._super();
    }
  }));

}).call(this);

(function () {

  "use strict";

  var Vizabi = this.Vizabi;
  var Dialog = Vizabi.Component.get('gapminder-buttonlist-dialog');

  Vizabi.Component.register('gapminder-buttonlist-size', Dialog.extend({

    /**
     * Initializes the dialog component
     * @param config component configuration
     * @param context component context (parent)
     */
    init: function (config, parent) {
      this.name = 'size';

      // in dialog, this.model_expects = ["state", "data"];

      this.components = [{
        component: 'gapminder-bubblesize',
        placeholder: '.vzb-dialog-bubblesize-min',
        model: ["state.marker.size"],
        ui: {
          show_button: false
        },
        field: 'min'
      },{
        component: 'gapminder-bubblesize',
        placeholder: '.vzb-dialog-bubblesize-max',
        model: ["state.marker.size"],
        ui: {
          show_button: false
        },
        field: 'max'
      }, {
        component: 'gapminder-indicatorpicker',
        placeholder: '.vzb-saxis-container',
        model: ["state.marker.size", "language"],
        ui: {selectIndicator: true, selectScaletype: false}
      }];

      this._super(config, parent);
    }
  }));

}).call(this);

(function () {

    "use strict";

    var Vizabi = this.Vizabi;
    var utils = Vizabi.utils;
    var Dialog = Vizabi.Component.get('gapminder-buttonlist-dialog');

    Vizabi.Component.register('gapminder-buttonlist-stack', Dialog.extend({

        /**
         * Initializes the dialog component
         * @param config component configuration
         * @param context component context (parent)
         */
        init: function (config, parent) {
            this.name = 'stack';
            var _this = this;

            // in dialog, this.model_expects = ["state", "data"];

            this.components = [{
              component: 'gapminder-draggablelist',
              placeholder: '.vzb-dialog-draggablelist',
              model: ["language"],
              dataArrFn: _this.manualSorting.bind(_this),
              lang: 'region/'
            }];

            this.model_binds = {
                'change:state:marker:stack': function () {
                    //console.log("stack change event");
                    _this.updateView();
                },
                'change:state:marker:group': function () {
                    //console.log("group change event");
                    _this.updateView();
                }
            }
            this._super(config, parent);
        },

        readyOnce: function(){
            var _this = this;
            this.element = d3.select(this.element);

            this.howToStackEl = this.element.select('#vzb-howtostack').selectAll("input")
                .on("change", function(){
                    _this.setModel("stack", d3.select(this).node().value);
                })

            this.mergeGroupedEl = this.element.select('#vzb-merge-grouped').selectAll("input")
                .on("change", function(){
                    _this.setModel("merge grouped", d3.select(this).property("checked"));
                })
            this.mergeStackedEl = this.element.select('#vzb-merge-stacked').selectAll("input")
                .on("change", function(){
                    _this.setModel("merge stacked", d3.select(this).property("checked"));
                })

            this.updateView();

          this._super();
        },

        updateView: function(){
            var _this = this;

            this.howToStackEl.property('checked', function(){
                return d3.select(this).node().value === _this.model.state.marker.stack.which;
            })

            this.mergeGroupedEl.property('checked', this.model.state.marker.group.merge);
            this.mergeStackedEl.property('checked', this.model.state.marker.stack.merge);
        },

        manualSorting: function (value) {
          if (arguments.length === 0) return this.model.state.marker.group.manualSorting;
          this.model.state.marker.group.manualSorting = value;
        },

        setModel: function(what, value) {

            if (what == "merge grouped") {
                this.model.state.marker.group.merge = value;
            } else if (what == "merge stacked") {
                this.model.state.marker.stack.merge = value;

            } else {

                var mdl = this.model.state.marker.stack;

                var obj = {};
                obj.which = value;
                if(utils.values(mdl.getPalettes()).indexOf(value) == -1){
                    obj.use = "property";
                }else{
                    obj.use = "value";
                }

              mdl.set(obj);
            }
        }
    }));

}).call(this);

/*!
 * VIZABI BUBBLE COLOR LEGEND COMPONENT
 */

(function () {

  "use strict";

  var Vizabi = this.Vizabi;
  var utils = Vizabi.utils;
  var INDICATOR = "which";

  if (!Vizabi._require('d3')) return;

  Vizabi.Component.extend('gapminder-colorlegend', {

    init: function (config, context) {
      var _this = this;
      this.template = '<div class="vzb-cl-holder"></div>';

      this.model_expects = [{
        name: "color",
        type: "color"
      }, {
        name: "entities",
        type: "entities"
      }, {
        name: "language",
        type: "language"
      }];

      this.needsUpdate = false;
      this.which_1 = false;
      this.scaleType_1 = false;

      this.model_binds = {
        "change:color": function (evt) {
          _this.updateView();
        },
        "change:language": function (evt) {
          _this.updateView();
        },
        "ready": function (evt) {
          if (!_this._readyOnce) return;
          _this.updateView();
        }
      }

      //contructor is the same as any component
      this._super(config, context);
    },


    readyOnce: function () {
      var _this = this;
      this.element = d3.select(this.element);
      this.listColorsEl = this.element.append("div").attr("class", "vzb-cl-colorList");
      this.rainbowEl = this.listColorsEl.append("div").attr("class", "vzb-cl-rainbow");
      this.worldmapEl = this.listColorsEl.append("div").attr("class", "vzb-cl-worldmap");

      this.colorPicker = d3.svg.colorPicker();
      this.element.call(this.colorPicker);

      this.worldMap = d3.svg.worldMap();
      this.worldmapEl.call(this.worldMap);

      this.updateView();
    },


    updateView: function () {
      var _this = this;
      this.translator = this.model.language.getTFunction();
      var KEY = this.model.entities.getDimension();

      var palette = this.model.color.palette._data;


      var whichPalette = "_default";
      if (Object.keys(this.model.color.getPalettes()).indexOf(this.model.color[INDICATOR]) > -1) {
        whichPalette = this.model.color[INDICATOR];
      }

      var paletteDefault = this.model.color.getPalettes()[whichPalette];

      this.listColorsEl.selectAll(".vzb-cl-option").remove();

      var colors = this.listColorsEl
        .selectAll(".vzb-cl-option")
        .data(utils.keys(palette), function (d) {
          return d
        });

      colors.enter().append("div").attr("class", "vzb-cl-option")
        .each(function () {
          d3.select(this).append("div").attr("class", "vzb-cl-color-sample");
          d3.select(this).append("div").attr("class", "vzb-cl-color-legend");
        })
        .on("mouseover", function () {
          //disable interaction if so stated in metadata
          if (!_this.model.color.isUserSelectable(whichPalette)) return;

          var sample = d3.select(this).select(".vzb-cl-color-sample");
          sample.style("border-width", "5px");
          sample.style("background-color", "transparent");

        })
        .on("mouseout", function (d) {
          //disable interaction if so stated in metadata
          if (!_this.model.color.isUserSelectable(whichPalette)) return;

          var sample = d3.select(this).select(".vzb-cl-color-sample");
          sample.style("border-width", "0px");
          sample.style("background-color", _this.model.color.palette[d]);
        })
        .on("click", function (d) {
          //disable interaction if so stated in metadata
          if (!_this.model.color.isUserSelectable(whichPalette)) return;

          _this.colorPicker
            .colorOld(palette[d])
            .colorDef(paletteDefault[d])
            .callback(function (value) {
              _this.model.color.setColor(value, d)
            })
            .show(true);
        })


      if (this.model.color.use == "indicator") {
        var gradientHeight;
        var colorOptions = this.listColorsEl.selectAll('.vzb-cl-option');
        if (colorOptions && colorOptions[0]) {
          var firstOptionSize = colorOptions[0][0].getBoundingClientRect();
          var lastOptionSize = colorOptions[0][colorOptions[0].length - 1].getBoundingClientRect();
          gradientHeight = (lastOptionSize.top + lastOptionSize.height) - firstOptionSize.top;
        }
        if (!isFinite(gradientHeight))
          gradientHeight = utils.keys(palette).length * 25 + 5;
        this.rainbowEl.classed("vzb-hidden", false)
          .style("height", gradientHeight + "px")
          .style("background", "linear-gradient(" + utils.values(palette).join(", ") + ")");
      } else {
        this.rainbowEl.classed("vzb-hidden", true);
      }

      //TODO: is it okay that "geo.region" is hardcoded?
      if (this.model.color[INDICATOR] == "geo.region") {
        var regions = this.worldmapEl.classed("vzb-hidden", false)
          .select("svg").selectAll("path");
        regions.each(function () {
          var view = d3.select(this);
          var color = palette[view.attr("id")];
          view.style("fill", color);
        })
          .style("opacity", 0.8)
          .on("mouseover", function () {
            var view = d3.select(this);
            var region = view.attr("id");
            regions.style("opacity", 0.5);
            view.style("opacity", 1);

            var filtered = _this.model.color.getNestedItems([KEY]);
            var highlight = utils.values(filtered)
              //returns a function over time. pick the last time-value
              .map(function (d) {
                return d[d.length - 1]
              })
              //filter so that only countries of the correct region remain
              .filter(function (f) {
                return f["geo.region"] == region
              })
              //fish out the "key" field, leave the rest behind
              .map(function (d) {
                return utils.clone(d, [KEY])
              });

            _this.model.entities.setHighlighted(highlight);
          })
          .on("mouseout", function () {
            regions.style("opacity", 0.8);
            _this.model.entities.clearHighlighted();
          })
          .on("click", function (d) {
            //disable interaction if so stated in metadata
            if (!_this.model.color.isUserSelectable(whichPalette)) return;
            var view = d3.select(this);
            var region = view.attr("id")

            _this.colorPicker
              .colorOld(palette[region])
              .colorDef(paletteDefault[region])
              .callback(function (value) {
                _this.model.color.setColor(value, region)
              })
              .show(true);
          })
        colors.classed("vzb-hidden", true);
      } else {
        this.worldmapEl.classed("vzb-hidden", true);
        colors.classed("vzb-hidden", false);
      }

      colors.each(function (d, index) {
        d3.select(this).select(".vzb-cl-color-sample")
          .style("background-color", palette[d])
          .style("border", "1px solid " + palette[d]);

        if (_this.model.color.use == "indicator") {
          var domain = _this.model.color.getScale().domain();
          d3.select(this).select(".vzb-cl-color-legend")
            .text(_this.model.color.tickFormatter(domain[index]))
        } else {

          d3.select(this).select(".vzb-cl-color-legend")
            .text(_this.translator("color/" + d));
        }
      });
    }


  });


}).call(this);

/*!
 * VIZABI INDICATOR PICKER
 * Reusable indicator picker component
 */

(function () {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var globals = Vizabi._globals;
    var utils = Vizabi.utils;
    var iconset = Vizabi.iconset;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) return;

    var hidden = true;

    Vizabi.Component.extend('gapminder-datawarning', {



        init: function (config, context) {
            var _this = this;

            this.model_expects = [{
                name: "language",
                type: "language"
	        }];

            this.context = context;

            this.model_binds = {
                "change:language": function (evt) {
                    _this.ready();
                }
            }

            //contructor is the same as any component
            this._super(config, context);

            this.ui = utils.extend({
                //...add properties here
            }, this.ui);

        },

        ready: function () {
        },

        readyOnce: function () {
            var _this = this;
            this.element = d3.select(this.placeholder);
            this.translator = this.model.language.getTFunction();
            
            this.element.selectAll("div").remove();
            
            this.element.append("div")
                .attr("class", "vzb-data-warning-background")
                .on("click", function(){_this.toggle(true)});
            
            var container = this.element.append("div")
                .attr("class", "vzb-data-warning-box");
            
            container.append("div")
                .attr("class", "vzb-data-warning-close")
                .html("X")
                .on("click", function(){_this.toggle()});
            

            var icon = container.append("div")
                .attr("class", "vzb-data-warning-link")
                .html(iconset['warn'])
                
            icon.append("div")
                .text("Data doubts");
            
            if(this.parent.datawarning_content.title){
                container.append("div")
                    .attr("class", "vzb-data-warning-title")
                    .html(this.parent.datawarning_content.title);
            }
            
            container.append("div")
                .attr("class", "vzb-data-warning-body")
                .html(this.parent.datawarning_content.body);
                

        },



        toggle: function (arg) {
            if(arg==null) arg = !hidden;
            hidden = arg;
            this.element.classed("vzb-hidden", hidden);
        }




    });

}).call(this);
(function () {
  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;

  if (!Vizabi._require('d3')) {
    return;
  }

  Vizabi.Component.extend('gapminder-draggablelist', {

    init: function (config, context) {
      this.template = '<span class="vzb-dl-holder"><ul class="vzb-draggable list"></ul></span>';
      var _this = this;

      this.dataArrFn = config.dataArrFn;
      this.lang = config.lang;

      this.model_expects = [
        {
          name: "language",
          type: "language"
        }
      ];

      this.model_binds = {
        "change:axis": function (evt) {
          _this.updateView();
        },
        "change:language": function (evt) {
          _this.updateView();
        }
      };

      this._super(config, context);

      this.updateData = utils.debounce(this.updateData, 1000);
    },

    ready: function() {
      var _this = this;

      this.updateView();

      this.element
        .selectAll('div')
        .on('dragstart', function () {
          d3.select(this).style('opacity', 0.4);

          _this.dragElem = this;
          d3.event.dataTransfer.setData('text/html', this.innerHTML);
          d3.event.dataTransfer.effectAllowed = 'move';
        })
        .on('dragover', function () {
          if (d3.event.preventDefault)
            d3.event.preventDefault();

          d3.event.dataTransfer.dropEffect = 'move';

          return false;
        })
        .on('dragenter', function () {
          d3.select(this).select('li').classed('over', true);

          return false;
        })
        .on('dragleave', function () {
          d3.select(this).select('li').classed('over', false);
        })
        .on('drop', function () {
          if (d3.event.stopPropagation)
            d3.event.stopPropagation();

          if (_this.dragElem) {
            _this.dragElem.innerHTML = this.innerHTML;
            this.innerHTML = d3.event.dataTransfer.getData('text/html');
          }

          return false;
        })
        .on('dragend', function () {
          d3.select(this).style('opacity', '');
          _this.element
            .selectAll('li')
            .classed('over', false);
          _this.updateData();
        })
    },

    updateView: function () {
      var _this = this;
      this.translator = this.model.language.getTFunction();
      this.element.selectAll('li').remove();

      this.data = this.element.selectAll('li').data(this.dataArrFn());
      this.data.enter()
        .insert('div')
        .attr('draggable', true)
        .insert('li')
        .each(function (val, index) {
          d3.select(this).attr('data', val).text(_this.translator(_this.lang + val));
        });
    },

    updateData: function () {
      var dataArr = [];
      this.element
        .selectAll('li')
        .each(function () {
          dataArr.push(d3.select(this).attr('data'));
        });
      this.dataArrFn(dataArr);
    },

    readyOnce: function() {
      var _this = this;

      this.element = d3.select(this.element).select('.list');
    }


  });
}).call(this);

/*!
 * VIZABI INDICATOR PICKER
 * Reusable indicator picker component
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var globals = Vizabi._globals;
    var utils = Vizabi.utils;

    var INDICATOR = "which";
    var MIN = "min";
    var MAX = "max";
    var SCALETYPE = "scaleType";
    var MODELTYPE_COLOR = "color";

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) return;

    Vizabi.Component.extend('gapminder-indicatorpicker', {

        /**
         * Initializes the Indicator Picker.
         * Executed once before any template is rendered.
         * @param config The options passed to the component
         * @param context The component's parent
         */
        init: function(config, context) {

            this.template = '<span class="vzb-ip-holder"><select class="vzb-ip-indicator"></select><select class="vzb-ip-scaletype"></select><br/><span class="vzb-ip-domainmin-label"></span> <input type="text" class="vzb-ip-domainmin" name="min"> <span class="vzb-ip-domainmax-label"></span> <input type="text" class="vzb-ip-domainmax" name="max">';
            var _this = this;

            this.model_expects = [{
                name: "axis"
                    //TODO: learn how to expect model "axis" or "size" or "color"
            }, {
                name: "language",
                type: "language"
            }];

            this.model_binds = {
                "change:axis": function(evt) {
                    _this.updateView();
                },
                "change:language": function(evt) {
                    _this.updateView();
                }
            };

            //contructor is the same as any component
            this._super(config, context);

            this.ui = utils.extend({
                selectIndicator: true,
                selectScaletype: true,
                selectMinMax: false
            }, this.ui.getObject());

        },

        ready: function() {
            this.updateView();
        },

        afterPreload: function() {
            console.log("test");
        },

        readyOnce: function() {
            var _this = this;

            this.element = d3.select(this.element);
            this.el_select_indicator = this.element.select('.vzb-ip-indicator');
            this.el_select_scaletype = this.element.select('.vzb-ip-scaletype');

            this.el_domain_labelMin = this.element.select('.vzb-ip-domainmin-label');
            this.el_domain_labelMax = this.element.select('.vzb-ip-domainmax-label');
            this.el_domain_fieldMin = this.element.select('.vzb-ip-domainmin');
            this.el_domain_fieldMax = this.element.select('.vzb-ip-domainmax');

            this.el_select_indicator.on("change", function() {
                _this._setModel(INDICATOR, this.value)
            });
            this.el_select_scaletype.on("change", function() {
                _this._setModel(SCALETYPE, this.value)
            });

            _this.el_domain_fieldMin.on("change", function() {
                _this._setModel(MIN, this.value)
            });
            _this.el_domain_fieldMax.on("change", function() {
                _this._setModel(MAX, this.value)
            });
        },

        updateView: function() {
            var _this = this;
            this.translator = this.model.language.getTFunction();

            this.el_domain_labelMin.text(this.translator("min") + ":");
            this.el_domain_labelMax.text(this.translator("max") + ":");

            var indicatorsDB = globals.metadata.indicatorsDB;
            var indicatorsArray = globals.metadata.indicatorsArray;
            var pointer = "_default";
            var data = {};

            data[INDICATOR] = indicatorsArray
                .filter(function(f) {
                
                    //keep indicator if nothing is specified in tool properties
                    if (!_this.model.axis.allow || !_this.model.axis.allow.scales) return true;
                    //keep indicator if any scale is allowed in tool properties
                    if (_this.model.axis.allow.scales[0] == "*") return true;

                    //check if there is an intersection between the allowed tool scale types and the ones of indicator
                    for (var i = indicatorsDB[f].scales.length - 1; i >= 0; i--) {
                        //if (f.scales[i] == _this.model.axis.scaleType) return true;
                        if (_this.model.axis.allow.scales.indexOf(indicatorsDB[f].scales[i]) > -1) return true;
                    }

                    return false;
                });
            

            
            if (data[INDICATOR].indexOf(this.model.axis[INDICATOR]) > -1) pointer = this.model.axis[INDICATOR];

            data[SCALETYPE] = indicatorsDB[pointer].scales.filter(function(f) {
                if (!_this.model.axis.allow || !_this.model.axis.allow.scales) return true;
                if (_this.model.axis.allow.scales[0] == "*") return true;
                return _this.model.axis.allow.scales.indexOf(f) > -1;
            });

            //bind the data to the selector lists
            var elOptionsIndicator = this.el_select_indicator.selectAll("option")
                .data(data[INDICATOR], function(d) {
                    return d
                });
            var elOptionsScaletype = this.el_select_scaletype.selectAll("option")
                .data(data[SCALETYPE], function(d) {
                    return d
                });

            //remove irrelevant options
            elOptionsIndicator.exit().remove();
            elOptionsScaletype.exit().remove();

            //populate options into the list
            elOptionsIndicator.enter().append("option").attr("value", function(d) {
                return d
            });
            elOptionsScaletype.enter().append("option").attr("value", function(d) {
                return d
            });

            //show translated UI string
            elOptionsIndicator.text(function(d) {
                return _this.translator("indicator/" + d)
            });
            elOptionsScaletype.text(function(d) {
                return _this.translator("scaletype/" + d)
            });

            //set the selected option
            this.el_select_indicator[0][0].value = this.model.axis[INDICATOR];
            this.el_select_scaletype[0][0].value = this.model.axis[SCALETYPE];

            //disable the selector in case if there is only one option, hide if so requested by the UI setings
            this.el_select_indicator
                .style('display', this.ui.selectIndicator ? "auto" : "none")
                .attr('disabled', data[INDICATOR].length <= 1 ? "true" : null);

            this.el_select_scaletype
                .style('display', data[SCALETYPE].length == 0 ? "none" : "inline")
                .style('display', this.ui.selectScaletype ? "auto" : "none")
                .attr('disabled', data[SCALETYPE].length <= 1 ? "true" : null);

            this.el_domain_labelMin.style('display', this.ui.selectMinMax ? "auto" : "none");
            this.el_domain_labelMax.style('display', this.ui.selectMinMax ? "auto" : "none");
            this.el_domain_fieldMin.style('display', this.ui.selectMinMax ? "auto" : "none");
            this.el_domain_fieldMax.style('display', this.ui.selectMinMax ? "auto" : "none");

            var formatter = d3.format(".2r");
            this.el_domain_fieldMin.property("value", formatter(this.model.axis.getScale().domain()[0]));
            this.el_domain_fieldMax.property("value", formatter(this.model.axis.getScale().domain()[1]));
        },

        _setModel: function(what, value) {

            var indicatorsDB = globals.metadata.indicatorsDB;

            if (what === MIN || what === MAX) value = utils.strToFloat(value);

            var mdl = this.model.axis;

            var obj = {};
            obj[what] = value;

            if (what == INDICATOR) {
                obj.use = indicatorsDB[value].use;

                if (indicatorsDB[value].scales.indexOf(mdl.scaleType) == -1) {
                    obj.scaleType = indicatorsDB[value].scales[0];
                }
            }
            
             if (what == INDICATOR || what == SCALETYPE) {
                if (mdl.getType() == 'axis') {
                    obj.min = null;
                    obj.max = null;
                }
             }

            mdl.set(obj);
        }

    });

}).call(this);
/*!
 * VIZABI SIMPLE CHECKBOX
 * Reusable simple checkbox component
 */

(function () {

  "use strict";

  var Vizabi = this.Vizabi;
  var utils = Vizabi.utils;

  if (!Vizabi._require('d3')) return;

  Vizabi.Component.extend('gapminder-simplecheckbox', {

    init: function (config, context) {
      this.template = '<span class="vzb-sc-holder vzb-dialog-checkbox"><input type="checkbox"><label></label></span>';
      var _this = this;

      this.checkbox = config.checkbox;
      this.submodel = config.submodel;

      this.model_expects = [{
        name: "mdl"
        //TODO: learn how to expect model "axis" or "size" or "color"
      }, {
        name: "language",
        type: "language"
      }];


      this.model_binds = {
        "change:mdl": function (evt) {
          _this.updateView();
        },
        "change:language": function (evt) {
          _this.updateView();
        }
      };

      this.model_binds["change:mdl:" + this.submodel + ":" + this.checkbox] = function () {
        _this.updateView();
      };

      //contructor is the same as any component
      this._super(config, context);
    },

    ready: function () {
      this.updateView();
    },

    readyOnce: function () {
      var _this = this;
      this.element = d3.select(this.element);
      var id = "-check-" + Math.random() * 1000;
      this.labelEl = this.element.select('label').attr("for", id);
      this.checkEl = this.element.select('input').attr("id", id)
        .on("change", function () {
          _this._setModel(d3.select(this).property("checked"));
        });
    },

    updateView: function () {
      this.translator = this.model.language.getTFunction();
      this.labelEl.text(this.translator("check/" + this.checkbox));
      this.checkEl.property("checked", !!this.model.mdl[this.submodel][this.checkbox]);
    },

    _setModel: function (value) {
      this.model.mdl[this.submodel][this.checkbox] = value;
    }

  });


}).call(this);

(function () {

    var Vizabi = this.Vizabi;
    var utils = Vizabi.utils;
    var prefix = "";
    var deleteClasses = [];
    
    var SVGHEADER = '<?xml version="1.0" encoding="utf-8"?>';

    Vizabi.Helper.extend("gapminder-svgexport", {

        init: function (context) {
            this.context = context;
            this.shapes = [];
            this.groups = [];
            this.counter = 0;
            this.name = "";
            this.label = "";
        },

        reset: function(){
            this.container.remove();
            this.context.element.selectAll(".vzb-export-redball").remove();
            this.context.element.selectAll(".vzb-export-counter").remove();
            this.counter = 0;
        },
        
        prefix: function(arg){
            if (!arguments.length) return prefix;
            prefix = arg;
            return this;
        },
        deleteClasses: function(arg){
            if (!arguments.length) return deleteClasses;
            deleteClasses = arg;
            return this;
        }, 
        
        open: function(element, name){
            var _this = this;
            
            //reset if some exports exists on opening
            if(this.svg) this.reset();
            
            if(!element)element = this.context.element;
            if(!name)name = this.context.name;
            this.name = name;
            
            var width = parseInt(element.style("width"), 10);
            var height = parseInt(element.style("height"), 10);
            
            this.container = element.append("div").attr("class", "vzb-svg-export");
            this.svg = this.container.node().appendChild(element.select("svg").node().cloneNode(true));
            this.svg = d3.select(this.svg);
            this.svg
                .attr("viewBox", "0 0 " + width + " " + height)
                .attr("version", "1.1")
                .attr("param1", "http://www.w3.org/2000/svg")
                .attr("param2", "http://www.w3.org/1999/xlink")
                .attr("x", "0px")
                .attr("y", "0px")
                .attr("style", "enable-background:new " + "0 0 " + width + " " + height)
                .attr("xml:space", "preserve");
            
            this.redBall = element.append("div")
                .attr("class", "vzb-export-redball")
                .style("position", "absolute")
                .style("top", "20px")
                .style("right", "20px")
                .style("width", "20px")
                .style("height", "20px")
                .style("background", "red")
                .style("color", "white")
                .style("text-align", "center")
                .style("border-radius", "10px")
                .style("font-size", "14px")
                .style("line-height", "20px")
                .style("opacity",0.8)
                .style("cursor", "pointer")
                .on("mouseover", function(){
                    d3.select(this).style("opacity",1).text("▼");
                    _this.counterEl.text("Download");
                })
                .on("mouseout", function(){
                    d3.select(this).style("opacity",0.8).text("");
                    _this.counterEl.text(_this.label);
                })
                .on("click", function(){_this.close()});
            
            this.counterEl = element.append("div")
                .attr("class", "vzb-export-counter")
                .style("position", "absolute")
                .style("top", "20px")
                .style("right", "45px")
                .style("color", "red")
                .style("opacity",0.8)
                .style("line-height", "20px")
                .style("font-size", "14px")
                .style("text-align", "center")
            

            
            this.root = this.svg.select("."+prefix+"graph");

            this.root.selectAll("g, text, svg, line, rect")
                .filter(function(){
                    var view = d3.select(this);
                    var result = false;
                    deleteClasses.forEach(function(one){ result = result || view.classed(one); })
                    return result;
                })
                .remove();
            
            this.svg.selectAll(".tick line")
                .attr("fill", "none")
                .attr("stroke", "#999");
            this.svg.selectAll("."+prefix+"axis-x path")
                .attr("fill", "none")
                .attr("stroke", "#999");
            this.svg.selectAll("."+prefix+"axis-y path")
                .attr("fill", "none")
                .attr("stroke", "#999");
        },
        
        write: function (me) {
            var groupBy = "time";
            
            if(!this.root)this.open();
            
            //avoid writing the same thing again
            if(this.shapes.indexOf(me.id + "_" + me.time)>-1) return; 
            
            this.shapes.push(me.id + "_" + me.time);
            
            
            // check if need to create a new group and do so
            if(this.groups.indexOf(me[groupBy])==-1) {
                this.root.append("g").attr("id", "g_" + me[groupBy]);
                this.groups.push(me[groupBy]);
            }
            
            // put a marker into the group
            if(me.opacity==null)me.opacity = 0.5;
            if(me.fill==null)me.fill = "#ff80dd";
            
            var marker = this.root.select("#g_"+me[groupBy])
                .append(me.type)
                .attr("id", me.id + "_" + me.time)
                .style("fill", me.fill)
                .style("opacity", me.opacity);
            
            switch (me.type){
                case "path": marker
                    .attr("d", me.d); 
                    break;
                    
                case "circle": marker
                    .attr("cx", me.cx)
                    .attr("cy", me.cy)
                    .attr("r", me.r); 
                    break;
            }
            
            this.counter++;
            this.redBall.style("opacity",this.counter%10/12+0.2);
            this.label = me.type + " shapes: " + this.counter;
            this.counterEl.text(this.label);
        },
        
        close: function () {
            
            var result = SVGHEADER + " " + this.container.node().innerHTML
                .replace("param1", "xmlns")
                .replace("param2", "xmlns:xlink")
                //round all numbers in SVG code 
                .replace(/\d+(\.\d+)/g,function(x){return Math.round(+x*100)/100+""});
            
            
            if(result.length/1024/1024 > 2){
                
                alert("The file size is " + Math.round(result.length/1024) + "kB, which is too large to download. Will try to print it in the console instead...")
                console.log(result);
                
            }else{
         
            var link = document.createElement('a');
            link.download = this.name + " " + this.counter + " shapes" + ".svg";
            link.href = 'data:,' + result;
            link.click();
            }
        }



    });


}).call(this);
/*!
 * VIZABI TIMESLIDER
 * Reusable timeslider component
 */

(function () {

  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;
  var Promise = Vizabi.Promise;
  var utils = Vizabi.utils;
  var precision = 3;

  //warn client if d3 is not defined
  if (!Vizabi._require('d3')) {
    return;
  }

  //constants
  var class_playing = "vzb-playing";
  var class_loading = "vzb-ts-loading";
  var class_hide_play = "vzb-ts-hide-play-button";
  var class_dragging = "vzb-ts-dragging";
  var class_axis_aligned = "vzb-ts-axis-aligned";
  var class_show_value = "vzb-ts-show-value";
  var class_show_value_when_drag_play = "vzb-ts-show-value-when-drag-play";

  var time_formats = {
    "year": "%Y",
    "month": "%b",
    "week": "week %U",
    "day": "%d/%m/%Y",
    "hour": "%d/%m/%Y %H",
    "minute": "%d/%m/%Y %H:%M",
    "second": "%d/%m/%Y %H:%M:%S"
  };

  //margins for slider
  var profiles = {
    small: {
      margin: {top: 9, right: 15, bottom: 10, left: 15},
      radius: 8,
      label_spacing: 10
    },
    medium: {
      margin: {top: 9, right: 15, bottom: 10, left: 15},
      radius: 10,
      label_spacing: 12
    },
    large: {
      margin: {top: 9, right: 15, bottom: 10, left: 15},
      radius: 11,
      label_spacing: 14
    }
  };

  Vizabi.Component.extend("gapminder-timeslider", {
    /**
     * Initializes the timeslider.
     * Executed once before any template is rendered.
     * @param config The options passed to the component
     * @param context The component's parent
     */
    init: function (config, context) {
      this.template = this.template || "src/components/_gapminder/timeslider/timeslider.html";

      //define expected models/hooks for this component
      this.model_expects = [{
        name: "time",
        type: "time"
      }];

      var _this = this;

      //starts as splash if this is the option
      this._splash = config.ui.splash;

      //binds methods to this model
      this.model_binds = {
        'change:time': function (evt, original) {
          if(_this._splash !== _this.model.time.splash) {
            _this._splash = _this.model.time.splash;
            _this.readyOnce();
            _this.ready();
          }

          if(!_this._splash) {

            if ((['change:time:start', 'change:time:end']).indexOf(evt) !== -1) {
              _this.changeLimits();
            }
            _this._optionClasses();
            //only set handle position if change is external
            if (!_this._dragging) {
              _this._setHandle(_this.model.time.playing);
            }
          }
        }
      };

      this.ui = utils.extend({
        show_limits: false,
        show_value: false,
        show_value_when_drag_play: true,
        show_button: true,
        class_axis_aligned: false
      }, config.ui, this.ui);

      // Same constructor as the superclass
      this._super(config, context);

      this._dragging = false;
      //defaults
      this.width = 0;
      this.height = 0;

      this.getValueWidth = utils.memoize(this.getValueWidth);
      this._setTime = utils.throttle(this._setTime, 50);
    },

    //template is ready
    readyOnce: function () {

      if(this._splash) return;

      var _this = this;

      //DOM to d3
      this.element = d3.select(this.element);
      this.element.classed(class_loading, false);

      //html elements
      this.slider_outer = this.element.select(".vzb-ts-slider");
      this.slider = this.slider_outer.select("g");
      this.axis = this.element.select(".vzb-ts-slider-axis");
      this.slide = this.element.select(".vzb-ts-slider-slide");
      this.handle = this.slide.select(".vzb-ts-slider-handle");
      this.valueText = this.slide.select('.vzb-ts-slider-value');

      //Scale
      this.xScale = d3.time.scale()
        .clamp(true);
      //Axis
      this.xAxis = d3.svg.axis()
        .orient("bottom")
        .tickSize(0);

      //Value
      this.valueText.attr("text-anchor", "middle").attr("dy", "-1em");

      var brushed = _this._getBrushed(),
        brushedEnd = _this._getBrushedEnd();

      //Brush for dragging
      this.brush = d3.svg.brush()
        .x(this.xScale)
        .extent([0, 0])
        .on("brush", function () {
          brushed.call(this);
        })
        .on("brushend", function () {
          brushedEnd.call(this);
        });

      //Slide
      this.slide.call(this.brush);
      this.slide.selectAll(".extent,.resize")
        .remove();


      this.parent.on('myEvent', function (evt, arg) {
        var layoutProfile = _this.getLayoutProfile();

        if (arg.profile && arg.profile.margin) {
          profiles[layoutProfile].margin = arg.profile.margin;
        }

        // set the right margin that depends on longest label width
        _this.element.select(".vzb-ts-slider-wrapper")
          .style("right", (arg.mRight - profiles[layoutProfile].margin.right) + "px");

        _this.xScale.range([0, arg.rangeMax]);
        _this.resize();
      });
    },

    //template and model are ready
    ready: function () {

      if(this._splash) return;

      var play = this.element.select(".vzb-ts-btn-play");
      var pause = this.element.select(".vzb-ts-btn-pause");
      var _this = this;
      var time = this.model.time;

      play.on('click', function () {
        _this._dragging = false;
        _this.model.time.play();
      });

      pause.on('click', function () {
        _this._dragging = false;
        _this.model.time.pause();
      });//format

      var fmt = time.formatOutput || time_formats[time.unit];
      this.format = d3.time.format(fmt);

      this.changeLimits();
      this.changeTime();
      this.resize();
      this._setHandle(this.model.time.playing);
    },

    changeLimits: function () {
      var minValue = this.model.time.start;
      var maxValue = this.model.time.end;
      //scale
      this.xScale.domain([minValue, maxValue]);
      //axis
      this.xAxis.tickValues([minValue, maxValue])
        .tickFormat(this.format);
    },

    changeTime: function () {
      this.ui.format = this.model.time.unit;
      //time slider should always receive a time model
      var time = this.model.time.value;
      //special classes
      this._optionClasses();
    },

    /**
     * Executes everytime the container or vizabi is resized
     * Ideally,it contains only operations related to size
     */
    resize: function () {

      this.model.time.pause();

      this.profile = profiles[this.getLayoutProfile()];

      var slider_w = parseInt(this.slider_outer.style("width"), 10);
      var slider_h = parseInt(this.slider_outer.style("height"), 10);
      this.width = slider_w - this.profile.margin.left - this.profile.margin.right;
      this.height = slider_h - this.profile.margin.bottom - this.profile.margin.top;
      var _this = this;

      //translate according to margins
      this.slider.attr("transform", "translate(" + this.profile.margin.left + "," + this.profile.margin.top + ")");

      //adjust scale width if it was not set manually before
      if (this.xScale.range()[1] = 1) this.xScale.range([0, this.width]);

      //adjust axis with scale
      this.xAxis = this.xAxis.scale(this.xScale)
        .tickPadding(this.profile.label_spacing);

      this.axis.attr("transform", "translate(0," + this.height / 2 + ")")
        .call(this.xAxis);

      this.slide.select(".background")
        .attr("height", this.height);

      //size of handle
      this.handle.attr("transform", "translate(0," + this.height / 2 + ")")
        .attr("r", this.profile.radius);

      this.sliderWidth = _this.slider.node().getBoundingClientRect().width;

      this._setHandle();

    },

    /**
     * Returns width of slider text value.
     * Parameters in this function needed for memoize function, so they are not redundant.
     */
    getValueWidth: function (layout, value) {
      return this.valueText.node().getBoundingClientRect().width;
    },

    /**
     * Gets brushed function to be executed when dragging
     * @returns {Function} brushed function
     */
    _getBrushed: function () {
      var _this = this;
      return function () {
        _this.model.time.pause();

        if (!_this._blockUpdate) {
          _this._optionClasses();
          _this._blockUpdate = true;
          _this.element.classed(class_dragging, true);
        }

        var value = _this.brush.extent()[0];

        //set brushed properties
        if (d3.event.sourceEvent) {
          _this._dragging = true;
          _this.model.time.dragStart();
          var posX = utils.roundStep(Math.round(d3.mouse(this)[0]), precision);
          value = _this.xScale.invert(posX);

          var layoutProfile = _this.getLayoutProfile();
          var textWidth = _this.getValueWidth(layoutProfile, value);
          var maxPosX = _this.sliderWidth - textWidth / 2;
          if (posX > maxPosX)
            posX = maxPosX;
          else if (posX < 0)
            posX = 0;

          //set handle position
          _this.handle.attr("cx", posX);
          _this.valueText.attr("transform", "translate(" + posX + "," + (_this.height / 2) + ")");
          _this.valueText.text(_this.format(value));
        }

        //set time according to dragged position
        if (value - _this.model.time.value !== 0) {
          _this._setTime(value);
        }
      };
    },

    /**
     * Gets brushedEnd function to be executed when dragging ends
     * @returns {Function} brushedEnd function
     */
    _getBrushedEnd: function () {
      var _this = this;
      return function () {
        _this._dragging = false;
        _this.model.time.dragStop();
        _this._blockUpdate = false;
        _this.element.classed(class_dragging, false);
        _this.model.time.pause();
        _this.model.time.snap();
      };
    },

    /**
     * Sets the handle to the correct position
     * @param {Boolean} transition whether to use transition or not
     */
    _setHandle: function (transition) {
      var value = this.model.time.value;
      this.slide.call(this.brush.extent([value, value]));

      this.valueText.text(this.format(value));

      var old_pos = this.handle.attr("cx");
      var new_pos = this.xScale(value);

      if(old_pos==null) old_pos = new_pos;
      var speed = new_pos > old_pos ? this.model.time.speed : 0;


      if (transition) {
        this.handle.attr("cx", old_pos)
          .transition()
          .duration(speed)
          .ease("linear")
          .attr("cx", new_pos);
      }
      else {
        // issues: 445 & 456
        this.handle.transition()
          .duration(0)
          .attr("cx", new_pos);
        d3.timer.flush();
      }

      this.valueText.attr("transform", "translate(" + old_pos + "," + (this.height / 2) + ")")
        .transition()
        .duration(speed)
        .ease("linear")
        .attr("transform", "translate(" + new_pos + "," + (this.height / 2) + ")");
    },

    /**
     * Sets the current time model to time
     * @param {number} time The time
     */
    _setTime: function (time) {
      //update state
      var _this = this;
      //  frameRate = 50;

      //avoid updating more than once in "frameRate"
      //var now = new Date();
      //if (this._updTime != null && now - this._updTime < frameRate) return;
      //this._updTime = now;

      _this.model.time.value = time;
    },

    /**
     * Applies some classes to the element according to options
     */
    _optionClasses: function () {
      //show/hide classes

      var show_limits = this.ui.show_limits;
      var show_value = this.ui.show_value;
      var show_value_when_drag_play = this.ui.show_value_when_drag_play;
      var axis_aligned = this.ui.axis_aligned;
      var show_play = (this.ui.show_button) && (this.model.time.playable);

      if (!show_limits) {
        this.xAxis.tickValues([]).ticks(0);
      }

      this.element.classed(class_hide_play, !show_play);
      this.element.classed(class_playing, this.model.time.playing);
      this.element.classed(class_show_value, show_value);
      this.element.classed(class_show_value_when_drag_play, show_value_when_drag_play);
      this.element.classed(class_axis_aligned, axis_aligned);
    }
  });

}).call(this);

/*!
 * VIZABI INDICATOR PICKER
 * Reusable indicator picker component
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var globals = Vizabi._globals;
    var utils = Vizabi.utils;

    var INDICATOR = "which";
    var MIN = "min";
    var MAX = "max";
    var SCALETYPE = "scaleType";
    var MODELTYPE_COLOR = "color";

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) return;


    	        //css custom classes
	        var css = {
	            wrapper: 'vzb-treemenu-wrap',
	            search: 'vzb-treemenu-search',
	            list: 'vzb-treemenu-list',
	            list_item: 'vzb-treemenu-list_item',
	            hasChild: 'vzb-treemenu-list_item--children',
	            list_item_label: 'vzb-treemenu-list_item_label',
	            list_top_level: 'vzb-treemenu-list_top',
	            search_wrap: 'vzb-treemenu-search_wrap',
	            isSpecial: 'vzb-treemenu-list_item--special',
	            hidden: 'vzb-hidden',
	            title: 'vzb-treemenu-title'    
	        };
    
    	        //options and globals
	        var OPTIONS = {
	            MENU_ID: 'menu-' + this._id, //identify this menu
	            MOUSE_LOCS: [], //contains last locations of mouse
	            MOUSE_LOCS_TRACKED: 3, //max number of locations of mouse
	            DELAY: 200, //amazons multilevel delay
	            TOLERANCE: 150, //this parameter is used for controlling the angle of multilevel dropdown
	            LAST_DELAY_LOC: null, //this is cached location of mouse, when was a delay
	            TIMEOUT: null, //timeout id
	            SEARCH_PROPERTY: 'id', //property in input data we we'll search by
	            SUBMENUS: 'children', //property for submenus (used by search)
	            SEARCH_MIN_STR: 2, //minimal length of query string to start searching
	            CONTAINER_DIMENSIONS: {}, //current container width, height
	            RESIZE_TIMEOUT: null, //container resize timeout
	            MOBILE_BREAKPOINT: 400, //mobile breakpoint
	            CURRENT_PATH: [], //current active path
	            CURRENT_PROFILE: null, //current resize profile
	            MIN_COL_WIDTH: 50 //minimal column size
	        };

	        var resizeProfiles = [
                { col_width: 300, min: 1280 },
                { col_width: 250, min: 1024 },
                { col_width: 200, min: OPTIONS.MOBILE_BREAKPOINT }
	        ];
    
    
	        //default callback
	        var callback = function(indicator) {
	            console.log("Indicator selector: stub callback fired. New indicator is ", indicator);
	        };

	        //data
	        var tree;

	        //langStrings
	        var langStrings;

	        //language
	        var lang;
    
            //maker id
            var markerID;

    
    
	Vizabi.Component.extend('gapminder-treemenu', {


        //setters-getters
        tree: function(input) { if (!arguments.length) return tree; tree = input; return this; },
        lang: function(input) { if (!arguments.length) return lang; lang = input; return this; },
        langStrings: function(input) { if (!arguments.length) return langStrings; langStrings = input; return this; },
        callback: function(input) { if (!arguments.length) return callback; callback = input; return this; },
        markerID: function(input) { if (!arguments.length) return markerID; markerID = input; return this; },

        init: function(config, context) {
	        var _this = this;

	        this.model_expects = [{
	            name: "marker"
	                //TODO: learn how to expect model "axis" or "size" or "color"
	        }, {
	            name: "language",
	            type: "language"
	        }];

	        this.context = context;

	        this.model_binds = {
	            "change:axis": function(evt) {
	                _this.updateView();
	            },
	            "change:language": function(evt) {
	                _this.updateView();
	            }
	        }

	        //contructor is the same as any component
	        this._super(config, context);

	        this.ui = utils.extend({
                //...add properties here
	        }, this.ui);

	    },

	    ready: function() {
	        this.updateView();
	    },

	    readyOnce: function() {
	        //this function is only called once at start, when both DOM and this.model are ready
	        //this.element contains the view where you can append the menu
	        this.element = d3.select(this.placeholder);

	        //menu class private 
	        var _this = this;


	        //general markup
	        var skeleton = this.element
                .append('div')
                .classed(css.wrapper, true)
                .attr('id', OPTIONS.MENU_ID)
            
            skeleton.append('div')
                .classed(css.title, true)
                .append('span');
            
            skeleton.append('div')
                .classed(css.search_wrap, true)
                .append('input')
                .classed(css.search, true)
                .attr("placeholder", "Search...")
                .attr('type', 'text')
                .attr('id', css.search + '_' + OPTIONS.MENU_ID);





	        //init functions
	        d3.select('body')
                .on('mousemove', _this._mousemoveDocument)
                .select('#' + OPTIONS.MENU_ID)
                .on('mouseleave', function(){_this._closeAllSub(this)});
	        _this._enableSearch();
	        _this._watchContainerSize();

	    },
        
        
        
        
        
        
        
        
        
        toggle: function() {
	            var wrapper = d3.select('#' + OPTIONS.MENU_ID);
	            var hidden = this.element.classed(css.hidden);

	            this.element.classed(css.hidden, !hidden);
            
	            if (!hidden) {
	                wrapper
	                    .selectAll('.' + css.list_item)
	                    .filter('.marquee')
	                    .each(function() {
	                        _this._marqueeToggle(this, false);
	                    });
	            };
	        },


        

	        //if menu lost focus close all levels
	        _closeAllSub: function(view) {
	            view = d3.select(view);

	            view.selectAll('.active')
	                .classed('active', false);

	            view.selectAll('.marquee')
	                .classed('marquee', false);

	            this._resizeDropdown();
	        },

        
        
        
        	        //Keep track of the last few locations of the mouse.
	        _mousemoveDocument: function() {
	            var coordinates = d3.mouse(this);
	            OPTIONS.MOUSE_LOCS.push({x: coordinates[0], y: coordinates[1]});

	            if (OPTIONS.MOUSE_LOCS.length > OPTIONS.MOUSE_LOCS_TRACKED) {
	                OPTIONS.MOUSE_LOCS.shift();
	            }
	        },
        
        
        
	        /**
	         * Return the amount of time that should be used as a delay before the
	         * currently hovered row is activated.
	         *
	         * Returns 0 if the activation should happen immediately. Otherwise,
	         * returns the number of milliseconds that should be delayed before
	         * checking again to see if the row should be activated.
	         */
	        _activationDelay: function(submenu) {
	            var $menu = d3.select(submenu).node();
	            var menuWrap = $menu.parentNode;

	            if ($menu.getElementsByClassName('active').length == 0) {
	                //if current submenu has no opened submenus, open first immediately
	                return 0;
	            }

	            var upperLeft = {
	                    x: $menu.offsetLeft + menuWrap.offsetLeft,
	                    y: $menu.offsetTop + menuWrap.offsetTop - OPTIONS.TOLERANCE
	                },
	                upperRight = {
	                    x: $menu.offsetLeft + menuWrap.offsetLeft + $menu.offsetWidth,
	                    y: upperLeft.y
	                },
	                lowerLeft = {
	                    x: $menu.offsetLeft + menuWrap.offsetLeft,
	                    y: $menu.offsetTop + menuWrap.offsetTop + $menu.offsetHeight + OPTIONS.TOLERANCE
	                },
	                lowerRight = {
	                    x: $menu.offsetLeft + menuWrap.offsetLeft + $menu.offsetWidth,
	                    y: lowerLeft.y
	                },
	                loc = OPTIONS.MOUSE_LOCS[OPTIONS.MOUSE_LOCS.length - 1],
	                prevLoc = OPTIONS.MOUSE_LOCS[0];

	            if (!loc) {
	                return 0;
	            }

	            if (!prevLoc) {
	                prevLoc = loc;
	            }

	            if (prevLoc.x < $menu.offsetLeft ||
	                prevLoc.y < $menu.offsetTop || prevLoc.y > lowerRight.y) {
	                // If the previous mouse location was outside of the entire
	                // menu's bounds, immediately activate.
	                return 0;
	            }

	            if (OPTIONS.LAST_DELAY_LOC &&
	                    loc.x == OPTIONS.LAST_DELAY_LOC.x && loc.y == OPTIONS.LAST_DELAY_LOC.y) {
	                // If the mouse hasn't moved since the last time we checked
	                // for activation status, immediately activate.
	                return 0;
	            }

	            // Detect if the user is moving towards the currently activated
	            // submenu.
	            //
	            // If the mouse is heading relatively clearly towards
	            // the submenu's content, we should wait and give the user more
	            // time before activating a new row. If the mouse is heading
	            // elsewhere, we can immediately activate a new row.
	            //
	            // We detect this by calculating the slope formed between the
	            // current mouse location and the upper/lower right points of
	            // the menu. We do the same for the previous mouse location.
	            // If the current mouse location's slopes are
	            // increasing/decreasing appropriately compared to the
	            // previous's, we know the user is moving toward the submenu.
	            //
	            // Note that since the y-axis increases as the cursor moves
	            // down the screen, we are looking for the slope between the
	            // cursor and the upper right corner to decrease over time, not
	            // increase (somewhat counterintuitively).
	            function slope(a, b) {
	                return (b.y - a.y) / (b.x - a.x);
	            };

	            var decreasingCorner = upperRight,
	                increasingCorner = lowerRight;

	            var decreasingSlope = slope(loc, decreasingCorner),
	                increasingSlope = slope(loc, increasingCorner),
	                prevDecreasingSlope = slope(prevLoc, decreasingCorner),
	                prevIncreasingSlope = slope(prevLoc, increasingCorner);

	            if (decreasingSlope < prevDecreasingSlope &&
	                    increasingSlope > prevIncreasingSlope) {
	                // Mouse is moving from previous location towards the
	                // currently activated submenu. Delay before activating a
	                // new menu row, because user may be moving into submenu.
	                OPTIONS.LAST_DELAY_LOC = loc;
	                return OPTIONS.DELAY;
	            }

	            OPTIONS.LAST_DELAY_LOC = null;
	            return 0;
	        },

 
 
        
	        //watch for resizing
	        _watchContainerSize: function() {
                var _this = this;

	            OPTIONS.CONTAINER_DIMENSIONS = {
	                height: _this.element.node().offsetHeight,
	                width: _this.element.node().offsetWidth
	            };

	            var switchProfile = function(width) {
	                for (var i = 0; i < resizeProfiles.length; i++) {
	                    if(resizeProfiles[i].min < width && i == 0 || resizeProfiles[i].min < width && i != 0 && width < _this.resizeProfiles[i - 1].min) {
	                        OPTIONS.CURRENT_PROFILE = resizeProfiles[i];
	                        OPTIONS.IS_MOBILE = false;
	                        break;
	                    } else if (width <= OPTIONS.MOBILE_BREAKPOINT) {
	                        OPTIONS.CURRENT_PROFILE = null;
	                        OPTIONS.IS_MOBILE = true;
	                    };
	                };

	                if (OPTIONS.IS_MOBILE) {
	                    d3
	                        .select('#' + OPTIONS.MENU_ID)
	                        .classed('mobile', true);

	                    _this.element
	                        .selectAll('*')
	                        .each(function(){
	                            d3
	                                .select(this)
	                                .attr('style', '');
	                        });
	                } else {
	                    d3.select('#' + OPTIONS.MENU_ID).classed('mobile', false);
	                };
	            };

	            //// Start the polling loop, asynchronously.
	            setTimeout(function(){
	                var elem = _this.element,
	                    width = _this.element.node().offsetWidth,
	                    height = _this.element.node().offsetHeight;

	                // If element size has changed since the last time, update the element
	                // data store and trigger the 'resize' event.
	                if ( width !== OPTIONS.CONTAINER_DIMENSIONS.width || height !== OPTIONS.CONTAINER_DIMENSIONS.height ) {
	                    OPTIONS.CONTAINER_DIMENSIONS.width = width;
	                    OPTIONS.CONTAINER_DIMENSIONS.height = height;
	                }

	                switchProfile(OPTIONS.CONTAINER_DIMENSIONS.width);

	                //loop
	                _this._watchContainerSize();

	            }, 500 );
	        },

 
 
        
        
        
        
	        //search listener
	        _enableSearch: function() {
                var _this = this;
                
	            var input = d3.select('#' + css.search + '_' + OPTIONS.MENU_ID);

	            //it forms the array of possible queries
	            var getMatches = function(value) {
	                var matches = [];

	                //translation integration
	                var translation = function(value, data, i) {
	                    var arr = [];
	                    if (_this.langStrings()) {
	                        for (var language in _this.langStrings()) {
	                            for (var key in _this.langStrings()[language]) {
	                                if (_this.langStrings()[language][key].toLowerCase().indexOf(value.toLowerCase()) >= 0) {
	                                    return key;
	                                };
	                            };
	                        };
	                    };
	                };

	                var matching = function(data) {
	                    for (var i = 0; i < data.length; i++) {
	                        var match = false;
	                        match = match || (data[i][OPTIONS.SEARCH_PROPERTY].toLowerCase().indexOf(value.toLowerCase()) >= 0) ||
	                                data[i][OPTIONS.SEARCH_PROPERTY] == translation(value, data, i);

	                        if (match) {
	                            matches.push(data[i]);
	                        }

	                        if(data[i][OPTIONS.SUBMENUS]) {
	                            matching(data[i][OPTIONS.SUBMENUS]);
	                        }
	                    }
	                };

	                matching(tree);

	                return matches;
	            };

	            var searchIt = function() {
	                var value = input.node().value;

	                if(value.length >= OPTIONS.SEARCH_MIN_STR) {
	                    _this.redraw(getMatches(value));
	                } else {
	                    _this.redraw();
	                }
	            };

	            input.on('keyup', searchIt);
	        },


        
        
        	        //marquee animation
	        _marqueeToggle: function(node, toggle) {
	            var selection = d3.select(node),
	                label = selection.select('.' + css.list_item_label);

	            if (toggle) {
	                if(label.node().scrollWidth > node.offsetWidth) {
	                    selection.classed('marquee', true);
	                }
	            } else {
	                selection.classed('marquee', false);
	            }
	        },
 
        
	        //resize function
	       _resizeDropdown: function() {
               
               var _this = this;

	            if (!OPTIONS.IS_MOBILE) {

	                var ulArr = [];
	                ulArr.push(d3.select('#' + OPTIONS.MENU_ID).node());
	                _this.element
	                    .selectAll('.' + css.list + '.active')
	                    .each(function() {
	                        ulArr.push(this);
	                    });

	                var fullColNumber = Math.floor(OPTIONS.CONTAINER_DIMENSIONS.width / OPTIONS.CURRENT_PROFILE.col_width);

	                var remain = OPTIONS.CONTAINER_DIMENSIONS.width - fullColNumber * OPTIONS.CURRENT_PROFILE.col_width;

	                if (remain < OPTIONS.MIN_COL_WIDTH) {
	                    fullColNumber -= 1;
	                    remain += OPTIONS.CURRENT_PROFILE.col_width
	                };

	                for (var i = ulArr.length - 1; i >= 0 ; i--) {
	                    var ulSelectNested = d3.select(ulArr[i]);

	                    if (fullColNumber > 0) {
	                        ulSelectNested
	                            .transition()
	                            .duration(200)
	                            .style('width', OPTIONS.CURRENT_PROFILE.col_width);
	                        fullColNumber --;
	                    } else {
	                        if (remain > OPTIONS.MIN_COL_WIDTH) {
	                            ulSelectNested
	                                .transition()
	                                .duration(200)
	                                .style('width', remain/(i+1));
	                            remain -= remain/(i+1);
	                        } else {
	                            ulSelectNested
	                                .transition()
	                                .duration(200)
	                                .style('width', remain);
	                            remain = 0;
	                        };
	                    };
	                };

	                OPTIONS.CURRENT_PATH = ulArr;

	            }

	        },
        
        
        
        	        //open submenu
	       _toggleSub: function(view){

	            var _this = this;

	            var curSub = view.node().parentNode;

	            var possiblyActivate = function(event, it) {

	                if ((OPTIONS.IS_MOBILE && event.type == 'click')) {

	                    closeAll(curSub);
	                    if (!view.classed('active')) {
	                        open(it);
	                    };
	                    return;

	                } else if (!OPTIONS.IS_MOBILE && event.type == 'mouseenter') {
	                    var delay = _this._activationDelay(curSub);

	                    if (delay) {
	                        OPTIONS.TIMEOUT = setTimeout(function() {
	                            possiblyActivate(event, it);
	                        }, delay);
	                    } else {
	                        open(it);
	                        closeAll(curSub);
	                    };
	                };


	            };

	            var open = function(node){
	                d3.select(node)
	                    .select('.'+css.list)
	                    .classed('active', true);

	                _this._marqueeToggle(node, true);
	            };

	            var closeAll = function(node){
	                var li = d3.select(node)
	                   .selectAll('.'+css.list_item+':not(:hover)');

	                li.each(function() {
	                        d3.select(this)
	                            .selectAll('.'+css.list)
	                            .each(function() {
	                                d3.select(this)
	                                    .classed('active', false);
	                            });
	                    });

	                li.filter('.marquee')
	                    .each(function() {
	                        _this._marqueeToggle(this, false);
	                    });

	                _this._resizeDropdown();

	            };

	            var closeCurSub = function() {
	                if (!OPTIONS.IS_MOBILE) {
	                    var selectSub = d3.select(curSub);

	                    selectSub
	                        .classed('active', false)
	                        .attr('style', '');
	                };

	            };



	            d3.select(curSub)
	                .select('.' + css.list_item)
	                .node()
	                .addEventListener('mouseleave', closeCurSub, false);

	            view.node()
	                .addEventListener('mouseenter', function() { possiblyActivate(event, this); }, false);

	            view.node()
	                .addEventListener('click', function() { possiblyActivate(event, this); }, false);

	        },
        
        
        
	        //this function process click on list item
	        _selectIndicator: function(view) {
                
	            var item = d3.select(view).data()[0];

                //only for leaf nodes
	            if (!item.children) {
	                callback(item.id, markerID);
	                this.toggle();
	            };

	        },
        
        
        
        
	        //function is redrawing data and built structure
	        redraw: function (data){
                var _this = this;
                
                this.element.select("." + css.title).select("span")
                    .text( this.translator("buttons/" + markerID) );
                
                if (data == null) data = tree;
                    
	            this.element
                    .select('#' + OPTIONS.MENU_ID)
                    .select('.' + css.list_top_level)
                    .remove();

	            //redrawing first level
	            var firstLevelMenu = this.element
                    .select('#' + OPTIONS.MENU_ID)
                    .append('ul')
                    .classed(css.list_top_level, true);

	            //translation integration
//	            var getTranslation = function(d) {
//	                if (_this.lang()) {
//	                    for (var key in _this.langStrings()[_this.lang()]) {
//	                        if (_this.langStrings()[_this.lang()].hasOwnProperty(d['id'])) {
//	                            if (key == d['id']) {
//	                                return _this.langStrings()[_this.lang()][key];
//	                            }
//	                        } else {
//	                            return d['id'];
//	                        }
//	                    };
//	                } else {
//	                    return d['id'];
//	                };
//	            };
                
                var indicatorsDB = globals.metadata.indicatorsDB;
                
                var filterAvailable = function(data){
                    return data
                        .filter(function(f){
                            return f.children || globals.metadata.indicatorsArray.indexOf(f.id) > -1;
                        })
                        .filter(function(f){
                        
                            //keep indicator if nothing is specified in tool properties
                            if (!_this.model.marker[markerID].allow || !_this.model.marker[markerID].allow.scales) return true;
                            //keep indicator if any scale is allowed in tool properties
                            if (_this.model.marker[markerID].allow.scales[0] == "*") return true;
                        
                            //keep indicator if it is a folder
                            if(f.children) return true;

                            //check if there is an intersection between the allowed tool scale types and the ones of indicator
                            for (var i = indicatorsDB[f.id].scales.length - 1; i >= 0; i--) {
                                if (_this.model.marker[markerID].allow.scales.indexOf(indicatorsDB[f.id].scales[i]) > -1) return true;
                            }

                            return false;
                        })
                };

	            //bind the data
	            var li = firstLevelMenu.selectAll('li')
                    .data(filterAvailable(data), function(d){ return d['id']; });

	            //removing old items
	            li.exit().remove();


	            //adding new items
	            li.enter().append('li');

	            li.append('span')
	                .classed(css.list_item_label, true)
	                .text(function(d){
	                    return _this.translator("indicator/" + d.id);
	                })
	                .on('click', function(){_this._selectIndicator(this)});

	            li.classed(css.list_item, true)
	                .classed(css.hasChild, function(d) { return d['children']; })
	                .classed(css.isSpecial, function(d) { return d['special']; })
	                .each(function(d) {
	                    var view = d3.select(this);
	                    _this._toggleSub(view);

	                    var parsingProcess = function(select, data) {
	                        if(data != null) {
	                            var li = select
	                                .append('ul')
	                                .classed(css.list, true)
	                                .selectAll('li')
	                                .data(filterAvailable(data), function(d) { return d['id']; })
	                                .enter()
	                                .append('li');

	                            li.append('span')
	                                .classed(css.list_item_label, true)
	                                .text(function (d) {
	                                    return _this.translator("indicator/" + d.id);
	                                })
	                                .on('click', function(){_this._selectIndicator(this)});

	                            li.classed(css.list_item, true)
	                                .classed(css.hasChild, function(d) { return d['children']; })
	                                .classed(css.isSpecial, function(d) { return d['special']; })
	                                .each(function(d){
	                                    _this._toggleSub(d3.select(this));
	                                    parsingProcess(d3.select(this), d['children']);
	                                });
	                        };
	                    };

	                    parsingProcess(view, d['children']);

	                });

                return this;
	        },
        
        
        
        
        
        

	    updateView: function() {
	        var _this = this;
            var languageID = _this.model.language.id;
            
            if(!markerID) return;
            
            var strings = langStrings? langStrings : {};
            strings[languageID] = _this.model.language.strings[languageID];
            
            this.translator = this.model.language.getTFunction();
            
	        var setModel = this._setModel.bind(this);
	        this.langStrings(strings)
                .lang(languageID)
                .callback(setModel)
                .tree(globals.metadata.indicatorsTree)
                .redraw();
            
            return this;
	    },

	    _setModel: function(value, markerID) {
            
            var indicatorsDB = globals.metadata.indicatorsDB;


            var mdl = this.model.marker[markerID];

            var obj = {};
            
            obj.which = value;
	        obj.use = indicatorsDB[value].use;
	        obj.scaleType = indicatorsDB[value].scales[0];
            
            if (mdl.getType() == 'axis') {
                obj.min = null;
                obj.max = null;
            }
             

            mdl.set(obj);
            
            
	    }


	});

}).call(this);
/*!
 * VIZABI Axis Model (hook)
 */

(function () {

  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;

  //warn client if d3 is not defined
  if (!Vizabi._require('d3')) {
    return;
  }

  //constant time formats
  var time_formats = {
    "year": d3.time.format("%Y"),
    "month": d3.time.format("%Y-%m"),
    "week": d3.time.format("%Y-W%W"),
    "day": d3.time.format("%Y-%m-%d"),
    "hour": d3.time.format("%Y-%m-%d %H"),
    "minute": d3.time.format("%Y-%m-%d %H:%M"),
    "second": d3.time.format("%Y-%m-%d %H:%M:%S")
  };

  Vizabi.Model.extend('axis', {
    /**
     * Initializes the color hook
     * @param {Object} values The initial values of this model
     * @param parent A reference to the parent model
     * @param {Object} bind Initial events to bind
     */
    init: function (values, parent, bind) {

      this._type = "axis";
      values = utils.extend({
        use: "value",
        which: undefined,
        min: null,
        max: null
      }, values);
      this._super(values, parent, bind);
    },

    /**
     * Validates a color hook
     */
    validate: function () {

      var possibleScales = ["log", "genericLog", "linear", "time", "pow"];
      if (!this.scaleType || (this.use === "indicator" && possibleScales.indexOf(this.scaleType) === -1)) {
        this.scaleType = 'linear';
      }

      if (this.use !== "indicator" && this.scaleType !== "ordinal") {
        this.scaleType = "ordinal";
      }

      //TODO a hack that kills the scale, it will be rebuild upon getScale request in model.js
      if (this.which_1 != this.which || this.scaleType_1 != this.scaleType) this.scale = null;
      this.which_1 = this.which;
      this.scaleType_1 = this.scaleType;

      if(this.scale && this._readyOnce && this.use=="indicator"){
          if(this.min==null) this.min = this.scale.domain()[0];
          if(this.max==null) this.max = this.scale.domain()[1];

          if(this.min<=0 && this.scaleType=="log") this.min = 0.01;
          if(this.max<=0 && this.scaleType=="log") this.max = 10;

          // Max may be less than min
          // if(this.min>=this.max) this.min = this.max/2;

          if(this.min!=this.scale.domain()[0] || this.max!=this.scale.domain()[1])
              this.scale.domain([this.min, this.max]);
      }
    },


    /**
     * Gets the domain for this hook
     * @returns {Array} domain
     */
    buildScale: function (margins) {
      var domain;
      var scaleType = this.scaleType || "linear";
      if (margins === undefined)
        margins = true;

      if (typeof margins === 'boolean') {
        var res = margins;
        margins = {};
        margins.min = res;
        margins.max = res;
      }

      if (this.scaleType == "time") {
        var limits = this.getLimits(this.which);
        this.scale = d3.time.scale().domain([limits.min, limits.max]);
        return;
      }

      switch (this.use) {
        case "indicator":
          var limits = this.getLimits(this.which),
            margin = (limits.max - limits.min) / 20;

          domain = [(limits.min - (margins.min && margin ? margin : 0)), (limits.max + (margins.max && margin ? margin : 0))];
          if (scaleType == "log") {
            domain = [(limits.min - limits.min / 4), (limits.max + limits.max / 4)];
          }

          break;
        case "property":
          domain = this.getUnique(this.which);
          break;
        case "value":
        default:
          domain = [this.which];
          break;
      }


      if (this.min!=null && this.max!=null && scaleType !== 'ordinal') {
        domain = [this.min, this.max];
        this.min = domain[0];
        this.max = domain[1]; 
      }
        
      this.scale = d3.scale[scaleType]().domain(domain);
    }
  });
}).call(this);

/*!
 * VIZABI Color Model (hook)
 */

(function () {

  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;
  var globals = Vizabi._globals;

  //warn client if d3 is not defined
  if (!Vizabi._require('d3')) {
    return;
  }

  Vizabi.Model.extend('color', {

    /**
     * Initializes the color hook
     * @param {Object} values The initial values of this model
     * @param parent A reference to the parent model
     * @param {Object} bind Initial events to bind
     */
    init: function (values, parent, bind) {

      this._type = "color";

      values = utils.extend({
        use: "value",
        palette: null,
        which: undefined
      }, values);

      this._original_palette = values.palette;

      this._super(values, parent, bind);

      this._firstLoad = true;
      this._hasDefaultColor = false;
    },

    /**
     * Get the above constants
     */
    getPalettes: function () {
      var palettes = (globals.metadata) ? globals.metadata.color.palettes : {
        "_continuous": {
          "0": "#F77481",
          "1": "#E1CE00",
          "2": "#B4DE79"
        },
        "_discrete": {
          "0": "#1f77b4",
          "1": "#aec7e8",
          "3": "#ff7f0e",
          "4": "#2ca02c",
          "5": "#98df8a",
          "6": "#ffbb78",
          "7": "#d62728",
          "8": "#ff9896",
          "9": "#9467bd",
          "10": "#c5b0d5"
        },
        "_default": {
          "_default": "#fa5ed6"
        }
      };

      return palettes;
    },

    afterPreload: function() {
      this._resetPalette = true;
      this._super();
    },

    /**
     * Get the above constants
     */
    isUserSelectable: function (whichPalette) {

      var userSelectable = (globals.metadata) ? globals.metadata.color.selectable : {};

      if (userSelectable[whichPalette] == null) return true;
      return userSelectable[whichPalette];
    },

    /**
     * Validates a color hook
     */
    validate: function () {

      var palettes = this.getPalettes();

      var possibleScales = ["log", "genericLog", "linear", "time", "pow"];
      if (!this.scaleType || (this.use === "indicator" && possibleScales.indexOf(this.scaleType) === -1)) {
        this.scaleType = 'linear';
      }
      if (this.use !== "indicator" && this.scaleType !== "ordinal") {
        this.scaleType = "ordinal";
      }

      // reset palette in the following cases:
      // first load and no palette supplied in the state
      // or changing of the indicator
      if (this.palette == null
        || this._firstLoad === false && this.which_1 != this.which
        || this._firstLoad === false && this.scaleType_1 != this.scaleType
        || this._resetPalette) {

        //TODO a hack that prevents adding properties to palette (need replacing)
        this.set("palette", this._original_palette, false);
        //TODO a hack that kills the scale, it will be rebuild upon getScale request in model.js
        this.scale = null;
        if (palettes[this.which]) {
          this.palette = utils.clone(palettes[this.which]);
        } else if (this.use === "value") {
          this.palette = {"_default": this.which};
        } else if (this.use === "indicator") {
          this.palette = utils.clone(palettes["_continuous"]);
        } else if (this.use === "property") {
          this.palette = utils.clone(palettes["_discrete"]);
        } else {
          this.palette = utils.clone(palettes["_default"]);
        }

        this._resetPalette = false;
      }

      this.which_1 = this.which;
      this.scaleType_1 = this.scaleType;
      this._firstLoad = false;
    },

    /**
     * set color
     */
    setColor: function (value, pointer) {
      var temp = this.palette.getObject();
      temp[pointer] = value;
      this.scale.range(utils.values(temp));
      this.palette[pointer] = value;
    },


    /**
     * maps the value to this hook's specifications
     * @param value Original value
     * @returns hooked value
     */
    mapValue: function (value) {
      //if the property value does not exist, supply the _default
      // otherwise the missing value would be added to the domain
      if (this.scale != null
        && this.use == "property"
        && this._hasDefaultColor
        && this.scale.domain().indexOf(value) == -1) value = "_default";
      return this._super(value);
    },


    /**
     * Gets the domain for this hook
     * @returns {Array} domain
     */
    buildScale: function () {
      var _this = this;

      var domain = Object.keys(_this.palette.getObject());
      var range = utils.values(_this.palette.getObject());

      this._hasDefaultColor = domain.indexOf("_default") > -1;

      if (this.scaleType == "time") {
        var limits = this.getLimits(this.which);
        var step = ((limits.max.valueOf() - limits.min.valueOf()) / (range.length - 1));
        domain = d3.range(limits.min.valueOf(), limits.max.valueOf(), step).concat(limits.max.valueOf());

        this.scale = d3.time.scale()
          .domain(domain)
          .range(range)
          .interpolate(d3.interpolateRgb);
        return;
      }

      switch (this.use) {
        case "indicator":
          var limits = this.getLimits(this.which);
          var step = ((limits.max - limits.min) / (range.length - 1));
          domain = d3.range(limits.min, limits.max, step).concat(limits.max);
            domain= domain.reverse();
          if (this.scaleType == "log") {
            var s = d3.scale.log()
              .domain([limits.min === 0 ? 1 : limits.min, limits.max])
              .range([limits.min, limits.max]);
            domain = domain.map(function (d) {
              return s.invert(d)
            });
          }

          this.scale = d3.scale[this.scaleType]()
            .domain(domain)
            .range(range)
            .interpolate(d3.interpolateRgb);
          return;

        default:
          this.scale = d3.scale["ordinal"]()
            .domain(domain)
            .range(range);
          return;
      }
    }

  });

}).call(this);













(function () {

  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;

  Vizabi.Model.extend('data', {

    /**
     * Initializes the data model.
     * @param {Object} values The initial values of this model
     * @param parent A reference to the parent model
     * @param {Object} bind Initial events to bind
     */
    init: function (values, parent, bind) {

      this._type = "data";
      values = utils.extend({
        reader: "csv-file",
        splash: false
      }, values);

      //same constructor as parent, with same arguments
      this._super(values, parent, bind);
    }

  });

}).call(this);

/*!
 * VIZABI Entities Model
 */

(function () {

  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;

  Vizabi.Model.extend('entities', {
    /**
     * Initializes the entities model.
     * @param {Object} values The initial values of this model
     * @param parent A reference to the parent model
     * @param {Object} bind Initial events to bind
     */
    init: function (values, parent, bind) {

      this._type = "entities";
      values = utils.extend({
        show: {},
        select: [],
        highlight: [],
        opacitySelectDim: 0.3,
        opacityRegular: 1,
        needUpdate: {}
      }, values);

      this._visible = [];
      this._multiple = true;

      this._super(values, parent, bind);
    },

    /**
     * Validates the model
     * @param {boolean} silent Block triggering of events
     */
    validate: function (silent) {
      var _this = this;
      var dimension = this.getDimension();
      var visible_array = this._visible.map(function (d) {
        return d[dimension]
      });

      if(visible_array.length) {
        this.select = this.select.filter(function (f) {
          return visible_array.indexOf(f[dimension]) !== -1;
        });
        this.highlight = this.highlight.filter(function (f) {
          return visible_array.indexOf(f[dimension]) !== -1;
        });
      }
    },

    /**
     * Sets the visible entities
     * @param {Array} arr
     */
    setVisible: function(arr) {
      this._visible = arr;
    },

    /**
     * Gets the visible entities
     * @returns {Array} visible
     */
    getVisible: function(arr) {
      return this._visible;
    },

    /**
     * Determines whether multiple entities can be selected
     * @param {Boolean} bool
     */
    selectMultiple: function(bool) {
      this._multiple = bool;
    },

    /**
     * Gets the dimensions in this entities
     * @returns {String} String with dimension
     */
    getDimension: function () {
      return this.dim;
    },

    /**
     * Gets the filter in this entities
     * @returns {Array} Array of unique values
     */
    getFilter: function () {
      return this.show.getObject();
    },

    /**
     * Gets the selected items
     * @returns {Array} Array of unique selected values
     */
    getSelected: function () {
      var dim = this.getDimension();
      return this.select.map(function (d) {
        return d[dim];
      });
    },

    /**
     * Selects or unselects an entity from the set
     */
    selectEntity: function (d, timeDim, timeFormatter) {
      var dimension = this.getDimension();
      var value = d[dimension];
      if (this.isSelected(d)) {
        this.select = this.select.filter(function (d) {
          return d[dimension] !== value;
        });
      } else {
        var added = {};
        added[dimension] = value;
        added["labelOffset"] = [0, 0];
        if (timeDim && timeFormatter) {
          added["trailStartTime"] = timeFormatter(d[timeDim]);
        }
        this.select = (this._multiple) ? this.select.concat(added) : [added];
      }
    },

    setLabelOffset: function (d, xy) {
      var dimension = this.getDimension();
      var value = d[dimension];

      utils.find(this.select, function (d) {
        return d[dimension] === value;
      }).labelOffset = xy;

      //force the model to trigger events even if value is the same
      this.set("select", this.select, true);
    },

    /**
     * Selects an entity from the set
     * @returns {Boolean} whether the item is selected or not
     */
    isSelected: function (d) {
      var dimension = this.getDimension();
      var value = d[this.getDimension()];

      var select_array = this.select.map(function (d) {
        return d[dimension];
      });

      return select_array.indexOf(value) !== -1;
    },

    /**
     * Clears selection of items
     */
    clearSelected: function () {
      this.select = [];
    },


    setHighlighted: function (arg) {
      this.highlight = [].concat(arg);
    },

    //TODO: join the following 3 methods with the previous 3

    /**
     * Highlights an entity from the set
     */
    highlightEntity: function (d, timeDim, timeFormatter) {
      var dimension = this.getDimension();
      var value = d[dimension];
      if (!this.isHighlighted(d)) {
        var added = {};
        added[dimension] = value;
        added = utils.extend(d, added);
        if (timeDim && timeFormatter) {
          added["trailStartTime"] = timeFormatter(d[timeDim]);
        }
        this.highlight = this.highlight.concat(added);
      }
    },

    /**
     * Unhighlights an entity from the set
     */
    unhighlightEntity: function (d) {
      var dimension = this.getDimension();
      var value = d[dimension];
      if (this.isHighlighted(d)) {
        this.highlight = this.highlight.filter(function (d) {
          return d[dimension] !== value;
        });
      }
    },

    /**
     * Checks whether an entity is highlighted from the set
     * @returns {Boolean} whether the item is highlighted or not
     */
    isHighlighted: function (d) {
      var dimension = this.getDimension();
      var value = d[this.getDimension()];

      var highlight_array = this.highlight.map(function (d) {
        return d[dimension];
      });

      return highlight_array.indexOf(value) !== -1;
    },

    /**
     * Clears selection of items
     */
    clearHighlighted: function () {
      this.highlight = [];
    },
    setNeedUpdate: function(){
      this.needUpdate = new Date();
    }
  });

}).call(this);

(function () {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) return;
    
    Vizabi.Model.extend('group', {

        /**
         * Initializes the group hook
         * @param {Object} values The initial values of this model
         * @param parent A reference to the parent model
         * @param {Object} bind Initial events to bind
         */
        init: function (values, parent, bind) {

            this._type = "model";
            values = utils.extend({
                use: "property",
                which: undefined,
                merge: false,
                manualSorting: null
            }, values);
            this._super(values, parent, bind);
        },

        /**
         * Validates a color hook
         */
        validate: function () {
            //there must be no scale
            if (this.scale) this.scale = null;

            //use must be "property" 
            if (this.use != "property") {
                utils.warn("group model: use must not be 'property'. Resetting...")
                this.use = "property";
            }
        },

        /**
         * There must be no scale
         */
        buildScale: function () {}

    });

}).call(this);
/*!
 * VIZABI Language Model
 */

(function () {

  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;

  Vizabi.Model.extend('language', {

    /**
     * Initializes the language model.
     * @param {Object} values The initial values of this model
     * @param parent A reference to the parent model
     * @param {Object} bind Initial events to bind
     */
    init: function (values, parent, bind) {

      this._type = "language";
      //default values for state model
      values = utils.extend({
        id: "en",
        strings: {}
      }, values);

      //same constructor, with same arguments
      this._super(values, parent, bind);
    },

    /**
     * Gets a certain UI string
     * @param {String} id string identifier
     * @param {String} lang language
     * @param {Object} ui_strings ui_strings object or model
     * @returns {string} translated string
     */
    getUIString: function (id, lang, strings) {
      lang = lang || this.id;
      strings = strings || this.strings;

      if (strings && strings.hasOwnProperty(lang) && strings[lang].hasOwnProperty(id)) {
        return strings[lang][id];
      } else {
        return id;
      }
    },

    /**
     * Gets the translation function
     * @returns {string} translation function
     */
    getTFunction: function () {
      var lang = this.id,
        strings = this.strings,
        _this = this;

      return function (string) {
        return _this.getUIString(string, lang, strings);
      }
    }
    
  });

}).call(this);

(function () {

  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;

  //warn client if d3 is not defined
  if (!Vizabi._require('d3')) {
    return;
  }

  Vizabi.Model.extend('size', {

    /**
     * Initializes the size hook
     * @param {Object} values The initial values of this model
     * @param parent A reference to the parent model
     * @param {Object} bind Initial events to bind
     */
    init: function (values, parent, bind) {

      this._type = "size";
      values = utils.extend({
        use: "value",
        min: 0,
        max: 1,
        which: undefined
      }, values);
      this._super(values, parent, bind);
    },

    /**
     * Validates a size hook
     */
    validate: function () {
      //there must be a min and a max
      if (typeof this.min === 'undefined' || this.min < 0) {
        this.min = 0;
      }
      if (typeof this.max === 'undefined' || this.max > 1) {
        this.max = 1;
      }
      if (this.max < this.min) {
        this.set('min', this.max, true);
      }
      
      //value must always be between min and max
      if (this.use === "value" && this.which > this.max) {
        this.which = this.max;
      }
      else if (this.use === "value" && this.which < this.min) {
        this.which = this.min;
      }
      if (!this.scaleType) {
        this.scaleType = 'linear';
      }
      if (this.use === "property") {
        this.scaleType = 'ordinal';
      }

      //TODO a hack that kills the scale, it will be rebuild upon getScale request in model.js
      if (this.which_1 != this.which || this.scaleType_1 != this.scaleType) this.scale = null;
      this.which_1 = this.which;
      this.scaleType_1 = this.scaleType;
    },

    /**
     * Gets the domain for this hook
     * @returns {Array} domain
     */
    buildScale: function () {
      if (this.use === "value") {
        this.scale = d3.scale.linear().domain([0, 1]);
      }
      this._super();
    }

  });

}).call(this);

(function () {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) return;
    
    var palettes = {
        'ALL': "all",
        _default: "none"
    };

    Vizabi.Model.extend('stack', {

        /**
         * Initializes the stack hook
         * @param {Object} values The initial values of this model
         * @param parent A reference to the parent model
         * @param {Object} bind Initial events to bind
         */
        init: function (values, parent, bind) {

            this._type = "model";
            values = utils.extend({
                use: "value",
                which: undefined,
                merge: false
            }, values);
            this._super(values, parent, bind);
        },

        /**
         * Validates a color hook
         */
        validate: function () {
            //there must be no scale
            if (this.scale) this.scale = null;

            //use must not be "indicator" 
            if (this.use === "indicator") {
                utils.warn("stack model: use must not be 'indicator'. Resetting use to 'value' and which to '"+palettes._default)
                this.use = "value";
                this.which = palettes._default;
            }
            
            //if use is "value"
            if (this.use === "value" && utils.values(palettes).indexOf(this.which)==-1) {
                utils.warn("stack model: the requested value '" + this.which + "' is not allowed. resetting to '"+palettes._default)
                this.which == palettes._default;
            }
        },

        /**
         * Get the above constants
         */
        getPalettes: function () {
            return palettes;
        },

        /**
         * There must be no scale
         */
        buildScale: function () {}

    });

}).call(this);
/*!
 * VIZABI Time Model
 */

(function () {

  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;

  //do not create model if d3 is not defined
  if (!Vizabi._require('d3')) return;

  //constant time formats
  var time_formats = {
    "year": "%Y",
    "month": "%Y-%m",
    "week": "%Y-W%W",
    "day": "%Y-%m-%d",
    "hour": "%Y-%m-%d %H",
    "minute": "%Y-%m-%d %H:%M",
    "second": "%Y-%m-%d %H:%M:%S"
  };

  var time_units = Object.keys(time_formats);
  var formatters = utils.values(time_formats);

  Vizabi.Model.extend('time', {

    /**
     * Initializes the language model.
     * @param {Object} values The initial values of this model
     * @param parent A reference to the parent model
     * @param {Object} bind Initial events to bind
     */
    init: function (values, parent, bind) {

      this._type = "time";
      //default values for time model
      values = utils.extend({
        dim: "time",
        value: "1800",
        start: "1800",
        end: "2014",
        playable: true,
        playing: false,
        loop: false,
        round: 'floor',
        speed: 300,
        unit: "year",
        step: 1, //step must be integer
        adaptMinMaxZoom: false, //TODO: remove from here. only for bubble chart
        formatInput: "%Y", //defaults to year format
        xLogStops: [], //TODO: remove from here. only for mountain chart
        yMaxMethod: "latest", //TODO: remove from here. only for mountain chart
        record: false,
        dragging: false,
        povertyline: 0, //TODO: remove from here. only for mountain chart
        povertyCutoff: 0, //TODO: remove from here. only for mountain chart
        povertyFade: 1, //TODO: remove from here. only for mountain chart
        gdpFactor: 1, //TODO: remove from here. only for mountain chart
        gdpShift: 0, //TODO: remove from here. only for mountain chart
        xPoints: 50 //TODO: remove from here. only for mountain chart
      }, values);

      values.formatOutput = values.formatOutput || values.formatInput;

      //same constructor
      this._super(values, parent, bind);

      var _this = this;
      this._playing_now = false;

      //bing play method to model change
      this.on({
        "change:playing": function () {
          if (_this.playing === true) {
            _this._startPlaying();
          } else {
            _this._stopPlaying();
          }
        },
        "set": function () {
          //auto play if playing is true by reseting variable
          if (_this.playing === true) {
            _this.set('playing', true, true); //3rd argumennt forces update
          }

          this.snap("start");
          this.snap("end");
          this.snap("value");
        }
      });
    },

    /**
     * Formats value, start and end dates to actual Date objects
     */
    _formatToDates: function () {

      var date_attr = ["value", "start", "end"];
      var fmts = [this.formatInput].concat(formatters);
      for (var i = 0; i < date_attr.length; i++) {
        var attr = date_attr[i];
        if (!utils.isDate(this[attr])) {
          for (var j = 0; j < fmts.length; j++) {
            var formatter = d3.time.format(fmts[j]);
            var date = formatter.parse(this[attr].toString());
            if (utils.isDate(date)) {
              this.set(attr, date);
              break;
            }
          }
        }
      }
    },

    /**
     * Validates the model
     */
    validate: function () {

      //unit has to be one of the available_time_units
      if (time_units.indexOf(this.unit) === -1) {
        this.unit = "year";
      }

      if (this.step < 1) {
        this.step = "year";
      }

      //make sure dates are transformed into dates at all times
      if (!utils.isDate(this.start) || !utils.isDate(this.end) || !utils.isDate(this.value)) {
        this._formatToDates();
      }

      //end has to be >= than start
      if (this.end < this.start) {
        this.end = this.start;
      }
      //value has to be between start and end
      if (this.value < this.start) {
        this.value = this.start;
      } else if (this.value > this.end) {
        this.value = this.end;
      }

      if (this.playable === false && this.playing === true) {
        this.playing = false;
      }
    },

    /**
     * Plays time
     */
    play: function () {
      this.playing = true;
    },

    /**
     * Pauses time
     */
    pause: function () {
      this.playing = false;
    },
      
    /**
     * Indicates dragging of time
     */
    dragStart: function () {
      this.dragging = true;
    },
     dragStop: function () {
      this.dragging = false;
    },

    /**
     * gets time range
     * @returns range between start and end
     */
    getRange: function () {
      return d3.time[this.unit].range(this.start, this.end, this.step);
    },

    /**
     * Gets filter for time
     * @param {Boolean} firstScreen get filter for current year only
     * @returns {Object} time filter
     */
    getFilter: function (firstScreen) {
      var start = d3.time.format(this.formatInput || "%Y")(this.start);
      var end = d3.time.format(this.formatInput || "%Y")(this.end);
      var value = d3.time.format(this.formatInput || "%Y")(this.value);
      var dim = this.getDimension();
      var filter = {};

      filter[dim] = (firstScreen) ? [[value]] : [[start, end]];
      return filter;
    },

    /**
     * Gets formatter for this model
     * @returns {Function} formatter function
     */
    getFormatter: function () {
      var f = d3.time.format(this.formatInput || "%Y");
      return function (d) {
        return f.parse(d);
      }
    },

    /**
     * Gets an array with all time steps for this model
     * @returns {Array} time array
     */
    getAllSteps: function() {
      var arr = [];
      var curr = this.start;
      while(curr <= this.end) {
        arr.push(curr);
        curr = d3.time[this.unit].offset(curr, this.step);
      }
      return arr;
    },

    /**
     * Snaps the time to integer
     * possible inputs are "start", "end", "value". "value" is default
     */
    snap: function (what) {
      if (!this.round) return;
      if (what == null) what = "value";
      var op = 'round';
      if (this.round === 'ceil') op = 'ceil';
      if (this.round === 'floor') op = 'floor';
      var time = d3.time[this.unit][op](this[what]);

      this.set(what, time, true); //3rd argumennt forces update
    },

    /**
     * Starts playing the time, initializing the interval
     */
    _startPlaying: function () {
      //don't play if it's not playable or if it's already playing
      if (!this.playable || this._playing_now) return;

      this._playing_now = true;

      var _this = this,
        time = this.value,
        interval = this.speed; // * this.step;

      this.snap();

      //go to start if we start from end point
      if (_this.end - time <= 0) {
        time = this.start;
        _this.value = time;
      }

      //we don't create intervals directly
      this._intervals.setInterval('playInterval_' + this._id, function () {
        if (time >= _this.end) {
          if (_this.loop) {
            time = _this.start;
            _this.value = time
          } else {
            _this.playing = false;
          }
          return;
        } else {
          time = d3.time[_this.unit].offset(time, _this.step);
          _this.value = time;
        }
      }, interval);

      this.trigger("play");
    },

    /**
     * Stops playing the time, clearing the interval
     */
    _stopPlaying: function () {
      this._playing_now = false;
      this._intervals.clearInterval('playInterval_' + this._id);
      this.snap();
      this.trigger("pause");
    }

  });


}).call(this);

/*!
 * Local JSON reader
 */

(function () {

  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;
  var Promise = Vizabi.Promise;

  var FILE_CACHED = {}; //caches files from this reader
  var FILE_REQUESTED = {}; //caches files from this reader

  Vizabi.Reader.extend('csv-file', {

    /**
     * Initializes the reader.
     * @param {Object} reader_info Information about the reader
     */
    init: function (reader_info) {
      this._name = 'csv-file';
      this._data = [];
      this._basepath = reader_info.path;
      this._formatters = reader_info.formatters;
      if (!this._basepath) {
        utils.error("Missing base path for csv-file reader");
      }
    },

    /**
     * Reads from source
     * @param {Object} query to be performed
     * @param {String} language language
     * @returns a promise that will be resolved when data is read
     */
    read: function (query, language) {
      var _this = this;
      var p = new Promise();

      //this specific reader has support for the tag {{LANGUAGE}}
      var path = this._basepath.replace("{{LANGUAGE}}", language);

      //if only one year, files ending in "-YYYY.csv"
      if(query.where.time[0].length === 1) {
        path = path.replace(".csv", "-"+ query.where.time[0][0] +".csv");
      }

      //replace conditional tags {{<any conditional>}}
      path = path.replace(/{{(.*?)}}/g, function(match, capture){
        capture = capture.toLowerCase();
        if(utils.isArray(query.where[capture])) {
          return query.where[capture].sort().join('-');
        }
        return query.where[capture];
      });

      _this._data = [];

      (function (query, p) {

        //if cached, retrieve and parse
        if (FILE_CACHED.hasOwnProperty(path)) {
          parse(FILE_CACHED[path]);
        }
        //if requested by another hook, wait for the response
        else if (FILE_REQUESTED.hasOwnProperty(path)) {
          FILE_REQUESTED[path].then(function () {
            parse(FILE_CACHED[path]);
          });
        }
        //if not, request and parse
        else {
          d3.csv(path, function (error, res) {

            if (!res) {
              utils.error("No permissions or empty file: " + path, error);
              return;
            }

            if (error) {
              utils.error("Error Happened While Loading CSV File: " + path, error);
              return;
            }

            //fix CSV response
            res = format(res);

            //cache and resolve
            FILE_CACHED[path] = res;
            FILE_REQUESTED[path].resolve();
            delete FILE_REQUESTED[path];

            parse(res);
          });
          FILE_REQUESTED[path] = new Promise();
        }

        function format(res) {
          //make category an array and fix missing regions
          res = res.map(function (row) {
            row['geo.cat'] = [row['geo.cat']];
            row['geo.region'] = row['geo.region'] || row['geo'];
            return row;
          });

          //format data
          res = utils.mapRows(res, _this._formatters);

          //TODO: fix this hack with appropriate ORDER BY
          //order by formatted
          //sort records by time
          var keys = Object.keys(_this._formatters);
          var order_by = keys[0];
          res.sort(function (a, b) {
            return a[order_by] - b[order_by];
          });
          //end of hack

          return res;
        }

        function parse(res) {

          var data = res;
          //rename geo.category to geo.cat
          var where = query.where;
          if (where['geo.category']) {
            where['geo.cat'] = utils.clone(where['geo.category']);
            delete where['geo.category'];
          }

          //format values in the dataset and filters
          where = utils.mapRows([where], _this._formatters)[0];

          //make sure conditions don't contain invalid conditions
          var validConditions = [];
          utils.forEach(where, function(v, p) {
            for (var i = 0, s = data.length; i<s; i++) {
              if(data[i].hasOwnProperty(p)) {
                validConditions.push(p);
                return true;
              }
            };
          });
          //only use valid conditions
          where = utils.clone(where, validConditions);

          //filter any rows that match where condition
          data = utils.filterAny(data, where);

          //warn if filtering returns empty array
          if(data.length==0) utils.warn("data reader returns empty array, that's bad");
            
          //only selected items get returned
          data = data.map(function (row) {
            return utils.clone(row, query.select);
          });

          _this._data = data;
          p.resolve();
        }

      })(query, p);

      return p;
    },

    /**
     * Gets the data
     * @returns all data
     */
    getData: function () {
      return this._data;
    }
  });

}).call(this);

/*!
 * Inline Reader
 * the simplest reader possible
 */

(function () {

  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;

  Vizabi.Reader.extend('inline', {
    init: function (reader_info) {
      this.name = "inline";
      this._super(reader_info);
    }
  });

}).call(this);

/*!
 * Local JSON reader
 */

(function () {

  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;
  var Promise = Vizabi.Promise;

  var FILE_CACHED = {}; //caches files from this reader
  var FILE_REQUESTED = {}; //caches files from this reader

  Vizabi.Reader.extend('json-file', {

    /**
     * Initializes the reader.
     * @param {Object} reader_info Information about the reader
     */
    init: function (reader_info) {
      this._name = 'json-file';
      this._data = [];
      this._basepath = reader_info.path;
      this._formatters = reader_info.formatters;
      if (!this._basepath) {
        utils.error("Missing base path for json-file reader");
      }
      ;
    },

    /**
     * Reads from source
     * @param {Object} query to be performed
     * @param {String} language language
     * @returns a promise that will be resolved when data is read
     */
    read: function (query, language) {
      var _this = this;
      var p = new Promise();

      //this specific reader has support for the tag {{LANGUAGE}}
      var path = this._basepath.replace("{{LANGUAGE}}", language);
      _this._data = [];

      (function (query, p) {

        //if cached, retrieve and parse
        if (FILE_CACHED.hasOwnProperty(path)) {
          parse(FILE_CACHED[path]);
        }
        //if requested by another hook, wait for the response
        else if (FILE_REQUESTED.hasOwnProperty(path)) {
          FILE_REQUESTED[path].then(function () {
            parse(FILE_CACHED[path]);
          });
        }
        //if not, request and parse
        else {
          d3.json(path, function (error, res) {

            if (!res) {
              utils.error("No permissions or empty file: " + path, error);
              return;
            }

            if (error) {
              utils.error("Error Happened While Loading JSON File: " + path, error);
              return;
            }
            //fix JSON response
            res = format(res);

            //cache and resolve
            FILE_CACHED[path] = res;
            FILE_REQUESTED[path].resolve();
            delete FILE_REQUESTED[path];


            parse(res);
          });
          FILE_REQUESTED[path] = new Promise();
        }

        function format(res) {
          //TODO: Improve local json filtering
          //make category an array and fix missing regions
          res = res[0].map(function (row) {
            row['geo.cat'] = [row['geo.cat']];
            row['geo.region'] = row['geo.region'] || row['geo'];
            return row;
          });

          //format data
          res = utils.mapRows(res, _this._formatters);

          //TODO: fix this hack with appropriate ORDER BY
          //order by formatted
          //sort records by time
          var keys = Object.keys(_this._formatters);
          var order_by = keys[0];
          res.sort(function (a, b) {
            return a[order_by] - b[order_by];
          });
          //end of hack

          return res;
        }

        function parse(res) {
          var data = res;
          //rename geo.category to geo.cat
          var where = query.where;
          if (where['geo.category']) {
            where['geo.cat'] = utils.clone(where['geo.category']);
            delete where['geo.category'];
          }

          //format values in the dataset and filters
          where = utils.mapRows([where], _this._formatters)[0];

          //make sure conditions don't contain invalid conditions
          var validConditions = [];
          utils.forEach(where, function(v, p) {
            for (var i = 0, s = data.length; i<s; i++) {
              if(data[i].hasOwnProperty(p)) {
                validConditions.push(p);
                return true;
              }
            };
          });
          //only use valid conditions
          where = utils.clone(where, validConditions);

          data = utils.filterAny(data, where);
        
          //warn if filtering returns empty array
          if(data.length==0) utils.warn("data reader returns empty array, that's bad");

          //only selected items get returned
          data = data.map(function (row) {
            return utils.clone(row, query.select);
          });

          _this._data = data;

          p.resolve();
        }

      })(query, p);

      return p;
    },

    /**
     * Gets the data
     * @returns all data
     */
    getData: function () {
      return this._data;
    }
  });

}).call(this);

/*!
 * Waffle server Reader
 * the simplest reader possible
 */

(function () {

  "use strict";

  var Vizabi = this.Vizabi;
  var utils = Vizabi.utils;
  var Promise = Vizabi.Promise;

  Vizabi.Reader.extend('waffle-server', {

    basepath: "",

    /**
     * Initializes the reader.
     * @param {Object} reader_info Information about the reader
     */
    init: function (reader_info) {
      this._name = 'waffle-reader';
      this._data = [];
      this._formatters = reader_info.formatters;
      this._basepath = reader_info.path || this.basepath;
      if (!this._basepath) {
        utils.error("Missing base path for waffle-server reader");
      }
    },

    /**
     * Reads from source
     * @param {Object} query to be performed
     * @param {String} language language
     * @returns a promise that will be resolved when data is read
     */
    read: function (query, language) {
      var _this = this;
      var p = new Promise();
      var formatted;

      this._data = [];

      (function (query, p) {

        var where = query.where;

        //format time query if existing
        if (where['time']) {
          //[['1990', '2012']] -> '1990-2012'
          where['time'] = where['time'][0].join('-');
        }
        
        //rename geo.category to geo.cat
        if (where['geo.category']) {
          where['geo.cat'] = utils.clone(where['geo.category']);
          delete where['geo.category'];
        }

        formatted = {
          "SELECT": query.select,
          "WHERE": where,
          "FROM": "spreedsheet"
        };

        var pars = {
          query: [formatted],
          lang: language
        };

        //request data
        utils.post(_this._basepath, JSON.stringify(pars), function (res) {
          //fix response
          res = format(res[0]);
          //parse and save
          parse(res);

        }, function () {
          console.log("Error loading from Waffle Server:", _this._basepath);
          p.reject('Could not read from waffle server');
        }, true);

        function format(res) {
          //make category an array and fix missing regions
          res = res.map(function (row) {
            row['geo.cat'] = [row['geo.cat']];
            row['geo.region'] = row['geo.region'] || row['geo'];
            return row;
          });

          //format data
          res = utils.mapRows(res, _this._formatters);

          //TODO: fix this hack with appropriate ORDER BY
          //order by formatted
          //sort records by time
          var keys = Object.keys(_this._formatters);
          var order_by = keys[0];
          res.sort(function (a, b) {
            return a[order_by] - b[order_by];
          });
          //end of hack

          return res;
        }

        function parse(res) {
          //just check for length, no need to parse from server
          if(res.length==0) utils.warn("data reader returns empty array, that's bad");
          _this._data = res;
          p.resolve();
        }

      })(query, p);

      return p;
    },

    /**
     * Gets the data
     * @returns all data
     */
    getData: function () {
      return this._data;
    }
  });

}).call(this);

/*!
 * VIZABI BARCHART
 */

(function () {

  "use strict";

  var Vizabi = this.Vizabi;
  var utils = Vizabi.utils;

  //warn client if d3 is not defined
  if (!Vizabi._require('d3')) return;

  var comp_template = 'src/tools/barchart/barchart.html';

  //BAR CHART COMPONENT
  Vizabi.Component.extend('gapminder-barchart', {

    /**
     * Initializes the component (Bar Chart).
     * Executed once before any template is rendered.
     * @param {Object} config The options passed to the component
     * @param {Object} context The component's parent
     */
    init: function (config, context) {
      this.name = 'barchart';
      this.template = comp_template;

      //define expected models for this component
      this.model_expects = [{
        name: "time",
        type: "time"
      }, {
        name: "entities",
        type: "entities"
      }, {
        name: "marker",
        type: "model"
      }, {
        name: "language",
        type: "language"
      }];

      var _this = this;
      this.model_binds = {
        "change:time:value": function (evt) {
          _this.updateEntities();
        },
        'change:marker:color:palette': utils.debounce(function (evt) {
          _this.updateEntities();
        }, 200)
      };

      //contructor is the same as any component
      this._super(config, context);

      this.xScale = null;
      this.yScale = null;
      this.cScale = d3.scale.category10();

      this.xAxis = d3.svg.axisSmart();
      this.yAxis = d3.svg.axisSmart();
    },

    /**
     * DOM is ready
     */
    readyOnce: function () {

      this.element = d3.select(this.element);

      this.graph = this.element.select('.vzb-bc-graph');
      this.yAxisEl = this.graph.select('.vzb-bc-axis-y');
      this.xAxisEl = this.graph.select('.vzb-bc-axis-x');
      this.yTitleEl = this.graph.select('.vzb-bc-axis-y-title');
      this.xTitleEl = this.graph.select('.vzb-bc-axis-x-title');
      this.bars = this.graph.select('.vzb-bc-bars');

      var _this = this;
      this.on("resize", function () {
        _this.updateEntities();
      });
    },

    /*
     * Both model and DOM are ready
     */
    ready: function () {
      this.updateIndicators();
      this.resize();
      this.updateEntities();
    },

    /**
     * Changes labels for indicators
     */
    updateIndicators: function () {
      var _this = this;
      this.translator = this.model.language.getTFunction();
      this.duration = this.model.time.speed;

      var titleStringY = this.translator("indicator/" + this.model.marker.axis_y.which);
      var titleStringX = this.translator("indicator/" + this.model.marker.axis_x.which);

      var yTitle = this.yTitleEl.selectAll("text").data([0]);
      yTitle.enter().append("text");
      yTitle
        .attr("y", "-6px")
        .attr("x", "-9px")
        .attr("dx", "-0.72em")
        .text(titleStringY)
        .on("click", function(){
            //TODO: Optimise updateView
            _this.parent
                .findChildByName("gapminder-treemenu")
                .markerID("axis_y")
                .updateView()
                .toggle();
        });

      var xTitle = this.xTitleEl.selectAll("text").data([0]); 
      xTitle.enter().append("text");
      xTitle
        .attr("y", "-3px")
        .attr("dx", "-0.72em")
        .text(titleStringX)
        .on("click", function(){
            //TODO: Optimise updateView
            _this.parent
                .findChildByName("gapminder-treemenu")
                .markerID("axis_x")
                .updateView()
                .toggle();
        });

      this.yScale = this.model.marker.axis_y.getScale();
      this.xScale = this.model.marker.axis_x.getScale();
      this.cScale = this.model.marker.color.getScale();

      this.yAxis.tickFormat(_this.model.marker.axis_y.tickFormatter);
      this.xAxis.tickFormat(_this.model.marker.axis_x.tickFormatter);
    },

    /**
     * Updates entities
     */
    updateEntities: function () {

      var _this = this;
      var time = this.model.time;
      var timeDim = time.getDimension();
      var entityDim = this.model.entities.getDimension();
      var duration = (time.playing) ? time.speed : 0;
      var filter = {};
      filter[timeDim] = time.value;
      var items = this.model.marker.getKeys(filter);
      var values = this.model.marker.getValues(filter, [entityDim]);

      this.entityBars = this.bars.selectAll('.vzb-bc-bar')
        .data(items);

      //exit selection
      this.entityBars.exit().remove();

      //enter selection -- init circles
      this.entityBars.enter().append("rect")
        .attr("class", "vzb-bc-bar")
        .on("mousemove", function (d, i) {
        })
        .on("mouseout", function (d, i) {
        })
        .on("click", function (d, i) {
        });

      //positioning and sizes of the bars

      var bars = this.bars.selectAll('.vzb-bc-bar');
      var barWidth = this.xScale.rangeBand();

      this.bars.selectAll('.vzb-bc-bar')
        .attr("width", barWidth)
        .attr("fill", function (d) {
          return _this.cScale(values.color[d[entityDim]]);
        })
        .attr("x", function (d) {
          return _this.xScale(values.axis_x[d[entityDim]]);
        })
        .transition().duration(duration).ease("linear")
        .attr("y", function (d) {
          return _this.yScale(values.axis_y[d[entityDim]]);
        })
        .attr("height", function (d) {
          return _this.height - _this.yScale(values.axis_y[d[entityDim]]);
        });
    },

    /**
     * Executes everytime the container or vizabi is resized
     * Ideally,it contains only operations related to size
     */
    resize: function () {

      var _this = this;

      this.profiles = {
        "small": {
          margin: {
            top: 30,
            right: 20,
            left: 40,
            bottom: 50
          },
          padding: 2,
          minRadius: 2,
          maxRadius: 40
        },
        "medium": {
          margin: {
            top: 30,
            right: 60,
            left: 60,
            bottom: 60
          },
          padding: 2,
          minRadius: 3,
          maxRadius: 60
        },
        "large": {
          margin: {
            top: 30,
            right: 60,
            left: 60,
            bottom: 80
          },
          padding: 2,
          minRadius: 4,
          maxRadius: 80
        }
      };

      this.activeProfile = this.profiles[this.getLayoutProfile()];
      var margin = this.activeProfile.margin;


      //stage
      this.height = parseInt(this.element.style("height"), 10) - margin.top - margin.bottom;
      this.width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;

      this.graph
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      //update scales to the new range
      if (this.model.marker.axis_y.scaleType !== "ordinal") {
        this.yScale.range([this.height, 0]);
      } else {
        this.yScale.rangePoints([this.height, 0], _this.activeProfile.padding).range();
      }
      if (this.model.marker.axis_x.scaleType !== "ordinal") {
        this.xScale.range([0, this.width]);
      } else {
        this.xScale.rangePoints([0, this.width], _this.activeProfile.padding).range();
      }

      //apply scales to axes and redraw
      this.yAxis.scale(this.yScale)
        .orient("left")
        .tickSize(6, 0)
        .tickSizeMinor(3, 0)
        .labelerOptions({
          scaleType: this.model.marker.axis_y.scaleType,
          toolMargin: margin,
          limitMaxTickNumber: 6
        });

      this.xAxis.scale(this.xScale)
        .orient("bottom")
        .tickSize(6, 0)
        .tickSizeMinor(3, 0)
        .labelerOptions({
          scaleType: this.model.marker.axis_x.scaleType,
          toolMargin: margin
        });

      this.xAxisEl.attr("transform", "translate(0," + this.height + ")")
        .call(this.xAxis);

      this.xScale.rangeRoundBands([0, this.width], 0.1, 0.2);

      this.yAxisEl.call(this.yAxis);
      this.xAxisEl.call(this.xAxis);

      var xAxisSize = this.xAxisEl.node().getBoundingClientRect();
      var xTitleSize = this.xTitleEl.node().getBoundingClientRect();
      var xTitleXPos = xAxisSize.width / 2 - xTitleSize.width / 2;
      var xTitleYPos = this.height + xAxisSize.height + xTitleSize.height;
      this.xTitleEl.attr("transform", "translate(" + xTitleXPos + "," + xTitleYPos + ")");
    }
  });

  //BAR CHART TOOL
  var BarChart = Vizabi.Tool.extend('BarChart', {

    /**
     * Initializes the tool (Bar Chart Tool).
     * Executed once before any template is rendered.
     * @param {Object} config Initial config, with name and placeholder
     * @param {Object} options Options such as state, data, etc
     */
    init: function (config, options) {

      this.name = "barchart";

      //specifying components
      this.components = [{
        component: 'gapminder-barchart',
        placeholder: '.vzb-tool-viz',
        model: ["state.time", "state.entities", "state.marker", "language"] //pass models to component
      }, {
        component: 'gapminder-timeslider',
        placeholder: '.vzb-tool-timeslider',
        model: ["state.time"]
      }, {
        component: 'gapminder-buttonlist',
        placeholder: '.vzb-tool-buttonlist',
        model: ['state', 'ui', 'language']
      }, {
        component: 'gapminder-treemenu',
        placeholder: '.vzb-tool-treemenu',
        model: ['state.marker', 'language']
      }];

      //constructor is the same as any tool
      this._super(config, options);
    }
  });

  BarChart.define('default_options', {
    state: {
      time: {},
      entities: {
        dim: "geo",
        show: {
          _defs_: {
            "geo": ["*"],
            "geo.cat": ["region"]
          }
        }
      },
      marker: {
        space: ["entities", "time"],
        label: {
          use: "property",
          which: "geo.name"
        },
        axis_y: {
          use: "indicator",
          which: "lex"
        },
        axis_x: {
          use: "property",
          which: "geo.name"
        },
        color: {
          use: "property",
          which: "geo.region"
        }
      }
    },
    data: {
      reader: "csv-file",
      path: "local_data/waffles/basic-indicators.csv"
    }
  });

}).call(this);
/*!
 * VIZABI BUBBLECHART
 */

(function () {

  "use strict";

  var Vizabi = this.Vizabi;
  var utils = Vizabi.utils;
  var iconset = Vizabi.iconset;

  //warn client if d3 is not defined
  if (!Vizabi._require('d3')) return;


  //BUBBLE CHART COMPONENT
  Vizabi.Component.extend('gapminder-bubblechart', {

    /**
     * Initializes the component (Bubble Chart).
     * Executed once before any template is rendered.
     * @param {Object} config The options passed to the component
     * @param {Object} context The component's parent
     */
    init: function (config, context) {
      var _this = this;
      this.name = 'bubblechart';
      this.template = 'src/tools/bubblechart/bubblechart.html';

      //define expected models for this component
      this.model_expects = [{
        name: "time",
        type: "time"
      }, {
        name: "entities",
        type: "entities"
      }, {
        name: "marker",
        type: "model"
      }, {
        name: "language",
        type: "language"
      }];

      //starts as splash if this is the option
      this._splash = config.ui.splash;

      this.model_binds = {
        'change:time': function (evt, original) {
          if(_this._splash !== _this.model.time.splash) {
            if (!_this._readyOnce) return;
            _this._splash = _this.model.time.splash;
            //TODO: adjust X & Y axis here
          }
        },
        "change:time:record": function () {
            //console.log("change time record");
            if(_this.model.time.record) {
                _this._export.open(this.element, this.name);
            }else{
                _this._export.reset();
            }
        },
        "change:time:trails": function (evt) {
          //console.log("EVENT change:time:trails");
          _this._trails.toggle(_this.model.time.trails);
          _this.redrawDataPoints();
        },
        "change:time:lockNonSelected": function (evt) {
          //console.log("EVENT change:time:lockNonSelected");
          _this.redrawDataPoints(500);
        },
        "change:marker": function (evt) {
          // bubble size change is processed separately
          if (!_this._readyOnce) return;
          if (evt.indexOf("change:marker:size") !== -1) return;
          if (evt.indexOf("change:marker:color:palette") > -1) return;
          if (evt.indexOf("min") > -1 || evt.indexOf("max") > -1) {
              _this.updateSize();
              _this.updateMarkerSizeLimits();
              _this._trails.run("findVisible");
              _this.redrawDataPoints();
              _this._trails.run("resize");
              return;
          }
          _this.ready();
          //console.log("EVENT change:marker", evt);
        },
        "change:entities:select": function () {
          if (!_this._readyOnce) return;
          //console.log("EVENT change:entities:select");
          _this.selectDataPoints();
          _this.redrawDataPoints();
          _this._trails.run(["resize", "recolor", "findVisible", "reveal"]);
          _this.updateBubbleOpacity();
          _this._updateDoubtOpacity();
        },
        "change:entities:highlight": function () {
          if (!_this._readyOnce) return;
          //console.log("EVENT change:entities:highlight");
          _this.highlightDataPoints();
        },
        'change:time:value': function () {
          //console.log("EVENT change:time:value");
          _this.updateTime();
          _this._updateDoubtOpacity();

          _this._trails.run("findVisible");
          if (_this.model.time.adaptMinMaxZoom) {
            _this.adaptMinMaxZoom();
          } else {
            _this.redrawDataPoints();
          }
          _this._trails.run("reveal");
          _this.tooltipMobile.classed('vzb-hidden', true);
          _this._bubblesInteract().mouseout();
        },
        'change:time:adaptMinMaxZoom': function () {
          //console.log("EVENT change:time:adaptMinMaxZoom");
          if (_this.model.time.adaptMinMaxZoom) {
            _this.adaptMinMaxZoom();
          } else {
            _this.resetZoomer();
          }
        },
        'change:marker:size': function () {
          //console.log("EVENT change:marker:size:max");
          _this.updateMarkerSizeLimits();
          _this._trails.run("findVisible");
          _this.redrawDataPointsOnlySize();
          _this._trails.run("resize");
        },
        'change:marker:color:palette': function () {
          //console.log("EVENT change:marker:color:palette");
          _this.redrawDataPointsOnlyColors();
          _this._trails.run("recolor");
        },
        'change:entities:opacitySelectDim': function () {
          _this.updateBubbleOpacity();
        },
        'change:entities:opacityRegular': function () {
          _this.updateBubbleOpacity();
        }
      };

      this._super(config, context);

      this.xScale = null;
      this.yScale = null;
      this.sScale = null;
      this.cScale = null;

      this.xAxis = d3.svg.axisSmart();
      this.yAxis = d3.svg.axisSmart();


      this.cached = {};
      this.xyMaxMinMean = {};
      this.currentZoomFrameXY = null;
      this.draggingNow = null;

      // default UI settings
      this.ui = utils.extend({
        whenHovering: {},
        labels: {}
      }, this.ui["vzb-tool-" + this.name]);

      this.ui.whenHovering = utils.extend({
        showProjectionLineX: true,
        showProjectionLineY: true,
        higlightValueX: true,
        higlightValueY: true
      }, this.ui.whenHovering);

      this.ui.labels = utils.extend({
        autoResolveCollisions: false,
        dragging: true
      }, this.ui.labels);


      var Trail = Vizabi.Helper.get("gapminder-bublechart-trails");
      this._trails = new Trail(this);

      var Exporter = Vizabi.Helper.get("gapminder-svgexport");
      this._export = new Exporter(this);
      this._export
            .prefix("vzb-bc-")
            .deleteClasses(["vzb-bc-bubbles-crop", "vzb-hidden", "vzb-bc-year", "vzb-bc-zoomRect", "vzb-bc-projection-x", "vzb-bc-projection-y", "vzb-bc-axis-c-title"]);



      //            this.collisionResolver = d3.svg.collisionResolver()
      //                .value("labelY2")
      //                .fixed("labelFixed")
      //                .selector("text")
      //                .scale(this.yScale)
      //                .handleResult(this._repositionLabels);


      this.dragger = d3.behavior.drag()
        .on("dragstart", function (d, i) {
        	d3.event.sourceEvent.stopPropagation();
        	var KEY = _this.KEY;
        	_this.druging = d[KEY];
        })
        .on("drag", function (d, i) {
          var KEY = _this.KEY;
          if (!_this.ui.labels.dragging) return;
          var cache = _this.cached[d[KEY]];
          cache.labelFixed = true;

          cache.labelX_ += d3.event.dx / _this.width;
          cache.labelY_ += d3.event.dy / _this.height;

          var resolvedX = _this.xScale(cache.labelX0) + cache.labelX_ * _this.width;
          var resolvedY = _this.yScale(cache.labelY0) + cache.labelY_ * _this.height;
          var resolvedX0 = _this.xScale(cache.labelX0);
          var resolvedY0 = _this.yScale(cache.labelY0);

          var lineGroup = _this.entityLines.filter(function (f) {
            return f[KEY] == d[KEY];
          });

          _this._repositionLabels(d, i, this, resolvedX, resolvedY, resolvedX0, resolvedY0, 0, lineGroup);
        })
        .on("dragend", function (d, i) {
        	var KEY = _this.KEY;
        _this.druging = null;
          _this.model.entities.setLabelOffset(d, [
            Math.round(_this.cached[d[KEY]].labelX_ * 100) / 100,
            Math.round(_this.cached[d[KEY]].labelY_ * 100) / 100
          ]);
        });


      this.dragRectangle = d3.behavior.drag()
        .on("dragstart", function (d, i) {
          if (!(d3.event.sourceEvent.ctrlKey || d3.event.sourceEvent.metaKey)) return;

          this.ctrlKeyLock = true;
          this.origin = {
            x: d3.mouse(this)[0] - _this.activeProfile.margin.left,
            y: d3.mouse(this)[1] - _this.activeProfile.margin.top
          };
          _this.zoomRect.classed("vzb-invisible", false);
        })
        .on("drag", function (d, i) {
          if (!this.ctrlKeyLock) return;
          var origin = this.origin;
          var mouse = {
            x: d3.event.x - _this.activeProfile.margin.left,
            y: d3.event.y - _this.activeProfile.margin.top
          };

          _this.zoomRect
            .attr("x", Math.min(mouse.x, origin.x))
            .attr("y", Math.min(mouse.y, origin.y))
            .attr("width", Math.abs(mouse.x - origin.x))
            .attr("height", Math.abs(mouse.y - origin.y));
        })

        .on("dragend", function (e) {
          if (!this.ctrlKeyLock) return;
          this.ctrlKeyLock = false;

          _this.zoomRect
            .attr("width", 0)
            .attr("height", 0)
            .classed("vzb-invisible", true);

          this.target = {
            x: d3.mouse(this)[0] - _this.activeProfile.margin.left,
            y: d3.mouse(this)[1] - _this.activeProfile.margin.top
          };

          _this._zoomOnRectangle(d3.select(this), this.origin.x, this.origin.y, this.target.x, this.target.y, true, 500);
        });

      this.zoomer = d3.behavior.zoom()
        .scaleExtent([1, 100])
        .on("zoom", function () {
          if (d3.event.sourceEvent != null && (d3.event.sourceEvent.ctrlKey || d3.event.sourceEvent.metaKey)) return;
          
          
          //send the event to the page if fully zoomed our or page not scrolled into view
          if(d3.event.sourceEvent != null && _this.scrollableAncestor){
              
              if(d3.event.scale == 1) _this.scrollableAncestor.scrollTop += d3.event.sourceEvent.deltaY;
              
              if(utils.getViewportPosition(_this.element.node()).y < 0 && d3.event.scale > 1){
                  _this.scrollableAncestor.scrollTop += d3.event.sourceEvent.deltaY;
                  return;
              }
          }
          
          _this.model._data.entities.clearHighlighted();
          _this._setTooltip(); 

          var zoom = d3.event.scale;
          var pan = d3.event.translate;
          var ratioY = _this.zoomer.ratioY;
          var ratioX = _this.zoomer.ratioX;


          // console.log(d3.event.scale, _this.zoomer.ratioY, _this.zoomer.ratioX)

          _this.draggingNow = true;

          //value protections and fallbacks
          if (isNaN(zoom) || zoom == null) zoom = _this.zoomer.scale();
          if (isNaN(zoom) || zoom == null) zoom = 1;

          //TODO: this is a patch to fix #221. A proper code review of zoom and zoomOnRectangle logic is needed
          if (zoom==1) {_this.zoomer.ratioX = 1; ratioX = 1; _this.zoomer.ratioY = 1; ratioY = 1}

          if (isNaN(pan[0]) || isNaN(pan[1]) || pan[0] == null || pan[1] == null) pan = _this.zoomer.translate();
          if (isNaN(pan[0]) || isNaN(pan[1]) || pan[0] == null || pan[1] == null) pan = [0, 0];


          // limit the zooming, so that it never goes below 1 for any of the axes
          if (zoom * ratioY < 1) {
            ratioY = 1 / zoom;
            _this.zoomer.ratioY = ratioY
          }
          if (zoom * ratioX < 1) {
            ratioX = 1 / zoom;
            _this.zoomer.ratioX = ratioX
          }

          //limit the panning, so that we are never outside the possible range
          if (pan[0] > 0) pan[0] = 0;
          if (pan[1] > 0) pan[1] = 0;
          if (pan[0] < (1 - zoom * ratioX) * _this.width) pan[0] = (1 - zoom * ratioX) * _this.width;
          if (pan[1] < (1 - zoom * ratioY) * _this.height) pan[1] = (1 - zoom * ratioY) * _this.height;
          _this.zoomer.translate(pan);

          var xRange = [0 * zoom * ratioX + pan[0], _this.width * zoom * ratioX + pan[0]];
          var yRange = [_this.height * zoom * ratioY + pan[1], 0 * zoom * ratioY + pan[1]];

          if (_this.model.marker.axis_x.scaleType === 'ordinal')
            _this.xScale.rangeBands(xRange);
          else
            _this.xScale.range(xRange);

          if (_this.model.marker.axis_y.scaleType === 'ordinal')
            _this.yScale.rangeBands(yRange);
          else
            _this.yScale.range(yRange);

          // Keep the min and max size (pixels) constant, when zooming.
          //                    _this.sScale.range([utils.radiusToArea(_this.minRadius) * zoom * zoom * ratioY * ratioX,
          //                                        utils.radiusToArea(_this.maxRadius) * zoom * zoom * ratioY * ratioX ]);

          var optionsY = _this.yAxis.labelerOptions();
          var optionsX = _this.xAxis.labelerOptions();
          optionsY.limitMaxTickNumber = zoom * ratioY < 2 ? 7 : 14;
          optionsY.transitionDuration = _this.zoomer.duration;
          optionsX.transitionDuration = _this.zoomer.duration;

          _this.xAxisEl.call(_this.xAxis.labelerOptions(optionsX));
          _this.yAxisEl.call(_this.yAxis.labelerOptions(optionsY));
          _this.redrawDataPoints(_this.zoomer.duration);
          _this._trails.run("resize", null, _this.zoomer.duration);

          _this.zoomer.duration = 0;

        })
        .on('zoomend', function () {
          _this.draggingNow = false;
        });

      this.zoomer.ratioX = 1;
      this.zoomer.ratioY = 1;

      this.fontSettings = {
        minSize: 8,
        step: 2
      };
    },


    /**
     * Executes right after the template is in place, but the model is not yet ready
     */
    readyOnce: function () {
      var _this = this;
        
      this.scrollableAncestor = utils.findScrollableAncestor(this.element);
      this.element = d3.select(this.element);

      // reference elements
      this.graph = this.element.select('.vzb-bc-graph');
      this.yAxisElContainer = this.graph.select('.vzb-bc-axis-y');
      this.yAxisEl = this.yAxisElContainer.select('g');

      this.xAxisElContainer = this.graph.select('.vzb-bc-axis-x');
      this.xAxisEl = this.xAxisElContainer.select('g');

      this.yTitleEl = this.graph.select('.vzb-bc-axis-y-title');
      this.xTitleEl = this.graph.select('.vzb-bc-axis-x-title');
      this.sTitleEl = this.graph.select('.vzb-bc-axis-s-title');
      this.cTitleEl = this.graph.select('.vzb-bc-axis-c-title');
      this.yearEl = this.graph.select('.vzb-bc-year');
        
      this.yInfoEl = this.graph.select('.vzb-bc-axis-y-info');
      this.xInfoEl = this.graph.select('.vzb-bc-axis-x-info');
      this.dataWarningEl = this.graph.select('.vzb-data-warning');

      this.fontSettings.maxTitleFontSize = parseInt(this.sTitleEl.style('font-size'), 10);

      this.projectionX = this.graph.select(".vzb-bc-projection-x");
      this.projectionY = this.graph.select(".vzb-bc-projection-y");

      this.trailsContainer = this.graph.select('.vzb-bc-trails');
      this.bubbleContainerCrop = this.graph.select('.vzb-bc-bubbles-crop');
      this.bubbleContainer = this.graph.select('.vzb-bc-bubbles');
      this.labelsContainer = this.graph.select('.vzb-bc-labels');
      this.linesContainer = this.graph.select('.vzb-bc-lines');
      this.zoomRect = this.element.select('.vzb-bc-zoomRect');

      this.entityBubbles = null;
      this.entityLabels = null;
      this.tooltip = this.element.select('.vzb-bc-tooltip');
      this.tooltipMobile = this.element.select('.vzb-tooltip-mobile');
      this.entityLines = null;
      //component events
      this.on("resize", function () {
        //console.log("EVENT: resize");
        _this.updateSize();
        _this.updateMarkerSizeLimits();
        _this._trails.run("findVisible");
        _this.resetZoomer(); // includes redraw data points and trail resize
      });

      //keyboard listeners
      d3.select("body")
        .on("keydown", function () {
          if (d3.event.metaKey || d3.event.ctrlKey) _this.element.select("svg").classed("vzb-zoomin", true);
        })
        .on("keyup", function () {
          if (!d3.event.metaKey && !d3.event.ctrlKey) _this.element.select("svg").classed("vzb-zoomin", false);
        });

      this.element
        //.call(this.zoomer)
        //.call(this.dragRectangle)
        .on("mouseup", function(){
          _this.draggingNow = false;
        })
        .onTap(function () {
          return;
          _this._bubblesInteract().mouseout();
          _this.tooltipMobile.classed('vzb-hidden', true);
        });

      this.KEY = this.model.entities.getDimension();
      this.TIMEDIM = this.model.time.getDimension();

      this._calculateAllValues();
      this._valuesCalculated = true; //hack to avoid recalculation

      this.updateUIStrings();
        
      this.wScale = d3.scale.linear()
        .domain(this.parent.datawarning_content.doubtDomain)
        .range(this.parent.datawarning_content.doubtRange);

      this.updateIndicators();
      this.updateEntities();
      this.updateTime();
      this.updateSize();
      this.updateMarkerSizeLimits();
      this.selectDataPoints();
      this.updateBubbleOpacity();
      this._updateDoubtOpacity();
      this._trails.create();
      this.resetZoomer(); // includes redraw data points and trail resize
      this._trails.run(["recolor", "findVisible", "reveal"]);
      if (this.model.time.adaptMinMaxZoom) this.adaptMinMaxZoom();
    },

    ready: function() {

      if(!this._valuesCalculated) this._calculateAllValues();
      else this._valuesCalculated = false;
      
      this.updateUIStrings();
        
      this.updateEntities();
      this.redrawDataPoints();
      this.updateBubbleOpacity();
      this.updateIndicators();
      this.updateSize();
      this.updateMarkerSizeLimits();
      this._trails.create();
      this._trails.run("findVisible");
      this.resetZoomer();
      this._trails.run(["recolor", "reveal"]);

    },

    /*
     * UPDATE INDICATORS
     */
    updateIndicators: function () {
      var _this = this;

      //scales
      this.yScale = this.model.marker.axis_y.getScale();
      this.xScale = this.model.marker.axis_x.getScale();
      this.sScale = this.model.marker.size.getScale();
      this.cScale = this.model.marker.color.getScale();

      //            this.collisionResolver.scale(this.yScale);


      this.yAxis.tickFormat(_this.model.marker.axis_y.tickFormatter);
      this.xAxis.tickFormat(_this.model.marker.axis_x.tickFormatter);

      this.xyMaxMinMean = {
        x: this.model.marker.axis_x.getMaxMinMean({timeFormatter: this.timeFormatter, skipZeros: true}),
        y: this.model.marker.axis_y.getMaxMinMean({timeFormatter: this.timeFormatter, skipZeros: true}),
        s: this.model.marker.size.getMaxMinMean({timeFormatter: this.timeFormatter, skipZeros: true})
      };
    },


    updateUIStrings: function () {
      var _this = this;

      this.translator = this.model.language.getTFunction();
      this.timeFormatter = d3.time.format(_this.model.time.formatOutput);
      var indicatorsDB = Vizabi._globals.metadata.indicatorsDB;

      this.strings = {
          title:{
              Y: this.translator("indicator/" + this.model.marker.axis_y.which),
              X: this.translator("indicator/" + this.model.marker.axis_x.which),
              S: this.translator("indicator/" + this.model.marker.size.which),
              C: this.translator("indicator/" + this.model.marker.color.which)
          },
          unit:{
              Y: this.translator("unit/" + indicatorsDB[this.model.marker.axis_y.which].unit)||"",
              X: this.translator("unit/" + indicatorsDB[this.model.marker.axis_x.which].unit)||"",
              S: this.translator("unit/" + indicatorsDB[this.model.marker.size.which].unit)||"",
              C: this.translator("unit/" + indicatorsDB[this.model.marker.color.which].unit)||""
          }
      }
      if (!!this.strings.unit.Y) this.strings.unit.Y = ", " + this.strings.unit.Y;
      if (!!this.strings.unit.X) this.strings.unit.X = ", " + this.strings.unit.X;
      if (!!this.strings.unit.S) this.strings.unit.S = ", " + this.strings.unit.S;
      if (!!this.strings.unit.C) this.strings.unit.C = ", " + this.strings.unit.C;

      var yTitle = this.yTitleEl.selectAll("text").data([0]);
      yTitle.enter().append("text");
      yTitle
        .attr("y", "-6px")
        .on("click", function(){
//            _this.parent
//                .findChildByName("gapminder-treemenu")
//                .markerID("axis_y")
//                .updateView()
//                .toggle();
        });

      var xTitle = this.xTitleEl.selectAll("text").data([0]);
      xTitle.enter().append("text");
      xTitle
        .attr("y", "-0.32em")
        .on("click", function(){
//            _this.parent
//                .findChildByName("gapminder-treemenu")
//                .markerID("axis_x")
//                .updateView()
//                .toggle();
        });

      var sTitle = this.sTitleEl.selectAll("text").data([0]);
      sTitle.enter().append("text");
      sTitle
        .attr("text-anchor", "end");

      this.dataWarningEl.html(iconset['warn']).select("svg").attr("width", "0px").attr("height", "0px");
      this.dataWarningEl.append("text")
          .attr("text-anchor", "end")
           .attr("y", "-0.32em")
          .text(this.translator("hints/dataWarning"));
        
      //TODO: move away from UI strings, maybe to ready or ready once
      this.yInfoEl.on("click", function(){
        window.open(indicatorsDB[_this.model.marker.axis_y.which].sourceLink, '_blank').focus();
      })
      this.xInfoEl.on("click", function(){
        window.open(indicatorsDB[_this.model.marker.axis_x.which].sourceLink, '_blank').focus();
      })  
      this.dataWarningEl
          .on("click", function(){
                _this.parent.findChildByName("gapminder-datawarning").toggle();
            })
          .on("mouseover", function(){
                _this._updateDoubtOpacity(1);
            })  
          .on("mouseout", function(){
                _this._updateDoubtOpacity();
            })  
    },

    _updateDoubtOpacity: function(opacity){
        if(opacity==null) opacity = this.wScale(+this.timeFormatter(this.time)); 
        if(this.someSelected) opacity = 1;
        this.dataWarningEl.style("opacity", opacity);  
    },
      
    /*
     * UPDATE ENTITIES:
     * Ideally should only update when show parameters change or data changes
     */
    updateEntities: function () {
      var _this = this;
      var KEY = this.KEY;
      var TIMEDIM = this.TIMEDIM;

      var getKeys = function (prefix) {
          prefix = prefix || "";
          return this.model.marker.getKeys()
            .map(function (d) {
                var pointer = {};
                pointer[KEY] = d[KEY];
                pointer[TIMEDIM] = endTime;
                pointer.sortValue = values.size[d[KEY]];
                pointer[KEY] = prefix + d[KEY];
                return pointer;
            })
            .sort(function (a, b) { return b.sortValue - a.sortValue; })
      };

      // get array of GEOs, sorted by the size hook
      // that makes larger bubbles go behind the smaller ones
      var endTime = this.model.time.end;
      var values = this._getValuesInterpolated(endTime);
      this.model.entities.setVisible(getKeys.call(this));

      this.entityBubbles = this.bubbleContainer.selectAll('.vzb-bc-entity')
        .data(this.model.entities.getVisible(), function (d) {
          return d[KEY]
        });

      //exit selection
      this.entityBubbles.exit().remove();

      //enter selection -- init circles
      this.entityBubbles.enter().append("circle")
        .attr("class", function (d) {
            return "vzb-bc-entity " + d[KEY];
        })
        .on("mouseover", function (d, i) {
          if (utils.isTouchDevice()) return;

          _this._bubblesInteract().mouseover(d, i);
        })
        .on("mouseout", function (d, i) {
          if (utils.isTouchDevice()) return;

          _this._bubblesInteract().mouseout(d, i);
        })
        .on("click", function (d, i) {
          if (utils.isTouchDevice()) return;

          _this._bubblesInteract().click(d, i);
        })
        .onTap(function (d, i) {
          //TODO return interaction on touch device
          return;
          var evt = d3.event;
          _this.tooltipMobile.classed('vzb-hidden', false)
            .attr('style', 'left:' + (evt.changedTouches[0].clientX + 15) + 'px;top:' + (evt.changedTouches[0].clientY - 25) + 'px')
            .html('Hold bubble to select it');
          d3.event.stopPropagation();
          _this._bubblesInteract().mouseout();
          _this._bubblesInteract().mouseover(d, i);
        })
        .onLongTap(function (d, i) {
          //TODO return interaction on touch device
          return;
          _this.tooltipMobile.classed('vzb-hidden', true);
          d3.event.stopPropagation();
          _this._bubblesInteract().mouseout();
          _this._bubblesInteract().click(d, i);
        });


      //TODO: no need to create trail group for all entities
      //TODO: instead of :append an :insert should be used to keep order, thus only few trail groups can be inserted
      this.entityTrails = this.bubbleContainer.selectAll(".vzb-bc-entity")
        .data(getKeys.call(this, "trail-"), function (d) {
                return d[KEY];
            }
        );

        this.entityTrails.enter().insert("g", function (d) {
            return document.querySelector(".vzb-bc-bubbles ." + d[KEY].replace("trail-", ""));
        }).attr("class", function (d) {
          return "vzb-bc-entity" + " " + d[KEY]
        });

    },

    _bubblesInteract: function () {
      var _this = this;
      var KEY = this.KEY;
      var TIMEDIM = this.TIMEDIM;

      return {
        mouseover: function (d, i) {
          _this.model.entities.highlightEntity(d);

          var text = "";
          if (_this.model.entities.isSelected(d) && _this.model.time.trails) {
            text = _this.timeFormatter(_this.time);
            _this.entityLabels
              .filter(function (f) {return f[KEY] == d[KEY]})
              .classed("vzb-highlighted", true);
          } else {
            text = _this.model.marker.label.getValue(d);
          }

          var pointer = {};
          pointer[KEY] = d[KEY];
          pointer[TIMEDIM] = _this.time;
          var x = _this.xScale(_this.model.marker.axis_x.getValue(pointer));
          var y = _this.yScale(_this.model.marker.axis_y.getValue(pointer));
          var s = utils.areaToRadius(_this.sScale(_this.model.marker.size.getValue(pointer)));
          _this._setTooltip(text, x-s/2, y-s/2);
        },

        mouseout: function (d, i) {
          _this.model.entities.clearHighlighted();
          _this._setTooltip();
          _this.entityLabels.classed("vzb-highlighted", false);
        },

        click: function (d, i) {
          if(_this.draggingNow) return;
          _this._setTooltip();
          _this.model.entities.selectEntity(d, TIMEDIM, _this.timeFormatter);
        }
      }
    },

    adaptMinMaxZoom: function () {
      var _this = this;
      var mmmX = _this.xyMaxMinMean.x[_this.timeFormatter(_this.time)];
      var mmmY = _this.xyMaxMinMean.y[_this.timeFormatter(_this.time)];
      var radiusMax = utils.areaToRadius(_this.sScale(_this.xyMaxMinMean.s[_this.timeFormatter(_this.time)].max));
      var frame = _this.currentZoomFrameXY;

      var suggestedFrame = {
        x1: _this.xScale(mmmX.min) - radiusMax,
        y1: _this.yScale(mmmY.min) + radiusMax,
        x2: _this.xScale(mmmX.max) + radiusMax,
        y2: _this.yScale(mmmY.max) - radiusMax
      };

      var TOLERANCE = 0.0;

      if (!frame || suggestedFrame.x1 < frame.x1 * (1 - TOLERANCE) || suggestedFrame.x2 > frame.x2 * (1 + TOLERANCE) || suggestedFrame.y2 < frame.y2 * (1 - TOLERANCE) || suggestedFrame.y1 > frame.y1 * (1 + TOLERANCE)) {
        _this.currentZoomFrameXY = utils.clone(suggestedFrame);
        var frame = _this.currentZoomFrameXY;
        _this._zoomOnRectangle(_this.element, frame.x1, frame.y1, frame.x2, frame.y2, false, _this.duration);
        //console.log("rezoom")
      } else {
        _this.redrawDataPoints(_this.duration);
        //console.log("no rezoom")
      }
    },

    _zoomOnRectangle: function (element, x1, y1, x2, y2, compensateDragging, duration) {
      var _this = this;
      var zoomer = _this.zoomer;

      if (Math.abs(x1 - x2) < 10 || Math.abs(y1 - y2) < 10) return;

      if (Math.abs(x1 - x2) > Math.abs(y1 - y2)) {
        var zoom = _this.height / Math.abs(y1 - y2) * zoomer.scale();
        var ratioX = _this.width / Math.abs(x1 - x2) * zoomer.scale() / zoom * zoomer.ratioX;
        var ratioY = zoomer.ratioY;
      } else {
        var zoom = _this.width / Math.abs(x1 - x2) * zoomer.scale();
        var ratioY = _this.height / Math.abs(y1 - y2) * zoomer.scale() / zoom * zoomer.ratioY;
        var ratioX = zoomer.ratioX;
      }

      if (compensateDragging) {
        zoomer.translate([
          zoomer.translate()[0] + x1 - x2,
          zoomer.translate()[1] + y1 - y2
        ])
      }

      var pan = [
        (zoomer.translate()[0] - Math.min(x1, x2)) / zoomer.scale() / zoomer.ratioX * zoom * ratioX, (zoomer.translate()[1] - Math.min(y1, y2)) / zoomer.scale() / zoomer.ratioY * zoom * ratioY
      ];

      zoomer.scale(zoom);
      zoomer.ratioY = ratioY;
      zoomer.ratioX = ratioX;
      zoomer.translate(pan);
      zoomer.duration = duration ? duration : 0;

      zoomer.event(element);
    },

    resetZoomer: function (element) {
      this.zoomer.scale(1);
      this.zoomer.ratioY = 1;
      this.zoomer.ratioX = 1;
      this.zoomer.translate([0, 0]);
      this.zoomer.duration = 0;
      this.zoomer.event(element || this.element);
    },

    /*
     * UPDATE TIME:
     * Ideally should only update when time or data changes
     */
    updateTime: function () {
      var _this = this;

      this.time_1 = this.time == null ? this.model.time.value : this.time;
      this.time = this.model.time.value;
      this.duration = this.model.time.playing && (this.time - this.time_1 > 0) ? this.model.time.speed : 0;

      this.yearEl.text(this.timeFormatter(this.time));
    },

    /*
     * RESIZE:
     * Executed whenever the container is resized
     */
    updateSize: function () {

      var _this = this;

      this.profiles = {
        "small": {
          margin: {
            top: 30,
            right: 10,
            left: 40,
            bottom: 45
          },
          padding: 2,
          minRadius: 0.5,
          maxRadius: 40
        },
        "medium": {
          margin: {
            top: 40,
            right: 15,
            left: 60,
            bottom: 55
          },
          padding: 2,
          minRadius: 1,
          maxRadius: 55
        },
        "large": {
          margin: {
            top: 50,
            right: 20,
            left: 60,
            bottom: 60
          },
          padding: 2,
          minRadius: 1,
          maxRadius: 70
        }
      };

      this.activeProfile = this.profiles[this.getLayoutProfile()];
      var margin = this.activeProfile.margin;


      //stage
      this.height = parseInt(this.element.style("height"), 10) - margin.top - margin.bottom;
      this.width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;

      //            this.collisionResolver.height(this.height);

      //graph group is shifted according to margins (while svg element is at 100 by 100%)
      this.graph
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


      this.yearEl
        .attr("x", this.width / 2)
        .attr("y", this.height / 3 * 2)
        .style("font-size", Math.max(this.height / 4, this.width / 4) + "px");

      //update scales to the new range
      if (this.model.marker.axis_y.scaleType !== "ordinal") {
        this.yScale.range([this.height, 0]);
      } else {
        this.yScale.rangePoints([this.height, 0], _this.activeProfile.padding).range();
      }
      if (this.model.marker.axis_x.scaleType !== "ordinal") {
        this.xScale.range([0, this.width]);
      } else {
        this.xScale.rangePoints([0, this.width], _this.activeProfile.padding).range();
      }

      //apply scales to axes and redraw
      this.yAxis.scale(this.yScale)
        .orient("left")
        .tickSize(6, 0)
        .tickSizeMinor(3, 0)
        .labelerOptions({
          scaleType: this.model.marker.axis_y.scaleType,
          toolMargin: {top: 0, right: margin.right, left: margin.left, bottom: 0},
          limitMaxTickNumber: 6
        });

      this.xAxis.scale(this.xScale)
        .orient("bottom")
        .tickSize(6, 0)
        .tickSizeMinor(3, 0)
        .labelerOptions({
          scaleType: this.model.marker.axis_x.scaleType,
          toolMargin: {top: margin.top, right: 5, left: 5, bottom: margin.bottom}
        });


      this.bubbleContainerCrop
        .attr("width", this.width)
        .attr("height", this.height);

      this.xAxisElContainer
        .attr("width", this.width)
        .attr("height", this.activeProfile.margin.bottom)
        .attr("y", this.height);
      this.xAxisEl
        .attr("transform", "translate(0," + 1 + ")");

      this.yAxisElContainer
        .attr("width", this.activeProfile.margin.left)
        .attr("height", this.height)
        .attr("x", -this.activeProfile.margin.left);
      this.yAxisEl
        .attr("transform", "translate(" + (this.activeProfile.margin.left - 1) + "," + 0 + ")");

      this.yAxisEl.call(this.yAxis);
      this.xAxisEl.call(this.xAxis);

      this.projectionX.attr("y1", _this.yScale.range()[0]);
      this.projectionY.attr("x2", _this.xScale.range()[0]);
        
      
      var yTitleText = this.yTitleEl.select("text").text(this.strings.title.Y + this.strings.unit.Y);
      if(yTitleText.node().getBBox().width > this.width) yTitleText.text(this.strings.title.Y);
      
      var xTitleText = this.xTitleEl.select("text").text(this.strings.title.X + this.strings.unit.X);
      if(xTitleText.node().getBBox().width > this.width) xTitleText.text(this.strings.title.X);
        
      var sTitleText = this.sTitleEl.select("text")
        .text(this.translator("buttons/size") + ": " + this.strings.title.S + ", " +
        this.translator("buttons/colors") + ": " + this.strings.title.C);
        
      var probe = this.sTitleEl.append("text").text(sTitleText.text());
      var font = parseInt(probe.style("font-size"))
                 * (this.height - 20) / probe.node().getBBox().width;
      
      if(probe.node().getBBox().width > this.height - 20) {
        sTitleText.style("font-size", font);
      }else{
        sTitleText.style("font-size", null);
      }
      probe.remove(); 
        
      var yaxisWidth = this.yAxisElContainer.select("g").node().getBBox().width;
      this.yTitleEl
          .attr("transform", "translate(" + (-yaxisWidth) + ",0)");
             
      this.xTitleEl
          .attr("transform", "translate(" + (0) + "," + (this.height + margin.bottom) + ")");
     
      this.sTitleEl
          .attr("transform", "translate(" + this.width + ","+ 20 +") rotate(-90)");

      this.dataWarningEl
          .attr("transform", "translate(" + (this.width) + "," + (this.height + margin.bottom) + ")");
      
        this.dataWarningEl.select("text").text(
            this.translator("hints/dataWarning" + (this.getLayoutProfile()==='small'?"-little":""))
        )
        
      var warnBB = this.dataWarningEl.select("text").node().getBBox(); 
      this.dataWarningEl.select("svg")
          .attr("width",warnBB.height)
          .attr("height",warnBB.height)
          .attr("x", -warnBB.width - warnBB.height * 1.2)
          .attr("y", -warnBB.height * 1.2)
            
        if(this.yInfoEl.select('text').node()){
            var titleH = this.yInfoEl.select('text').node().getBBox().height || 0;
            var titleW = this.yTitleEl.select('text').node().getBBox().width || 0;
            this.yInfoEl.attr('transform', 'translate('+ (titleW - yaxisWidth + titleH * 1.0) +',' + (-titleH*0.7) + ')');
            this.yInfoEl.select("text").attr("dy", "0.1em")
            this.yInfoEl.select("circle").attr("r", titleH/2);
        }            
        if(this.xInfoEl.select('text').node()){
            var titleH = this.xInfoEl.select('text').node().getBBox().height || 0;
            var titleW = this.xTitleEl.select('text').node().getBBox().width || 0;
            this.xInfoEl.attr('transform', 'translate('+ (titleW + titleH * 1.0) +',' + (this.height + margin.bottom -titleH*0.7) + ')');
            this.xInfoEl.select("text").attr("dy", "0.1em")
            this.xInfoEl.select("circle").attr("r", titleH/2);
        }

    },

    updateMarkerSizeLimits: function () {
      var _this = this;
      var minRadius = this.activeProfile.minRadius;
      var maxRadius = this.activeProfile.maxRadius;

      this.minRadius = Math.max(maxRadius * this.model.marker.size.min, minRadius);
      this.maxRadius = Math.max(maxRadius * this.model.marker.size.max, minRadius);

      if (this.model.marker.size.scaleType !== "ordinal") {
        this.sScale.range([utils.radiusToArea(_this.minRadius), utils.radiusToArea(_this.maxRadius)]);
      } else {
        this.sScale.rangePoints([utils.radiusToArea(_this.minRadius), utils.radiusToArea(_this.maxRadius)], 0).range();
      }

    },

    redrawDataPointsOnlyColors: function () {
      var _this = this;
      var KEY = this.KEY;
      var TIMEDIM = this.TIMEDIM;

      this.entityBubbles.style("fill", function (d) {
        var pointer = {};
        pointer[KEY] = d[KEY];
        pointer[TIMEDIM] = _this.time;

        var valueC = _this.model.marker.color.getValue(pointer);
        return _this.cScale(valueC);
      });
    },

    redrawDataPointsOnlySize: function () {
      var _this = this;

      // if (this.someSelected) {
      //   _this.entityBubbles.each(function (d, index) {
      //     _this._updateBubble(d, index, d3.select(this), 0);
      //   });
      // } else {
      //   this.entityBubbles.each(function (d, index) {
      //     var valueS = _this.model.marker.size.getValue(d);
      //     if (valueS == null) return;

      //     d3.select(this).attr("r", utils.areaToRadius(_this.sScale(valueS)));
      //   });
      // }

      this.entityBubbles.each(function (d, index) {
        var valueS = _this.model.marker.size.getValue(d);
        if (valueS == null) return;

        d3.select(this).attr("r", utils.areaToRadius(_this.sScale(valueS)));
      });
    },

    /*
     * REDRAW DATA POINTS:
     * Here plotting happens
     * debouncing to improve performance: events might trigger it more than 1x
     */
    redrawDataPoints: function (duration) {
      var _this = this;

      if (duration == null) duration = _this.duration;

      var TIMEDIM = this.TIMEDIM;
      var KEY = this.KEY;
      var values, valuesLocked;

      //get values for locked and not locked
      if (this.model.time.lockNonSelected && this.someSelected) {
        var tLocked = this.timeFormatter.parse("" + this.model.time.lockNonSelected);
        valuesLocked = this._getValuesInterpolated(tLocked);
      }

      values = this._getValuesInterpolated(this.time);

      this.entityBubbles.each(function (d, index) {
        var view = d3.select(this);
        _this._updateBubble(d, values, valuesLocked, index, view, duration);

      }); // each bubble

      // Call flush() after any zero-duration transitions to synchronously flush the timer queue
      // and thus make transition instantaneous. See https://github.com/mbostock/d3/issues/1951
      if (_this.duration == 0) d3.timer.flush();

      if (_this.ui.labels.autoResolveCollisions) {
        // cancel previously queued simulation if we just ordered a new one
        clearTimeout(_this.collisionTimeout);

        // place label layout simulation into a queue
        _this.collisionTimeout = setTimeout(function () {
          //  _this.entityLabels.call(_this.collisionResolver.data(_this.cached));
        }, _this.model.time.speed * 1.2)
      }

    },

    //redraw Data Points
    _updateBubble: function (d, values, valuesL, index, view, duration) {

      var _this = this;
      var TIMEDIM = this.TIMEDIM;
      var KEY = this.KEY;

      if (_this.model.time.lockNonSelected && _this.someSelected && !_this.model.entities.isSelected(d)) {
        values = valuesL;
      }

      var valueY = values.axis_y[d[KEY]];
      var valueX = values.axis_x[d[KEY]];
      var valueS = values.size[d[KEY]];
      var valueL = values.label[d[KEY]];
      var valueC = values.color[d[KEY]];

      // check if fetching data succeeded
      //TODO: what if values are ACTUALLY 0 ?
      if (!valueL || !valueY || !valueX || !valueS) {
        // if entity is missing data it should hide
        view.classed("vzb-invisible", true)

      } else {

        // if entity has all the data we update the visuals
        var scaledS = utils.areaToRadius(_this.sScale(valueS));

        view.classed("vzb-invisible", false)
            .style("fill", _this.cScale(valueC));

        if(duration) {
          view.transition().duration(duration).ease("linear")
              .attr("cy", _this.yScale(valueY))
              .attr("cx", _this.xScale(valueX))
              .attr("r", scaledS);
        }
        else {
          view.attr("cy", _this.yScale(valueY))
              .attr("cx", _this.xScale(valueX))
              .attr("r", scaledS);
          // fix for #407 & #408
          d3.timer.flush();
        }

        if(this.model.time.record) _this._export.write({
            type: "circle",
            id: d[KEY],
            time: this.model.time.value.getFullYear(),
            fill: _this.cScale(valueC),
            cx: _this.xScale(valueX),
            cy: _this.yScale(valueY),
            r: scaledS
        });

        _this._updateLabel(d, index, valueX, valueY, scaledS, valueL, duration);

      } // data exists
    },


    _updateLabel: function (d, index, valueX, valueY, scaledS, valueL, duration) {
      var _this = this;
      var KEY = this.KEY;
      if (d[KEY] == _this.druging)
      	return;

      if (duration == null) duration = _this.duration;

      // only for selected entities
      if (_this.model.entities.isSelected(d) && _this.entityLabels != null) {

        if (_this.cached[d[KEY]] == null) _this.cached[d[KEY]] = {};
        var cached = _this.cached[d[KEY]];


        var select = utils.find(_this.model.entities.select, function (f) {
          return f[KEY] == d[KEY]
        });
        var trailStartTime = _this.timeFormatter.parse("" + select.trailStartTime);

        cached.valueX = valueX;
        cached.valueY = valueY;

        if (!_this.model.time.trails || trailStartTime - _this.time > 0 || select.trailStartTime == null) {

          select.trailStartTime = _this.timeFormatter(_this.time);
          //the events in model are not triggered here. to trigger uncomment the next line
          //_this.model.entities.triggerAll("change:select");

          cached.scaledS0 = scaledS;
          cached.labelX0 = valueX;
          cached.labelY0 = valueY;
        }

        if (cached.scaledS0 == null || cached.labelX0 == null || cached.labelX0 == null) {
          cached.scaledS0 = scaledS;
          cached.labelX0 = valueX;
          cached.labelY0 = valueY;
        }

        var lineGroup = _this.entityLines.filter(function (f) {
          return f[KEY] == d[KEY];
        });
        // reposition label
        _this.entityLabels.filter(function (f) {
          return f[KEY] == d[KEY]
        })
          .each(function (groupData) {

            var labelGroup = d3.select(this);

            var text = labelGroup.selectAll("text.vzb-bc-label-content")
              .text(valueL + (_this.model.time.trails ? " " + select.trailStartTime : ""));

            lineGroup.select("line").style("stroke-dasharray", "0 " + (cached.scaledS0 + 2) + " 100%");

            var rect = labelGroup.select("rect");

            var contentBBox = text[0][0].getBBox();
            if (!cached.contentBBox || cached.contentBBox.width != contentBBox.width) {
              cached.contentBBox = contentBBox;

              labelGroup.select("text.vzb-bc-label-x")
                .attr("x", contentBBox.height * 0.0 + 4)
                .attr("y", contentBBox.height * -1);

              labelGroup.select("circle")
                .attr("cx", contentBBox.height * 0.0 + 4)
                .attr("cy", contentBBox.height * -1)
                .attr("r", contentBBox.height * 0.5);

              rect.attr("width", contentBBox.width + 8)
                .attr("height", contentBBox.height + 8)
                .attr("x", -contentBBox.width -4)
                .attr("y", -contentBBox.height -1)
                .attr("rx", contentBBox.height * 0.2)
                .attr("ry", contentBBox.height * 0.2);
            }

            cached.labelX_ = select.labelOffset[0] || -cached.scaledS0 / 2 / _this.width;
            cached.labelY_ = select.labelOffset[1] || -cached.scaledS0 / 2 / _this.width;

            var resolvedX = _this.xScale(cached.labelX0) + cached.labelX_ * _this.width;
            var resolvedY = _this.yScale(cached.labelY0) + cached.labelY_ * _this.height;

            var limitedX = resolvedX - cached.contentBBox.width > 0 ? (resolvedX < _this.width ? resolvedX : _this.width) : cached.contentBBox.width;
            var limitedY = resolvedY - cached.contentBBox.height > 0 ? (resolvedY < _this.height ? resolvedY : _this.height) : cached.contentBBox.height;

            var limitedX0 = _this.xScale(cached.labelX0);
            var limitedY0 = _this.yScale(cached.labelY0);

            _this._repositionLabels(d, index, this, limitedX, limitedY, limitedX0, limitedY0, duration, lineGroup);

          })
      } else {
        //for non-selected bubbles
        //make sure there is no cached data
        if (_this.cached[d[KEY]] != null) {
          delete _this.cached[d[KEY]]
        }
      }
    },

    _repositionLabels: function (d, i, context, resolvedX, resolvedY, resolvedX0, resolvedY0, duration, lineGroup) {

      var labelGroup = d3.select(context);

      if(duration) {
        labelGroup
        .transition().duration(duration).ease("linear")
        .attr("transform", "translate(" + resolvedX + "," + resolvedY + ")");
        lineGroup.transition().duration(duration).ease("linear")
        .attr("transform", "translate(" + resolvedX + "," + resolvedY + ")");
      }
      else {
        labelGroup.attr("transform", "translate(" + resolvedX + "," + resolvedY + ")");
        lineGroup.attr("transform", "translate(" + resolvedX + "," + resolvedY + ")");
      }

      var width = parseInt(labelGroup.select("rect").attr("width"));
      var height = parseInt(labelGroup.select("rect").attr("height"));
      var diffX1 = resolvedX0 - resolvedX;
      var diffY1 = resolvedY0 - resolvedY;
      var diffX2 = 0;
      var diffY2 = 0;

      var angle = Math.atan2(diffX1 + width/2, diffY1 + height/2) * 180 / Math.PI;
      // middle bottom
      if(Math.abs(angle)<=45){ diffX2 = width / 2; diffY2 = 0}
      // right middle
      if(angle>45 && angle<135){ diffX2 = 0; diffY2 = height/4; }
      // middle top
      if(angle<-45 && angle>-135){ diffX2 = width; diffY2 = height/4;  }
      // left middle
      if(Math.abs(angle)>=135){diffX2 = width / 2; diffY2 = height/2  }

      lineGroup.selectAll("line")
        .attr("x1", diffX1)
        .attr("y1", diffY1)
        .attr("x2", -diffX2)
        .attr("y2", -diffY2);

    },


    selectDataPoints: function () {
      var _this = this;
      var KEY = this.KEY;

      _this.someSelected = (_this.model.entities.select.length > 0);


      this.entityLabels = this.labelsContainer.selectAll('.vzb-bc-entity')
        .data(_this.model.entities.select, function (d) {
          return (d[KEY]);
        });
      this.entityLines = this.linesContainer.selectAll('.vzb-bc-entity')
        .data(_this.model.entities.select, function (d) {
          return (d[KEY]);
        });


      this.entityLabels.exit()
        .each(function (d) {
          _this._trails.run("remove", d);
        })
        .remove();
      this.entityLines.exit()
        .each(function (d) {
          _this._trails.run("remove", d);
        })
        .remove();
      this.entityLines
        .enter().append('g')
        .attr("class", "vzb-bc-entity")
        .call(_this.dragger)
        .each(function (d, index) {
           d3.select(this).append("line").attr("class", "vzb-bc-label-line");
        });

      this.entityLabels
        .enter().append("g")
        .attr("class", "vzb-bc-entity")
        .call(_this.dragger)
        .each(function (d, index) {
          var view = d3.select(this);

          view.append("rect")
            .on("click", function (d, i) {
              //default prevented is needed to distinguish click from drag
              if (d3.event.defaultPrevented) return;

              var maxmin = _this.cached[d[KEY]].maxMinValues;
              var radius = utils.areaToRadius(_this.sScale(maxmin.valueSmax));
              _this._zoomOnRectangle(_this.element,
                _this.xScale(maxmin.valueXmin) - radius,
                _this.yScale(maxmin.valueYmin) + radius,
                _this.xScale(maxmin.valueXmax) + radius,
                _this.yScale(maxmin.valueYmax) - radius,
                false, 500);
            });

          view.append("text").attr("class", "vzb-bc-label-content vzb-label-shadow");

          view.append("text").attr("class", "vzb-bc-label-content");

          view.append("circle").attr("class", "vzb-bc-label-x vzb-label-shadow vzb-transparent")
            .on("click", function (d, i) {
              _this.model.entities.clearHighlighted();
              //default prevented is needed to distinguish click from drag
              if (d3.event.defaultPrevented) return;
              _this.model.entities.selectEntity(d);
            });

          view.append("text").attr("class", "vzb-bc-label-x vzb-transparent").text("x");

          _this._trails.create(d);
        })
        .on("mousemove", function () {
          _this.model.entities.highlightEntity(this.__data__);
          d3.select(this).selectAll(".vzb-bc-label-x")
            .classed("vzb-transparent", false);
        })
        .on("mouseout", function (d) {
          _this.model.entities.clearHighlighted();
          d3.select(this).selectAll(".vzb-bc-label-x")
            .classed("vzb-transparent", true);
        });


    },


    _setTooltip: function (tooltipText, x, y) {
      if (tooltipText) {
        var mouse = d3.mouse(this.graph.node()).map(function (d) {return parseInt(d)});

        //position tooltip
        this.tooltip.classed("vzb-hidden", false)
          //.attr("style", "left:" + (mouse[0] + 50) + "px;top:" + (mouse[1] + 50) + "px")
          .attr("transform", "translate(" + (x?x:mouse[0]) + "," + (y?y:mouse[1]) + ")")
          .selectAll("text")
          .text(tooltipText);

        var contentBBox = this.tooltip.select('text')[0][0].getBBox();
        this.tooltip.select('rect').attr("width", contentBBox.width + 8)
                .attr("height", contentBBox.height + 8)
                .attr("x", -contentBBox.width -4)
                .attr("y", -contentBBox.height -1)
                .attr("rx", contentBBox.height * 0.2)
                .attr("ry", contentBBox.height * 0.2);

      } else {

        this.tooltip.classed("vzb-hidden", true);
      }
    },

    /*
     * Shows and hides axis projections
     */
    _axisProjections: function (d) {
      if (d != null) {

        var valueY = this.model.marker.axis_y.getValue(d);
        var valueX = this.model.marker.axis_x.getValue(d);
        var valueS = this.model.marker.size.getValue(d);
        var radius = utils.areaToRadius(this.sScale(valueS));

        if (!valueY || !valueX || !valueS) return;

        if (this.ui.whenHovering.showProjectionLineX) {
          this.projectionX
            .style("opacity", 1)
            .attr("y2", this.yScale(valueY) + radius)
            .attr("x1", this.xScale(valueX))
            .attr("x2", this.xScale(valueX));
        }
        if (this.ui.whenHovering.showProjectionLineY) {
          this.projectionY
            .style("opacity", 1)
            .attr("y1", this.yScale(valueY))
            .attr("y2", this.yScale(valueY))
            .attr("x1", this.xScale(valueX) - radius);
        }

        if (this.ui.whenHovering.higlightValueX) this.xAxisEl.call(
          this.xAxis.highlightValue(valueX)
        );

        if (this.ui.whenHovering.higlightValueY) this.yAxisEl.call(
          this.yAxis.highlightValue(valueY)
        );

      } else {

        this.projectionX.style("opacity", 0);
        this.projectionY.style("opacity", 0);
        this.xAxisEl.call(this.xAxis.highlightValue("none"));
        this.yAxisEl.call(this.yAxis.highlightValue("none"));

      }

    },

    /*
     * Highlights all hovered bubbles
     */
    highlightDataPoints: function () {
      var _this = this;
      var TIMEDIM = this.TIMEDIM;

      this.someHighlighted = (this.model.entities.highlight.length > 0);

      this.updateBubbleOpacity();

      if (this.model.entities.highlight.length === 1) {
        var d = utils.clone(this.model.entities.highlight[0]);

        if (_this.model.time.lockNonSelected && _this.someSelected && !_this.model.entities.isSelected(d)) {
          d[TIMEDIM] = _this.timeFormatter.parse("" + _this.model.time.lockNonSelected);
        } else {
          d[TIMEDIM] = d.trailStartTime || _this.time;
        }

        this._axisProjections(d);
      } else {
        this._axisProjections();
      }
    },

    updateBubbleOpacity: function (duration) {
      var _this = this;
      //if(!duration)duration = 0;

      var OPACITY_HIGHLT = 1.0;
      var OPACITY_HIGHLT_DIM = 0.3;
      var OPACITY_SELECT = this.model.entities.opacityRegular;
      var OPACITY_REGULAR = this.model.entities.opacityRegular;
      var OPACITY_SELECT_DIM = this.model.entities.opacitySelectDim;

      this.entityBubbles
        //.transition().duration(duration)
        .style("opacity", function (d) {

          if (_this.someHighlighted) {
            //highlight or non-highlight
            if (_this.model.entities.isHighlighted(d)) return OPACITY_HIGHLT;
          }

          if (_this.someSelected) {
            //selected or non-selected
            return _this.model.entities.isSelected(d) ? OPACITY_SELECT : OPACITY_SELECT_DIM;
          }

          if (_this.someHighlighted) return OPACITY_HIGHLT_DIM;

          return OPACITY_REGULAR;
        });


      var someSelectedAndOpacityZero = _this.someSelected && _this.model.entities.opacitySelectDim < 0.01;

      // when pointer events need update...
      if (someSelectedAndOpacityZero != this.someSelectedAndOpacityZero_1) {
        this.entityBubbles.style("pointer-events", function (d) {
          return (!someSelectedAndOpacityZero || _this.model.entities.isSelected(d)) ?
            "visible" : "none";
        });
      }

      this.someSelectedAndOpacityZero_1 = _this.someSelected && _this.model.entities.opacitySelectDim < 0.01;
    },

    /*
     * Calculates all values for this data configuration
     */
    _calculateAllValues: function() {
      this.STEPS = this.model.time.getAllSteps();
      this.VALUES = {};
      var f = {};
      for (var i = 0; i < this.STEPS.length; i++) {
        var t = this.STEPS[i];
        f[this.TIMEDIM] = t;
        this.VALUES[t] = this.model.marker.getValues(f, [this.KEY]);
      }
    },

    /*
     * Gets all values for any point in time
     * @param {Date} t time value
     */
    _getValuesInterpolated: function(t) {

      if(!this.VALUES) this._calculateAllValues();
      if(this.VALUES[t]) return this.VALUES[t];

      var next = d3.bisectLeft(this.STEPS, t);

      //if first
      if(next === 0) {
        return this.VALUES[this.STEPS[0]];
      }
      if(next > this.STEPS.length) {
        return this.VALUES[this.STEPS[this.STEPS.length - 1]];
      }

      var fraction = (t - this.STEPS[next - 1]) / (this.STEPS[next] - this.STEPS[next - 1]);

      var pValues = this.VALUES[this.STEPS[next - 1]];
      var nValues = this.VALUES[this.STEPS[next]];

      var curr = {};
      utils.forEach(pValues, function(values, hook) {
        curr[hook] = {};
        utils.forEach(values, function(val, id) {
          var val2 = nValues[hook][id];
          curr[hook][id] = (!utils.isNumber(val)) ? val : val + ((val2 - val)*fraction);
        });
      });

      return curr;
    }

  });


}).call(this);

/*!
 * VIZABI BUBBLECHART
 */

(function () {

  "use strict";

  var Vizabi = this.Vizabi;
  var utils = Vizabi.utils;

  //warn client if d3 is not defined
  if (!Vizabi._require('d3')) return;


  //BUBBLE CHART TOOL
  Vizabi.Tool.extend('BubbleChart', {

    /**
     * Initializes the tool (Bubble Chart Tool).
     * Executed once before any template is rendered.
     * @param {Object} config Initial config, with name and placeholder
     * @param {Object} options Options such as state, data, etc
     */
    init: function (config, options) {

      this.name = "bubblechart";

      //specifying components
      this.components = [{
        component: 'gapminder-bubblechart',
        placeholder: '.vzb-tool-viz',
        model: ["state.time", "state.entities", "state.marker", "language"] //pass models to component
      }, {
        component: 'gapminder-timeslider',
        placeholder: '.vzb-tool-timeslider',
        model: ["state.time"]
      }, {
        component: 'gapminder-buttonlist',
        placeholder: '.vzb-tool-buttonlist',
        model: ['state', 'ui', 'language']
      },{
        component: 'gapminder-treemenu',
        placeholder: '.vzb-tool-treemenu',
        model: ['state.marker', 'language']
      },{
        component: 'gapminder-datawarning',
        placeholder: '.vzb-tool-datawarning',
        model: ['language']
      }];

      this._super(config, options);

    }
  });


}).call(this);

/*!
 * VIZABI BUBBLECHART DEFAULT OPTIONS
 */

(function () {
  "use strict";
  var BubbleChart = this.Vizabi.Tool.get('BubbleChart');

  BubbleChart.define('default_options', {

    state: {
      time: {
        round: "ceil",
        trails: true,
        lockNonSelected: 0,
        adaptMinMaxZoom: false
      },
      entities: {
        dim: "geo",
        show: {
          _defs_: {
            "geo": ["*"],
            "geo.cat": ["country"]
          }
        },
        opacitySelectDim: 0.3,
        opacityRegular: 1,
      },
      marker: {
        space: ["entities", "time"],
        type: "geometry",
        label: {
          use: "property",
          which: "geo.name"
        },
        axis_y: {
          use: "indicator",
          which: "lex"
        },
        axis_x: {
          use: "indicator",
          which: "gdp_per_cap"
        },
        color: {
          use: "property",
          which: "geo.region"
        },
        size: {
          use: "indicator",
          which: "pop"
        }
      }
    },
    data: {
      //reader: "waffle-server",
      reader: "csv-file",
      path: "local_data/waffles/basic-indicators.csv"
    }
  });

}).call(this);

(function () {

  var Vizabi = this.Vizabi;
  var utils = Vizabi.utils;

  Vizabi.Helper.extend("gapminder-bublechart-trails", {

    init: function (context) {
      this.context = context;
    },

    toggle: function (arg) {
      var _this = this.context;

      if (arg) {
        _this._trails.create();
        _this._trails.run(["resize", "recolor", "findVisible", "reveal"]);
      } else {
        _this._trails.run("remove");
        _this.model.entities.select.forEach(function (d) {
          d.trailStartTime = null;
        });
      }
    },

    create: function (selection) {
      var _this = this.context;
      var KEY = _this.KEY;

      //quit if the function is called accidentally
      if (!_this.model.time.trails || !_this.model.entities.select.length) return;

      var start = +_this.timeFormatter(_this.model.time.start);
      var end = +_this.timeFormatter(_this.model.time.end);
      var step = _this.model.time.step;
      var timePoints = [];
      for (var time = start; time <= end; time += step) timePoints.push(time);

      //work with entities.select (all selected entities), if no particular selection is specified
      selection = selection == null ? _this.model.entities.select : [selection];
      selection.forEach(function (d) {

        var trailSegmentData = timePoints.map(function (m) {
          return {t: _this.timeFormatter.parse("" + m)}
        });

        if (_this.cached[d[KEY]] == null) _this.cached[d[KEY]] = {};

        _this.cached[d[KEY]].maxMinValues = {
          valueXmax: null,
          valueXmin: null,
          valueYmax: null,
          valueYmin: null,
          valueSmax: null
        };

        var maxmin = _this.cached[d[KEY]].maxMinValues;

        var trail = _this.entityTrails
          .filter(function (f) {
              return f[KEY] == "trail-" + d[KEY]
          })
          .selectAll("g")
          .data(trailSegmentData);

        trail.exit().remove();

        trail.enter().append("g")
          .attr("class", "trailSegment")
          .on("mousemove", function (segment, index) {
            var _key = d3.select(this.parentNode).data()[0][KEY];

            var pointer = {};
            pointer[KEY] = _key.replace("trail-", "");
            pointer.time = segment.t;

            _this._axisProjections(pointer);
            _this._setTooltip(_this.timeFormatter(segment.t));
            _this.entityLabels
              .filter(function (f) {
                return f[KEY] == _key
              })
              .classed("vzb-highlighted", true);
          })
          .on("mouseout", function (segment, index) {
            _this._axisProjections();
            _this._setTooltip();
            _this.entityLabels.classed("vzb-highlighted", false);
          })
          .each(function (segment, index) {
            var view = d3.select(this);
            view.append("circle");
            view.append("line");
          });


        trail.each(function (segment, index) {
          //update segment data (maybe for new indicators)
          var pointer = {};
          pointer[KEY] = d[KEY];
          pointer.time = segment.t;

          segment.valueY = _this.model.marker.axis_y.getValue(pointer);
          segment.valueX = _this.model.marker.axis_x.getValue(pointer);
          segment.valueS = _this.model.marker.size.getValue(pointer);
          segment.valueC = _this.model.marker.color.getValue(pointer);

          //update min max frame: needed to zoom in on the trail
          if (segment.valueX > maxmin.valueXmax || maxmin.valueXmax == null) maxmin.valueXmax = segment.valueX;
          if (segment.valueX < maxmin.valueXmin || maxmin.valueXmin == null) maxmin.valueXmin = segment.valueX;
          if (segment.valueY > maxmin.valueYmax || maxmin.valueYmax == null) maxmin.valueYmax = segment.valueY;
          if (segment.valueY < maxmin.valueYmin || maxmin.valueYmin == null) maxmin.valueYmin = segment.valueY;
          if (segment.valueS > maxmin.valueSmax || maxmin.valueSmax == null) maxmin.valueSmax = segment.valueS;
        });

      });
    },


    run: function (actions, selection, duration) {
      var _this = this.context;
      var KEY = _this.KEY;


      //quit if function is called accidentally
      if ((!_this.model.time.trails || !_this.model.entities.select.length) && actions != "remove") return;
      if (!duration)duration = 0;

      actions = [].concat(actions);

      //work with entities.select (all selected entities), if no particular selection is specified
      selection = selection == null ? _this.model.entities.select : [selection];
      selection.forEach(function (d) {

        var trail = _this.entityTrails
          .filter(function (f) {
            return f[KEY] == "trail-"+d[KEY]
          })
          .selectAll("g")

        //do all the actions over "trail"
        actions.forEach(function (action) {
          _this._trails["_" + action](trail, duration, d);
        })

      });
    },


    _remove: function (trail, duration, d) {
      trail.remove();
    },

    _resize: function (trail, duration, d) {
      var _this = this.context;

      trail.each(function (segment, index) {

        var view = d3.select(this);
        view.select("circle")
          //.transition().duration(duration).ease("linear")
          .attr("cy", _this.yScale(segment.valueY))
          .attr("cx", _this.xScale(segment.valueX))
          .attr("r", utils.areaToRadius(_this.sScale(segment.valueS)));

        var next = this.parentNode.childNodes[(index + 1)];
        if (next == null) return;
        next = next.__data__;

        view.select("line")
          //.transition().duration(duration).ease("linear")
          .attr("x1", _this.xScale(next.valueX))
          .attr("y1", _this.yScale(next.valueY))
          .attr("x2", _this.xScale(segment.valueX))
          .attr("y2", _this.yScale(segment.valueY));
      });
    },

    _recolor: function (trail, duration, d) {
      var _this = this.context;

      trail.each(function (segment, index) {

        var view = d3.select(this);

        view.select("circle")
          //.transition().duration(duration).ease("linear")
          .style("fill", _this.cScale(segment.valueC));
        view.select("line")
          //.transition().duration(duration).ease("linear")
          .style("stroke", _this.cScale(segment.valueC));
      });
    },


    _findVisible: function (trail, duration, d) {
      var _this = this.context;
      var KEY = _this.KEY;

      var firstVisible = true;
      var trailStartTime = _this.timeFormatter.parse("" + d.trailStartTime);

      trail.each(function (segment, index) {

        // segment is transparent if it is after current time or before trail StartTime
        segment.transparent = (segment.t - _this.time >= 0)
          || (trailStartTime - segment.t > 0)
            //no trail segment should be visible if leading bubble is shifted backwards
          || (d.trailStartTime - _this.timeFormatter(_this.time) >= 0);

        if (firstVisible && !segment.transparent) {
          _this.cached[d[KEY]].labelX0 = segment.valueX;
          _this.cached[d[KEY]].labelY0 = segment.valueY;
          _this.cached[d[KEY]].scaledS0 = utils.areaToRadius(_this.sScale(segment.valueS));
          firstVisible = false;
        }
      });
    },


    _reveal: function (trail, duration, d) {
      var _this = this.context;
      var KEY = _this.KEY;

      trail.each(function (segment, index) {

        var view = d3.select(this);

        view.classed("vzb-invisible", segment.transparent);

        if (segment.transparent) return;

        var next = this.parentNode.childNodes[(index + 1)];
        if (next == null) return;
        next = next.__data__;

        if (segment.t - _this.time <= 0 && _this.time - next.t <= 0) {
          next = _this.cached[d[KEY]];

          view.select("line")
            .attr("x2", _this.xScale(segment.valueX))
            .attr("y2", _this.yScale(segment.valueY))
            .attr("x1", _this.xScale(segment.valueX))
            .attr("y1", _this.yScale(segment.valueY))
            //.transition().duration(duration).ease("linear")
            .attr("x1", _this.xScale(next.valueX))
            .attr("y1", _this.yScale(next.valueY));
        } else {
          view.select("line")
            .attr("x2", _this.xScale(segment.valueX))
            .attr("y2", _this.yScale(segment.valueY))
            .attr("x1", _this.xScale(next.valueX))
            .attr("y1", _this.yScale(next.valueY));
        }
      });

    },


  });


}).call(this);

/*!
 * VIZABI LINECHART
 */

(function () {

  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;

  //warn client if d3 is not defined
  if (!Vizabi._require('d3')) return;


  //LINE CHART COMPONENT
  Vizabi.Component.extend('gapminder-linechart', {

    init: function (context, options) {
      var _this = this;
      this.name = 'linechart';
      this.template = 'src/tools/linechart/linechart.html';

      //define expected models for this component
      this.model_expects = [{
        name: "time",
        type: "time"
      }, {
        name: "entities",
        type: "entities"
      }, {
        name: "marker",
        type: "model"
      }, {
        name: "language",
        type: "language"
      }];


      this.model_binds = {
        'change:time:value': function () {
          if (!_this._readyOnce) return;
          _this.updateTime();
          _this.redrawDataPoints();
        }
      };

      this._super(context, options);

      this.xScale = null;
      this.yScale = null;

      this.xAxis = d3.svg.axisSmart().orient("bottom");
      this.yAxis = d3.svg.axisSmart().orient("left");

      this.isDataPreprocessed = false;
      this.timeUpdatedOnce = false;
      this.sizeUpdatedOnce = false;

      // default UI settings
      this.ui = utils.extend({
        entity_labels: {},
        whenHovering: {}
      }, this.ui["vzb-tool-" + this.name]);

      this.ui.entity_labels = utils.extend({
        min_number_of_entities_when_values_hide: 10
      }, this.ui.entity_labels);

      this.ui.whenHovering = utils.extend({
        hideVerticalNow: true,
        showProjectionLineX: true,
        showProjectionLineY: true,
        higlightValueX: true,
        higlightValueY: true,
        showTooltip: true
      }, this.ui.whenHovering);

      this.getValuesForYear = utils.memoize(this.getValuesForYear);
      this.getNearestKey = utils.memoize(this.getNearestKey);
    },

    /*
     * domReady:
     * Executed after template is loaded
     * Ideally, it contains instantiations related to template
     */
    readyOnce: function () {
      var _this = this;

      this.element = d3.select(this.element);
      this.graph = this.element.select('.vzb-lc-graph');
      this.yAxisEl = this.graph.select('.vzb-lc-axis-y');
      this.xAxisEl = this.graph.select('.vzb-lc-axis-x');
      this.xTitleEl = this.graph.select('.vzb-lc-axis-x-title');
      this.yTitleEl = this.graph.select('.vzb-lc-axis-y-title');
      this.xValueEl = this.graph.select('.vzb-lc-axis-x-value');
      this.yValueEl = this.graph.select('.vzb-lc-axis-y-value');

      this.linesContainer = this.graph.select('.vzb-lc-lines');
      this.labelsContainer = this.graph.select('.vzb-lc-labels');

      this.verticalNow = this.labelsContainer.select(".vzb-lc-vertical-now");
      this.tooltip = this.element.select('.vzb-tooltip');
//            this.filterDropshadowEl = this.element.select('#vzb-lc-filter-dropshadow');
      this.projectionX = this.graph.select("g").select(".vzb-lc-projection-x");
      this.projectionY = this.graph.select("g").select(".vzb-lc-projection-y");

      this.entityLines = null;
      this.entityLabels = null;
      this.totalLength_1 = {};

      this.KEY = this.model.entities.getDimension();

      //component events
      this.on("resize", function () {
        _this.updateSize();
        _this.updateTime();
        _this.redrawDataPoints();
      });
    },

    ready: function () {
      this.updateTime();
      this.updateUIStrings();
      this.updateShow();
      this.updateSize();
      this.redrawDataPoints();

      this.graph
        .on('mousemove', this.entityMousemove.bind(this, null, null, this, true))
        .on('mouseleave', this.entityMouseout.bind(this, null, null, this));
    },

    updateUIStrings: function() {
      this.translator = this.model.language.getTFunction();

      var titleStringX = this.translator("indicator/" + this.model.marker.axis_x.which);
      var titleStringY = this.translator("indicator/" + this.model.marker.axis_y.which);

      var xTitle = this.xTitleEl.selectAll("text").data([0]);
      xTitle.enter().append("text");
      xTitle
        .attr("text-anchor", "end")
        .attr("y", "-0.32em")
        .text(titleStringX);

      var yTitle = this.yTitleEl.selectAll("text").data([0]);
      yTitle.enter().append("text");
      yTitle
        .attr("y", "-0px")
        .attr("x", "-9px")
        .attr("dy", "-0.36em")
        .attr("dx", "-0.72em")
        .text(titleStringY);
    },

    /*
     * UPDATE SHOW:
     * Ideally should only update when show parameters change or data changes
     */
    updateShow: function () {
      var _this = this;
      var KEY = this.KEY;



      this.cached = {};

      //scales
      this.yScale = this.model.marker.axis_y.getScale();
      this.xScale = this.model.marker.axis_x.getScale();
      this.cScale = this.model.marker.color.getScale();
      this.cShadeScale = this.model.marker.color_shadow.getScale();

      this.yAxis.tickSize(6, 0)
        .tickFormat(this.model.marker.axis_y.tickFormatter);
      this.xAxis.tickSize(6, 0)
        .tickFormat(this.model.marker.axis_x.tickFormatter);

      this.collisionResolver = d3.svg.collisionResolver()
        .selector(".vzb-lc-label")
        .value("valueY")
        .scale(this.yScale)
        .KEY(KEY);

      //line template
      this.line = d3.svg.line()
        .interpolate("basis")
        .x(function (d) {
          return _this.xScale(d[0]);
        })
        .y(function (d) {
          return _this.yScale(d[1]);
        });

    },


    /*
     * UPDATE TIME:
     * Ideally should only update when time or data changes
     */
    updateTime: function () {
      var _this = this;
      var KEY = this.KEY;

      var time_1 = (this.time === null) ? this.model.time.value : this.time;
      this.time = this.model.time.value;
      this.duration = this.model.time.playing && (this.time - time_1 > 0) ? this.model.time.speed * 0.9 : 0;

      var timeDim = this.model.time.getDimension();
      var filter = {};

      filter[timeDim] = this.time;

      this.data = this.model.marker.getKeys(filter);
      this.values = this.model.marker.getValues(filter, [KEY]);
      this.prev_values = this.model.marker.getValues(filter, [KEY], true);

      this.entityLines = this.linesContainer.selectAll('.vzb-lc-entity').data(this.data);
      this.entityLabels = this.labelsContainer.selectAll('.vzb-lc-entity').data(this.data);

      this.timeUpdatedOnce = true;

    },

    /*
     * RESIZE:
     * Executed whenever the container is resized
     * Ideally, it contains only operations related to size
     */
    updateSize: function () {

      var _this = this;
      var values = this.values;
      var KEY = this.KEY;

      var padding = 2;

      this.profiles = {
        "small": {
          margin: {top: 30, right: 20, left: 55, bottom: 30},
          tick_spacing: 60,
          text_padding: 8,
          lollipopRadius: 6,
          limitMaxTickNumberX: 5
        },
        "medium": {
          margin: {top: 40, right: 60, left: 55, bottom: 40},
          tick_spacing: 80,
          text_padding: 12,
          lollipopRadius: 7,
          limitMaxTickNumberX: 10
        },
        "large": {
          margin: {top: 50, right: 60, left: 55, bottom: 50},
          tick_spacing: 100,
          text_padding: 20,
          lollipopRadius: 9,
          limitMaxTickNumberX: 0 // unlimited
        }
      };

      var timeSliderProfiles = {
        small: {
          margin: {top: 9, right: 15, bottom: 10, left: 5}
        },
        medium: {
          margin: {top: 9, right: 15, bottom: 10, left: 5}
        },
        large: {
          margin: {top: 9, right: 15, bottom: 10, left: 10}
        }
      };

      this.activeProfile = this.profiles[this.getLayoutProfile()];
      this.margin = this.activeProfile.margin;
      this.tick_spacing = this.activeProfile.tick_spacing;


      //adjust right this.margin according to biggest label
      var lineLabelsText = this.model.marker.getKeys().map(function (d, i) {
        return values.label[d[KEY]];
      });

      var longestLabelWidth = 0;
      var lineLabelsView = this.linesContainer.selectAll(".samplingView").data(lineLabelsText);

      lineLabelsView
        .enter().append("text")
        .attr("class", "samplingView vzb-lc-labelName")
        .style("opacity", 0)
        .text(function (d) {
          return (d.length < 13) ? d : d.substring(0, 10) + '...';
        })
        .each(function (d) {
          if (longestLabelWidth > this.getComputedTextLength()) {
            return;
          }
          longestLabelWidth = this.getComputedTextLength();
        })
        .remove();

      this.margin.right = Math.max(this.margin.right, longestLabelWidth + this.activeProfile.text_padding + 20);


      //stage
      this.height = parseInt(this.element.style("height"), 10) - this.margin.top - this.margin.bottom;
      this.width = parseInt(this.element.style("width"), 10) - this.margin.left - this.margin.right;

      this.collisionResolver.height(this.height);

      this.graph
        .attr("width", this.width + this.margin.right + this.margin.left)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .select("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");


      if (this.model.marker.axis_y.scaleType !== "ordinal") {
        this.yScale.range([this.height, 0]);
      } else {
        this.yScale.rangePoints([this.height, 0], padding).range();
      }
      if (this.model.marker.axis_x.scaleType !== "ordinal" || 1) {
        this.xScale.range([0, this.width]);
      } else {
        this.xScale.rangePoints([0, this.width], padding).range();
      }


      this.yAxis.scale(this.yScale)
        .labelerOptions({
          scaleType: this.model.marker.axis_y.scaleType,
          toolMargin: {top: 0, right: this.margin.right, left: this.margin.left, bottom: this.margin.bottom},
          limitMaxTickNumber: 6
          //showOuter: true
        });

      this.xAxis.scale(this.xScale)
        .labelerOptions({
          scaleType: this.model.marker.axis_x.scaleType,
          toolMargin: this.margin,
          limitMaxTickNumber: this.activeProfile.limitMaxTickNumberX
          //showOuter: true
        });


      this.yAxisEl.call(this.yAxis);
      this.xAxisEl.call(this.xAxis);

      this.xAxisEl.attr("transform", "translate(0," + this.height + ")");
      this.xValueEl.attr("transform", "translate(0," + this.height + ")")
        .attr("y", this.xAxis.tickPadding() + this.xAxis.tickSize());

      this.xTitleEl.attr("transform", "translate(" + this.width + "," + this.height + ")");

      // adjust the vertical dashed line
      this.verticalNow.attr("y1", this.yScale.range()[0]).attr("y2", this.yScale.range()[1])
        .attr("x1", 0).attr("x2", 0);
      this.projectionX.attr("y1", _this.yScale.range()[0]);
      this.projectionY.attr("x2", _this.xScale.range()[0]);


      var opts = {
        rangeMax: this.xScale.range()[1],
        mRight: this.margin.right,
        profile: timeSliderProfiles[this.getLayoutProfile()]
      };
      this.parent.trigger('myEvent', opts);

      this.sizeUpdatedOnce = true;
    },

    /*
     * REDRAW DATA POINTS:
     * Here plotting happens
     */
    redrawDataPoints: function () {
      var _this = this;
      var KEY = this.KEY;
      var values = this.values;

      if (!this.timeUpdatedOnce) {
        this.updateTime();
      }

      if (!this.sizeUpdatedOnce) {
        this.updateSize();
      }

      this.entityLabels.exit().remove();
      this.entityLines.exit().remove();

      this.entityLines.enter().append("g")
        .attr("class", "vzb-lc-entity")
        .each(function (d, index) {
          var entity = d3.select(this);
          var color = _this.cScale(values.color[d[KEY]]);
          var colorShadow = _this.cShadeScale(values.color_shadow[d[KEY]]);

          entity.append("path")
            .attr("class", "vzb-lc-line-shadow")
            .style("stroke", colorShadow)
            .attr("transform", "translate(0,2)");

          entity.append("path")
            .attr("class", "vzb-lc-line")
            .style("stroke", color);

        });

      this.entityLabels.enter().append("g")
        .attr("class", "vzb-lc-entity")
        .each(function (d, index) {
          var entity = d3.select(this);
          var color = _this.cScale(values.color[d[KEY]]);
          var colorShadow = _this.cShadeScale(values.color_shadow[d[KEY]]);
          var label = values.label[d[KEY]];

          entity.append("circle")
            .attr("class", "vzb-lc-circle")
            .style("fill", color)
            .attr("cx", 0);

          var labelGroup = entity.append("g").attr("class", "vzb-lc-label");

          labelGroup.append("text")
            .attr("class", "vzb-lc-labelName")
            .style("fill", colorShadow)
            .attr("dy", ".35em");

          labelGroup.append("text")
            .attr("class", "vzb-lc-labelValue")
            .style("fill", colorShadow)
            .attr("dy", "1.6em");
        });

      var prev_values = this.prev_values;

      this.entityLines
        .each(function (d, index) {
          var entity = d3.select(this);
          var label = values.label[d[KEY]];

          //TODO: optimization is possible if getValues would return both x and time
          //TODO: optimization is possible if getValues would return a limited number of points, say 1 point per screen pixel
          var x = prev_values.axis_x[d[KEY]];
          var y = prev_values.axis_y[d[KEY]];
          var xy = x.map(function (d, i) {
            return [+x[i], +y[i]];
          });
          xy = xy.filter(function (d) {
            return !utils.isNaN(d[1]);
          });
          _this.cached[d[KEY]] = {valueY: xy[xy.length - 1][1]};

          // the following fixes the ugly line butts sticking out of the axis line
          //if(x[0]!=null && x[1]!=null) xy.splice(1, 0, [(+x[0]*0.99+x[1]*0.01), y[0]]);

          var path1 = entity.select(".vzb-lc-line-shadow")
            .attr("d", _this.line(xy));
          var path2 = entity.select(".vzb-lc-line")
            //.style("filter", "none")
            .attr("d", _this.line(xy));


          // this section ensures the smooth transition while playing and not needed otherwise
          if (_this.model.time.playing) {

            var totalLength = path2.node().getTotalLength();

            if (_this.totalLength_1[d[KEY]] === null) {
              _this.totalLength_1[d[KEY]] = totalLength;
            }

            path1
              .attr("stroke-dasharray", totalLength)
              .attr("stroke-dashoffset", totalLength - _this.totalLength_1[d[KEY]])
              .transition()
              .duration(_this.duration)
              .ease("linear")
              .attr("stroke-dashoffset", 0);

            path2
              .attr("stroke-dasharray", totalLength)
              .attr("stroke-dashoffset", totalLength - _this.totalLength_1[d[KEY]])
              .transition()
              .duration(_this.duration)
              .ease("linear")
              .attr("stroke-dashoffset", 0);

            _this.totalLength_1[d[KEY]] = totalLength;
          } else {
            //reset saved line lengths
            _this.totalLength_1[d[KEY]] = null;

            path1
              .attr("stroke-dasharray", "none")
              .attr("stroke-dashoffset", "none");

            path2
              .attr("stroke-dasharray", "none")
              .attr("stroke-dashoffset", "none");
          }

        });

      this.entityLabels
        .each(function (d, index) {
          var entity = d3.select(this);
          var label = values.label[d[KEY]];

          entity.select(".vzb-lc-circle")
            .transition()
            .duration(_this.duration)
            .ease("linear")
            .attr("r", _this.profiles[_this.getLayoutProfile()].lollipopRadius)
            .attr("cy", _this.yScale(_this.cached[d[KEY]].valueY) + 1);


          entity.select(".vzb-lc-label")
            .transition()
            .duration(_this.duration)
            .ease("linear")
            .attr("transform", "translate(0," + _this.yScale(_this.cached[d[KEY]].valueY) + ")");


          var value = _this.yAxis.tickFormat()(_this.cached[d[KEY]].valueY);
          var name = label.length < 13 ? label : label.substring(0, 10) + '...';
          var valueHideLimit = _this.ui.entity_labels.min_number_of_entities_when_values_hide;

          var t = entity.select(".vzb-lc-labelName")
            .attr("dx", _this.activeProfile.text_padding)
            .text(name + " " + (_this.data.length < valueHideLimit ? value : ""));

          entity.select(".vzb-lc-labelValue")
            .attr("dx", _this.activeProfile.text_padding)
            .text("");

          if (_this.data.length < valueHideLimit) {

            var size = _this.xScale(_this.time)
              + t[0][0].getComputedTextLength()
              + _this.activeProfile.text_padding;
            var width = _this.width + _this.margin.right;

            if (size > width) {
              entity.select(".vzb-lc-labelName").text(name);
              entity.select(".vzb-lc-labelValue").text(value);
            }
          }
        });

      this.labelsContainer
        .transition()
        .duration(_this.duration)
        .ease("linear")
        .attr("transform", "translate(" + _this.xScale(_this.time) + ",0)");

      this.verticalNow
        .style("opacity", this.time - this.model.time.start === 0 || _this.hoveringNow ? 0 : 1);


      if (!this.hoveringNow) {
        this.xAxisEl.call(
          this.xAxis.highlightValue(_this.time).highlightTransDuration(_this.duration)
        );
      }

      // Call flush() after any zero-duration transitions to synchronously flush the timer queue
      // and thus make transition instantaneous. See https://github.com/mbostock/d3/issues/1951
      if (_this.duration == 0) {
        d3.timer.flush();
      }

      // cancel previously queued simulation if we just ordered a new one
      // then order a new collision resolving
      clearTimeout(_this.collisionTimeout);
      _this.collisionTimeout = setTimeout(function () {
        _this.entityLabels.call(_this.collisionResolver.data(_this.cached));
      }, _this.model.time.speed * 1.5);

    },

    entityMousemove: function (me, index, context, closestToMouse) {
      var _this = context;
      var KEY = _this.KEY;
      var values = _this.values;

      var mouse = d3.mouse(_this.graph.node()).map(function (d) {
        return parseInt(d);
      });

      var resolvedTime = _this.xScale.invert(mouse[0] - _this.margin.left);
      if (_this.time - resolvedTime < 0) {
        resolvedTime = _this.time;
      } else if (resolvedTime < this.model.time['start']) {
        resolvedTime = this.model.time['start'];
      }
      var resolvedValue;
      var timeDim = _this.model.time.getDimension();
      if (closestToMouse) {
        var mousePos = mouse[1] - _this.margin.bottom;
        var data = this.getValuesForYear(resolvedTime);
        var nearestKey = this.getNearestKey(mousePos, data.axis_y, _this.yScale.bind(_this));
        resolvedValue = data.axis_y[nearestKey];
        if (!me) me = {};
        me[KEY] = nearestKey;
      } else {
        var pointer = {};
        pointer[KEY] = me[KEY];
        pointer[timeDim] = resolvedTime;
        resolvedValue = _this.model.marker.axis_y.getValue(pointer);
      }

      _this.hoveringNow = me;

      _this.graph.selectAll(".vzb-lc-entity").each(function () {
        d3.select(this)
          .classed("vzb-dimmed", function (d) {
            return d[KEY] !== _this.hoveringNow[KEY];
          })
          .classed("vzb-hovered", function (d) {
            return d[KEY] === _this.hoveringNow[KEY];
          });
      });

      if (utils.isNaN(resolvedValue)) return;

      var scaledTime = _this.xScale(resolvedTime);
      var scaledValue = _this.yScale(resolvedValue);

      if (_this.ui.whenHovering.showTooltip) {
        //position tooltip
        _this.tooltip
          //.style("right", (_this.width - scaledTime + _this.margin.right ) + "px")
          .style("left", (scaledTime + _this.margin.left ) + "px")
          .style("bottom", (_this.height - scaledValue + _this.margin.bottom) + "px")
          .text(_this.yAxis.tickFormat()(resolvedValue))
          .classed("vzb-hidden", false);
      }

      // bring the projection lines to the hovering point
      if (_this.ui.whenHovering.hideVerticalNow) {
        _this.verticalNow.style("opacity", 0);
      }

      if (_this.ui.whenHovering.showProjectionLineX) {
        _this.projectionX
          .style("opacity", 1)
          .attr("y2", scaledValue)
          .attr("x1", scaledTime)
          .attr("x2", scaledTime);
      }
      if (_this.ui.whenHovering.showProjectionLineY) {
        _this.projectionY
          .style("opacity", 1)
          .attr("y1", scaledValue)
          .attr("y2", scaledValue)
          .attr("x1", scaledTime);
      }

      if (_this.ui.whenHovering.higlightValueX) _this.xAxisEl.call(
        _this.xAxis.highlightValue(resolvedTime).highlightTransDuration(0)
      );

      if (_this.ui.whenHovering.higlightValueY) _this.yAxisEl.call(
        _this.yAxis.highlightValue(resolvedValue).highlightTransDuration(0)
      );

      clearTimeout(_this.unhoverTimeout);

    },

    entityMouseout: function (me, index, context) {
      var _this = context;
      if (d3.select(d3.event.relatedTarget).classed('vzb-tooltip')) return;

      // hide and show things like it was before hovering
      _this.unhoverTimeout = setTimeout(function () {
        _this.tooltip.classed("vzb-hidden", true);
        _this.verticalNow.style("opacity", 1);
        _this.projectionX.style("opacity", 0);
        _this.projectionY.style("opacity", 0);
        _this.xAxisEl.call(_this.xAxis.highlightValue(_this.time));
        _this.yAxisEl.call(_this.yAxis.highlightValue("none"));

        _this.graph.selectAll(".vzb-lc-entity").each(function () {
          d3.select(this).classed("vzb-dimmed", false).classed("vzb-hovered", false);
        });

        _this.hoveringNow = null;
      }, 300);

    },

    getValuesForYear: function(year) {
      if (!utils.isDate(year)) {
        year = new Date('00:00:00 ' + year);
      }
      return this.model.marker.getValues({ time: year }, [this.KEY]);
    },

    /**
     * Returns key from obj which value has the smallest difference with val
     */
    getNearestKey: function (val, obj, fn) {
      var keys = Object.keys(obj);
      var resKey = keys[0];
      for (var i = 1; i < keys.length; i++) {
        var key = keys[i];
        if (Math.abs((fn ? fn(obj[key]) : obj[key]) - val) < Math.abs((fn ? fn(obj[resKey]) : obj[resKey]) - val)) {
          resKey = key;
        }
      }
      return resKey;
    }




//        resolveLabelCollisions: function(){
//            var _this = this;
//
//            // cancel previously queued simulation if we just ordered a new one
//            clearTimeout(_this.collisionTimeout);
//
//            // place force layout simulation into a queue
//            _this.collisionTimeout = setTimeout(function(){
//
//                _this.cached.sort(function(a,b){return a.value - b.value});
//
//                // update inputs of force layout -- fixed nodes
//                _this.dataForceLayout.links.forEach(function(d,i){
//                    var source = utils.find(_this.cached, {geo:d.source[KEY]});
//                    var target = utils.find(_this.cached, {geo:d.target[KEY]});
//
//                    d.source.px = _this.xScale(source.time);
//                    d.source.py = _this.yScale(source.value);
//                    d.target.px = _this.xScale(target.time) + 10;
//                    d.target.py = _this.yScale(target.value) + 10;
//                });
//
//                // shift the boundary nodes
//                _this.dataForceLayout.nodes.forEach(function(d){
//                    if(d[KEY] == "upper_boundary"){d.x = _this.xScale(_this.time)+10; d.y = 0; return};
//                    if(d[KEY] == "lower_boundary"){d.x = _this.xScale(_this.time)+10; d.y = _this.height; return};
//                });
//
//                // update force layout size for better gravity
//                _this.forceLayout.size([_this.xScale(_this.time)*2, _this.height]);
//
//                    // resume the simulation, fast-forward it, stop when done
//                    _this.forceLayout.resume();
//                    while(_this.forceLayout.alpha() > 0.01)_this.forceLayout.tick();
//                    _this.forceLayout.stop();
//            },  500)
//        },
//
//
//
//        initLabelCollisionResolver: function(){
//            var _this = this;
//
//            this.dataForceLayout = {nodes: [], links: []};
//            this.ROLE_BOUNDARY = 'boundary node';
//            this.ROLE_MARKER = 'node fixed to marker';
//            this.ROLE_LABEL = 'node for floating label';
//
//            this.data = this.model.marker.label.getKeys({ time: this.time });
//            this.data.forEach(function(d,i){
//                _this.dataForceLayout.nodes.push({geo: d[KEY], role:_this.ROLE_MARKER, fixed: true});
//                _this.dataForceLayout.nodes.push({geo: d[KEY], role:_this.ROLE_LABEL, fixed: false});
//                _this.dataForceLayout.links.push({source: i*2, target: i*2+1 });
//            })
//            _this.dataForceLayout.nodes.push({geo: "upper_boundary", role:_this.ROLE_BOUNDARY, fixed: true});
//            _this.dataForceLayout.nodes.push({geo: "lower_boundary", role:_this.ROLE_BOUNDARY, fixed: true});
//
//            this.forceLayout = d3.layout.force()
//                .size([1000, 400])
//                .gravity(0.05)
//                .charge(function(d){
//                        switch (d.role){
//                            case _this.ROLE_BOUNDARY: return -1000;
//                            case _this.ROLE_MARKER: return -0;
//                            case _this.ROLE_LABEL: return -1000;
//                        }
//                    })
//                .linkDistance(10)
//                //.linkStrength(1)
//                .chargeDistance(30)
//                .friction(0.2)
//                //.theta(0.8)
//                .nodes(this.dataForceLayout.nodes)
//                .links(this.dataForceLayout.links)
//                .on("tick", function(){
//                    _this.dataForceLayout.nodes.forEach(function (d, i) {
//                        if(d.fixed)return;
//
//                        if(d.x<_this.xScale(_this.time)) d.x = _this.xScale(_this.time);
//                        if(d.x>_this.xScale(_this.time)+10) d.x--;
//                    })
//                })
//                .on("end", function () {
//
//                    var entitiesOrderedByY = _this.cached
//                        .map(function(d){return d[KEY]});
//
//                    var suggestedY = _this.dataForceLayout.nodes
//                        .filter(function(d){return d.role==_this.ROLE_LABEL})
//                        .sort(function(a,b){return b.y-a.y});
//
//                    _this.graph.selectAll(".vzb-lc-label")
//                        .each(function (d, i) {
//                            var geoIndex = _this.cached.map(function(d){return d[KEY]}).indexOf(d[KEY]);
//                            var resolvedY = suggestedY[geoIndex].y || _this.yScale(_this.cached[geoIndex][geoIndex]) || 0;
//                            d3.select(this)
//                                .transition()
//                                .duration(300)
//                                .attr("transform", "translate(" + _this.xScale(_this.time) + "," + resolvedY + ")")
//                        });
//
//
//                })
//                .start();
//
//        }


  });


}).call(this);

/*!
 * VIZABI LINECHART
 */

(function () {

  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;

  //warn client if d3 is not defined
  if (!Vizabi._require('d3')) return;


  //LINE CHART TOOL
  Vizabi.Tool.extend('LineChart', {
    /**
     * Initialized the tool
     * @param config tool configurations, such as placeholder div
     * @param options tool options, such as state, data, etc
     */
    init: function (config, options) {

      this.name = 'linechart';

      this.components = [{
        component: 'gapminder-linechart',
        placeholder: '.vzb-tool-viz',
        model: ["state.time", "state.entities", "state.marker", "language"] //pass models to component
      }, {
        component: 'gapminder-timeslider',
        placeholder: '.vzb-tool-timeslider',
        model: ["state.time"],
        ui: {show_value_when_drag_play: false, axis_aligned: true}
      }, {
        component: 'gapminder-buttonlist',
        placeholder: '.vzb-tool-buttonlist',
        model: ['state', 'ui', 'language']
      }];

      this._super(config, options);
    }

  });

}).call(this);

/*!
 * VIZABI LINECHART DEFAULT OPTIONS
 */

(function () {
  "use strict";
  var LineChart = this.Vizabi.Tool.get('LineChart');

  LineChart.define('default_options', {
    state: {
      time: {
        start: 1990,
        end: 2012,
        value: 2012,
        step: 1,
        speed: 300,
        formatInput: "%Y"
      },
      //entities we want to show
      entities: {
        dim: "geo",
        show: {
          _defs_: {
            "geo": ["*"],
            "geo.cat": ["region"]
          }
        }
      },
      //how we show it
      marker: {
        space: ["entities", "time"],
        label: {
          use: "property",
          which: "geo.name"
        },
        axis_y: {
          use: "indicator",
          which: "gdp_per_cap",
          scaleType: "log"
        },
        axis_x: {
          use: "indicator",
          which: "time",
          scaleType: "time"
        },
        color: {
          use: "property",
          which: "geo.region"
        },
        color_shadow: {
          use: "property",
          which: "geo.region"
        }
      }
    },

    data: {
      //reader: "waffle-server",
      reader: "csv-file",
      path: "local_data/waffles/basic-indicators.csv"
    },

    ui: {
      'vzb-tool-line-chart': {
        entity_labels: {
          min_number_of_entities_when_values_hide: 2 //values hide when showing 2 entities or more
        },
        whenHovering: {
          hideVerticalNow: 0,
          showProjectionLineX: true,
          showProjectionLineY: true,
          higlightValueX: true,
          higlightValueY: true,
          showTooltip: 0
        }
      }
    }
  });

}).call(this);

/*!
 * VIZABI MOUNTAINCHART
 */

(function () {

    'use strict';

    var Vizabi = this.Vizabi;
    var utils = Vizabi.utils;
    var iconset = Vizabi.iconset;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) return;




    //MOUNTAIN CHART COMPONENT
    Vizabi.Component.extend('gapminder-mountainchart', {

        /**
         * Initializes the component (Mountain Chart).
         * Executed once before any template is rendered.
         * @param {Object} config The options passed to the component
         * @param {Object} context The component's parent
         */
        init: function (config, context) {

            var _this = this;
            this.name = 'mountainchart';
            this.template = 'src/tools/mountainchart/mountainchart.html';

            //define expected models for this component
            this.model_expects = [
                { name: 'time', type: 'time' },
                { name: 'entities', type: 'entities' },
                { name: 'marker', type: 'model' },
                { name: 'language', type: 'language' }
            ];

            this.model_binds = {
                'change': function (evt) {
                    if (!_this._readyOnce) return;
                    if (evt.indexOf('change:time') !== -1) return;
                    //console.log('change', evt);
                },
                'change:marker:color:palette': utils.debounce(function (evt) {
                    _this.redrawDataPoints();
                    _this.redrawDataPointsOnlyColors();
                    _this.redrawSelectList();
                }, 200),
                'change:time:value': function () {
                    //console.log('change time value');
                    _this.updateTime();
                    _this.redrawDataPoints();
                    _this.redrawSelectList();
                    _this.updatePovertyLine();
                    _this._updateDoubtOpacity();

                },
                'change:time:povertyCutoff': function () {
                    //console.log('change time value');
                    _this.ready();
                },
                'change:time:gdpFactor': function () {
                    //console.log('change time value');
                    _this.ready();
                },
                'change:time:gdpShift': function () {
                    //console.log('change time value');
                    _this.ready();
                },
                'change:time:povertyFade': function () {
                    //console.log('change time value');
                    _this.ready();
                },
                'change:time:xPoints': function () {
                    //console.log('acting on resize');
                    _this.ready();
                },
                'change:time:record': function () {
                    //console.log('change time record');
                    if (_this.model.time.record) {
                        _this._export.open(this.element, this.name);
                    } else {
                        _this._export.reset();
                    }
                },
                'change:time:xLogStops': function () {
                    _this.updateSize();
                },
                'change:entities:highlight': function () {
                    if (!_this._readyOnce) return;
                    //console.log('EVENT change:entities:highlight');
                    _this.highlightEntities();
                    _this.updateOpacity();
                },
                'change:entities:select': function () {
                    if (!_this._readyOnce) return;
                    //console.log('EVENT change:entities:select');
                    _this.selectEntities();
                    _this.redrawSelectList();
                    _this.updateOpacity();
                    _this._updateDoubtOpacity();
                    _this.redrawDataPoints();
                },
                'change:time:yMaxMethod': function () {
                    _this._adjustMaxY({force: true});
                    _this.redrawDataPoints();
                },
                'change:time:povertyline': function () {
                    _this.ready();
                },
                'change:marker': function (evt) {
                    if (!_this._readyOnce) return;
                    //console.log('EVENT change:marker', evt);
                    if (evt.indexOf('min') > -1 || evt.indexOf('max') > -1) {
                        _this.updateSize();
                        _this.updateTime();
                        _this._adjustMaxY({
                            force: true
                        });
                        _this.redrawDataPoints();
                    }
                },
                'change:marker:group': function (evt) {
                    if (!_this._readyOnce) return;
                    if (evt === 'change:marker:group:merge') return;
                    //console.log('group event')
                    _this.ready();
                },

                'change:marker:group:merge': function (evt) {
                    if (!_this._readyOnce) return;
                    //console.log('group merge event')
                    _this.updateTime();
                    _this.redrawDataPoints();
                },
                'change:marker:stack': function (evt) {
                    if (!_this._readyOnce) return;
                    _this.ready();
                },
                'change:entities:opacitySelectDim': function () {
                    _this.updateOpacity();
                },
                'change:entities:opacityRegular': function () {
                    _this.updateOpacity();
                }
            };



            this._super(config, context);

            var MountainChartMath = Vizabi.Helper.get('gapminder-mountainchart-math');
            var Exporter = Vizabi.Helper.get('gapminder-svgexport');
            this._math = new MountainChartMath(this);
            this._export = new Exporter(this);
            this._export
                .prefix('vzb-mc-')
                .deleteClasses(['vzb-mc-mountains-mergestacked', 'vzb-mc-mountains-mergegrouped', 'vzb-mc-mountains', 'vzb-mc-year', 'vzb-mc-mountains-labels', 'vzb-mc-axis-labels']);

            this.xScale = null;
            this.yScale = null;
            this.cScale = null;

            this.xAxis = d3.svg.axisSmart();

            this.cached = {};
            this.mesh = [];
            this.yMax = 0;


            this.rescale = function (x) {
                return Math.exp(_this.model.time.gdpFactor * Math.log(x) + _this.model.time.gdpShift);
            };
            this.unscale = function (x) {
                return Math.exp((Math.log(x) - _this.model.time.gdpShift) / _this.model.time.gdpFactor);
            };

            // define path generator
            this.area = d3.svg.area()
                .interpolate('basis')
                .x(function (d) {return Math.round(_this.xScale(_this.rescale(d.x)));})
                .y0(function (d) {return Math.round(_this.yScale(d.y0));})
                .y1(function (d) {return Math.round(_this.yScale(d.y0 + d.y));});


            this.stack = d3.layout.stack()
                .order('reverse')
                .values(function (d) {return _this.cached[d.KEY()];})
                .out(function out(d, y0, y) {d.y0 = y0;});
        },


        /**
         * DOM is ready
         */
        domReady: function(){
            var _this = this;

            // reference elements
            this.element = d3.select(this.element);
            this.graph = this.element.select('.vzb-mc-graph');
            this.xAxisEl = this.graph.select('.vzb-mc-axis-x');
            this.xTitleEl = this.graph.select('.vzb-mc-axis-x-title');
            this.yTitleEl = this.graph.select('.vzb-mc-axis-y-title');
            this.infoEl = this.graph.select('.vzb-mc-axis-info');
            this.dataWarningEl = this.graph.select('.vzb-data-warning');
            this.yearEl = this.graph.select('.vzb-mc-year');
            this.mountainMergeStackedContainer = this.graph.select('.vzb-mc-mountains-mergestacked');
            this.mountainMergeGroupedContainer = this.graph.select('.vzb-mc-mountains-mergegrouped');
            this.mountainAtomicContainer = this.graph.select('.vzb-mc-mountains');
            this.mountainLabelContainer = this.graph.select('.vzb-mc-mountains-labels');
            this.tooltip = this.element.select('.vzb-mc-tooltip');
            this.eventAreaEl = this.element.select('.vzb-mc-eventarea');
            this.povertylineEl = this.element.select('.vzb-mc-povertyline');
            this.povertylineLineEl = this.povertylineEl.select('line');
            this.povertylineTextEl = this.povertylineEl.selectAll('text');

            this.element
              .onTap(function (d, i) {
                _this._interact()._mouseout(d, i);
              });
        },




        afterPreload: function(){
            var _this = this;

            var yearNow = _this.model.time.value.getFullYear();
            var yearEnd = _this.model.time.end.getFullYear();

            if(!this.precomputedShapes || !this.precomputedShapes[yearNow] || !this.precomputedShapes[yearEnd]) return;

            var yMax = this.precomputedShapes[this.model.time.yMaxMethod == 'immediate'? yearNow : yearEnd].yMax;
            var shape = this.precomputedShapes[yearNow].shape;

            if(!yMax || !shape || shape.length === 0) return;

            this.xScale = d3.scale.log().domain([this.model.marker.axis_x.min, this.model.marker.axis_x.max]);
            this.yScale = d3.scale.linear().domain([0, +yMax]);

            _this.updateSize(shape.length);

            shape = shape.map(function(m,i){return {x: _this.mesh[i], y0:0, y:+m};})

            this.mountainAtomicContainer.selectAll('.vzb-mc-prerender')
                .data([0])
                .enter().append('path')
                .attr('class', 'vzb-mc-prerender')
                .style('fill', 'pink')
                .style('opacity', 0)
                .attr('d', _this.area(shape))
                .transition().duration(1000).ease('linear')
                .style('opacity', 1);
        },

        readyOnce: function () {

            this.eventAreaEl.on('mousemove', function(){
                if (_this.model.time.dragging)return;
                var mouse = d3.mouse(_this.graph.node()).map(function (d) { return parseInt(d); });
                _this.updatePovertyLine({level: _this.xScale.invert(mouse[0]), full: true});

            }).on('mouseout', function(){
                if (_this.model.time.dragging)return;
                var mouse = d3.mouse(_this.graph.node()).map(function (d) { return parseInt(d); });
                _this.updatePovertyLine();
            });

            var _this = this;
            this.on('resize', function () {
                //console.log('acting on resize');
                _this.updateSize();
                _this.updateTime(); // respawn is needed
                _this.redrawDataPoints();
                _this.redrawSelectList();
                _this.updatePovertyLine();
            });

            this.KEY = this.model.entities.getDimension();
            this.TIMEDIM = this.model.time.getDimension();

            this.mountainAtomicContainer.select('.vzb-mc-prerender').remove();
            
            this.wScale = d3.scale.linear()
                .domain(this.parent.datawarning_content.doubtDomain)
                .range(this.parent.datawarning_content.doubtRange);
        },

        ready: function(){
            //console.log("ready")
            this.updateUIStrings();
            this.updateIndicators();
            this.updateEntities();
            this.updateSize();
            this._spawnMasks();
            this.updateTime();
            this._adjustMaxY({force:true});
            this.redrawDataPoints();
            this.redrawDataPointsOnlyColors();
            this.highlightEntities();
            this.selectEntities();
            this.redrawSelectList();
            this.updateOpacity();
            this._updateDoubtOpacity();
            this.updatePovertyLine();
        },


        updateUIStrings: function(){
            var _this = this;
            
            this.translator = this.model.language.getTFunction();
            var xMetadata = Vizabi._globals.metadata.indicatorsDB[this.model.marker.axis_x.which];


            this.xTitleEl.select('text')
                .text(this.translator('unit/mountainchart_hardcoded_income_per_day'));
            
            this.yTitleEl.select('text')
                .text(this.translator('mount/title'));

            this.dataWarningEl.html(iconset['warn']).select("svg").attr("width", "0px").attr("height", "0px");
            this.dataWarningEl.append("text")
                .text(this.translator("hints/dataWarning"));

            
            //TODO: move away from UI strings, maybe to ready or ready once
            this.infoEl.on("click", function(){
                window.open(xMetadata.sourceLink, '_blank').focus();
            })    
            this.dataWarningEl
                .on("click", function () {
                    _this.parent.findChildByName("gapminder-datawarning").toggle();
                })
                .on("mouseover", function () {
                    _this._updateDoubtOpacity(1);
                })
                .on("mouseout", function () {
                    _this._updateDoubtOpacity();
                })   
        },
        
        
        _updateDoubtOpacity: function (opacity) {
            if (opacity == null) opacity = this.wScale(+this.time.getFullYear().toString());
            if (this.someSelected) opacity = 1;
            this.dataWarningEl.style("opacity", opacity);
        },

        /**
         * Updates indicators
         */
        updateIndicators: function () {
            var _this = this;

            //fetch scales, or rebuild scales if there are none, then fetch
            this.yScale = this.model.marker.axis_y.getScale();
            this.xScale = this.model.marker.axis_x.getScale();
            this.cScale = this.model.marker.color.getScale();

            this.xAxis.tickFormat(_this.model.marker.axis_x.tickFormatter);
        },


        /**
         * Updates entities
         */
        updateEntities: function () {
            var _this = this;

            var filter = {};
            filter[_this.TIMEDIM] = this.model.time.end;
            this.values = this.model.marker.getValues(filter, [_this.KEY]);

            // construct pointers
            this.mountainPointers = this.model.marker.getKeys()
                .map(function (d) {
                    var pointer = {};
                    pointer[_this.KEY] = d[_this.KEY];
                    pointer.KEY = function(){return this[_this.KEY];};
                    pointer.sortValue = [_this.values.axis_y[pointer.KEY()], 0];
                    pointer.aggrLevel = 0;
                    return pointer;
                });


            //TODO: optimise this!
            this.groupedPointers = d3.nest()
                .key(function (d) {
                    return _this.model.marker.stack.use === 'property'? _this.values.stack[d.KEY()] : _this.values.group[d.KEY()];
                })
                .sortValues(function (a, b) {return b.sortValue[0] - a.sortValue[0];})
                .entries(this.mountainPointers);


            var groupManualSort = this.model.marker.group.manualSorting;
            this.groupedPointers.forEach(function (group) {
                    var groupSortValue = d3.sum(group.values.map(function (m) {
                        return m.sortValue[0];
                    }));

                    if(groupManualSort && groupManualSort.length>1) groupSortValue = groupManualSort.indexOf(group.key);

                    group.values.forEach(function (d) {
                        d.sortValue[1] = groupSortValue;
                    });

                    group[_this.model.entities.getDimension()] = group.key; // hack to get highlihgt and selection work
                    group.KEY = function(){return this.key;};
                    group.aggrLevel = 1;
                });

            var sortGroupKeys = {};
            _this.groupedPointers.map(function(m){sortGroupKeys[m.key] = m.values[0].sortValue[1]; });


            // update the stacked pointers
            if (_this.model.marker.stack.which === 'none'){
                this.stackedPointers = [];
                this.mountainPointers.sort(function (a, b) {return b.sortValue[0] - a.sortValue[0];});

            }else{
                this.stackedPointers = d3.nest()
                    .key(function (d) { return _this.values.stack[d.KEY()]; })
                    .key(function (d) { return _this.values.group[d.KEY()]; })
                    .sortKeys(function(a,b) {return sortGroupKeys[b] - sortGroupKeys[a]; })
                    .sortValues(function (a, b) {return b.sortValue[0] - a.sortValue[0]; })
                    .entries(this.mountainPointers);

                this.mountainPointers.sort(function (a, b) {return b.sortValue[1] - a.sortValue[1];});


                this.stackedPointers.forEach(function (stack) {
                    stack.KEY = function(){return this.key;};
                    stack[_this.model.entities.getDimension()] = stack.key; // hack to get highlihgt and selection work
                    stack.aggrLevel = 2;
                });
            }

            //console.log(JSON.stringify(this.mountainPointers.map(function(m){return m.geo})))
            //console.log(this.stackedPointers)


            //bind the data to DOM elements
            this.mountainsMergeStacked = this.mountainAtomicContainer.selectAll('.vzb-mc-mountain.vzb-mc-aggrlevel2')
                .data(this.stackedPointers);
            this.mountainsMergeGrouped = this.mountainAtomicContainer.selectAll('.vzb-mc-mountain.vzb-mc-aggrlevel1')
                .data(this.groupedPointers);
            this.mountainsAtomic = this.mountainAtomicContainer.selectAll('.vzb-mc-mountain.vzb-mc-aggrlevel0')
                .data(this.mountainPointers);

            //exit selection -- remove shapes
            this.mountainsMergeStacked.exit().remove();
            this.mountainsMergeGrouped.exit().remove();
            this.mountainsAtomic.exit().remove();

            //enter selection -- add shapes
            this.mountainsMergeStacked.enter().append('path')
                .attr('class', 'vzb-mc-mountain vzb-mc-aggrlevel2');
            this.mountainsMergeGrouped.enter().append('path')
                .attr('class', 'vzb-mc-mountain vzb-mc-aggrlevel1');
            this.mountainsAtomic.enter().append('path')
                .attr('class', 'vzb-mc-mountain vzb-mc-aggrlevel0');

            //add interaction
            this.mountains = this.mountainAtomicContainer.selectAll('.vzb-mc-mountain');

            this.mountains
              .on('mousemove', function (d, i) {
                if (utils.isTouchDevice()) return;

                _this._interact()._mousemove(d, i);
              })
              .on('mouseout', function (d, i) {
                if (utils.isTouchDevice()) return;

                _this._interact()._mouseout(d, i);
              })
              .on('click', function (d, i) {
                if (utils.isTouchDevice()) return;

                _this._interact()._click(d, i);
              })
              .onTap(function (d, i) {
                _this._interact()._mouseout(d, i);
                _this._interact()._mousemove(d, i);

                _this.tooltip.classed('vzb-hidden', false)
                  .html(_this.tooltip.html() + '<br>Hold to select it');

                d3.event.stopPropagation();
              })
              .onLongTap(function (d, i) {
                _this._interact()._mouseout(d, i);
                _this._interact()._click(d, i);
                d3.event.stopPropagation();
              })
        },


        _interact: function() {
            var _this = this;

            return {
                _mousemove: function (d, i) {
                    if (_this.model.time.dragging)return;

                    _this.model.entities.highlightEntity(d);

                    var mouse = d3.mouse(_this.graph.node()).map(function (d) { return parseInt(d); });

                    //position tooltip
                    _this._setTooltip(d.key?_this.translator('region/' + d.key):_this.model.marker.label.getValue(d)); 

                },
                _mouseout: function (d, i) {
                    if (_this.model.time.dragging)return;
                    
                    _this._setTooltip("");
                    _this.model.entities.clearHighlighted();
                },
                _click: function (d, i) {
                    _this.model.entities.selectEntity(d);
                }
            };

        },


        /*
         * Highlights all hovered shapes
         */
        highlightEntities: function () {
            var _this = this;
            this.someHighlighted = (this.model.entities.highlight.length > 0);

            if(!this.selectList || !this.someSelected) return;
            this.selectList.classed('vzb-highlight', function(d){return _this.model.entities.isHighlighted(d);});
        },



        selectEntities: function () {
            var _this = this;
            this.someSelected = (this.model.entities.select.length > 0);

            var listData = this.mountainPointers.concat(this.groupedPointers).concat(this.stackedPointers).filter(function(f){
                    return _this.model.entities.isSelected(f);
                })
                .sort(function (a, b) {
                    if(b.yMax && a.yMax) return b.yMax - a.yMax;
                    return b.sortValue[0] - a.sortValue[0];
                });

            this.selectList = this.mountainLabelContainer.selectAll('g')
                .data(utils.unique(listData, function(d){return d.KEY()}));

            this.selectList.exit().remove();
            this.selectList.enter().append('g')
                .attr('class', 'vzb-mc-label')
                .each(function(d, i){
                    d3.select(this).append('circle');
                    d3.select(this).append('text').attr('class', 'vzb-mc-label-shadow');
                    d3.select(this).append('text');
                })
                .on('mousemove', function (d, i) {
                    _this.model.entities.highlightEntity(d);
                })
                .on('mouseout', function (d, i) {
                    _this.model.entities.clearHighlighted();
                })
                .on('click', function (d, i) {
                    _this.model.entities.clearHighlighted();
                    _this.model.entities.selectEntity(d);
                });

        },


        _sumLeafPointersByMarker: function(branch, marker){
            var _this = this;
            if(!branch.key) return _this.values[marker][branch.KEY()];
            return d3.sum( branch.values.map(function(m){
                return _this._sumLeafPointersByMarker(m, marker);
            }) );
        },

        redrawSelectList: function(){
            var _this = this;
            if(!this.selectList || !this.someSelected) return;

            var sample = this.mountainLabelContainer.append('g').attr('class', 'vzb-mc-label').append('text').text('0');
            var fontHeight = sample[0][0].getBBox().height;
            d3.select(sample[0][0].parentNode).remove();
            var formatter = _this.model.marker.axis_y.tickFormatter;
            
            var titleHeight = this.yTitleEl.select('text').node().getBBox().height || 0;
            
            var maxFontHeight = (this.height - titleHeight*3) / (this.selectList.data().length + 2);
            if(fontHeight > maxFontHeight) fontHeight = maxFontHeight;

            this.selectList
                .attr('transform', function(d,i){return 'translate(0,' + (fontHeight*i + titleHeight*3) + ')';})
                .each(function(d, i){

                    var view = d3.select(this);
                    var name = d.key? _this.translator('region/' + d.key) : _this.values.label[d.KEY()];
                    var number = _this.values.axis_y[d.KEY()];

                    var string = name + ': ' + formatter(number) + (i===0?' people':'');

                    view.select('circle')
                        .attr('r', fontHeight/3)
                        .attr('cx', fontHeight*0.4)
                        .attr('cy', fontHeight/1.5)
                        .style('fill', _this.cScale(_this.values.color[d.KEY()]));


                    view.selectAll('text')
                        .attr('x', fontHeight)
                        .attr('y', fontHeight)
                        .text(string)
                        .style('font-size', fontHeight === maxFontHeight? fontHeight : null);
            });
        },

        updateOpacity: function () {
          var _this = this;
          //if(!duration)duration = 0;

          var OPACITY_HIGHLT = 1.0;
          var OPACITY_HIGHLT_DIM = 0.3;
          var OPACITY_SELECT = 1.0;
          var OPACITY_REGULAR = this.model.entities.opacityRegular;
          var OPACITY_SELECT_DIM = this.model.entities.opacitySelectDim;

          this.mountains.style('opacity', function(d){

              if (_this.someHighlighted) {
                //highlight or non-highlight
                if (_this.model.entities.isHighlighted(d)) return OPACITY_HIGHLT;
              }

              if (_this.someSelected) {
                //selected or non-selected
                return _this.model.entities.isSelected(d) ? OPACITY_SELECT : OPACITY_SELECT_DIM;
              }

              if (_this.someHighlighted) return OPACITY_HIGHLT_DIM;

              return OPACITY_REGULAR;

          });
            
          this.mountains.classed('vzb-selected', function(d){return _this.model.entities.isSelected(d)});

          var someSelectedAndOpacityZero = _this.someSelected && _this.model.entities.opacitySelectDim < 0.01;

          // when pointer events need update...
          if (someSelectedAndOpacityZero !== this.someSelectedAndOpacityZero_1) {
            this.mountainsAtomic.style('pointer-events', function (d) {
              return (!someSelectedAndOpacityZero || _this.model.entities.isSelected(d)) ?
                'visible' : 'none';
            });
          }

          this.someSelectedAndOpacityZero_1 = _this.someSelected && _this.model.entities.opacitySelectDim < 0.01;
        },






        /*
         * UPDATE TIME:
         * Ideally should only update when time or data changes
         */
        updateTime: function (time) {
            var _this = this;

            this.time = this.model.time.value;
            if(time==null)time = this.time;
            
            this.yearEl.text(time.getFullYear().toString());
            
            var filter = {};
            filter[_this.TIMEDIM] = time;
            this.values = this.model.marker.getValues(filter, [_this.KEY]);
            this.yMax = 0;


            //spawn the original mountains
            this.mountainPointers.forEach(function (d, i) {
                var vertices = _this._spawn(_this.values, d);
                _this.cached[d.KEY()] = vertices;
                d.hidden = vertices.length===0;
            });


            //recalculate stacking
            if(_this.model.marker.stack.which!=="none"){
                this.stackedPointers.forEach(function (group) {
                    var toStack = [];
                    group.values.forEach(function(subgroup){
                        toStack = toStack.concat(subgroup.values.filter(function(f){return !f.hidden;}));
                    });
                    _this.stack(toStack);
                });
            }

            this.mountainPointers.forEach(function(d){
                d.yMax = d3.max(_this.cached[d.KEY()].map(function(m){return m.y0 + m.y;}));
                if(_this.yMax < d.yMax) _this.yMax = d.yMax;
            });

            var mergeGrouped = _this.model.marker.group.merge;
            var mergeStacked = _this.model.marker.stack.merge;
            var dragOrPlay = (_this.model.time.dragging || _this.model.time.playing) && this.model.marker.stack.which!=='none';

            //if(mergeStacked){
                this.stackedPointers.forEach(function (d) {
                    var firstLast = _this._getFirstLastPointersInStack(d);
                    _this.cached[d.key] = _this._getVerticesOfaMergedShape(firstLast);
                    _this.values.color[d.key] = '_default';
                    _this.values.axis_y[d.key] = _this._sumLeafPointersByMarker(d, "axis_y");
                    d.yMax = firstLast.first.yMax;
                });
            //} else if (mergeGrouped || dragOrPlay){
                this.groupedPointers.forEach(function (d) {
                    var firstLast = _this._getFirstLastPointersInStack(d);
                    _this.cached[d.key] = _this._getVerticesOfaMergedShape(firstLast);
                    _this.values.color[d.key] = _this.values.color[firstLast.first.KEY()];
                    _this.values.axis_y[d.key] = _this._sumLeafPointersByMarker(d, "axis_y");
                    d.yMax = firstLast.first.yMax;
                });
            //}

            if(!mergeStacked && !mergeGrouped && this.model.marker.stack.use==='property'){
                this.groupedPointers.forEach(function (d) {
                    var visible = d.values.filter(function(f){return !f.hidden;});
                    d.yMax = visible[0].yMax;
                    d.values.forEach(function(e){e.yMaxGroup = d.yMax;});
                });
            }


        },



        _getFirstLastPointersInStack: function(group){
            var _this = this;

            var visible, visible2;

            if(group.values[0].values){
                visible = group.values[0].values.filter(function(f){return !f.hidden;});
                visible2 = group.values[group.values.length-1].values.filter(function(f){return !f.hidden;});
                var first = visible[0];
                var last = visible2[visible2.length-1];
            }else{
                visible = group.values.filter(function(f){return !f.hidden;});
                var first = visible[0];
                var last = visible[visible.length-1];
            }

            return {first: first, last: last};
        },

        _getVerticesOfaMergedShape: function(arg){
            var _this = this;

            var first = arg.first.KEY();
            var last = arg.last.KEY();

            return _this.mesh.map(function(m, i){
                var y = _this.cached[first][i].y0 + _this.cached[first][i].y - _this.cached[last][i].y0;
                var y0 = _this.cached[last][i].y0;
                return { x: m, y0: y0, y: y};
            });
        },





        /**
         * Executes everytime the container or vizabi is resized
         * Ideally,it contains only operations related to size
         */
        updateSize: function (meshLength) {

            var margin;
            var padding = 2;

            switch (this.getLayoutProfile()) {
            case 'small':
                margin = { top: 10, right: 10, left: 10, bottom: 25 };
                break;
            case 'medium':
                margin = { top: 20, right: 20, left: 20, bottom: 30 };
                break;
            case 'large':
                margin = { top: 30, right: 30, left: 30, bottom: 35  };
                break;
            }

            //mesure width and height
            this.height = parseInt(this.element.style('height'), 10) - margin.top - margin.bottom;
            this.width = parseInt(this.element.style('width'), 10) - margin.left - margin.right;

            //graph group is shifted according to margins (while svg element is at 100 by 100%)
            this.graph.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            //year is centered and resized
            this.yearEl
                .attr('x', this.width / 2)
                .attr('y', this.height / 3 * 1.5)
                .style('font-size', Math.max(this.height / 4, this.width / 4) + 'px');

            //update scales to the new range
            this.yScale.range([this.height, 0]);
            this.xScale.range([0, this.width]);

            //need to know scale type of X to move on
            var scaleType = this._readyOnce? this.model.marker.axis_x.scaleType : 'log';

            //axis is updated
            this.xAxis.scale(this.xScale)
                .orient('bottom')
                .tickSize(6, 0)
                .tickSizeMinor(3, 0)
                .labelerOptions({
                    scaleType: scaleType,
                    toolMargin: margin,
                    method: this.xAxis.METHOD_REPEATING,
                    stops: this._readyOnce? this.model.time.xLogStops : [1]
                });


            this.xAxisEl
                .attr('transform', 'translate(0,' + this.height + ')')
                .call(this.xAxis);
            
            this.xTitleEl.select('text')
                .attr('transform', 'translate(' + this.width + ',' + this.height + ')')
                .attr('dy', '-0.36em');
            
            this.yTitleEl.select('text')
                .attr('transform', 'translate(0,' + margin.top + ')')
            
            
            var warnBB = this.dataWarningEl.select("text").node().getBBox();
            this.dataWarningEl.select("svg")
                .attr("width", warnBB.height)
                .attr("height", warnBB.height)
                .attr("x", warnBB.height * 0.1)
                .attr("y", -warnBB.height * 1.0 + 1)

            this.dataWarningEl
                .attr("transform", "translate(" + (0) + "," + (margin.top + warnBB.height * 1.5) + ")")
                .select("text")
                .attr("dx", warnBB.height*1.5);
            
            if(this.infoEl.select('text').node()){
                var titleH = this.infoEl.select('text').node().getBBox().height || 0;
                var titleW = this.yTitleEl.select('text').node().getBBox().width || 0;
                this.infoEl.attr('transform', 'translate('+ (titleW + titleH * 1.0) +',' + (margin.top - titleH * 0.3) + ')');
                this.infoEl.select("text").attr("dy", "0.1em")
                this.infoEl.select("circle").attr("r", titleH/2);
            }
                
            this.eventAreaEl
                .attr('y', this.height)
                .attr('width', this.width)
                .attr('height', margin.bottom);

            this._generateMesh(meshLength, scaleType);
        },

        _generateMesh: function(length, scaleType){
            // we need to generate the distributions based on mu, variance and scale
            // we span a uniform mesh across the entire X scale,
            if(!length) length = this.model.time.xPoints;

            var rangeFrom = scaleType === 'linear' ? this.xScale.domain()[0] : Math.log(this.unscale(this.xScale.domain()[0]));
            var rangeTo = scaleType === 'linear' ? this.xScale.domain()[1] : Math.log(this.unscale(this.xScale.domain()[1]));
            var rangeStep = (rangeTo - rangeFrom) / length;
            this.mesh = d3.range(rangeFrom, rangeTo, rangeStep).concat(rangeTo);

            if (scaleType !== 'linear') {
                this.mesh = this.mesh.map(function (dX) {return Math.exp(dX);});
            }else{
                this.mesh = this.mesh.filter(function (dX) {return dX > 0;});
            }

            return this.mesh;
        },

        _spawnMasks: function(){
            var _this = this;

            var povertyline = this.unscale(this.model.time.povertyline);
            var cutoff = this.unscale(this.model.time.povertyCutoff);
            var fade = this.model.time.povertyFade;
            var k = 2*Math.PI/(Math.log(povertyline)-Math.log(cutoff));
            var m = Math.PI - Math.log(povertyline) * k;


            this.spawnMask = [];
            this.cosineShape = [];
            this.cosineArea = 0;

            this.mesh.map(function (dX,i) {
                _this.spawnMask[i] = dX<cutoff?1:(dX>fade*7?0:Math.exp((cutoff-dX)/fade))
                _this.cosineShape[i] = (dX>cutoff && dX<povertyline? (1+Math.cos(Math.log(dX)*k+m)) : 0 );
                _this.cosineArea += _this.cosineShape[i];
            });
        },


        // get Y value for every X
        _spawn: function (values, d) {
            var _this = this;

            var norm = values.axis_y[d.KEY()];
            var sigma = _this._math.giniToSigma(values.size[d.KEY()]);
            var mu = _this._math.gdpToMu(values.axis_x[d.KEY()], sigma);

            if (!norm || !mu || !sigma) return [];

            var distribution = [];
            var acc = 0;

            this.mesh.map(function (dX,i) {
                distribution[i] = _this._math.pdf.lognormal(dX, mu, sigma);
                acc += _this.spawnMask[i] * distribution[i];
            });

            var result = this.mesh.map(function (dX, i) {
                return {x: dX, y0: 0,
                    y: norm * (distribution[i] * (1 - _this.spawnMask[i]) + _this.cosineShape[i]/_this.cosineArea * acc)
                }
            });

            return result;
        },


        _adjustMaxY: function(options){
            if(!options) options = {};
            var _this = this;
            var method = this.model.time.yMaxMethod;

            if(method!=='immediate' && !options.force) return;

            if(method==='latest') _this.updateTime(_this.model.time.end);

            if(!_this.yMax)utils.warn('Setting yMax to ' + _this.yMax + '. You failed again :-/');
            this.yScale.domain([0, _this.yMax]);

            if(method==='latest') _this.updateTime();
        },


        updatePovertyLine: function(options){
            var _this = this;
            if(!options)options = {};

            if(!options.level) options.level = this.model.time.povertyline;

            this.povertylineEl.classed('vzb-hidden', !options.level);
            if(!options.level) return;

            this.xAxisEl.call(this.xAxis.highlightValue(options.full? options.level : 'none'));

            var sumValue = 0;
            var totalArea = 0;
            var leftArea = 0;

            var _computeAreas = function(d) {
                sumValue += _this.values.axis_y[d.KEY()];
                _this.cached[d.KEY()].forEach(function(d){
                    totalArea += d.y;
                    if(_this.rescale(d.x)<options.level)leftArea += d.y;
                })
            };

            if(this.model.marker.stack.which==="all"){
                this.stackedPointers.forEach(_computeAreas);
            }else if(this.model.marker.stack.which==="none"){
                this.mountainPointers.forEach(_computeAreas);
            }else{
                this.groupedPointers.forEach(_computeAreas);
            }

            var formatter1 = d3.format('.3r');
            var formatter2 = _this.model.marker.axis_y.tickFormatter;
            this.heightOfLabels = this.heightOfLabels || (0.66 * this.height);
            
            this.povertylineTextEl.each(function(d,i){
                if(i!==8) return;
                var view = d3.select(this);
                
                view.text(_this.translator('mount/extremepoverty'))
                    .classed('vzb-hidden', options.full)
                    .attr('x',-_this.height)
                    .attr('y',_this.xScale(options.level))
                    .attr('dy', "-1em")
                    .attr('dx', "0.5em")
                    .attr("transform", "rotate(-90)"); 
                
                if (!options.full){
                    _this.heightOfLabels = _this.height - view.node().getBBox().width - view.node().getBBox().height * 2;
                }
            });


            this.povertylineTextEl.each(function(d,i){
                if(i===8) return;
                var view = d3.select(this);

                var string;
                if(i===0 || i===4) string = formatter1(leftArea/totalArea*100) + '%';
                if(i===1 || i===5) string = formatter1(100-leftArea/totalArea*100) + '%';
                if(i===2 || i===6) string = formatter2(sumValue * leftArea / totalArea);
                if(i===3 || i===7) string = formatter2(sumValue * (1 - leftArea / totalArea)) + ' ' + _this.translator('mount/people');

                view.text(string)
                    .classed('vzb-hidden', !options.full && i!==0 && i!==4)
                    .attr('x',_this.xScale(options.level) + ([0,4,2,6].indexOf(i)>-1? -5:+5))
                    .attr('y', _this.heightOfLabels)
                    .attr('dy', [0,1,4,5].indexOf(i)>-1 ? 0 : '1.5em');
            });
            
            
            this.povertylineLineEl
                .attr('x1',this.xScale(options.level))
                .attr('x2',this.xScale(options.level))
                .attr('y1',this.height + 6)
                .attr('y2',0);

            //if(this.model.time.record) console.log(this.model.time.value.getFullYear() + ', ' + leftArea/totalArea*100);

        },


        /*
         * REDRAW DATA POINTS:
         * Here plotting happens
         */
        redrawDataPoints: function () {
            var _this = this;
            var mergeGrouped = _this.model.marker.group.merge;
            var mergeStacked = _this.model.marker.stack.merge;
            var dragOrPlay = (_this.model.time.dragging || _this.model.time.playing) && this.model.marker.stack.which!=='none';
            var stackMode = _this.model.marker.stack.which;

            //var speed = this.model.time.speed;
            this._adjustMaxY();

            this.mountainsMergeStacked.each(function (d) {
                var view = d3.select(this);
                var hidden = !mergeStacked;
                _this._renderShape(view, d.KEY(), hidden);
            })

            this.mountainsMergeGrouped.each(function (d) {
                var view = d3.select(this);
                var hidden = (!mergeGrouped && !dragOrPlay) || (mergeStacked && !_this.model.entities.isSelected(d));
                _this._renderShape(view, d.KEY(), hidden);
            });

            this.mountainsAtomic.each(function (d, i) {
                var view = d3.select(this);
                var hidden = d.hidden || ((mergeGrouped || mergeStacked || dragOrPlay) && !_this.model.entities.isSelected(d));
                _this._renderShape(view, d.KEY(), hidden);
            })

            if(stackMode === 'none'){
                this.mountainsAtomic.sort(function(a,b){return b.yMax - a.yMax;});

            }else if(stackMode === 'all'){
                // do nothing if everything is stacked

            }else{
                if(mergeGrouped || dragOrPlay){
                    this.mountainsMergeGrouped.sort(function(a,b){return b.yMax - a.yMax;});
                }else{
                    this.mountainsAtomic.sort(function(a,b){return b.yMaxGroup - a.yMaxGroup;});
                }
            }


//            if (!this.shapes) this.shapes = {}
//            this.shapes[this.model.time.value.getFullYear()] = {
//                yMax: d3.format('.2e')(_this.yMax),
//                shape: _this.cached['all'].map(function (d) {return d3.format('.2e')(d.y);})
//            }

        },


        /*
         * REDRAW DATA POINTS:
         * Here plotting happens
         */
        redrawDataPointsOnlyColors: function () {
            var _this = this;
            this.mountains.style('fill', function(d){ return _this.cScale(_this.values.color[d.KEY()]); });
        },

        /*
         * RENDER SHAPE:
         * Helper function for plotting
         */
        _renderShape: function(view, key, hidden){
            var stack = this.model.marker.stack.which;

            view.classed('vzb-hidden', hidden);

            if(hidden){
                if(stack !== "none") view.style('stroke-opacity', 0);
                return;
            }

            if(this.model.entities.isSelected({geo: key})){
                view.attr('d', this.area(this.cached[key].filter(function(f){return f.y>1000000}) ));
            }else{
                view.attr('d', this.area(this.cached[key]));
            }

            if(this.model.marker.color.use==="indicator") view
                .style('fill', this.cScale(this.values.color[key]));

            if(stack !== "none") view
                .transition().duration(Math.random()*900 + 100).ease('circle')
                .style('stroke-opacity', 0.5);

            if(this.model.time.record) this._export.write({type: 'path', id: key, time: this.model.time.value.getFullYear(), fill: this.cScale(this.values.color[key]), d: this.area(this.cached[key]) });
        },
        
        
    _setTooltip: function (tooltipText, x, y) {
      if (tooltipText) {
        var mouse = d3.mouse(this.graph.node()).map(function (d) {return parseInt(d)});

        //position tooltip
        this.tooltip.classed("vzb-hidden", false)
          //.attr("style", "left:" + (mouse[0] + 50) + "px;top:" + (mouse[1] + 50) + "px")
          .attr("transform", "translate(" + (x?x:mouse[0]-15) + "," + (y?y:mouse[1]-15) + ")")
          .selectAll("text")
          .text(tooltipText);

        var contentBBox = this.tooltip.select('text')[0][0].getBBox();
        this.tooltip.select('rect').attr("width", contentBBox.width + 8)
                .attr("height", contentBBox.height + 8)
                .attr("x", -contentBBox.width -4)
                .attr("y", -contentBBox.height -1)
                .attr("rx", contentBBox.height * 0.2)
                .attr("ry", contentBBox.height * 0.2);

      } else {

        this.tooltip.classed("vzb-hidden", true);
      }
    }




    });


}).call(this);

(function () {

    var Vizabi = this.Vizabi;
    var utils = Vizabi.utils;

    Vizabi.Helper.extend("gapminder-mountainchart-math", {

        init: function (context) {
            this.context = context;
        },

        
        gdpToMu: function(gdp, sigma, gdpFactor, gdpShift){
            // converting gdp per capita per day into MU for lognormal distribution
            // see https://en.wikipedia.org/wiki/Log-normal_distribution
            return Math.log(gdp/365) - sigma*sigma/2;
        },
        
        giniToSigma: function (gini) {
            //The ginis are turned into std deviation. Mattias uses this formula in Excel: stddev = NORMSINV( ((gini/100)+1)/2 )*2^0.5
            return this.normsinv( ( (gini / 100) + 1 ) / 2 ) * Math.pow(2,0.5);
        },
        
                         
        // this function returns PDF values for a specified distribution
        pdf: {
            normal: function(x, mu, sigma){
                return Math.exp(
                    - 0.5 * Math.log(2 * Math.PI)
                    - Math.log(sigma)
                    - Math.pow(x - mu, 2) / (2 * sigma * sigma)
                    );
            },
            lognormal: function(x, mu, sigma){
                return Math.exp(
                    - 0.5 * Math.log(2 * Math.PI) //should not be different for the two scales- (scaleType=="linear"?Math.log(x):0)
                    - Math.log(sigma)
                    - Math.pow(Math.log(x) - mu, 2) / (2 * sigma * sigma)
                );
            }
        },

        
        normsinv: function (p) {
            //
            // Lower tail quantile for standard normal distribution function.
            //
            // This function returns an approximation of the inverse cumulative
            // standard normal distribution function.  I.e., given P, it returns
            // an approximation to the X satisfying P = Pr{Z <= X} where Z is a
            // random variable from the standard normal distribution.
            //
            // The algorithm uses a minimax approximation by rational functions
            // and the result has a relative error whose absolute value is less
            // than 1.15e-9.
            //
            // Author:      Peter John Acklam
            // (Javascript version by Alankar Misra @ Digital Sutras (alankar@digitalsutras.com))
            // Time-stamp:  2003-05-05 05:15:14
            // E-mail:      pjacklam@online.no
            // WWW URL:     http://home.online.no/~pjacklam
            
            // Taken from http://home.online.no/~pjacklam/notes/invnorm/index.html
            // adapted from Java code
            
            // An algorithm with a relative error less than 1.15*10-9 in the entire region.

            // Coefficients in rational approximations
            var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
            var b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
            var c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
            var d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];

            // Define break-points.
            var plow = 0.02425;
            var phigh = 1 - plow;

            // Rational approximation for lower region:
            if (p < plow) {
                var q = Math.sqrt(-2 * Math.log(p));
                return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
                    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
            }

            // Rational approximation for upper region:
            if (phigh < p) {
                var q = Math.sqrt(-2 * Math.log(1 - p));
                return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
                    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
            }

            // Rational approximation for central region:
            var q = p - 0.5;
            var r = q * q;
            return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
                (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);

        }



    });


}).call(this);
/*!
 * VIZABI MOUNTAINCHART
 */

(function () {

    "use strict";

    var Vizabi = this.Vizabi;
    var utils = Vizabi.utils;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) return;

    //MOUNTAIN CHART TOOL
    var MountainChart = Vizabi.Tool.extend('MountainChart', {

        /**
         * Initializes the tool (Bar Chart Tool).
         * Executed once before any template is rendered.
         * @param {Object} config Initial config, with name and placeholder
         * @param {Object} options Options such as state, data, etc
         */
        init: function (config, options) {

            this.name = "mountainchart";

            //specifying components
            this.components = [{
                component: 'gapminder-mountainchart',
                placeholder: '.vzb-tool-viz',
                model: ["state.time", "state.entities", "state.marker", "language"] //pass models to component
            }, {
                component: 'gapminder-timeslider',
                placeholder: '.vzb-tool-timeslider',
                model: ["state.time"]
            }, {
                component: 'gapminder-buttonlist',
                placeholder: '.vzb-tool-buttonlist',
                model: ['state', 'ui', 'language']
            },{
                component: 'gapminder-datawarning',
                placeholder: '.vzb-tool-datawarning',
                model: ['language']
            }];

            //constructor is the same as any tool
            this._super(config, options);
        }
    });

}).call(this);
/*!
 * VIZABI POP BY AGE Component
 */

(function () {

  "use strict";

  var Vizabi = this.Vizabi;
  var utils = Vizabi.utils;

  //warn client if d3 is not defined
  if (!Vizabi._require('d3')) return;

  //POP BY AGE CHART COMPONENT
  Vizabi.Component.extend('gapminder-popbyage', {

    /**
     * Initializes the component (Bar Chart).
     * Executed once before any template is rendered.
     * @param {Object} config The options passed to the component
     * @param {Object} context The component's parent
     */
    init: function (config, context) {
      this.name = 'popbyage';
      this.template = 'src/tools/popbyage/popbyage.html';

      //define expected models for this component
      this.model_expects = [{
        name: "time",
        type: "time"
      }, {
        name: "entities",
        type: "entities"
      }, {
        name: "age",
        type: "entities"
      },{
        name: "marker",
        type: "model"
      }, {
        name: "language",
        type: "language"
      }];

      var _this = this;
      this.model_binds = {
        "change:time:value": function (evt) {
          _this._updateEntities();
        },
      "change:entities:needUpdate": function (evt) {
        _this._updateEntities();
        },
        "change:entities:show": function (evt) {
          console.log('Trying to change show');
        },
        "change:age:select": function (evt) {
          _this._selectBars();
        }
      };

      //contructor is the same as any component
      this._super(config, context);

      this.xScale = null;
      this.yScale = null;
      this.cScale = d3.scale.category10();

      this.xAxis = d3.svg.axisSmart();
      this.yAxis = d3.svg.axisSmart();
    },

    /**
     * DOM is ready
     */
    readyOnce: function () {

      this.element = d3.select(this.element);

      this.graph = this.element.select('.vzb-bc-graph');
      this.yAxisEl = this.graph.select('.vzb-bc-axis-y');
      this.xAxisEl = this.graph.select('.vzb-bc-axis-x');
      this.yTitleEl = this.graph.select('.vzb-bc-axis-y-title');
      this.bars = this.graph.select('.vzb-bc-bars');
      this.labels = this.graph.select('.vzb-bc-labels');

      this.title = this.element.select('.vzb-bc-title');
      this.year = this.element.select('.vzb-bc-year');

      //only allow selecting one at a time
      this.model.age.selectMultiple(true);

      var _this = this;
      this.on("resize", function () {
        _this._updateEntities();
      });
    },

    /*
     * Both model and DOM are ready
     */
    ready: function () {

      this.AGEDIM = this.model.age.getDimension();
      this.TIMEDIM = this.model.time.getDimension();

      this.timeFormatter = d3.time.format(this.model.time.formatOutput);

      this.updateUIStrings();
      this._updateIndicators();
      this.resize();
      this._updateEntities();
      this._updateEntities();
    },

    updateUIStrings: function(){
      this.translator = this.model.language.getTFunction();

      var titleStringY = this.translator("indicator/" + this.model.marker.axis_y.which);

      var yTitle = this.yTitleEl.selectAll("text").data([0]);
      yTitle.enter().append("text");
      yTitle
        .attr("y", "-6px")
        .attr("x", "-9px")
        .attr("dx", "-0.72em")
        .text(titleStringY);
    },

    /**
     * Changes labels for indicators
     */
    _updateIndicators: function () {
      var _this = this;
      this.duration = this.model.time.speed;

      this.yScale = this.model.marker.axis_y.getScale({max: true});
      this.xScale = this.model.marker.axis_x.getScale(false);
      this.cScale = this.model.marker.color.getScale();

      this.yAxis.tickFormat(_this.model.marker.axis_y.tickFormatter);
      this.xAxis.tickFormat(_this.model.marker.axis_x.tickFormatter);
    },

    /**
     * Updates entities
     */
    _updateEntities: function () {

      var _this = this;
      var time = this.model.time;
      var timeFormatter = d3.time.format(this.model.time.formatInput);
      var ageDim = this.AGEDIM;
      var timeDim = this.TIMEDIM;
      var duration = (time.playing) ? time.speed : 0;
      var filter = {};
      filter[timeDim] = time.value;
      var items = this.model.marker.getKeys(filter);
      var values = this.model.marker.getValues(filter, [ageDim]);

      //TODO: this should be done at a data layer
      //Year Grouping

      var test = function(d) {
        return parseInt(d, 10) % group_by === 1;
      }

      var group_by = this.model.marker.group_by;
      if(group_by > 1) {
        items = items.filter(function(d) {
          return test(d[ageDim]);
        });

        var new_values = {};
        utils.forEach(values, function(hook, hook_name) {
          new_values[hook_name] = {};
          var hook_values = new_values[hook_name];
          var curr = false;
          utils.forEach(hook, function(val, key) {
            if(test(key) || curr === false) {
              curr = key;
              hook_values[curr] = val;
            }
            //if it's a number and axis x
            if(!utils.isNaN(val) && hook_name === "axis_x") {
              hook_values[curr] = parseFloat(hook_values[curr]) + parseFloat(val);
            }
          });

        });

        values = new_values;

      }

      //End Year Grouping

      this.model.age.setVisible(items);

      this.entityBars = this.bars.selectAll('.vzb-bc-bar')
        .data(items);

      this.entityLabels = this.labels.selectAll('.vzb-bc-label')
        .data(items);

      //exit selection
      this.entityBars.exit().remove();
      this.entityLabels.exit().remove();

      var highlight = this._highlightBar.bind(this);
      var unhighlight = this._unhighlightBars.bind(this)

      //enter selection -- init bars
      this.entityBars.enter().append("g")
          .attr("class", "vzb-bc-bar")
          .attr("id", function(d) {
            return  "vzb-bc-bar-"+d[ageDim];
          })
          .on("mousemove", highlight)
          .on("mouseout", unhighlight)
          .on("click", function (d, i) {
            _this.model.age.selectEntity(d);
          })
          .append('rect');

      this.entityLabels.enter().append("g")
          .attr("class", "vzb-bc-label")
          .attr("id", function(d) {
            return  "vzb-bc-label-"+d[ageDim];
          })
          .on("mousemove", highlight)
          .on("mouseout", unhighlight)
          .append('text')
          .attr("class", "vzb-bc-age");


      this.barHeight = this.height / items.length;
      
      this.bars.selectAll('.vzb-bc-bar > rect')
        .attr("fill", function (d) {
           return   _this._temporaryBarsColorAdapter(values, d, ageDim);
      //    return _this.cScale(values.color[d[ageDim]]);
        })
        .style("stroke", function (d) {
              return   _this._temporaryBarsColorAdapter(values, d, ageDim);
         // return _this.cScale(values.color[d[ageDim]]);
        })
        .attr("x", 0)
        .transition().duration(duration).ease("linear")
        .attr("y", function (d) {
          return _this.yScale(values.axis_y[d[ageDim]]) - _this.barHeight;
        })
        .attr("height", this.barHeight)
        .attr("width", function (d) {
          return _this.xScale(values.axis_x[d[ageDim]]);
        });

      this.labels.selectAll('.vzb-bc-label > .vzb-bc-age')
               .text(function(d) {
                  var formatter = _this.model.marker.axis_x.tickFormatter;
                  var yearOldsIn = _this.translator("popbyage/yearOldsIn");

                  var age = parseInt(values.axis_y[d[ageDim]],10);

                  if(group_by > 1) {
                    age = age + "-to-" + (age + group_by - 1);
                  }

                  return age + yearOldsIn+" "+timeFormatter(time.value) + ": "+formatter(values.axis_x[d[ageDim]]);
               })
               .attr("x", 7)
               .attr("y", function (d) {
                  return _this.yScale(values.axis_y[d[ageDim]]) - _this.barHeight - 10;
               })
               .style("fill", function (d) {
                  var color = _this.cScale(values.color[d[ageDim]]);
                  return d3.rgb(color).darker(2);
               });

      var label = utils.values(values.label_name).reverse()[0]; //get last name

      //TODO: remove hack
      label = label === "usa" ? "United States" : "Sweden";

      this.title.text(label);

      this.year.text(this.timeFormatter(this.model.time.value));

      //update x axis again
      //TODO: remove this when grouping is done at data level
      var x_domain = this.xScale.domain();
      var x_domain_max = Math.max.apply(null, utils.values(values.axis_x));
      this.xScale = this.xScale.domain([x_domain[0], x_domain_max]);
      this.resize();

    },

      _temporaryBarsColorAdapter : function(values, d, ageDim){
          // I don't know how work color transformation, ( 160: var values = this.model.marker.getValues(filter, [ageDim]);)
          // but if we use linear color scale then all colors equals null
          // values.color is array of null

          return this.model.marker.color.scaleType != 'time' ? this.cScale(d[ageDim]) :  this.cScale(values.color[d[ageDim]]);
      },

    /**
     * Highlight and unhighlight labels
     */
    _unhighlightBars: function() {
      this.bars.classed('vzb-dimmed', false);
      this.bars.selectAll('.vzb-bc-bar.vzb-hovered').classed('vzb-hovered', false);
      this.labels.selectAll('.vzb-hovered').classed('vzb-hovered', false);
    },

    _highlightBar: function(d) {
      this.bars.classed('vzb-dimmed', true);
      var curr =  this.bars.select("#vzb-bc-bar-"+d[this.AGEDIM]);
      curr.classed('vzb-hovered', true);
      var label = this.labels.select("#vzb-bc-label-"+d[this.AGEDIM]);
      label.classed('vzb-hovered', true);
    },

    /**
     * Select Entities
     */
    _selectBars: function() {
      var _this = this;
      var AGEDIM = this.AGEDIM;
      var selected = this.model.age.select;

      this._unselectBars();

      if(selected.length) {
        this.bars.classed('vzb-dimmed-selected', true);
        utils.forEach(selected, function(s) {
          _this.bars.select("#vzb-bc-bar-"+s[AGEDIM]).classed('vzb-selected', true);
          _this.labels.select("#vzb-bc-label-"+s[AGEDIM]).classed('vzb-selected', true);
        });
      }
    },

    _unselectBars: function() {
      this.bars.classed('vzb-dimmed-selected', false);
      this.bars.selectAll('.vzb-bc-bar.vzb-selected').classed('vzb-selected', false);
      this.labels.selectAll('.vzb-selected').classed('vzb-selected', false);
    },

    /**
     * Executes everytime the container or vizabi is resized
     * Ideally,it contains only operations related to size
     */
    resize: function () {

      var _this = this;

      this.profiles = {
        "small": {
          margin: {
            top: 70,
            right: 20,
            left: 40,
            bottom: 40
          },
          minRadius: 2,
          maxRadius: 40
        },
        "medium": {
          margin: {
            top: 80,
            right: 60,
            left: 60,
            bottom: 40
          },
          minRadius: 3,
          maxRadius: 60
        },
        "large": {
          margin: {
            top: 100,
            right: 60,
            left: 60,
            bottom: 40
          },
          minRadius: 4,
          maxRadius: 80
        }
      };

      this.activeProfile = this.profiles[this.getLayoutProfile()];
      var margin = this.activeProfile.margin;


      //stage
      this.height = parseInt(this.element.style("height"), 10) - margin.top - margin.bottom;
      this.width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;

      this.graph
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      //update scales to the new range
      if (this.model.marker.axis_y.scaleType !== "ordinal") {
        this.yScale.range([this.height, 0]);
      } else {
        this.yScale.rangePoints([this.height, 0]).range();
      }
      if (this.model.marker.axis_x.scaleType !== "ordinal") {
        this.xScale.range([0, this.width]);
      } else {
        this.xScale.rangePoints([0, this.width]).range();
      }

      //apply scales to axes and redraw
      this.yAxis.scale(this.yScale)
        .orient("left")
        .tickSize(6, 6)
        .tickSizeMinor(3, 0)
        .labelerOptions({
          scaleType: this.model.marker.axis_y.scaleType,
          toolMargin: margin,
          limitMaxTickNumber: 6
        });

      this.xAxis.scale(this.xScale)
        .orient("bottom")
        .tickSize(6, 0)
        .tickSizeMinor(3, 0)
        .labelerOptions({
          scaleType: this.model.marker.axis_x.scaleType,
          toolMargin: margin,
          limitMaxTickNumber: 6
        });

      this.xAxisEl.attr("transform", "translate(0," + this.height + ")")
        .call(this.xAxis);

      this.yAxisEl.call(this.yAxis);
      this.xAxisEl.call(this.xAxis);

      this.title.attr('x', margin.right).attr('y', margin.top/2);

      this.year.attr('x', this.width + margin.left).attr('y', margin.top/2);

      // fix tick labels position
      this.yAxisEl.selectAll('g[class="tick"]')
        .attr('transform', function (d) {
          var yPos = _this.yScale(d) - _this.barHeight / 2;
          if (isNaN(yPos))
            yPos = 0;
          return 'translate(0,' + yPos +')';
        });

    }
  });


}).call(this);

/*!
 * VIZABI BARCHART
 */

(function () {

  "use strict";

  var Vizabi = this.Vizabi;
  var utils = Vizabi.utils;

  //warn client if d3 is not defined
  if (!Vizabi._require('d3')) return;

  //BAR CHART TOOL
  var PopByAge = Vizabi.Tool.extend('PopByAge', {

    /**
     * Initializes the tool (Bar Chart Tool).
     * Executed once before any template is rendered.
     * @param {Object} config Initial config, with name and placeholder
     * @param {Object} options Options such as state, data, etc
     */
    init: function (config, options) {

      this.name = "popbyage";

      //specifying components
      this.components = [{
        component: 'gapminder-popbyage',
        placeholder: '.vzb-tool-viz',
        model: ["state.time", "state.entities", "state.entities_age", "state.marker", "language"] //pass models to component
      }, {
        component: 'gapminder-timeslider',
        placeholder: '.vzb-tool-timeslider',
        model: ["state.time"]
      }, {
        component: 'gapminder-buttonlist',
        placeholder: '.vzb-tool-buttonlist',
        model: ['state', 'ui', 'language']
      }];

      //constructor is the same as any tool
      this._super(config, options);
    },

    /**
     * Validating the tool model
     * @param model the current tool model to be validated
     */
    validate: function (model) {

      model = this.model || model;

      var time = model.state.time;
      var marker = model.state.marker.label;

      //don't validate anything if data hasn't been loaded
      if (!marker.getKeys() || marker.getKeys().length < 1) {
        return;
      }

      var dateMin = marker.getLimits(time.getDimension()).min;
      var dateMax = marker.getLimits(time.getDimension()).max;

      if (time.start < dateMin) {
        time.start = dateMin;
      }
      if (time.end > dateMax) {
        time.end = dateMax;
      }
    }
  });


}).call(this);

(function() {

    "use strict";

    var root = this;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) {
        return;
    }

    d3.svg.axisSmart = function(){
        
    return function d3_axis_smart(_super) {
        
        var VERTICAL = 'vertical axis';
        var HORIZONTAL = 'horizontal axis';
        var X = 'labels stack side by side';
        var Y = 'labels stack top to bottom';
        
        var OPTIMISTIC = 'optimistic approximation: labels have different lengths';
        var PESSIMISTIC = 'pessimistic approximation: all labels have the largest length';
        var DEFAULT_LOGBASE = 10;
        
        function onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
        }

        function axis(g) {
            if(highlightValue!=null){axis.highlightValueRun(g); return;}
            
            // measure the width and height of one digit
            var widthSampleG = g.append("g").attr("class","tick widthSampling");
            var widthSampleT = widthSampleG.append('text').text('0');
            
            options.cssMarginTop = widthSampleT.style("margin-top");
            options.cssMarginBottom = widthSampleT.style("margin-bottom");
            options.cssMarginLeft = widthSampleT.style("margin-left");
            options.cssMarginRight = widthSampleT.style("margin-right");
            options.widthOfOneDigit = widthSampleT[0][0].getBBox().width;
            options.heightOfOneDigit = widthSampleT[0][0].getBBox().height;
            widthSampleG.remove();
            
            
            // run label factory - it will store labels in tickValues property of axis
            axis.labelFactory(options);
            
            //if(axis.orient()=="bottom") console.log("ordered", axis.tickValues())
            // construct the view (d3 constructor is used)
            if(options.transitionDuration>0){
                _super(g.transition().duration(options.transitionDuration));
            }else{
                _super(g);
            }
            //if(axis.orient()=="bottom") console.log("received", g.selectAll("text").each(function(d){console.log(d)}))
            
            var orient = axis.orient()=="top"||axis.orient()=="bottom"?HORIZONTAL:VERTICAL;
            var dimension = (orient==HORIZONTAL && axis.pivot() || orient==VERTICAL && !axis.pivot())?Y:X;

            g.selectAll('.vzb-axis-value')
                .data([null])
                .enter().append('g')
                .attr("class",'vzb-axis-value')
                .append("text")
                .style("opacity",0);
            
            // patch the label positioning after the view is generated
            g.selectAll("text")
                .each(function(d,i){
                    var view = d3.select(this);
                
                    if(axis.pivot() == null) return;
                    view.attr("transform","rotate("+(axis.pivot()?-90:0)+")");
                    view.style("text-anchor", dimension==X?"middle":"end");
                    view.attr("x",  dimension==X?0:(-axis.tickPadding() - axis.tickSize()));
                    view.attr("y", dimension==X? (orient==VERTICAL?-1:1)*(axis.tickPadding() + axis.tickSize()):0);
                    view.attr("dy", dimension==X?(orient==VERTICAL?0:".72em"):".32em");
                    
                    if(axis.repositionLabels() == null) return;
                    var shift = axis.repositionLabels()[i] || {x:0, y:0}; 
                    view.attr("x",+view.attr("x") + shift.x);
                    view.attr("y",+view.attr("y") + shift.y);
                })
            
            if (axis.tickValuesMinor()==null) axis.tickValuesMinor([]);
                // add minor ticks
                var minorTicks = g.selectAll(".tickMinor").data(tickValuesMinor);
                minorTicks.exit().remove();
                minorTicks.enter().append("line")
                    .attr("class", "tickMinor");

                var tickLengthOut = axis.tickSizeMinor().outbound;
                var tickLengthIn = axis.tickSizeMinor().inbound;
                var scale = axis.scale();
                minorTicks
                    .attr("y1", orient==HORIZONTAL? (axis.orient()=="top"?1:-1)*tickLengthIn : scale)
                    .attr("y2", orient==HORIZONTAL? (axis.orient()=="top"?-1:1)*tickLengthOut : scale)
                    .attr("x1", orient==VERTICAL? (axis.orient()=="right"?-1:1)*tickLengthIn : scale)
                    .attr("x2", orient==VERTICAL? (axis.orient()=="right"?1:-1)*tickLengthOut : scale)
            
        };
        
        
        axis.highlightValueRun = function(g){
            var orient = axis.orient()=="top"||axis.orient()=="bottom"?HORIZONTAL:VERTICAL;
            
            g.selectAll(".tick")
                .each(function(d,t){
                    d3.select(this).select("text")
                        .transition()
                        .duration(highlightTransDuration)
                        .ease("linear")
                        .style("opacity", highlightValue=="none"? 1 : Math.min(1, Math.pow(
                                    Math.abs(axis.scale()(d)-axis.scale()(highlightValue))/
                                    (axis.scale().range()[1] - axis.scale().range()[0])*5, 2) 
                              ))
                })
            
            
            g.select('.vzb-axis-value')    
                .transition()
                .duration(highlightTransDuration)
                .ease("linear")
                .attr("transform", highlightValue=="none"? "translate(0,0)" : "translate("
                    + (orient==HORIZONTAL?axis.scale()(highlightValue):0) +","
                    + (orient==VERTICAL?axis.scale()(highlightValue):0) + ")"
                )
                
            g.select('.vzb-axis-value').select("text")
                .text(axis.tickFormat()(highlightValue=="none"?0:highlightValue))
                .style("opacity",(highlightValue=="none"?0:1));

            highlightValue = null;
        }
        
        
        var highlightValue = null;
        axis.highlightValue = function(arg){
            if (!arguments.length) return highlightValue;
            highlightValue = arg;
            return axis;
        }
        
        var highlightTransDuration = 0;
        axis.highlightTransDuration = function(arg){
            if (!arguments.length) return highlightTransDuration;
            highlightTransDuration = arg;
            return axis;
        }        
        
        var repositionLabels = null;
        axis.repositionLabels = function(arg){
            if (!arguments.length) return repositionLabels;
            repositionLabels = arg;
            return axis;
        };
        
        var pivot = false;
        axis.pivot = function(arg) {
            if (!arguments.length) return pivot;
            pivot = !!arg;
            return axis;
        };
                
        var tickValuesMinor = [];
        axis.tickValuesMinor = function(arg) {
            if (!arguments.length) return tickValuesMinor;
            tickValuesMinor = arg;
            return axis;
        };     
        
        var tickSizeMinor = {outbound:0, inbound:0};
        axis.tickSizeMinor = function(arg1, arg2) {
            if (!arguments.length) return tickSizeMinor;
            tickSizeMinor = {outbound:arg1, inbound:arg2||0};
            meow("setting", tickSizeMinor)
            return axis;
        };
        
        var options = {};
        axis.labelerOptions = function(arg) {
            if (!arguments.length) return options;
            options = arg;
            return axis;
        };
        
        axis.METHOD_REPEATING = 'repeating specified powers';
        axis.METHOD_DOUBLING = 'doubling the value';
        
        axis.labelFactory = function(options){
            if(options==null) options = {}
            if(options.scaleType!="linear"&&
               options.scaleType!="time"&&
               options.scaleType!="genericLog"&&
               options.scaleType!="log" && 
               options.scaleType!="ordinal") {
                return axis.ticks(ticksNumber)
                            .tickFormat(null)
                            .tickValues(null)
                            .tickValuesMinor(null)
                            .pivot(null)
                            .repositionLabels(null);
            };
            if(options.scaleType=='ordinal') return axis.tickValues(null);

            if(options.logBase==null) options.logBase = DEFAULT_LOGBASE;
            if(options.stops==null) options.stops = [1,2,5,3,7,4,6,8,9];
            
            
            
            if(options.removeAllLabels==null) options.removeAllLabels = false;

            if(options.formatterRemovePrefix==null) options.formatterRemovePrefix = false;

            if(options.formatter==null) options.formatter = function(d){
                               
                if(options.scaleType == "time") {
                    if(!(d instanceof Date)) d = new Date(d);
                    return d3.time.format("%Y")(d);
                }
                
                var format = "f";
                var prec = 0;
                if(Math.abs(d)<1) {prec = 1; format = "r"};

                var prefix = "";
                if(options.formatterRemovePrefix) return d3.format("."+prec+format)(d);

                switch (Math.floor(Math.log10(Math.abs(d)))){
                    case -13: d = d*1000000000000; prefix = "p"; break; //0.1p
                    case -10: d = d*1000000000; prefix = "n"; break; //0.1n
                    case  -7: d = d*1000000; prefix = "µ"; break; //0.1µ
                    case  -6: d = d*1000000; prefix = "µ"; break; //1µ
                    case  -5: d = d*1000000; prefix = "µ"; break; //10µ
                    case  -4: break; //0.0001
                    case  -3: break; //0.001
                    case  -2: break; //0.01
                    case  -1: break; //0.1
                    case   0: break; //1
                    case   1: break; //10
                    case   2: break; //100
                    case   3: break; //1000
                    case   4: break; //10000
                    case   5: d = d/1000; prefix = "k"; break; //0.1M
                    case   6: d = d/1000000; prefix = "M"; prec = 1; break; //1M
                    case   7: d = d/1000000; prefix = "M"; break; //10M
                    case   8: d = d/1000000; prefix = "M"; break; //100M
                    case   9: d = d/1000000000; prefix = "B"; prec = 1; break; //1B
                    case  10: d = d/1000000000; prefix = "B"; break; //10B
                    case  11: d = d/1000000000; prefix = "B"; break; //100B
                    case  12: d = d/1000000000000; prefix = "T"; prec = 1; break; //1T
                    //use the D3 SI formatting for the extreme cases
                    default: return (d3.format("."+prec+"s")(d)).replace("G","B");
                }


                // use manual formatting for the cases above
                return (d3.format("."+prec+format)(d)+prefix).replace("G","B");
            }
            options.cssLabelMarginLimit = 5; //px
            if(options.cssMarginLeft==null||parseInt(options.cssMarginLeft)<options.cssLabelMarginLimit) options.cssMarginLeft = options.cssLabelMarginLimit + "px";
            if(options.cssMarginRight==null||parseInt(options.cssMarginRight)<options.cssLabelMarginLimit) options.cssMarginRight = options.cssLabelMarginLimit + "px";
            if(options.cssMarginTop==null||parseInt(options.cssMarginTop)<options.cssLabelMarginLimit) options.cssMarginTop = options.cssLabelMarginLimit + "px";
            if(options.cssMarginBottom==null||parseInt(options.cssMarginBottom)<options.cssLabelMarginLimit) options.cssMarginBottom = options.cssLabelMarginLimit + "px";
            if(options.toolMargin==null) options.toolMargin = {left: 30, bottom: 30, right: 30, top: 30};

            if(options.pivotingLimit==null) options.pivotingLimit = options.toolMargin[this.orient()];
            
            if(options.showOuter==null)options.showOuter = false;
            if(options.limitMaxTickNumber==null)options.limitMaxTickNumber = 0; //0 is unlimited

            var orient = this.orient()=="top"||this.orient()=="bottom"?HORIZONTAL:VERTICAL;

            if(options.isPivotAuto==null) options.isPivotAuto = orient==VERTICAL;
            
            if(options.cssFontSize==null) options.cssFontSize = "13px";
            if(options.widthToFontsizeRatio==null) options.widthToFontsizeRatio = 0.75;
            if(options.heightToFontsizeRatio==null) options.heightToFontsizeRatio = 1.20;
            if(options.widthOfOneDigit==null) options.widthOfOneDigit =
                parseInt(options.cssFontSize)*options.widthToFontsizeRatio;
            if(options.heightOfOneDigit==null) options.heightOfOneDigit =
                parseInt(options.cssFontSize)*options.heightToFontsizeRatio;
            
            

meow("********** "+orient+" **********");
            
            var domain = axis.scale().domain();
            var range = axis.scale().range();
            var lengthDomain = Math.abs(domain[domain.length-1] - domain[0]);
            var lengthRange = Math.abs(range[range.length-1] - range[0]);
            
            var min = d3.min([domain[0],domain[domain.length-1]]);
            var max = d3.max([domain[0],domain[domain.length-1]]);
            var bothSidesUsed = (min<0 && max >0) && options.scaleType != "time";
            
            if(bothSidesUsed && options.scaleType == "log")console.error("It looks like your " + orient + " log scale domain is crossing ZERO. Classic log scale can only be one-sided. If need crossing zero try using genericLog scale instead")
                
            var tickValues = options.showOuter?[min, max]:[];
            var tickValuesMinor = []; //[min, max];
            var ticksNumber = 5;
            
            function getBaseLog(x, base) {
                if(base == null) base = options.logBase;
                return Math.log(x) / Math.log(base);
            };
            
            // estimate the longest formatted label in pixels
            var estLongestLabelLength =
                //take 17 sample values and measure the longest formatted label
                d3.max( d3.range(min, max, (max-min)/17).concat(max).map(function(d){return options.formatter(d).length}) ) 
                * options.widthOfOneDigit
                + parseInt(options.cssMarginLeft);

            var pivot = options.isPivotAuto 
                && (
                    (estLongestLabelLength + axis.tickPadding() + axis.tickSize() > options.pivotingLimit)
                    && (orient == VERTICAL)
                    ||
                    !(estLongestLabelLength + axis.tickPadding() + axis.tickSize() > options.pivotingLimit)
                    && !(orient == VERTICAL)
                );
            
            var labelsStackOnTop = (orient==HORIZONTAL && pivot || orient==VERTICAL && !pivot);
            
            
            
            
            // conditions to remove labels altogether
            var labelsJustDontFit = (!labelsStackOnTop && options.heightOfOneDigit > options.pivotingLimit);
            if(options.removeAllLabels) return axis.tickValues([]);
            
            // return a single tick if have only one point in the domain
            if (min==max) return axis.tickValues([min]).ticks(1).tickFormat(options.formatter);






            // LABELS FIT INTO SCALE
            // measure if all labels in array tickValues can fit into the allotted lengthRange
            // approximationStyle can be OPTIMISTIC or PESSIMISTIC
            // in optimistic style the length of every label is added up and then we check if the total pack of symbols fit
            // in pessimistic style we assume all labels have the length of the longest label from tickValues
            // returns TRUE if labels fit and FALSE otherwise
            var labelsFitIntoScale = function(tickValues, lengthRange, approximationStyle, rescalingLabels){
                if(tickValues == null || tickValues.length <= 1) return true;
                if (approximationStyle==null) approximationStyle = PESSIMISTIC;
                if (rescalingLabels==null) scaleType = "none";
                
                
                
                if(labelsStackOnTop){
                    //labels stack on top of each other. digit height matters
                    return lengthRange >
                        tickValues.length * (
                            options.heightOfOneDigit +
                            parseInt(options.cssMarginTop) +
                            parseInt(options.cssMarginBottom)
                        );
                }else{
                    //labels stack side by side. label width matters
                    var marginsLR = parseInt(options.cssMarginLeft) + parseInt(options.cssMarginRight);
                    var maxLength = d3.max(tickValues.map(function(d){return options.formatter(d).length}));
                    
                    // log scales need to rescale labels, so that 9 takes more space than 2
                    if(rescalingLabels=="log"){
                        // sometimes only a fragment of axis is used. in this case we want to limit the scope to that fragment
                        // yes, this is hacky and experimental 
                        lengthRange = Math.abs(axis.scale()(d3.max(tickValues)) - axis.scale()(d3.min(tickValues)));
                    
                        return lengthRange > 
                            d3.sum(tickValues.map(function(d){
                                    return (
                                        options.widthOfOneDigit 
                                            * (approximationStyle == PESSIMISTIC ? maxLength : options.formatter(d).length) 
                                        + marginsLR
                                    ) 
                                    // this is a logarithmic rescaling of labels
                                    * (1 + Math.log10( d.toString().replace(/([0\.])/g,"")[0] ))
                            }))

                    }else{
                        return lengthRange >
                            tickValues.length * marginsLR
                            + (approximationStyle == PESSIMISTIC ?
                                options.widthOfOneDigit 
                                    * tickValues.length * maxLength
                                : 0)
                            + (approximationStyle == OPTIMISTIC ?
                                options.widthOfOneDigit * (
                                    tickValues.map(function(d){return options.formatter(d)}).join("").length
                                )
                                : 0);
                    }
                }
            }
            
            
            
            
            
            // COLLISION BETWEEN
            // Check is there is a collision between labels ONE and TWO
            // ONE is a value, TWO can be a value or an array
            // returns TRUE if collision takes place and FALSE otherwise
            var collisionBetween = function(one, two){
                if(two==null || two.length == 0) return false;
                if(!(two instanceof Array))two = [two];
            
                for(var i = 0; i<two.length; i++){
                    if( 
                        one != two[i] && one != 0
                        &&
                        Math.abs(axis.scale()(one) - axis.scale()(two[i]))
                        <
                        (labelsStackOnTop? 
                            (options.heightOfOneDigit)
                            :
                            (options.formatter(one).length+options.formatter(two[i]).length)*options.widthOfOneDigit/2
                        )
                    ) return true; 
                
                }
                return false;
            }

            

            


            if(options.scaleType=="genericLog" || options.scaleType=="log"){
                var eps = axis.scale().eps ? axis.scale().eps() : 0;
                
                var spawnZero = bothSidesUsed? [0]:[];

                // check if spawn positive is needed. if yes then spawn!
                var spawnPos = max<eps? [] : (
                    d3.range(
                        Math.floor(getBaseLog(Math.max(eps,min))),
                        Math.ceil(getBaseLog(max)),
                        1)
                    .concat(Math.ceil(getBaseLog(max)))
                    .map(function(d){return Math.pow(options.logBase, d)})
                    );

                // check if spawn negative is needed. if yes then spawn!
                var spawnNeg = min>-eps? [] : (
                    d3.range(
                        Math.floor(getBaseLog(Math.max(eps,-max))),
                        Math.ceil(getBaseLog(-min)),
                    1)
                    .concat(Math.ceil(getBaseLog(-min)))
                    .map(function(d){return -Math.pow(options.logBase, d)})
                    );
                
                
                // automatic chosing of method if it's not explicitly defined
                if(options.method==null) {
                    var coverage = bothSidesUsed ? 
                        Math.max(Math.abs(max), Math.abs(min))/eps 
                        :
                        Math.max(Math.abs(max), Math.abs(min))/Math.min(Math.abs(max), Math.abs(min));
                    options.method = 10 <= coverage&&coverage <= 1024 ? this.METHOD_DOUBLING : this.METHOD_REPEATING;
                };

                
                //meow('spawn pos/neg: ', spawnPos, spawnNeg);
            
                    
                if(options.method == this.METHOD_DOUBLING) {
                    var doublingLabels = [];
                    if(bothSidesUsed)tickValues.push(0);
                    var avoidCollidingWith = [].concat(tickValues);

                    // start with the smallest abs number on the scale, rounded to nearest nice power
                    //var startPos = max<eps? null : Math.pow(options.logBase, Math.floor(getBaseLog(Math.max(eps,min))));
                    //var startNeg = min>-eps? null : -Math.pow(options.logBase, Math.floor(getBaseLog(Math.max(eps,-max))));
                    
                    var startPos = max<eps? null  : 4*spawnPos[Math.floor(spawnPos.length/2)-1];
                    var startNeg = min>-eps? null : 4*spawnNeg[Math.floor(spawnNeg.length/2)-1];
                    
                    //meow('starter pos/neg: ', startPos, startNeg);

                    if(startPos){ for(var l=startPos; l<=max; l*=2) doublingLabels.push(l);}
                    if(startPos){ for(var l=startPos/2; l>=Math.max(min,eps); l/=2) doublingLabels.push(l);}
                    if(startNeg){ for(var l=startNeg; l>=min; l*=2) doublingLabels.push(l);}
                    if(startNeg){ for(var l=startNeg/2; l<=Math.min(max,-eps); l/=2) doublingLabels.push(l);}
                                        
                    doublingLabels = doublingLabels
                        .sort(d3.ascending)
                        .filter(function(d){return min<=d&&d<=max});
                    
                    tickValuesMinor = tickValuesMinor.concat(doublingLabels);
                    
                    doublingLabels = groupByPriorities(doublingLabels,false); // don't skip taken values
                    
                    var tickValues_1 = tickValues;
                    for(var j = 0; j<doublingLabels.length; j++){

                        // compose an attempt to add more axis labels    
                        var trytofit = tickValues_1.concat(doublingLabels[j])
                            .filter(function(d){ return !collisionBetween(d,avoidCollidingWith); })
                            .filter(onlyUnique)
                        
                        // stop populating if labels don't fit 
                        if(!labelsFitIntoScale(trytofit, lengthRange, PESSIMISTIC, "none")) break;
                        
                        // apply changes if no blocking instructions
                        tickValues = trytofit
                    }
                }
                
                
                if(options.method == this.METHOD_REPEATING){
                    
                    var spawn = spawnZero.concat(spawnPos).concat(spawnNeg).sort(d3.ascending);
                    
                    options.stops.forEach(function(stop, i){
                        tickValuesMinor = tickValuesMinor.concat(spawn.map(function(d){return d*stop}));
                    });
                    
                    spawn = groupByPriorities(spawn);
                    var avoidCollidingWith = spawnZero.concat(tickValues);
                    
                    var stopTrying = false;

                    options.stops.forEach(function(stop, i){
                        if(i==0){
                            for(var j = 0; j<spawn.length; j++){
                                
                                // compose an attempt to add more axis labels    
                                var trytofit = tickValues
                                    .concat(spawn[j].map(function(d){return d*stop}))
                                    // throw away labels that collide with "special" labels 0, min, max
                                    .filter(function(d){return !collisionBetween(d,avoidCollidingWith);})
                                    .filter(function(d){return min<=d&&d<=max})
                                    .filter(onlyUnique);
                                
                                // stop populating if labels don't fit 
                                if(!labelsFitIntoScale(trytofit, lengthRange, PESSIMISTIC, "none")) break;
                                
                                // apply changes if no blocking instructions
                                tickValues = trytofit;
                            }
                            
                            //flatten the spawn array
                            spawn = [].concat.apply([], spawn);
                        }else{
                            if(stopTrying)return; 
                            
                            // compose an attempt to add more axis labels
                            var trytofit = tickValues
                                .concat(spawn.map(function(d){return d*stop}))
                                .filter(function(d){return min<=d&&d<=max})
                                .filter(onlyUnique);
                            
                            // stop populating if the new composition doesn't fit
                            if(!labelsFitIntoScale(trytofit, lengthRange, PESSIMISTIC, "log")) {stopTrying = true; return;}
                            // stop populating if the number of labels is limited in options
                            if(tickValues.length > options.limitMaxTickNumber && options.limitMaxTickNumber!=0) {stopTrying = true; return;}
                            
                            // apply changes if no blocking instructions
                            tickValues = trytofit;
                        }
                    })


                }//method

                
            } //logarithmic

            
            
            
            if(options.scaleType=="linear" || options.scaleType=="time"){
                if(bothSidesUsed)tickValues.push(0);
                var avoidCollidingWith = [].concat(tickValues);
                
                ticksNumber = Math.max(Math.floor(lengthRange / estLongestLabelLength), 2);
                
                // limit maximum ticks number
                if(options.limitMaxTickNumber!=0 && ticksNumber>options.limitMaxTickNumber)ticksNumber = options.limitMaxTickNumber;
                
                var addLabels = axis.scale().ticks.apply(axis.scale(), [ticksNumber])
                    .sort(d3.ascending)
                    .filter(function(d){return min<=d&&d<=max}); 
                
                tickValuesMinor = tickValuesMinor.concat(addLabels);
                
                addLabels = groupByPriorities(addLabels,false);
                
                var tickValues_1 = tickValues;
                for(var j = 0; j<addLabels.length; j++){

                    // compose an attempt to add more axis labels    
                    var trytofit = tickValues_1.concat(addLabels[j])
                        .filter(function(d){ return !collisionBetween(d,avoidCollidingWith); })
                        .filter(onlyUnique);

                    // stop populating if labels don't fit 
                    if(!labelsFitIntoScale(trytofit, lengthRange, PESSIMISTIC, "none")) break;

                    // apply changes if no blocking instructions
                    tickValues = trytofit
                }
                
                tickValues = tickValues//.concat(addLabels)
                    .filter(function(d){ return !collisionBetween(d,avoidCollidingWith); })
                    .filter(onlyUnique);

                
            }



            
            if(tickValues!=null && tickValues.length<=2 && !bothSidesUsed)tickValues = [min, max];
            
            if(tickValues!=null && tickValues.length<=3 && bothSidesUsed){
                if (!collisionBetween(0,[min,max])){ 
                    tickValues = [min, 0, max];
                }else{
                    tickValues = [min, max];
                }
            }
            
            if(tickValues!=null) tickValues.sort(function(a,b){
                return (orient==HORIZONTAL?-1:1)*(axis.scale()(b) - axis.scale()(a))
            });
            
            if(labelsJustDontFit) tickValues = [];
            tickValuesMinor = tickValuesMinor.filter(function(d){
                return tickValues.indexOf(d)==-1 && min<=d&&d<=max
            });
            

meow("final result",tickValues);
            
            return axis
                .ticks(ticksNumber)
                .tickFormat(options.formatter)
                .tickValues(tickValues)
                .tickValuesMinor(tickValuesMinor)
                .pivot(pivot)
                .repositionLabels(
                    repositionLabelsThatStickOut(tickValues, options, orient, axis.scale(), labelsStackOnTop?"y":"x")
                );
        };

        
        
        
        
        
        
        
        
        
        
        // GROUP ELEMENTS OF AN ARRAY, SO THAT...
        // less-prio elements are between the high-prio elements
        // Purpose: enable adding axis labels incrementally, like this for 9 labels:
        // PRIO 1: +--------, concat result: +-------- first we show only 1 label
        // PRIO 2: ----+---+, concat result: +---+---+ then we add 2 more, that are maximally spaced
        // PRIO 3: --+---+--, concat result: +-+-+-+-+ then we fill spaces with 2 more labels
        // PRIO 4: -+-+-+-+-, concat result: +++++++++ then we fill the remaing spaces and show all labels
        // exception: zero jumps to the front, if it's on the list
        // example1: [1 2 3 4 5 6 7] --> [[1][4 7][2 3 5 6]]
        // example2: [1 2 3 4 5 6 7 8 9] --> [[1][5 9][3 7][2 4 6 8]]
        // example3: [-4 -3 -2 -1 0 1 2 3 4 5 6 7] --> [[0][-4][2][-1 5][-3 -2 1 3 4 6 7]]
        // inputs:
        // array - the source array to be processed. Only makes sense if sorted
        // removeDuplicates - return incremental groups (true, default), or return concatinated result (false)
        // returns:
        // the nested array
        function groupByPriorities(array, removeDuplicates){
            if(removeDuplicates==null) removeDuplicates = true;

            var result = [];
            var taken = [];

            //zero is an exception, if it's present we manually take it to the front
            if(array.indexOf(0)!=-1){
                result.push([0]);
                taken.push(array.indexOf(0));
            }

            for(var k = array.length; k>=1; k = k<4? k-1 : k/2){
                // push the next group of elements to the result
                result.push(array.filter(function(d,i){
                    if(i % Math.floor(k) == 0 && (taken.indexOf(i)==-1 || !removeDuplicates)){
                        taken.push(i);
                        return true;
                    }
                    return false;
                }));
            }

            return result;
        }        
        
        
        
        
        
        
        
        
        // REPOSITION LABELS THAT STICK OUT
        // Purpose: the outer labels can easily be so large, they stick out of the allotted area
        // Example:
        // Label is fine:    Label sticks out:    Label sticks out more:    Solution - label is shifted:
        //      12345 |           1234|                123|5                   12345|          
        // _______.   |      _______. |           _______.|                 _______.|          
        // 
        // this is what the function does on the first step (only outer labels)
        // on the second step it shifts the inner labels that start to overlap with the shifted outer labels
        // 
        // requires tickValues array to be sorted from tail-first
        // tail means left or bottom, head means top or right
        //
        // dimension - which dimension requires shifting
        // X if labels stack side by side, Y if labels stack on top of one another
        //
        // returns the array of recommended {x,y} shifts
        
        function repositionLabelsThatStickOut(tickValues, options, orient, scale, dimension){
            if(tickValues==null)return null;
                
            // make an abstraction layer for margin sizes
            // tail means left or bottom, head means top or right
            var margin = 
                orient==VERTICAL?
                {head: options.toolMargin.top, tail: options.toolMargin.bottom}
                :
                {head: options.toolMargin.right, tail: options.toolMargin.left};
            
            
            var result = {};
                        
               
            // STEP 1:
            // for outer labels: avoid sticking out from the tool margin
            tickValues.forEach(function(d,i){
                if(i!=0 && i!=tickValues.length-1) return;
                
                // compute the influence of the axis head
                var repositionHead = margin.head
                    + (orient==HORIZONTAL?1:0) * d3.max(scale.range()) 
                    - (orient==HORIZONTAL?0:1) * d3.min(scale.range()) 
                    + (orient==HORIZONTAL?-1:1) * scale(d)
                    - (dimension=="x") * options.formatter(d).length * options.widthOfOneDigit / 2
                    - (dimension=="y") * options.heightOfOneDigit / 2
                    // we may consider or not the label margins to give them a bit of spacing from the edges
                    - (dimension=="x") * parseInt(options.cssMarginRight);
                    - (dimension=="y") * parseInt(options.cssMarginTop);
                
                // compute the influence of the axis tail
                var repositionTail = Math.min(margin.tail, options.widthOfOneDigit)
                    + (orient==VERTICAL?1:0) * d3.max(scale.range()) 
                    - (orient==VERTICAL?0:1) * d3.min(scale.range()) 
                    + (orient==VERTICAL?-1:1) * scale(d)
                    - (dimension=="x") * options.formatter(d).length * options.widthOfOneDigit / 2
                    - (dimension=="y") * options.heightOfOneDigit / 2
                    // we may consider or not the label margins to give them a bit of spacing from the edges
                    - (dimension=="x") * parseInt(options.cssMarginLeft);
                    - (dimension=="y") * parseInt(options.cssMarginBottom);
                
                // apply limits in order to cancel repositioning of labels that are good
                if(repositionHead>0)repositionHead=0;
                if(repositionTail>0)repositionTail=0;
                
                // add them up with appropriate signs, save to the axis
                result[i] = {x:0, y:0};
                result[i][dimension] = (dimension=="y" && orient==VERTICAL?-1:1) * (repositionHead - repositionTail);
            });
            

            // STEP 2:
            // for inner labels: avoid collision with outer labels
            tickValues.forEach(function(d,i){
                if(i==0 || i==tickValues.length-1) return;
                
                // compute the influence of the head-side outer label
                var repositionHead = 
                    // take the distance between head and the tick at hand
                    Math.abs(scale(d) - scale(tickValues[tickValues.length-1]) )
                    // substract the shift of the tail
                    - (dimension=="y" && orient==HORIZONTAL?-1:1) * result[tickValues.length-1][dimension]
                    
                    - (dimension=="x") * options.widthOfOneDigit / 2 
                        * options.formatter(d).length
                    - (dimension=="x") * options.widthOfOneDigit / 2 
                        * options.formatter(tickValues[tickValues.length-1]).length
                    - (dimension=="y") * options.heightOfOneDigit 
                        * 0.7; //TODO remove magic constant - relation of actual font height to BBox-measured height

                // compute the influence of the tail-side outer label
                var repositionTail = 
                    // take the distance between tail and the tick at hand
                    Math.abs(scale(d) - scale(tickValues[0]) )
                    // substract the shift of the tail
                    - (dimension=="y" && orient==VERTICAL?-1:1) * result[0][dimension]
                
                    - (dimension=="x") * options.widthOfOneDigit / 2 
                        * options.formatter(d).length
                    - (dimension=="x") * options.widthOfOneDigit / 2 
                        * options.formatter(tickValues[0]).length
                    - (dimension=="y") * options.heightOfOneDigit 
                        * 0.7; //TODO remove magic constant - relation of actual font height to BBox-measured height
                
                // apply limits in order to cancel repositioning of labels that are good
                if(repositionHead>0)repositionHead=0;
                if(repositionTail>0)repositionTail=0;
                
                // add them up with appropriate signs, save to the axis
                result[i] = {x:0, y:0};
                result[i][dimension] = (dimension=="y" && orient==VERTICAL?-1:1) * (repositionHead - repositionTail);
            });
            
            
            return result;
        } // function repositionLabelsThatStickOut()
        
        
        
        
        axis.copy = function () {
            return d3_axis_smart(d3.svg.axis());
        };
        
        return d3.rebind(axis, _super, 
            "scale", "orient", "ticks", "tickValues", "tickFormat", 
            "tickSize", "innerTickSize", "outerTickSize", "tickPadding", 
            "tickSubdivide"
            );
        
        
        function meow(l1,l2,l3,l4,l5){
            if(!axis.labelerOptions().isDevMode)return;
            if(l5!=null){console.log(l1,l2,l3,l4,l5); return;}
            if(l4!=null){console.log(l1,l2,l3,l4); return;}
            if(l3!=null){console.log(l1,l2,l3); return;}
            if(l2!=null){console.log(l1,l2); return;}
            if(l1!=null){console.log(l1); return;}
        }
        
        }(d3.svg.axis());
        
    }; //d3.svg.axisSmart = function(){

}).call(this);

(function () {
  'use strict';
  var root = this;
  //warn client if d3 is not defined
  if (!Vizabi._require('d3')) {
    return;
  }
  d3.svg.collisionResolver = function () {
    return function collision_resolver() {
      var DURATION = 300;
      var labelHeight = {};
      var labelPosition = {};
      // MAINN FUNCTION. RUN COLLISION RESOLVER ON A GROUP g
      function resolver(g) {
        if (data == null) {
          console.warn('D3 collision resolver stopped: missing data to work with. Example: data = {asi: {valueY: 45, valueX: 87}, ame: {valueY: 987, valueX: 767}}');
          return;
        }
        if (selector == null) {
          console.warn('D3 collision resolver stopped: missing a CSS slector');
          return;
        }
        if (height == null) {
          console.warn('D3 collision resolver stopped: missing height of the canvas');
          return;
        }
        if (value == null) {
          console.warn('D3 collision resolver stopped: missing pointer within data objects. Example: value = \'valueY\' ');
          return;
        }
        if (KEY == null) {
          console.warn('D3 collision resolver stopped: missing a key for data. Example: key = \'geo\' ');
          return;
        }
        g.each(function (d, index) {
          labelHeight[d[KEY]] = d3.select(this).select(selector)[0][0].getBBox().height;
        });
        labelPosition = resolver.calculatePositions(data, value, height, scale);
        //actually reposition the labels
        g.each(function (d, i) {
          if (data[d[KEY]][fixed])
            return;
          var resolvedY = labelPosition[d[KEY]] || scale(data[d[KEY]][value]) || 0;
          var resolvedX = null;
          if (handleResult != null) {
            handleResult(d, i, this, resolvedX, resolvedY);
            return;
          }
          d3.select(this).selectAll(selector).transition().duration(DURATION).attr('transform', 'translate(0,' + resolvedY + ')');
        });
      }

      // CALCULATE OPTIMIZED POSITIONS BASED ON LABELS' HEIGHT AND THEIR PROXIMITY (DELTA)
      resolver.calculatePositions = function (data, value, height, scale) {
        var result = {};
        var keys = Object.keys(data).sort(function (a, b) {
          return data[a][value] - data[b][value];
        });
        keys.forEach(function (d, index) {
          //initial positioning
          result[d] = scale(data[d][value]);
          // check the overlapping chain reaction all the way down
          for (var j = index; j > 0; j--) {
            // if overlap found shift the overlapped label downwards
            var delta = result[keys[j - 1]] - result[keys[j]] - labelHeight[keys[j]];
            if (delta < 0)
              result[keys[j - 1]] -= delta;
            // if the chain reaction stopped because found some gap in the middle, then quit
            if (delta > 0)
              break;
          }
        });
        // check if the lowest label is breaking the boundary...
        var delta = height - result[keys[0]] - labelHeight[keys[0]];
        // if it does, then
        if (delta < 0) {
          // shift the lowest up
          result[keys[0]] += delta;
          // check the overlapping chain reaction all the way up
          for (var j = 0; j < keys.length - 1; j++) {
            // if overlap found shift the overlapped label upwards
            var delta = result[keys[j]] - result[keys[j + 1]] - labelHeight[keys[j + 1]];
            if (delta < 0)
              result[keys[j + 1]] += delta;
            // if the chain reaction stopped because found some gap in the middle, then quit
            if (delta > 0)
              break;
          }
        }
        return result;
      };
      // GETTERS AND SETTERS
      var data = null;
      resolver.data = function (arg) {
        if (!arguments.length)
          return data;
        data = arg;
        return resolver;
      };
      var selector = null;
      resolver.selector = function (arg) {
        if (!arguments.length)
          return selector;
        selector = arg;
        return resolver;
      };
      var height = null;
      resolver.height = function (arg) {
        if (!arguments.length)
          return height;
        height = arg;
        return resolver;
      };
      var scale = d3.scale.linear().domain([
        0,
        1
      ]).range([
        0,
        1
      ]);
      resolver.scale = function (arg) {
        if (!arguments.length)
          return scale;
        scale = arg;
        return resolver;
      };
      var value = null;
      resolver.value = function (arg) {
        if (!arguments.length)
          return value;
        value = arg;
        return resolver;
      };
      var fixed = null;
      resolver.fixed = function (arg) {
        if (!arguments.length)
          return fixed;
        fixed = arg;
        return resolver;
      };
      var handleResult = null;
      resolver.handleResult = function (arg) {
        if (!arguments.length)
          return handleResult;
        handleResult = arg;
        return resolver;
      };
      var KEY = null;
      resolver.KEY = function (arg) {
        if (!arguments.length)
          return KEY;
        KEY = arg;
        return resolver;
      };
      return resolver;
    }();
  };  //d3.svg.collisionResolver = function(){
}.call(this));

(function () {
  'use strict';
  var root = this;
  if (!Vizabi._require('d3'))
    return;
  d3.svg.colorPicker = function () {
    return function d3_color_picker() {
      // tuning defaults
      var nCellsH = 15;
      // number of cells by hues (angular)
      var minH = 0;
      // which hue do we start from: 0 to 1 instead of 0 to 365
      var nCellsL = 4;
      // number of cells by lightness (radial)
      var minL = 0.5;
      // which lightness to start from: 0 to 1. Recommended 0.3...0.5
      var satConstant = 0.7;
      // constant saturation for color wheel: 0 to 1. Recommended 0.7...0.8
      var outerL_display = 0.4;
      // ecxeptional saturation of the outer circle. the one displayed 0 to 1
      var outerL_meaning = 0.3;
      // ecxeptional saturation of the outer circle. the one actually ment 0 to 1
      var firstAngleSat = 0;
      // exceptional saturation at first angular segment. Set 0 to have shades of grey
      var minRadius = 15;
      //radius of the central hole in color wheel: px
      var margin = {
        top: 0.1,
        bottom: 0.1,
        left: 0.1,
        right: 0.1
      };
      //margins in % of container's width and height
      var colorOld = '#000';
      var colorDef = '#000';
      // names of CSS classes
      var css = {
        INVISIBLE: 'vzb-invisible',
        COLOR_POINTER: 'vzb-colorPicker-colorPointer',
        COLOR_BUTTON: 'vzb-colorPicker-colorCell',
        COLOR_DEFAULT: 'vzb-colorPicker-defaultColor',
        COLOR_SAMPLE: 'vzb-colorPicker-colorSample',
        COLOR_PICKER: 'vzb-colorPicker-colorPicker',
        COLOR_CIRCLE: 'vzb-colorPicker-colorCircle',
        COLOR_SEGMENT: 'vzb-colorPicker-colorSegment',
        COLOR_BACKGR: 'vzb-colorPicker-background'
      };
      var colorData = [];
      //here we store color data. formatted as follows:
      /*
       [
       [ // outer circle
       {display: "#123456", meaning: "#123456"}, // first angle
       ...
       {display: "#123456", meaning: "#123456"} // last angle, clockwise
       ],
       [ // next circle
       {display: "#123456", meaning: "#123456"}, // first angle
       ...
       {display: "#123456", meaning: "#123456"} // last angle, clockwise
       ],

       ...

       [ // inner circle
       {display: "#123456", meaning: "#123456"}, // first angle
       ...
       {display: "#123456", meaning: "#123456"} // last angle, clockwise
       ]
       ]
       */
      var arc = d3.svg.arc();
      var pie = d3.layout.pie().sort(null).value(function (d) {
        return 1;
      });
      var svg = null;
      var colorPointer = null;
      var showColorPicker = false;
      var sampleRect = null;
      var sampleText = null;
      var background = null;
      var callback = function (value) {
        console.info('Color picker callback example. Setting color to ' + value);
      };

      function _generateColorData() {
        var result = [];
        // loop across circles
        for (var l = 0; l < nCellsL; l++) {
          var lightness = minL + (1 - minL) / nCellsL * l;
          // new circle of cells
          result.push([]);
          // loop across angles
          for (var h = 0; h <= nCellsH; h++) {
            var hue = minH + (1 - minH) / nCellsH * h;
            // new cell
            result[l].push({
              display: _hslToRgb(hue, h == 0 ? firstAngleSat : satConstant, l == 0 ? outerL_display : lightness),
              meaning: _hslToRgb(hue, h == 0 ? firstAngleSat : satConstant, l == 0 ? outerL_meaning : lightness)
            });
          }
        }
        return result;
      }

      function _hslToRgb(h, s, l) {
        var r, g, b;
        if (s == 0) {
          r = g = b = l;  // achromatic
        } else {
          var _hue2rgb = function _hue2rgb(p, q, t) {
            if (t < 0)
              t += 1;
            if (t > 1)
              t -= 1;
            if (t < 1 / 6)
              return p + (q - p) * 6 * t;
            if (t < 1 / 2)
              return q;
            if (t < 2 / 3)
              return p + (q - p) * (2 / 3 - t) * 6;
            return p;
          };
          var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          var p = 2 * l - q;
          r = _hue2rgb(p, q, h + 1 / 3);
          g = _hue2rgb(p, q, h);
          b = _hue2rgb(p, q, h - 1 / 3);
        }
        return '#' + Math.round(r * 255).toString(16) + Math.round(g * 255).toString(16) + Math.round(b * 255).toString(16);
      }

      // this is init function. call it once after you are satisfied with parameters tuning
      // container should be a D3 selection that has a div where we want to render color picker
      // that div should have !=0 width and height in its style
      function colorPicker(container) {
        colorData = _generateColorData();
        svg = container.append('svg').style('position', 'absolute').style('top', '0').style('left', '0').style('width', '100%').style('height', '100%').attr('class', css.COLOR_PICKER).classed(css.INVISIBLE, !showColorPicker);
        var width = parseInt(svg.style('width'));
        var height = parseInt(svg.style('height'));
        var maxRadius = width / 2 * (1 - margin.left - margin.right);
        background = svg.append('rect').attr('width', width).attr('height', height).attr('class', css.COLOR_BUTTON + ' ' + css.COLOR_BACKGR).on('mouseover', function (d) {
          _cellHover(colorOld);
        });
        var circles = svg.append('g').attr('transform', 'translate(' + (maxRadius + width * margin.left) + ',' + (maxRadius + height * margin.top) + ')');
        svg.append('rect').attr('class', css.COLOR_SAMPLE).attr('width', width / 2).attr('height', height * margin.top / 2);
        sampleRect = svg.append('rect').attr('class', css.COLOR_SAMPLE).attr('width', width / 2).attr('x', width / 2).attr('height', height * margin.top / 2);
        svg.append('text').attr('x', width * margin.left).attr('y', height * margin.top / 2).attr('dy', '0.5em').style('text-anchor', 'start').attr('class', css.COLOR_SAMPLE);
        sampleText = svg.append('text').attr('x', width * (1 - margin.right)).attr('y', height * margin.top / 2).attr('dy', '0.5em').style('text-anchor', 'end').attr('class', css.COLOR_SAMPLE);
        svg.append('text').attr('x', width * 0.1).attr('y', height * (1 - margin.bottom)).attr('dy', '0.3em').style('text-anchor', 'start').text('default');
        svg.append('circle').attr('class', css.COLOR_DEFAULT + ' ' + css.COLOR_BUTTON).attr('r', width * margin.left / 2).attr('cx', width * margin.left * 1.5).attr('cy', height * (1 - margin.bottom * 1.5)).on('mouseover', function () {
          d3.select(this).style('stroke', '#444');
          _cellHover(colorDef);
        }).on('mouseout', function () {
          d3.select(this).style('stroke', 'none');
        });
        circles.append('circle').attr('r', minRadius - 1).attr('fill', '#FFF').attr('class', css.COLOR_BUTTON).on('mouseover', function () {
          d3.select(this).style('stroke', '#444');
          _cellHover('#FFF');
        }).on('mouseout', function () {
          d3.select(this).style('stroke', 'none');
        });
        circles.selectAll('.' + css.COLOR_CIRCLE).data(colorData).enter().append('g').attr('class', css.COLOR_CIRCLE).each(function (circleData, index) {
          arc.outerRadius(minRadius + (maxRadius - minRadius) / nCellsL * (nCellsL - index)).innerRadius(minRadius + (maxRadius - minRadius) / nCellsL * (nCellsL - index - 1));
          var segment = d3.select(this).selectAll('.' + css.COLOR_SEGMENT).data(pie(circleData)).enter().append('g').attr('class', css.COLOR_SEGMENT);
          segment.append('path').attr('class', css.COLOR_BUTTON).attr('d', arc).style('fill', function (d) {
            return d.data.display;
          }).style('stroke', function (d) {
            return d.data.display;
          }).on('mouseover', function (d) {
            _cellHover(d.data.meaning, this);
          }).on('mouseout', function (d) {
            _cellUnHover();
          });
        });
        colorPointer = circles.append('path').attr('class', css.COLOR_POINTER + ' ' + css.INVISIBLE);
        svg.selectAll('.' + css.COLOR_BUTTON).on('click', function () {
          _this.show(TOGGLE);
        });
        _doTheStyling(svg);
      }

      var _doTheStyling = function (svg) {
        //styling
        svg.select('.' + css.COLOR_BACKGR).style('fill', 'white');
        svg.select('.' + css.COLOR_POINTER).style('stroke-width', 2).style('stroke', 'white').style('pointer-events', 'none').style('fill', 'none');
        svg.selectAll('.' + css.COLOR_BUTTON).style('cursor', 'pointer');
        svg.selectAll('text').style('dominant-baseline', 'hanging').style('fill', '#D9D9D9').style('font-size', '0.7em').style('text-transform', 'uppercase');
        svg.selectAll('circle.' + css.COLOR_BUTTON).style('stroke-width', 2);
      };
      var _this = colorPicker;
      var _cellHover = function (value, view) {
        // show color pointer if the view is set (a cell of colorwheel)
        if (view != null)
          colorPointer.classed(css.INVISIBLE, false).attr('d', d3.select(view).attr('d'));
        sampleRect.style('fill', value);
        sampleText.text(value);
        callback(value);
      };
      var _cellUnHover = function () {
        colorPointer.classed(css.INVISIBLE, true);
      };
      //Use this function to hide or show the color picker
      //true = show, false = hide, "toggle" or TOGGLE = toggle
      var TOGGLE = 'toggle';
      colorPicker.show = function (arg) {
        if (!arguments.length)
          return showColorPicker;
        if (svg == null)
          console.warn('Color picker is missing SVG element. Was init sequence performed?');
        showColorPicker = arg == TOGGLE ? !showColorPicker : arg;
        svg.classed(css.INVISIBLE, !showColorPicker);
      };
      // getters and setters
      colorPicker.nCellsH = function (arg) {
        if (!arguments.length)
          return nCellsH;
        nCellsH = arg;
        return colorPicker;
      };
      colorPicker.minH = function (arg) {
        if (!arguments.length)
          return minH;
        minH = arg;
        return colorPicker;
      };
      colorPicker.nCellsL = function (arg) {
        if (!arguments.length)
          return nCellsL;
        nCellsL = arg;
        return colorPicker;
      };
      colorPicker.minL = function (arg) {
        if (!arguments.length)
          return minL;
        minL = arg;
        return colorPicker;
      };
      colorPicker.outerL_display = function (arg) {
        if (!arguments.length)
          return outerL_display;
        outerL_display = arg;
        return colorPicker;
      };
      colorPicker.outerL_meaning = function (arg) {
        if (!arguments.length)
          return outerL_meaning;
        outerL_meaning = arg;
        return colorPicker;
      };
      colorPicker.satConstant = function (arg) {
        if (!arguments.length)
          return satConstant;
        satConstant = arg;
        return colorPicker;
      };
      colorPicker.firstAngleSat = function (arg) {
        if (!arguments.length)
          return firstAngleSat;
        firstAngleSat = arg;
        return colorPicker;
      };
      colorPicker.minRadius = function (arg) {
        if (!arguments.length)
          return minRadius;
        minRadius = arg;
        return colorPicker;
      };
      colorPicker.margin = function (arg) {
        if (!arguments.length)
          return margin;
        margin = arg;
        return colorPicker;
      };
      colorPicker.callback = function (arg) {
        if (!arguments.length)
          return callback;
        callback = arg;
        return colorPicker;
      };
      colorPicker.colorDef = function (arg) {
        if (!arguments.length)
          return colorDef;
        colorDef = arg;
        if (svg == null)
          console.warn('Color picker is missing SVG element. Was init sequence performed?');
        svg.select('.' + css.COLOR_DEFAULT).style('fill', colorDef);
        return colorPicker;
      };
      colorPicker.colorOld = function (arg) {
        if (!arguments.length)
          return colorOld;
        colorOld = arg;
        if (svg == null)
          console.warn('Color picker is missing SVG element. Was init sequence performed?');
        svg.select('rect.' + css.COLOR_SAMPLE).style('fill', colorOld);
        svg.select('text.' + css.COLOR_SAMPLE).text(colorOld);
        return colorPicker;
      };
      return colorPicker;
    }();
  };  //d3.svg.axisSmart = function(){
}.call(this));

(function () {
  'use strict';
  var root = this;
  //warn client if d3 is not defined
  if (!Vizabi._require('d3')) {
    return;
  }
  d3.scale.genericLog = function () {
    return function d3_scale_genericLog(logScale) {
      var _this = this;
      var eps = 0.001;
      var ePos = 0.001;
      var eNeg = -0.001;
      var delta = 5;
      var domain = logScale.domain();
      var range = logScale.range();
      var useLinear = false;
      var linScale = d3.scale.linear().domain([
        0,
        eps
      ]).range([
        0,
        delta
      ]);
      var abs = function (arg) {
        if (arg instanceof Array)
          return arg.map(function (d) {
            return Math.abs(d);
          });
        return Math.abs(arg);
      };
      var oneside = function (arg) {
        var sign = Math.sign(arg[0]);
        for (var i = 0; i < arg.length; i++) {
          if (Math.sign(arg[i]) != sign)
            return false;
        }
        return true;
      };

      function scale(x) {
        var ratio = 1;
        var shiftNeg = 0;
        var shiftPos = 0;
        var shiftAll = 0;
        //console.log("DOMAIN log lin", logScale.domain(), linScale.domain());
        //console.log("RANGE log lin", logScale.range(), linScale.range());
        var domainPointingForward = domain[0] < domain[domain.length - 1];
        var rangePointingForward = range[0] < range[range.length - 1];
        if (d3.min(domain) < 0 && d3.max(domain) > 0) {
          var minAbsDomain = d3.min(abs([
            domain[0],
            domain[domain.length - 1]
          ]));
          //var maxAbsDomain = d3.max(abs([ domain[0], domain[domain.length-1] ]));
          //ratio shows how the + and - scale should fit as compared to a simple + or - scale
          ratio = domainPointingForward != rangePointingForward ? (d3.max(range) + d3.max(range) - logScale(Math.max(eps, minAbsDomain))) / d3.max(range) : (d3.max(range) + logScale(Math.max(eps, minAbsDomain))) / d3.max(range);
          if (domainPointingForward && !rangePointingForward) {
            shiftNeg = (d3.max(range) + linScale(0)) / ratio;
            // if the bottom is heavier we need to shift the entire chart
            if (abs(domain[0]) > abs(domain[domain.length - 1]))
              shiftAll -= logScale(Math.max(eps, minAbsDomain)) / ratio;
          } else if (!domainPointingForward && !rangePointingForward) {
            shiftAll = logScale(Math.max(eps, minAbsDomain)) / ratio;
            //if the top is heavier we need to shift the entire chart
            if (abs(domain[0]) < abs(domain[domain.length - 1]))
              shiftAll += (d3.max(range) - logScale(Math.max(eps, minAbsDomain))) / ratio;
          } else if (domainPointingForward && rangePointingForward) {
            shiftAll = d3.max(range) / ratio;
            // if the top is heavier we need to shift the entire chart
            if (abs(domain[0]) < abs(domain[domain.length - 1]))
              shiftAll -= (d3.max(range) - logScale(Math.max(eps, minAbsDomain))) / ratio;
          } else if (!domainPointingForward && rangePointingForward) {
            shiftNeg = (d3.max(range) + linScale(0)) / ratio;
            //if the top is heavier we need to shift the entire chart
            if (abs(domain[0]) < abs(domain[domain.length - 1]))
              shiftAll -= logScale(Math.max(eps, minAbsDomain)) / ratio;
          }
        } else if (d3.min(domain) < 0 && d3.max(domain) < 0) {
          shiftNeg = d3.max(range);
        }
        if (x > eps)
          return logScale(x) / ratio + shiftAll + shiftPos;
        if (x < -eps)
          return -logScale(-x) / ratio + shiftAll + shiftNeg;
        if (0 <= x && x <= eps)
          return linScale(x) / ratio + shiftAll + shiftPos;
        if (-eps <= x && x < 0)
          return -linScale(-x) / ratio + shiftAll + shiftNeg;
      }

      scale.eps = function (arg) {
        if (!arguments.length)
          return eps;
        eps = arg;
        scale.domain(domain);
        return scale;
      };
      scale.delta = function (arg) {
        if (!arguments.length)
          return delta;
        delta = arg;
        scale.range(range);
        return scale;
      };
      scale.domain = function (_arg) {
        if (!arguments.length)
          return domain;
        // this is an internal array, it will be modified. the input _arg should stay intact
        var arg = [];
        if (_arg.length != 2)
          console.warn('generic log scale is best for 2 values in domain, but it tries to support other cases too');
        switch (_arg.length) {
          // if no values are given, reset input to the default domain (do nothing)
          case 0:
            arg = domain;
            break;
          // use the given value as a center, get the domain /2 and *2 around it
          case 1:
            arg = [
              _arg[0] / 2,
              _arg[0] * 2
            ];
            break;
          // two is the standard case. just use these
          case 2:
            arg = [
              _arg[0],
              _arg[1]
            ];
            break;
          // use the edge values as domain, center as ±epsilon
          case 3:
            arg = [
              _arg[0],
              _arg[2]
            ];
            eps = abs(_arg[1]);
            break;
          // use the edge values as domain, center two values as ±epsilon
          //                    case 4: arg = [_arg[0], _arg[3]];
          //                        // if the domain is pointing forward
          //                        if(_arg[0]<=_arg[3]){eNeg = -abs(_arg[1]); ePos = abs(_arg[2]);}
          //                        // if the domain is pointing backward
          //                        if(_arg[0]>=_arg[3]){eNeg = -abs(_arg[2]); ePos = abs(_arg[1]);}
          //                         break;
          // use the edge values as domain, the minimum of the rest be the epsilon
          default:
            arg = [
              _arg[0],
              _arg[_arg.length - 1]
            ];
            eps = d3.min(abs(_arg.filter(function (d, i) {
              return i != 0 && i != _arg.length - 1;
            })));
            break;
        }
        //if the domain is just a single value
        if (arg[0] == arg[1]) {
          arg[0] = arg[0] / 2;
          arg[1] = arg[1] * 2;
        }
        //if the desired domain is one-seded
        if (oneside(arg) && d3.min(abs(arg)) >= eps) {
          //if the desired domain is above +epsilon
          if (arg[0] > 0 && arg[1] > 0) {
            //then fallback to a regular log scale. nothing special
            logScale.domain(arg);
          } else {
            //otherwise it's all negative, we take absolute and swap the arguments
            logScale.domain([
              -arg[1],
              -arg[0]
            ]);
          }
          useLinear = false;  //if the desired domain is one-sided and takes part of or falls within 0±epsilon
        } else if (oneside(arg) && d3.min(abs(arg)) < eps) {
          //if the desired domain is all positive
          if (arg[0] > 0 && arg[1] > 0) {
            //the domain is all positive
            //check the direction of the domain
            if (arg[0] <= arg[1]) {
              //if the domain is pointing forward
              logScale.domain([
                eps,
                arg[1]
              ]);
              linScale.domain([
                0,
                eps
              ]);
            } else {
              //if the domain is pointing backward
              logScale.domain([
                arg[0],
                eps
              ]);
              linScale.domain([
                eps,
                0
              ]);
            }
          } else {
            //otherwise it's all negative, we take absolute and swap the arguments
            //check the direction of the domain
            if (arg[0] <= arg[1]) {
              //if the domain is pointing forward
              logScale.domain([
                eps,
                -arg[0]
              ]);
              linScale.domain([
                0,
                eps
              ]);
            } else {
              //if the domain is pointing backward
              logScale.domain([
                -arg[1],
                eps
              ]);
              linScale.domain([
                eps,
                0
              ]);
            }
          }
          useLinear = true;  // if the desired domain is two-sided and fully or partially covers 0±epsilon
        } else if (!oneside(arg)) {
          //check the direction of the domain
          if (arg[0] <= arg[1]) {
            //if the domain is pointing forward
            logScale.domain([
              eps,
              d3.max(abs(arg))
            ]);
            linScale.domain([
              0,
              eps
            ]);
          } else {
            //if the domain is pointing backward
            logScale.domain([
              d3.max(abs(arg)),
              eps
            ]);
            linScale.domain([
              eps,
              0
            ]);
          }
          useLinear = true;
        }
        //
        //console.log("LOG scale domain:", logScale.domain());
        //if(useLinear)console.log("LIN scale domain:", linScale.domain());
        domain = _arg;
        return scale;
      };
      scale.range = function (arg) {
        if (!arguments.length)
          return range;
        if (arg.length != 2)
          console.warn('generic log scale is best for 2 values in range, but it tries to support other cases too');
        switch (arg.length) {
          // reset input to the default range
          case 0:
            arg = range;
            break;
          // use the only value as a center, get the range ±100 around it
          case 1:
            arg = [
              arg[0] - 100,
              arg[0] + 100
            ];
            break;
          // two is the standard case. do nothing
          case 2:
            arg = arg;
            break;
          // use the edge values as range, center as delta
          case 3:
            delta = arg[1];
            arg = [
              arg[0],
              arg[2]
            ];
            break;
          // use the edge values as range, the minimum of the rest be the delta
          default:
            delta = d3.min(arg.filter(function (d, i) {
              return i != 0 && i != arg.length - 1;
            }));
            arg = [
              arg[0],
              arg[arg.length - 1]
            ];
            break;
        }
        if (!useLinear) {
          logScale.range(arg);
        } else {
          if (arg[0] < arg[1]) {
            //range is pointing forward
            //check where domain is pointing
            if (domain[0] < domain[domain.length - 1]) {
              //domain is pointing forward
              logScale.range([
                delta,
                arg[1]
              ]);
              linScale.range([
                0,
                delta
              ]);
            } else {
              //domain is pointing backward
              logScale.range([
                0,
                arg[1] - delta
              ]);
              linScale.range([
                arg[1] - delta,
                arg[1]
              ]);
            }
          } else {
            //range is pointing backward
            //check where domain is pointing
            if (domain[0] < domain[domain.length - 1]) {
              //domain is pointing forward
              logScale.range([
                arg[0] - delta,
                0
              ]);
              linScale.range([
                arg[0],
                arg[0] - delta
              ]);
            } else {
              //domain is pointing backward
              logScale.range([
                arg[0],
                delta
              ]);
              linScale.range([
                delta,
                0
              ]);
            }
          }
        }
        //
        //console.log("LOG and LIN range:", logScale.range(), linScale.range());
        range = arg;
        return scale;
      };
      scale.copy = function () {
        return d3_scale_genericLog(d3.scale.log().domain([
          1,
          10
        ])).domain(domain).range(range).eps(eps).delta(delta);
      };
      return d3.rebind(scale, logScale, 'invert', 'base', 'rangeRound', 'interpolate', 'clamp', 'nice', 'tickFormat', 'ticks');
    }(d3.scale.log().domain([
      1,
      10
    ]));
  };
}.call(this));

(function () {
  'use strict';

  var root = this;
  if (!Vizabi._require('d3'))
    return;

  function detectTouchEvent(element, onTap, onLongTap) {
    var start;
    var namespace = onTap ? '.onTap' : '.onLongTap';
    d3.select(element)
      .on('touchstart' + namespace, function (d, i) {
        start = d3.event.timeStamp;
      })
      .on('touchend' + namespace, function (d, i) {
        if (d3.event.timeStamp - start < 500)
          return onTap ? onTap(d, i) : undefined;
        return onLongTap ? onLongTap(d, i) : undefined;
      });
  }

  d3.selection.prototype.onTap = function (callback) {
    return this.each(function () {
      detectTouchEvent(this, callback);
    })
  };

  d3.selection.prototype.onLongTap = function (callback) {
    return this.each(function () {
      detectTouchEvent(this, null, callback);
    })
  };

}.call(this));

(function () {
  'use strict';
  var root = this;
  if (!Vizabi._require('d3'))
    return;
  d3.svg.worldMap = function () {
    return function d3_world_map() {
      var world = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 584.5 364.5"><path id="eur" d="M556.7,26.9l-35.5-7.3l-3.5,1.4l-49.9-5.2l-2.7,2l-45.8-4.1l-1.3-1.9l-15.3-2.2l-0.2,0.1h-0.1l-0.2,0.2l-6,0.6 l-0.5,0.5L372.4,17l-1.7,1.7l-5.8-3.1h-1.7l-1.5,3.7l1.8,2.5l-0.4,0.2l-10.1-1.5l-6.8,1.9l-5.3-0.6l-7.2,2.6l-4.2-1h-0.1l-3.1,3.2 l-0.9,0.2l-2.6,2.2l-2.3,0.8l-1.6,2h-1.7l-5.1-5.1l-1-0.2l-0.1-0.5l1.3-0.9l8.4,1.6l0.5-0.1l2.4-1.8l-0.8-0.9l-20.2-5.5l-16.9,3.4 L268,37l0.8,6.1l3.2,1.7l4-1l1.5,0.9l2.6,5.5h0.8l0.7,1.2l0.8,0.2l7.9-9.7l-2.9-5.4l8.5-8.9h0.5l1.3,1.7l-2.7,6.6l0.8,2.8l11.9,2.4 l-4,1.8l-3.5-0.3l-1.5,1.2l1,1.6l-0.1,2.2l-0.9-0.6H297l-1.8,1.2l-0.5,3.9l-2.3,2.2h-4.3l-4.2,1.9l-6.8-0.7l-0.6-0.4l2.5-1.7 l0.5-1.2l-0.9-1.7l-0.2-0.1l-2.3,0.5l-0.2-0.1l-0.2-3.4l-0.4-0.1l-2.6,3.9l1.3,3.7l-1.4,1.7L269,57l-18.9,13.1l0.1,1l1.7,1.6 l0.8,0.3l1.3,2.2l0.3,3.6l-3.1,4.5l-9.7-0.9l-1.3,1.5L239,97.9l0.4,1.1l5.1,3.1l0.2,0.8l1.6-0.2l0.1-0.2h0.1v-0.1l7.9-4.5l10-14.3 l10-2.8l1.2,0.5l11,11.5l0.2,2.3l-2,1.8l-1.9-0.4l-1.8,0.5l3.8,3.9l1.1-0.7l3.7-5.6l0.2-0.5l-0.9-1.9l0.2-0.4l2.3,0.3l0.8-1 l-1.7-0.9l-8.7-7.6l-0.5-4.5l1.4,0.2l10.4,8l3.4,9l1,0.5l0.5,0.6v1.5l4.5,6.1v0.4l0.7,1.1l3.7,1.3l1.4-1.6l-3.8-2.3l-0.1-1.7 l2.2-2.6l-6.3-6.3l5.6-2.2L306,90l5.8,8l4.2-0.6l2.7,0.9l1,4.7l0.7-0.1l1.8-2l-1.3-1.7l0.2-0.9h4.3l0.3,2.7l15.2-4.7l0.4-5.1 l1.5-0.9l2.5,2l3.9-2.1l1.4,1.5l0.3-3.9l-3.1-5.3l-1.3-8.6l2.9-2.5l-0.6-2.7l-3.8-3.8l4.5-6.9l6.8,1.6l1.1-3.1l9.2,3.8l13.3-3.1 l-1.8-6.7l0.2-1l8.7,7.4l22.2,7.4l4.3-2.7l1.5-4.5l1-0.5l0.2,0.2l6,0.4l1,1.2l1.7,0.8l0.5-0.3l7.5,2.9l7.5-4.2l1.5,1.8l22.1,0.8 l0.7-1.8l23.5-1.4l7,9.2l9.6-1.2l3.4,15.2l1,1.1l-0.2,0.2l1.7,1.7l0.5,0.1l1.8-2.2l1.6-5.3L508,56.7l-2.9-2.2l-5.5,0.3l-2.6-2.5 l1.8-7.8l0.5-0.3l0.2-0.9l3.4-1.7l14.2,0.6l1.3-4.8l1.6-1.2l0.4-0.1l4.3,1.2l0.1-0.1l0.2,0.1l3.1-2.5l1.7,0.9l-1,12l6.9,15.9l3.1-3 l0.1-0.3l2.3,1.1l0.8-2.2l-1.1-8.7l-4.8-5.8l0.1-2.6l0.8-1.5l4.5-2.2l2.2,0.2l4-3.7l2.1-0.3l1.1-1.7l-5.2-2.5l-0.5-1.7l2.9-1.7 l8.2,2.2l0.9-0.2l0.8-1.2L556.7,26.9 M331,87l-11.6-3.1l-8.9,2.9l-0.2-0.1l-0.5-1.9l2.9-7l2.9-2.5h1.7l2.1,1.1l2.3-1.7l1.8-3.4 l1.8-0.6l2.1,0.6l-0.8,3.9l7.7,7.3L331,87 M252.8,18.2l-5.8,5.6l-3.7,1.1l-1.1,4.3l-2.2,1.7l-0.2,1.2l0.9,1.7l7.8,1.2l-2.4,2.9 l-4.6,1.7l-5.9-2.9l2-1.8l1.9-0.8l-2.5-2.1l-11.4,1.7l-4.7,3.1l-8,1.7L203,49l-3.4,0.3l-3.7-2.8l-1.3-10.6l5.2-4.5l1.1-2l-1.9-3.3 l-0.5-0.3v-0.6l-0.5-0.3v-0.6l-0.6-0.3l-1.1-1.4l-3.1-1.4h-5.5l-4-1.7l71.2-3.4L252.8,18.2 M258.9,60.7l0.7,1.2l-10.5,1.5l3.4-1.5 l-0.1-1.5l-2.7-0.9l4.2-4.9l-2.7-2.7l-5.9,7.4l-4.4,0.8l1.1-2.7l-0.2-2.7l8.5-4.8l0.3-3.8l1-1.3l1.3,0.4l0.2,1.1l1.3,0.3l-0.8,3.2 l3.3,2.4l1.7,5.1l2.6,0.9L258.9,60.7"/><path id="afr" d="M322.7,114.7l-1-1.8l-6.5,2.3l-16-4.8l-2.3,1.7l-1.8,4.5l-16.9-8.6l-0.2-0.6l-0.3-5.5l-2-2.8l-29,4.4l-0.2-0.4 l-1.7,0.2l-0.1,1.1l-6.7,7l-0.5,1.9l-0.6,0.7l-0.3,3.3l-15.3,23.7l0.6,13.2l-1.4,3l1.1,7.6l12.1,17.9l6,2.8l7.1-1.9l4.5,0.8 l13.7-3.3l3.9,4.5h3.5l1.6,1.4l1.8,3.6l-1.1,10.7l9.2,27.4l-4,14.6l8.5,30.7l1.1,1.1v0.7h0.5l3.5,12.5l2,1.7l11.9-0.6l15-18.2v-3.9 l5.1-4.5l1.1-4.2l-1.1-5.9l10.5-12.2l0.6-0.3l1.6-3.7l-3.4-24l25-43.3l-13.1,1.1l-1.8-1.1l-24.7-48.6l0.9-0.4l0.6-1L322.7,114.7  M360.1,233.2l2.3,1.7l-8.6,30.5l-4.3-0.6l-2-7.6l2.8-14.6l6.4-4.4l2.8-4.9L360.1,233.2z"/><path id="ame" d="M134.8,152l-11.4,1.8l-3.1-1.7l5.3-1.3l-0.7-1.1l-3.3-1.4h-0.1l-8.1-0.9l-0.3-0.3l-0.3-1.5l-6.2-3.6l-3.4,0.8 l-1.6,1.3l-1.2-0.5l-0.7-1.7l3.8-1.6l9.1,0.7l9.5,5.3l0,0l3.3,1.8l1.7-0.5l6.6,2.8L134.8,152 M183.7,25.4l-0.5-1.5l-2.6-2.2 l-2.1-0.6l-2.9-2.2l-18.2-2.2l-5.1,3.7l2,4.3l-6,2.2l1-1.7l-4.6-1.9l-0.5-1.7l-1.1-1.2l-2.9,0.5l-2.1,4.2l-5.8,2.5l-15.5-2.2 l10.5-1.7l-1.3-4l-11.6-0.4l-3.2-1.5L96,20.7h5.8l4,1.9l-1.7,1l0.8,1l7.2,2.3l-78.9-5.3l-10,3.6l-0.4,4.4L18,31.1l1,1.8l1.7,1.2 l-5.5,4.5l-0.4,5.6L13.8,46l1.8,1.8l-4.4,6.2L22,43.7l1.8-0.5l1.3-1.2l13.4,4l4,4.2l-1.3,14l1.6,2.6l-3.3,1.3L39.4,70l2.7,2.6 L28.6,96.9l1.6,11.2l4.8,5.6l-0.2,3.4l2.5,6.1l-0.5,5l6.6,11.9L38,121.5l1.7-4l3.4,6.1l0.3,2.2l7.1,13.1l1.1,9.2l11.1,8.7l1.6,0.3 l1.3,0.9l5.5,1.2l3.4-0.9l5.5,4.2l0.3,0.5l0.8,0.3l2.1,1.9l5.5,0.5l0.2,0.6l0.8,0.3l4.8,8.9l2.3,1.5l0.2,0.5l7.1,3.4l1.6-1.7 l-5.1-2.2l-1.3-15.6l-6.3-2.2l-3.7,0.3v-4.6l3.7-8.9l-5.2-0.9l-0.5,0.3L83,151l-6.3,2.2l-4-2.8l-3.2-8.9l3.2-11.8l0.5-0.3l0.2-1.2 l2.6-3.1l8.5-3.6l6.3,1.8l4.5-3.1l9.2,1.1l2.5,3.1l1.5,7.8l1.3,1.8l2.1-4.5l-1.1-5l1.6-7l13.7-12.3l0.2-3.7l0.8-1.7l0.9-0.2l0.7,0.5 l0.6-1.9l15-8.8l2.2-3.9l11.9-5.1l-2.2,3.6l11.4-3.8l-5.2-1.7l-1.8-2.8l1.6-4.2l-0.8-0.9h-4.2l0.8-1.5l19.5-3.2l1.6,2.8l-4.5,4.2 l6,1.7l5.3-2.2l-6.3-7.6l4.5-6.1l-1.1-0.6l-0.2-0.5h-3.2l-3.7-13.4l-7.7,3.1l-1.8-1.9l0.2-3.9l-2.3-2.5l-3.4-1.5l-6.6,1.9l-2.1,4.2 l-1.1,0.6l-1.3,2.2l-0.3,3.4l-10,9.5l-0.8,2.8l-1.8,1.9l-2.1,0.3l-1.8-2.5l1.1-4.8l-11.9-6.1l-3.1-5.1l15-12l1.3,0.3l5.1-1.2 l1.1-1.2l0.4-1.2l3.4-0.3l-1.7,4.8L147,34l4.6,0.7l-2.2-2.9l-2.1-1.2l8.2-2.8l0.3-0.6l2-1.7l0.7,0.1l8.1-4.2l7.4,5.3l0.2,1.5l-6,1.5 l-1.8,2.2l3.7,5.3l3.4,1.2l2.3-2.2l2.9-1.2L179,33l-0.2-1.9l7.7-1.7L183.7,25.4 M119.7,74.5l0.8,3.1l1.7,1.8l3.3-0.2l5.4,4.7 l2.7,0.2l-0.5,1.7l-4.7-0.4l0.2-1.2l-2.6-0.9l-2,0.6l-2.6,3.4l3.1,1.7l-3.2,2.3l-2.6-1.2l0.1-9.3l-9.6,9.9L108,88l4.5-7l4.3-2 l-5.1-2.1l-4.8,0.5l0.2-1.7l1.3-1.2l8.7-2.2L119.7,74.5 M205.9,223.1l-1.3,3.1H204l-7.1,11.2l-1.9,18.2l-3.1,6.1h-0.5v0.6l-0.8,0.3 l-1.1,1.2l-2.7-0.3l-9.4,6.7l-7.7,21.6l-3.9,3.3l-5.1-1.1l2.1,3.3l0.5,5.3l-7.9,3.3l-1.4,1.5l-0.5,3.6l-1.1,0.6l-1.1-0.3l-1.8,0.9 l1.8,6.1l-1.8,5.6l3.4,6.1l-2,5.9l0.5,3.1l11.1,8.2l-0.2,0.5l-9.3-0.6l-4.3-5.1l-4.7-1.7l-8.6-17.1l0.5-1.7l-6-12.3l-4.5-56.7 l-12.4-10.2l-4.2-8.1l-0.8-0.6l-9.8-21.5l1.1-2.2l-0.3-2.6l-0.5-0.8l7.9-15.3l0.3-5.6l-1-2.8l1-3.9l1.8-0.3l9.7-8.2l2.1,0.3l0.8,5.1 l2.7-5.1l1.3-0.3l4.2,2.8h0.9l0.2,0.6l14.8,3.9l1.6,1.4l0.3,0.6l7.9,6.7l7.7,0.9l4.3,4l2,6.3l-1,4.6l4.4,1.4l1.1,2.2l5.2-1.1 l2.1,1.1l2.6,4l2.9-0.9l9,1.9l8.6,5.8L205.9,223.1"/><path id="asi" d="M322.9,118.9l22.8,42.5l13.5-5.9l16.8-19l-7.3-6.5l-0.7-3.4h-0.1l-5.7,5.2l-0.9,0.1l-3.2-4.4l-0.4-0.2l-0.7,1.7 l-1.2-0.4l-4.1-11.4l0.2-0.5l1.9-1.2l5.1,6.8l6.2,2.7l0.8-0.2l1.1-1.1l1.6,0.4l2.9,2.6l0.4,0.8l16.4,0.8l6.9,6.5l0.4,0.1l1.4-0.3 l0.3,0.1l-1.7,2.5l2.9,2.8h0.7l3.3-3.3l0.5,0.3l9.2,32.1l4,3.7l1.3-1.3h0.2l1.7,1.3l1.4,6.6l1.6,0.9l1.7-2.9l-2.3-7.3l-0.1,0.3v-0.2 l-1.7,0.6l-1.3-1.1l1.2-14.3l14.3-17.6l5.9-1.7l0.3,0.1l3.1,4.5l0.8,0.2l0.9,1.5l0.8,0.3l4.7,10.3l0.2,0.1l2-0.6l5.4,10.1l-0.3,10.5 l2.8,3.7l0,0l4.2,10.8l1.8,1.7l-1.1,2.4l-0.8-0.6l-1.9-4l-1.7-1.4l-0.3-0.9l-5.5-3.5l-2.4-0.3l-0.2,1.2l19.8,28.5l2.6-3.6l-5.7-11.2 l0.9-4l0.7-0.2l0.2-2.3l-9.3-18.6l-0.3-8.9l1.4-1.5l6.7,7.8l1.4,0.3l1.1-0.6l0.1,0.1l-0.2,3.4l0.6,0.5l0.5,0.2l7.4-7.9l-2-10.4 l-6.9-9.5l4.9-6l0.8,0.2l0.8,0.5l1.7,3.9l2.9-4.7l10.1-3.6l5.1-8.1l1.6-9.9l-2.5-2l1.1-1.7l-7.5-11.5l3.5-4.7l-6.1-0.9l-3.5-3.7 l4.1-4.3l0.8-0.1l1.4,0.9l0.6,2.9l2.8-1.3l3.9,1.4l0.9,3.2l2.3,0.5l5,9h0.4l2.3-2.4h0.3l1-1.5l-1.7-3.8l-5.8-5.9l2.1-4v-3.6l2.6-2.4 l0.5,0.1l0.2-0.1l-3.5-15.2l-0.2,0.1v-0.1l-9.3,1.2l-7.3-9.3L464,58.8l-0.8,1.9L441.2,60l-1.5-1.8l-0.2,0.1l0,0l-7.3,4.1l-7.5-3 l-0.5,0.3l-1.8-0.8l-0.9-1.2l-0.3,0.1l-0.1-0.1l-5.7-0.4l-0.3-0.2l0,0l0,0l-1,0.5l-1.5,4.5l-4.2,2.7l-16.8-4.4L377.5,50l0,0l-0.2,1 l1.8,6.7l-13.3,3l-9.2-3.8l-1.1,3.1l-6.7-1.6l-0.1,0.1h-0.2l-4.4,6.8l3.8,3.8l0.6,2.7l0,0l0,0L352,71l2.6,2.2V74l-2.3,1.9l-0.8,1.6 l1.6,3.9l0.9,0.3l1,1.1l2.6,0.9l1.7,1.7l-0.2,1.1l-1.5,2.8l2.1,3.7v4.5l-1.3,1.4l-3.8-0.9l-4.7-5.1v-0.6l-1.4-1.4l-3.9,2.1l-2.4-2.1 l-1.6,0.9l-0.3,5.1l-15.2,4.7l-1.7,9.8l-2.5,1.7L322.9,118.9 M531.1,99.3l-1,2l-4,1.7l-2.4,3l-3.3-2.5l-6.4,0.2l-0.2-0.7l8.9-4.2 l3.7-4.9l-0.6-3.3l-3.2-5.1l-0.7-0.4v-5.1l1.4-2.6l1.7,0.3l0.6,0.7h0.8l1.1,0.8l1.3,0.3l0.6,1.9l-1.7,2l-2.6-1.2L531.1,99.3  M500.5,130.3l1.9-0.9l-0.8,6.3l-1.6-0.3L500.5,130.3 M515.9,180.5l-1.7,0.4l-2.2-3.3l-3.6-2.2l4.3-2.5l0.9-3.1l-0.3-4.1l-4.6-2.1 l-2,0.5l-5.1,8.5l-2.4,0.3l-0.2-3.4l0.8-0.7l4.2-9.3l-1.8-3.7l1.4-9.3l2.4,1.8l1.6,3.6l-0.5,4.8l8,6.4l0.1-0.1l3.1,11.2L515.9,180.5 L515.9,180.5L515.9,180.5 M497.7,179.5l2.6,0.9l1.1,1.9l-1.8,5.1l0.8,7l-6,10.9l-9.2-1.7l-2.9-10.9L497.7,179.5L497.7,179.5  M509,194.8l-1.8,0.1L509,194.8 M515,193.9l-1.7,2.2l-2.4-0.2l-1.9-1.1l-3.3,1.3l-0.3,1.9l1.2,1.4l2.1-0.3l0.9-0.7l1.1,0.1l0.3,1.2 l-1.9,2.6l0.7,5.6l-2.3-2l-1-2l-1.5,1l0.9,5.2l-3.1-0.4l0.2-2.8l-1.4-2.5l2.9-10.5l3.2-1.6l3.8,1.2l3.4-1.1L515,193.9 M530.7,198.1 l2.5,0.5l0.4,0.4l2,5.3l2.1-2.2l4.2-1.7l14.5,11.5l2.4,0.5l4-2.6l-1.2,4.7l-3.5,1.4l-0.5,1.4l0.1,1.3l4.4,6.5l-4.4-1.5l-5.2-7.5 l-5.6,4.4l-5.6-2l-1.2-1.5l1.3-1.5l-1.9-2.4l-0.3-0.8l-8.5-5l-0.9-4.7l-3.4-3.1l2.4-1.4H530.7 M476.6,212.1l19.1,5l3.1-0.8l4.4,1.4 l3.3-0.9l12.4,2.1l-0.1,0.6l-8.2,4v-1.9l-35.4-5.6l-1.5-1.8l2.5-1.9H476.6 M569.4,280.1l-19,14.6l-0.7-1.1l2.2-4.6l5.1-3l7.4-9.7 l0.9-4.3l4.8,5.1L569.4,280.1 M554.3,267.3l-11.1,18.2l-5.7,3.1l-4.8,7.7l-2.5,0.5l-0.6-1.9l0.5-3.4l2.8-2.9l-6.6-0.8l-1.6-1.4 l-1.7-8.4l-0.9-0.9l-3.1,1.1l-5.2-3.9l-32.3,7.3l-2.3-1.9l2.3-4.5l0.6-21.9l1.8-2.5l13.9-6.4l4.3-4.8l0.3-0.9l10-9.2l4.2,1.9l5.5-7 l4.2-1.4l4.9,2l-1.1,5l2.8,4.8l4.5,2.8l3.2-4.5l2.5-11.7l4.6,10.8v7.6l7.7,18.5L554.3,267.3L554.3,267.3L554.3,267.3L554.3,267.3 L554.3,267.3L554.3,267.3"/></svg>';

      function worldMap(container) {
        container.selectAll('path').remove();
        container.html(world);
        container.selectAll('path').datum(function () {
          return {
            'geo.name': d3.select(this).attr('id'),
            'geo.region': d3.select(this).attr('id')
          };
        });
      }

      return worldMap;
    }();
  };
}.call(this));

/*!
 * VIZABI GAPMINDER PREFERENCES (included only in Gapminder build)
 */

(function () {
    'use strict';
    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;

    //DEFAULT OPTIONS
    var BarChart = this.Vizabi.Tool.get('BarChart');
    var LineChart = this.Vizabi.Tool.get('LineChart');
    var BubbleChart = this.Vizabi.Tool.get('BubbleChart');
    var MountainChart = this.Vizabi.Tool.get('MountainChart');
    var MountainChartComponent = this.Vizabi.Component.get('gapminder-mountainchart');
    var PopByAge = this.Vizabi.Tool.get('PopByAge');


    var language = {
        id: "en",
        strings: {}
    };

    var locationArray = window.location.href.split("/");
    var localUrl = locationArray.splice(0,locationArray.indexOf("preview")).join("/");
    localUrl += "/preview/"; 
    var onlineUrl = "http://static.gapminderdev.org/vizabi/master/preview/";
    
    //TODO: remove hardcoded path from source code
    Vizabi._globals.gapminder_paths = {
        baseUrl: localUrl
    };

    BarChart.define('default_options', {
        state: {
            time: {
                start: "1952",
                end: "2012",
                value: "2000",
                step: 1,
                speed: 300,
                formatInput: "%Y"
            },
            entities: {
                dim: "geo",
                show: {
                    _defs_: {
                        "geo": ["*"],
                        "geo.cat": ["region"]
                    }
                }
            },
            marker: {
                space: ["entities", "time"],
                label: {
                    use: "property",
                    which: "geo.name"
                },
                axis_y: {
                    use: "indicator",
                    which: "lex",
                    scaleType: "linear",
                    min: 0,
                    max: 90,
                    allow: {scales: ["linear", "log"]}
                },
                axis_x: {
                    use: "property",
                    which: "geo.name",
                    allow: {scales: ["ordinal"]}
                },
                color: {
                    use: "property",
                    which: "geo.region",
                    scaleType: "ordinal"
                }
            }
        },
        data: {
            reader: "waffle-server",
            splash: true
        },
        language: language,
        ui: {
            buttons: []
        }
    });
    
    MountainChart.define('datawarning_content', {
        title: "Income data has large uncertainty!",
        body: "There are many different ways to estimate and compare income. Different methods are used in different countries and years. Unfortunately no data source exists that would enable comparisons across all countries, not even for one single year. Gapminder has managed to adjust the picture for some differences in the data, but there are still large issues in comparing individual countries. The precise shape of a country should be taken with a large grain of salt.<br/><br/> Gapminder strongly agrees with <a href='https://twitter.com/brankomilan' target='_blank'>Branko Milanovic</a> about the urgent need for a comparable global income survey, especially for the purpose of monitoring the UN poverty-goal.<br/><br/> We are constantly improving our datasets and methods. Please expect revision of this graph within the coming months. <br/><br/> Learn more about the datasets and methods in this <a href='http://www.gapminder.org/news/data-sources-dont-panic-end-poverty' target='_blank'>blog post</a>",
        doubtDomain: [1800, 1950, 2015],
        doubtRange: [1.0, 0.8, 0.6]
    });

    MountainChart.define('default_options', {
        state: {
            time: {
                start: 1800,
                end: 2015,
                value: 2015,
                step: 1,
                speed: 100,
                formatInput: "%Y",
                xLogStops: [1, 2, 5],
                yMaxMethod: "latest",
                povertyline: 1.82,
                povertyCutoff: 0.2,
                povertyFade: 0.7,
                gdpFactor: 1.039781626,
                //0.9971005335,
                gdpShift: -1.127066411,
                //-1.056221322,
                xPoints: 50
            },
            entities: {
                dim: "geo",
                opacitySelectDim: 0.3,
                opacityRegular: 0.6,
                show: {
                    _defs_: {
                        "geo": ['*'], //['swe', 'nor', 'fin', 'bra', 'usa', 'chn', 'jpn', 'zaf', 'ind', 'ago'],
                        "geo.cat": ["country"]
                    }
                }
            },
            marker: {
                space: ["entities", "time"],
                label: {
                    use: "property",
                    which: "geo.name"
                },
                axis_y: {
                    use: "indicator",
                    which: "pop",
                    scaleType: 'linear'
                },
                axis_x: {
                    use: "indicator",
                    //which: "mean",
                    which: "gdp_per_cap",
                    scaleType: 'log',
                    min: 0.11, //0
                    max: 500 //100
                },
                size: {
                    use: "indicator",
                    //which: "variance",
                    which: "gini",
                    scaleType: 'linear'
                },
                color: {
                    use: "property",
                    which: "geo.region",
                    scaleType: "ordinal"
                },
                stack: {
                    use: "value",
                    which: "all" // set a property of data or values "all" or "none"
                },
                group: {
                    which: "geo.region", // set a property of data
                    manualSorting: ["eur", "ame", "afr", "asi"],
                    merge: false
                }
            }
        },
        language: language,
        data: {
            //reader: "waffle-server"
            reader: "csv-file",
            path: Vizabi._globals.gapminder_paths.baseUrl + "local_data/waffles/dont-panic-poverty.csv",
            splash: true
            //path: "https://dl.dropboxusercontent.com/u/21736853/data/process/inc_mount_data_2015test/mountains-pop-gdp-gini-1800-2030.csv"
        }
    });


    LineChart.define('default_options', {
        state: {
            time: {
                start: 1990,
                end: 2012,
                value: 2012,
                step: 1,
                speed: 300,
                formatInput: "%Y"
            },
            //entities we want to show
            entities: {
                dim: "geo",
                show: {
                    _defs_: {
                        "geo": ["*"],
                        "geo.cat": ["region"]
                    }
                }
            },
            //how we show it
            marker: {
                space: ["entities", "time"],
                label: {
                    use: "property",
                    which: "geo.name"
                },
                axis_y: {
                    use: "indicator",
                    which: "gdp_per_cap",
                    scaleType: "log"
                },
                axis_x: {
                    use: "indicator",
                    which: "time",
                    scaleType: "time"
                },
                color: {
                    use: "property",
                    which: "geo",
                    palette: {
                        "asi": "#FF5872",
                        "eur": "#FFE700",
                        "ame": "#7FEB00",
                        "afr": "#00D5E9",
                        "_default": "#ffb600"
                    }
                },
                color_shadow: {
                    use: "property",
                    which: "geo",
                    palette: {
                        "asi": "#FF5872",
                        "eur": "#FFE700",
                        "ame": "#7FEB00",
                        "afr": "#00D5E9",
                        "_default": "#ffb600"
                    }
                }
            }
        },

        data: {
            reader: "waffle-server"
        },
        language: language,
        ui: {
            'vzb-tool-line-chart': {
                entity_labels: {
                    min_number_of_entities_when_values_hide: 2 //values hide when showing 2 entities or more
                },
                whenHovering: {
                    hideVerticalNow: 0,
                    showProjectionLineX: true,
                    showProjectionLineY: true,
                    higlightValueX: true,
                    higlightValueY: true,
                    showTooltip: 0
                }
            },
            buttons: []
        }
    });

    BubbleChart.define('datawarning_content', {
        title: "",
        body: "Comparing the size of economy across countries and time is not trivial. The methods vary and the prices change. Gapminder has adjusted the picture for many such differences, but still we recommend you take these numbers with a large grain of salt.<br/><br/> Countries on a lower income levels have lower data quality in general, as less resources are available for compiling statistics. Historic estimates of GDP before 1950 are generally also more rough. <br/><br/> Data for child mortality is more reliable than GDP per capita, as the unit of comparison, dead children, is universally comparable across time and place. This is one of the reasons this indicator has become so useful to measure social progress. But the historic estimates of child mortality are still suffering from large uncertainties.<br/><br/> Learn more about the datasets and methods in this <a href='http://www.gapminder.org/news/data-sources-dont-panic-end-poverty' target='_blank'>blog post</a>",
        doubtDomain: [1800, 1950, 2015],
        doubtRange: [1.0, 0.3, 0.2]
    });
    
    BubbleChart.define('default_options', {

        state: {
            time: {
                start: "1800",
                end: "2015",
                value: "2015",
                step: 1,
                speed: 300,
                formatInput: "%Y",
                round: "ceil",
                trails: true,
                lockNonSelected: 0,
                adaptMinMaxZoom: false
            },
            entities: {
                dim: "geo",
                show: {
                    _defs_: {
                        "geo": ["*"],
                        "geo.cat": ["country"]
                    }
                }
            },
            marker: {
                space: ["entities", "time"],
                type: "geometry",
                shape: "circle",
                label: {
                    use: "property",
                    which: "geo.name"
                },
                axis_y: {
                    use: "indicator",
                    which: "u5mr",
                    scaleType: "linear",
                    allow: {scales: ["linear", "log", "genericLog"]}
                },
                axis_x: {
                    use: "indicator",
                    which: "gdp_per_cap",
                    scaleType: "log",
                    allow: {scales: ["linear", "log", "genericLog"]}
                },
                color: {
                    use: "property",
                    which: "geo.region",
                    scaleType: "ordinal"
                },
                size: {
                    use: "indicator",
                    which: "pop",
                    scaleType: "linear",
                    allow: {scales: ["linear", "log"]},
                    min: 0.04,
                    max: 0.90 
                }
            }
        },
        data: {
            //reader: "waffle-server",
            reader: "csv-file",
            //path: Vizabi._globals.gapminder_paths.baseUrl + "local_data/waffles/basic-indicators.csv",
            path: Vizabi._globals.gapminder_paths.baseUrl + "local_data/waffles/dont-panic-poverty.csv",
            splash: true
            //path: "https://dl.dropboxusercontent.com/u/21736853/data/process/childsurv_2015test/bub_data_u5mr_inc_etc_20150823.csv"
        },
        language: language,
        ui: {
            'vzb-tool-bubble-chart': {
                whenHovering: {
                    showProjectionLineX: true,
                    showProjectionLineY: true,
                    higlightValueX: true,
                    higlightValueY: true
                },
                labels: {
                    autoResolveCollisions: true,
                    dragging: true
                }
            },
            buttons: []
        }
    });

    PopByAge.define('default_options', {
        state: {
            time: {
                value: '2013'
            },
            entities: {
                dim: "geo",
                show: {
                    _defs_: {
                        "geo": ["usa"]
                    }
                }
            },
            entities_age: {
                dim: "age",
                show: {
                    _defs_: {
                        "age": [[1, 100]] //show 1 through 100
                    }
                }
            },
            marker: {
                space: ["entities", "entities_age", "time"],
                group_by: 1,
                label: {
                    use: "indicator",
                    which: "age"
                },
                label_name: {
                    use: "property",
                    which: "geo"
                },
                axis_y: {
                    use: "indicator",
                    which: "age"
                },
                axis_x: {
                    use: "indicator",
                    which: "population"
                },
                color: {
                    use: "value",
                    which: "#ffb600"
                }
            }
        },
        data: {
            reader: "csv-file",
            path: Vizabi._globals.gapminder_paths.baseUrl + "local_data/waffles/{{geo}}.csv",
            splash: true
        },
        language: language,
        ui: {
            buttons: []
        }
    });

    //Waffle Server Reader custom path
    var WaffleReader = this.Vizabi.Reader.get('waffle-server');
    WaffleReader.define('basepath', "http://52.18.235.31:8001/values/waffle");

    //preloading mountain chart precomputed shapes
    MountainChartComponent.define("preload", function(done) {
        var shape_path = Vizabi._globals.gapminder_paths.baseUrl + "local_data/mc_precomputed_shapes.json";

        d3.json(shape_path, function(error, json) {
            if (error) return console.warn("Failed loading json " + shape_path + ". " + error);
            MountainChartComponent.define('precomputedShapes', json);
            done.resolve();
        });
    });

    //preloading metadata for all charts
    Vizabi.Tool.define("preload", function(promise) {

        var _this = this; 
    
        var metadata_path = Vizabi._globals.gapminder_paths.baseUrl + "local_data/waffles/metadata.json";
        var globals = Vizabi._globals;
        
        
        //TODO: concurrent
        //load language first
        this.preloadLanguage().then(function() {
            //then metadata
            d3.json(metadata_path, function(metadata) {
                
                globals.metadata = metadata;
                
                //TODO: this is a hack that helps to hide indicators which are not present in data
                globals.metadata.indicatorsArray = utils.keys(metadata.indicatorsDB)
                    .filter(function(f){
                        var one = metadata.indicatorsDB[f];
                        return one.allowCharts.indexOf(_this.name)!=-1 || one.allowCharts.indexOf("*")!=-1;
                    });
                
                promise.resolve();
            });
        });

    });

    Vizabi.Tool.define("preloadLanguage", function() {

        var promise = new Vizabi.Promise();

        var langModel = this.model.language;
        var translation_path = Vizabi._globals.gapminder_paths.baseUrl + "local_data/translation/"+langModel.id+".json";

        if(langModel && !langModel.strings[langModel.id]) {
            d3.json(translation_path, function(langdata) {
                langModel.strings[langModel.id] = langdata;
                promise.resolve();
            });
        }
        else {
            promise = promise.resolve();
        }

        return promise;

    });

    //if(datawarning_content) Vizabi.Tool.get("BubbleChart").define("datawarning_content",datawarning_content);
    
}.call(this));

//# sourceMappingURL=vizabi.js.map