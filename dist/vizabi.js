/* VIZABI - http://www.gapminder.org - 2015-06-22 */

/*!
 * VIZABI MAIN
 */
(function() {
    'use strict';
    var root = this;
    var previous = root.Vizabi;
    
    var Vizabi = function(tool, placeholder, options) {
        return startTool(tool, placeholder, options);
    };
    //stores reference to each tool on the page
    Vizabi._instances = {};

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
    Vizabi.clearInstances = function(id) {
        if (id) {
            delete Vizabi._instances[id];
        } else {
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
    Vizabi._require = function(variable) {
        if (typeof root[variable] === 'undefined') {
            Vizabi.utils.warn(variable + ' is required and could not be found.');
            return false;
        }
        return true;
    };

    //if AMD define
    if (typeof define === 'function' && define.amd) {
        define(function() {
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
(function() {
    
    'use strict';
    
    var root = this;
    var Vizabi = root.Vizabi;
    
    Vizabi.utils = {

        /*
         * returns unique id with optional prefix
         * @param {String} prefix
         * @returns {String} id
         */
        uniqueId: function() {
            var id = 0;
            return function(p) {
                return p ? p + (id += 1) : id += 1;
            };
        }(),

        /*
         * checks whether obj is a DOM element
         * @param {Object} obj
         * @returns {Boolean}
         * from underscore: https://github.com/jashkenas/underscore/blob/master/underscore.js
         */
        isElement: function(obj) {
            return !!(obj && obj.nodeType === 1);
        },

        /*
         * checks whether obj is an Array
         * @param {Object} obj
         * @returns {Boolean}
         * from underscore: https://github.com/jashkenas/underscore/blob/master/underscore.js
         */
        isArray: Array.isArray || function(obj) {
            return toString.call(obj) === '[object Array]';
        },

        /*
         * checks whether obj is an object
         * @param {Object} obj
         * @returns {Boolean}
         * from underscore: https://github.com/jashkenas/underscore/blob/master/underscore.js
         */
        isObject: function(obj) {
            var type = typeof obj;
            return type === 'object' && !!obj;
        },

        /*
         * checks whether arg is a date
         * @param {Object} arg
         * @returns {Boolean}
         */
        isDate: function(arg) {
            return arg instanceof Date;
        },

        /*
         * checks whether arg is a string
         * @param {Object} arg
         * @returns {Boolean}
         */
        isString: function(arg) {
            return typeof arg === 'string';
        },

        /*
         * checks whether arg is a NaN
         * @param {*} arg
         * @returns {Boolean}
         * from lodash: https://github.com/lodash/lodash/blob/master/lodash.js
         */
        isNaN: function(arg) {
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
        isNumber: function(arg) {
            return typeof arg === 'number' || !!arg && typeof arg === 'object' && Object.prototype.toString.call(arg) === '[object Number]';
        },

        /*
         * checks whether obj is a plain object {}
         * @param {Object} obj
         * @returns {Boolean}
         */
        isPlainObject: function(obj) {
            return obj !== null && Object.prototype.toString.call(obj) === '[object Object]';
        },

        roundStep: function(number, step) {
            return Math.round(number/step) * step;
        },

        /*
         * loops through an object or array
         * @param {Object|Array} obj object or array
         * @param {Function} callback callback function
         * @param {Object} ctx context object
         */
        forEach: function(obj, callback, ctx) {
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
        extend: function(dest) {
            //objects to overwrite dest are next arguments 
            var objs = Array.prototype.slice.call(arguments, 1);
            var _this = this;
            //loop through each obj and each argument, left to right
            this.forEach(objs, function(obj, i) {
                _this.forEach(obj, function(value, k) {
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
        merge: function(dest) {
            //objects to overwrite dest are next arguments 
            var objs = Array.prototype.slice.call(arguments, 1);
            var _this = this;
            //loop through each obj and each argument, left to right
            this.forEach(objs, function(obj, i) {
                _this.forEach(obj, function(value, k) {
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
        clone: function(src, arr, exclude) {
            if (this.isArray(src)) {
                return src.slice(0);
            }
            var clone = {};
            this.forEach(src, function(value, k) {
                if ((arr && arr.indexOf(k) === -1)
                  ||(exclude && exclude.indexOf(k) !== -1)) {
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
        deepClone: function(src) {
            var clone = {};
            var _this = this;
            this.forEach(src, function(value, k) {
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
        without: function(arr, el) {
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
        unique: function(arr, func) {
            var u = {};
            var a = [];
            if (!func) {
                func = function(d) {
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
        uniqueLast: function(arr, func) {
            var u = {};
            var a = [];
            if (!func) {
                func = function(d) {
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
        find: function(arr, func) {
            var found;
            this.forEach(arr, function(i) {
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
        filter: function(arr, filter) {
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
        filterAny: function(arr, filter, wildcard) {
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
        matchAny: function(values, compare, wildc) {
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
        mapRows: function(original, formatters) {

            var _this = this;
            function mapRow(value, fmt) {
                if(!_this.isArray(value)) {
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
            original = original.map(function(row) {
                for (var i = 0; i < columns_s; i++) {
                    var col = columns[i], new_val;
                    try {
                        new_val = mapRow(row[col], formatters[col]);
                    }
                    catch(e) {
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
        radiusToArea: function(r) {
            return r * r * Math.PI;
        },

        /*
         * Converts area to radius, simple math
         * @param {Number} area
         * @returns {Number} radius
         */
        areaToRadius: function(a) {
            return Math.sqrt(a / Math.PI);
        },

        /*
         * Prints message to timestamp
         * @param {String} message
         */
        timeStamp: function(message) {
            if (root.console && typeof root.console.timeStamp === 'function') {
                root.console.timeStamp(message);
            }
        },

        /*
         * Prints warning
         * @param {String} message
         */
        warn: function(message) {
            if (root.console && typeof root.console.warn === 'function') {
                root.console.warn(message);
            }
        },

        /*
         * Prints message for group
         * @param {String} message
         */
        groupCollapsed: function(message) {
            if (root.console && typeof root.console.groupCollapsed === 'function') {
                root.console.groupCollapsed(message);
            }
        },

        /*
         * Prints end of group
         * @param {String} message
         */
        groupEnd: function() {
            if (root.console && typeof root.console.groupEnd === 'function') {
                root.console.groupEnd();
            }
        },

        /*
         * Prints error
         * @param {String} message
         */
        error: function(message) {
            if (root.console && typeof root.console.error === 'function') {
                root.console.error(message);
            }
        },

        /*
         * Count the number of decimal numbers
         * @param {Number} number
         */
        countDecimals: function(number) {
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
        addClass: function(el, className) {
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
        removeClass: function(el, className) {
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
        classed: function(el, className, value) {
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
        hasClass: function(el, className) {
            if (el.classList) {
                return el.classList.contains(className);
            } else {
                //IE<10
                return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
            }
        },

        /*
         * Throttles a function
         * @param {Function} func
         * @param {Number} ms duration 
         */
        throttle: function() {
            var isThrottled = {};
            return function(func, ms) {
                if (isThrottled[func]) {
                    return;
                }
                isThrottled[func] = true;
                setTimeout(function() {
                    isThrottled[func] = false;
                }, ms);
                func();
            };
        }(),

        /*
         * Returns keys of an object as array
         * @param {Object} arg
         * @returns {Array} keys
         */
        keys: function(arg) {
            return Object.keys(arg);
        },

        /*
         * returns the values of an object in an array format
         * @param {Object} obj
         * @return {Array}
         */
        values: function(obj) {
            var arr;
            var keys = Object.keys(obj);
            var size = keys.length;
            for (var i = 0; i < size; i += 1) {
                (arr = arr || []).push(obj[keys[i]]);
            }
            return arr;
        },

        /*
         * Defers a function
         * @param {Function} func
         */
        defer: function(func) {
            setTimeout(func, 1);
        },

        /*
         * Creates a hashcode for a string or array
         * @param {String|Array} str
         * @return {Number} hashCode
         */
        hashCode: function(str) {
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
        ajax: function(options) {
            var request = new XMLHttpRequest();
            request.open(options.method, options.url, true);
            if (options.method === 'POST') {
                request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            }
            request.onload = function() {
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
            request.onerror = function() {
                if (options.error) {
                    options.error();
                }
            };
            request.send(options.data);
        },

        /*
         * Performs a GET http request
         */
        get: function(url, pars, success, error, json) {
            pars = pars || [];
            this.forEach(pars, function(value, key) {
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
        post: function(url, pars, success, error, json) {
            this.ajax({
                method: 'POST',
                url: url,
                success: success,
                error: error,
                json: json,
                data: pars
            });
        }
        
    };
}.call(this));
/*!
 * VIZABI PROMISES
 * Util functions
 */
(function() {
    'use strict';
    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;
    (function(root, factory) {
        if (typeof module !== 'undefined' && module.exports) {
            // CommonJS
            module.exports = factory();
        } else if (typeof define === 'function' && define.amd) {
            // AMD / RequireJS
            define(factory);
        } else {
            root.Promise = factory.call(root);
        }
    }(Vizabi, function() {
        'use strict';

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
        Promise.prototype.then = function(resolve, reject) {
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
        Promise.prototype.resolve = function(value) {
            if ('rejected' === this.status) {
                throw Error('Illegal call.');
            }
            this.status = 'resolved';
            this.value = value;
            this._resolves.length && fireQ(this);
            return this;
        };
        Promise.prototype.reject = function(reason) {
            if ('resolved' === this.status) {
                throw Error('Illegal call. ' + reason);
            }
            this.status = 'rejected';
            this.reason = reason;
            this._rejects.length && fireQ(this);
            return this;
        };
        // shortcut of promise.then(undefined, reject)
        Promise.prototype.catch = function(reject) {
            return this.then(void 0, reject);
        };
        // return a promise with another promise passing in
        Promise.cast = function(arg) {
            var p = Promise();
            if (arg instanceof Promise) {
                return resolvePromise(p, arg);
            } else {
                return Promise.resolve(arg);
            }
        };
        // return a promise which resolved with arg
        // the arg maybe a thanable object or thanable function or other
        Promise.resolve = function(arg) {
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
        Promise.all = function(promises) {
            var len = promises.length;
            var promise = Promise();
            var r = [];
            var pending = 0;
            var locked;
            var test = promises;
            //modified
            utils.forEach(promises, function(p, i) {
                p.then(function(v) {
                    r[i] = v;
                    if ((pending += 1) === len && !locked) {
                        promise.resolve(r);
                    }
                }, function(e) {
                    locked = true;
                    promise.reject(e);
                });
            });
            return promise;
        };
        // accept a promises array,
        // return a promise which will resolsed with the first resolved promise passed,
        // if any promise passed rejectd, the returned promise will rejected with the same reason
        Promise.any = function(promises) {
            var promise = Promise();
            var called;
            //modified
            utils.forEach(promises, function(p, i) {
                p.then(function(v) {
                    if (!called) {
                        promise.resolve(v);
                        called = true;
                    }
                }, function(e) {
                    called = true;
                    promise.reject(e);
                });
            });
            return promise;
        };
        // return a promise which reject with reason
        // reason must be an instance of Error object
        Promise.reject = function(reason) {
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
            var resolve = once(function(x) {
                if (called) {
                    return;
                }
                resolveX(promise, x);
                called = true;
            });
            var reject = once(function(r) {
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

        function noop() {}

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
            return function() {
                if (called) {
                    return r;
                }
                called = true;
                return r = fn.apply(this, arguments);
            };
        }
        return Promise;
    }));
}.call(this));
/*!
 * VIZABI CLASS
 * Base class
 * Based on Simple JavaScript Inheritance by John Resig
 * Source http://ejohn.org/blog/simple-javascript-inheritance/
 */
(function() {

    'use strict';

    var root = this;
    var Vizabi = root.Vizabi;
    var initializing = false;
    var fnTest = /xyz/.test(function() {
        xyz;
    }) ? /\b_super\b/ : /.*/;

    function extend(name, extensions) {

        //in case there are two args
        extensions = arguments.length === 1 ? name : extensions;
        var _super = this.prototype;
        initializing = true;
        var prototype = new this();
        initializing = false;

        Vizabi.utils.forEach(extensions, function(method, name) {
            if (typeof extensions[name] === 'function' && typeof _super[name] === 'function' && fnTest.test(extensions[name])) {
                prototype[name] = function(name, fn) {
                    return function() {
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
        Class.register = function(name, code) {
            if (typeof this._collection[name] !== 'undefined') {
                Vizabi.utils.warn('"' + name + '" is already registered. Overwriting...');
            }
            this._collection[name] = code;
        };
        
        Class.unregister = function(name) {
            delete this._collection[name];
        };

        Class.getCollection = function() {
            return this._collection;
        };

        //define a method or field in this prototype
        Class.define = function(name, value) {
            this.prototype[name] = value;
        };

        //get an item of the collection from this class
        Class.get = function(name, silent) {
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

    Vizabi.Class = function() {};
    Vizabi.Class.extend = extend;
    Vizabi.Helper = Vizabi.Class.extend({});

}.call(this));
/*!
 * VIZABI DATA
 * Manages data
 */
(function() {
    'use strict';

    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;
    var Promise = Vizabi.Promise;
    var Data = Vizabi.Class.extend({

        init: function() {
            this._collection = {};
        },

        /**
         * Loads resource from reader or cache
         * @param {Array} query Array with queries to be loaded
         * @param {String} language Language
         * @param {Object} reader Which reader to use - data reader info
         * @param {String} path Where data is located
         */
        load: function(query, language, reader, evts) {
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
                this.loadFromReader(query, language, reader).then(function(queryId) {
                    loaded = true;
                    cached = queryId;
                    wait.resolve();
                });
            }
            wait.then(function() {
                //pass the data forward
                var data = _this._collection[cached].data;
                //not loading anymore
                if (loaded && evts && typeof evts.load_end === 'function') {
                    evts.load_end();
                }
                promise.resolve(cached);
            }, function() {
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
        loadFromReader: function(query, lang, reader) {
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
            r.read(query, lang).then(function() {
                    //success reading
                    var values = r.getData();
                    var q = query;

                    //make sure all queried is returned
                    values = values.map(function(d) {
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
                    col.unique = {};
                    col.limits = {};
                    promise.resolve(queryId);
                }, //error reading
                function(err) {
                    promise.reject(err);
                });
            return promise;
        },

        /**
         * get data
         */
        get: function(queryId, what) {
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
        isCached: function(query, language, reader) {
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
        init: function(reader_info) {
            this._name = this._name || reader_info.reader;
            this._data = reader_info.data || [];
            this._basepath = this._basepath || reader_info.path || null;
            this._formatters = reader_info.formatters;

            if(this._formatters) {
                this._data = utils.mapRows(this._data, this._formatters);
            }
        },

        /**
         * Reads from source
         * @param {Array} queries Queries to be performed
         * @param {String} language language
         * @returns a promise that will be resolved when data is read
         */
        read: function(queries, language) {
            return new Promise.resolve();
        },
        
        /**
         * Gets the data
         * @returns all data
         */
        getData: function() {
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
(function() {
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
        init: function() {
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
        on: function(name, func) {
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
        unbind: function(name) {
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
        unbindAll: function() {
            this._events = {};
        },

        /**
         * Triggers an event, adding it to the buffer
         * @param {String|Array} name name of event or array with names
         * @param args Optional arguments (values to be passed)
         */
        trigger: function(name, args, original) {
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
                    var execute = function() {
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
        triggerAll: function(name, args, original) {
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
            var once = utils.unique(to_trigger, function(d) {
                return d[0]; //name of the event
            });
            for (i = 0; i < once.length; i += 1) {
                this.trigger.apply(this, once[i]);
            }
        },

        /**
         * Prevents all events from being triggered, buffering them
         */
        freeze: function(exceptions) {
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
        unfreeze: function() {
            this._freeze = false;
            this._freezeExceptions = {};
            //execute old frozen events
            while (this._freezer.length) {
                var execute = this._freezer.shift();
                execute();
            }
        }
    });

    //generic event functions
    /**
     * freezes all events
     */
    Events.freezeAll = function(exceptions) {
        _freezeAllEvents = true;
        if (!exceptions) {
            return;
        }
        if (!utils.isArray(exceptions)) {
            exceptions = [exceptions];
        }
        utils.forEach(exceptions, function(e) {
            _freezeAllExceptions[e] = true;
        });
    };

    /**
     * triggers all frozen events form all instances
     */
    Events.unfreezeAll = function() {
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
(function() {

    'use strict';

    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;
    var Intervals = Vizabi.Class.extend({

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
(function() {

    'use strict';

    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;
    //classes are vzb-portrait, vzb-landscape...
    var class_prefix = 'vzb-';
    var class_portrait = 'vzb-portrait';
    var class_lansdcape = 'vzb-landscape';

    var screen_sizes = {
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
    };

    var Layout = Vizabi.Events.extend({

        /**
         * Initializes the layout manager
         */
        init: function() {
            this._container = null;
            //dom element
            this._curr_profile = null;
            this._prev_size = {};
            //resize when window resizes
            var _this = this;
            root.addEventListener('resize', function() {
                if (_this._container) {
                    _this.setSize();
                }
            });
            this._super();
        },

        /**
         * Calculates the size of the newly resized container
         */
        setSize: function() {
            var _this = this;
            var width = this._container.clientWidth;
            var height = this._container.clientHeight;
            if (this._prev_size && this._prev_size.width === width && this._prev_size.height === height) {
                return;
            }
            utils.forEach(screen_sizes, function(range, size) {
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
        setContainer: function(container) {
            this._container = container;
            this.setSize();
        },

        /**
         * Gets the current selected profile
         * @returns {String} name of current profile
         */
        currentProfile: function() {
            return this._curr_profile;
        }
    });
    
    Vizabi.Layout = Layout;

}.call(this));
/*!
 * VIZABI MODEL
 * Base Model
 */
 
(function() {

    'use strict';

    var root = this;
    var Vizabi = root.Vizabi;
    var Promise = Vizabi.Promise;
    var utils = Vizabi.utils;

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
        init: function(values, parent, bind, freeze) {
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
        get: function(attr) {
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
        set: function(attr, val, force) {
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
        getType: function() {
            return this._type;
        },

        /**
         * Gets all submodels of the current model
         */
        getSubmodels: function() {
            var submodels = [];
            utils.forEach(this._data, function(s) {
                if (s && typeof s._id !== 'undefined') {
                    submodels.push(s);
                }
            });
            return submodels;
        },

        /**
         * Gets the current model and submodel values as a JS object
         * @returns {Object} All model as JS object
         */
        getObject: function() {
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
        clear: function() {
            var submodels = this.getSubmodels();
            for (var i in submodels) {
                submodels[i].clear();
            }
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
        validate: function() {},

        /* ==========================
         * Model loading
         * ==========================
         */

        /**
         * checks whether this model is loading anything
         * @param {String} optional process id (to check only one)
         * @returns {Boolean} is it loading?
         */
        isLoading: function(p_id) {
            if (this.isHook() && !this._loadedOnce) {
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
        setLoading: function(p_id) {
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
        setLoadingDone: function(p_id) {
            this._loading = utils.without(this._loading, p_id);
            this.setReady();
        },

        /**
         * Sets the model as ready or not depending on its loading status
         */
        setReady: function(value) {
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
         * @returns defer
         */
        load: function() {
            var _this = this;
            var submodels = this.getSubmodels();
            var data_hook = this._dataModel;
            var language_hook = this._languageModel;
            var query = this.getQuery();
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
                    'load_start': function() {
                        _this.setLoading('_hook_data');
                        Vizabi.Events.freezeAll([
                            'load_start',
                            'resize',
                            'dom_ready'
                        ]);
                    },
                    'load_end': function() {
                        Vizabi.Events.unfreezeAll();
                        _this.setLoadingDone('_hook_data');
                    }
                };

                utils.timeStamp('Vizabi Model: Loading Data: ' + _this._id);
                _DATAMANAGER.load(query, lang, reader, evts).then(function(dataId) {
                    _this._dataId = dataId;
                    utils.timeStamp('Vizabi Model: Data loaded: ' + _this._id);
                    _this.afterLoad();
                    promise.resolve();
                }, function(err) {
                    _this.trigger('load_error', query);
                    promise.reject(err);
                });
                promises.push(promise);
            }
            //load submodels as well
            for (var i in submodels) {
                promises.push(submodels[i].load());
            }
            //when all promises/loading have been done successfully
            //we will consider this done
            var wait = promises.length ? Promise.all(promises) : new Promise.resolve();
            wait.then(function() {
                if (_this.validate) {
                    _this.validate();
                }
                utils.timeStamp('Vizabi Model: Model loaded: ' + _this._id);
                //end this load call
                _this._loadedOnce = true;
                _this._loadCall = false;
                _this.setReady();
                promiseLoad.resolve();
            });
            return promiseLoad;
        },

        /**
         * executes after data has actually been loaded
         */
        afterLoad: function() {},

        /**
         * removes all external dependency references
         */
        resetDeps: function() {
            this._deps.children = [];
        },

        /**
         * add external dependency ref to this model
         */
        addDep: function(child) {
            this._deps.children.push(child);
            child._deps.parent.push(this);
        },

        /* ===============================
         * Hooking model to external data
         * ===============================
         */

        /**
         * is this model hooked to data?
         */
        isHook: function() {
            return this.use ? true : false;
        },
        /**
         * Hooks all hookable submodels to data
         */
        setHooks: function() {
            if (this.isHook()) {
                //what should this hook to?
                this.hookModel();
            }
            //hook submodels
            var submodels = this.getSubmodels();
            utils.forEach(submodels, function(s) {
                s.setHooks();
            });
        },

        /**
         * Hooks this model to data, entities and time
         * @param {Object} h Object containing the hooks
         */
        hookModel: function() {
            var _this = this;
            var spaceRefs = getSpace(this);
            // assuming all models will need data and language support
            this._dataModel = getClosestModel(this, 'data');
            this._languageModel = getClosestModel(this, 'language');
            //check what we want to hook this model to
            utils.forEach(spaceRefs, function(name) {
                //hook with the closest prefix to this model
                _this._space[name] = getClosestModel(_this, name);
                //if hooks change, this should load again
                //TODO: remove hardcoded 'show"
                if (_this._space[name].show) {
                    _this._space[name].on('change:show', function(evt) {
                        _this.load();
                    });
                }
            });
            //this is a hook, therefore it needs to reload when data changes
            this.on('change', function() {
                _this.load();
            });
            //this is a hook, therefore it needs to reload when data changes
            this.on('hook_change', function() {
                _this.setReady(false);
            });
        },

        /**
         * gets all sub values for a certain hook
         * only hooks have the "hook" attribute.
         * @param {String} type specific type to lookup
         * @returns {Array} all unique values with specific hook use
         */
        getHookValues: function(type) {
            var values = [];
            if (this.use && this.use === type) {
                values.push(this.which);
            }
            //repeat for each submodel
            utils.forEach(this.getSubmodels(), function(s) {
                values = utils.unique(values.concat(s.getHookValues(type)));
            });
            //now we have an array with all values in a type of hook for hooks.
            return values;
        },

        /**
         * gets all sub values for indicators in this model
         * @returns {Array} all unique values of indicator hooks
         */
        getIndicators: function() {
            return this.getHookValues('indicator');
        },

        /**
         * gets all sub values for indicators in this model
         * @returns {Array} all unique values of property hooks
         */
        getProperties: function() {
            return this.getHookValues('property');
        },

        /**
         * gets all hook dimensions
         * @param {Object} options
         * @returns {Array} all unique dimensions
         */
        _getAllDimensions: function(opts) {
            opts = opts || {};
            var dims = [];
            var dim;
            utils.forEach(this._space, function(m) {
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
            return dims;
        },

        /**
         * gets first dimension that matches type
         * @param {Object} options
         * @returns {Array} all unique dimensions
         */
        _getFirstDimension: function(opts) {
            opts = opts || {};
            var dim = false;
            utils.forEach(this._space, function(m) {
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
         * @returns {Object} filters
         */
        _getAllFilters: function() {
            var filters = {};
            utils.forEach(this._space, function(h) {
                filters = utils.extend(filters, h.getFilter());
            });
            return filters;
        },

        /**
         * gets all hook filters
         * @returns {Object} filters
         */
        _getAllFormatters: function() {
            var formatters = {};
            utils.forEach(this._space, function(h) {
                var f = h.getFormatter();
                if (f) {
                    formatters[h.getDimension()] = f;
                }
            });
            return formatters;
        },

        /**
         * gets the value specified by this hook
         * @param {Object} filter Reference to the row. e.g: {geo: "swe", time: "1999", ... }
         * @returns hooked value
         */
        getValue: function(filter) {
            //extract id from original filter
            var id = utils.clone(filter, this._getAllDimensions());
            return this.mapValue(this._getHookedValue(id));
        },

        /**
         * gets multiple values from the hook
         * @param {Object} filter Reference to the row. e.g: {geo: "swe", time: "1999", ... }
         * @returns an array of values
         */
        getValues: function(filter) {
            //extract id from original filter
            var id = utils.clone(filter, this._getAllDimensions());
            return this._getHookedValues(id);
        },

        /**
         * maps the value to this hook's specifications
         * @param value Original value
         * @returns hooked value
         */
        mapValue: function(value) {
            return value;
        },

        /**
         * gets the items associated with this hook without values
         * @param value Original valueg
         * @returns hooked value
         */
        getItems: function(filter) {
            if (this.isHook() && this._dataModel) {
                //all dimensions except time (continuous)
                var dimensions = this._getAllDimensions({
                    exceptType: 'time'
                });
                var excluded = this._getAllDimensions({
                    onlyType: 'time'
                });

                return this.getUnique(dimensions).map(function(item) {
                    utils.forEach(excluded, function(e) {
                        if (filter && filter[e]) {
                            item[e] = filter[e];
                        }
                    });
                    return item;
                });
            } else {
                return [];
            }
        },

        /**
         * Gets the dimension of this model if it has one
         * @returns {String|Boolean} dimension
         */
        getDimension: function() {
            return this.dim || false; //defaults to dim if it exists
        },

        /**
         * Gets the filter for this model if it has one
         * @returns {Object} filters
         */
        getFilter: function() {
            return {}; //defaults to no filter
        },

        /**
         * Gets formatter for this model
         * @returns {Function|Boolean} formatter function
         */
        getFormatter: function() {},

        /**
         * gets query that this model/hook needs to get data
         * @returns {Array} query
         */
        getQuery: function() {
            //only perform query in these two uses
            var needs_query = [
                'property',
                'indicator'
            ];
            //if it's not a hook, property or indicator, no query is necessary
            if (!this.isHook() || needs_query.indexOf(this.use) === -1) {
                return true;
            } //error if there's nothing to hook to
            else if (Object.keys(this._space).length < 1) {
                utils.error('Error:', this._id, 'can\'t find any dimension');
                return true;
            } //else, its a hook (indicator or property) and it needs to query
            else {
                var dimensions = this._getAllDimensions();
                var select = utils.unique(dimensions.concat([this.which]));
                var filters = this._getAllFilters();
                //return query
                return {
                    'from': 'data',
                    'select': select,
                    'where': filters
                };
            }
        },

        /**
         * Gets tick values for this hook
         * @returns {Number|String} value The value for this tick
         */
        tickFormatter: function(x, formatterRemovePrefix) {

            if (utils.isDate(x)) {
                //find time model and use its format
                var timeModel;
                utils.forEach(this._space, function(m) {
                    if (m.getType() === 'time') {
                        timeModel = m;
                        return false;
                    }
                });
                if(!timeModel) return;
                var fmt = d3.time.format(timeModel.formatOutput || "%Y");
                return fmt(x);
            }
            if (utils.isString(x)) {
                return x;
            }
            var format = 'f';
            var prec = 0;
            if (Math.abs(x) < 1) {
                prec = 1;
                format = 'r';
            }
            var prefix = '';
            if (formatterRemovePrefix) {
                return d3.format('.' + prec + format)(x);
            }
            switch (Math.floor(Math.log10(Math.abs(x)))) {
                case -13:
                    x = x * 1000000000000;
                    prefix = 'p';
                    break;
                    //0.1p
                case -10:
                    x = x * 1000000000;
                    prefix = 'n';
                    break;
                    //0.1n
                case -7:
                    x = x * 1000000;
                    prefix = '\xB5';
                    break;
                    //0.1µ
                case -6:
                    x = x * 1000000;
                    prefix = '\xB5';
                    break;
                    //1µ
                case -5:
                    x = x * 1000000;
                    prefix = '\xB5';
                    break;
                    //10µ
                case -4:
                    break;
                    //0.0001
                case -3:
                    break;
                    //0.001
                case -2:
                    break;
                    //0.01
                case -1:
                    break;
                    //0.1
                case 0:
                    break;
                    //1
                case 1:
                    break;
                    //10
                case 2:
                    break;
                    //100
                case 3:
                    break;
                    //1000
                case 4:
                    break;
                    //10000
                case 5:
                    x = x / 1000;
                    prefix = 'k';
                    break;
                    //0.1M
                case 6:
                    x = x / 1000000;
                    prefix = 'M';
                    prec = 1;
                    break;
                    //1M
                case 7:
                    x = x / 1000000;
                    prefix = 'M';
                    break;
                    //10M
                case 8:
                    x = x / 1000000;
                    prefix = 'M';
                    break;
                    //100M
                case 9:
                    x = x / 1000000000;
                    prefix = 'B';
                    prec = 1;
                    break;
                    //1B
                case 10:
                    x = x / 1000000000;
                    prefix = 'B';
                    break;
                    //10B
                case 11:
                    x = x / 1000000000;
                    prefix = 'B';
                    break;
                    //100B
                case 12:
                    x = x / 1000000000000;
                    prefix = 'T';
                    prec = 1;
                    break;
                    //1T
                    //use the D3 SI formatting for the extreme cases
                default:
                    return d3.format('.' + prec + 's')(x).replace('G', 'B');
            }
            // use manual formatting for the cases above
            return (d3.format('.' + prec + format)(x) + prefix).replace('G', 'B');
        },

        /**
         * Gets the d3 scale for this hook. if no scale then builds it
         * @returns {Array} domain
         */
        getScale: function() {
            if (!this.scale) {
                this.buildScale();
            }
            return this.scale;
        },

        /**
         * Gets the domain for this hook
         * @returns {Array} domain
         */
        buildScale: function() {
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
            this.scale = d3.scale[scaleType]().domain(domain);
        },

        /**
         * Gets limits
         * @param {String} attr parameter
         * @returns {Object} limits (min and max)
         */
        getLimits: function(attr) {
            if (!this.isHook()) {
                return;
            }
            //store limits so that we stop rechecking.
            var cachedLimits = _DATAMANAGER.get(this._dataId, 'limits');
            if (cachedLimits[attr]) {
                return cachedLimits[attr];
            }
            var map = function(n) {
                return (utils.isDate(n)) ? n : parseFloat(n);
            };
            var items = _DATAMANAGER.get(this._dataId);
            var filtered = items.reduce(function(filtered, d) {
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
        getUnique: function(attr) {
            if (!this.isHook()) {
                return;
            }
            if (!attr) {
                attr = this._getFirstDimension({ type: "time" });
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
                var values = items.map(function(d) {
                    return utils.clone(d, attr); //pick attrs
                });
                uniq = utils.unique(values, function(n) {
                    return JSON.stringify(n);
                });
            } //if it's a string, it will return a list of values
            else {
                var values = items.map(function(d) {
                    return d[attr];
                });
                uniq = utils.unique(values);
            }
            uniqueItems[uniq_id] = uniq;
            return uniq;
        },

        /**
         * gets the value of the hook point
         * @param {Object} filter Id the row. e.g: {geo: "swe", time: "1999"}
         * @returns hooked value
         */
        _getHookedValue: function(filter) {
            if (!this.isHook()) {
                utils.warn('_getHookedValue method needs the model to be hooked to data.');
                return;
            }
            var value;
            if (this.use === 'value') {
                value = this.which;
            } else if (this._space.hasOwnProperty(this.use)) {
                value = this._space[this.use][this.which];
            } else {
                value = interpolateValue(this, filter, this.use, this.which);
            }
            return value;
        },

        /**
         * gets the values of the hook point
         * @param {Object} filter Id the row. e.g: {geo: "swe", time: "1999"}
         * @returns an array of hooked values
         */
        _getHookedValues: function(filter) {
            var _this = this;
            if (!this.isHook()) {
                utils.warn('_getHookedValues method needs the model to be hooked to data.');
                return;
            }
            var values;
            var items = _DATAMANAGER.get(this._dataId);
            var dimTime = this._getFirstDimension({type: 'time'});

            if (this.use === 'value') {
                values = [this.which];
            } else if (this._space.hasOwnProperty(this.use)) {
                values = [this._space[this.use][this.which]];
            } else {
                // if a specific time is requested -- return values up to this time
                if (filter && filter.hasOwnProperty(dimTime)) {
                    // save time into variable
                    var time = new Date(filter[dimTime]);
                    // filter time will be removed during interpolation
                    var lastValue = interpolateValue(this, filter, this.use, this.which);
                    // return values up to the requested time point, append an interpolated value as the last one
                    values = utils.filter(items, filter).filter(function(d) {
                        return d[dimTime] <= time;
                    }).map(function(d) {
                        return d[_this.which];
                    }).concat(lastValue);
                } else {
                    // if time not requested -- return just all values
                    values = items.filter(filter).map(function(d) {
                        return d[_this.which];
                    });
                }
            }
            return values;
        },

        //TODO: Is this supposed to be here?
        /**
         * gets maximum, minimum and mean values from the dataset of this certain hook
         */
        getMaxMinMean: function(timeFormatter) {
            var _this = this;
            var result = {};
            //TODO: d3 is global?
            //Can we do this without d3?
            var dim = this._getFirstDimension({ type: 'time' });

            d3.nest().key(function(d) {
                return timeFormatter(d[dim]);
            }).entries(_DATAMANAGER.get(this._dataId)).forEach(function(d) {
                var values = d.values.filter(function(f) {
                    return f[_this.which] !== null;
                }).map(function(m) {
                    return +m[_this.which];
                });
                result[d.key] = {
                    max: d3.max(values),
                    min: d3.min(values),
                    mean: d3.mean(values)
                };
            });
            return result;
        },

        /**
         * gets filtered dataset with fewer keys
         */
        getFilteredItems: function(filter) {
            //cache optimization
            var filter_id = JSON.stringify(filter);
            var filtered = _DATAMANAGER.get(this._dataId, 'filtered');
            if(!filter) return filtered;
            var found = filtered[filter_id];
            if (filtered[filter_id]) {
                return filtered[filter_id];
            }
            var items = _DATAMANAGER.get(this._dataId);
            return filtered[filter_id] = utils.filter(items, filter);
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
                get: function(p) {
                    return function() {
                        return model.get(p);
                    };
                }(prop),
                set: function(p) {
                    return function(value) {
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
        //naming convention: underscore -> time, time_2, time_overlay
        var name = attr.split('_')[0];
        var binds = {
            //the submodel has changed (multiple times)
            'change': function(evt, vals) {
                evt = evt.replace('change', 'change:' + name);
                ctx.triggerAll(evt, ctx.getObject());
            },
            //loading has started in this submodel (multiple times)
            'hook_change': function(evt, vals) {
                ctx.trigger(evt, ctx.getObject());
            },
            //loading has started in this submodel (multiple times)
            'load_start': function(evt, vals) {
                evt = evt.replace('load_start', 'load_start:' + name);
                ctx.triggerAll(evt, ctx.getObject());
                ctx.setReady(false);
            },
            //loading has failed in this submodel (multiple times)
            'load_error': function(evt, vals) {
                evt = evt.replace('load_error', 'load_error:' + name);
                ctx.triggerAll(evt, vals);
            },
            //loading has ended in this submodel (multiple times)
            'ready': function(evt, vals) {
                //trigger only for submodel
                evt = evt.replace('ready', 'ready:' + name);
                ctx.trigger(evt, vals);
                //TODO: understand why we need to force it not to be ready
                ctx.setReady(false);
                ctx.setReady();
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
            utils.error('ERROR: dimensions not found.\n You must specify the objects this hook will use under the dimensions attribute in the state.\n Example:\n dimensions: ["entities", "time"]');
        }
    }

    /**
     * interpolates the specific value if missing
     * @param {Object} filter Id the row. e.g: {geo: "swe", time: "1999"}
     * filter SHOULD contain time property
     * @returns interpolated value
     */
    function interpolateValue(ctx, filter, use, which) {

        var dimTime = ctx._getFirstDimension({ type: 'time' });
        var time = new Date(filter[dimTime]); //clone date
        delete filter[dimTime];

        var items = ctx.getFilteredItems(filter);
        if (items === null || items.length === 0) {
            utils.warn('interpolateValue returning NULL because items array is empty');
            return null;
        }

        // return constant for the use of "value"
        if (use === 'value') {
            return items[0][which];
        }
        // search where the desired value should fall between the known points
        // TODO: d3 is global?
        var indexNext = d3.bisectLeft(items.map(function(d) {
            return d[dimTime];
        }), time);
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

        // perform a simple linear interpolation
        var fraction = (time - items[indexNext - 1][dimTime]) / (items[indexNext][dimTime] - items[indexNext - 1][dimTime]);
        var value = +items[indexNext - 1][which] + (items[indexNext][which] - items[indexNext - 1][which]) * fraction;
        // cast to time object if we are interpolating time
        if (Object.prototype.toString.call(items[0][which]) === '[object Date]') {
            value = new Date(value);
        }
        return value;
    }

}.call(this));
/*!
 * VIZABI COMPONENT
 * Base Component
 */
(function() {

    'use strict';

    var class_loading = 'vzb-loading';
    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;
    var templates = {};
    var Component = Vizabi.Events.extend({

        /**
         * Initializes the component
         * @param {Object} config Initial config, with name and placeholder
         * @param {Object} parent Reference to tool
         */
        init: function(config, parent) {
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
            this._components_config = this.components.map(function(x) {
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
                'readyOnce': function() {
                    if (typeof _this.readyOnce === 'function') {
                        _this.readyOnce();
                    }
                },
                'ready': function() {
                    if (typeof _this.ready === 'function') {
                        _this.ready();
                    }
                },
                'resize': function() {
                    if (typeof _this.resize === 'function') {
                        _this.resize();
                    }
                }
            });
        },

        /**
         * Renders the component (after data is ready)
         */
        render: function() {
            var _this = this;
            this.loadTemplate();
            this.loadComponents();
            //render each subcomponent
            utils.forEach(this.components, function(subcomp) {
                subcomp.render();
                _this.on('resize', function() {
                    subcomp.trigger('resize');
                });
            });
            //if it's a root component with model
            if (this.isRoot() && this.model) {
                this.model.on('ready', function() {
                    done();
                });
                this.model.setHooks();
                this.model.load();
            } else if (this.model && this.model.isLoading()) {
                this.model.on('ready', function() {
                    done();
                });
            } else {
                done();
            }

            function done() {
                utils.removeClass(_this.placeholder, class_loading);
                _this.setReady();
            }
        },
        setReady: function() {
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
        loadTemplate: function() {
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
            this.placeholder.innerHTML = rendered;
            this.element = this.placeholder.children[0];
            //only tools have layout (manage sizes)
            if (this.layout) {
                this.layout.setContainer(this.element);
                this.layout.on('resize', function() {
                    if (_this._ready) {
                        utils.throttle(function() {
                            _this.trigger('resize');
                        }, _this._frameRate);
                    }
                });
            }
        },

        /*
         * Loads all subcomponents
         */
        loadComponents: function() {
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
            utils.forEach(this._components_config, function(c) {
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
        isRoot: function() {
            return this.parent === this;
        },

        /**
         * Get layout profile of the current resolution
         * @returns {String} profile
         */
        getLayoutProfile: function() {
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
        _uiMapping: function(id, ui) {
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
        _modelMapping: function(subcomponent, model_config, model_expects, model_binds) {
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
                utils.forEach(model_config, function(m, i) {
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
                    utils.forEach(expected, function(m) {
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
        getTranslationFunction: function(wrap) {
            var t_func;
            try {
                t_func = this.model.get('language').getTFunction();
            } catch (err) {
                if (this.parent && this.parent !== this) {
                    t_func = this.parent.getTranslationFunction();
                }
            }
            if (!t_func) {
                t_func = function(s) {
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
        _translatedStringFunction: function(translation_function) {
            return function(string) {
                var translated = translation_function(string);
                return '<span data-vzb-translate="' + string + '">' + translated + '</span>';
            };
        },

        /**
         * Translate all strings in the template
         */
        translateStrings: function() {
            var t = this.getTranslationFunction();
            var strings = this.placeholder.querySelectorAll('[data-vzb-translate]');
            if (strings.length === 0) {
                return;
            }
            utils.forEach(strings, function(str) {
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
        isTool: function() {
            return this._id[0] === 't';
        },

        /**
         * Executes after the template is loaded and rendered.
         * Ideally, it contains HTML instantiations related to template
         * At this point, this.element and this.placeholder are available
         * as DOM elements
         */
        readyOnce: function() {},

        /**
         * Executes after the template and model (if any) are ready
         */
        ready: function() {},

        /**
         * Executes when the resize event is triggered.
         * Ideally, it only contains operations related to size
         */
        resize: function() {}
    });

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
    Component.isComponent = function(c) {
        return c._id && (c._id[0] === 't' || c._id[0] === 'c');
    };
    
    Vizabi.Component = Component;

}.call(this));
/*!
 * VIZABI COMPONENT
 * Base Component
 */
(function() {
    'use strict';
    var class_loading = 'vzb-loading';
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
        init: function(values, defaults, binds, validate) {
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
                this.on('change:language', function() {
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
        init: function(placeholder, options) {
            this._id = utils.uniqueId('t');
            this.layout = new Vizabi.Layout();
            this.template = this.template || '<div class="vzb-tool vzb-tool-' + this.name + '"><div class="vzb-tool-content"><div class="vzb-tool-stage"><div class="vzb-tool-viz"></div><div class="vzb-tool-timeslider"></div></div><div class="vzb-tool-buttonlist"></div></div></div>';
            this.model_binds = this.model_binds || {};
            this.default_options = this.default_options || {};
            //bind the validation function with the tool
            var validate = this.validate.bind(this);
            var _this = this;
            var callbacks = utils.merge({
                'change': function(evt, val) {
                    if (_this._ready) {
                        _this.model.validate();
                        _this.triggerAll(evt, val);
                    }
                },
                'translate': function(evt, val) {
                    if (_this._ready) {
                        _this.model.load().then(function() {
                            _this.model.validate();
                            _this.translateStrings();
                        });
                    }
                },
                'load_start': function() {
                    _this.beforeLoading();
                },
                'load_error': function() {
                    _this.errorLoading();
                },
                'ready': function(evt) {
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
        _bindEvents: function() {
            if (!this.model.bind) {
                return;
            }
            this.on(this.model.bind.get());
        },

        /**
         * Sets options from external page
         * @param {Object} options new options
         * @param {Boolean} overwrite overwrite everything instead of extending
         * @param {Boolean} silent prevent events
         */
        setOptions: function(options, overwrite, silent) {
            if (overwrite) {
                this.model.reset(options);
            } else {
                this.model.set(options);
            }
            this._setUIOptions();
        },

        /**
         * gets all options
         * @param {Object} options new options
         * @param {Boolean} overwrite overwrite everything instead of extending
         * @param {Boolean} silent prevent events
         */
        getOptions: function() {
            return this.model.getObject() || {};
        },
        /**
         * Displays loading class
         */
        beforeLoading: function() {
            if (!utils.hasClass(this.placeholder, class_loading_data)) {
                utils.addClass(this.placeholder, class_loading_data);
            }
        },
        /**
         * Removes loading class
         */
        afterLoading: function() {
            utils.removeClass(this.placeholder, class_loading_data);
        },
        /**
         * Adds loading error class
         */
        errorLoading: function() {
            utils.addClass(this.placeholder, class_loading_error);
        },
        /* ==========================
         * Validation and query
         * ==========================
         */
        /**
         * Placeholder for model validation
         */
        validate: function() {},
        _setUIOptions: function() {
            //add placeholder class
            utils.addClass(this.placeholder, class_placeholder);
            //add-remove buttonlist class
            if (!this.ui || !this.ui.buttons || !this.ui.buttons.length) {
                utils.addClass(this.element, class_buttons_off);
            } else {
                utils.removeClass(this.element, class_buttons_off);
            }
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

    //utility function to check if a component is a tool
    //TODO: Move to utils?
    Tool.isTool = function(c) {
        return c._id && c._id[0] === 't';
    };

    Vizabi.Tool = Tool;
}.call(this));
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/components/_gapminder/bubblesize/bubblesize.html');s.innerHTML = '<div class="vzb-bs-holder"> <input type="range" id="vzb-bs-slider" class="vzb-bs-slider" step="1"> </div>';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/components/_gapminder/buttonlist/dialogs/axes/axes.html');s.innerHTML = '<div class="vzb-dialog-modal"> <div class="vzb-dialog-title"> <%=t ( "buttons/axes") %> </div> <div class="vzb-dialog-content"> <div class="vzb-xaxis-container"></div> <div class="vzb-yaxis-container"></div> <div class="vzb-axes-options"></div> </div> <div class="vzb-dialog-buttons"> <div data-click="closeDialog" class="vzb-dialog-button vzb-label-primary"> OK </div> </div> </div>';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/components/_gapminder/buttonlist/dialogs/colors/colors.html');s.innerHTML = '<div class="vzb-dialog-modal"> <div class="vzb-dialog-title"> <%=t ( "buttons/colors") %> </div> <div class="vzb-dialog-content"> <span class="vzb-caxis-container"></span> <div class="vzb-clegend-container"></div> </div> <div class="vzb-dialog-buttons"> <div data-click="closeDialog" class="vzb-dialog-button vzb-label-primary"> OK </div> </div> </div>';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/components/_gapminder/buttonlist/dialogs/find/find.html');s.innerHTML = '<div class="vzb-dialog-modal"> <div class="vzb-dialog-title"> <%=t ( "buttons/find") %> </div> <div class="vzb-dialog-content vzb-find-filter"> <input id="vzb-find-search" class="vzb-dialog-input" type="text" placeholder="Search..." /> </div> <div class="vzb-dialog-content vzb-dialog-content-fixed"> <div class="vzb-find-list">  </div> </div> <div class="vzb-dialog-buttons"> <div class="vzb-dialog-bubbleopacity vzb-dialog-control"></div> <div id="vzb-find-deselect" class="vzb-dialog-button"> <%=t ( "buttons/deselect") %> </div> <div data-click="closeDialog" class="vzb-dialog-button vzb-label-primary"> <%=t ( "buttons/ok") %> </div> </div> </div>';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/components/_gapminder/buttonlist/dialogs/moreoptions/moreoptions.html');s.innerHTML = '<div class="vzb-dialog-modal"> <div class="vzb-dialog-title"> <%=t ( "buttons/more_options") %> </div> <div class="vzb-dialog-content"> <p>Regular opacity</p> <div class="vzb-dialog-bubbleopacity-regular"></div> <p>Opacity of non-selected</p> <div class="vzb-dialog-bubbleopacity-selectdim"></div> <div class = "vzb-dialog-br"></div> <p>X axis</p> <div class="vzb-xaxis-container"></div> <p>Y axis</p> <div class="vzb-yaxis-container"></div> <div class="vzb-axes-options"></div> <div class = "vzb-dialog-br"></div> <p>Size</p> <div class="vzb-saxis-container"></div> <div class="vzb-dialog-bubblesize"></div> <div class = "vzb-dialog-br"></div> <p>Colors</p> <div class="vzb-caxis-container"></div> <div class="vzb-clegend-container"></div> </div> <div class="vzb-dialog-buttons"> <div data-click="closeDialog" class="vzb-dialog-button vzb-label-primary"> OK </div> </div> </div>';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/components/_gapminder/buttonlist/dialogs/size/size.html');s.innerHTML = '<div class="vzb-dialog-modal"> <div class="vzb-dialog-title"> <%=t ( "buttons/size") %> </div> <div class="vzb-dialog-content"> <p>Chose what to display as size</p> <div class="vzb-saxis-container"></div> <p>Choose maximum size of bubbles:</p> <div class="vzb-dialog-bubblesize"></div> </div> <div class="vzb-dialog-buttons"> <div data-click="closeDialog" class="vzb-dialog-button vzb-label-primary"> OK </div> </div> </div>';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/components/_gapminder/timeslider/timeslider.html');s.innerHTML = '<div class="vzb-timeslider"> <div class="vzb-ts-slider-wrapper"> <svg class="vzb-ts-slider"> <g> <g class="vzb-ts-slider-axis"></g> <g class="vzb-ts-slider-slide"> <circle class="vzb-ts-slider-handle"></circle> <text class="vzb-ts-slider-value"></text> </g> </g> </svg> </div>  <div class="vzb-ts-btns"> <button class="vzb-ts-btn-play vzb-ts-btn"> <svg class="vzb-icon vzb-icon-play" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1576 927l-1328 738q-23 13-39.5 3t-16.5-36v-1472q0-26 16.5-36t39.5 3l1328 738q23 13 23 31t-23 31z"/></svg> </button> <button class="vzb-ts-btn-pause vzb-ts-btn"> <svg class="vzb-icon vzb-icon-pause" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1664 192v1408q0 26-19 45t-45 19h-512q-26 0-45-19t-19-45v-1408q0-26 19-45t45-19h512q26 0 45 19t19 45zm-896 0v1408q0 26-19 45t-45 19h-512q-26 0-45-19t-19-45v-1408q0-26 19-45t45-19h512q26 0 45 19t19 45z"/></svg> </button> </div> </div>';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/tools/barchart/barchart.html');s.innerHTML = ' <svg class="vzb-barchart"> <g class="vzb-bc-graph"> <g class="vzb-bc-bars"></g> <g class="vzb-bc-bar-labels"></g> <text class="vzb-bc-axis-y-title"></text> <g class="vzb-bc-axis-x"></g> <g class="vzb-bc-axis-y"></g> <g class="vzb-bc-axis-labels">  </g> </g> </svg>';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/tools/bubblechart/bubblechart.html');s.innerHTML = ' <div class="vzb-bubblechart"> <svg class="vzb-bubblechart-svg"> <g class="vzb-bc-graph"> <text class="vzb-bc-year"></text> <svg class="vzb-bc-axis-x"><g></g></svg> <svg class="vzb-bc-axis-y"><g></g></svg> <line class="vzb-bc-projection-x"></line> <line class="vzb-bc-projection-y"></line> <svg class="vzb-bc-bubbles-crop"> <g class="vzb-bc-trails"></g> <g class="vzb-bc-bubbles"></g> <g class="vzb-bc-labels"></g> </svg> <g class="vzb-bc-axis-y-title"></g> <g class="vzb-bc-axis-x-title"></g> <g class="vzb-bc-axis-s-title"></g> <g class="vzb-bc-axis-c-title"></g> <rect class="vzb-bc-zoomRect"></rect> </g> <filter id="vzb-bc-blur-effect"> <feGaussianBlur stdDeviation="2" /> </filter> </svg>  <div class="vzb-tooltip vzb-hidden"></div> </div>';root.document.body.appendChild(s);}).call(this);
(function() {var root = this;var s = root.document.createElement('script');s.type = 'text/template';s.setAttribute('id', 'src/tools/linechart/linechart.html');s.innerHTML = ' <div class="vzb-linechart"> <svg class="vzb-lc-graph"> <g> <g class="vzb-lc-axis-x"></g> <text class="vzb-lc-axis-x-value"></text> <text class="vzb-lc-axis-y-value"></text> <svg class="vzb-lc-lines"></svg> <g class="vzb-lc-axis-y"></g> <line class="vzb-lc-projection-x"></line>; <line class="vzb-lc-projection-y"></line>; <g class="vzb-lc-labels"> <line class="vzb-lc-vertical-now"></line>; </g> <g class="vzb-lc-axis-y-title"></g> </g>  </svg> <div class="vzb-tooltip vzb-hidden"></div> </div>';root.document.body.appendChild(s);}).call(this);
/*!
 * VIZABI BUBBLE OPACITY CONTROL
 * Reusable OPACITY SLIDER
 */

(function() {

    "use strict";

    var Vizabi = this.Vizabi;
    var utils = Vizabi.utils;

    if (!Vizabi._require('d3')) return;
    
    Vizabi.Component.extend('gapminder-bubbleopacity', {

        init: function(config, context) {
            this.template = '<div class="vzb-bo-holder"><input type="range" id="vzb-bo-slider" class="vzb-bo-slider" step="1"></div>';

            this.model_expects = [{
                name: "entities",
                type: "entities"
            }];
            
            var _this = this;
            
            this.arg = config.arg;
            
            this.model_binds = {
                "change:entities:select": function(evt) {
                    _this.updateView();
                }
            }    
            this.model_binds["change:entities:" + this.arg] = function(evt) {
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
        readyOnce: function() {
            var _this = this;
            this.element = d3.select(this.element);
            this.slider = this.element.selectAll('#vzb-bo-slider');

            this.slider
                .attr('min', 0)
                .attr('max', 1)
                .attr('step', 0.1)
                .on('input', function() {
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

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) {
        return;
    }

    var min = 1, max = 100;

    Vizabi.Component.extend('gapminder-bubblesize', {

        /**
         * Initializes the timeslider.
         * Executed once before any template is rendered.
         * @param config The options passed to the component
         * @param context The component's parent
         */
        init: function(config, context) {
            this.template = this.template || "src/components/_gapminder/bubblesize/bubblesize.html";
            
            this.model_expects = [{
                name: "size",
                type: "size"
            }];

            //contructor is the same as any component
            this._super(config, context);
        },

        /**
         * Executes after the template is loaded and rendered.
         * Ideally, it contains HTML instantiations related to template
         * At this point, this.element and this.placeholder are available as a d3 object
         */
        readyOnce: function() {
            var value = this.model.size.max,
                _this = this;
            this.element = d3.select(this.element);
            this.indicatorEl = this.element.select('#vzb-bs-indicator');
            this.sliderEl = this.element.selectAll('#vzb-bs-slider');

            this.sliderEl
                .attr('min', 0)
                .attr('max', 1)
                .attr('step', 0.01)
                .attr('value', value)
                .on('input', function() {
                    _this.slideHandler();
                });
        },

        /**
         * Executes everytime there's a data event.
         * Ideally, only operations related to changes in the model
         * At this point, this.element is available as a d3 object
         */
        modelReady: function() {
            this.indicatorEl.text(this.model.size.max);
        },

        /**
         * Executes everytime the container or vizabi is resized
         * Ideally,it contains only operations related to size
         */
        resize: function() {
            //E.g: var height = this.placeholder.style('height');
        },

        slideHandler: function() {
            this._setValue(+d3.event.target.value);
        },

        /**
         * Sets the current value in model. avoid updating more than once in framerate
         * @param {number} value 
         */
        _setValue: function(value) {
            var frameRate = 50;

            //implement throttle
            var now = new Date();
            if (this._updTime != null && now - this._updTime < frameRate) return;
            this._updTime = now;

            this.model.size.max = value;
        }
    });

}).call(this);
/*!
 * VIZABI BUTTONLIST
 * Reusable buttonlist component
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var Promise = Vizabi.Promise;
    var utils = Vizabi.utils;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) {
        return;
    }

    //default existing buttons
    var class_active = "vzb-active";
    var class_unavailable = "vzb-unavailable";
    var class_vzb_fullscreen = "vzb-force-fullscreen";

    Vizabi.Component.extend('gapminder-buttonlist', {

        /**
         * Initializes the buttonlist
         * @param config component configuration
         * @param context component context (parent)
         */
        init: function(config, context) {

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
                    dialog: true
                },
                'moreoptions': {
                    title: "buttons/more_options",
                    icon: "gear",
                    dialog: true
                },
                'colors': {
                    title: "buttons/colors",
                    icon: "paint-brush",
                    dialog: true
                },
                'size': {
                    title: "buttons/size",
                    icon: "circle",
                    dialog: true
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
                    dialog: true
                },
                '_default': {
                    title: "Button",
                    icon: "asterisk",
                    dialog: false
                }
            };

            this._active_comp = false;
            
            this.model_binds = {
                "change:state:entities:select": function() {
                    if(!_this._readyOnce) return;
                    
                    if(_this.model.state.entities.select.length === 0){
                        _this.model.state.time.lockNonSelected = 0;
                    }
                    _this.setBubbleTrails();
                    _this.setBubbleLock();
                    
                    
                    //scroll button list to end if bottons appeared or disappeared
                    if(_this.entitiesSelected_1 !== (_this.model.state.entities.select.length>0)){
                        _this.scrollToEnd();
                    }
                    _this.entitiesSelected_1 = _this.model.state.entities.select.length>0;
                }
            }

            this._super(config, context);

        },

        readyOnce: function()  {

            var _this = this;

            this.element = d3.select(this.element);
            this.buttonContainerEl = this.element.append("div")
                .attr("class", "vzb-buttonlist-container-buttons");
            this.dialogContainerEl = this.element.append("div")
                .attr("class", "vzb-buttonlist-container-dialogs");

            //add buttons and render components
            if(this.model.ui.buttons) {
                this._addButtons();
            }

            var buttons = this.element.selectAll(".vzb-buttonlist-btn");

            //activate each dialog when clicking the button
            buttons.on('click', function() {
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
            close_buttons.on('click', function() {
                _this.closeAllDialogs();
            });

            //store body overflow
            this._prev_body_overflow = document.body.style.overflow;
            
            this.setBubbleTrails();
            this.setBubbleLock();
        },
        

        /*
         * adds buttons configuration to the components and template_data
         * @param {Array} button_list list of buttons to be added
         */
        _addButtons: function() {

            this._components_config = [];
            var button_list = this.model.ui.buttons;
            var details_btns = [];
            if(!button_list.length) return;
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
                details_btn.icon = this._icons[details_btn.icon];
                details_btns.push(details_btn);
            };

            var t = this.getTranslationFunction(true);

            this.buttonContainerEl.selectAll('button').data(details_btns)
                .enter().append("button")
                .attr('class', 'vzb-buttonlist-btn')
                .attr('data-btn', function(d) { return d.id; })
                .html(function(btn) {
                    return "<span class='vzb-buttonlist-btn-icon fa'>"+
                            btn.icon +"</span><span class='vzb-buttonlist-btn-title'>"+
                            t(btn.title) +"</span>";
                });

            this.dialogContainerEl.selectAll('div').data(details_btns)
                .enter().append("div")
                .attr('class', 'vzb-buttonlist-dialog')
                .attr('data-btn', function(d) { return d.id; });

            this.loadComponents();

            var _this = this;
            //render each subcomponent
            utils.forEach(this.components, function(subcomp) {
                subcomp.render();
                _this.on('resize', function() {
                    subcomp.trigger('resize');
                });
            });
        },
        
        
        scrollToEnd: function(){
            var target = 0;
            var parent = d3.select(".vzb-tool");
            
            if(parent.classed("vzb-portrait") && parent.classed("vzb-small") ){
                if(this.model.state.entities.select.length>0) target = this.buttonContainerEl[0][0].scrollWidth
                this.buttonContainerEl[0][0].scrollLeft = target;
            }else{
                if(this.model.state.entities.select.length>0) target = this.buttonContainerEl[0][0].scrollHeight
                this.buttonContainerEl[0][0].scrollTop = target;
            }
        },
        

        /*
         * RESIZE:
         * Executed whenever the container is resized
         * Ideally, it contains only operations related to size
         */
        resize: function() {
            //TODO: what to do when resizing?
        },

        //TODO: make opening/closing a dialog via update and model
        /*
         * Activate a button dialog
         * @param {String} id button id
         */
        openDialog: function(id) {

            this.closeAllDialogs();
            var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']"),
                dialog = this.element.selectAll(".vzb-buttonlist-dialog[data-btn='" + id + "']");

            //add classes
            btn.classed(class_active, true);
            dialog.classed(class_active, true);

            this._active_comp = this.components[this._available_buttons[id].component];
            //call component function
            this._active_comp.open();
        },

        /*
         * Closes a button dialog
         * @param {String} id button id
         */
        closeDialog: function(id) {

            var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']"),
                dialog = this.element.selectAll(".vzb-buttonlist-dialog[data-btn='" + id + "']");

            //remove classes
            btn.classed(class_active, false);
            dialog.classed(class_active, false);

            //call component close function
            if(this._active_comp) {
                this._active_comp.close();
            }
            this._active_comp = false;
        },

        /*
         * Close all dialogs
         */
        closeAllDialogs: function() {
            //remove classes
            var all_btns = this.element.selectAll(".vzb-buttonlist-btn"),
                all_dialogs = this.element.selectAll(".vzb-buttonlist-dialog");
            all_btns.classed(class_active, false);
            all_dialogs.classed(class_active, false);

            //call component close function
            if(this._active_comp) {
                this._active_comp.close();
            }
            this._active_comp = false;
        },

        toggleBubbleTrails: function() {
            this.model.state.time.trails = !this.model.state.time.trails;
            this.setBubbleTrails();
        },
        setBubbleTrails: function() {
            var id = "trails";
            var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']");
            
            btn.classed(class_active, this.model.state.time.trails);
            btn.style("display", this.model.state.entities.select.length == 0? "none": "inline-block")
        },
        toggleBubbleLock: function(id) {
            if(this.model.state.entities.select.length == 0) return;
            
            var timeFormatter = d3.time.format(this.model.state.time.formatInput);
            var locked = this.model.state.time.lockNonSelected;
            locked = locked?0:timeFormatter(this.model.state.time.value);
            this.model.state.time.lockNonSelected = locked;
            
            this.setBubbleLock();
        },
        setBubbleLock: function() {
            var id = "lock";
            var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']");
            var translator = this.model.language.getTFunction();
            
            var locked = this.model.state.time.lockNonSelected;
            
            btn.classed(class_unavailable, this.model.state.entities.select.length == 0);
            btn.style("display", this.model.state.entities.select.length == 0? "none": "inline-block")
            
            btn.classed(class_active, locked)
            btn.select(".vzb-buttonlist-btn-title")
                .text(locked?locked:translator("buttons/lock"));
            
            btn.select(".vzb-buttonlist-btn-icon")
                .html(this._icons[locked?"lock":"unlock"]);
        },
        toggleFullScreen: function(id) {

            var component = this;
            var pholder = component.placeholder;
            var pholder_found = false;
            var btn = this.element.selectAll(".vzb-buttonlist-btn[data-btn='" + id + "']");
            var fs = !this.model.ui.fullscreen;
            var body_overflow = (fs) ? "hidden" : this._prev_body_overflow;

            while (!(pholder_found = utils.hasClass(pholder, 'vzb-placeholder'))) {
                component = this.parent;
                pholder = component.placeholder;
            };

            //TODO: figure out a way to avoid fullscreen resize delay in firefox
            if (fs) {
                launchIntoFullscreen(pholder);    
            } else {
                exitFullscreen();
            }

            utils.classed(pholder, class_vzb_fullscreen, fs);
            this.model.ui.fullscreen = fs;
            var translator = this.model.language.getTFunction();
            btn.classed(class_active, fs);

            btn.select(".vzb-buttonlist-btn-icon").html(this._icons[fs?"unexpand":"expand"]);
            btn.select(".vzb-buttonlist-btn-title").text(
                translator("buttons/" + (fs?"unexpand":"expand"))
            );

            //restore body overflow
            document.body.style.overflow = body_overflow;

            //force window resize event
            (function() {
                event = root.document.createEvent("HTMLEvents");
                event.initEvent("resize", true, true);
                event.eventName = "resize";
                root.dispatchEvent(event);
            })();

        },

        //TODO: figure out a better way to tempate the icons
        // SVG VIZABI ICONS
        // source: https://github.com/encharm/Font-Awesome-SVG-PNG/
        _icons: {
            'paint-brush': '<svg class="vzb-icon vzb-icon-paint-brush" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1615 0q70 0 122.5 46.5t52.5 116.5q0 63-45 151-332 629-465 752-97 91-218 91-126 0-216.5-92.5t-90.5-219.5q0-128 92-212l638-579q59-54 130-54zm-909 1034q39 76 106.5 130t150.5 76l1 71q4 213-129.5 347t-348.5 134q-123 0-218-46.5t-152.5-127.5-86.5-183-29-220q7 5 41 30t62 44.5 59 36.5 46 17q41 0 55-37 25-66 57.5-112.5t69.5-76 88-47.5 103-25.5 125-10.5z"/></svg>',
            'search': '<svg class="vzb-icon vzb-icon-search" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1216 832q0-185-131.5-316.5t-316.5-131.5-316.5 131.5-131.5 316.5 131.5 316.5 316.5 131.5 316.5-131.5 131.5-316.5zm512 832q0 52-38 90t-90 38q-54 0-90-38l-343-342q-179 124-399 124-143 0-273.5-55.5t-225-150-150-225-55.5-273.5 55.5-273.5 150-225 225-150 273.5-55.5 273.5 55.5 225 150 150 225 55.5 273.5q0 220-124 399l343 343q37 37 37 90z"/></svg>',
            'circle': '<svg class="vzb-icon vzb-icon-circle" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1664 896q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"/></svg>',
            'expand': '<svg class="vzb-icon vzb-icon-expand" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M883 1056q0 13-10 23l-332 332 144 144q19 19 19 45t-19 45-45 19h-448q-26 0-45-19t-19-45v-448q0-26 19-45t45-19 45 19l144 144 332-332q10-10 23-10t23 10l114 114q10 10 10 23zm781-864v448q0 26-19 45t-45 19-45-19l-144-144-332 332q-10 10-23 10t-23-10l-114-114q-10-10-10-23t10-23l332-332-144-144q-19-19-19-45t19-45 45-19h448q26 0 45 19t19 45z"/></svg>',
            'asterisk': '<svg class="vzb-icon vzb-icon-asterisk" width="1792" height="1792" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1546 1050q46 26 59.5 77.5t-12.5 97.5l-64 110q-26 46-77.5 59.5t-97.5-12.5l-266-153v307q0 52-38 90t-90 38h-128q-52 0-90-38t-38-90v-307l-266 153q-46 26-97.5 12.5t-77.5-59.5l-64-110q-26-46-12.5-97.5t59.5-77.5l266-154-266-154q-46-26-59.5-77.5t12.5-97.5l64-110q26-46 77.5-59.5t97.5 12.5l266 153v-307q0-52 38-90t90-38h128q52 0 90 38t38 90v307l266-153q46-26 97.5-12.5t77.5 59.5l64 110q26 46 12.5 97.5t-59.5 77.5l-266 154z"/></svg>',
            'trails': '<svg class="vzb-icon vzb-icon-trails" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1344 1024q133 0 226.5 93.5t93.5 226.5-93.5 226.5-226.5 93.5-226.5-93.5-93.5-226.5q0-12 2-34l-360-180q-92 86-218 86-133 0-226.5-93.5t-93.5-226.5 93.5-226.5 226.5-93.5q126 0 218 86l360-180q-2-22-2-34 0-133 93.5-226.5t226.5-93.5 226.5 93.5 93.5 226.5-93.5 226.5-226.5 93.5q-126 0-218-86l-360 180q2 22 2 34t-2 34l360 180q92-86 218-86z"/></svg>',
            'lock': '<svg class="vzb-icon vzb-icon-lock" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M640 768h512v-192q0-106-75-181t-181-75-181 75-75 181v192zm832 96v576q0 40-28 68t-68 28h-960q-40 0-68-28t-28-68v-576q0-40 28-68t68-28h32v-192q0-184 132-316t316-132 316 132 132 316v192h32q40 0 68 28t28 68z"/></svg>',
            'unlock': '<svg class="vzb-icon vzb-icon-unlock" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1376 768q40 0 68 28t28 68v576q0 40-28 68t-68 28h-960q-40 0-68-28t-28-68v-576q0-40 28-68t68-28h32v-320q0-185 131.5-316.5t316.5-131.5 316.5 131.5 131.5 316.5q0 26-19 45t-45 19h-64q-26 0-45-19t-19-45q0-106-75-181t-181-75-181 75-75 181v320h736z"/></svg>',
            'unexpand': '<svg class="vzb-icon vzb-icon-unexpand" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M896 960v448q0 26-19 45t-45 19-45-19l-144-144-332 332q-10 10-23 10t-23-10l-114-114q-10-10-10-23t10-23l332-332-144-144q-19-19-19-45t19-45 45-19h448q26 0 45 19t19 45zm755-672q0 13-10 23l-332 332 144 144q19 19 19 45t-19 45-45 19h-448q-26 0-45-19t-19-45v-448q0-26 19-45t45-19 45 19l144 144 332-332q10-10 23-10t23 10l114 114q10 10 10 23z"/></svg>',
            'axes': '<svg class="vzb-icon vzb-icon-axes" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg"><path d="M430.25,379.655l-75.982-43.869v59.771H120.73V151.966h59.774l-43.869-75.983L92.767,0L48.898,75.983L5.029,151.966h59.775 v271.557c0,15.443,12.52,27.965,27.963,27.965h261.5v59.773l75.982-43.869l75.982-43.867L430.25,379.655z"/></svg>',
            'gear': '<svg class="vzb-icon vzb-icon-gear" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1152 896q0-106-75-181t-181-75-181 75-75 181 75 181 181 75 181-75 75-181zm512-109v222q0 12-8 23t-20 13l-185 28q-19 54-39 91 35 50 107 138 10 12 10 25t-9 23q-27 37-99 108t-94 71q-12 0-26-9l-138-108q-44 23-91 38-16 136-29 186-7 28-36 28h-222q-14 0-24.5-8.5t-11.5-21.5l-28-184q-49-16-90-37l-141 107q-10 9-25 9-14 0-25-11-126-114-165-168-7-10-7-23 0-12 8-23 15-21 51-66.5t54-70.5q-27-50-41-99l-183-27q-13-2-21-12.5t-8-23.5v-222q0-12 8-23t19-13l186-28q14-46 39-92-40-57-107-138-10-12-10-24 0-10 9-23 26-36 98.5-107.5t94.5-71.5q13 0 26 10l138 107q44-23 91-38 16-136 29-186 7-28 36-28h222q14 0 24.5 8.5t11.5 21.5l28 184q49 16 90 37l142-107q9-9 24-9 13 0 25 10 129 119 165 170 7 8 7 22 0 12-8 23-15 21-51 66.5t-54 70.5q26 50 41 98l183 28q13 2 21 12.5t8 23.5z"/></svg>'
    
        }

    });

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

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;

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
        init: function(config, parent) {
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
            
            this.template = 'src/components/_gapminder/buttonlist/'+
                            'dialogs/'+this.name+'/'+this.name+'.html';

            this._super(config, parent);
        },

        /**
         * Executed when the dialog has been rendered
         */
        readyOnce: function() {
            var _this = this;
            this.element = d3.select(this.element);
        },

        /**
         * User has clicked to open this dialog
         */
        open: function() {
            //placeholder function
        },

        /**
         * User has closed this dialog
         */
        close: function() {
            //placeholder function
        }

    });

}).call(this);
(function() {

    "use strict";

    var Vizabi = this.Vizabi;
    var Dialog = Vizabi.Component.get('gapminder-buttonlist-dialog');

    
    Vizabi.Component.register('gapminder-buttonlist-axes', Dialog.extend({

        /**
         * Initializes the dialog component
         * @param config component configuration
         * @param context component context (parent)
         */
        init: function(config, parent) {
            this.name = 'axes';
            var _this = this;

            this.components = [{
                component: 'gapminder-indicatorpicker',
                placeholder: '.vzb-xaxis-container',
                model: ["state.marker.axis_x", "language"]
            },{
                component: 'gapminder-indicatorpicker',
                placeholder: '.vzb-yaxis-container',
                model: ["state.marker.axis_y", "language"]
            },{
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

(function() {

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
        init: function(config, parent) {
            this.name = 'colors';
            
            this.components = [{
                component: 'gapminder-indicatorpicker',
                placeholder: '.vzb-caxis-container',
                model: ["state.marker.color", "language"]
            },{
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

(function() {

    "use strict";

    var Vizabi = this.Vizabi;
    var utils = Vizabi.utils;
    var Dialog = Vizabi.Component.get('gapminder-buttonlist-dialog');

    if (!Vizabi._require('d3')) return;
    
    Vizabi.Component.register('gapminder-buttonlist-find', Dialog.extend({

        init: function(config, parent) {
            this.name = 'find';
            var _this = this;
            
            this.components = [{
                component: 'gapminder-bubbleopacity',
                placeholder: '.vzb-dialog-bubbleopacity',
                model: ["state.entities"],
                arg: "opacitySelectDim"
            }];
            
            this.model_binds = {
                "change:state:entities:select": function(evt) {
                    _this.update();
                },
                "ready": function(evt) {
                    if(!_this._readyOnce) return;
                    _this.update();
                }
            }
            
            this._super(config, parent);
        },

        /**
         * Grab the list div
         */
        readyOnce: function() {
            this.element = d3.select(this.element);
            this.list = this.element.select(".vzb-find-list");
            this.input_search = this.element.select("#vzb-find-search");
            this.deselect_all = this.element.select("#vzb-find-deselect");
            this.opacity_nonselected = this.element.select(".vzb-dialog-bubbleopacity");

            this.KEY = this.model.state.entities.getDimension();
            
            var _this = this;
            this.input_search.on("input", function() {
                _this.showHideSearch();
            });

            this.deselect_all.on("click", function() {
                _this.deselectEntities();
            });

            this._super();
            
            this.update();
        },

        open: function() {
            this.input_search.node().value = "";
            this.showHideSearch();
        },

        /**
         * Build the list everytime it updates
         */
        //TODO: split update in render and update methods
        update: function() {
            var _this = this;
            var KEY = this.KEY;
            var selected = this.model.state.entities.getSelected();
            var labelModel = this.model.state.marker.label;
            var data = labelModel.getItems().map(function(d) {
                var pointer = {};
                pointer[KEY] = d[KEY];
                pointer.name = labelModel.getValue(d);
                return pointer;
            });

            //sort data alphabetically
            data.sort(function(a, b) {
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
                .attr("id", function(d) {
                    return "-find-" + d[KEY];
                })
                .property("checked", function(d) {
                    return (selected.indexOf(d[KEY]) !== -1);
                })
                .on("change", function(d) {
                    _this.model.state.entities.selectEntity(d);
                });

            items.append("label")
                .attr("for", function(d) {
                    return "-find-" + d[KEY];
                })
                .text(function(d) {
                    return d.name;
                })
                .on("mouseover", function(d) {
                    _this.model.state.entities.highlightEntity(d);
                })
                .on("mouseout", function(d) {
                    _this.model.state.entities.clearHighlighted();
                });

            this.showHideSearch();
            this.showHideDeselect();
        },

        showHideSearch: function() {

            var search = this.input_search.node().value || "";
            search = search.toLowerCase();

            this.list.selectAll(".vzb-find-item")
                     .classed("vzb-hidden", function(d) {
                        var lower = d.name.toLowerCase();
                        return (lower.indexOf(search) === -1);
                     });
        },

        showHideDeselect: function() {
            var someSelected = !!this.model.state.entities.select.length;
            this.deselect_all.classed('vzb-hidden', !someSelected);
            this.opacity_nonselected.classed('vzb-hidden', !someSelected);
        },

        deselectEntities: function() {
            this.model.state.entities.clearSelected();
        }
        
    }));


}).call(this);
(function() {

    "use strict";

    var Vizabi = this.Vizabi;
    var Dialog = Vizabi.Component.get('gapminder-buttonlist-dialog');

    
    Vizabi.Component.register('gapminder-buttonlist-moreoptions', Dialog.extend({

        /**
         * Initializes the dialog component
         * @param config component configuration
         * @param context component context (parent)
         */
        init: function(config, parent) {
            this.name = 'moreoptions';

            this.components = [{
                component: 'gapminder-indicatorpicker',
                placeholder: '.vzb-xaxis-container',
                model: ["state.marker.axis_x", "language"]
            },{
                component: 'gapminder-indicatorpicker',
                placeholder: '.vzb-yaxis-container',
                model: ["state.marker.axis_y", "language"]
            },{
                component: 'gapminder-simplecheckbox',
                placeholder: '.vzb-axes-options',
                model: ["state", "language"],
                submodel: 'time',
                checkbox: 'adaptMinMaxZoom'
            },{
                component: 'gapminder-bubblesize',
                placeholder: '.vzb-dialog-bubblesize',
                model: ["state.marker.size"]
            },{
                component: 'gapminder-indicatorpicker',
                placeholder: '.vzb-saxis-container',
                model: ["state.marker.size", "language"]
            },{
                component: 'gapminder-indicatorpicker',
                placeholder: '.vzb-caxis-container',
                model: ["state.marker.color", "language"]
            },{
                component: 'gapminder-colorlegend',
                placeholder: '.vzb-clegend-container',
                model: ["state.marker.color", "state.entities", "language"]
            },{
                component: 'gapminder-bubbleopacity',
                placeholder: '.vzb-dialog-bubbleopacity-regular',
                model: ["state.entities"],
                arg: "opacityRegular"
            },{
                component: 'gapminder-bubbleopacity',
                placeholder: '.vzb-dialog-bubbleopacity-selectdim',
                model: ["state.entities"],
                arg: "opacitySelectDim"
            }];
            
            this._super(config, parent);
        },
        
        readyOnce: function() {
            this.element = d3.select(this.element);
            this.resize();
        },

        resize: function() {
            var totalHeight = this.root.element.offsetHeight - 200;
            var content = this.element.select('.vzb-dialog-content');
            content.style('max-height', totalHeight+'px');
        }
    }));

}).call(this);

(function() {

    "use strict";

    var Vizabi = this.Vizabi;
    var Dialog = Vizabi.Component.get('gapminder-buttonlist-dialog');

    Vizabi.Component.register('gapminder-buttonlist-size', Dialog.extend({

        /**
         * Initializes the dialog component
         * @param config component configuration
         * @param context component context (parent)
         */
        init: function(config, parent) {
            this.name = 'size';

            // in dialog, this.model_expects = ["state", "data"];

            this.components = [{
                component: 'gapminder-bubblesize',
                placeholder: '.vzb-dialog-bubblesize',
                model: ["state.marker.size"],
                ui: {
                    show_button: false
                }
            },{
                component: 'gapminder-indicatorpicker',
                placeholder: '.vzb-saxis-container',
                model: ["state.marker.size", "language"],
                ui: {selectIndicator: true, selectScaletype: false}
            }];

            this._super(config, parent);
        }
    }));

}).call(this);
/*!
 * VIZABI BUBBLE COLOR LEGEND COMPONENT
 */

(function() {

    "use strict";

    var Vizabi = this.Vizabi;
    var utils = Vizabi.utils;
    var INDICATOR = "which";

    if (!Vizabi._require('d3')) return;
    
    Vizabi.Component.extend('gapminder-colorlegend', {
        
        init: function(config, context) {
            var _this = this;
            this.template = '<div class="vzb-cl-holder"></div>';
            
            this.model_expects = [{
                name: "color",
                type: "color"
            },{
                name: "entities",
                type: "entities"
            },{
                name: "language",
                type: "language"
            }];
            
            this.needsUpdate = false;
            this.which_1 = false;
            this.scaleType_1 = false;
            
            this.model_binds = {
                "change:color": function(evt) {
                    _this.updateView();
                },
                "change:language": function(evt) {
                    _this.updateView();
                },
                "ready": function(evt) {
                    if(!_this._readyOnce) return;
                     _this.updateView();
                }   
            }
            
            //contructor is the same as any component
            this._super(config, context);
        },
        
        
        readyOnce: function() {
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
        

        
        updateView: function(){
            var _this = this;
            this.translator = this.model.language.getTFunction();
            var KEY = this.model.entities.getDimension();

            var palette = this.model.color.palette;
            
            
            var whichPalette = "_default";
            if(Object.keys(this.model.color.getPalettes()).indexOf(this.model.color[INDICATOR]) > -1) {
                whichPalette = this.model.color[INDICATOR];
            }
            
            var paletteDefault = this.model.color.getPalettes()[whichPalette];
            

            var colors = this.listColorsEl
                .selectAll(".vzb-cl-option")
                .data(utils.keys(paletteDefault), function(d){return d});

            colors.exit().remove();
            
            colors.enter().append("div").attr("class", "vzb-cl-option")
                .each(function(){
                    d3.select(this).append("div").attr("class", "vzb-cl-color-sample");
                    d3.select(this).append("div").attr("class", "vzb-cl-color-legend");
                })
                .on("mouseover", function(){
                    //disable interaction if so stated in metadata
                    if(!_this.model.color.isUserSelectable(whichPalette)) return;
                
                    var sample = d3.select(this).select(".vzb-cl-color-sample");
                    sample.style("border-width", "5px");
                    sample.style("background-color", "transparent");

                })
                .on("mouseout", function(d){
                    //disable interaction if so stated in metadata
                    if(!_this.model.color.isUserSelectable(whichPalette)) return;
                
                    var sample = d3.select(this).select(".vzb-cl-color-sample");
                    sample.style("border-width", "0px");
                    sample.style("background-color", _this.model.color.palette[d]);
                })
                .on("click", function(d){
                    //disable interaction if so stated in metadata
                    if(!_this.model.color.isUserSelectable(whichPalette)) return;
                
                    _this.colorPicker
                        .colorOld(palette[d])
                        .colorDef(paletteDefault[d])
                        .callback(function(value){_this.model.color.setColor(value, d)})
                        .show(true);
                })
            
            
            if(this.model.color.use == "indicator"){
                this.rainbowEl.classed("vzb-hidden", false)
                    .style("height", (utils.keys(paletteDefault).length * 25 + 5) + "px")
                    .style("background", "linear-gradient(" + utils.values(palette._data).join(", ") +")");
            }else{
                this.rainbowEl.classed("vzb-hidden", true);
            }
            
            //TODO: is it okay that "geo.region" is hardcoded?
            if(this.model.color[INDICATOR] == "geo.region"){
                var regions = this.worldmapEl.classed("vzb-hidden", false)
                    .select("svg").selectAll("path");
                regions.each(function(){
                    var view = d3.select(this);
                    var color = palette[view.attr("id")];
                    view.style("fill",color);
                })
                .style("opacity", 0.8)
                .on("mouseover", function(){
                    var view = d3.select(this);
                    var region = view.attr("id");
                    regions.style("opacity",0.5);
                    view.style("opacity",1);
                    
                    var filtered = _this.model.color.getFilteredItems();
                    var highlight = utils.values(filtered)
                        //returns a function over time. pick the last time-value
                        .map(function(d){return d[d.length-1]})
                        //filter so that only countries of the correct region remain 
                        .filter(function(f){return f["geo.region"]==region})
                        //fish out the "key" field, leave the rest behind
                        .map(function(d){return utils.clone(d,[KEY]) });
                    
                    _this.model.entities.setHighlighted(highlight);
                })
                .on("mouseout", function(){
                    regions.style("opacity",0.8);
                    _this.model.entities.clearHighlighted(); 
                })
                .on("click", function(d){
                    //disable interaction if so stated in metadata
                    if(!_this.model.color.isUserSelectable(whichPalette)) return;
                    var view = d3.select(this);
                    var region = view.attr("id")
                    
                    _this.colorPicker
                        .colorOld(palette[region])
                        .colorDef(paletteDefault[region])
                        .callback(function(value){_this.model.color.setColor(value, region)})
                        .show(true);
                })
                colors.classed("vzb-hidden", true);
            }else{
                this.worldmapEl.classed("vzb-hidden", true);
                colors.classed("vzb-hidden", false);
            }
            
            colors.each(function(d, index){
                d3.select(this).select(".vzb-cl-color-sample")
                    .style("background-color", palette[d])
                    .style("border", "1px solid " + palette[d]);

                if(_this.model.color.use == "indicator"){
                    var domain = _this.model.color.getScale().domain();
                    d3.select(this).select(".vzb-cl-color-legend")
                        .text(_this.model.color.tickFormatter(domain[index]))
                }else{
                    
                    d3.select(this).select(".vzb-cl-color-legend")
                        .text(_this.translator("color/" + _this.model.color[INDICATOR] + "/" + d));
                }
            });
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
    var utils = Vizabi.utils;

    var INDICATOR = "which";
    var SCALETYPE = "scaleType";
    var MODELTYPE_COLOR = "color";

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) {
        return;
    }

    var availOpts = {
        'geo.region': {use: 'property',unit: '',scales: ['ordinal']},
        'geo': {use: 'property',unit: '',scales: ['ordinal']},
        'time': {use: 'indicator',unit: 'year',scales: ['time']},
        'lex': {use: 'indicator',unit: 'years',scales: ['linear']},
        'gdp_per_cap': {use: 'indicator',unit: '$/year/person',scales: ['log', 'linear']},
        'pop': {use: 'indicator',unit: '',scales: ['linear', 'log']},
        '_default': {use: 'value',unit: '',scales: ['linear', 'log']}
    };

    Vizabi.Component.extend('gapminder-indicatorpicker', {

        /**
         * Initializes the Indicator Picker.
         * Executed once before any template is rendered.
         * @param config The options passed to the component
         * @param context The component's parent
         */
        init: function(config, context) {

            this.template = '<span class="vzb-ip-holder"><select class="vzb-ip-indicator"></select><select class="vzb-ip-scaletype"></select></span>';
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
            }

            //contructor is the same as any component
            this._super(config, context);

            this.ui = utils.extend({
                selectIndicator: true,
                selectScaletype: true
            }, this.ui);

        },

        ready: function() {
            this.updateView();
        },

        readyOnce: function() {
            var _this = this;

            this.element = d3.select(this.element);
            this.titleEl = this.element.append("p");
            this.el_select_indicator = this.element.select('.vzb-ip-indicator');
            this.el_select_scaletype = this.element.select('.vzb-ip-scaletype');

            this.el_select_indicator
                .on("change", function() {
                    _this._setModel(INDICATOR, this.value)
                });

            this.el_select_scaletype
                .on("change", function() {
                    _this._setModel(SCALETYPE, this.value)
                });
        },

        updateView: function() {
            var _this = this;
            this.translator = this.model.language.getTFunction();
            this.titleEl.text(this.translator(this.model.axis.which));

            var pointer = "_default";

            var data = {};
            data[INDICATOR] = Object.keys(availOpts);

            if (data[INDICATOR].indexOf(this.model.axis[INDICATOR]) > -1) pointer = this.model.axis[INDICATOR];

            data[SCALETYPE] = availOpts[pointer].scales;

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
            elOptionsIndicator.enter().append("option")
                .attr("value", function(d) {
                    return d
                });
            elOptionsScaletype.enter().append("option")
                .attr("value", function(d) {
                    return d
                });

            //show translated UI string
            elOptionsIndicator.text(function(d) {
                return _this.translator("indicator/" + d)
            })
            elOptionsScaletype.text(function(d) {
                return _this.translator("scaletype/" + d)
            })

            //set the selected option
            this.el_select_indicator[0][0].value = this.model.axis[INDICATOR];
            this.el_select_scaletype[0][0].value = this.model.axis[SCALETYPE];

            //disable the selector in case if there is only one option, hide if so requested by the UI setings
            this.el_select_indicator
                .style('display', this.ui.selectIndicator ? "auto" : "none")
                .attr('disabled', data[INDICATOR].length <= 1 ? "true" : null)
            this.el_select_scaletype
                .style('display', this.ui.selectScaletype ? "auto" : "none")
                .attr('disabled', data[SCALETYPE].length <= 1 ? "true" : null)
        },

        _setModel: function(what, value) {

            var mdl = this.model.axis;

            var obj = {};
            obj[what] = value;

            if (what == INDICATOR) {
                obj.use = availOpts[value].use;
                obj.unit = availOpts[value].unit;

                if (availOpts[value].scales.indexOf(mdl.scaleType) == -1) {
                    obj.scaleType = availOpts[value].scales[0];
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

(function() {

    "use strict";

    var Vizabi = this.Vizabi;
    var utils = Vizabi.utils;

    if (!Vizabi._require('d3')) return;
    
    Vizabi.Component.extend('gapminder-simplecheckbox', {

        init: function(config, context) {
            this.template = '<span class="vzb-sc-holder vzb-dialog-checkbox"><input type="checkbox"><label></label></span>';
            var _this = this;
            
            this.checkbox = config.checkbox;
            this.submodel = config.submodel;

            this.model_expects = [{
                name: "mdl"
                //TODO: learn how to expect model "axis" or "size" or "color"
            },{
                name: "language",
                type: "language"
            }];
            
            
            this.model_binds = {
                "change:language": function(evt) {
                    _this.updateView();
                }
            }
            
            this.model_binds["change:mdl:"+this.submodel+":"+this.checkbox] = function() {
                _this.updateView();
            };

            //contructor is the same as any component
            this._super(config, context);
        },

        ready: function() {
            this.updateView();
        },

        readyOnce: function() {
            var _this = this;
            this.element = d3.select(this.element);
            var id = "-check-" + Math.random()*1000;
            this.labelEl = this.element.select('label').attr("for", id);
            this.checkEl = this.element.select('input').attr("id", id)
                .on("change", function(){
                    _this._setModel(d3.select(this).property("checked"));
                });
        },

        updateView: function() {
            this.translator = this.model.language.getTFunction();
            this.labelEl.text(this.translator("check/" + this.checkbox));
            this.checkEl.property("checked", !!this.model.mdl[this.submodel][this.checkbox]);
        },
        
        _setModel: function (value) {
            this.model.mdl[this.submodel][this.checkbox] = value;
        }
        
    });


}).call(this);
/*!
 * VIZABI TIMESLIDER
 * Reusable timeslider component
 */

(function() {

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
            margin: { top: 9, right: 15, bottom: 10, left: 15 },
            radius: 8,
            label_spacing: 10
        },
        medium: {
            margin: { top: 9, right: 15, bottom: 10, left: 15 },
            radius: 10,
            label_spacing: 12
        },
        large: {
            margin: { top: 9, right: 15, bottom: 10, left: 15 },
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
        init: function(config, context) {
            this.template = this.template || "src/components/_gapminder/timeslider/timeslider.html";

            //define expected models/hooks for this component
            this.model_expects = [{
                name: "time",
                type: "time"
            }];

            var _this = this;

            //binds methods to this model
            this.model_binds = {
                'change:time': function(evt, original) {
                    if((['change:time:start','change:time:end']).indexOf(evt) !== -1) {
                        _this.changeLimits();
                    }
                    _this._optionClasses();

                    //only set handle position if change is external
                    if(!_this._dragging) {
                        _this._setHandle(_this.model.time.playing);
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
        },

        //template is ready
        readyOnce: function() {
            var _this = this;

            //DOM to d3
            this.element = d3.select(this.element);

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
                .on("brush", function() {
                    utils.throttle(brushed.bind(this), 30);
                })
                .on("brushend", function() {
                    utils.throttle(brushedEnd.bind(this), 30);
                });

            //Slide
            this.slide.call(this.brush);
            this.slide.selectAll(".extent,.resize")
                .remove();

            
            this.parent.on('myEvent', function(evt, arg) {
                

                // set the right margin that depends on longest label width
                _this.element.select(".vzb-ts-slider-wrapper")
                    .style("right", arg.mRight+"px");

                profiles[_this.getLayoutProfile()].margin = 
                    {bottom: 0, left: 0, right: 0, top: 0};

                _this.xScale.range([0, arg.rangeMax]);
                _this.resize();
            });

            var _this = this;

        },

        //template and model are ready
        ready: function() {

            var play = this.element.select(".vzb-ts-btn-play");
            var pause = this.element.select(".vzb-ts-btn-pause");
            var _this = this;
            var time = this.model.time;

            play.on('click', function() {
                _this.model.time.play();
            });

            pause.on('click', function() {
                _this.model.time.pause();
            });//format

            var fmt = time.formatOutput || time_formats[time.unit];
            this.format = d3.time.format(fmt);

            this.changeLimits();
            this.changeTime();
            this.resize();
            this._setHandle(this.model.time.playing);
        },

        changeLimits: function() {
            var minValue = this.model.time.start;
            var maxValue = this.model.time.end;
            //scale
            this.xScale.domain([minValue, maxValue]);
            //axis
            this.xAxis.tickValues([minValue, maxValue])
                .tickFormat(this.format);
        },

        changeTime: function() {
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
        resize: function() {

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

            this._setHandle();

        },

        /**
         * Gets brushed function to be executed when dragging
         * @returns {Function} brushed function
         */
        _getBrushed: function() {
            var _this = this;
            return function() {
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
                    var posX = utils.roundStep(Math.round(d3.mouse(this)[0]), precision);
                    value = _this.xScale.invert(posX);

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
        _getBrushedEnd: function() {
            var _this = this;
            return function() {
                _this._blockUpdate = false;
                _this.model.time.pause();
                _this.element.classed(class_dragging, false);
                _this.model.time.snap();
                _this._dragging = false;
            };
        },

        /**
         * Sets the handle to the correct position
         * @param {Boolean} transition whether to use transition or not
         */
        _setHandle: function(transition) {
            var value = this.model.time.value;
            this.slide.call(this.brush.extent([value, value]));

            this.valueText.text(this.format(value));

            var old_pos = this.handle.attr("cx");
            var new_pos = this.xScale(value);
            var speed = new_pos>old_pos? this.model.time.speed : 0;


            if(transition) {
                this.handle.attr("cx", old_pos)
                    .transition()
                    .duration(speed)
                    .ease("linear")
                    .attr("cx", new_pos);
            }
            else {
                this.handle.attr("cx", new_pos);
            }

            var txtWidth = this.valueText.node().getBoundingClientRect().width;
            var sliderWidth = this.slider.node().getBoundingClientRect().width;
            var lmt_min = txtWidth/2;
            var lmt_max = sliderWidth - lmt_min;
            var new_mod = (new_pos < lmt_min) ? (lmt_min - new_pos) : ((new_pos > lmt_max) ? (lmt_max - new_pos) : 0);

            if (transition && new_mod === 0 ) {
                this.valueText.attr("transform", "translate(" + old_pos + "," + (this.height / 2) + ")")
                    .transition()
                    .duration(speed)
                    .ease("linear")
                    .attr("transform", "translate(" + new_pos + "," + (this.height / 2) + ")");

            } else {
                this.valueText.attr("transform", "translate(" + (new_pos + new_mod) + "," + (this.height / 2) + ")");
            }
        },

        /**
         * Sets the current time model to time
         * @param {number} time The time
         */
        _setTime: function(time) {
            //update state
            var _this = this,
                frameRate = 50;

            //avoid updating more than once in "frameRate"
            var now = new Date();
            if (this._updTime != null && now - this._updTime < frameRate) return;
            this._updTime = now;

            _this.model.time.value = time;
        },

        /**
         * Applies some classes to the element according to options
         */
        _optionClasses: function() {
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
 * VIZABI Axis Model (hook)
 */

(function() {

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
        init: function(values, parent, bind) {

            this._type = "axis";
            values = utils.extend({
                use: "value",
                unit: "",
                which: undefined
            }, values);
            this._super(values, parent, bind);
        },

        /**
         * Validates a color hook
         */
        validate: function() {

            var possibleScales = ["log", "linear", "time", "pow"];
            if (!this.scaleType || (this.use === "indicator" && possibleScales.indexOf(this.scaleType) === -1)) {
                this.scaleType = 'linear'; 
            }

            if (this.use !== "indicator" && this.scaleType !== "ordinal") {
                this.scaleType = "ordinal";
            }

            //TODO a hack that kills the scale, it will be rebuild upon getScale request in model.js
            if(this.which_1 != this.which || this.scaleType_1 != this.scaleType) this.scale = null;
            this.which_1 = this.which;
            this.scaleType_1 = this.scaleType;

            //TODO: add min and max to validation
        },
        

        /**
         * Gets the domain for this hook
         * @returns {Array} domain
         */
        buildScale: function() {
            var domain;
            var scaleType = this.scaleType || "linear";

            if(this.scaleType=="time"){
                var limits = this.getLimits(this.which);
                this.scale = d3.time.scale().domain([limits.min, limits.max]);
                return;
            }
            
            switch (this.use) {
                case "indicator":
                    var limits = this.getLimits(this.which),
                        margin = (limits.max - limits.min) / 20;
                    domain = [(limits.min - margin), (limits.max + margin)];
                    if(scaleType == "log") {
                        domain = [(limits.min-limits.min/4), (limits.max + limits.max/4)];
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

            this.scale = d3.scale[scaleType]().domain(domain);
        }
    });
}).call(this);
/*!
 * VIZABI Color Model (hook)
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) {
        return;
    }
    
    var palettes = {
        'geo.region':   {'asi':'#FF5872', 'eur':'#FFE700', 'ame':'#7FEB00', 'afr':'#00D5E9', '_default': '#ffb600'},
        'geo':          {'color1':'#F77481', 'color2':'#E1CE00', 'color3':'#B4DE79', 'color4':'#62CCE3'},
        'time':         {'0':'#F77481', "1":'#E1CE00', "2":'#B4DE79'},
        'lex':          {'0':'#F77481', "1":'#E1CE00', "2":'#B4DE79'},
        'gdp_per_cap':  {'0':'#F77481', "1":'#E1CE00', "2":'#B4DE79', "3":'#62CCE3'},
        'pop':          {'0':'#F77481', "1":'#E1CE00', "2":'#B4DE79'},
        '_continuous':     {'0':'#8BC1F0', '1': '#030C6B'},
        '_discrete':     {'color1':'#F77481', 'color2':'#E1CE00', 'color3':'#B4DE79', 'color4':'#62CCE3'},
        '_default':     {'_default':'#fa5ed6'}
    };    
    var userSelectable = {
        'geo.region': false
    };

    Vizabi.Model.extend('color', {

        /**
         * Initializes the color hook
         * @param {Object} values The initial values of this model
         * @param parent A reference to the parent model
         * @param {Object} bind Initial events to bind
         */
        init: function(values, parent, bind) {

            this._type = "color";

            values = utils.extend({
                use: "value",
                unit: "",
                palette: null,
                which: undefined
            }, values);
            this._super(values, parent, bind);
            
            this.firstLoad = true;
            this.hasDefaultColor = false;
        },
        
        /**
         * Get the above constants
         */
        getPalettes: function(){
            return palettes;
        },       
        
        /**
         * Get the above constants
         */
        isUserSelectable: function(whichPalette){
            if(userSelectable[whichPalette]==null) return true;
            return userSelectable[whichPalette];
        },

        /**
         * Validates a color hook
         */
        validate: function() {
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
            if(this.palette==null 
               || this.firstLoad===false && this.which_1 != this.which 
               || this.firstLoad===false && this.scaleType_1 != this.scaleType){
                
                //TODO a hack that prevents adding properties to palette (need replacing)
                this.set("palette", null, false);
                //TODO a hack that kills the scale, it will be rebuild upon getScale request in model.js
                this.scale = null;
                if(palettes[this.which]){
                    this.palette = utils.clone(palettes[this.which]);
                }else if(this.use === "value"){
                    this.palette = {"_default":this.which};
                }else if(this.scaleType === "linear"){
                    this.palette = utils.clone(palettes["_continuous"]);
                }else if(this.scaleType === "ordinal"){
                    this.palette = utils.clone(palettes["_discrete"]);
                }else{
                    this.palette = utils.clone(palettes["_default"]);
                }
            }

            this.which_1 = this.which;
            this.scaleType_1 = this.scaleType;
            this.firstLoad = false;
        },

        /**
         * set color
         */
        setColor: function(value, pointer) {
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
        mapValue: function(value) {
            //if the property value does not exist, supply the _default 
            // otherwise the missing value would be added to the domain
            if(this.scale!=null 
               && this.use == "property" 
               && this.hasDefaultColor 
               && this.scale.domain().indexOf(value)==-1) value = "_default";
            return this._super(value);
        },
        
        
        /**
         * Gets the domain for this hook
         * @returns {Array} domain
         */
        buildScale: function() {
            var _this = this;
            
            var domain = Object.keys(_this.palette.getObject());
            var range = utils.values(_this.palette.getObject());
            
            this.hasDefaultColor = domain.indexOf("_default")>-1;

            if(this.scaleType=="time"){
                var limits = this.getLimits(this.which);
                this.scale = d3.time.scale()
                    .domain([limits.min, limits.max])
                    .range(range);
                return;
            }
            
            switch (this.use) {
                case "indicator":
                    var limits = this.getLimits(this.which);
                    var step = ((limits.max-limits.min) / (range.length - 1));
                    domain = d3.range(limits.min, limits.max, step).concat(limits.max);
                    
                    if(this.scaleType=="log"){
                        var s = d3.scale.log().domain([limits.min, limits.max]).range([limits.min, limits.max]);
                        domain = domain.map(function(d){return s.invert(d)});
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












 
(function() {

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
        init: function(values, parent, bind) {

            this._type = "data";
            values = utils.extend({
                reader: "json-file"
            }, values);

            //same constructor as parent, with same arguments
            this._super(values, parent, bind);
        }

    });

}).call(this);
/*!
 * VIZABI Entities Model
 */

(function() {

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
        init: function(values, parent, bind) {

            this._type = "entities";
            values = utils.extend({
                show: {},
                select: [],
                brush: [],
                opacitySelectDim: 0.3,
                opacityRegular: 0.8
            }, values);

            this._visible = [];

            this._super(values, parent, bind);
        },

        /**
         * Validates the model
         * @param {boolean} silent Block triggering of events
         */
        validate: function(silent) {
            var _this = this;
            var dimension = this.getDimension();
            var visible_array = this._visible.map(function(d) {
                return d[dimension]
            });

            this.select = this.select.filter(function(f) {
                return visible_array.indexOf(f[dimension]) !== -1;
            });
            this.brush = this.brush.filter(function(f) {
                return visible_array.indexOf(f[dimension]) !== -1;
            });
        },

        /**
         * Gets the dimensions in this entities
         * @returns {String} String with dimension
         */
        getDimension: function() {
            return this.dim;
        },

        /**
         * Gets the filter in this entities
         * @returns {Array} Array of unique values
         */
        getFilter: function() {
            return this.show.getObject();
        },

        /**
         * Gets the selected items
         * @returns {Array} Array of unique selected values
         */
        getSelected: function() {
            var dim = this.getDimension();
            return this.select.map(function(d) {
                return d[dim];
            });
        },

        /**
         * Selects or unselects an entity from the set
         */
        selectEntity: function(d, timeDim, timeFormatter) {
            var dimension = this.getDimension();
            var value = d[dimension];
            if (this.isSelected(d)) {
                this.select = this.select.filter(function(d) {
                    return d[dimension] !== value;
                });
            } else {
                var added = {};
                added[dimension] = value;
                added["labelOffset"] = [0, 0];
                if (timeDim && timeFormatter) {
                    added["trailStartTime"] = timeFormatter(d[timeDim]);
                }
                this.select = this.select.concat(added);
            }
        },

        setLabelOffset: function(d, xy) {
            var dimension = this.getDimension();
            var value = d[dimension];

            utils.find(this.select, function(d) {
                return d[dimension] === value;
            }).labelOffset = xy;

            //force the model to trigger events even if value is the same
            this.set("select", this.select, true);
        },

        /**
         * Selects an entity from the set
         * @returns {Boolean} whether the item is selected or not
         */
        isSelected: function(d) {
            var dimension = this.getDimension();
            var value = d[this.getDimension()];

            var select_array = this.select.map(function(d) {
                return d[dimension];
            });

            return select_array.indexOf(value) !== -1;
        },

        /**
         * Clears selection of items
         */
        clearSelected: function() {
            this.select = [];
        },
        
        
        setHighlighted: function(arg){
            this.brush = [].concat(arg);
        },

        //TODO: join the following 3 methods with the previous 3

        /**
         * Highlights an entity from the set
         */
        highlightEntity: function(d, timeDim, timeFormatter) {
            var dimension = this.getDimension();
            var value = d[dimension];
            if (!this.isHighlighted(d)) {
                var added = {};
                added[dimension] = value;
                if (timeDim && timeFormatter) {
                    added["trailStartTime"] = timeFormatter(d[timeDim]);
                }
                this.brush = this.brush.concat(added);
            }
        },

        /**
         * Unhighlights an entity from the set
         */
        unhighlightEntity: function(d) {
            var dimension = this.getDimension();
            var value = d[dimension];
            if (this.isHighlighted(d)) {
                this.brush = this.brush.filter(function(d) {
                    return d[dimension] !== value;
                });
            }
        },

        /**
         * Checks whether an entity is highlighted from the set
         * @returns {Boolean} whether the item is highlighted or not
         */
        isHighlighted: function(d) {
            var dimension = this.getDimension();
            var value = d[this.getDimension()];

            var brush_array = this.brush.map(function(d) {
                return d[dimension];
            });

            return brush_array.indexOf(value) !== -1;
        },

        /**
         * Clears selection of items
         */
        clearHighlighted: function() {
            this.brush = [];
        }
    });

}).call(this);
/*!
 * VIZABI Language Model
 */

(function() {

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
        init: function(values, parent, bind) {

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
        getUIString: function(id, lang, strings) {
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
        getTFunction: function() {
            var lang = this.id,
                strings = this.strings,
                _this = this;

            return function(string) {
                return _this.getUIString(string, lang, strings);
            }
        }

    });

}).call(this);

(function() {

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
         * Initializes the color hook
         * @param {Object} values The initial values of this model
         * @param parent A reference to the parent model
         * @param {Object} bind Initial events to bind
         */
        init: function(values, parent, bind) {

            this._type = "size";
            values = utils.extend({
                use: "value",
                unit: "",
                which: undefined
            }, values);
            this._super(values, parent, bind);
        },

        /**
         * Validates a color hook
         */
        validate: function() {
            //there must be a min and a max
            if (typeof this.min === 'undefined' || this.min < 0) {
                this.min = 0;
            }
            if (typeof this.max === 'undefined' || this.max > 1) {
                this.max = 1;
            }
            if (this.min > this.max) {
                this.min = this.max;
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
            if(this.which_1 != this.which || this.scaleType_1 != this.scaleType) this.scale = null;
            this.which_1 = this.which;
            this.scaleType_1 = this.scaleType;
        },

        /**
         * Gets the domain for this hook
         * @returns {Array} domain
         */
        buildScale: function() {
            if(this.use === "value") {
                this.scale = d3.scale.linear().domain([0,1]);
            }
            this._super();
        }

    });

}).call(this);
/*!
 * VIZABI Time Model
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;

    //do not create model if d3 is not defined
    if(!Vizabi._require('d3')) return;

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
        init: function(values, parent, bind) {

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
                round: true,
                speed: 300,
                unit: "year",
                step: 1, //step must be integer
                adaptMinMaxZoom: false,
                formatInput: "%Y" //defaults to year format
            }, values);

            values.formatOutput = values.formatOutput || values.formatInput;

            //same constructor
            this._super(values, parent, bind);

            var _this = this;
            this._playing_now = false;

            //bing play method to model change
            this.on({
                "change:playing": function() {
                    if (_this.playing === true) {
                        _this._startPlaying();
                    } else {
                        _this._stopPlaying();
                    }
                },
                "set": function() {
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
        _formatToDates: function() {

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
                    };
                }
            };
        },

        /**
         * Validates the model
         */
        validate: function() {

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
        play: function() {
            this.playing = true;
        },

        /**
         * Pauses time
         */
        pause: function() {
            this.playing = false;
        },

        /**
         * gets time range
         * @returns range between start and end
         */
        getRange: function() {
            return d3.time[this.unit].range(this.start, this.end, this.step);
        },

        /**
         * Gets filter for time
         * @returns {Object} time filter
         */
        getFilter: function() {
            var start = d3.time.format(this.formatInput || "%Y")(this.start),
                end = d3.time.format(this.formatInput || "%Y")(this.end),
                dim = this.getDimension(),
                filter = {};
            filter[dim] = [[start, end]]
            return filter;
        },

        /**
         * Gets formatter for this model
         * @returns {Function} formatter function
         */
        getFormatter: function() {
            var f = d3.time.format(this.formatInput || "%Y");
            return function(d) {
                return f.parse(d);
            }
        },

        /**
         * Snaps the time to integer
         * possible inputs are "start", "end", "value". "value" is default
         */
        snap: function(what){
            if (!this.round) return
            if(what == null) what = "value";
            var op = 'round';
            if (this.round === 'ceil') op = 'ceil';
            if (this.round === 'floor') op = 'floor';
            var time = d3.time[this.unit][op](this[what]);

            this.set(what, time, true); //3rd argumennt forces update
        },

        /**
         * Starts playing the time, initializing the interval
         */
        _startPlaying: function() {
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
            this._intervals.setInterval('playInterval_' + this._id, function() {
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
        _stopPlaying: function() {
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

(function() {

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
        init: function(reader_info) {
            this._name = 'csv-file';
            this._data = [];
            this._basepath = reader_info.path;
            this._formatters = reader_info.formatters;
            if (!this._basepath) {
                utils.error("Missing base path for csv-file reader");
            };
        },

        /**
         * Reads from source
         * @param {Object} query to be performed
         * @param {String} language language
         * @returns a promise that will be resolved when data is read
         */
        read: function(query, language) {
            var _this = this;
            var p = new Promise();

            //this specific reader has support for the tag {{LANGUAGE}}
            var path = this._basepath.replace("{{LANGUAGE}}", language);
            _this._data = [];

            (function(query, p) {

                //if cached, retrieve and parse
                if (FILE_CACHED.hasOwnProperty(path)) {
                    parse(FILE_CACHED[path]);
                }
                //if requested by another hook, wait for the response
                else if (FILE_REQUESTED.hasOwnProperty(path)) {
                    FILE_REQUESTED[path].then(function() {
                        parse(FILE_CACHED[path]);
                    });
                }
                //if not, request and parse
                else {
                    d3.csv(path, function(error, res) {

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
                    res = res.map(function(row) {
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
                    res.sort(function(a, b) {
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

                    //filter any rows that match where condition
                    data = utils.filterAny(data, where);

                    //only selected items get returned
                    data = data.map(function(row) {
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
        getData: function() {
            return this._data;
        }
    });

}).call(this);
/*!
 * Inline Reader
 * the simplest reader possible
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;

    Vizabi.Reader.extend('inline', {
        init: function(reader_info) {
            this.name = "inline";
            this._super(reader_info);
        }
    });

}).call(this);
/*!
 * Local JSON reader
 */

(function() {

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
        init: function(reader_info) {
            this._name = 'json-file';
            this._data = [];
            this._basepath = reader_info.path;
            this._formatters = reader_info.formatters;
            if (!this._basepath) {
                utils.error("Missing base path for json-file reader");
            };
        },

        /**
         * Reads from source
         * @param {Object} query to be performed
         * @param {String} language language
         * @returns a promise that will be resolved when data is read
         */
        read: function(query, language) {
            var _this = this;
            var p = new Promise();

            //this specific reader has support for the tag {{LANGUAGE}}
            var path = this._basepath.replace("{{LANGUAGE}}", language);
            _this._data = [];

            (function(query, p) {

                //if cached, retrieve and parse
                if (FILE_CACHED.hasOwnProperty(path)) {
                    parse(FILE_CACHED[path]);
                }
                //if requested by another hook, wait for the response
                else if (FILE_REQUESTED.hasOwnProperty(path)) {
                    FILE_REQUESTED[path].then(function() {
                        parse(FILE_CACHED[path]);
                    });
                }
                //if not, request and parse
                else {
                    d3.json(path, function(error, res) {

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
                    //make category an array and fix missing regions
                    res = res.map(function(row) {
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
                    res.sort(function(a, b) {
                        return a[order_by] - b[order_by];
                    });
                    //end of hack

                    return res;
                }

                function parse(res) {
                    //TODO: Improve local json filtering
                    var data = res[0];
                    //rename geo.category to geo.cat
                    var where = query.where;
                    if (where['geo.category']) {
                        where['geo.cat'] = utils.clone(where['geo.category']);
                        delete where['geo.category'];
                    }

                    //format values in the dataset and filters
                    where = utils.mapRows([where], _this._formatters)[0];

                    data = utils.filterAny(data, where);

                    //only selected items get returned
                    data = data.map(function(row) {
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
        getData: function() {
            return this._data;
        }
    });

}).call(this);
/*!
 * Waffle server Reader
 * the simplest reader possible
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;
    var Promise = Vizabi.Promise;

    Vizabi.Reader.extend('waffle-server', {

        /**
         * Initializes the reader.
         * @param {Object} reader_info Information about the reader
         */
        init: function(reader_info) {
            this._name = 'waffle-reader';
            this._data = [];
            this._basepath = reader_info.path || "https://waffle.gapminder.org/api/v1/query";
        },

        /**
         * Reads from source
         * @param {Array} query to be performed
         * @param {String} language language
         * @returns a promise that will be resolved when data is read
         */
        read: function(query, language) {
            var _this = this;
            var p = new Promise();
            var formatted;

            this._data = [];

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
                "FROM": "humnum"
            };

            var pars = {
                query: [formatted],
                lang: language
            };

            utils.post(this._basepath, pars, function(res) {
                _this._data = res;
                p.resolve();
            }, function() {
                console.log("Error loading from Waffle Server:", _this._basepath);
                p.reject('Could not read from waffle server');
            }, true);

            return p;
        },

        /**
         * Gets the data
         * @returns all data
         */
        getData: function() {
            return this._data;
        }
    });

}).call(this);
/*!
 * VIZABI BARCHART
 */

(function() {

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
        init: function(config, context) {
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
                "change:time:value": function(evt) {
                    _this.updateEntities();
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
        readyOnce: function() {

            this.element = d3.select(this.element);

            this.graph = this.element.select('.vzb-bc-graph');
            this.yAxisEl = this.graph.select('.vzb-bc-axis-y');
            this.xAxisEl = this.graph.select('.vzb-bc-axis-x');
            this.yTitleEl = this.graph.select('.vzb-bc-axis-y-title');
            this.bars = this.graph.select('.vzb-bc-bars');

            var _this = this;
            this.on("resize", function() {
                _this.updateEntities();
            });
        },

        /*
         * Both model and DOM are ready
         */
        ready: function() {
            this.updateIndicators();
            this.resize();
            this.updateEntities();
        },

        /**
         * Changes labels for indicators
         */
        updateIndicators: function() {
            var _this = this;
            this.translator = this.model.language.getTFunction();
            this.duration = this.model.time.speed;

            var titleStringY = this.translator("indicator/" + this.model.marker.axis_y.which);

            var yTitle = this.yTitleEl.selectAll("text").data([0]);
            yTitle.enter().append("text");
            yTitle
                .attr("y", "-6px")
                .attr("x", "-9px")
                .attr("dx", "-0.72em")
                .text(titleStringY);

            this.yScale = this.model.marker.axis_y.getScale();
            this.xScale = this.model.marker.axis_x.getScale();
            this.cScale = this.model.marker.color.getScale();

            this.yAxis.tickFormat(_this.model.marker.axis_y.tickFormatter);
            this.xAxis.tickFormat(_this.model.marker.axis_x.tickFormatter);
        },

        /**
         * Updates entities
         */
        updateEntities: function() {

            var _this = this;
            var time = this.model.time;
            var timeDim = time.getDimension();
            var duration = (time.playing) ? time.speed : 0;
            var filter = {};
            filter[timeDim] = time.value;
            var items = this.model.marker.label.getItems(filter);

            this.entityBars = this.bars.selectAll('.vzb-bc-bar')
                .data(items);

            //exit selection
            this.entityBars.exit().remove();

            //enter selection -- init circles
            this.entityBars.enter().append("rect")
                .attr("class", "vzb-bc-bar")
                .on("mousemove", function(d, i) {})
                .on("mouseout", function(d, i) {})
                .on("click", function(d, i) {});

            //positioning and sizes of the bars

            var bars = this.bars.selectAll('.vzb-bc-bar');
            var barWidth = this.xScale.rangeBand();

            this.bars.selectAll('.vzb-bc-bar')
                .attr("width", barWidth)
                .attr("fill", function(d) {
                    return _this.cScale(_this.model.marker.color.getValue(d));
                })
                .attr("x", function(d) {
                    return _this.xScale(_this.model.marker.axis_x.getValue(d));
                })
                .transition().duration(duration).ease("linear")
                .attr("y", function(d) {
                    return _this.yScale(_this.model.marker.axis_y.getValue(d));
                })
                .attr("height", function(d) {
                    return _this.height - _this.yScale(_this.model.marker.axis_y.getValue(d));
                });
        },

        /**
         * Executes everytime the container or vizabi is resized
         * Ideally,it contains only operations related to size
         */
        resize: function() {

            var _this = this;

            this.profiles = {
                "small": {
                    margin: {
                        top: 30,
                        right: 20,
                        left: 40,
                        bottom: 40
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
                        bottom: 40
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
                        bottom: 40
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

        },


        drawBars: function() {

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
        init: function(config, options) {

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
            }];

            //constructor is the same as any tool
            this._super(config, options);
        },

        /**
         * Validating the tool model
         * @param model the current tool model to be validated
         */
        validate: function(model) {

            model = this.model || model;

            var time = model.state.time;
            var marker = model.state.marker.label;

            //don't validate anything if data hasn't been loaded
            if (!marker.getItems() || marker.getItems().length < 1) {
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

    BarChart.define('default_options', {
        state: {
            time: {
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
            path: "local_data/waffles/{{LANGUAGE}}/basic-indicators.csv"
        },

        ui: {
            buttons: []
        },

        language: {
            id: "en",
            strings: {
                _defs_: {
                    en: {
                        "title": "",
                        "buttons/expand": "Go Big",
                        "buttons/unexpand": "Go Small",
                        "buttons/lock": "Lock",
                        "buttons/find": "Find",
                        "buttons/colors": "Colors",
                        "buttons/size": "Size",
                        "buttons/axes": "Axes",
                        "buttons/more_options": "Options"
                    }
                }
            }
        }
    });

}).call(this);
/*!
 * VIZABI BUBBLECHART
 */

(function() {

    "use strict";

    var Vizabi = this.Vizabi;
    var utils = Vizabi.utils;

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
        init: function(context, options) {
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

            this.model_binds = {
                "change:time:trails": function(evt) {
                    //console.log("EVENT change:time:trails");
                    _this._trails.toggle(_this.model.time.trails);
                    _this.redrawDataPoints();
                },
                "change:time:lockNonSelected": function(evt) {
                    //console.log("EVENT change:time:lockNonSelected");
                    _this.redrawDataPoints(500);
                },
                "change:entities:show": function(evt) {
                    //console.log("EVENT change:entities:show");
                    _this.entitiesUpdatedRecently = true;
                },
                "change:marker": function(evt) {
                    // bubble size change is processed separately
                    if (!_this._readyOnce) return;
                    if (evt == "change:marker:size:max") return;
                    if (evt.indexOf("change:marker:color:palette") > -1) return;
                    //console.log("EVENT change:marker", evt);
                    _this.markersUpdatedRecently = true;
                },
                "change:entities:select": function() {
                    if (!_this._readyOnce) return;
                    //console.log("EVENT change:entities:select");
                    _this.selectDataPoints();
                    _this.redrawDataPoints();
                    _this._trails.run(["resize", "recolor", "findVisible", "reveal"]);
                    _this.updateBubbleOpacity();
                },
                "change:entities:brush": function() {
                    if (!_this._readyOnce) return;
                    //console.log("EVENT change:entities:brush");
                    _this.highlightDataPoints();
                },
                "readyOnce": function(evt) {

                },
                "ready": function(evt) {
                    if (!_this._readyOnce) return;
                    //TODO a workaround to fix the selection of entities
                    if (_this.entitiesUpdatedRecently) {
                        _this.entitiesUpdatedRecently = false;
                        //console.log("EVENT ready");
                        _this.updateEntities();
                        _this.redrawDataPoints();
                        _this.updateBubbleOpacity();
                    }
                    
                    if (_this.markersUpdatedRecently) {
                        _this.markersUpdatedRecently = false;
                        
                        _this.updateUIStrings();
                        _this.updateIndicators();
                        _this.updateSize();
                        _this.updateMarkerSizeLimits();

                        _this._trails.create();
                        _this._trails.run("findVisible");
                        _this.resetZoomer(); //does also redraw data points and trails resize
                        //_this.redrawDataPoints();
                        _this._trails.run(["recolor", "reveal"]);
                    }
                },
                'change:time:value': function() {
                    //console.log("EVENT change:time:value");
                    _this.updateTime();

                    _this._trails.run("findVisible");
                    if (_this.model.time.adaptMinMaxZoom) {
                        _this.adaptMinMaxZoom();
                    } else {
                        _this.redrawDataPoints();
                    }
                    _this._trails.run("reveal");
                },
                'change:time:adaptMinMaxZoom': function() {
                    //console.log("EVENT change:time:adaptMinMaxZoom");
                    if (_this.model.time.adaptMinMaxZoom) {
                        _this.adaptMinMaxZoom();
                    } else {
                        _this.resetZoomer();
                    }
                },
                'change:marker:size:max': function() {
                    //console.log("EVENT change:marker:size:max");
                    _this.updateMarkerSizeLimits();
                    _this._trails.run("findVisible");
                    _this.redrawDataPointsOnlySize();
                    _this._trails.run("resize");
                },
                'change:marker:color:palette': function() {
                    //console.log("EVENT change:marker:color:palette");
                    _this.redrawDataPointsOnlyColors();
                    _this._trails.run("recolor");
                },
                'change:entities:opacitySelectDim': function() {
                    _this.updateBubbleOpacity();
                },
                'change:entities:opacityRegular': function() {
                    _this.updateBubbleOpacity();
                }
            }

            this._super(context, options);

            this.xScale = null;
            this.yScale = null;
            this.sScale = null;
            this.cScale = null;

            this.xAxis = d3.svg.axisSmart();
            this.yAxis = d3.svg.axisSmart();


            this.cached = {};
            this.xyMaxMinMean = {};
            this.currentZoomFrameXY = null;

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


            //            this.collisionResolver = d3.svg.collisionResolver()
            //                .value("labelY2")
            //                .fixed("labelFixed")
            //                .selector("text")
            //                .scale(this.yScale)
            //                .handleResult(this._repositionLabels);


            this.dragger = d3.behavior.drag()
                .on("dragstart", function(d, i) {
                    d3.event.sourceEvent.stopPropagation();
                })
                .on("drag", function(d, i) {
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

                    _this._repositionLabels(d, i, this, resolvedX, resolvedY, resolvedX0, resolvedY0, 0);
                })
                .on("dragend", function(d, i) {
                    var KEY = _this.KEY;
                    _this.model.entities.setLabelOffset(d, [
                        Math.round(_this.cached[d[KEY]].labelX_ * 100) / 100,
                        Math.round(_this.cached[d[KEY]].labelY_ * 100) / 100
                    ]);
                });



            this.dragRectangle = d3.behavior.drag()
                .on("dragstart", function(d, i) {
                    if (!(d3.event.sourceEvent.ctrlKey || d3.event.sourceEvent.metaKey)) return;

                    this.ctrlKeyLock = true;
                    this.origin = {
                        x: d3.mouse(this)[0] - _this.activeProfile.margin.left,
                        y: d3.mouse(this)[1] - _this.activeProfile.margin.top
                    };
                    _this.zoomRect.classed("vzb-invisible", false);
                })
                .on("drag", function(d, i) {
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

            .on("dragend", function(e) {
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
                .on("zoom", function() {
                    if (d3.event.sourceEvent != null && (d3.event.sourceEvent.ctrlKey || d3.event.sourceEvent.metaKey)) return;

                    var zoom = d3.event.scale;
                    var pan = d3.event.translate;
                    var ratioY = _this.zoomer.ratioY;
                    var ratioX = _this.zoomer.ratioX;


                    //value protections and fallbacks
                    if (isNaN(zoom) || zoom == null) zoom = _this.zoomer.scale();
                    if (isNaN(zoom) || zoom == null) zoom = 1;
                    if (isNaN(pan[0]) || isNaN(pan[1]) || pan[0] == null || pan[1] == null) pan = _this.zoomer.translate();
                    if (isNaN(pan[0]) || isNaN(pan[1]) || pan[0] == null || pan[1] == null) pan = [0, 0];


                    // limit the zooming, so that it never goes below 1 for any of the axes
                    if (zoom * ratioY < 1) {
                        ratioY = 1 / zoom;
                        _this.zoomer.ratioY = ratioY
                    };
                    if (zoom * ratioX < 1) {
                        ratioX = 1 / zoom;
                        _this.zoomer.ratioX = ratioX
                    };

                    //limit the panning, so that we are never outside the possible range
                    if (pan[0] > 0) pan[0] = 0;
                    if (pan[1] > 0) pan[1] = 0;
                    if (pan[0] < (1 - zoom * ratioX) * _this.width) pan[0] = (1 - zoom * ratioX) * _this.width;
                    if (pan[1] < (1 - zoom * ratioY) * _this.height) pan[1] = (1 - zoom * ratioY) * _this.height;
                    _this.zoomer.translate(pan);

                    _this.xScale.range([0 * zoom * ratioX + pan[0], _this.width * zoom * ratioX + pan[0]]);
                    _this.yScale.range([_this.height * zoom * ratioY + pan[1], 0 * zoom * ratioY + pan[1]]);

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
                });

            this.zoomer.ratioX = 1;
            this.zoomer.ratioY = 1;
        },


        /**
         * Executes right after the template is in place, but the model is not yet ready
         */
        readyOnce: function() {
            var _this = this;
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

            this.projectionX = this.graph.select(".vzb-bc-projection-x");
            this.projectionY = this.graph.select(".vzb-bc-projection-y");

            this.trailsContainer = this.graph.select('.vzb-bc-trails');
            this.bubbleContainerCrop = this.graph.select('.vzb-bc-bubbles-crop');
            this.bubbleContainer = this.graph.select('.vzb-bc-bubbles');
            this.labelsContainer = this.graph.select('.vzb-bc-labels');
            this.zoomRect = this.element.select('.vzb-bc-zoomRect');

            this.entityBubbles = null;
            this.entityLabels = null;
            this.tooltip = this.element.select('.vzb-tooltip');

            //component events
            this.on("resize", function() {
                //console.log("EVENT: resize");
                _this.updateSize();
                _this.updateMarkerSizeLimits();
                _this._trails.run("findVisible");
                _this.resetZoomer(); // includes redraw data points and trail resize
            })

            //keyboard listeners
            d3.select("body")
                .on("keydown", function() {
                    if (d3.event.metaKey || d3.event.ctrlKey) _this.element.select("svg").classed("vzb-zoomin", true);
                })
                .on("keyup", function() {
                    if (!d3.event.metaKey && !d3.event.ctrlKey) _this.element.select("svg").classed("vzb-zoomin", false);
                })

            this.element
                .call(this.zoomer)
                .call(this.dragRectangle);

            this.KEY = this.model.entities.getDimension();
            this.TIMEDIM = this.model.time.getDimension();

            //console.log("EVENT ready once");
            _this.updateUIStrings();
            _this.updateIndicators();
            _this.updateEntities();
            _this.updateTime();
            _this.updateSize();
            _this.updateMarkerSizeLimits();
            _this.selectDataPoints();
            _this.updateBubbleOpacity();
            _this._trails.create();

            _this.resetZoomer(); // includes redraw data points and trail resize
            _this._trails.run(["recolor", "findVisible", "reveal"]);
            if (_this.model.time.adaptMinMaxZoom) _this.adaptMinMaxZoom();
        },




        /*
         * UPDATE INDICATORS
         */
        updateIndicators: function() {
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
                x: this.model.marker.axis_x.getMaxMinMean(this.timeFormatter),
                y: this.model.marker.axis_y.getMaxMinMean(this.timeFormatter),
                s: this.model.marker.size.getMaxMinMean(this.timeFormatter)
            };
        },


        updateUIStrings: function() {
            var _this = this;

            this.translator = this.model.language.getTFunction();
            this.timeFormatter = d3.time.format(_this.model.time.formatOutput);

            var titleStringY = this.translator("indicator/" + this.model.marker.axis_y.which);
            var titleStringX = this.translator("indicator/" + this.model.marker.axis_x.which);
            var titleStringS = this.translator("indicator/" + this.model.marker.size.which);
            var titleStringC = this.translator("indicator/" + this.model.marker.color.which);

            if (!!this.model.marker.axis_y.unit) titleStringY = titleStringY + ", " + this.model.marker.axis_y.unit;
            if (!!this.model.marker.axis_x.unit) titleStringX = titleStringX + ", " + this.model.marker.axis_x.unit;
            if (!!this.model.marker.size.unit) titleStringS = titleStringS + ", " + this.model.marker.size.unit;
            if (!!this.model.marker.color.unit) titleStringC = titleStringC + ", " + this.model.marker.color.unit;

            var yTitle = this.yTitleEl.selectAll("text").data([0]);
            yTitle.enter().append("text");
            yTitle
                .attr("y", "-6px")
                .attr("x", "-9px")
                .attr("dx", "-0.72em")
                .text(titleStringY);

            var xTitle = this.xTitleEl.selectAll("text").data([0]);
            xTitle.enter().append("text");
            xTitle
                .attr("text-anchor", "end")
                .attr("y", "-0.32em")
                .text(titleStringX);

            var sTitle = this.sTitleEl.selectAll("text").data([0]);
            sTitle.enter().append("text");
            sTitle
                .attr("text-anchor", "end")
                .text(this.translator("buttons/size") + ": " + titleStringS + ", " +
                    this.translator("buttons/colors") + ": " + titleStringC);

        },

        /*
         * UPDATE ENTITIES:
         * Ideally should only update when show parameters change or data changes
         */
        updateEntities: function() {
            var _this = this;
            var KEY = this.KEY;
            var TIMEDIM = this.TIMEDIM;

            // get array of GEOs, sorted by the size hook
            // that makes larger bubbles go behind the smaller ones
            var endTime = this.model.time.end;
            this.model.entities._visible = this.model.marker.label.getItems()
                .map(function(d) {
                    var pointer = {};
                    pointer[KEY] = d[KEY];
                    pointer[TIMEDIM] = endTime;
                    pointer.sortValue = _this.model.marker.size.getValue(pointer);
                    return pointer;
                })
                .sort(function(a, b) {
                    return b.sortValue - a.sortValue;
                });

            this.entityBubbles = this.bubbleContainer.selectAll('.vzb-bc-entity')
                .data(this.model.entities._visible, function(d) {
                    return d[KEY]
                });

            //exit selection
            this.entityBubbles.exit().remove();

            //enter selection -- init circles
            this.entityBubbles.enter().append("circle")
                .attr("class", "vzb-bc-entity")
                .on("mousemove", function(d, i) {

                    _this.model.entities.highlightEntity(d);

                    var text = "";
                    if (_this.model.entities.isSelected(d) && _this.model.time.trails) {
                        text = _this.timeFormatter(_this.time);
                        _this.entityLabels
                            .filter(function(f) {return f[KEY] == d[KEY]})
                            .classed("vzb-highlighted", true);
                    } else {
                        text = _this.model.marker.label.getValue(d);
                    }
                    _this._setTooltip(text);
                })
                .on("mouseout", function(d, i) {

                    _this.model.entities.clearHighlighted();
                    _this._setTooltip();
                    _this.entityLabels.classed("vzb-highlighted", false);
                })
                .on("click", function(d, i) {

                    _this.model.entities.selectEntity(d, this.TIMEDIM, _this.timeFormatter);
                });




            //TODO: no need to create trail group for all entities
            //TODO: instead of :append an :insert should be used to keep order, thus only few trail groups can be inserted
            this.entityTrails = this.trailsContainer.selectAll(".vzb-bc-entity")
                .data(this.model.entities._visible, function(d) {
                    return d[KEY]
                });

            this.entityTrails.exit().remove();

            this.entityTrails.enter().append("g")
                .attr("class", function(d) {
                    return "vzb-bc-entity" + " " + d[KEY]
                });

        },

        adaptMinMaxZoom: function() {
            var _this = this;
            var mmmX = _this.xyMaxMinMean.x[_this.timeFormatter(_this.time)];
            var mmmY = _this.xyMaxMinMean.y[_this.timeFormatter(_this.time)];
            var radiusMax = utils.areaToRadius(_this.sScale(_this.xyMaxMinMean.s[_this.timeFormatter(_this.time)].max));
            var frame = _this.currentZoomFrameXY;

            var suggestedFrame = {
                x1: _this.xScale(mmmX.min) - radiusMax,
                y1: _this.yScale(mmmY.min) + radiusMax,
                x2: _this.xScale(mmmX.max) + radiusMax,
                y2: _this.yScale(mmmY.max) - radiusMax,
            }

            var TOLERANCE = 0.3;

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

        _zoomOnRectangle: function(element, x1, y1, x2, y2, compensateDragging, duration) {
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
            ]

            zoomer.scale(zoom);
            zoomer.ratioY = ratioY;
            zoomer.ratioX = ratioX;
            zoomer.translate(pan);
            zoomer.duration = duration ? duration : 0;

            zoomer.event(element);
        },

        resetZoomer: function(element) {
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
        updateTime: function() {
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
        updateSize: function() {

            var _this = this;


            this.profiles = {
                "small": {
                    margin: {
                        top: 30,
                        right: 20,
                        left: 40,
                        bottom: 40
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
                        bottom: 40
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
                        bottom: 40
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

            this.xTitleEl.attr("transform", "translate(" + this.width + "," + this.height + ")");
            this.sTitleEl.attr("transform", "translate(" + this.width + "," + 0 + ") rotate(-90)");

            this.yAxisEl.call(this.yAxis);
            this.xAxisEl.call(this.xAxis);

            this.projectionX.attr("y1", _this.yScale.range()[0]);
            this.projectionY.attr("x2", _this.xScale.range()[0]);

        },

        updateMarkerSizeLimits: function() {
            var _this = this;
            var minRadius = this.activeProfile.minRadius;
            var maxRadius = this.activeProfile.maxRadius;

            this.minRadius = Math.max(maxRadius * this.model.marker.size.min, minRadius);
            this.maxRadius = maxRadius * this.model.marker.size.max;

            if (this.model.marker.size.scaleType !== "ordinal") {
                this.sScale.range([utils.radiusToArea(_this.minRadius), utils.radiusToArea(_this.maxRadius)]);
            } else {
                this.sScale.rangePoints([utils.radiusToArea(_this.minRadius), utils.radiusToArea(_this.maxRadius)], 0).range();
            }

        },

        redrawDataPointsOnlyColors: function() {
            var _this = this;
            var KEY = this.KEY;
            var TIMEDIM = this.TIMEDIM;

            this.entityBubbles.style("fill", function(d) {
                var pointer = {};
                pointer[KEY] = d[KEY];
                pointer[TIMEDIM] = _this.time;
                
                var valueC = _this.model.marker.color.getValue(pointer);
                return _this.cScale(valueC);
            });
        },

        redrawDataPointsOnlySize: function() {
            var _this = this;

            if (this.someSelected) {
                _this.entityBubbles.each(function(d, index) {
                    _this._updateBubble(d, index, d3.select(this), 0);
                });
            } else {
                this.entityBubbles.each(function(d, index) {
                    var valueS = _this.model.marker.size.getValue(d);
                    if (valueS == null) return;

                    d3.select(this).attr("r", utils.areaToRadius(_this.sScale(valueS)));
                });
            }
        },

        /*
         * REDRAW DATA POINTS:
         * Here plotting happens
         */
        redrawDataPoints: function(duration) {
            var _this = this;

            if (duration == null) duration = _this.duration;

            this.entityBubbles.each(function(d, index) {
                var view = d3.select(this);
                _this._updateBubble(d, index, view, duration);

            }); // each bubble

            // Call flush() after any zero-duration transitions to synchronously flush the timer queue
            // and thus make transition instantaneous. See https://github.com/mbostock/d3/issues/1951
            if (_this.duration == 0) d3.timer.flush();

            if (_this.ui.labels.autoResolveCollisions) {
                // cancel previously queued simulation if we just ordered a new one
                clearTimeout(_this.collisionTimeout);

                // place label layout simulation into a queue
                _this.collisionTimeout = setTimeout(function() {
                    //  _this.entityLabels.call(_this.collisionResolver.data(_this.cached));
                }, _this.model.time.speed * 1.2)
            }

        },

        //redraw Data Points
        _updateBubble: function(d, index, view, duration) {
            var _this = this;
            var TIMEDIM = this.TIMEDIM;

            if (_this.model.time.lockNonSelected && _this.someSelected && !_this.model.entities.isSelected(d)) {
                d[TIMEDIM] = _this.timeFormatter.parse("" + _this.model.time.lockNonSelected);
            } else {
                d[TIMEDIM] = _this.time;
            };

            var valueY = _this.model.marker.axis_y.getValue(d);
            var valueX = _this.model.marker.axis_x.getValue(d);
            var valueS = _this.model.marker.size.getValue(d);
            var valueL = _this.model.marker.label.getValue(d);
            var valueC = _this.model.marker.color.getValue(d);

            // check if fetching data succeeded
            //TODO: what if values are ACTUALLY 0 ?
            if (!valueL || !valueY || !valueX || !valueS) {
                // if entity is missing data it should hide
                view.classed("vzb-invisible", true)

            } else {

                // if entity has all the data we update the visuals
                var scaledS = utils.areaToRadius(_this.sScale(valueS));

                view.classed("vzb-invisible", false)
                    .style("fill", _this.cScale(valueC))
                    .transition().duration(duration).ease("linear")
                    .attr("cy", _this.yScale(valueY))
                    .attr("cx", _this.xScale(valueX))
                    .attr("r", scaledS)

                _this._updateLabel(d, index, valueX, valueY, scaledS, valueL, duration);

            } // data exists
        },




        _updateLabel: function(d, index, valueX, valueY, scaledS, valueL, duration) {
            var _this = this;
            var KEY = this.KEY;
            if (duration == null) duration = _this.duration;

            // only for selected entities
            if (_this.model.entities.isSelected(d) && _this.entityLabels != null) {

                if (_this.cached[d[KEY]] == null) _this.cached[d[KEY]] = {};
                var cached = _this.cached[d[KEY]];


                var select = utils.find(_this.model.entities.select, function(f) {return f[KEY] == d[KEY]});
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


                // reposition label
                _this.entityLabels.filter(function(f) {return f[KEY] == d[KEY]})
                    .each(function(groupData) {

                        var labelGroup = d3.select(this);

                        var text = labelGroup.selectAll("text.vzb-bc-label-content")
                            .text(valueL + (_this.model.time.trails ? " " + select.trailStartTime : ""));

                        var line = labelGroup.select("line")
                            .style("stroke-dasharray", "0 " + (cached.scaledS0 + 2) + " 100%");

                        var rect = labelGroup.select("rect");

                        var contentBBox = text[0][0].getBBox();
                        if (!cached.contentBBox || cached.contentBBox.width != contentBBox.width) {
                            cached.contentBBox = contentBBox;

                            labelGroup.select("text.vzb-bc-label-x")
                                .attr("x", contentBBox.width + contentBBox.height * 0.0 + 2)
                                .attr("y", contentBBox.height * 0.0 - 4);

                            labelGroup.select("circle")
                                .attr("cx", contentBBox.width + contentBBox.height * 0.0 + 2)
                                .attr("cy", contentBBox.height * 0.0 - 4)
                                .attr("r", contentBBox.height * 0.5);

                            rect.attr("width", contentBBox.width + 4)
                                .attr("height", contentBBox.height + 4)
                                .attr("x", -2)
                                .attr("y", -4)
                                .attr("rx", contentBBox.height * 0.2)
                                .attr("ry", contentBBox.height * 0.2);
                        }

                        cached.labelX_ = select.labelOffset[0] || cached.scaledS0 / _this.width;
                        cached.labelY_ = select.labelOffset[1] || cached.scaledS0 / _this.width;

                        var resolvedX = _this.xScale(cached.labelX0) + cached.labelX_ * _this.width;
                        var resolvedY = _this.yScale(cached.labelY0) + cached.labelY_ * _this.height;

                        var limitedX = resolvedX > 0 ? (resolvedX < _this.width - cached.contentBBox.width ? resolvedX : _this.width - cached.contentBBox.width) : 0;
                        var limitedY = resolvedY > 0 ? (resolvedY < _this.height - cached.contentBBox.height ? resolvedY : _this.height - cached.contentBBox.height) : 0;

                        var limitedX0 = _this.xScale(cached.labelX0);
                        var limitedY0 = _this.yScale(cached.labelY0);

                        cached.stuckOnLimit = limitedX != resolvedX || limitedY != resolvedY;

                        rect.classed("vzb-transparent", !cached.stuckOnLimit);

                        _this._repositionLabels(d, index, this, limitedX, limitedY, limitedX0, limitedY0, duration);

                    })
            } else {
                //for non-selected bubbles
                //make sure there is no cached data
                if (_this.cached[d[KEY]] != null) {
                    delete _this.cached[d[KEY]]
                };
            }
        },

        _repositionLabels: function(d, i, context, resolvedX, resolvedY, resolvedX0, resolvedY0, duration) {

            var labelGroup = d3.select(context);

            labelGroup
                .transition().duration(duration || 0).ease("linear")
                .attr("transform", "translate(" + resolvedX + "," + resolvedY + ")");

            labelGroup.selectAll("line")
                .attr("x1", resolvedX0 - resolvedX)
                .attr("y1", resolvedY0 - resolvedY);

        },



        selectDataPoints: function() {
            var _this = this;
            var KEY = this.KEY;

            _this.someSelected = (_this.model.entities.select.length > 0);


            this.entityLabels = this.labelsContainer.selectAll('.vzb-bc-entity')
                .data(_this.model.entities.select, function(d) { return (d[KEY]);});


            this.entityLabels.exit()
                .each(function(d) {
                    _this._trails.run("remove", d);
                })
                .remove();

            this.entityLabels
                .enter().append("g")
                .attr("class", "vzb-bc-entity")
                .call(_this.dragger)
                .each(function(d, index) {
                    var view = d3.select(this);
                    view.append("line").attr("class", "vzb-bc-label-line");

                    view.append("rect").attr("class", "vzb-transparent")
                        .on("click", function(d, i) {
                            //default prevented is needed to distinguish click from drag
                            if (d3.event.defaultPrevented) return

                            var maxmin = _this.cached[d[KEY]].maxMinValues;
                            var radius = utils.areaToRadius(_this.sScale(maxmin.valueSmax));
                            _this._zoomOnRectangle(_this.element,
                                _this.xScale(maxmin.valueXmin) - radius,
                                _this.yScale(maxmin.valueYmin) + radius,
                                _this.xScale(maxmin.valueXmax) + radius,
                                _this.yScale(maxmin.valueYmax) - radius,
                                false, 500);
                        });

                    view.append("text").attr("class", "vzb-bc-label-content vzb-bc-label-shadow");

                    view.append("text").attr("class", "vzb-bc-label-content");

                    view.append("circle").attr("class", "vzb-bc-label-x vzb-bc-label-shadow vzb-transparent")
                        .on("click", function(d, i) {
                            //default prevented is needed to distinguish click from drag
                            if (d3.event.defaultPrevented) return
                            _this.model.entities.selectEntity(d);
                        });

                    view.append("text").attr("class", "vzb-bc-label-x vzb-transparent").text("x");

                    _this._trails.create(d);
                })
                .on("mousemove", function() {
                    d3.select(this).selectAll(".vzb-bc-label-x")
                        .classed("vzb-transparent", false)
                    d3.select(this).select("rect")
                        .classed("vzb-transparent", false)
                })
                .on("mouseout", function(d) {
                    d3.select(this).selectAll(".vzb-bc-label-x")
                        .classed("vzb-transparent", true)
                    d3.select(this).select("rect")
                        .classed("vzb-transparent", !_this.cached[d[KEY]].stuckOnLimit)
                });




        },




        _setTooltip: function(tooltipText) {
            if (tooltipText) {
                var mouse = d3.mouse(this.graph.node()).map(function(d) {
                    return parseInt(d)
                });

                //position tooltip
                this.tooltip.classed("vzb-hidden", false)
                    .attr("style", "left:" + (mouse[0] + 50) + "px;top:" + (mouse[1] + 50) + "px")
                    .html(tooltipText);

            } else {

                this.tooltip.classed("vzb-hidden", true);
            }
        },

        /*
         * Shows and hides axis projections
         */
        _axisProjections: function(d) {
            if (d != null) {

                var valueY = this.model.marker.axis_y.getValue(d);
                var valueX = this.model.marker.axis_x.getValue(d);
                var valueS = this.model.marker.size.getValue(d);
                var radius = utils.areaToRadius(this.sScale(valueS))
                
                if(!valueY || !valueX || !valueS) return;

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
        highlightDataPoints: function() {
            var _this = this;
            var TIMEDIM = this.TIMEDIM;

            this.someHighlighted = (this.model.entities.brush.length > 0);

            this.updateBubbleOpacity();

            if (this.model.entities.brush.length === 1) {
                var d = utils.clone(this.model.entities.brush[0]);

                if (_this.model.time.lockNonSelected && _this.someSelected && !_this.model.entities.isSelected(d)) {
                    d[TIMEDIM] = _this.timeFormatter.parse("" + _this.model.time.lockNonSelected);
                } else {
                    d[TIMEDIM] = _this.time;
                }

                this._axisProjections(d);
            } else {
                this._axisProjections();
            }
        },

        updateBubbleOpacity: function(duration) {
            var _this = this;
            //if(!duration)duration = 0;

            var OPACITY_HIGHLT = 1.0;
            var OPACITY_HIGHLT_DIM = 0.3;
            var OPACITY_SELECT = 0.8;
            var OPACITY_REGULAR = this.model.entities.opacityRegular;
            var OPACITY_SELECT_DIM = this.model.entities.opacitySelectDim;

            this.entityBubbles
                //.transition().duration(duration)
                .style("opacity", function(d) {

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
                this.entityBubbles.style("pointer-events", function(d) {
                    return (!someSelectedAndOpacityZero || _this.model.entities.isSelected(d)) ?
                        "visible" : "none";
                });
            }

            this.someSelectedAndOpacityZero_1 = _this.someSelected && _this.model.entities.opacitySelectDim < 0.01;
        }



    });


}).call(this);

/*!
 * VIZABI BUBBLECHART
 */

(function() {

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
        init: function(config, options) {

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
            }];

            this._super(config, options);

        },


        /**
         * Validating the tool model
         * @param model the current tool model to be validated
         */
        validate: function(model) {

            model = this.model || model;

            var time = model.state.time;
            var marker = model.state.marker.label;

            //don't validate anything if data hasn't been loaded
            if (!marker.getItems() || marker.getItems().length < 1) return;

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

/*!
 * VIZABI BUBBLECHART DEFAULT OPTIONS
 */

(function() {
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
                    }
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
                path: "local_data/waffles/{{LANGUAGE}}/basic-indicators.csv"
            },

            ui: {
                'vzb-tool-bubble-chart': {},
                buttons: []
            },

            language: {
                id: "en",
                strings: {
                    en: {
                        "title": "Bubble Chart Title",
                        "buttons/expand": "Go big",
                        "buttons/unexpand": "Go small",
                        "buttons/trails": "Trails",
                        "buttons/lock": "Lock",
                        "buttons/find": "Find",
                        "buttons/deselect": "Deselect",
                        "buttons/ok": "OK",
                        "buttons/colors": "Colors",
                        "buttons/size": "Size",
                        "buttons/axes": "Axes",
                        "buttons/more_options": "Options",
                        "scaletype/linear": "Linear",
                        "scaletype/log": "Logarithmic",
                        "scaletype/genericLog": "Generic log",
                        "scaletype/time": "Time",
                        "scaletype/ordinal": "Ordinal",
                        "color/geo.region/asi": "Asia",
                        "color/geo.region/eur": "Europe",
                        "color/geo.region/ame": "Americas",
                        "color/geo.region/afr": "Afrika",
                        "color/geo.region/_default": "Other"
                    }
                }
            }
        });

}).call(this);
(function() {
    
    var Vizabi = this.Vizabi;
    var utils = Vizabi.utils;
    
    Vizabi.Helper.extend("gapminder-bublechart-trails", {
        
            init: function(context) {
                this.context = context;
            },
            
            toggle: function(arg) {
                var _this = this.context;
                
                if (arg) {
                    _this._trails.create();
                    _this._trails.run(["resize", "recolor", "findVisible", "reveal"]);
                } else {
                    _this._trails.run("remove");
                    _this.model.entities.select.forEach(function(d) {
                        d.trailStartTime = null;
                    });
                }
            },
            
            create: function(selection) {
                var _this = this.context;
                var KEY = _this.KEY;

                //quit if the function is called accidentally
                if(!_this.model.time.trails || !_this.model.entities.select.length) return;

                var start = +_this.timeFormatter(_this.model.time.start);
                var end = +_this.timeFormatter(_this.model.time.end);
                var step = _this.model.time.step;
                var timePoints = [];
                for (var time = start; time <= end; time += step) timePoints.push(time);

                //work with entities.select (all selected entities), if no particular selection is specified
                selection = selection == null ? _this.model.entities.select : [selection];
                selection.forEach(function(d) {

                    var trailSegmentData = timePoints.map(function(m){return {t: _this.timeFormatter.parse("" + m)} });

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
                        .filter(function(f) {return f[KEY] == d[KEY]})
                        .selectAll("g")
                        .data(trailSegmentData);

                    trail.exit().remove();

                    trail.enter().append("g")
                        .attr("class", "trailSegment")
                        .on("mousemove", function(segment, index) {
                            var _key = d3.select(this.parentNode).data()[0][KEY];
                        
                            var pointer = {};
                            pointer[KEY] = _key;
                            pointer.time = segment.t;
                        
                            _this._axisProjections(pointer);
                            _this._setTooltip(_this.timeFormatter(segment.t));
                            _this.entityLabels
                                .filter(function(f) {return f[KEY] == _key})
                                .classed("vzb-highlighted", true);
                        })
                        .on("mouseout", function(segment, index) {
                            _this._axisProjections();
                            _this._setTooltip();
                            _this.entityLabels.classed("vzb-highlighted", false);
                        })
                        .each(function(segment, index) {
                            var view = d3.select(this);
                            view.append("circle");
                            view.append("line");
                        });


                    trail.each(function(segment, index) {
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

            
            
            
            
            run: function(actions, selection, duration){
                var _this = this.context;
                var KEY = _this.KEY;
            
            
                //quit if function is called accidentally
                if((!_this.model.time.trails || !_this.model.entities.select.length) && actions!="remove") return;
                if(!duration)duration=0;

                actions = [].concat(actions);

                //work with entities.select (all selected entities), if no particular selection is specified
                selection = selection == null ? _this.model.entities.select : [selection];
                selection.forEach(function(d) {

                    var trail = _this.entityTrails
                        .filter(function(f) { return f[KEY] == d[KEY] })
                        .selectAll("g")

                    //do all the actions over "trail"
                    actions.forEach(function(action){
                        _this._trails["_"+action](trail, duration, d);
                    })

                });
            },
            
            
            
            
            
            _remove: function(trail, duration, d) {
                trail.remove();
            },

            _resize: function(trail, duration, d) {
                var _this = this.context;

                trail.each(function(segment, index){

                    var view = d3.select(this);
                    view.select("circle")
                        //.transition().duration(duration).ease("linear")
                        .attr("cy", _this.yScale(segment.valueY))
                        .attr("cx", _this.xScale(segment.valueX))
                        .attr("r", utils.areaToRadius(_this.sScale(segment.valueS)));

                    var next = this.parentNode.childNodes[(index+1)];
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

            _recolor: function(trail, duration, d) {
                var _this = this.context;

                trail.each(function(segment, index){

                    var view = d3.select(this);   

                    view.select("circle")
                        //.transition().duration(duration).ease("linear")
                        .style("fill", _this.cScale(segment.valueC));
                    view.select("line")
                        //.transition().duration(duration).ease("linear")
                        .style("stroke", _this.cScale(segment.valueC));
                });
            },


            _findVisible: function(trail, duration, d) {
                var _this = this.context;
                var KEY = _this.KEY;

                var firstVisible = true;
                var trailStartTime = _this.timeFormatter.parse("" + d.trailStartTime);

                trail.each(function(segment, index){

                    // segment is transparent if it is after current time or before trail StartTime
                    segment.transparent = (segment.t - _this.time >= 0) 
                        || (trailStartTime - segment.t >  0) 
                        //no trail segment should be visible if leading bubble is shifted backwards
                        || (d.trailStartTime - _this.timeFormatter(_this.time) >= 0);

                    if(firstVisible && !segment.transparent){
                        _this.cached[d[KEY]].labelX0 = segment.valueX;
                        _this.cached[d[KEY]].labelY0 = segment.valueY;
                        _this.cached[d[KEY]].scaledS0 = utils.areaToRadius(_this.sScale(segment.valueS));
                        firstVisible = false;
                    }
                });
            },


            _reveal: function(trail, duration, d) {
                var _this = this.context;
                var KEY = _this.KEY;

                trail.each(function(segment, index){

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
                    }else{  
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

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) return;


    //LINE CHART COMPONENT
    Vizabi.Component.extend('gapminder-linechart', {

        init: function(context, options) {
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
                'change:time:value': function() {
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
            }, this.ui["vzb-tool-"+this.name]);
            
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
            
        },

        /*
         * domReady:
         * Executed after template is loaded
         * Ideally, it contains instantiations related to template
         */
        readyOnce: function() {
            var _this = this;
            
            this.element = d3.select(this.element);
            this.graph = this.element.select('.vzb-lc-graph');
            this.yAxisEl = this.graph.select('.vzb-lc-axis-y');
            this.xAxisEl = this.graph.select('.vzb-lc-axis-x');
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
            this.on("resize", function() {
                _this.updateSize();
                _this.updateTime();
                _this.redrawDataPoints();
            }); 
        },

        ready: function() {
            this.updateShow();
            this.updateSize();
            this.updateTime();
            this.redrawDataPoints();
        },

        /*
         * UPDATE SHOW:
         * Ideally should only update when show parameters change or data changes
         */
        updateShow: function() {
            var _this = this;
            var KEY = this.KEY;
            
            this.duration = this.model.time.speed;
            this.translator = this.model.language.getTFunction();
            
            var titleString = this.translator("indicator/" + this.model.marker.axis_y.which);
                
            var yTitle = this.yTitleEl.selectAll("text").data([0]);
            yTitle.enter().append("text");
            yTitle
                .attr("y", "-0px")
                .attr("x", "-9px")
                .attr("dy", "-0.36em")
                .attr("dx", "-0.72em")
                .text(titleString);
            
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
                .x(function(d) {return _this.xScale(d[0]); })
                .y(function(d) {return _this.yScale(d[1]); });

        },
        
        
        /*
         * UPDATE TIME:
         * Ideally should only update when time or data changes
         */
        updateTime: function() {
            var _this = this;
            
            var time_1 = (this.time === null) ? this.model.time.value : this.time;
            this.time = this.model.time.value;
            this.duration = this.model.time.playing && (this.time - time_1>0) ? this.model.time.speed*0.9 : 0;

            var timeDim = this.model.time.getDimension();
            var filter = {};

            filter[timeDim] = this.time;
            
            this.data = this.model.marker.label.getItems(filter);

            this.entityLines = this.linesContainer.selectAll('.vzb-lc-entity').data(this.data);
            this.entityLabels = this.labelsContainer.selectAll('.vzb-lc-entity').data(this.data);
               
            this.timeUpdatedOnce = true;

        },
        
        /*
         * RESIZE:
         * Executed whenever the container is resized
         * Ideally, it contains only operations related to size
         */
        updateSize: function() {
            
            var _this = this;
            
            var padding = 2;

            this.profiles = {
                "small": {
                    margin: { top: 30, right: 20, left: 40, bottom: 30},
                    tick_spacing: 60,
                    text_padding: 8,
                    lollipopRadius: 6,
                    limitMaxTickNumberX: 5
                },
                "medium": {
                    margin: {top: 40,right: 60,left: 60,bottom: 40},
                    tick_spacing: 80,
                    text_padding: 12,
                    lollipopRadius: 7,
                    limitMaxTickNumberX: 10
                },
                "large": {
                    margin: { top: 50, right: 60, left: 60, bottom: 50},
                    tick_spacing: 100,
                    text_padding: 20,
                    lollipopRadius: 9,
                    limitMaxTickNumberX: 0 // unlimited
                }
            };

            this.activeProfile = this.profiles[this.getLayoutProfile()];
            this.margin = this.activeProfile.margin;
            this.tick_spacing = this.activeProfile.tick_spacing;



            //adjust right this.margin according to biggest label
            var lineLabelsText = this.model.marker.label.getItems().map(function(d,i){
                return _this.model.marker.label.getValue(d);
            });
            
            var longestLabelWidth = 0;
            var lineLabelsView = this.linesContainer.selectAll(".samplingView").data(lineLabelsText);

            lineLabelsView
                .enter().append("text")
                .attr("class","samplingView vzb-lc-labelName")
                .style("opacity",0)
                .text(function(d){
                    return (d.length<13) ? d : d.substring(0, 10)+'...';
                })
                .each(function(d){
                    if(longestLabelWidth > this.getComputedTextLength()) {
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
                .attr("y",this.xAxis.tickPadding() + this.xAxis.tickSize());

            
            
            // adjust the vertical dashed line
            this.verticalNow.attr("y1",this.yScale.range()[0]).attr("y2",this.yScale.range()[1])
                .attr("x1",0).attr("x2",0);
            this.projectionX.attr("y1",_this.yScale.range()[0]);
            this.projectionY.attr("x2",_this.xScale.range()[0]);


            this.parent.trigger('myEvent', {rangeMax: this.xScale.range()[1], mRight: this.margin.right});
            
            this.sizeUpdatedOnce = true;
        },

        /*
         * REDRAW DATA POINTS:
         * Here plotting happens
         */
        redrawDataPoints: function() {
            var _this = this;
            var KEY = this.KEY;
            
            if(!this.timeUpdatedOnce) {
                this.updateTime();
            }

            if(!this.sizeUpdatedOnce) {
                this.updateSize();
            }

            this.entityLabels.exit().remove();
            this.entityLines.exit().remove();
            
            this.entityLines.enter().append("g")
                .attr("class", "vzb-lc-entity")
                .on("mousemove", function(d,i){
                    _this.entityMousemove(d,i,_this);
                })
                .on("mouseout", function(d,i){
                    _this.entityMouseout(d,i,_this);
                })
                .each(function(d, index){
                    var entity = d3.select(this);    
                    var color = _this.cScale(_this.model.marker.color.getValue(d));
                    var colorShadow = _this.cShadeScale(_this.model.marker.color_shadow.getValue(d));
                    
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
                .on("mousemove", function(d,i){
                    _this.entityMousemove(d,i,_this);
                })
                .on("mouseout", function(d,i){
                    _this.entityMouseout(d,i,_this);
                })
                .each(function(d, index){
                    var entity = d3.select(this);    
                    var color = _this.cScale(_this.model.marker.color.getValue(d));
                    var colorShadow = _this.cShadeScale(_this.model.marker.color_shadow.getValue(d));
                    var label = _this.model.marker.label.getValue(d);
                
                    entity.append("circle")
                        .attr("class", "vzb-lc-circle")
                        .style("fill", color)
                        .attr("cx", 0 );
                
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
                    
            this.entityLines
                .each(function(d,index){
                    var entity = d3.select(this);       
                    var label = _this.model.marker.label.getValue(d);
                    
                    //TODO: optimization is possible if getValues would return both x and time
                    //TODO: optimization is possible if getValues would return a limited number of points, say 1 point per screen pixel
                    var x = _this.model.marker.axis_x.getValues(d);
                    var y = _this.model.marker.axis_y.getValues(d);
                    var xy = x.map(function(d,i){ return [+x[i],+y[i]]; });
                    xy = xy.filter(function(d){ return !utils.isNaN(d[1]); });
                    _this.cached[d[KEY]] = {valueY:xy[xy.length-1][1]};
                    
                    // the following fixes the ugly line butts sticking out of the axis line
                    //if(x[0]!=null && x[1]!=null) xy.splice(1, 0, [(+x[0]*0.99+x[1]*0.01), y[0]]);
                
                    var path1 = entity.select(".vzb-lc-line-shadow")
                        .attr("d", _this.line(xy));
                    var path2 = entity.select(".vzb-lc-line")
                        //.style("filter", "none")
                        .attr("d", _this.line(xy));

                    
                    // this section ensures the smooth transition while playing and not needed otherwise
                    if(_this.model.time.playing){
                        
                        var totalLength = path2.node().getTotalLength();
                        
                        if(_this.totalLength_1[d[KEY]]===null) {
                            _this.totalLength_1[d[KEY]]=totalLength;
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
                    }else{
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
                .each(function(d,index){
                    var entity = d3.select(this);       
                    var label = _this.model.marker.label.getValue(d);
                                
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
                        .attr("transform","translate(0," + _this.yScale(_this.cached[d[KEY]].valueY) + ")" );
                

                    var value = _this.yAxis.tickFormat()(_this.cached[d[KEY]].valueY);
                    var name = label.length<13? label : label.substring(0, 10)+'...';
                    var valueHideLimit = _this.ui.entity_labels.min_number_of_entities_when_values_hide;
                    
                    var t = entity.select(".vzb-lc-labelName")
                        .attr("dx", _this.activeProfile.text_padding)
                        .text(name + " " + (_this.data.length<valueHideLimit ? value : ""));
                
                    entity.select(".vzb-lc-labelValue")
                        .attr("dx", _this.activeProfile.text_padding)
                        .text("");
                    
                    if(_this.data.length < valueHideLimit){
                        
                        var size = _this.xScale(_this.time)
                                         + t[0][0].getComputedTextLength()
                                         + _this.activeProfile.text_padding;
                        var width = _this.width + _this.margin.right;

                        if(size > width){
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
                .style("opacity",this.time-this.model.time.start===0 || _this.hoveringNow?0:1);
                

            if(!this.hoveringNow) {
                this.xAxisEl.call(
                    this.xAxis.highlightValue(_this.time).highlightTransDuration(_this.duration)
                );
            }

            // Call flush() after any zero-duration transitions to synchronously flush the timer queue
            // and thus make transition instantaneous. See https://github.com/mbostock/d3/issues/1951
            if(_this.duration==0) {
                d3.timer.flush();
            }
            
            // cancel previously queued simulation if we just ordered a new one
            // then order a new collision resolving
            clearTimeout(_this.collisionTimeout);
            _this.collisionTimeout = setTimeout(function(){
                _this.entityLabels.call(_this.collisionResolver.data(_this.cached));
            },  _this.model.time.speed*1.5);
            
        }, 

        entityMousemove: function(me, index, context){
            var _this = context;
            var KEY = _this.KEY;
            
            _this.hoveringNow = me;

            _this.graph.selectAll(".vzb-lc-entity").each(function(){
                d3.select(this)
                    .classed("vzb-dimmed", function(d){
                        return d[KEY] !== _this.hoveringNow[KEY];
                    })
                    .classed("vzb-hovered", function(d){
                        return d[KEY] === _this.hoveringNow[KEY];
                    });
            });


            var mouse = d3.mouse(_this.graph.node()).map(function(d) {
                return parseInt(d);
            });

            var resolvedTime = _this.xScale.invert(mouse[0]-_this.margin.left);  
            if(_this.time - resolvedTime < 0) {
                resolvedTime = _this.time;
            }

            var pointer = {};
            var timeDim = _this.model.time.getDimension();
            pointer[KEY] = me[KEY];
            pointer[timeDim] = resolvedTime;
            var resolvedValue = _this.model.marker.axis_y.getValue(pointer);

            if(utils.isNaN(resolvedValue)) {
                return;
            }

            var scaledTime = _this.xScale(resolvedTime);
            var scaledValue = _this.yScale(resolvedValue);

            if(_this.ui.whenHovering.showTooltip){
                //position tooltip
                _this.tooltip
                    .style("right", (_this.width - scaledTime + _this.margin.left + _this.margin.right ) + "px")
                    .style("bottom", (_this.height - scaledValue + _this.margin.bottom) + "px")
                    .text(_this.yAxis.tickFormat()(resolvedValue))
                    .classed("vzb-hidden", false);
            }

            // bring the projection lines to the hovering point
            if(_this.ui.whenHovering.hideVerticalNow) {
                _this.verticalNow.style("opacity",0);  
            }

            if(_this.ui.whenHovering.showProjectionLineX){
                _this.projectionX
                    .style("opacity",1)
                    .attr("y2",scaledValue)
                    .attr("x1",scaledTime)
                    .attr("x2",scaledTime);
            }
            if(_this.ui.whenHovering.showProjectionLineY){
                _this.projectionY
                    .style("opacity",1)
                    .attr("y1",scaledValue)
                    .attr("y2",scaledValue)
                    .attr("x1",scaledTime);
            }

            if(_this.ui.whenHovering.higlightValueX) _this.xAxisEl.call(
                _this.xAxis.highlightValue(resolvedTime).highlightTransDuration(0)
            );

            if(_this.ui.whenHovering.higlightValueY) _this.yAxisEl.call(
                _this.yAxis.highlightValue(resolvedValue).highlightTransDuration(0)
            );

            clearTimeout(_this.unhoverTimeout);
                    
        },        
                
        entityMouseout: function(me, index, context){
            var _this = context;
            
            // hide and show things like it was before hovering
            _this.unhoverTimeout = setTimeout(function(){
                _this.tooltip.classed("vzb-hidden", true);
                _this.verticalNow.style("opacity",1);
                _this.projectionX.style("opacity",0);
                _this.projectionY.style("opacity",0);
                _this.xAxisEl.call(_this.xAxis.highlightValue(_this.time));
                _this.yAxisEl.call(_this.yAxis.highlightValue("none"));

                _this.graph.selectAll(".vzb-lc-entity").each(function(){
                    d3.select(this).classed("vzb-dimmed", false).classed("vzb-hovered", false);
                });

                _this.hoveringNow = null;                       
            }, 300);

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
//            this.data = this.model.marker.label.getItems({ time: this.time });
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

(function() {

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
        init: function(config, options) {

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
        },

        /**
         * Validating the tool model
         */
        validate: function(model) {
            
            model = this.model || model;

            var time = model.state.time;
            var marker = model.state.marker.label;

            //don't validate anything if data hasn't been loaded
            if (!marker.getItems() || marker.getItems().length < 1) return;

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
/*!
 * VIZABI LINECHART DEFAULT OPTIONS
 */

(function() {
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
            path: "local_data/waffles/{{LANGUAGE}}/basic-indicators.csv"
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
            },
            buttons: []
        },

        //language properties
        language: {
            id: "en",
            strings: {
                en: {
                    "title": "Line Chart Title",
                    "buttons/find": "Find",
                    "buttons/expand": "Expand",
                    "buttons/colors": "Colors",
                    "buttons/size": "Size",
                    "buttons/more_options": "Options",
                    "indicator/lex": "Life expectancy",
                    "indicator/gdp_per_cap": "GDP per capita",
                    "indicator/pop": "Population",
                },
                pt: {
                    "title": "Título do Linulaula Chart",
                    "buttons/expand": "Expandir",
                    "buttons/find": "Encontre",
                    "buttons/colors": "Cores",
                    "buttons/size": "Tamanho",
                    "buttons/more_options": "Opções",
                    "indicator/lex": "Expectables Livappulo",
                    "indicator/gdp_per_cap": "PIB pers capitous",
                    "indicator/pop": "Peoples",
                }
            }
        }
    });

}).call(this);
(function () {
  'use strict';
  var root = this;
  //warn client if d3 is not defined
  if (!Vizabi._require('d3')) {
    return;
  }
  d3.svg.axisSmart = function () {
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
        if (highlightValue != null) {
          axis.highlightValueRun(g);
          return;
        }
        // measure the width and height of one digit
        var widthSampleG = g.append('g').attr('class', 'tick widthSampling');
        var widthSampleT = widthSampleG.append('text').text('0');
        options.cssMarginTop = widthSampleT.style('margin-top');
        options.cssMarginBottom = widthSampleT.style('margin-bottom');
        options.cssMarginLeft = widthSampleT.style('margin-left');
        options.cssMarginRight = widthSampleT.style('margin-right');
        options.widthOfOneDigit = widthSampleT[0][0].getBBox().width;
        options.heightOfOneDigit = widthSampleT[0][0].getBBox().height;
        widthSampleG.remove();
        // run label factory - it will store labels in tickValues property of axis
        axis.labelFactory(options);
        //if(axis.orient()=="bottom") console.log("ordered", axis.tickValues())
        // construct the view (d3 constructor is used)
        if (options.transitionDuration > 0) {
          _super(g.transition().duration(options.transitionDuration));
        } else {
          _super(g);
        }
        //if(axis.orient()=="bottom") console.log("received", g.selectAll("text").each(function(d){console.log(d)}))
        var orient = axis.orient() == 'top' || axis.orient() == 'bottom' ? HORIZONTAL : VERTICAL;
        var dimension = orient == HORIZONTAL && axis.pivot() || orient == VERTICAL && !axis.pivot() ? Y : X;
        g.selectAll('.vzb-axis-value').data([null]).enter().append('g').attr('class', 'vzb-axis-value').append('text').style('opacity', 0);
        // patch the label positioning after the view is generated
        g.selectAll('text').each(function (d, i) {
          var view = d3.select(this);
          if (axis.pivot() == null)
            return;
          view.attr('transform', 'rotate(' + (axis.pivot() ? -90 : 0) + ')');
          view.style('text-anchor', dimension == X ? 'middle' : 'end');
          view.attr('x', dimension == X ? 0 : -axis.tickPadding() - axis.tickSize());
          view.attr('y', dimension == X ? (orient == VERTICAL ? -1 : 1) * (axis.tickPadding() + axis.tickSize()) : 0);
          view.attr('dy', dimension == X ? orient == VERTICAL ? 0 : '.72em' : '.32em');
          if (axis.repositionLabels() == null)
            return;
          var shift = axis.repositionLabels()[i] || {
            x: 0,
            y: 0
          };
          view.attr('x', +view.attr('x') + shift.x);
          view.attr('y', +view.attr('y') + shift.y);
        });
        if (axis.tickValuesMinor() == null)
          axis.tickValuesMinor([]);
        // add minor ticks
        var minorTicks = g.selectAll('.tickMinor').data(tickValuesMinor);
        minorTicks.exit().remove();
        minorTicks.enter().append('line').attr('class', 'tickMinor');
        var tickLengthOut = axis.tickSizeMinor().outbound;
        var tickLengthIn = axis.tickSizeMinor().inbound;
        var scale = axis.scale();
        minorTicks.attr('y1', orient == HORIZONTAL ? (axis.orient() == 'top' ? 1 : -1) * tickLengthIn : scale).attr('y2', orient == HORIZONTAL ? (axis.orient() == 'top' ? -1 : 1) * tickLengthOut : scale).attr('x1', orient == VERTICAL ? (axis.orient() == 'right' ? -1 : 1) * tickLengthIn : scale).attr('x2', orient == VERTICAL ? (axis.orient() == 'right' ? 1 : -1) * tickLengthOut : scale);
      }
      axis.highlightValueRun = function (g) {
        var orient = axis.orient() == 'top' || axis.orient() == 'bottom' ? HORIZONTAL : VERTICAL;
        g.selectAll('.tick').each(function (d, t) {
          d3.select(this).select('text').transition().duration(highlightTransDuration).ease('linear').style('opacity', highlightValue == 'none' ? 1 : Math.min(1, Math.pow(Math.abs(axis.scale()(d) - axis.scale()(highlightValue)) / (axis.scale().range()[1] - axis.scale().range()[0]) * 5, 2)));
        });
        g.select('.vzb-axis-value').transition().duration(highlightTransDuration).ease('linear').attr('transform', highlightValue == 'none' ? 'translate(0,0)' : 'translate(' + (orient == HORIZONTAL ? axis.scale()(highlightValue) : 0) + ',' + (orient == VERTICAL ? axis.scale()(highlightValue) : 0) + ')');
        g.select('.vzb-axis-value').select('text').text(axis.tickFormat()(highlightValue == 'none' ? 0 : highlightValue)).style('opacity', highlightValue == 'none' ? 0 : 1);
        highlightValue = null;
      };
      var highlightValue = null;
      axis.highlightValue = function (arg) {
        if (!arguments.length)
          return highlightValue;
        highlightValue = arg;
        return axis;
      };
      var highlightTransDuration = 0;
      axis.highlightTransDuration = function (arg) {
        if (!arguments.length)
          return highlightTransDuration;
        highlightTransDuration = arg;
        return axis;
      };
      var repositionLabels = null;
      axis.repositionLabels = function (arg) {
        if (!arguments.length)
          return repositionLabels;
        repositionLabels = arg;
        return axis;
      };
      var pivot = false;
      axis.pivot = function (arg) {
        if (!arguments.length)
          return pivot;
        pivot = !!arg;
        return axis;
      };
      var tickValuesMinor = [];
      axis.tickValuesMinor = function (arg) {
        if (!arguments.length)
          return tickValuesMinor;
        tickValuesMinor = arg;
        return axis;
      };
      var tickSizeMinor = {
        outbound: 0,
        inbound: 0
      };
      axis.tickSizeMinor = function (arg1, arg2) {
        if (!arguments.length)
          return tickSizeMinor;
        tickSizeMinor = {
          outbound: arg1,
          inbound: arg2 || 0
        };
        meow('setting', tickSizeMinor);
        return axis;
      };
      var options = {};
      axis.labelerOptions = function (arg) {
        if (!arguments.length)
          return options;
        options = arg;
        return axis;
      };
      axis.labelFactory = function (options) {
        this.METHOD_REPEATING = 'repeating specified powers';
        this.METHOD_DOUBLING = 'doubling the value';
        if (options == null)
          options = {};
        if (options.scaleType != 'linear' && options.scaleType != 'time' && options.scaleType != 'genericLog' && options.scaleType != 'log' && options.scaleType != 'ordinal') {
          return axis.ticks(ticksNumber).tickFormat(null).tickValues(null).tickValuesMinor(null).pivot(null).repositionLabels(null);
        }
        if (options.scaleType == 'ordinal')
          return axis.tickValues(null);
        if (options.logBase == null)
          options.logBase = DEFAULT_LOGBASE;
        if (options.baseValues == null)
          options.stops = [
            1,
            2,
            5,
            3,
            7,
            4,
            6,
            8,
            9
          ];
        if (options.removeAllLabels == null)
          options.removeAllLabels = false;
        if (options.formatterRemovePrefix == null)
          options.formatterRemovePrefix = false;
        if (options.formatter == null)
          options.formatter = function (d) {
            if (options.scaleType == 'time') {
              if (!(d instanceof Date))
                d = new Date(d);
              return d3.time.format('%Y')(d);
            }
            var format = 'f';
            var prec = 0;
            if (Math.abs(d) < 1) {
              prec = 1;
              format = 'r';
            }
            var prefix = '';
            if (options.formatterRemovePrefix)
              return d3.format('.' + prec + format)(d);
            switch (Math.floor(Math.log10(Math.abs(d)))) {
            case -13:
              d = d * 1000000000000;
              prefix = 'p';
              break;
            //0.1p
            case -10:
              d = d * 1000000000;
              prefix = 'n';
              break;
            //0.1n
            case -7:
              d = d * 1000000;
              prefix = '\xB5';
              break;
            //0.1µ
            case -6:
              d = d * 1000000;
              prefix = '\xB5';
              break;
            //1µ
            case -5:
              d = d * 1000000;
              prefix = '\xB5';
              break;
            //10µ
            case -4:
              break;
            //0.0001
            case -3:
              break;
            //0.001
            case -2:
              break;
            //0.01
            case -1:
              break;
            //0.1
            case 0:
              break;
            //1
            case 1:
              break;
            //10
            case 2:
              break;
            //100
            case 3:
              break;
            //1000
            case 4:
              break;
            //10000
            case 5:
              d = d / 1000;
              prefix = 'k';
              break;
            //0.1M
            case 6:
              d = d / 1000000;
              prefix = 'M';
              prec = 1;
              break;
            //1M
            case 7:
              d = d / 1000000;
              prefix = 'M';
              break;
            //10M
            case 8:
              d = d / 1000000;
              prefix = 'M';
              break;
            //100M
            case 9:
              d = d / 1000000000;
              prefix = 'B';
              prec = 1;
              break;
            //1B
            case 10:
              d = d / 1000000000;
              prefix = 'B';
              break;
            //10B
            case 11:
              d = d / 1000000000;
              prefix = 'B';
              break;
            //100B
            case 12:
              d = d / 1000000000000;
              prefix = 'T';
              prec = 1;
              break;
            //1T
            //use the D3 SI formatting for the extreme cases
            default:
              return d3.format('.' + prec + 's')(d).replace('G', 'B');
            }
            // use manual formatting for the cases above
            return (d3.format('.' + prec + format)(d) + prefix).replace('G', 'B');
          };
        options.cssLabelMarginLimit = 5;
        //px
        if (options.cssMarginLeft == null || parseInt(options.cssMarginLeft) < options.cssLabelMarginLimit)
          options.cssMarginLeft = options.cssLabelMarginLimit + 'px';
        if (options.cssMarginRight == null || parseInt(options.cssMarginRight) < options.cssLabelMarginLimit)
          options.cssMarginRight = options.cssLabelMarginLimit + 'px';
        if (options.cssMarginTop == null || parseInt(options.cssMarginTop) < options.cssLabelMarginLimit)
          options.cssMarginTop = options.cssLabelMarginLimit + 'px';
        if (options.cssMarginBottom == null || parseInt(options.cssMarginBottom) < options.cssLabelMarginLimit)
          options.cssMarginBottom = options.cssLabelMarginLimit + 'px';
        if (options.toolMargin == null)
          options.toolMargin = {
            left: 30,
            bottom: 30,
            right: 30,
            top: 30
          };
        if (options.pivotingLimit == null)
          options.pivotingLimit = options.toolMargin[this.orient()];
        if (options.showOuter == null)
          options.showOuter = false;
        if (options.limitMaxTickNumber == null)
          options.limitMaxTickNumber = 0;
        //0 is unlimited
        var orient = this.orient() == 'top' || this.orient() == 'bottom' ? HORIZONTAL : VERTICAL;
        if (options.isPivotAuto == null)
          options.isPivotAuto = orient == VERTICAL;
        if (options.cssFontSize == null)
          options.cssFontSize = '13px';
        if (options.widthToFontsizeRatio == null)
          options.widthToFontsizeRatio = 0.75;
        if (options.heightToFontsizeRatio == null)
          options.heightToFontsizeRatio = 1.2;
        if (options.widthOfOneDigit == null)
          options.widthOfOneDigit = parseInt(options.cssFontSize) * options.widthToFontsizeRatio;
        if (options.heightOfOneDigit == null)
          options.heightOfOneDigit = parseInt(options.cssFontSize) * options.heightToFontsizeRatio;
        meow('********** ' + orient + ' **********');
        var domain = axis.scale().domain();
        var range = axis.scale().range();
        var lengthDomain = Math.abs(domain[domain.length - 1] - domain[0]);
        var lengthRange = Math.abs(range[range.length - 1] - range[0]);
        var min = d3.min([
          domain[0],
          domain[domain.length - 1]
        ]);
        var max = d3.max([
          domain[0],
          domain[domain.length - 1]
        ]);
        var bothSidesUsed = min < 0 && max > 0 && options.scaleType != 'time';
        if (bothSidesUsed && options.scaleType == 'log')
          console.error('It looks like your ' + orient + ' log scale domain is crossing ZERO. Classic log scale can only be one-sided. If need crossing zero try using genericLog scale instead');
        var tickValues = options.showOuter ? [
          min,
          max
        ] : [];
        var tickValuesMinor = [];
        //[min, max];
        var ticksNumber = 5;
        function getBaseLog(x, base) {
          if (base == null)
            base = options.logBase;
          return Math.log(x) / Math.log(base);
        }
        // estimate the longest formatted label in pixels
        var estLongestLabelLength = //take 17 sample values and measure the longest formatted label
        d3.max(d3.range(min, max, (max - min) / 17).concat(max).map(function (d) {
          return options.formatter(d).length;
        })) * options.widthOfOneDigit + parseInt(options.cssMarginLeft);
        var pivot = options.isPivotAuto && (estLongestLabelLength + axis.tickPadding() + axis.tickSize() > options.pivotingLimit && orient == VERTICAL || !(estLongestLabelLength + axis.tickPadding() + axis.tickSize() > options.pivotingLimit) && !(orient == VERTICAL));
        var labelsStackOnTop = orient == HORIZONTAL && pivot || orient == VERTICAL && !pivot;
        // conditions to remove labels altogether
        var labelsJustDontFit = !labelsStackOnTop && options.heightOfOneDigit > options.pivotingLimit;
        if (options.removeAllLabels)
          return axis.tickValues([]);
        // return a single tick if have only one point in the domain
        if (min == max)
          return axis.tickValues([min]).ticks(1).tickFormat(options.formatter);
        // LABELS FIT INTO SCALE
        // measure if all labels in array tickValues can fit into the allotted lengthRange
        // approximationStyle can be OPTIMISTIC or PESSIMISTIC
        // in optimistic style the length of every label is added up and then we check if the total pack of symbols fit
        // in pessimistic style we assume all labels have the length of the longest label from tickValues
        // returns TRUE if labels fit and FALSE otherwise
        var labelsFitIntoScale = function (tickValues, lengthRange, approximationStyle, rescalingLabels) {
          if (tickValues == null || tickValues.length <= 1)
            return true;
          if (approximationStyle == null)
            approximationStyle = PESSIMISTIC;
          if (rescalingLabels == null)
            scaleType = 'none';
          if (labelsStackOnTop) {
            //labels stack on top of each other. digit height matters
            return lengthRange > tickValues.length * (options.heightOfOneDigit + parseInt(options.cssMarginTop) + parseInt(options.cssMarginBottom));
          } else {
            //labels stack side by side. label width matters
            var marginsLR = parseInt(options.cssMarginLeft) + parseInt(options.cssMarginRight);
            var maxLength = d3.max(tickValues.map(function (d) {
              return options.formatter(d).length;
            }));
            // log scales need to rescale labels, so that 9 takes more space than 2
            if (rescalingLabels == 'log') {
              // sometimes only a fragment of axis is used. in this case we want to limit the scope to that fragment
              // yes, this is hacky and experimental 
              lengthRange = Math.abs(axis.scale()(d3.max(tickValues)) - axis.scale()(d3.min(tickValues)));
              return lengthRange > d3.sum(tickValues.map(function (d) {
                return (options.widthOfOneDigit * (approximationStyle == PESSIMISTIC ? maxLength : options.formatter(d).length) + marginsLR) * (1 + Math.log10((d + '').substr(0, 1)));
              }));
            } else {
              return lengthRange > tickValues.length * marginsLR + (approximationStyle == PESSIMISTIC ? options.widthOfOneDigit * tickValues.length * maxLength : 0) + (approximationStyle == OPTIMISTIC ? options.widthOfOneDigit * tickValues.map(function (d) {
                return options.formatter(d);
              }).join('').length : 0);
            }
          }
        };
        // COLLISION BETWEEN
        // Check is there is a collision between labels ONE and TWO
        // ONE is a value, TWO can be a value or an array
        // returns TRUE if collision takes place and FALSE otherwise
        var collisionBetween = function (one, two) {
          if (two == null || two.length == 0)
            return false;
          if (!(two instanceof Array))
            two = [two];
          for (var i = 0; i < two.length; i++) {
            if (one != two[i] && one != 0 && Math.abs(axis.scale()(one) - axis.scale()(two[i])) < (labelsStackOnTop ? options.heightOfOneDigit : (options.formatter(one).length + options.formatter(two[i]).length) * options.widthOfOneDigit / 2))
              return true;
          }
          return false;
        };
        if (options.scaleType == 'genericLog' || options.scaleType == 'log') {
          var eps = axis.scale().eps ? axis.scale().eps() : 0;
          var spawnZero = bothSidesUsed ? [0] : [];
          // check if spawn positive is needed. if yes then spawn!
          var spawnPos = max < eps ? [] : d3.range(Math.floor(getBaseLog(Math.max(eps, min))), Math.ceil(getBaseLog(max)), 1).concat(Math.ceil(getBaseLog(max))).map(function (d) {
            return Math.pow(options.logBase, d);
          });
          // check if spawn negative is needed. if yes then spawn!
          var spawnNeg = min > -eps ? [] : d3.range(Math.floor(getBaseLog(Math.max(eps, -max))), Math.ceil(getBaseLog(-min)), 1).concat(Math.ceil(getBaseLog(-min))).map(function (d) {
            return -Math.pow(options.logBase, d);
          });
          // automatic chosing of method if it's not explicitly defined
          if (options.method == null) {
            var coverage = bothSidesUsed ? Math.max(Math.abs(max), Math.abs(min)) / eps : Math.max(Math.abs(max), Math.abs(min)) / Math.min(Math.abs(max), Math.abs(min));
            options.method = 10 <= coverage && coverage <= 1024 ? this.METHOD_DOUBLING : this.METHOD_REPEATING;
          }
          ;
          //meow('spawn pos/neg: ', spawnPos, spawnNeg);
          if (options.method == this.METHOD_DOUBLING) {
            var doublingLabels = [];
            if (bothSidesUsed)
              tickValues.push(0);
            var avoidCollidingWith = [].concat(tickValues);
            // start with the smallest abs number on the scale, rounded to nearest nice power
            //var startPos = max<eps? null : Math.pow(options.logBase, Math.floor(getBaseLog(Math.max(eps,min))));
            //var startNeg = min>-eps? null : -Math.pow(options.logBase, Math.floor(getBaseLog(Math.max(eps,-max))));
            var startPos = max < eps ? null : 4 * spawnPos[Math.floor(spawnPos.length / 2) - 1];
            var startNeg = min > -eps ? null : 4 * spawnNeg[Math.floor(spawnNeg.length / 2) - 1];
            //meow('starter pos/neg: ', startPos, startNeg);
            if (startPos) {
              for (var l = startPos; l <= max; l *= 2)
                doublingLabels.push(l);
            }
            if (startPos) {
              for (var l = startPos / 2; l >= Math.max(min, eps); l /= 2)
                doublingLabels.push(l);
            }
            if (startNeg) {
              for (var l = startNeg; l >= min; l *= 2)
                doublingLabels.push(l);
            }
            if (startNeg) {
              for (var l = startNeg / 2; l <= Math.min(max, -eps); l /= 2)
                doublingLabels.push(l);
            }
            doublingLabels = doublingLabels.sort(d3.ascending).filter(function (d) {
              return min <= d && d <= max;
            });
            tickValuesMinor = tickValuesMinor.concat(doublingLabels);
            doublingLabels = groupByPriorities(doublingLabels, false);
            // don't skip taken values
            var tickValues_1 = tickValues;
            for (var j = 0; j < doublingLabels.length; j++) {
              // compose an attempt to add more axis labels    
              var trytofit = tickValues_1.concat(doublingLabels[j]).filter(function (d) {
                return !collisionBetween(d, avoidCollidingWith);
              }).filter(onlyUnique);
              // stop populating if labels don't fit 
              if (!labelsFitIntoScale(trytofit, lengthRange, PESSIMISTIC, 'none'))
                break;
              // apply changes if no blocking instructions
              tickValues = trytofit;
            }
          }
          if (options.method == this.METHOD_REPEATING) {
            var spawn = spawnZero.concat(spawnPos).concat(spawnNeg).sort(d3.ascending);
            options.stops.forEach(function (stop, i) {
              tickValuesMinor = tickValuesMinor.concat(spawn.map(function (d) {
                return d * stop;
              }));
            });
            spawn = groupByPriorities(spawn);
            var avoidCollidingWith = spawnZero.concat(tickValues);
            var stopTrying = false;
            options.stops.forEach(function (stop, i) {
              if (i == 0) {
                for (var j = 0; j < spawn.length; j++) {
                  // compose an attempt to add more axis labels    
                  var trytofit = tickValues.concat(spawn[j].map(function (d) {
                    return d * stop;
                  }))  // throw away labels that collide with "special" labels 0, min, max
.filter(function (d) {
                    return !collisionBetween(d, avoidCollidingWith);
                  }).filter(function (d) {
                    return min <= d && d <= max;
                  }).filter(onlyUnique);
                  // stop populating if labels don't fit 
                  if (!labelsFitIntoScale(trytofit, lengthRange, OPTIMISTIC, 'none'))
                    break;
                  // apply changes if no blocking instructions
                  tickValues = trytofit;
                }
                //flatten the spawn array
                spawn = [].concat.apply([], spawn);
              } else {
                if (stopTrying)
                  return;
                // compose an attempt to add more axis labels
                var trytofit = tickValues.concat(spawn.map(function (d) {
                  return d * stop;
                })).filter(function (d) {
                  return min <= d && d <= max;
                }).filter(onlyUnique);
                // stop populating if the new composition doesn't fit
                if (!labelsFitIntoScale(trytofit, lengthRange, PESSIMISTIC, 'log')) {
                  stopTrying = true;
                  return;
                }
                // stop populating if the number of labels is limited in options
                if (tickValues.length > options.limitMaxTickNumber && options.limitMaxTickNumber != 0) {
                  stopTrying = true;
                  return;
                }
                // apply changes if no blocking instructions
                tickValues = trytofit;
              }
            });
          }  //method
        }
        //logarithmic
        if (options.scaleType == 'linear' || options.scaleType == 'time') {
          if (bothSidesUsed)
            tickValues.push(0);
          var avoidCollidingWith = [].concat(tickValues);
          ticksNumber = Math.max(Math.floor(lengthRange / estLongestLabelLength), 2);
          // limit maximum ticks number
          if (options.limitMaxTickNumber != 0 && ticksNumber > options.limitMaxTickNumber)
            ticksNumber = options.limitMaxTickNumber;
          var addLabels = axis.scale().ticks.apply(axis.scale(), [ticksNumber]).sort(d3.ascending).filter(function (d) {
            return min <= d && d <= max;
          });
          tickValuesMinor = tickValuesMinor.concat(addLabels);
          addLabels = groupByPriorities(addLabels, false);
          var tickValues_1 = tickValues;
          for (var j = 0; j < addLabels.length; j++) {
            // compose an attempt to add more axis labels    
            var trytofit = tickValues_1.concat(addLabels[j]).filter(function (d) {
              return !collisionBetween(d, avoidCollidingWith);
            }).filter(onlyUnique);
            // stop populating if labels don't fit 
            if (!labelsFitIntoScale(trytofit, lengthRange, PESSIMISTIC, 'none'))
              break;
            // apply changes if no blocking instructions
            tickValues = trytofit;
          }
          tickValues = tickValues  //.concat(addLabels)
.filter(function (d) {
            return !collisionBetween(d, avoidCollidingWith);
          }).filter(onlyUnique);
        }
        if (tickValues != null && tickValues.length <= 2 && !bothSidesUsed)
          tickValues = [
            min,
            max
          ];
        if (tickValues != null && tickValues.length <= 3 && bothSidesUsed) {
          if (!collisionBetween(0, [
              min,
              max
            ])) {
            tickValues = [
              min,
              0,
              max
            ];
          } else {
            tickValues = [
              min,
              max
            ];
          }
        }
        if (tickValues != null)
          tickValues.sort(function (a, b) {
            return (orient == HORIZONTAL ? -1 : 1) * (axis.scale()(b) - axis.scale()(a));
          });
        if (labelsJustDontFit)
          tickValues = [];
        tickValuesMinor = tickValuesMinor.filter(function (d) {
          return tickValues.indexOf(d) == -1 && min <= d && d <= max;
        });
        meow('final result', tickValues);
        return axis.ticks(ticksNumber).tickFormat(options.formatter).tickValues(tickValues).tickValuesMinor(tickValuesMinor).pivot(pivot).repositionLabels(repositionLabelsThatStickOut(tickValues, options, orient, axis.scale(), labelsStackOnTop ? 'y' : 'x'));
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
      function groupByPriorities(array, removeDuplicates) {
        if (removeDuplicates == null)
          removeDuplicates = true;
        var result = [];
        var taken = [];
        //zero is an exception, if it's present we manually take it to the front
        if (array.indexOf(0) != -1) {
          result.push([0]);
          taken.push(array.indexOf(0));
        }
        for (var k = array.length; k >= 1; k = k < 4 ? k - 1 : k / 2) {
          // push the next group of elements to the result
          result.push(array.filter(function (d, i) {
            if (i % Math.floor(k) == 0 && (taken.indexOf(i) == -1 || !removeDuplicates)) {
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
      function repositionLabelsThatStickOut(tickValues, options, orient, scale, dimension) {
        if (tickValues == null)
          return null;
        // make an abstraction layer for margin sizes
        // tail means left or bottom, head means top or right
        var margin = orient == VERTICAL ? {
          head: options.toolMargin.top,
          tail: options.toolMargin.bottom
        } : {
          head: options.toolMargin.right,
          tail: options.toolMargin.left
        };
        var result = {};
        // STEP 1:
        // for outer labels: avoid sticking out from the tool margin
        tickValues.forEach(function (d, i) {
          if (i != 0 && i != tickValues.length - 1)
            return;
          // compute the influence of the axis head
          var repositionHead = margin.head + (orient == HORIZONTAL ? 1 : 0) * d3.max(scale.range()) - (orient == HORIZONTAL ? 0 : 1) * d3.min(scale.range()) + (orient == HORIZONTAL ? -1 : 1) * scale(d) - (dimension == 'x') * options.formatter(d).length * options.widthOfOneDigit / 2 - (dimension == 'y') * options.heightOfOneDigit / 2;
          // we may consider or not the label margins to give them a bit of spacing from the edges
          //- (dimension=="x") * parseInt(options.cssMarginRight);
          //- (dimension=="y") * parseInt(options.cssMarginTop);
          // compute the influence of the axis tail
          var repositionTail = Math.min(margin.tail, options.widthOfOneDigit) + (orient == VERTICAL ? 1 : 0) * d3.max(scale.range()) - (orient == VERTICAL ? 0 : 1) * d3.min(scale.range()) + (orient == VERTICAL ? -1 : 1) * scale(d) - (dimension == 'x') * options.formatter(d).length * options.widthOfOneDigit / 2 - (dimension == 'y') * options.heightOfOneDigit / 2;
          // we may consider or not the label margins to give them a bit of spacing from the edges
          //- (dimension=="x") * parseInt(options.cssMarginLeft);
          //- (dimension=="y") * parseInt(options.cssMarginBottom);
          // apply limits in order to cancel repositioning of labels that are good
          if (repositionHead > 0)
            repositionHead = 0;
          if (repositionTail > 0)
            repositionTail = 0;
          // add them up with appropriate signs, save to the axis
          result[i] = {
            x: 0,
            y: 0
          };
          result[i][dimension] = (dimension == 'y' && orient == VERTICAL ? -1 : 1) * (repositionHead - repositionTail);
        });
        // STEP 2:
        // for inner labels: avoid collision with outer labels
        tickValues.forEach(function (d, i) {
          if (i == 0 || i == tickValues.length - 1)
            return;
          // compute the influence of the head-side outer label
          var repositionHead = // take the distance between head and the tick at hand
          Math.abs(scale(d) - scale(tickValues[tickValues.length - 1]))  // substract the shift of the tail
- (dimension == 'y' && orient == HORIZONTAL ? -1 : 1) * result[tickValues.length - 1][dimension] - (dimension == 'x') * options.widthOfOneDigit / 2 * options.formatter(d).length - (dimension == 'x') * options.widthOfOneDigit / 2 * options.formatter(tickValues[tickValues.length - 1]).length - (dimension == 'y') * options.heightOfOneDigit * 0.7;
          //TODO remove magic constant - relation of actual font height to BBox-measured height
          // compute the influence of the tail-side outer label
          var repositionTail = // take the distance between tail and the tick at hand
          Math.abs(scale(d) - scale(tickValues[0]))  // substract the shift of the tail
- (dimension == 'y' && orient == VERTICAL ? -1 : 1) * result[0][dimension] - (dimension == 'x') * options.widthOfOneDigit / 2 * options.formatter(d).length - (dimension == 'x') * options.widthOfOneDigit / 2 * options.formatter(tickValues[0]).length - (dimension == 'y') * options.heightOfOneDigit * 0.7;
          //TODO remove magic constant - relation of actual font height to BBox-measured height
          // apply limits in order to cancel repositioning of labels that are good
          if (repositionHead > 0)
            repositionHead = 0;
          if (repositionTail > 0)
            repositionTail = 0;
          // add them up with appropriate signs, save to the axis
          result[i] = {
            x: 0,
            y: 0
          };
          result[i][dimension] = (dimension == 'y' && orient == VERTICAL ? -1 : 1) * (repositionHead - repositionTail);
        });
        return result;
      }
      // function repositionLabelsThatStickOut()
      axis.copy = function () {
        return d3_axis_smart(d3.svg.axis());
      };
      return d3.rebind(axis, _super, 'scale', 'orient', 'ticks', 'tickValues', 'tickFormat', 'tickSize', 'innerTickSize', 'outerTickSize', 'tickPadding', 'tickSubdivide');
      function meow(l1, l2, l3, l4, l5) {
        if (!axis.labelerOptions().isDevMode)
          return;
        if (l5 != null) {
          console.log(l1, l2, l3, l4, l5);
          return;
        }
        if (l4 != null) {
          console.log(l1, l2, l3, l4);
          return;
        }
        if (l3 != null) {
          console.log(l1, l2, l3);
          return;
        }
        if (l2 != null) {
          console.log(l1, l2);
          return;
        }
        if (l1 != null) {
          console.log(l1);
          return;
        }
      }
    }(d3.svg.axis());
  };  //d3.svg.axisSmart = function(){
}.call(this));
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
//# sourceMappingURL=vizabi.js.map