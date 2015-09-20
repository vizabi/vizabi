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
