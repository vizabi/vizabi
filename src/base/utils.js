import interpolator from "vizabi-interpolators/interpolators";

/*
 * Check if value A is in +- proximity of value B
 * @param {Number} a
 * @param {Number} b
 * @param {Number} tolerance
 * @returns {Boolean} true if values are approximately equal or false otherwise
 */
export const approxEqual = function(a, b, tolerance) {
  tolerance = tolerance || 0;
  if (b > 0) {
    return (1 - tolerance) * b <= a && a <= b * (1 + tolerance);
  } else if (b < 0) {
    return (1 + tolerance) * b <= a && a <= b * (1 - tolerance);
  }
  return Math.abs(a) <= tolerance;
};

/*
 * returns unique id with optional prefix
 * @param {String} prefix
 * @returns {String} id
 */
export const uniqueId = (function() {
  let id = 0;
  return function(p) {
    return p ? p + (id += 1) : id += 1;
  };
})();

/*
 * checks whether obj is a DOM element
 * @param {Object} obj
 * @returns {Boolean}
 * from underscore: https://github.com/jashkenas/underscore/blob/master/underscore.js
 */
export const isElement = function(obj) {
  return !!(obj && obj.nodeType === 1);
};

/*
 * checks whether obj is an Array
 * @param {Object} obj
 * @returns {Boolean}
 * from underscore: https://github.com/jashkenas/underscore/blob/master/underscore.js
 */
export const isArray = Array.isArray || function(obj) {
  return toString.call(obj) === "[object Array]";
};

/*
 * checks whether obj is an object
 * @param {Object} obj
 * @returns {Boolean}
 * from underscore: https://github.com/jashkenas/underscore/blob/master/underscore.js
 */
export const isObject = function(obj) {
  const type = typeof obj;
  return type === "object" && !!obj;
};

/*
 * checks whether arg is a date
 * @param {Object} arg
 * @returns {Boolean}
 */
export const isDate = function(arg) {
  return arg instanceof Date;
};

/*
 * checks whether arg is a string
 * @param {Object} arg
 * @returns {Boolean}
 */
export const isString = function(arg) {
  return typeof arg === "string";
};

/*
 * checks whether arg is a NaN
 * @param {*} arg
 * @returns {Boolean}
 * from lodash: https://github.com/lodash/lodash/blob/master/lodash.js
 */
export const isNaN = function(arg) {
  // A `NaN` primitive is the only number that is not equal to itself
  return isNumber(arg) && arg !== +arg;
};

export const isEmpty = function(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
};

/*
 * checks whether arg is a number. NaN is a number too
 * @param {*} arg
 * @returns {Boolean}
 * from lodash: https://github.com/lodash/lodash/blob/master/lodash.js
 * dependencies are resolved and included here
 */
export const isNumber = function(arg) {
  return typeof arg === "number" || !!arg && typeof arg === "object" && Object.prototype.toString.call(arg) ===
    "[object Number]";
};

/*
 * checks whether obj is a plain object {}
 * @param {Object} obj
 * @returns {Boolean}
 */
export const isPlainObject = function(obj) {
  return obj !== null && Object.prototype.toString.call(obj) === "[object Object]";
};

/*
 * checks whether two arrays are equal
 * @param {Array} a
 * @param {Array} b
 * @returns {Boolean}
 */
export const arrayEquals = function(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
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
export const comparePlainObjects = function(a, b) {

  //Returns the object's class, Array, Date, RegExp, Object are of interest to us
  const getClass = function(val) {
    return Object.prototype.toString.call(val)
      .match(/^\[object\s(.*)\]$/)[1];
  };

  //Defines the type of the value, extended typeof
  const whatis = function(val) {

    if (val === undefined) {
      return "undefined";
    }
    if (val === null) {
      return "null";
    }

    let type = typeof val;

    if (type === "object") {
      type = getClass(val).toLowerCase();
    }

    if (type === "number") {
      return val.toString().indexOf(".") > 0 ?
        "float" :
        "integer";
    }

    return type;
  };

  const compare = function(a, b) {
    if (a === b) {
      return true;
    }
    for (const i in a) {
      if (b.hasOwnProperty(i)) {
        if (!equal(a[i], b[i])) {
          return false;
        }
      } else {
        return false;
      }
    }

    for (const i in b) {
      if (!a.hasOwnProperty(i)) {
        return false;
      }
    }
    return true;
  };

  const compareArrays = function(a, b) {
    if (a === b) {
      return true;
    }
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!equal(a[i], b[i])) {
        return false;
      }
    }
    return true;
  };

  const _equal = {};
  _equal.array = compareArrays;
  _equal.object = compare;
  _equal.date = function(a, b) {
    return a.getTime() === b.getTime();
  };
  _equal.regexp = function(a, b) {
    return a.toString() === b.toString();
  };

  /**
   * Are two values equal, deep compare for objects and arrays.
   * @param a {any}
   * @param b {any}
   * @return {boolean} Are equal?
   */
  const equal = function(a, b) {
    if (a !== b) {
      const atype = whatis(a);
      const btype = whatis(b);

      if (atype === btype) {
        return _equal.hasOwnProperty(atype) ? _equal[atype](a, b) : a == b;
      }

      return false;
    }

    return true;
  };

  return compare(a, b);
};


export const getViewportPosition = function(element) {
  let xPosition = 0;
  let yPosition = 0;

  while (element) {
    xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
    yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
    element = element.offsetParent;
  }

  return {
    x: xPosition,
    y: yPosition
  };
};


export const findScrollableAncestor = function(node) {
  const scrollable = ["scroll", "auto"];
  while (node = node.parentNode) {
    const scrollHeight = node.scrollHeight;
    const height = node.clientHeight;
    if (scrollHeight > height && scrollable.indexOf(d3.select(node).style("overflow")) !== -1) {
      return node;
    }
  }
  return null;
};

export const roundStep = function(number, step) {
  return Math.round(number / step) * step;
};

/*
 * transforms a string into a validated fload value
 * @param {string} string to be transformed
 */
export const strToFloat = function(string) {
  return +string.replace(/[^\d.-]/g, "");
};

/*
 * loops through an object or array
 * @param {Object|Array} obj object or array
 * @param {Function} callback callback function
 * @param {Object} ctx context object
 */
export const forEach = function(obj, callback, ctx) {
  if (!obj) {
    return;
  }
  let i, size;
  if (isArray(obj)) {
    size = obj.length;
    for (i = 0; i < size; i += 1) {
      if (callback.apply(ctx, [
        obj[i],
        i
      ]) === false) {
        break;
      }
    }
  } else {
    const keys = Object.keys(obj);
    size = keys.length;
    for (i = 0; i < size; i += 1) {
      if (callback.apply(ctx, [
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
export const extend = function(dest) {
  //objects to overwrite dest are next arguments
  const objs = Array.prototype.slice.call(arguments, 1);
  //loop through each obj and each argument, left to right
  forEach(objs, (obj, i) => {
    forEach(obj, (value, k) => {
      if (obj.hasOwnProperty(k)) {
        dest[k] = value;
      }
    });
  });
  return dest;
};

// Deep extend and helper functions
// https://github.com/unclechu/node-deep-extend/blob/master/lib/deep-extend.js

function isSpecificValue(val) {
  return Boolean((
    val instanceof Date
    || val instanceof RegExp
  ));
}

function cloneSpecificValue(val) {
  if (val instanceof Date) {
    return new Date(val.getTime());
  } else if (val instanceof RegExp) {
    return new RegExp(val);
  }
  throw new Error("Unexpected situation");
}

/**
 * Recursive cloning array.
 */
function deepCloneArray(arr) {
  const clone = [];
  forEach(arr, (item, index) => {
    if (typeof item === "object" && item !== null) {
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
export const deepExtend = function(/*obj_1, [obj_2], [obj_N]*/) {
  if (arguments.length < 1 || typeof arguments[0] !== "object") {
    return false;
  }

  if (arguments.length < 2) {
    return arguments[0];
  }

  const target = arguments[0];

  // convert arguments to array and cut off target object
  const args = Array.prototype.slice.call(arguments, 1);

  let val, src, clone;

  forEach(args, obj => {
    // skip argument if it is array or isn't object
    if (typeof obj !== "object" || isArray(obj)) {
      return;
    }

    forEach(Object.keys(obj), key => {
      src = target[key]; // source value
      val = obj[key]; // new value

      // recursion prevention
      if (val === target) {
        /*
         * if new value isn't object then just overwrite by new value
         * instead of extending.
         * 2016-11-07 / Jasper: Added specific check for val instanceof Model for merging defaults & values of ComponentModels
         * 2016-11-07 / Jasper: Hack because importing Model doesn't work: instead check for val._data
         */
      } else if (typeof val !== "object" || val === null || val._data) {
        target[key] = val;

        // just clone arrays (and recursive clone objects inside)
      } else if (isArray(val)) {
        target[key] = deepCloneArray(val);

        // custom cloning and overwrite for specific objects
      } else if (isSpecificValue(val)) {
        target[key] = cloneSpecificValue(val);

        // overwrite by new value if source isn't object or array
      } else if (typeof src !== "object" || src === null || isArray(src)) {
        target[key] = deepExtend({}, val);

        // source value and new value is objects both, extending...
      } else {
        target[key] = deepExtend(src, val);
      }
    });
  });

  return target;
};

/*
 * merges objects instead of replacing
 * @param {Object} destination object
 * @returns {Object} merged object
 */
export const merge = function(dest) {

  // objects to overwrite dest are next arguments
  const objs = Array.prototype.slice.call(arguments, 1);

  // loop through each obj and each argument, left to right
  forEach(objs, (obj, i) => {
    forEach(obj, (value, k) => {
      if (obj.hasOwnProperty(k)) {
        if (dest.hasOwnProperty(k)) {
          if (!isArray(dest[k])) {
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
export const clone = function(src, arr, exclude) {
  if (isArray(src)) {
    return src.slice(0);
  }
  const clone = {};
  forEach(src, (value, k) => {
    if ((arr && arr.indexOf(k) === -1) || (exclude && exclude.indexOf(k) !== -1)) {
      return;
    }
    if (src.hasOwnProperty(k)) {
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
export const deepClone = function(src) {
  let clone = {};
  if (isArray(src)) clone = [];

  forEach(src, (value, k) => {
    if (isObject(value) || isArray(value)) {
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
export const without = function(arr, el) {
  const idx = arr.indexOf(el);
  if (idx !== -1) {
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
export const unique = function(arr, func) {
  const u = {};
  const a = [];
  if (!func) {
    func = function(d) {
      return d;
    };
  }
  for (let i = 0, l = arr.length; i < l; i += 1) {
    const key = func(arr[i]);
    if (u.hasOwnProperty(key)) {
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
export const uniqueLast = function(arr, func) {
  const u = {};
  const a = [];
  if (!func) {
    func = function(d) {
      return d;
    };
  }
  for (let i = 0, l = arr.length; i < l; i += 1) {
    const key = func(arr[i]);
    if (u.hasOwnProperty(key)) {
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
export const find = function(arr, func) {
  let found;
  forEach(arr, i => {
    if (func(i)) {
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
export const filter = function(arr, filter) {
  let index = -1;
  const length = arr.length;
  let resIndex = -1;
  const result = [];
  const keys = Object.keys(filter);
  const s_keys = keys.length;
  let i;
  let f;
  while ((index += 1) < length) {
    const value = arr[index];
    let match = true;
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
};

/*
 * filters an array based on object properties.
 * Properties may be arrays determining possible values
 * @param {Array} arr original array
 * @returns {Object} filter properties to use as filter
 */
export const filterAny = function(arr, filter, wildcard) {
  let index = -1;
  const length = arr.length;
  let resIndex = -1;
  const result = [];
  const keys = Object.keys(filter);
  const s_keys = keys.length;
  let i, f;
  while ((index += 1) < length) {
    const value = arr[index];
    //normalize to array
    let match = true;
    for (i = 0; i < s_keys; i += 1) {
      f = keys[i];
      if (!value.hasOwnProperty(f) || !matchAny(value[f], filter[f], wildcard)) {
        match = false;
        break;
      }
    }
    if (match) {
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
export const matchAny = function(values, compare, wildc) {
  //normalize value
  if (!isArray(values)) values = [values];
  if (!wildc) wildc = "*"; //star by default
  let match = false;
  for (let e = 0; e < values.length; e++) {
    const value = values[e];

    if (!isArray(compare) && value == compare) {
      match = true;
      break;
    } else if (isArray(compare)) {
      let found = -1;
      for (let i = 0; i < compare.length; i++) {
        const c = compare[i];
        if (!isArray(c) && (c == value || c === wildc)) {
          found = i;
          break;
        } else if (isArray(c)) { //range
          const min = c[0];
          const max = c[1] || min;
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
};

/**
 * prevent scrolling parent scrollable elements for 2 second when element scrolled to end
 * @param node
 */

export const preventAncestorScrolling = function(element) {
  let preventScrolling = false;
  element.on("mousewheel", function(d, i) {
    const scrollTop = this.scrollTop;
    const scrollHeight = this.scrollHeight;
    const height = element.node().offsetHeight;
    const delta = d3.event.wheelDelta;
    const up = delta > 0;
    const prevent = function() {
      d3.event.stopPropagation();
      d3.event.preventDefault();
      d3.event.returnValue = false;
      return false;
    };

    const scrollTopTween = function(scrollTop) {
      return function() {
        const _this = this;
        const i = d3.interpolateNumber(this.scrollTop, scrollTop);
        return function(t) {
          _this.scrollTop = i(t);
        };
      };
    };
    if (!up) {
      // Scrolling down
      if (-delta > scrollHeight - height - scrollTop && scrollHeight != height + scrollTop) {
        element.transition().delay(0).duration(0).tween("scrolltween", scrollTopTween(scrollHeight));
        //freeze scrolling on 2 seconds on bottom position
        preventScrolling = true;
        setTimeout(() => {
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
        setTimeout(() => {
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
export const mapRows = function(original, formatters) {

  function mapRow(value, fmt) {
    if (!isArray(value)) {
      return fmt(value);
    }

    const res = [];
    for (let i = 0; i < value.length; i++) {
      res[i] = mapRow(value[i], fmt);
    }
    return res;
  }

  // default formatter turns empty strings in null and converts numeric values into number
  //TODO: default formatter is moved to utils. need to return it to hook prototype class, but retest #1212 #1230 #1253
  const defaultFormatter = function(val) {
    let newVal = val;
    if (val === "") {
      newVal = null;
    } else {
      // check for numeric
      const numericVal = parseFloat(val);
      if (!isNaN(numericVal) && isFinite(val)) {
        newVal = numericVal;
      }
    }
    return newVal;
  };

  original = original.map(row => {
    const columns = Object.keys(row);

    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
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
export const radiusToArea = function(r) {
  return r * r * Math.PI;
};

/*
 * Converts area to radius, simple math
 * @param {Number} area
 * @returns {Number} radius
 */
export const areaToRadius = function(a) {
  return Math.sqrt(a / Math.PI);
};

/*
 * Prints message to timestamp
 * @param {String} message
 */
export const timeStamp = function(message) {
  if (console && typeof console.timeStamp === "function") {
    console.timeStamp(message);
  }
};

/*
 * Prints warning
 * @param {String} message
 */
export const warn = function(message) {
  message = Array.prototype.slice.call(arguments)
    .map(m => m instanceof Object ? JSON.stringify(m, null, 4) : m)
    .join(" ");
  if (console && typeof console.warn === "function") {

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
export const groupCollapsed = function(message) {
  message = Array.prototype.slice.call(arguments).join(" ");
  if (console && typeof console.groupCollapsed === "function") {
    console.groupCollapsed(message);
  }
};

/*
 * Prints end of group
 * @param {String} message
 */
export const groupEnd = function() {
  if (console && typeof console.groupEnd === "function") {
    console.groupEnd();
  }
};

/*
 * Prints error
 * @param {String} message
 */
export const error = function(err) {
  if (console && typeof console.error === "function") {
    if (err.stack) {
      console.error(err.stack);
    } else {
      console.error(err);
    }
    if (arguments.length > 1) {
      console.error.apply(this, Array.prototype.slice.call(arguments, 1));
    }
  }
};

/*
 * Count the number of decimal numbers
 * @param {Number} number
 */
export const countDecimals = function(number) {
  if (Math.floor(number.valueOf()) === number.valueOf()) {
    return 0;
  }
  return number.toString().split(".")[1].length || 0;
};

/*
 * Adds class to DOM element
 * @param {Element} el
 * @param {String} className
 */
export const addClass = function(el, className) {
  if (el.classList) {
    el.classList.add(className);
  } else {
    //IE<10
    el.className += " " + className;
  }
};

/*
 * Remove class from DOM element
 * @param {Element} el
 * @param {String} className
 */
export const removeClass = function(el, className) {
  if (el.classList) {
    el.classList.remove(className);
  } else {
    //IE<10
    el.className = el.className.replace(new RegExp("(^|\\b)" + className.split(" ").join("|") + "(\\b|$)", "gi"),
      " ");
  }
};

/*
 * Adds or removes class depending on value
 * @param {Element} el
 * @param {String} className
 * @param {Boolean} value
 */
export const classed = function(el, className, value) {
  if (value === true) {
    addClass(el, className);
  } else if (value === false) {
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
export const hasClass = (el, className) => (
  el.classList ?
    el.classList.contains(className) :
    new RegExp("(^| )" + className + "( |$)", "gi").test(el.className)
);

/*
 * Throttles a function
 * @param {Function} func
 * @param {Number} ms duration
 * @return {Function}
 * Function recallLast was added to prototype of returned function.
 * Call Function.recallLast() - immediate recall func with last saved arguments,
 *                              else func will be called automaticly after ms duration
 */
export const throttle = function(func, ms) {

  let throttled = false;
  let savedArgs;
  let savedThis;
  let nextTime;

  const __recallLast = function() {
    if (throttled) {
      throttled = false;
      func.apply(savedThis, savedArgs);
    }
  };

  const wrapper = function() {

    if (nextTime > Date.now()) {
      throttled = true;
      savedArgs = arguments;
      savedThis = this;
      return;
    }

    nextTime = Date.now() + ms;
    throttled = false;

    func.apply(this, arguments);

    setTimeout(() => {
      __recallLast();
    }, ms);

  };

  wrapper.recallLast = __recallLast;

  return wrapper;
};


/*
 * Returns keys of an object as array
 * @param {Object} arg
 * @returns {Array} keys
 */
export const keys = function(arg) {
  return Object.keys(arg);
};

/*
 * returns the values of an object in an array format
 * @param {Object} obj
 * @return {Array}
 */
export const values = function(obj) {
  const arr = [];
  const keys = Object.keys(obj);
  const size = keys.length;
  for (let i = 0; i < size; i += 1) {
    arr.push(obj[keys[i]]);
  }
  return arr;
};


/*
 * Computes the minumum value in an array
 * @param {Array} arr
 */
export const arrayMin = function(arr) {
  return arr.reduce((p, v) => (p < v ? p : v));
};

/*
 * Computes the minumum value in an array
 * @param {Array} arr
 */
export const arrayMax = function(arr) {
  return arr.reduce((p, v) => (p > v ? p : v));
};

/*
 * Computes the mean of an array
 * @param {Array} arr
 */
export const arrayMean = function(arr) {
  return arraySum(arr) / arr.length;
};

/*
 * Computes the sum of an array
 * @param {Array} arr
 */
export const arraySum = function(arr) {
  return arr.reduce((a, b) => a + b);
};

/*
 * Computes the median of an array
 * @param {Array} arr
 */
export const arrayMedian = arr => {
  arr = arr.sort((a, b) => a - b);
  const middle = Math.floor((arr.length - 1) / 2);

  return arr.length % 2 ?
    arr[middle] :
    (arr[middle] + arr[middle + 1]) / 2;
};

/*
 * Returns the last value of array
 * @param {Array} arr
 */
export const arrayLast = function(arr) {
  if (!arr.length) return null;
  return arr[arr.length - 1];
};

/*
 * Returns the resulting object of the difference between two objects
 * @param {Object} obj2
 * @param {Object} obj1
 * @returns {Object}
 */
export const diffObject = function(obj2, obj1) {
  const diff = {};
  forEach(obj2, (value, key) => {
    if (!obj1.hasOwnProperty(key)) {
      diff[key] = value;
    } else if (value !== obj1[key]) {
      if (isPlainObject(value) && isPlainObject(obj1[key])) {
        const d = diffObject(value, obj1[key]);
        if (Object.keys(d).length > 0) {
          diff[key] = d;
        }
      } else if (!isArray(value) || !isArray(obj1[key]) || !arrayEquals(value, obj1[key])) {
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
export const defer = function(func) {
  setTimeout(func, 1);
};

/*
 * Defers a function
 * @param {Function} func
 */
export const delay = function(delay) {
  return new Promise(resolve => setTimeout(resolve, delay));
};

export const clearDelay = function(delayId) {
  return clearTimeout(delayId);
};

/*
 * Creates a hashcode for a string or array
 * @param {String|Array} str
 * @return {Number} hashCode
 */
export const hashCode = function(str) {
  if (!isString(str)) {
    str = JSON.stringify(str);
  }
  let hash = 0;
  const size = str.length;
  let c;
  if (size === 0) {
    return hash;
  }
  for (let i = 0; i < size; i += 1) {
    c = str.charCodeAt(i);
    hash = (hash << 5) - hash + c;
    hash &= hash; // Convert to 32bit integer
  }
  return hash.toString();
};


/*
 * Converts D3 nest array into the object with key-value pairs, recursively
 * @param {Array} arr - array like this [{key: k, values: [a, b, ...]}, {...} ... {...}]
 * @return {Object} object like this {k: [a, b, ...], ...}
 */
//
export const nestArrayToObj = function(arr) {
  if (!arr || !arr.length || !arr[0].key) return arr;
  const res = {};
  for (let i = 0; i < arr.length; i++) {
    res[arr[i].key] = nestArrayToObj(arr[i].values);
  }
  return res;
};


export const interpolateVector = function() {

};

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
export const interpolatePoint = function(items, use, which, next, dimTime, time, method, extrapolate) {


  if (!items || items.length === 0) {
    warn("interpolatePoint failed because incoming array is empty. It was " + which);
    return null;
  }
  // return constant for the use of "constant"
  if (use === "constant") return which;

  // zero-order interpolation for the use of properties
  if (use === "property") return items[0][which];

  // the rest is for the continuous measurements

  if (extrapolate) {
    // check if the desired value is out of range. 0-order extrapolation
    if (time - items[0][dimTime] <= 0) return items[0][which];
    if (time - items[items.length - 1][dimTime] >= 0) return items[items.length - 1][which];
  } else {
    // no extrapolation according to Ola's request
    if (time < items[0][dimTime] || time > items[items.length - 1][dimTime]) return null;
  }

  if (!next && next !== 0) next = d3.bisectLeft(items.map(m => m[dimTime]), time);

  if (next === 0) return items[0][which];

  //return null if data is missing
  if (items[next] === undefined || items[next][which] === null || items[next - 1][which] === null || items[next][which] === "") {
    warn("interpolatePoint failed because next/previous points are bad in " + which);
    return null;
  }


  //do the math to calculate a value between the two points
  let result = interpolator[method || "linear"](
    items[next - 1][dimTime],
    items[next][dimTime],
    items[next - 1][which],
    items[next][which],
    time
  );

  // cast to time object if we are interpolating time
  if (which === dimTime) result = new Date(result);
  if (isNaN(result)) {
    warn("interpolatePoint failed because result is NaN. It was " + which);
    result = null;
  }

  return result;

};


/*
 * Performs an ajax request
 * @param {Object} options
 * @param {String} className
 * @return {Boolean}
 */
export const ajax = function(options) {
  const request = new XMLHttpRequest();
  request.open(options.method, options.url, true);
  if (options.method === "POST" && !options.json) {
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
  } else if (options.method === "POST" && options.json) {
    request.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
  }
  request.onload = function() {
    if (request.status >= 200 && request.status < 400) {
      // Success!
      const data = options.json ? JSON.parse(request.responseText) : request.responseText;
      if (options.success) {
        options.success(data);
      }
    } else {
      if (options.error) {
        options.error();
      }
    }
  };
  request.onerror = function() {
    if (options.error) {
      options.error();
    }
  };
  request.send(options.data);
};

/*
 * Performs a GET http request
 */
export const get = function(url, pars, success, error, json) {
  pars = pars || [];
  forEach(pars, (value, key) => {
    pars.push(key + "=" + value);
  });
  url = pars.length ? url + "?" + pars.join("&") : url;
  ajax({
    method: "GET",
    url,
    success,
    error,
    json
  });
};

/*
 * Performs a POST http request
 */
export const post = function(url, pars, success, error, json) {
  ajax({
    method: "POST",
    url,
    success,
    error,
    json,
    data: pars
  });
};

/**
 * Make function memoized
 * @param {Function} fn
 * @returns {Function}
 */
export const memoize = function(fn) {
  return function() {
    const args = Array.prototype.slice.call(arguments);
    let hash = "";
    let i = args.length;
    let currentArg = null;

    while (i--) {
      currentArg = args[i];
      hash += (currentArg === Object(currentArg)) ? JSON.stringify(currentArg) : currentArg;
      fn.memoize || (fn.memoize = {});
    }

    return (hash in fn.memoize) ? fn.memoize[hash] : fn.memoize[hash] = fn.apply(this, args);
  };
};

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
export const debounce = function(func, wait, immediate) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

export const isTouchDevice = function() {
  //'ontouchstart' is not reliable in Google Chrome #2116, but Chrome has this firesTouchEvents flag
  if (((d3.event || {}).sourceCapabilities || {}).firesTouchEvents != null) {
    return d3.event.sourceCapabilities.firesTouchEvents;
  }
  return !!(("ontouchstart" in window) || window.DocumentTouch && document instanceof DocumentTouch);
};

//return a pruneed tree
export const pruneTree = function(tree, filterCallback) {
  const filteredTree = {};
  let filteredChildrens = [];
  if (tree.hasOwnProperty("children")) {
    filteredChildrens = tree.children.map(childrenTree => pruneTree(childrenTree, filterCallback)).filter(childrenTree => Object.keys(childrenTree).length !== 0);
  }
  if (filteredChildrens.length != 0 || filterCallback(tree)) {
    //copy all the properties to the new tree
    forEach(tree, (value, key) => {
      filteredTree[key] = value;
    });
  }
  if (filteredChildrens.length != 0) {
    filteredTree["children"] = filteredChildrens;
  }
  return filteredTree;
};

export const setIcon = function(element, icon) {
  element.selectAll("*").remove();
  element.node().appendChild(
    element.node().ownerDocument.importNode(
      new DOMParser().parseFromString(
        icon, "application/xml").documentElement, true)
  );
  return element;
};

//http://stackoverflow.com/questions/26049488/how-to-get-absolute-coordinates-of-object-inside-a-g-group
export function makeAbsoluteContext(element, svgDocument) {
  return function(x, y) {
    const offset = svgDocument.getBoundingClientRect();
    const matrix = element.getScreenCTM();
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
export function firstBy() {

  function identity(v) {
    return v;
  }

  function ignoreCase(v) {
    return typeof (v) === "string" ? v.toLowerCase() : v;
  }

  function makeCompareFunction(f, opt) {
    opt = typeof (opt) === "number" ? { direction: opt } : opt || {};
    if (typeof (f) != "function") {
      const prop = f;
      // make unary function
      f = function(v1) {
        return v1[prop] ? v1[prop] : "";
      };
    }
    if (f.length === 1) {
      // f is a unary function mapping a single item to its sort score
      const uf = f;
      const preprocess = opt.ignoreCase ? ignoreCase : identity;
      f = function(v1, v2) {
        return preprocess(uf(v1)) < preprocess(uf(v2)) ? -1 : preprocess(uf(v1)) > preprocess(uf(v2)) ? 1 : 0;
      };
    }
    if (opt.direction === -1) return function(v1, v2) {
      return -f(v1, v2);
    };
    return f;
  }

  /* adds a secondary compare function to the target function (`this` context)
   which is applied in case the first one returns 0 (equal)
   returns a new compare function, which has a `thenBy` method as well */
  function tb(func, opt) {
    const x = typeof (this) == "function" ? this : false;
    const y = makeCompareFunction(func, opt);
    const f = x ? function(a, b) {
      return x(a, b) || y(a, b);
    }
      : y;
    f.thenBy = tb;
    return f;
  }

  return tb;
}

export function transform(node) {

  const { a, b, c, d, e, f } = node.transform.baseVal.consolidate().matrix;

  return (function(a, b, c, d, e, f) {
    let scaleX, scaleY, skewX;
    if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
    if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
    if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
    if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
    return {
      translateX: e,
      translateY: f,
      rotate: Math.atan2(b, a) * Math.PI / 180,
      skewX: Math.atan(skewX) * Math.PI / 180,
      scaleX,
      scaleY
    };
  })(a, b, c, d, e, f);
}

export const capitalize = string => string.slice(0, 1).toUpperCase() + string.slice(1).toLowerCase();

// http://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
export const isMobileOrTablet = (agent = navigator.userAgent || navigator.vendor || window.opera) => /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(agent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(agent.substr(0, 4));
