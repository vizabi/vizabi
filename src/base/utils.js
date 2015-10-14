/*
 * returns unique id with optional prefix
 * @param {String} prefix
 * @returns {String} id
 */
export var uniqueId = function() {
  var id = 0;
  return function(p) {
    return p ? p + (id += 1) : id += 1;
  };
}();

/*
 * checks whether obj is a DOM element
 * @param {Object} obj
 * @returns {Boolean}
 * from underscore: https://github.com/jashkenas/underscore/blob/master/underscore.js
 */
export var isElement = function(obj) {
  return !!(obj && obj.nodeType === 1);
};

/*
 * checks whether obj is an Array
 * @param {Object} obj
 * @returns {Boolean}
 * from underscore: https://github.com/jashkenas/underscore/blob/master/underscore.js
 */
export var isArray = Array.isArray || function(obj) {
  return toString.call(obj) === '[object Array]';
};

/*
 * checks whether obj is an object
 * @param {Object} obj
 * @returns {Boolean}
 * from underscore: https://github.com/jashkenas/underscore/blob/master/underscore.js
 */
export var isObject = function(obj) {
  var type = typeof obj;
  return type === 'object' && !!obj;
};

/*
 * checks whether arg is a date
 * @param {Object} arg
 * @returns {Boolean}
 */
export var isDate = function(arg) {
  return arg instanceof Date;
};

/*
 * checks whether arg is a string
 * @param {Object} arg
 * @returns {Boolean}
 */
export var isString = function(arg) {
  return typeof arg === 'string';
};

/*
 * checks whether arg is a NaN
 * @param {*} arg
 * @returns {Boolean}
 * from lodash: https://github.com/lodash/lodash/blob/master/lodash.js
 */
export var isNaN = function(arg) {
  // A `NaN` primitive is the only number that is not equal to itself
  return isNumber(arg) && arg !== +arg;
};

/*
 * checks whether arg is a number. NaN is a number too
 * @param {*} arg
 * @returns {Boolean}
 * from lodash: https://github.com/lodash/lodash/blob/master/lodash.js
 * dependencies are resolved and included here
 */
export var isNumber = function(arg) {
  return typeof arg === 'number' || !!arg && typeof arg === 'object' && Object.prototype.toString.call(arg) ===
    '[object Number]';
};

/*
 * checks whether obj is a plain object {}
 * @param {Object} obj
 * @returns {Boolean}
 */
export var isPlainObject = function(obj) {
  return obj !== null && Object.prototype.toString.call(obj) === '[object Object]';
};

/*
 * checks whether two arrays are equal
 * @param {Array} a
 * @param {Array} b
 * @returns {Boolean}
 */
export var arrayEquals = function(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;
  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

export var getViewportPosition = function(element) {
  var xPosition = 0;
  var yPosition = 0;

  while(element) {
    xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
    yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
    element = element.offsetParent;
  }

  return {
    x: xPosition,
    y: yPosition
  };
};

export var findScrollableAncestor = function(node) {
  var no = d3.select(node).node();
  var scrollable = ["scroll", "auto"];

  while(no && no.tagName !== "HTML" && scrollable.indexOf(d3.select(no).style("overflow")) == -1) {
    no = no.parentNode;
  }

  return no;
};

export var roundStep = function(number, step) {
  return Math.round(number / step) * step;
};

/*
 * transforms a string into a validated fload value
 * @param {string} string to be transformed
 */
export var strToFloat = function(string) {
  return +string.replace(/[^\d.-]/g, '');
};

/*
 * loops through an object or array
 * @param {Object|Array} obj object or array
 * @param {Function} callback callback function
 * @param {Object} ctx context object
 */
export var forEach = function(obj, callback, ctx) {
  if(!obj) {
    return;
  }
  var i;
  if(isArray(obj)) {
    for(i = 0; i < obj.length; i += 1) {
      if(callback.apply(ctx, [
          obj[i],
          i
        ]) === false) {
        break;
      }
    }
  } else {
    var keys = Object.keys(obj);
    var size = keys.length;
    for(i = 0; i < size; i += 1) {
      if(callback.apply(ctx, [
          obj[keys[i]],
          keys[i]
        ]) === false) {
        break;
      }
    }
  }
};

/*
 * extends an object
 * @param {Object} destination object
 * @returns {Object} extented object
 */
export var extend = function(dest) {
  //objects to overwrite dest are next arguments
  var objs = Array.prototype.slice.call(arguments, 1);
  //loop through each obj and each argument, left to right
  forEach(objs, function(obj, i) {
    forEach(obj, function(value, k) {
      if(obj.hasOwnProperty(k)) {
        dest[k] = value;
      }
    });
  });
  return dest;
};

/*
 * merges objects instead of replacing
 * @param {Object} destination object
 * @returns {Object} merged object
 */
export var merge = function(dest) {
  //objects to overwrite dest are next arguments
  var objs = Array.prototype.slice.call(arguments, 1);
  //loop through each obj and each argument, left to right
  forEach(objs, function(obj, i) {
    forEach(obj, function(value, k) {
      if(obj.hasOwnProperty(k)) {
        if(dest.hasOwnProperty(k)) {
          if(!isArray(dest[k])) {
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
};

/*
 * clones an object (shallow copy)
 * @param {Object} src original object
 * @param {Array} arr filter keys
 * @returns {Object} cloned object
 */
export var clone = function(src, arr, exclude) {
  if(isArray(src)) {
    return src.slice(0);
  }
  var clone = {};
  forEach(src, function(value, k) {
    if((arr && arr.indexOf(k) === -1) || (exclude && exclude.indexOf(k) !== -1)) {
      return;
    }
    if(src.hasOwnProperty(k)) {
      clone[k] = value;
    }
  });
  return clone;
};

/*
 * deep clones an object (deep copy)
 * @param {Object} src original object
 * @returns {Object} cloned object
 */
export var deepClone = function(src) {
  var clone = {};
  if(isArray(src)) clone = [];

  forEach(src, function(value, k) {
    if(isObject(value) || isArray(value)) {
      clone[k] = deepClone(value);
    } else {
      clone[k] = value;
    }
  });
  return clone;
};

/*
 * Prints message to timestamp
 * @param {Arr} arr
 * @param {Object} el
 */
export var without = function(arr, el) {
  var idx = arr.indexOf(el);
  if(idx !== -1) {
    arr.splice(idx, 1);
  }
  return arr;
};

/*
 * unique items in an array
 * @param {Array} arr original array
 * @param {Function} func optional evaluation function
 * @returns {Array} unique items
 * Based on:
 * http://stackoverflow.com/questions/1960473/unique-values-in-an-array
 */
export var unique = function(arr, func) {
  var u = {};
  var a = [];
  if(!func) {
    func = function(d) {
      return d;
    };
  }
  for(var i = 0, l = arr.length; i < l; i += 1) {
    var key = func(arr[i]);
    if(u.hasOwnProperty(key)) {
      continue;
    }
    a.push(arr[i]);
    u[key] = 1;
  }
  return a;
};

/*
 * unique items in an array keeping the last item
 * @param {Array} arr original array
 * @param {Function} func optional evaluation function
 * @returns {Array} unique items
 * Based on the previous method
 */
export var uniqueLast = function(arr, func) {
  var u = {};
  var a = [];
  if(!func) {
    func = function(d) {
      return d;
    };
  }
  for(var i = 0, l = arr.length; i < l; i += 1) {
    var key = func(arr[i]);
    if(u.hasOwnProperty(key)) {
      a.splice(u[key], 1); //remove old item from array
    }
    a.push(arr[i]);
    u[key] = a.length - 1;
  }
  return a;
};

/*
 * returns first value that passes the test
 * @param {Array} arr original collection
 * @returns {Function} func test function
 */
export var find = function(arr, func) {
  var found;
  forEach(arr, function(i) {
    if(func(i)) {
      found = i;
      return false; //break
    }
  });
  return found;
};

/*
 * filters an array based on object properties
 * @param {Array} arr original array
 * @returns {Object} filter properties to use as filter
 */
export var filter = function(arr, filter) {
  var index = -1;
  var length = arr.length;
  var resIndex = -1;
  var result = [];
  var keys = Object.keys(filter);
  var s_keys = keys.length;
  var i;
  var f;
  while((index += 1) < length) {
    var value = arr[index];
    var match = true;
    for(i = 0; i < s_keys; i += 1) {
      f = keys[i];
      if(!value.hasOwnProperty(f) || value[f] !== filter[f]) {
        match = false;
        break;
      }
    }
    if(match) {
      result[resIndex += 1] = value;
    }
  }
  return result;
};

/*
 * filters an array based on object properties.
 * Properties may be arrays determining possible values
 * @param {Array} arr original array
 * @returns {Object} filter properties to use as filter
 */
export var filterAny = function(arr, filter, wildcard) {
  var index = -1;
  var length = arr.length;
  var resIndex = -1;
  var result = [];
  var keys = Object.keys(filter);
  var s_keys = keys.length;
  var i, f;
  while((index += 1) < length) {
    var value = arr[index];
    //normalize to array
    var match = true;
    for(i = 0; i < s_keys; i += 1) {
      f = keys[i];
      if(!value.hasOwnProperty(f) || !matchAny(value[f], filter[f], wildcard)) {
        match = false;
        break;
      }
    }
    if(match) {
      result[resIndex += 1] = value;
    }
  }
  return result;
};

/*
 * checks if the value matches the comparison value or any in array
 * compare may be an determining possible values
 * @param value original value
 * @param compare value or array
 * @param {String} wildc wildcard value
 * @returns {Boolean} try
 */
export var matchAny = function(values, compare, wildc) {
  //normalize value
  if(!isArray(values)) values = [values];
  if(!wildc) wildc = "*"; //star by default
  var match = false;
  for(var e = 0; e < values.length; e++) {
    var value = values[e];

    if(!isArray(compare) && value == compare) {
      match = true;
      break;
    } else if(isArray(compare)) {
      var found = -1;
      for(var i = 0; i < compare.length; i++) {
        var c = compare[i];
        if(!isArray(c) && (c == value || c === wildc)) {
          found = i;
          break;
        } else if(isArray(c)) { //range
          var min = c[0];
          var max = c[1] || min;
          if(value >= min && value <= max) {
            found = i;
            break;
          }
        }
      }
      if(found !== -1) {
        match = true;
        break;
      }
    }
  }
  return match;
};

/*
 * maps all rows according to the formatters
 * @param {Array} original original dataset
 * @param {Object} formatters formatters object
 * @returns {Boolean} try
 */
export var mapRows = function(original, formatters) {

  function mapRow(value, fmt) {
    if(!isArray(value)) {
      return fmt(value);
    } else {
      var res = [];
      for(var i = 0; i < value.length; i++) {
        res[i] = mapRow(value[i], fmt);
      }
      return res;
    }
  }

  var columns = Object.keys(formatters);
  var columns_s = columns.length;
  original = original.map(function(row) {
    for(var i = 0; i < columns_s; i++) {
      var col = columns[i],
        new_val;
      try {
        new_val = mapRow(row[col], formatters[col]);
      } catch(e) {
        new_val = row[col];
      }
      row[col] = new_val;
    }
    return row;
  });

  return original;
};

/*
 * Converts radius to area, simple math
 * @param {Number} radius
 * @returns {Number} area
 */
export var radiusToArea = function(r) {
  return r * r * Math.PI;
};

/*
 * Converts area to radius, simple math
 * @param {Number} area
 * @returns {Number} radius
 */
export var areaToRadius = function(a) {
  return Math.sqrt(a / Math.PI);
};

/*
 * Prints message to timestamp
 * @param {String} message
 */
export var timeStamp = function(message) {
  if(console && typeof console.timeStamp === 'function') {
    console.timeStamp(message);
  }
};

/*
 * Prints warning
 * @param {String} message
 */
export var warn = function(message) {
  message = Array.prototype.slice.call(arguments).join(' ');
  if(console && typeof console.warn === 'function') {
    console.warn(message);
  }
};

/*
 * Prints message for group
 * @param {String} message
 */
export var groupCollapsed = function(message) {
  message = Array.prototype.slice.call(arguments).join(' ');
  if(console && typeof console.groupCollapsed === 'function') {
    console.groupCollapsed(message);
  }
};

/*
 * Prints end of group
 * @param {String} message
 */
export var groupEnd = function() {
  if(console && typeof console.groupEnd === 'function') {
    console.groupEnd();
  }
};

/*
 * Prints error
 * @param {String} message
 */
export var error = function(message) {
  message = Array.prototype.slice.call(arguments).join(' ');
  if(console && typeof console.error === 'function') {
    console.error(message);
  }
};

/*
 * Count the number of decimal numbers
 * @param {Number} number
 */
export var countDecimals = function(number) {
  if(Math.floor(number.valueOf()) === number.valueOf()) {
    return 0;
  }
  return number.toString().split('.')[1].length || 0;
};

/*
 * Adds class to DOM element
 * @param {Element} el
 * @param {String} className
 */
export var addClass = function(el, className) {
  if(el.classList) {
    el.classList.add(className);
  } else {
    //IE<10
    el.className += ' ' + className;
  }
};

/*
 * Remove class from DOM element
 * @param {Element} el
 * @param {String} className
 */
export var removeClass = function(el, className) {
  if(el.classList) {
    el.classList.remove(className);
  } else {
    //IE<10
    el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'),
      ' ');
  }
};

/*
 * Adds or removes class depending on value
 * @param {Element} el
 * @param {String} className
 * @param {Boolean} value
 */
export var classed = function(el, className, value) {
  if(value === true) {
    addClass(el, className);
  } else if(value === false) {
    removeClass(el, className);
  } else {
    return hasClass(el, className);
  }
};

/*
 * Checks whether a DOM element has a class or not
 * @param {Element} el
 * @param {String} className
 * @return {Boolean}
 */
export var hasClass = function(el, className) {
  if(el.classList) {
    return el.classList.contains(className);
  } else {
    //IE<10
    return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
  }
};

/*
 * Throttles a function
 * @param {Function} func
 * @param {Number} ms duration
 */
export var throttle = function(func, ms) {

  var isThrottled = false,
    savedArgs,
    savedThis,
    wrapper = function() {

      if(isThrottled) {
        savedArgs = arguments;
        savedThis = this;
        return;
      }

      func.apply(this, arguments);

      isThrottled = true;

      setTimeout(function() {
        isThrottled = false;
        if(savedArgs) {
          wrapper.apply(savedThis, savedArgs);
          savedArgs = savedThis = null;
        }
      }, ms);
    }

  return wrapper;
};

/*
 * Returns keys of an object as array
 * @param {Object} arg
 * @returns {Array} keys
 */
export var keys = function(arg) {
  return Object.keys(arg);
};

/*
 * returns the values of an object in an array format
 * @param {Object} obj
 * @return {Array}
 */
export var values = function(obj) {
  var arr;
  var keys = Object.keys(obj);
  var size = keys.length;
  for(var i = 0; i < size; i += 1) {
    (arr = arr || []).push(obj[keys[i]]);
  }
  return arr;
};


/*
 * Computes the minumum value in an array
 * @param {Array} arr
 */
export var arrayMin = function(arr) {
  return arr.reduce(function(p, v) {
    return(p < v ? p : v);
  });
};

/*
 * Computes the minumum value in an array
 * @param {Array} arr
 */
export var arrayMax = function(arr) {
  return arr.reduce(function(p, v) {
    return(p > v ? p : v);
  });
};

/*
 * Computes the mean of an array
 * @param {Array} arr
 */
export var arrayMean = function(arr) {
  return arraySum(arr) / arr.length;
};

/*
 * Computes the sum of an array
 * @param {Array} arr
 */
export var arraySum = function(arr) {
  return arr.reduce(function(a, b) {
    return a + b;
  });
};

/*
 * Computes the median of an array
 * @param {Array} arr
 */
export var arrayMedian = function(arr) {
  arr = arr.sort(function(a, b) {
    return a - b;
  });
  var middle = Math.floor((arr.length - 1) / 2);
  if(arr.length % 2) {
    return arr[middle];
  } else {
    return(arr[middle] + arr[middle + 1]) / 2;
  }
};

/*
 * Returns the last value of array
 * @param {Array} arr
 */
export var arrayLast = function(arr) {
  if(!arr.length) return null;
  return arr[arr.length - 1];
};

/*
 * Returns the resulting object of the difference between two objects
 * @param {Object} obj2
 * @param {Object} obj1
 * @returns {Object}
 */
export var diffObject = function(obj2, obj1) {
  var diff = {};
  forEach(obj2, function(value, key) {
    if(!obj1.hasOwnProperty(key)) {
      diff[key] = value;
    }
    else if(value !== obj1[key]) {
      if(isPlainObject(value) && isPlainObject(obj1[key])) {
        var d = diffObject(value, obj1[key]);
        if(Object.keys(d).length > 0) {
          diff[key] = d;
        }
      }
      else if(!isArray(value) || !isArray(obj1[key]) || !arrayEquals(value, obj1[key])) {
        diff[key] = value;
      }
    }
  });
  return diff;
};

/*
 * Returns the resulting object without _defs_ leveling
 * @param {Object} obj
 * @returns {Object}
 */
export var flattenDefaults = function(obj) {
  var flattened = {};
  forEach(obj, function(value, key) {
    if(isPlainObject(value) && value._defs_) {
      flattened[key] = value._defs_;
    }
    else if(isPlainObject(value)) {
      flattened[key] = flattenDefaults(value);
    }
    else {
      flattened[key] = value;
    }
  });
  return flattened;
};

/*
 * Defers a function
 * @param {Function} func
 */
export var defer = function(func) {
  setTimeout(func, 1);
};

/*
 * Defers a function
 * @param {Function} func
 */
export var delay = function(func, delay) {
  setTimeout(func, delay);
};

/*
 * Creates a hashcode for a string or array
 * @param {String|Array} str
 * @return {Number} hashCode
 */
export var hashCode = function(str) {
  if(!isString(str)) {
    str = JSON.stringify(str);
  }
  var hash = 0;
  var size = str.length;
  var c;
  if(size === 0) {
    return hash;
  }
  for(var i = 0; i < size; i += 1) {
    c = str.charCodeAt(i);
    hash = (hash << 5) - hash + c;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

/*
 * Performs an ajax request
 * @param {Object} options
 * @param {String} className
 * @return {Boolean}
 */
export var ajax = function(options) {
  var request = new XMLHttpRequest();
  request.open(options.method, options.url, true);
  if(options.method === 'POST' && !options.json) {
    request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
  } else if(options.method === 'POST' && options.json) {
    request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
  }
  request.onload = function() {
    if(request.status >= 200 && request.status < 400) {
      // Success!
      var data = options.json ? JSON.parse(request.responseText) : request.responseText;
      if(options.success) {
        options.success(data);
      }
    } else {
      if(options.error) {
        options.error();
      }
    }
  };
  request.onerror = function() {
    if(options.error) {
      options.error();
    }
  };
  request.send(options.data);
};

/*
 * Performs a GET http request
 */
export var get = function(url, pars, success, error, json) {
  pars = pars || [];
  forEach(pars, function(value, key) {
    pars.push(key + '=' + value);
  });
  url = pars.length ? url + '?' + pars.join('&') : url;
  ajax({
    method: 'GET',
    url: url,
    success: success,
    error: error,
    json: json
  });
};

/*
 * Performs a POST http request
 */
export var post = function(url, pars, success, error, json) {
  ajax({
    method: 'POST',
    url: url,
    success: success,
    error: error,
    json: json,
    data: pars
  });
};

/**
 * Make function memoized
 * @param {Function} fn
 * @returns {Function}
 */
export var memoize = function(fn) {
  return function() {
    var args = Array.prototype.slice.call(arguments);
    var hash = '';
    var i = args.length;
    var currentArg = null;

    while(i--) {
      currentArg = args[i];
      hash += (currentArg === Object(currentArg)) ? JSON.stringify(currentArg) : currentArg;
      fn.memoize || (fn.memoize = {});
    }

    return(hash in fn.memoize) ? fn.memoize[hash] : fn.memoize[hash] = fn.apply(this, args);
  };
};

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
export var debounce = function(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this,
      args = arguments;
    var later = function() {
      timeout = null;
      if(!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if(callNow) func.apply(context, args);
  }
};

export var isTouchDevice = function() {
  return !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
};

//return a pruneed tree
export var pruneTree = function(tree, filterCallback) {
  var filteredTree = {};
  var filteredChildrens = [];
  if(tree.hasOwnProperty("children")) {
    filteredChildrens = tree.children.map(function(childrenTree) {
      return pruneTree(childrenTree, filterCallback);
    }).filter(function(childrenTree) {
      return Object.keys(childrenTree).length !== 0;
    });
  }
  if(filteredChildrens.length != 0 || filterCallback(tree)) {
    filteredTree["id"] = tree.id;
  }
  if(filteredChildrens.length != 0) {
    filteredTree["children"] = filteredChildrens;
  }
  return filteredTree;
}