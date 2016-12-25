import interpolator from 'vizabi-interpolators/interpolators';

/*
 * Check if value A is in +- proximity of value B
 * @param {Number} a
 * @param {Number} b
 * @param {Number} tolerance
 * @returns {Boolean} true if values are approximately equal or false otherwise
 */
export var approxEqual = function(a, b, tolerance) {
  tolerance = tolerance||0;
  if(b > 0){
    return (1 - tolerance) * b <= a && a <= b * (1 + tolerance);
  }else if(b < 0){
    return (1 + tolerance) * b <= a && a <= b * (1 - tolerance);
  }else{
    return Math.abs(a) <= tolerance;
  }
};

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

export var isEmpty = function(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
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
  if(a === b) return true;
  if(a == null || b == null) return false;
  if(a.length != b.length) return false;
  for(var i = 0; i < a.length; ++i) {
    if(a[i] !== b[i]) return false;
  }
  return true;
};


/**
 * Object Comparison
 *
 * http://stamat.wordpress.com/2013/06/22/javascript-object-comparison/
 *
 * No version
 *
 * @param a
 * @param b
 * @returns {boolean} if objects are equal
 */
export var comparePlainObjects = function (a, b) {

    //Returns the object's class, Array, Date, RegExp, Object are of interest to us
    var getClass = function (val) {
        return Object.prototype.toString.call(val)
            .match(/^\[object\s(.*)\]$/)[1];
    };

    //Defines the type of the value, extended typeof
    var whatis = function (val) {

        if (val === undefined) {
            return 'undefined';
        }
        if (val === null) {
            return 'null';
        }

        var type = typeof val;

        if (type === 'object') {
            type = getClass(val).toLowerCase();
        }

        if (type === 'number') {
            if (val.toString().indexOf('.') > 0) {
                return 'float';
            }
            else {
                return 'integer';
            }
        }

        return type;
    };

    var compare = function (a, b) {
        if (a === b) {
            return true;
        }
        for (var i in a) {
            if (b.hasOwnProperty(i)) {
                if (!equal(a[i], b[i])) {
                    return false;
                }
            } else {
                return false;
            }
        }

        for (var i in b) {
            if (!a.hasOwnProperty(i)) {
                return false;
            }
        }
        return true;
    };

    var compareArrays = function (a, b) {
        if (a === b) {
            return true;
        }
        if (a.length !== b.length) {
            return false;
        }
        for (var i = 0; i < a.length; i++) {
            if (!equal(a[i], b[i])) {
                return false;
            }
        }
        return true;
    };

    var _equal = {};
    _equal.array = compareArrays;
    _equal.object = compare;
    _equal.date = function (a, b) {
        return a.getTime() === b.getTime();
    };
    _equal.regexp = function (a, b) {
        return a.toString() === b.toString();
    };

    /**
     * Are two values equal, deep compare for objects and arrays.
     * @param a {any}
     * @param b {any}
     * @return {boolean} Are equal?
     */
    var equal = function (a, b) {
        if (a !== b) {
            var atype = whatis(a), btype = whatis(b);

            if (atype === btype) {
                return _equal.hasOwnProperty(atype) ? _equal[atype](a, b) : a == b;
            }

            return false;
        }

        return true;
    };

    return compare(a, b);
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
  var scrollable = ["scroll", "auto"];
  while(node = node.parentNode) {
    var scrollHeight = node.scrollHeight,
      height = node.clientHeight;
      if (scrollHeight > height && scrollable.indexOf(d3.select(node).style("overflow")) !== -1) {
        return node;
      }
  }
  return null;
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
  var i, size;
  if(isArray(obj)) {
    size = obj.length;
    for(i = 0; i < size; i += 1) {
      if(callback.apply(ctx, [
          obj[i],
          i
        ]) === false) {
        break;
      }
    }
  } else {
    var keys = Object.keys(obj);
    size = keys.length;
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

// Deep extend and helper functions
// https://github.com/unclechu/node-deep-extend/blob/master/lib/deep-extend.js

function isSpecificValue(val) {
  return (
    val instanceof Date
    || val instanceof RegExp
  ) ? true : false;
}

function cloneSpecificValue(val) {
  if (val instanceof Date) {
    return new Date(val.getTime());
  } else if (val instanceof RegExp) {
    return new RegExp(val);
  } else {
    throw new Error('Unexpected situation');
  }
}

/**
 * Recursive cloning array.
 */
function deepCloneArray(arr) {
  var clone = [];
  forEach(arr, function (item, index) {
    if (typeof item === 'object' && item !== null) {
      if (isArray(item)) {
        clone[index] = deepCloneArray(item);
      } else if (isSpecificValue(item)) {
        clone[index] = cloneSpecificValue(item);
      } else {
        clone[index] = deepExtend({}, item);
      }
    } else {
      clone[index] = item;
    }
  });
  return clone;
}

/**
 * Extening object that entered in first argument.
 *
 * Returns extended object or false if have no target object or incorrect type.
 *
 * If you wish to clone source object (without modify it), just use empty new
 * object as first argument, like this:
 *   deepExtend({}, yourObj_1, [yourObj_N]);
 */
export var deepExtend = function(/*obj_1, [obj_2], [obj_N]*/) {
  if (arguments.length < 1 || typeof arguments[0] !== 'object') {
    return false;
  }

  if (arguments.length < 2) {
    return arguments[0];
  }

  var target = arguments[0];

  // convert arguments to array and cut off target object
  var args = Array.prototype.slice.call(arguments, 1);

  var val, src, clone;

  forEach(args, function (obj) {
    // skip argument if it is array or isn't object
    if (typeof obj !== 'object' || isArray(obj)) {
      return;
    }

    forEach(Object.keys(obj), function (key) {
      src = target[key]; // source value
      val = obj[key]; // new value

      // recursion prevention
      if (val === target) {
        return;

      /**
       * if new value isn't object then just overwrite by new value
       * instead of extending.
       * 2016-11-07 / Jasper: Added specific check for val instanceof Model for merging defaults & values of ComponentModels
       * 2016-11-07 / Jasper: Hack because importing Model doesn't work: instead check for val._data
       */
      } else if (typeof val !== 'object' || val === null || val._data) {
        target[key] = val;
        return;

      // just clone arrays (and recursive clone objects inside)
      } else if (isArray(val)) {
        target[key] = deepCloneArray(val);
        return;

      // custom cloning and overwrite for specific objects
      } else if (isSpecificValue(val)) {
        target[key] = cloneSpecificValue(val);
        return;

      // overwrite by new value if source isn't object or array
      } else if (typeof src !== 'object' || src === null || isArray(src)) {
        target[key] = deepExtend({}, val);
        return;

      // source value and new value is objects both, extending...
      } else {
        target[key] = deepExtend(src, val);
        return;
      }
    });
  });

  return target;
}

/*
 * merges objects instead of replacing
 * @param {Object} destination object
 * @returns {Object} merged object
 */
export var merge = function(dest) {

  // objects to overwrite dest are next arguments
  var objs = Array.prototype.slice.call(arguments, 1);

  // loop through each obj and each argument, left to right
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

/**
 * prevent scrolling parent scrollable elements for 2 second when element scrolled to end
 * @param node
 */

export var preventAncestorScrolling = function(element) {
  var preventScrolling = false;
  element.on('mousewheel', function(d, i) {
    var scrollTop = this.scrollTop,
      scrollHeight = this.scrollHeight,
      height = element.node().offsetHeight,
      delta = d3.event.wheelDelta,
      up = delta > 0;
    var prevent = function() {
      d3.event.stopPropagation();
      d3.event.preventDefault();
      d3.event.returnValue = false;
      return false;
    };

    var scrollTopTween = function(scrollTop) {
      return function () {
        var i = d3.interpolateNumber(this.scrollTop, scrollTop);
        return function (t) {
          this.scrollTop = i(t);
        };
      }
    };
    if (!up) {
      // Scrolling down
      if (-delta > scrollHeight - height - scrollTop && scrollHeight != height + scrollTop) {
        element.transition().delay(0).duration(0).tween("scrolltween", scrollTopTween(scrollHeight));
        //freeze scrolling on 2 seconds on bottom position
        preventScrolling = true;
        setTimeout(function() {
          preventScrolling = false;
        }, 2000);
      } else if (scrollTop == 0) { //unfreeze when direction changed
        preventScrolling = false;
      }
    } else if (up) {
      // Scrolling up
      if (delta > scrollTop && scrollTop > 0) { //
        //freeze scrolling on 2 seconds on top position
        element.transition().delay(0).duration(0).tween("scrolltween", scrollTopTween(0));
        preventScrolling = true;
        setTimeout(function() {
          preventScrolling = false;
        }, 2000);
      } else if (scrollHeight == height + scrollTop) { //unfreeze when direction changed
        preventScrolling = false;
      }
    }
    if (preventScrolling) {
      return prevent();
    }
  });
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

  // default formatter turns empty strings in null and converts numeric values into number
  //TODO: default formatter is moved to utils. need to return it to hook prototype class, but retest #1212 #1230 #1253
  var defaultFormatter = function (val) {
      var newVal = val;
      if(val === ""){
        newVal = null;
      } else {
        // check for numeric
        var numericVal = parseFloat(val);
        if (!isNaN(numericVal) && isFinite(val)) {
          newVal = numericVal;
        }
      }
      return newVal;
  }

  original = original.map(function(row) {
    var columns = Object.keys(row);

    for(var i = 0; i < columns.length; i++) {
      var col = columns[i];
      row[col] = mapRow(row[col], formatters[col] || defaultFormatter);
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
  message = Array.prototype.slice.call(arguments)
    .map(function(m){return m instanceof Object? JSON.stringify(m, null, 4) : m })
    .join(' ');
  if(console && typeof console.warn === 'function') {

    console.warn(message);
  }
  // "return true" is needed to find out if a parent function is exited with warning
  // example:
  // myfunction = function() { if(brokenstuff) return utils.warn("broken stuff found") }
  // if(myfunction()) return; // stopped execution after myfunction finds broken stuff
  // ... or moving on
  return true;
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
 * @return {Function}
 * Function recallLast was added to prototype of returned function.
 * Call Function.recallLast() - immediate recall func with last saved arguments,
 *                              else func will be called automaticly after ms duration
 */
export var throttle = function(func, ms) {

  var throttled = false,
    savedArgs,
    savedThis,
    nextTime,
    wrapper = function() {

      if(nextTime > Date.now()) {
        throttled = true;
        savedArgs = arguments;
        savedThis = this;
        return;
      }

      nextTime = Date.now() + ms;
      throttled = false;

      func.apply(this, arguments);

      setTimeout(function() {
        __recallLast();
      }, ms);

    },

    __recallLast = function() {
      if(throttled) {
        throttled = false;
        func.apply(savedThis, savedArgs);
      }
    };

  wrapper.recallLast = __recallLast;

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
  var arr = [];
  var keys = Object.keys(obj);
  var size = keys.length;
  for(var i = 0; i < size; i += 1) {
    arr.push(obj[keys[i]]);
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
    } else if(value !== obj1[key]) {
      if(isPlainObject(value) && isPlainObject(obj1[key])) {
        var d = diffObject(value, obj1[key]);
        if(Object.keys(d).length > 0) {
          diff[key] = d;
        }
      } else if(!isArray(value) || !isArray(obj1[key]) || !arrayEquals(value, obj1[key])) {
        diff[key] = value;
      }
    }
  });
  return diff;
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
export var delay = function(delay) {
  return new Promise(resolve => setTimeout(resolve, delay));
};

export var clearDelay = function(delayId) {
  return clearTimeout(delayId);
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
 * Converts D3 nest array into the object with key-value pairs, recursively
 * @param {Array} arr - array like this [{key: k, values: [a, b, ...]}, {...} ... {...}]
 * @return {Object} object like this {k: [a, b, ...], ...}
 */
//
export var nestArrayToObj = function(arr) {
  if(!arr || !arr.length || !arr[0].key) return arr;
  var res = {};
  for(var i = 0; i < arr.length; i++) {
    res[arr[i].key] = nestArrayToObj(arr[i].values);
  };
  return res;
}


export var interpolateVector = function(){

}

/**
 * interpolates the specific value
 * @param {Array} items -- an array of items, sorted by "dimTime", filtered so that no item[which] is null
 * @param {String} use -- a use of hook that wants to interpolate. can be "indicator" or "property" or "constant"
 * @param {String} which -- a hook pointer to indicator or property, e.g. "lex"
 * @param {Number} next -- an index of next item in "items" array after the value to be interpolated. if omitted, then calculated here, but it's expensive
 * @param {String} dimTime -- a pointer to time dimension, usually "time"
 * @param {Date} time -- reference point for interpolation. here the valus is to be found
 * @param {String} method refers to which formula to use. "linear" or "exp". Falls back to "linear" if undefined
 * @param {Boolean} extrapolate indicates if we should use zero-order extrapolation outside the range of available data
 * @returns {Number} interpolated value
 */
export var interpolatePoint = function(items, use, which, next, dimTime, time, method, extrapolate){


  if(!items || items.length === 0) {
    warn('interpolatePoint failed because incoming array is empty. It was ' + which);
    return null;
  }
  // return constant for the use of "constant"
  if(use === 'constant') return which;

  // zero-order interpolation for the use of properties
  if(use === 'property') return items[0][which];

  // the rest is for the continuous measurements

  if (extrapolate){
    // check if the desired value is out of range. 0-order extrapolation
    if(time - items[0][dimTime] <= 0) return items[0][which];
    if(time - items[items.length - 1][dimTime] >= 0) return items[items.length - 1][which];
  } else {
    // no extrapolation according to Ola's request
    if(time < items[0][dimTime] || time > items[items.length - 1][dimTime]) return null;
  }

  if(!next && next !== 0) next = d3.bisectLeft(items.map(function(m){return m[dimTime]}), time);

  if(next === 0) return items[0][which];

  //return null if data is missing
  if(items[next]===undefined || items[next][which] === null || items[next - 1][which] === null || items[next][which] === "") {
    warn('interpolatePoint failed because next/previous points are bad in ' + which);
    return null;
  }


  //do the math to calculate a value between the two points
  var result = interpolator[method||"linear"](
    items[next - 1][dimTime],
    items[next][dimTime],
    items[next - 1][which],
    items[next][which],
    time
  );

  // cast to time object if we are interpolating time
  if(which === dimTime) result = new Date(result);
  if(isNaN(result)) {
      warn('interpolatePoint failed because result is NaN. It was ' + which);
      result = null;
  }

  return result;

}


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
  //'ontouchstart' is not reliable in Google Chrome #2116, but Chrome has this firesTouchEvents flag
  if(((d3.event||{}).sourceCapabilities||{}).firesTouchEvents != null ) {
    return d3.event.sourceCapabilities.firesTouchEvents;
  }
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
    //copy all the properties to the new tree
    forEach(tree, function(value, key) {filteredTree[key] = value;})
  }
  if(filteredChildrens.length != 0) {
    filteredTree["children"] = filteredChildrens;
  }
  return filteredTree;
};

export var setIcon = function(element, icon) {
  element.selectAll('*').remove();
  element.node().appendChild(
    element.node().ownerDocument.importNode(
      new DOMParser().parseFromString(
        icon, 'application/xml').documentElement, true)
  );
  return element;
};

//http://stackoverflow.com/questions/26049488/how-to-get-absolute-coordinates-of-object-inside-a-g-group
export function makeAbsoluteContext(element, svgDocument) {
  return function(x,y) {
    var offset = svgDocument.getBoundingClientRect();
    var matrix = element.getScreenCTM();
    return {
      x: (matrix.a * x) + (matrix.c * y) + matrix.e - offset.left,
      y: (matrix.b * x) + (matrix.d * y) + matrix.f - offset.top
    };
  };
}





/***
   thenBy.js
   Copyright 2013 Teun Duynstee
   https://github.com/Teun/thenBy.js/blob/master/thenBy.module.js

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
     http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */
export function firstBy(){

    function identity(v){return v;}

    function ignoreCase(v){return typeof(v)==="string" ? v.toLowerCase() : v;}

    function makeCompareFunction(f, opt){
     opt = typeof(opt)==="number" ? {direction:opt} : opt||{};
     if(typeof(f)!="function"){
        var prop = f;
        // make unary function
        f = function(v1){return !!v1[prop] ? v1[prop] : "";}
      }
      if(f.length === 1) {
        // f is a unary function mapping a single item to its sort score
        var uf = f;
        var preprocess = opt.ignoreCase?ignoreCase:identity;
        f = function(v1,v2) {return preprocess(uf(v1)) < preprocess(uf(v2)) ? -1 : preprocess(uf(v1)) > preprocess(uf(v2)) ? 1 : 0;}
      }
      if(opt.direction === -1)return function(v1,v2){return -f(v1,v2)};
      return f;
    }

    /* adds a secondary compare function to the target function (`this` context)
       which is applied in case the first one returns 0 (equal)
       returns a new compare function, which has a `thenBy` method as well */
    function tb(func, opt) {
        var x = typeof(this) == "function" ? this : false;
        var y = makeCompareFunction(func, opt);
        var f = x ? function(a, b) {
                        return x(a,b) || y(a,b);
                    }
                  : y;
        f.thenBy = tb;
        return f;
    }
    return tb;
}
