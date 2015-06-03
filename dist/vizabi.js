/* VIZABI - http://www.gapminder.org - 2015-06-03 */

/*!
 * VIZABI MAIN
 */

(function() {

    "use strict";

    var root = this;
    var previous = root.Vizabi;

    var Vizabi = function(tool, placeholder, options) {
        return startTool(tool, placeholder, options);
    };

    //stores reference to each tool on the page
    Vizabi._instances = {};

    function startTool(name, placeholder, options) {
        var tool = Vizabi.Tool.get(name);
        if (tool) {
            var t = new tool(placeholder, options);
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
    }

    /*
     * throws a warning if the required variable is not defined
     * returns false if the required variable is not defined
     * returns true if the required variable is defined
     * @param variable
     * @returns {Boolean}
     */
    Vizabi._require = function(variable) {
        if (typeof root[variable] === 'undefined') {
            Vizabi.utils.warn(variable + " is required and could not be found.");
            return false;
        }
        return true;
    }

    //if AMD define
    if (typeof define === 'function' && define.amd) {
        define(function() {
            return Vizabi;
        });
    } else if (typeof module === 'object' && module.exports) {
        module.exports = Vizabi;
    }

    root.Vizabi = Vizabi;

}).call(this);
/*!
 * VIZABI UTILS
 * Util functions
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;

    Vizabi.utils = {

        /*
         * returns unique id with optional prefix
         * @param {String} prefix
         * @returns {String} id
         */
        uniqueId: (function() {
            var id = 0;
            return function(p) {
                return (p) ? p + id++ : id++;
            };
        })(),

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
            return (arg instanceof Date);
        },

        /*
         * checks whether arg is a string
         * @param {Object} arg
         * @returns {Boolean}
         */
        isString: function(arg) {
            return (typeof arg === "string");
        },
        
        
        /*
         * checks whether arg is a NaN
         * @param {*} arg
         * @returns {Boolean}
         * from lodash: https://github.com/lodash/lodash/blob/master/lodash.js
         */
        isNaN: function(arg) {
            // A `NaN` primitive is the only number that is not equal to itself
            return this.isNumber(arg) && arg != +arg;
        },
        
        /*
         * checks whether arg is a number. NaN is a number too
         * @param {*} arg
         * @returns {Boolean}
         * from lodash: https://github.com/lodash/lodash/blob/master/lodash.js
         * dependencies are resolved and included here
         */
        isNumber: function(arg) {
            return typeof arg == 'number' 
                   || ((!!arg && typeof arg == 'object') 
                        && Object.prototype.toString.call(arg) == '[object Number]'
                      );
        },

        /*
         * checks whether obj is a plain object {}
         * @param {Object} obj
         * @returns {Boolean}
         */
        isPlainObject: function(obj) {
            return obj != null &&
                Object.prototype.toString.call(obj) === "[object Object]";
        },

        /*
         * loops through an object or array
         * @param {Object|Array} obj object or array
         * @param {Function} callback callback function
         * @param {Object} ctx context object
         */
        forEach: function(obj, callback, ctx) {
            if (!obj) return;
            var i;
            if (this.isArray(obj)) {
                for (i = 0; i < obj.length; i++) {
                    if (callback.apply(ctx, [obj[i], i]) === false) {
                        break;
                    }
                }
            } else {
                var keys = Object.keys(obj),
                    size = keys.length;
                for (i = 0; i < size; i++) {
                    if (callback.apply(ctx, [obj[keys[i]], keys[i]]) === false) {
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
        clone: function(src, arr) {
            if (this.isArray(src)) {
                return src.slice(0);
            }
            var clone = {};
            this.forEach(src, function(value, k) {
                if (arr && arr.indexOf(k) === -1) {
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
            if (idx !== -1) arr.splice(idx, 1);
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
                    return d
                };
            }
            for (var i = 0, l = arr.length; i < l; ++i) {
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
                    return d
                };
            }
            for (var i = 0, l = arr.length; i < l; ++i) {
                var key = func(arr[i]);
                if (u.hasOwnProperty(key)) {
                    a.splice(u[key], 1); //remove old item from array
                }
                a.push(arr[i]);
                u[key] = (a.length - 1);
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
                    found = i
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
            var index = -1,
                length = arr.length,
                resIndex = -1,
                result = [],
                keys = Object.keys(filter),
                s_keys = keys.length,
                i, f;

            while (++index < length) {
                var value = arr[index];
                var match = true;
                for (i = 0; i < s_keys; i++) {
                    f = keys[i];
                    if (!value.hasOwnProperty(f) || value[f] !== filter[f]) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    result[++resIndex] = value;
                }
            }
            return result;
        },

        /*
         * Converts radius to area, simple math
         * @param {Number} radius
         * @returns {Number} area
         */
        radiusToArea: function(r) {
            return r * r * Math.PI
        },

        /*
         * Converts area to radius, simple math
         * @param {Number} area
         * @returns {Number} radius
         */
        areaToRadius: function(a) {
            return Math.sqrt(a / Math.PI)
        },

        /*
         * Prints message to timestamp
         * @param {String} message
         */
        timeStamp: function(message) {
            if (root.console && typeof root.console.timeStamp === "function") {
                root.console.timeStamp(message);
            }
        },

        /*
         * Prints warning
         * @param {String} message
         */
        warn: function(message) {
            if (root.console && typeof root.console.warn === "function") {
                root.console.warn(message);
            }
        },

        /*
         * Prints message for group
         * @param {String} message
         */
        groupCollapsed: function(message) {
            if (root.console && typeof root.console.groupCollapsed === "function") {
                root.console.groupCollapsed(message);
            }
        },

        /*
         * Prints end of group
         * @param {String} message
         */
        groupEnd: function() {
            if (root.console && typeof root.console.groupEnd === "function") {
                root.console.groupEnd();
            }
        },

        /*
         * Prints error
         * @param {String} message
         */
        error: function(message) {
            if (root.console && typeof root.console.error === "function") {
                root.console.error(message);
            }
        },

        /*
         * Count the number of decimal numbers
         * @param {Number} number
         */
        countDecimals: function(number) {
            if (Math.floor(number.valueOf()) === number.valueOf()) return 0;
            return number.toString().split(".")[1].length || 0;
        },

        /*
         * Adds class to DOM element
         * @param {Element} el
         * @param {String} className 
         */
        addClass: function(el, className) {
            if (el.classList) {
                el.classList.add(className);
            } else { //IE<10
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
            } else { //IE<10
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
            } else { //IE<10
                return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
            }
        },

        /*
         * Throttles a function
         * @param {Function} func
         * @param {Number} ms duration 
         */
        throttle: (function() {
            var isThrottled = {};
            return function(func, ms) {
                if (isThrottled[func]) {
                    return
                };
                isThrottled[func] = true;
                setTimeout(function() {
                    isThrottled[func] = false;
                }, ms);
                func();
            }
        })(),

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
            var arr,
                keys = Object.keys(obj),
                size = keys.length;
            for (var i=0; i<size; i++) {
                (arr = arr || []).push(obj[keys[i]]);
            };
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
         * Performs an ajax request
         * @param {Object} options
         * @param {String} className 
         * @return {Boolean}
         */
        ajax: function(options) {
            var request = new XMLHttpRequest();
            request.open(options.method, options.url, true);
            if (options.method === "POST") {
                request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            }
            request.onload = function() {
                if (request.status >= 200 && request.status < 400) {
                    // Success!
                    var data = (options.json) ? JSON.parse(request.responseText) : request.responseText;
                    if (options.success) options.success(data);
                } else {
                    if (options.error) options.error();
                }
            };
            request.onerror = function() {
                if (options.error) options.error();
            };
            request.send(options.data);
        },

        /*
         * Performs a GET http request
         */
        get: function(url, pars, success, error, json) {
            var pars = [];
            this.forEach(pars, function(value, key) {
                pars.push(key + "=" + value);
            });
            url = (pars.length) ? url + "?" + pars.join("&") : url;
            this.ajax({
                method: "GET",
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
                method: "POST",
                url: url,
                success: success,
                error: error,
                json: json,
                data: pars
            });
        }


    };

}).call(this);
/*!
 * VIZABI PROMISES
 * Util functions
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;

    /*
     * Modified version of promises from
     * @Author: dm.yang
     * https://github.com/chemdemo/promiseA
     */

    ;
    (function(root, factory) {
        if (typeof module !== 'undefined' && module.exports) { // CommonJS
            module.exports = factory();
        } else if (typeof define === 'function' && define.amd) { // AMD / RequireJS
            define(factory);
        } else {
            root.Promise = factory.call(root);
        }
    }(Vizabi, function() {
        'use strict';

        function Promise(resolver) {
            if (!(this instanceof Promise)) return new Promise(resolver);

            this.status = 'pending';
            this.value;
            this.reason;

            // then may be called multiple times on the same promise
            this._resolves = [];
            this._rejects = [];

            if (isFn(resolver)) resolver(this.resolve.bind(this), this.reject.bind(this));

            return this;
        };

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
            if ('rejected' === this.status) throw Error('Illegal call.');

            this.status = 'resolved';
            this.value = value;

            this._resolves.length && fireQ(this);

            return this;
        };

        Promise.prototype.reject = function(reason) {
            if ('resolved' === this.status) throw Error('Illegal call. ' + reason);

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

            if (arg instanceof Promise) return resolvePromise(p, arg);
            else return Promise.resolve(arg);
        };

        // return a promise which resolved with arg
        // the arg maybe a thanable object or thanable function or other
        Promise.resolve = function(arg) {
            var p = Promise();

            if (isThenable(arg)) return resolveThen(p, arg);
            else return p.resolve(arg);
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
                    if (++pending === len && !locked) promise.resolve(r);
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
            if (!(reason instanceof Error)) throw Error('reason must be an instance of Error');

            var p = Promise();

            p.reject(reason);

            return p;
        };

        function resolveX(promise, x) {
            if (x === promise) promise.reject(new Error('TypeError'));

            if (x instanceof Promise) return resolvePromise(promise, x);
            else if (isThenable(x)) return resolveThen(promise, x);
            else return promise.resolve(x);
        };

        function resolvePromise(promise1, promise2) {
            var status = promise2.status;

            if ('pending' === status) {
                promise2.then(promise1.resolve.bind(promise1), promise1.reject.bind(promise1));
            }
            if ('resolved' === status) promise1.resolve(promise2.value);
            if ('rejected' === status) promise1.reject(promise2.reason);

            return promise;
        };

        function resolveThen(promise, thanable) {
            var called;
            var resolve = once(function(x) {
                if (called) return;
                resolveX(promise, x);
                called = true;
            });
            var reject = once(function(r) {
                if (called) return;
                promise.reject(r);
                called = true;
            });

            try {
                thanable.then.call(thanable, resolve, reject);
            } catch (e) {
                if (!called) throw e;
                else promise.reject(e);
            }

            return promise;
        };

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
        };

        function noop() {};

        function isFn(fn) {
            return 'function' === type(fn);
        };

        function isObj(o) {
            return 'object' === type(o);
        };

        function type(obj) {
            var o = {};
            return o.toString.call(obj).replace(/\[object (\w+)\]/, '$1').toLowerCase();
        };

        function isThenable(obj) {
            return obj && obj.then && isFn(obj.then);
        };

        function once(fn) {
            var called;
            var r;

            return function() {
                if (called) return r;
                called = true;
                return r = fn.apply(this, arguments);
            };
        };

        return Promise;
    }));

}).call(this);
/*!
 * VIZABI CLASS
 * Base class
 * Based on Simple JavaScript Inheritance by John Resig
 * Source http://ejohn.org/blog/simple-javascript-inheritance/
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var initializing = false;

    var fnTest = /xyz/.test(function() {
        xyz;
    }) ? /\b_super\b/ : /.*/;

    function extend(name, extensions) {
        //in case there are two args
        extensions = (arguments.length === 1) ? name : extensions;
        var _super = this.prototype;

        initializing = true;
        var prototype = new this();
        initializing = false;

        Vizabi.utils.forEach(extensions, function(method, name) {
            if (typeof extensions[name] == "function" && typeof _super[name] == "function" && fnTest.test(extensions[name])) {
                prototype[name] = (function(name, fn) {
                    return function() {
                        var tmp = this._super;
                        this._super = _super[name];
                        var ret = fn.apply(this, arguments);
                        this._super = tmp;
                        return ret;
                    };
                })(name, extensions[name]);
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
                Vizabi.utils.warn('"'+ name +'" is already registered. Overwriting...');
            }
            this._collection[name] = code;
        };
        Class.unregister = function(name) {
            delete this._collection[name];
        };
        Class.getCollection = function() {
            return this._collection;
        };
        Class.get = function(name, silent) {
            if (this._collection.hasOwnProperty(name)) {
                return this._collection[name];
            }
            if(!silent) {
                Vizabi.utils.warn('"'+ name +'" was not found.');
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

}).call(this);
/*!
 * VIZABI DATA
 * Manages data
 */

(function() {

    "use strict";
    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;
    var Promise = Vizabi.Promise;

    var Data = Vizabi.Class.extend({

        /**
         * Initializes the data manager.
         */
        init: function() {
            this._data = {};
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
            var wait = (new Promise).resolve();
            var cached = (query === true) ? true : this.isCached(query, language, reader);
            var loaded = false;

            //if result is cached, dont load anything
            if (!cached) {
                utils.timeStamp("Vizabi Data: Loading Data");

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

            wait.then(
                function() {
                    //pass the data forward
                    var data = _this.get(cached);
                    //not loading anymore
                    if (loaded && evts && typeof evts.load_end === 'function') {
                        evts.load_end();
                    }
                    promise.resolve(data);
                },
                function() {
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
            var queryId = idQuery(query, lang, reader);
            var readerClass = Vizabi.Reader.get(reader_name);
            
            var r = new readerClass(reader);
            
            r.read(query, lang).then(function() {
                    //success reading
                    var values = r.getData();
                    var q = query;

                    var query_region = (q.select.indexOf("geo.region") !== -1);

                    //make sure all queried is returned
                    values = values.map(function(d) {
                        for (var i = 0; i < q.select.length; i++) {
                            var col = q.select[i];
                            if (typeof d[col] === 'undefined') {
                                d[col] = null;
                            }
                        }
                        return d;
                    });

                    values = values.map(function(d) {
                        if (d.geo === null) d.geo = d["geo.name"];
                        if (query_region && d["geo.region"] === null) {
                            d["geo.region"] = d.geo;
                        }
                        return d;
                    });
                    // convert time to Date()
                    values = values.map(function(d) {
                        d.time = new Date(d.time);
                        d.time.setHours(0);
                        return d;
                    });
                    // sort records by time
                    values.sort(function(a, b) {
                        return a.time - b.time;
                    });

                    _this._data[queryId] = values;
                    promise.resolve(queryId);
                },
                //error reading
                function(err) {
                    promise.reject(err);
                });

            return promise;
        },

        /**
         * Gets all items
         * @param queryId query identifier
         * @returns {Array} items
         */
        get: function(queryId) {
            if (queryId) {
                return this._data[queryId];
            }
            return this._data;
        },

        /**
         * Checks whether it's already cached
         * @returns {Boolean}
         */
        isCached: function(query, language, reader) {
            //encode in one string
            var q = idQuery(query, language, reader);
            //simply check if we have this in internal data
            if (Object.keys(this._data).indexOf(q) !== -1) {
                return q;
            }
            return false;
        },

        /**
         * Clears all data and querying
         */
        clear: function() {
            this._data = {};
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
        },

        /**
         * Reads from source
         * @param {Array} queries Queries to be performed
         * @param {String} language language
         * @returns a promise that will be resolved when data is read
         */
        read: function(queries, language) {
            return new Promise.resolve(this._data);
        },

        /**
         * Gets the data
         * @returns all data
         */
        getData: function() {
            return this._data;
        }

    });

    /**
     * Encodes query into a string
     */
    function idQuery(query, language, reader) {
        return JSON.stringify(query) + language + JSON.stringify(reader);
    }
    Vizabi.Reader = Reader;
    Vizabi.Data = Data;

}).call(this);
/*!
 * VIZABI EVENTS
 * Manages Vizabi events
 */

(function() {

    "use strict";

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
                for (i = 0; i < func.length; i++) {
                    this.on(name, func[i]);
                }
                return;
            }
            //bind multiple at a time
            if (utils.isArray(name)) {
                for (i = 0; i < name.length; i++) {
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
                utils.warn("Can't bind event '" + name + "'. It must be a function.");
            }
        },

        /**
         * Unbinds all events associated with a name or a specific one
         * @param {String|Array} name name of event or array with names
         */
        unbind: function(name) {
            //unbind multiple at a time
            if (utils.isArray(name)) {
                for (var i = 0; i < name.length; i++) {
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
            var i, size;
            if (utils.isArray(name)) {
                for (i = 0, size = name.length; i < size; i++) {
                    this.trigger(name[i], args);
                }
            } else {
                if (!this._events.hasOwnProperty(name)) return;
                for (i = 0; i < this._events[name].length; i++) {
                    var f = this._events[name][i];
                    //if not in buffer, add and execute
                    var _this = this;
                    var execute = function() {
                        var msg = "Vizabi Event: " + name + " - " + original;
                        utils.timeStamp(msg);
                        f.apply(_this, [(original || name), args]);
                    };

                    //TODO: improve readability of freezer code
                    //only execute if not frozen and exception doesnt exist
                    if (this._freeze || _freezeAllEvents) {
                        //if exception exists for freezing, execute
                        if ((_freezeAllEvents && _freezeAllExceptions.hasOwnProperty(name)) || (!_freezeAllEvents && this._freeze && this._freezeExceptions.hasOwnProperty(name))) {
                            execute();
                        }
                        //otherwise, freeze it
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
            var i, size, n;
            for (i = 0, size = name.length; i < size; i++) {
                n = name[i];
                var original = n;
                var parts = n.split(":");
                while (parts.length) {
                    to_trigger.push([n, args, original]);
                    parts.pop();
                    n = parts.join(":");
                }
            }

            var once = utils.unique(to_trigger, function(d) {
                return d[0]; //name of the event
            });

            for (i = 0; i < once.length; i++) {
                this.trigger.apply(this, once[i]);
            }
        },
        /**
         * Prevents all events from being triggered, buffering them
         */
        freeze: function(exceptions) {
            this._freeze = true;
            if (!exceptions) return;
            if (!utils.isArray(exceptions)) exceptions = [exceptions];
            for (var i = 0; i < exceptions.length; i++) {
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
        if (!exceptions) return;
        if (!utils.isArray(exceptions)) exceptions = [exceptions];
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

}).call(this);
/*!
 * VIZABI INTERVALS
 * Manages Vizabi layout profiles and classes
 */

(function() {

    "use strict";

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
            return (name) ? clearInterval(this.intervals[name]) : this.clearAllIntervals();
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

}).call(this);

/*!
 * VIZABI LAYOUT
 * Manages Vizabi layout profiles and classes
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;

    //classes are vzb-portrait, vzb-landscape...
    var class_prefix = "vzb-";
    var class_portrait = "vzb-portrait";
    var class_lansdcape = "vzb-landscape";

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

            this._container = null; //dom element
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

            if (this._prev_size && this._prev_size.width === width && this._prev_size.height === height) return;

            utils.forEach(screen_sizes, function(range, size) {
                //remove class
                utils.removeClass(_this._container, class_prefix + size);
                //find best fit
                if (width >= range.min_width && width <= range.max_width) {
                    _this._curr_profile = size;
                }
            });

            //update size class
            utils.addClass(this._container, class_prefix+this._curr_profile);

            //toggle, untoggle classes based on orientation
             if(width < height) {
                utils.addClass(this._container, class_portrait);
                utils.removeClass(this._container, class_lansdcape);
            }
            else {
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

}).call(this);
/*!
 * VIZABI MODEL
 * Base Model
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var Promise = Vizabi.Promise;
    var utils = Vizabi.utils;
    
    var time_formats = {
        "year": d3.time.format("%Y"),
        "month": d3.time.format("%Y-%m"),
        "week": d3.time.format("%Y-W%W"),
        "day": d3.time.format("%Y-%m-%d"),
        "hour": d3.time.format("%Y-%m-%d %H"),
        "minute": d3.time.format("%Y-%m-%d %H:%M"),
        "second": d3.time.format("%Y-%m-%d %H:%M:%S")
    };

    //names of reserved hook properties

    //warn client if d3 is not defined
    Vizabi._require('d3');

    var Model = Vizabi.Events.extend({

        /**
         * Initializes the model.
         * @param {Object} values The initial values of this model
         * @param {Object} parent reference to parent
         * @param {Object} bind Initial events to bind
         * @param {Boolean} freeze block events from being dispatched
         */

        init: function(values, parent, bind, freeze) {
            this._type = this._type || "model";
            this._id = this._id || utils.uniqueId("m");
            this._data = {}; //holds attributes of this model
            this._parent = parent;
            this._set = false;
            this._ready = false;
            this._readyOnce = false; //has this model ever been ready?
            this._loadedOnce = false;
            this._loading = []; //array of processes that are loading
            this._intervals = getIntervals(this);
            //holds the list of dependencies for virtual models
            this._deps = {
                parent: [],
                children: []
            };

            //will the model be hooked to data?
            this._hooks = {};
            this._items = []; //holds hook items for this hook
            this._unique = {}; //stores unique values per column
            this._filtered = {}; //stores filtered values
            this._limits = {}; //stores limit values

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
            var setting = this._setting
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

            this._setting = true; //we are currently setting the model

            //compute each change
            for (var a in attrs) {
                var val = attrs[a];
                var curr = this._data[a];
                var prev = this._prevData[a];

                //if its a regular value
                if (!utils.isPlainObject(val) || utils.isArray(val)) {
                    //change if it's not the same value
                    if (curr !== val || force || JSON.stringify(curr) !== JSON.stringify(val)) {
                        var p = (typeof curr === 'undefined') ? 'init' : 'change';
                        events.push(p + ":" + a);
                    }
                    if (prev !== val || force || JSON.stringify(prev) !== JSON.stringify(val)) {
                        this._changedData[a] = val;
                    } else {
                        delete this._changedData[a];
                    }
                    this._data[a] = val;
                }
                //if it's an object, it's a submodel
                else {
                    if (curr && isModel(curr)) {
                        events.push('change:' + a);
                        this._data[a].set(val, force);
                    }
                    //submodel doesnt exist, create it
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
                    events.push("set");
                } else if (events.length) {
                    events.push("change");
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
        validate: function() {
            //placeholder for validate function
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
        isLoading: function(p_id) {

            if (this.isHook() && !this._loadedOnce) {
                return true;
            }
            if (p_id) {
                return (this._loading.indexOf(p_id) !== -1);
            }
            //if loading something
            else if (this._loading.length > 0) {
                return true;
            }
            //if not loading anything, check submodels
            else {
                var submodels = this.getSubmodels();
                var i;
                for (i = 0; i < submodels.length; i++) {
                    if (submodels[i].isLoading()) {
                        return true;
                        break;
                    }
                }
                for (i = 0; i < this._deps.children.length; i++) {
                    var d = this._deps.children[i];
                    if (d.isLoading() || !d._ready) {
                        return true;
                        break;
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
                this.trigger("load_start");
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
            this._ready = (!this.isLoading() && !this._setting && !this._loadCall);

            if (this._ready && prev_ready !== this._ready) {
                if (!this._readyOnce) {
                    this._readyOnce = true;
                    this.trigger("readyOnce");
                }
                this.trigger("ready");
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
            var promiseLoad = new Promise;
            var promises = [];

            //useful to check if in the middle of a load call
            this._loadCall = true;

            //load hook
            //if its not a hook, the promise will not be created
            if (this.isHook() && data_hook && query) {

                //hook changes, regardless of actual data loading 
                this.trigger('hook_change');

                //get reader omfp
                var reader = data_hook.getObject();
                var lang = (language_hook) ? language_hook.id : "en";
                var promise = new Promise;

                var evts = {
                    'load_start': function() {
                        _this.setLoading("_hook_data");
                        Vizabi.Events.freezeAll(['load_start', 'resize', 'dom_ready']);
                    },
                    'load_end': function() {
                        Vizabi.Events.unfreezeAll();
                        _this.setLoadingDone("_hook_data");
                    }
                };

                utils.timeStamp("Vizabi Model: Loading Data: " + _this._id);

                this._dataManager.load(query, lang, reader, evts)
                    .then(function(data) {
                            _this._items = data;

                            utils.timeStamp("Vizabi Model: Data loaded: " + _this._id);

                            _this._unique = {};
                            _this._filtered = {};
                            _this._limits = {};
                            _this.afterLoad();

                            promise.resolve();
                        },
                        function(err) {
                            _this.trigger("load_error", query);
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
            var wait = (promises.length) ? Promise.all(promises) : new Promise.resolve();

            wait.then(function() {

                if (_this.validate) {
                    _this.validate();
                }

                utils.timeStamp("Vizabi Model: Model loaded: " + _this._id);

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
        afterLoad: function() {
            //placeholder method
        },

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
            return (this.use) ? true : false;
        },

        /**
         * Hooks all hookable submodels to data
         */
        setHooks: function() {
            if (this.isHook()) {
                //what should this hook to?
                this.dimensions = getHookTo(this);
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
            this._dataManager = new Vizabi.Data();
            // assuming all models will need data and language support
            this._dataModel = getClosestModel(this, "data");
            this._languageModel = getClosestModel(this, "language");

            //check what we want to hook this model to
            utils.forEach(this.dimensions, function(name) {
                //hook with the closest prefix to this model
                _this._hooks[name] = getClosestModel(_this, name);
                //if hooks change, this should load again
                //TODO: remove hardcoded 'show"
                if (_this._hooks[name].show) {
                    _this._hooks[name].on("change:show", function(evt) {
                        _this.load();
                    });
                }
            });

            //this is a hook, therefore it needs to reload when data changes
            this.on("change", function() {
                _this.load();
            });

            //this is a hook, therefore it needs to reload when data changes
            this.on("hook_change", function() {
                _this.setReady(false);
            });

        },

        /**
         * gets a certain hook reference
         * @returns {Object} defined hook or undefined
         */
        getHook: function(hook) {
            return this._hooks[hook];
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
            return this.getHookValues("indicator");
        },

        /**
         * gets all sub values for indicators in this model
         * @returns {Array} all unique values of property hooks
         */
        getProperties: function() {
            return this.getHookValues("property");
        },

        /**
         * gets all hook dimensions
         * @returns {Array} all unique dimensions
         */
        getAllDimensions: function() {
            var dims = [],
                dim;
            utils.forEach(this._hooks, function(h) {
                if (dim = h.getDimension()) dims.push(dim);
            });
            return dims;
        },

        /**
         * gets all hook filters
         * @returns {Object} filters
         */
        getAllFilters: function() {
            var filters = {};
            utils.forEach(this._hooks, function(h) {
                filters = utils.extend(filters, h.getFilter());
            });
            return filters;
        },

        /**
         * gets the value specified by this hook
         * @param {Object} filter Reference to the row. e.g: {geo: "swe", time: "1999", ... }
         * @returns hooked value
         */

        getValue: function(filter) {
            //extract id from original filter
            var id = utils.clone(filter, this.getAllDimensions());
            return this.mapValue(this._getHookedValue(id));
        },

        /**
         * gets multiple values from the hook
         * @param {Object} filter Reference to the row. e.g: {geo: "swe", time: "1999", ... }
         * @returns an array of values
         */

        getValues: function(filter) {
            //extract id from original filter
            var id = utils.clone(filter, this.getAllDimensions());
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
         * gets the items associated with this hook with values
         * @param value Original value
         * @returns hooked value
         */
        getItems: function(filter) {
            if (this.isHook() && this._dataModel) {

                //all dimensions except time (continuous)
                var dimensions = utils.without(this.getAllDimensions(), "time");

                return this.getUnique(dimensions).map(function(item) {
                    // Forcefully write the time to item
                    // TODO: Clean this hack
                    if (filter && filter['time']) {
                        item['time'] = filter['time'];
                    }
                    return item;
                })

                return values;
            } else {
                return [];
            }
        },

        /**
         * Gets the dimension of this model if it has one
         * @returns {String|Boolean} dimension
         */
        getDimension: function() {
            return false; //defaults to no dimension
        },

        /**
         * Gets the filter for this model if it has one
         * @returns {Object} filters
         */
        getFilter: function() {
            return {}; //defaults to no filter
        },


        /**
         * gets query that this model/hook needs to get data
         * @returns {Array} query
         */
        getQuery: function() {
            //only perform query in these two uses
            var needs_query = ["property", "indicator"];
            //if it's not a hook, property or indicator, no query is necessary
            if (!this.isHook() || needs_query.indexOf(this.use) === -1) {
                return true;
            }
            //error if there's nothing to hook to
            else if (Object.keys(this._hooks).length < 1) {
                utils.error("Error:", this._id, "can't find any dimension");
                return true;
            }
            //else, its a hook (indicator or property) and it needs to query
            else {
                var dimensions = this.getAllDimensions(),
                    select = utils.unique(dimensions.concat([this.which])),
                    filters = this.getAllFilters();
                //return query
                return {
                    "from": "data",
                    "select": select,
                    "where": filters
                };
            }
        },

        
        
        /**
         * Gets tick values for this hook
         * @returns {Number|String} value The value for this tick
         */
        tickFormatter: function(x, formatterRemovePrefix) {
            
            //TODO: generalize for any time unit
            if(utils.isDate(x)) return time_formats["year"](x);
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
        getScale: function() {
            if (this.scale == null) this.buildScale();
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

            var domain,
                scaleType = this.scaleType || "linear";
            switch (this.use) {
                case "indicator":
                    var limits = this.getLimits(this.which);
                    domain = [limits.min, limits.max];
                    break;
                case "property":
                    domain = this.getUnique(this.which);
                    break;
                case "value":
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

            if (!attr) {
                attr = 'time'; //fallback in case no attr is provided
            }

            //store limits so that we stop rechecking.
            if (this._limits[attr]) {
                return this._limits[attr];
            }

            var filtered = this._items.map(function(d) {
                //TODO: Move this up to readers ?
                return (attr !== "time") ? parseFloat(d[attr]) : new Date(d[attr].toString());
            });

            var min, max, limits = {};
            for (var i = 0; i < filtered.length; i++) {
                var c = filtered[i];
                if (typeof min === 'undefined' || c < min) {
                    min = c;
                }
                if (typeof max === 'undefined' || c > max) {
                    max = c;
                }
            };
            limits.min = min || 0;
            limits.max = max || 0;

            this._limits[attr] = limits;
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

            if (!attr) attr = 'time'; //fallback in case no attr is provided

            //cache optimization
            var uniq_id = JSON.stringify(attr),
                uniq;
            if (this._unique[uniq_id]) {
                return this._unique[uniq_id];
            }

            //if not in cache, compute
            //if it's an array, it will return a list of unique combinations.
            if (utils.isArray(attr)) {
                var values = this._items.map(function(d) {
                    return utils.clone(d, attr); //pick attrs
                });
                //TODO: Move this up to readers ?
                if (attr.indexOf("time") !== -1) {
                    for (var i = 0; i < values.length; i++) {
                        values[i]['time'] = new Date(values[i]['time']);
                    };
                }
                uniq = utils.unique(values, function(n) {
                    return JSON.stringify(n);
                });
            }
            //if it's a string, it will return a list of values
            else {
                var values = this._items.map(function(d) {
                    //TODO: Move this up to readers ?
                    return (attr !== "time") ? d[attr] : new Date(d[attr]);
                });
                uniq = utils.unique(values);
            }
            this._unique[uniq_id] = uniq;
            return uniq;
        },

        /**
         * gets the value of the hook point
         * @param {Object} filter Id the row. e.g: {geo: "swe", time: "1999"}
         * @returns hooked value
         */
        _getHookedValue: function(filter) {

            if (!this.isHook()) {
                utils.warn("_getHookedValue method needs the model to be hooked to data.");
                return;
            }
            var value;
            if (this.use === "value") {
                value = this.which;
            } else if (this._hooks.hasOwnProperty(this.use)) {
                value = this.getHook(this.use)[this.which];
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
                utils.warn("_getHookedValue method needs the model to be hooked to data.");
                return;
            }

            var values;

            if (this.use === "value") {
                values = [this.which];
            } else if (this._hooks.hasOwnProperty(this.use)) {
                values = [this.getHook(this.use)[this.which]];
            } else {
                // if a specific time is requested -- return values up to this time
                if (filter && filter.hasOwnProperty('time')) {
                    // save time into variable
                    var time = new Date(filter.time);
                    // filter.time will be removed during interpolation
                    var lastValue = interpolateValue(this, filter, this.use, this.which);
                    // return values up to the requested time point, append an interpolated value as the last one
                    values = utils.filter(this._items, filter)
                        .filter(function(d) {
                            return d.time <= time
                        })
                        .map(function(d) {
                            return d[_this.which]
                        })
                        .concat(lastValue);
                } else {
                    // if time not requested -- return just all values
                    values = this._items.filter(filter)
                        .map(function(d) {
                            return d[_this.which]
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
            d3.nest()
                .key(function(d) {
                    return timeFormatter(d.time);
                })
                .entries(_this._items)
                .forEach(function(d) {
                    var values = d.values
                        .filter(function(f) {
                            return f[_this.which] != null
                        })
                        .map(function(m) {
                            return +m[_this.which]
                        });
                    result[d.key] = {
                        max: d3.max(values),
                        min: d3.min(values),
                        mean: d3.mean(values)
                    };
                })

            return result;
        },


        /**
         * gets filtered dataset with fewer keys
         */
        _getFilteredItems: function(filter) {
            var filterId = JSON.stringify(filter);
            //cache optimization
            var filter_id = JSON.stringify(filter);
            if (this._filtered[filter_id]) {
                return this._filtered[filter_id];
            }
            return this._filtered[filter_id] = utils.filter(this._items, filter);
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
        return model.hasOwnProperty("_data");
    }

    /**
     * Binds all attributes in _data to magic setters and getters
     */
    function bindSettersGetters(model) {
        for (var prop in model._data) {
            Object.defineProperty(model, prop, {
                configurable: true, //allow reconfiguration
                get: (function(p) {
                    return function() {
                        return model.get(p);
                    }
                })(prop),
                set: (function(p) {
                    return function(value) {
                        return model.set(p, value);
                    }
                })(prop)
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
        var name = attr.split("_")[0];
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
            var model = Vizabi.Model.get(name, true) || Model;
            return new model(val, ctx, binds, true);
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
     * @returns {Array} dimensions array
     */
    function getHookTo(model) {
        if (utils.isArray(model.dimensions)) {
            return model.dimensions;
        } else if (model._parent) {
            return getHookTo(model._parent);
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
    function interpolateValue(ctx, filter, hook, value) {
        if (ctx._items == null || ctx._items.length == 0) {
            utils.warn("interpolateValue returning NULL because items array is empty");
            return null;
        }

        // fetch time from filter object and remove it from there
        var time = new Date(filter.time);
        delete filter.time;

        // filter items so that we only have a dataset for certain keys, like "geo"
        var items = ctx._getFilteredItems(filter);

        // return constant for the hook of "values"
        if (hook == "value") return items[0][ctx[HOOK_VALUE]];

        // search where the desired value should fall between the known points
        // TODO: d3 is global?
        var indexNext = d3.bisectLeft(items.map(function(d) {
            return d.time
        }), time);

        // zero-order interpolation for the hook of properties
        if (hook == "property" && indexNext == 0) return items[0][value];
        if (hook == "property") return items[indexNext - 1][value];

        // the rest is for the continuous measurements

        // check if the desired value is out of range. 0-order extrapolation
        if (indexNext == 0) return items[0][value];
        if (indexNext == items.length) return items[items.length - 1][value];

        //return null if data is missing
        if (items[indexNext][value] == null || items[indexNext - 1][value] == null) return null;

        // perform a simple linear interpolation
        var fraction =
            (time - items[indexNext - 1].time) / (items[indexNext].time - items[indexNext - 1].time);
        var value = +items[indexNext - 1][value] + (items[indexNext][value] - items[indexNext - 1][value]) * fraction;

        // cast to time object if we are interpolating time
        if (Object.prototype.toString.call(items[0][value]) === "[object Date]") {
            value = new Date(value);
        }

        return value;
    }



}).call(this);
/*!
 * VIZABI COMPONENT
 * Base Component
 */

(function() {

    "use strict";

    var class_loading = "vzb-loading";
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

            this._id = this._id || utils.uniqueId("c");
            this._ready = false;
            this._readyOnce = false;

            this.name = this.name || config.name;
            this.template = this.template || "<div></div>";
            this.placeholder = this.placeholder || config.placeholder;
            this.template_data = this.template_data || {
                name: this.name
            };

            //make sure placeholder is DOM element
            if (this.placeholder && !utils.isElement(this.placeholder)) {
                try {
                    this.placeholder = parent.placeholder.querySelector(this.placeholder);
                } catch (e) {
                    utils.error("Error finding placeholder '" + this.placeholder + "' for component '" + this.name + "'");
                }
            }

            this.parent = parent || this;
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
                this.model.on("ready", function() {
                    done();
                });
                this.model.setHooks();
                this.model.load();
            } else if (this.model && this.model.isLoading()) {
                this.model.on("ready", function() {
                    done();
                });
            } else {
                done();
            }

            function done() {
                utils.removeClass(_this.placeholder, class_loading);
                _this.setReady();
            };
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
            var rendered = "";

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
                    utils.error("Templating error for component: '" + this.name + "' - Check if path to template is correct. E.g.: 'src/components/...'");
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
                    utils.error("Error loading component: name not provided");
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
                id = id.replace(".", ""); //remove trailing period
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
                    utils.groupCollapsed("DIFFERENCE IN NUMBER OF MODELS EXPECTED AND RECEIVED");
                    utils.warn("Please, configure the 'model_expects' attribute accordingly in '" + subcomponent + "' or check the models passed in '" + _this.name + "'. [ADD LINK TO DOCUMENTATION]\n\nComponent: '" + _this.name + "'\nSubcomponent: '" + subcomponent + "'\nNumber of Models Expected: " + model_expects.length + "\nNumber of Models Received: " + model_config.length);
                    utils.groupEnd();
                }

                utils.forEach(model_config, function(m, i) {
                    var model_info = _mapOne(m);
                    var new_name;

                    if (model_expects[i]) {
                        new_name = model_expects[i].name;

                        if (model_expects[i].type && model_info.type !== model_expects[i].type) {

                            //TODO: add link to the documentation about model_expects
                            utils.groupCollapsed("UNEXPECTED MODEL TYPE: '" + model_info.type + "' instead of '" + model_expects[i].type + "'");
                            utils.warn("Please, configure the 'model_expects' attribute accordingly in '" + subcomponent + "' or check the models passed in '" + _this.name + "'. [ADD LINK TO DOCUMENTATION]\n\nComponent: '" + _this.name + "'\nSubcomponent: '" + subcomponent + "'\nExpected Model: '" + model_expects[i].type + "'\nReceived Model'" + model_info.type + "'\nModel order: " + i);
                            utils.groupEnd();
                        }
                    } else {
                        //TODO: add link to the documentation about model_expects
                        utils.groupCollapsed("UNEXPECTED MODEL: '" + model_config[i] + "'");
                        utils.warn("Please, configure the 'model_expects' attribute accordingly in '" + subcomponent + "' or check the models passed in '" + _this.name + "'. [ADD LINK TO DOCUMENTATION]\n\nComponent: '" + _this.name + "'\nSubcomponent: '" + subcomponent + "'\nNumber of Models Expected: " + model_expects.length + "\nNumber of Models Received: " + model_config.length);
                        utils.groupEnd();

                        new_name = model_info.name;
                    }
                    values[new_name] = model_info.model;

                });

                //check for remaining expected models
                var existing = model_config.length,
                    expected = model_expects.length;
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
                var parts = name.split("."),
                    current = _this.model,
                    current_name = "";
                while (parts.length) {
                    current_name = parts.shift();
                    current = current[current_name];
                }
                return {
                    name: name,
                    model: current,
                    type: (current) ? current.getType() : null
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
                t_func = this.model.get("language").getTFunction();
            } catch (err) {
                if (this.parent && this.parent != this) {
                    t_func = this.parent.getTranslationFunction();
                }
            }

            if (!t_func) {
                t_func = function(s) {
                    return s;
                };
            }
            if (wrap) return this._translatedStringFunction(t_func);
            else return t_func;
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
            if(strings.length === 0) return;
            utils.forEach(strings, function(str) {
                if(!str || !str.getAttribute) return;
                str.innerHTML = t(str.getAttribute("data-vzb-translate"));
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
        var fn = !/<[a-z][\s\S]*>/i.test(str) ?
            templates[str] = templates[str] ||
            templateFunc(root.document.getElementById(str).innerHTML) :
            // Generate a reusable function that will serve as a template
            // generator (and which will be cached).
            new Function("obj",
                "var p=[],print=function(){p.push.apply(p,arguments);};" +
                // Introduce the data as local variables using with(){}
                "with(obj){p.push('" +
                // Convert the template into pure JavaScript
                str
                .replace(/[\r\t\n]/g, " ")
                .split("<%").join("\t")
                .replace(/((^|%>)[^\t]*)'/g, "$1\r")
                .replace(/\t=(.*?)%>/g, "',$1,'")
                .split("\t").join("');")
                .split("%>").join("p.push('")
                .split("\r").join("\\'") + "');}return p.join('');");
        // Provide some basic currying to the user
        return data ? fn(data) : fn;
    }

    Component.isComponent = function(c) {
        return (c._id && (c._id[0] === 't' || c._id[0] === 'c'));
    }

    Vizabi.Component = Component;

}).call(this);
/*!
 * VIZABI COMPONENT
 * Base Component
 */

(function() {

    "use strict";

    var class_loading = "vzb-loading";
    var class_loading_data = "vzb-loading";
    var class_loading_error = "vzb-loading-error";
    var class_placeholder = "vzb-placeholder";
    var class_buttons_off = "vzb-buttonlist-off";
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
            this._id = utils.uniqueId("tm");
            this._type = "tool";

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
                this.on("change:language", function() {
                    _this.trigger("translate");
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

            this._id = utils.uniqueId("t");
            this.layout = new Vizabi.Layout();
            this.template = this.template || '<div class="vzb-tool vzb-tool-'+this.name+'"><div class="vzb-tool-content"><div class="vzb-tool-stage"><div class="vzb-tool-viz"></div><div class="vzb-tool-timeslider"></div></div><div class="vzb-tool-buttonlist"></div></div></div>';

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
            if (!this.model.bind) return;
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
        validate: function() {
            //placeholder for tool validation methods
        },

        _setUIOptions: function() {
            //add placeholder class
            utils.addClass(this.placeholder, class_placeholder);

            //add-remove buttonlist class
            if(!this.ui || !this.ui.buttons || !this.ui.buttons.length) {
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
            if(!this._readyOnce) {
                validate(this);
            }
            else {
                validate();
            }
            var model2 = JSON.stringify(m.getObject());
            if (c >= max) {
                utils.error("Max validation loop.");
            } else if (model !== model2) {
                validate_func.call(this, [++c]);
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

        var keys = Object.keys(defaults),
            size = keys.length,
            field, blueprint, original, type;

        for(var i=0; i<size; i++) {

            field = keys[i];
            if(field === "_defs_") continue;

            blueprint = defaults[field];
            original = values[field];
            type = typeof blueprint;

            if(type === "object") {
                type = (utils.isPlainObject(blueprint) && blueprint._defs_) ? "object" : utils.isArray(blueprint) ? "array" : "model";
            }
            
            if(typeof original === "undefined") {
                if(type !== "object" && type !== "model") {
                    values[field] = blueprint;
                }
                else {
                    values[field] = defaultOptions({}, blueprint);
                }
            }

            original = values[field];

            if (type === "number" && isNaN(original)) {
                values[field] = 0;
            } else if (type === "string" && typeof original !== 'string') {
                values[field] = "";
            } else if (type === "array" && !utils.isArray(original)) {
                values[field] = [];
            } else if (type === "model") {
                if (!utils.isObject(original)) {
                    values[field] = {};
                }
                values[field] = defaultOptions(values[field], blueprint);
            } else if (type === "object") {
                if (!utils.isObject(original)) {
                    values[field] = {};
                }
                if (!utils.isObject(blueprint._defs_)) {
                    blueprint._defs_ = {};
                }
                values[field] = blueprint._defs_ || values[field];
            }
        }

        return values;
    }

    Tool.isTool = function(c) {
        return (c._id && c._id[0] === 't');
    }


    Vizabi.Tool = Tool;


}).call(this);
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
            var selected = this.model.state.entities.getSelected();
            var labelModel = this.model.state.marker.label;
            var data = labelModel.getItems().map(function(d) {
                return {
                    geo: d["geo"],
                    name: labelModel.getValue(d)
                };
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
                    return "-find-" + d.geo;
                })
                .property("checked", function(d) {
                    return (selected.indexOf(d.geo) !== -1);
                })
                .on("change", function(d) {
                    _this.model.state.entities.selectEntity(d);
                });

            items.append("label")
                .attr("for", function(d) {
                    return "-find-" + d.geo;
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
                    if(_this.model.color.which != _this.which_1 
                       || _this.model.color.scaleType != _this.scaleType_1 ) {
                        _this.needsUpdate = true;
                        _this.which_1 = _this.model.color.which;
                        _this.scaleType_1 = _this.model.color.scaleType;
                    }
                },
                "change:language": function(evt) {
                    _this.updateView();
                },
                "ready": function(evt) {
                    if(!_this._readyOnce) return;
                    if(_this.needsUpdate){
                        _this.updateView();
                        _this.needsUpdate = false;
                    }
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
            
            if(this.model.color[INDICATOR] == "geo.region"){
                var regions = this.worldmapEl.classed("vzb-hidden", false)
                    .select("svg").selectAll("g");
                regions.each(function(){
                    var view = d3.select(this);
                    var color = palette[view.attr("id")];
                    view.selectAll("path").style("fill",color);
                })
                .style("opacity", 0.8)
                .on("mouseover", function(){
                    var view = d3.select(this);
                    var region = view.attr("id");
                    regions.selectAll("path").style("opacity",0.5);
                    view.selectAll("path").style("opacity",1);
                    
                    
                    //TODO: accessing _filtered is an ugly hack. should be optimised later
                    var highlight = utils.values(_this.model.color._filtered)
                        //returns a function over time. pick the last time-value
                        .map(function(d){return d[d.length-1]})
                        //filter so that only countries of the correct region remain 
                        .filter(function(f){return f["geo.region"]==region})
                        //fish out the "geo" field, leave the rest behind
                        .map(function(d){return {geo: d.geo}});
                    
                    _this.model.entities.setHighlighted(highlight);
                })
                .on("mouseout", function(){
                    regions.selectAll("path").style("opacity",0.8);
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
        "year": d3.time.format("%Y"),
        "month": d3.time.format("%b"),
        "week": d3.time.format("week %U"),
        "day": d3.time.format("%d/%m/%Y"),
        "hour": d3.time.format("%d/%m/%Y %H"),
        "minute": d3.time.format("%d/%m/%Y %H:%M"),
        "second": d3.time.format("%d/%m/%Y %H:%M:%S")
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
                    _this.changeTime();
                    var transition = _this.model.time.playing;
                    _this._setHandle(transition);
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
                    utils.throttle(brushed.bind(this), 10);
                })
                .on("brushend", function() {
                    utils.throttle(brushedEnd.bind(this), 10);
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

            play.on('click', function() {
                _this.model.time.play();
            });

            pause.on('click', function() {
                _this.model.time.pause();
            });//format

            this.format = time_formats[this.model.time.unit];
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
                    value = _this.xScale.invert(d3.mouse(this)[0]);
                }

                //set time according to dragged position
                if (value - _this.model.time.value !== 0) {
                    _this._setTime(value);
                }
                //position handle
                _this._setHandle(_this.model.time.playing);
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

            if (transition) {
                this.handle.attr("cx", old_pos)
                    .transition()
                    .duration(speed)
                    .ease("linear")
                    .attr("cx", new_pos);

                this.valueText.attr("transform", "translate(" + old_pos + "," + (this.height / 2) + ")")
                    .transition()
                    .duration(speed)
                    .ease("linear")
                    .attr("transform", "translate(" + new_pos + "," + (this.height / 2) + ")");

            } else {
                this.handle.attr("cx", new_pos);
                this.valueText.attr("transform", "translate(" + new_pos + "," + (this.height / 2) + ")");
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
                }else if(this.use == "value"){
                    this.palette = {"_default":this.which};
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
            return this.show.dim;
        },

        /**
         * Gets the filter in this entities
         * @returns {Array} Array of unique values
         */
        getFilter: function() {
            return this.show.filter.getObject();
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
        selectEntity: function(d, timeFormatter) {
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
                if (timeFormatter) {
                    added["trailStartTime"] = timeFormatter(d.time);
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
        highlightEntity: function(d, timeFormatter) {
            var dimension = this.getDimension();
            var value = d[dimension];
            if (!this.isHighlighted(d)) {
                var added = {};
                added[dimension] = value;
                if (timeFormatter) {
                    added["trailStartTime"] = timeFormatter(d.time);
                }
                this.brush = this.brush.concat(added);
            }
        },

        /**
         * Unhighlights an entity from the set
         */
        unhighlightEntity: function(d, timeFormatter) {
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
        "year": d3.time.format("%Y"),
        "month": d3.time.format("%Y-%m"),
        "week": d3.time.format("%Y-W%W"),
        "day": d3.time.format("%Y-%m-%d"),
        "hour": d3.time.format("%Y-%m-%d %H"),
        "minute": d3.time.format("%Y-%m-%d %H:%M"),
        "second": d3.time.format("%Y-%m-%d %H:%M:%S")
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
                value: "1800",
                start: "1800",
                end: "2014",
                playable: true,
                playing: false,
                loop: false,
                round: true,
                speed: 300,
                unit: "year",
                formatInput: "%Y", //defaults to year format
                step: 1, //step must be integer
                adaptMinMaxZoom: false
            }, values);

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
            for (var i = 0; i < date_attr.length; i++) {
                var attr = date_attr[i];
                if (!utils.isDate(this[attr])) {
                    for (var j = 0; j < formatters.length; j++) {
                        var formatter = formatters[j];
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
         * Gets the dimensions in time
         * @returns {String} time dimension
         */
        getDimension: function() {
            return "time";
        },

        /**
         * Gets filter for time
         * @returns {Object} time filter
         */
        getFilter: function() {
            var start = d3.time.format(this.format || "%Y")(this.start),
                end = d3.time.format(this.format || "%Y")(this.end),
                filter = {
                    "time": [
                        [start, end]
                    ]
                };
            return filter;
        },

        /**
         * gets formatted value
         * @param {String} f Optional format. Defaults to YYYY
         * @param {String} attr Optional attribute. Defaults to "value"
         * @returns {String} formatted value
         */
        getFormatted: function(f, attr) {
            if (!f) f = "%Y";
            if (!attr) attr = "value";

            var format = d3.time.format(f);
            return format(this[attr]);
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

                        //fix CSV response
                        res = format(res);

                        //cache and resolve
                        FILE_CACHED[path] = res;
                        FILE_REQUESTED[path].resolve();
                        delete FILE_REQUESTED[path];

                        if (error) {
                            utils.error("Error Happened While Loading CSV File: " + path, error);
                            return;
                        }
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

                    for (var filter in where) {
                        var wanted = where[filter];

                        if (wanted[0] === "*") {
                            continue;
                        }

                        //if not time, normal filtering
                        if (filter !== "time") {
                            data = data.filter(function(row) {
                                var val = row[filter];
                                var found = -1;

                                //normalize
                                if (!utils.isArray(val)) val = [val];

                                //find first occurence
                                utils.forEach(val, function(j, i) {
                                    if (wanted.indexOf(j) !== -1) {
                                        found = i;
                                        return false;
                                    }
                                });
                                //if found, include
                                return found !== -1;
                            });
                        }
                        //in case it's time, special filtering
                        else {
                            var timeRange = wanted[0];
                            var min = timeRange[0];
                            var max = timeRange[1] || min;

                            data = data.filter(function(row) {
                                var val = row[filter]
                                return val >= min && val <= max;
                            });
                        }

                    }

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
        },
        read: function() {
            return (new Vizabi.Promise).resolve();
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
                        //cache and resolve
                        FILE_CACHED[path] = res;
                        FILE_REQUESTED[path].resolve();
                        delete FILE_REQUESTED[path];

                        if (error) {
                            utils.error("Error Happened While Loading File: " + path, error);
                            return;
                        }
                        parse(res);
                    });
                    FILE_REQUESTED[path] = new Promise();
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

                    for (var filter in where) {
                        var wanted = where[filter];

                        if (wanted[0] === "*") {
                            continue;
                        }

                        //if not time, normal filtering
                        if (filter !== "time") {
                            data = data.filter(function(row) {
                                var val = row[filter];
                                var found = -1;

                                //normalize
                                if (!utils.isArray(val)) val = [val];

                                //find first occurence
                                utils.forEach(val, function(j, i) {
                                    if (wanted.indexOf(j) !== -1) {
                                        found = i;
                                        return false;
                                    }
                                });
                                //if found, include
                                return found !== -1;
                            });
                        }
                        //in case it's time, special filtering
                        else {
                            var timeRange = wanted[0];
                            var min = timeRange[0];
                            var max = timeRange[1] || min;

                            data = data.filter(function(row) {
                                var val = row[filter]
                                return val >= min && val <= max;
                            });
                        }

                    }

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

    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) {
        return;
    }

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
            this.timeFormatter = d3.time.format(this.model.time.formatInput);

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
            var currTime = time.value;
            var duration = (time.playing) ? time.speed : 0;

            var items = this.model.marker.label.getItems({
                time: currTime
            });

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
    Vizabi.Tool.extend('BarChart', {

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

            //default options
            this.default_options = {
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
                        show: {
                            dim: "geo",
                            filter: {
                                _defs_: {
                                    "geo": ["*"],
                                    "geo.cat": ["region"]
                                }
                            }
                        }
                    },
                    marker: {
                        dimensions: ["entities", "time"],
                        label: {
                            use: "property",
                            which: "geo.name"
                        },
                        axis_y: {
                            use: "indicator",
                            which: "lex",
                            scaleType: "linear"
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
                                "buttons/expand": "Full screen",
                                "buttons/unexpand": "Leave full screen",
                                "buttons/lock": "Lock",
                                "buttons/find": "Find",
                                "buttons/colors": "Colors",
                                "buttons/size": "Size",
                                "buttons/more_options": "Options",
                                "indicator/lex": "Life expectancy",
                                "indicator/gdp_per_cap": "GDP per capita",
                                "indicator/pop": "Population",
                                "indicator/geo.region": "Region",
                                "indicator/geo": "Geo code",
                                "indicator/time": "",
                                "indicator/geo.category": "Geo category"
                            }
                        }
                    }
                }
            };

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

            var dateMin = marker.getLimits('time').min;
            var dateMax = marker.getLimits('time').max;

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
 * VIZABI BUBBLECHART
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
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
                    if (!_this.ui.labels.dragging) return;
                    var cache = _this.cached[d.geo];
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
                    _this.model.entities.setLabelOffset(d, [
                        Math.round(_this.cached[d.geo].labelX_ * 100) / 100,
                        Math.round(_this.cached[d.geo].labelY_ * 100) / 100
                    ]);
                });



            this.gragRectangle = d3.behavior.drag()
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
                .call(this.gragRectangle);



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
            this.timeFormatter = d3.time.format(_this.model.time.formatInput);

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

            // get array of GEOs, sorted by the size hook
            // that makes larger bubbles go behind the smaller ones
            var endTime = _this.model.time.end;
            this.model.entities._visible = this.model.marker.label.getItems()
                .map(function(d) {
                    return {
                        geo: d.geo,
                        time: endTime,
                        sortValue: _this.model.marker.size.getValue({
                            geo: d.geo,
                            time: endTime
                        })
                    }
                })
                .sort(function(a, b) {
                    return b.sortValue - a.sortValue;
                });





            this.entityBubbles = this.bubbleContainer.selectAll('.vzb-bc-entity')
                .data(this.model.entities._visible, function(d) {
                    return d.geo
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
                            .filter(function(f) {
                                return f.geo == d.geo
                            })
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

                    _this.model.entities.selectEntity(d, _this.timeFormatter);
                });




            //TODO: no need to create trail group for all entities
            //TODO: instead of :append an :insert should be used to keep order, thus only few trail groups can be inserted
            this.entityTrails = this.trailsContainer.selectAll(".vzb-bc-entity")
                .data(this.model.entities._visible, function(d) {
                    return d.geo
                });

            this.entityTrails.exit().remove();

            this.entityTrails.enter().append("g")
                .attr("class", function(d) {
                    return "vzb-bc-entity" + " " + d.geo
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

            this.entityBubbles.style("fill", function(d) {
                var valueC = _this.model.marker.color.getValue({
                    geo: d.geo,
                    time: _this.time
                });
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

        }, //redraw Data Points


        _updateBubble: function(d, index, view, duration) {
            var _this = this;

            if (_this.model.time.lockNonSelected && _this.someSelected && !_this.model.entities.isSelected(d)) {
                d.time = _this.timeFormatter.parse("" + _this.model.time.lockNonSelected);
            } else {
                d.time = _this.time;
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
            if (duration == null) duration = _this.duration;

            // only for selected entities
            if (_this.model.entities.isSelected(d) && _this.entityLabels != null) {

                if (_this.cached[d.geo] == null) _this.cached[d.geo] = {};
                var cached = _this.cached[d.geo];


                var select = utils.find(_this.model.entities.select, function(f) {
                    return f.geo == d.geo
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


                // reposition label
                _this.entityLabels.filter(function(f) {
                        return f.geo == d.geo
                    })
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
                if (_this.cached[d.geo] != null) {
                    delete _this.cached[d.geo]
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

            _this.someSelected = (_this.model.entities.select.length > 0);


            this.entityLabels = this.labelsContainer.selectAll('.vzb-bc-entity')
                .data(_this.model.entities.select, function(d) {
                    return (d.geo);
                });


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

                            var maxmin = _this.cached[d.geo].maxMinValues;
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
                        .classed("vzb-transparent", !_this.cached[d.geo].stuckOnLimit)
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

            this.someHighlighted = (this.model.entities.brush.length > 0);

            this.updateBubbleOpacity();

            if (this.model.entities.brush.length === 1) {
                var d = utils.clone(this.model.entities.brush[0]);

                if (_this.model.time.lockNonSelected && _this.someSelected && !_this.model.entities.isSelected(d)) {
                    d["time"] = _this.timeFormatter.parse("" + _this.model.time.lockNonSelected);
                } else {
                    d["time"] = _this.time;
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

    var root = this;
    var Vizabi = root.Vizabi;
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

            //default options
            this.default_options = {
                state: {
                    time: {
                        start: "1990",
                        end: "2012",
                        value: "2000",
                        step: 1,
                        speed: 300,
                        formatInput: "%Y",
                        round: "ceil",
                        trails: true,
                        lockNonSelected: 0,
                        adaptMinMaxZoom: false
                    },
                    entities: {
                        show: {
                            dim: "geo",
                            filter: {
                                _defs_: {
                                    "geo": ["afg", "alb", "dza", "ago", "atg", "arg", "arm", "abw", "aus", "aut", "aze", "bhs", "bhr", "bgd", "brb", "blr", "bel", "blz", "ben", "btn", "bol", "bih", "bwa", "bra", "chn", "brn", "bgr", "bfa", "bdi", "khm", "cmr", "can", "cpv", "caf", "tcd", "_cis", "chl", "col", "com", "cod", "cog", "cri", "civ", "hrv", "cub", "cyp", "cze", "dnk", "dji", "dom", "ecu", "egy", "slv", "gnq", "eri", "est", "eth", "fji", "fin", "fra", "guf", "pyf", "gab", "gmb", "geo", "deu", "gha", "grc", "grd", "glp", "gum", "gtm", "gin", "gnb", "guy", "hti", "hnd", "hkg", "hun", "isl", "ind", "idn", "irn", "irq", "irl", "isr", "ita", "jam", "jpn", "jor", "kaz", "ken", "kir", "prk", "kor", "kwt", "kgz", "lao", "lva", "lbn", "lso", "lbr", "lby", "ltu", "lux", "mac", "mkd", "mdg", "mwi", "mys", "mdv", "mli", "mlt", "mtq", "mrt", "mus", "myt", "mex", "fsm", "mda", "mng", "mne", "mar", "moz", "mmr", "nam", "npl", "nld", "ant", "ncl", "nzl", "nic", "ner", "nga", "nor", "omn", "pak", "pan", "png", "pry", "per", "phl", "pol", "prt", "pri", "qat", "reu", "rou", "rus", "rwa", "lca", "vct", "wsm", "stp", "sau", "sen", "srb", "syc", "sle", "sgp", "svk", "svn", "slb", "som", "zaf", "sds", "esp", "lka", "sdn", "sur", "swz", "swe", "che", "syr", "twn", "tjk", "tza", "tha", "tls", "tgo", "ton", "tto", "tun", "tur", "tkm", "uga", "ukr", "are", "gbr", "usa", "ury", "uzb", "vut", "ven", "pse", "esh", "vnm", "vir", "yem", "zmb", "zwe"],
                                    "geo.cat": ["country"]
                                }
                            }
                        }
                    },
                    marker: {
                        dimensions: ["entities", "time"],
                        type: "geometry",
                        shape: "circle",
                        label: {
                            use: "property",
                            which: "geo.name"
                        },
                        axis_y: {
                            use: "indicator",
                            which: "lex",
                            scaleType: "linear",
                            unit: "years"
                        },
                        axis_x: {
                            use: "indicator",
                            which: "gdp_per_cap",
                            scaleType: "log",
                            unit: "$/year/person"
                        },
                        color: {
                            use: "property",
                            which: "geo.region",
                            scaleType: "ordinal",
                            unit: ""
                        },
                        size: {
                            use: "indicator",
                            which: "pop",
                            scaleType: "linear",
                            max: 0.75,
                            unit: ""
                        }
                    }
                },
                data: {
                    //reader: "waffle-server",
                    reader: "csv-file",
                    path: "local_data/waffles/{{LANGUAGE}}/basic-indicators.csv"
                },

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
                            "indicator/lex": "Life expectancy",
                            "indicator/gdp_per_cap": "GDP per capita",
                            "indicator/pop": "Population",
                            "indicator/geo.region": "Region",
                            "indicator/geo": "Geo code",
                            "indicator/time": "Time",
                            "indicator/geo.category": "Geo category",
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
            };


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

            var dateMin = marker.getLimits('time').min;
            var dateMax = marker.getLimits('time').max;

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
    
    var root = this;
    var Vizabi = root.Vizabi;
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

                    if (_this.cached[d.geo] == null) _this.cached[d.geo] = {};

                    _this.cached[d.geo].maxMinValues = {
                        valueXmax: null,
                        valueXmin: null,
                        valueYmax: null,
                        valueYmin: null,
                        valueSmax: null
                    };

                    var maxmin = _this.cached[d.geo].maxMinValues;

                    var trail = _this.entityTrails
                        .filter(function(f) {return f.geo == d.geo})
                        .selectAll("g")
                        .data(trailSegmentData);

                    trail.exit().remove();

                    trail.enter().append("g")
                        .attr("class", "trailSegment")
                        .on("mousemove", function(segment, index) {
                            var geo = d3.select(this.parentNode).data()[0].geo;
                            _this._axisProjections({ geo: geo, time: segment.t });
                            _this._setTooltip(_this.timeFormatter(segment.t));
                            _this.entityLabels
                                .filter(function(f) {return f.geo == geo})
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
                        segment.valueY = _this.model.marker.axis_y.getValue({geo: d.geo,time: segment.t});
                        segment.valueX = _this.model.marker.axis_x.getValue({geo: d.geo,time: segment.t});
                        segment.valueS = _this.model.marker.size.getValue({geo: d.geo,time: segment.t});
                        segment.valueC = _this.model.marker.color.getValue({geo: d.geo,time: segment.t});

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
            
            
                //quit if function is called accidentally
                if((!_this.model.time.trails || !_this.model.entities.select.length) && actions!="remove") return;
                if(!duration)duration=0;

                actions = [].concat(actions);

                //work with entities.select (all selected entities), if no particular selection is specified
                selection = selection == null ? _this.model.entities.select : [selection];
                selection.forEach(function(d) {

                    var trail = _this.entityTrails
                        .filter(function(f) { return f.geo == d.geo })
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

                    var next = this.parentNode.children[index + 1];
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

                var firstVisible = true;
                var trailStartTime = _this.timeFormatter.parse("" + d.trailStartTime);

                trail.each(function(segment, index){

                    // segment is transparent if it is after current time or before trail StartTime
                    segment.transparent = (segment.t - _this.time >= 0) 
                        || (trailStartTime - segment.t >  0) 
                        //no trail segment should be visible if leading bubble is shifted backwards
                        || (d.trailStartTime - _this.timeFormatter(_this.time) >= 0);

                    if(firstVisible && !segment.transparent){
                        _this.cached[d.geo].labelX0 = segment.valueX;
                        _this.cached[d.geo].labelY0 = segment.valueY;
                        _this.cached[d.geo].scaledS0 = utils.areaToRadius(_this.sScale(segment.valueS));
                        firstVisible = false;
                    }
                });
            },


            _reveal: function(trail, duration, d) {
                var _this = this.context;

                trail.each(function(segment, index){

                    var view = d3.select(this);    

                    view.classed("vzb-invisible", segment.transparent);

                    if (segment.transparent) return;

                    var next = this.parentNode.children[index + 1];
                    if (next == null) return;
                    next = next.__data__;

                    if (segment.t - _this.time <= 0 && _this.time - next.t <= 0) {
                        next = _this.cached[d.geo];

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
                "change": function(evt) {
                    if (!_this._readyOnce) return;
                    if(evt.indexOf("change:time")!=-1) return;
                    //console.log("change", evt)
                     _this.updateShow();
                     _this.redrawDataPoints();
                },
                "ready": function(evt) {
                    if (!_this._readyOnce) return;
                    //console.log("ready", evt)
                    _this.updateShow();
                    _this.updateSize();
                    _this.updateTime();
                    _this.redrawDataPoints();
                },
                'change:time:value': function() {
                    if (!_this._readyOnce) return;
                    //console.log("change:time:value")
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

            //component events
            this.on("resize", function() {
                _this.updateSize();
                _this.updateTime();
                _this.redrawDataPoints();
            }); 
            
            _this.updateShow();
            _this.updateSize();
            _this.updateTime();
            _this.redrawDataPoints();
        },

        /*
         * UPDATE SHOW:
         * Ideally should only update when show parameters change or data changes
         */
        updateShow: function() {
            var _this = this;
            
            this.duration = this.model.time.speed;
            this.translator = this.model.language.getTFunction();
            
            
            var titleString = this.translator("indicator/" + this.model.marker.axis_y.which); 
//                + ", "
//                + d3.time.format(this.model.time.formatInput)(this.model.time.start) + " - "
//                + d3.time.format(this.model.time.formatInput)(this.model.time.end)
                
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
                .scale(this.yScale);
            
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
            
            this.data = this.model.marker.label.getItems({ time: this.time });

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
                    _this.cached[d.geo] = {valueY:xy[xy.length-1][1]};
                    
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
                        
                        if(_this.totalLength_1[d.geo]===null) {
                            _this.totalLength_1[d.geo]=totalLength;
                        }

                        path1
                          .attr("stroke-dasharray", totalLength)
                          .attr("stroke-dashoffset", totalLength - _this.totalLength_1[d.geo])
                          .transition()
                            .duration(_this.duration)
                            .ease("linear")
                            .attr("stroke-dashoffset", 0); 

                        path2
                          .attr("stroke-dasharray", totalLength)
                          .attr("stroke-dashoffset", totalLength - _this.totalLength_1[d.geo])
                          .transition()
                            .duration(_this.duration)
                            .ease("linear")
                            .attr("stroke-dashoffset", 0);

                        _this.totalLength_1[d.geo] = totalLength;
                    }else{
                        //reset saved line lengths
                        _this.totalLength_1[d.geo] = null;
                        
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
                        .attr("cy", _this.yScale(_this.cached[d.geo].valueY) + 1);  
                                        

                    entity.select(".vzb-lc-label")
                        .transition()
                        .duration(_this.duration)
                        .ease("linear")
                        .attr("transform","translate(0," + _this.yScale(_this.cached[d.geo].valueY) + ")" );
                

                    var value = _this.yAxis.tickFormat()(_this.cached[d.geo].valueY);
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
            
            _this.hoveringNow = me;

            _this.graph.selectAll(".vzb-lc-entity").each(function(){
                d3.select(this)
                    .classed("vzb-dimmed", function(d){
                        return d.geo !== _this.hoveringNow.geo;
                    })
                    .classed("vzb-hovered", function(d){
                        return d.geo === _this.hoveringNow.geo;
                    });
            });


            var mouse = d3.mouse(_this.graph.node()).map(function(d) {
                return parseInt(d);
            });

            var resolvedTime = _this.xScale.invert(mouse[0]-_this.margin.left);  
            if(_this.time - resolvedTime < 0) {
                resolvedTime = _this.time;
            }

            var resolvedValue = _this.model.marker.axis_y.getValue({geo: me.geo, time: resolvedTime});

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
//                    var source = utils.find(_this.cached, {geo:d.source.geo});
//                    var target = utils.find(_this.cached, {geo:d.target.geo});
//
//                    d.source.px = _this.xScale(source.time);
//                    d.source.py = _this.yScale(source.value);
//                    d.target.px = _this.xScale(target.time) + 10;
//                    d.target.py = _this.yScale(target.value) + 10;
//                });
//
//                // shift the boundary nodes
//                _this.dataForceLayout.nodes.forEach(function(d){
//                    if(d.geo == "upper_boundary"){d.x = _this.xScale(_this.time)+10; d.y = 0; return};
//                    if(d.geo == "lower_boundary"){d.x = _this.xScale(_this.time)+10; d.y = _this.height; return};
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
//                _this.dataForceLayout.nodes.push({geo: d.geo, role:_this.ROLE_MARKER, fixed: true});
//                _this.dataForceLayout.nodes.push({geo: d.geo, role:_this.ROLE_LABEL, fixed: false});
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
//                        .map(function(d){return d.geo});
//                    
//                    var suggestedY = _this.dataForceLayout.nodes
//                        .filter(function(d){return d.role==_this.ROLE_LABEL})
//                        .sort(function(a,b){return b.y-a.y});
//                
//                    _this.graph.selectAll(".vzb-lc-label")
//                        .each(function (d, i) {
//                            var geoIndex = _this.cached.map(function(d){return d.geo}).indexOf(d.geo);
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

            //default options
            this.default_options = {
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
                        show: {
                            dim: "geo",
                            filter: {
                                "geo": ["*"],
                                "geo.cat": ["region"]
                            }

                        }
                    },
                    //how we show it
                    marker: {
                        dimensions: ["entities", "time"],
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
                            which: "geo.region",
                            palette: {
                                "_default": "#ffb600",
                                "eur": "#FFE700",
                                "afr": "#00D5E9",
                                "asi": "#FF5872",
                                "ame": "#7FEB00"
                            }
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
            };

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

            var dateMin = marker.getLimits('time').min;
            var dateMax = marker.getLimits('time').max;

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
        
        axis.labelFactory = function(options){
            this.METHOD_REPEATING = 'repeating specified powers';
            this.METHOD_DOUBLING = 'doubling the value';

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
            if(options.baseValues==null) options.stops = [1,2,5,3,7,4,6,8,9];
            
            
            
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
                                    * (1 + Math.log10((d+"").substr(0,1)))
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
                                if(!labelsFitIntoScale(trytofit, lengthRange, OPTIMISTIC, "none")) break;
                                
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
                    //- (dimension=="x") * parseInt(options.cssMarginRight);
                    //- (dimension=="y") * parseInt(options.cssMarginTop);
                
                // compute the influence of the axis tail
                var repositionTail = Math.min(margin.tail, options.widthOfOneDigit)
                    + (orient==VERTICAL?1:0) * d3.max(scale.range()) 
                    - (orient==VERTICAL?0:1) * d3.min(scale.range()) 
                    + (orient==VERTICAL?-1:1) * scale(d)
                    - (dimension=="x") * options.formatter(d).length * options.widthOfOneDigit / 2
                    - (dimension=="y") * options.heightOfOneDigit / 2
                    // we may consider or not the label margins to give them a bit of spacing from the edges
                    //- (dimension=="x") * parseInt(options.cssMarginLeft);
                    //- (dimension=="y") * parseInt(options.cssMarginBottom);
                
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


(function() {

    "use strict";

    var root = this;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) {
        return;
    }
    
    d3.svg.collisionResolver = function(){
        
    return function collision_resolver() {

        var DURATION = 300;
        var labelHeight = {};
        var labelPosition = {};

        
        // MAINN FUNCTION. RUN COLLISION RESOLVER ON A GROUP g
        function resolver(g) {
            
            if(data == null){console.warn(
                "D3 collision resolver stopped: missing data to work with. Example: data = {asi: {valueY: 45, valueX: 87}, ame: {valueY: 987, valueX: 767}}"); return;}
            if(selector == null){console.warn(
                "D3 collision resolver stopped: missing a CSS slector"); return;}
            if(height == null){console.warn(
                "D3 collision resolver stopped: missing height of the canvas"); return;}
            if(value == null){console.warn(
                "D3 collision resolver stopped: missing pointer within data objects. Example: value = 'valueY' "); return;}
  
            g.each(function(d, index) {
                labelHeight[d.geo] = d3.select(this).select(selector)[0][0].getBBox().height;
            });

            labelPosition = resolver.calculatePositions(data, value, height, scale);
 
            //actually reposition the labels
            g.each(function (d, i) {
                
                if(data[d.geo][fixed]) return;
                
                var resolvedY = labelPosition[d.geo] || scale(data[d.geo][value]) || 0;
                var resolvedX = null;
                
                if(handleResult!=null) {handleResult(d, i, this, resolvedX, resolvedY); return;}
                
                d3.select(this).selectAll(selector)
                    .transition()
                    .duration(DURATION)
                    .attr("transform", "translate(0," + resolvedY + ")")
            });

   
        };
        
        
        
                
        // CALCULATE OPTIMIZED POSITIONS BASED ON LABELS' HEIGHT AND THEIR PROXIMITY (DELTA)
            
        resolver.calculatePositions = function(data, value, height, scale){
            
            var result = {};
                        
            var keys = Object.keys(data).sort(function(a,b){return data[a][value] - data[b][value]});
                            
            keys.forEach(function(d, index){

                //initial positioning
                result[d] = scale(data[d][value]);

                // check the overlapping chain reaction all the way down 
                for(var j = index; j>0; j--){
                    // if overlap found shift the overlapped label downwards
                    var delta = result[keys[j-1]] - result[keys[j]] - labelHeight[keys[j]];
                    if(delta<0) result[keys[j-1]] -= delta;

                    // if the chain reaction stopped because found some gap in the middle, then quit
                    if(delta>0) break;
                }

            })
                
                
            // check if the lowest label is breaking the boundary...
            var delta = height - result[keys[0]] - labelHeight[keys[0]];

            // if it does, then                
            if(delta<0){
                // shift the lowest up
                result[keys[0]] += delta;

                // check the overlapping chain reaction all the way up 
                for(var j = 0; j<keys.length-1; j++){
                    // if overlap found shift the overlapped label upwards
                    var delta = result[keys[j]] - result[keys[j+1]] - labelHeight[keys[j+1]];
                    if(delta<0) result[keys[j+1]] += delta;

                    // if the chain reaction stopped because found some gap in the middle, then quit
                    if(delta>0) break;
                }
            }
            
            

            return result;
        };
        
        
        
        
        // GETTERS AND SETTERS
        
        var data = null;
        resolver.data = function(arg) {
            if (!arguments.length) return data;
            data = arg;
            return resolver;
        };
        var selector = null;
        resolver.selector = function(arg) {
            if (!arguments.length) return selector;
            selector = arg;
            return resolver;
        };
        var height = null;
        resolver.height = function(arg) {
            if (!arguments.length) return height;
            height = arg;
            return resolver;
        };
        var scale = d3.scale.linear().domain([0,1]).range([0,1]);
        resolver.scale = function(arg) {
            if (!arguments.length) return scale;
            scale = arg;
            return resolver;
        };
        var value = null;
        resolver.value = function(arg) {
            if (!arguments.length) return value;
            value = arg;
            return resolver;
        };
        var fixed = null;
        resolver.fixed = function(arg) {
            if (!arguments.length) return fixed;
            fixed = arg;
            return resolver;
        };
        var handleResult = null;
        resolver.handleResult = function(arg) {
            if (!arguments.length) return handleResult;
            handleResult = arg;
            return resolver;
        };
        

        return resolver;
        
    }();
        
    }; //d3.svg.collisionResolver = function(){

}).call(this);


(function() {

    "use strict";

    var root = this;

    if (!Vizabi._require('d3')) return;

    d3.svg.colorPicker = function(){
        
        return function d3_color_picker() {
        
            

            // tuning defaults
            var nCellsH = 15; // number of cells by hues (angular)
            var minH = 0; // which hue do we start from: 0 to 1 instead of 0 to 365
            var nCellsL = 4; // number of cells by lightness (radial)
            var minL = 0.50; // which lightness to start from: 0 to 1. Recommended 0.3...0.5
            var satConstant = 0.7; // constant saturation for color wheel: 0 to 1. Recommended 0.7...0.8
            
            var outerL_display = 0.40; // ecxeptional saturation of the outer circle. the one displayed 0 to 1
            var outerL_meaning = 0.30; // ecxeptional saturation of the outer circle. the one actually ment 0 to 1
            var firstAngleSat = 0.0; // exceptional saturation at first angular segment. Set 0 to have shades of grey
            
            var minRadius = 15; //radius of the central hole in color wheel: px
            
            var margin = {top: 0.1, bottom: 0.1, left: 0.1, right: 0.1}; //margins in % of container's width and height
            
            var colorOld = "#000";
            var colorDef = "#000";
            
            // names of CSS classes
            var css = {
                INVISIBLE: "vzb-invisible",
                COLOR_POINTER: "vzb-colorPicker-colorPointer",
                COLOR_BUTTON: "vzb-colorPicker-colorCell",
                COLOR_DEFAULT: "vzb-colorPicker-defaultColor",
                COLOR_SAMPLE: "vzb-colorPicker-colorSample",
                COLOR_PICKER: "vzb-colorPicker-colorPicker",
                COLOR_CIRCLE: "vzb-colorPicker-colorCircle",
                COLOR_SEGMENT: "vzb-colorPicker-colorSegment",
                COLOR_BACKGR: "vzb-colorPicker-background"
            }
            
            var colorData = []; //here we store color data. formatted as follows:
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

            var pie = d3.layout.pie()
                .sort(null)
                .value(function(d) { return 1 });
            
            var svg = null;
            var colorPointer = null;
            var showColorPicker = false;
            var sampleRect = null;
            var sampleText = null;
            var background = null;
            
            var callback = function(value){console.info("Color picker callback example. Setting color to " + value)}; 

            function _generateColorData() {
                var result = [];
                
                // loop across circles
                for(var l = 0; l<nCellsL; l++) {
                    var lightness = (minL+(1-minL)/nCellsL * l);

                    // new circle of cells
                    result.push([]);
                    
                    // loop across angles
                    for(var h = 0; h<=nCellsH; h++) {
                        var hue = minH+(1-minH)/nCellsH * h;
                        
                        // new cell
                        result[l].push({
                            display: _hslToRgb(hue, h==0?firstAngleSat:satConstant, l==0?outerL_display:lightness),
                            meaning: _hslToRgb(hue, h==0?firstAngleSat:satConstant, l==0?outerL_meaning:lightness)
                        });
                    }
                }
                return result;
            }
            
            
            function _hslToRgb(h, s, l){
                var r, g, b;

                if(s == 0){
                    r = g = b = l; // achromatic
                }else{
                    var _hue2rgb = function _hue2rgb(p, q, t){
                        if(t < 0) t += 1;
                        if(t > 1) t -= 1;
                        if(t < 1/6) return p + (q - p) * 6 * t;
                        if(t < 1/2) return q;
                        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                        return p;
                    }

                    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                    var p = 2 * l - q;
                    r = _hue2rgb(p, q, h + 1/3);
                    g = _hue2rgb(p, q, h);
                    b = _hue2rgb(p, q, h - 1/3);
                }

                return "#" + Math.round(r * 255).toString(16) + Math.round(g * 255).toString(16) + Math.round(b * 255).toString(16);
            }

            
            // this is init function. call it once after you are satisfied with parameters tuning
            // container should be a D3 selection that has a div where we want to render color picker
            // that div should have !=0 width and height in its style 
            function colorPicker(container) {
                colorData = _generateColorData();
                
                svg = container.append("svg")
                    .style("position", "absolute")
                    .style("top", "0")
                    .style("left", "0")
                    .style("width", "100%")
                    .style("height", "100%")
                    .attr("class", css.COLOR_PICKER)
                    .classed(css.INVISIBLE, !showColorPicker);

                var width = parseInt(svg.style("width"));
                var height = parseInt(svg.style("height"));
                var maxRadius = width / 2 * (1 - margin.left - margin.right);
                
                background = svg.append("rect")
                    .attr("width", width)
                    .attr("height", height)
                    .attr("class", css.COLOR_BUTTON + " " + css.COLOR_BACKGR)
                    .on("mouseover", function(d){_cellHover(colorOld)});
                
                var circles = svg.append("g")
                    .attr("transform", "translate(" + (maxRadius + width * margin.left) + "," 
                                                    + (maxRadius + height * margin.top) + ")");
                
                
                svg.append("rect")
                    .attr("class", css.COLOR_SAMPLE)
                    .attr("width", width/2)
                    .attr("height", height * margin.top/2);
                
                sampleRect = svg.append("rect")
                    .attr("class", css.COLOR_SAMPLE)
                    .attr("width", width/2)
                    .attr("x", width/2)
                    .attr("height", height * margin.top/2);

                svg.append("text")
                    .attr("x", width * margin.left)
                    .attr("y", height * margin.top/2)
                    .attr("dy", "0.5em")
                    .style("text-anchor", "start")
                    .attr("class", css.COLOR_SAMPLE);

                sampleText = svg.append("text")
                    .attr("x", width * (1-margin.right))
                    .attr("y", height * margin.top/2)
                    .attr("dy", "0.5em")
                    .style("text-anchor", "end")
                    .attr("class", css.COLOR_SAMPLE);

                svg.append("text")
                    .attr("x", width*0.1)
                    .attr("y", height*(1-margin.bottom))
                    .attr("dy", "0.3em")
                    .style("text-anchor", "start")
                    .text("default");


                svg.append("circle")
                    .attr("class", css.COLOR_DEFAULT + " " + css.COLOR_BUTTON)
                    .attr("r", width * margin.left/2)
                    .attr("cx", width * margin.left * 1.5)
                    .attr("cy", height * (1 - margin.bottom * 1.5))
                    .on("mouseover", function(){
                        d3.select(this).style("stroke", "#444");
                        _cellHover(colorDef);
                    })
                    .on("mouseout", function(){
                        d3.select(this).style("stroke", "none");
                    });

                circles.append("circle")
                    .attr("r", minRadius-1)
                    .attr("fill", "#FFF")
                    .attr("class", css.COLOR_BUTTON)
                    .on("mouseover", function(){
                        d3.select(this).style("stroke", "#444");
                        _cellHover("#FFF");
                    })
                    .on("mouseout", function(){
                        d3.select(this).style("stroke", "none");
                    });


                circles.selectAll("." + css.COLOR_CIRCLE)
                    .data(colorData)
                    .enter().append("g")
                    .attr("class", css.COLOR_CIRCLE)
                    .each(function(circleData, index){

                        arc.outerRadius(minRadius+(maxRadius-minRadius)/nCellsL*(nCellsL-index))
                            .innerRadius(minRadius+(maxRadius-minRadius)/nCellsL*(nCellsL-index-1));


                        var segment = d3.select(this).selectAll("." + css.COLOR_SEGMENT)
                            .data(pie(circleData))
                            .enter().append("g")
                            .attr("class", css.COLOR_SEGMENT);

                        segment.append("path")
                            .attr("class", css.COLOR_BUTTON)
                            .attr("d", arc)
                            .style("fill", function(d) {return d.data.display })
                            .style("stroke", function(d) {return d.data.display })
                            .on("mouseover", function(d){_cellHover(d.data.meaning, this)})
                            .on("mouseout", function(d){_cellUnHover()});
                    })

                colorPointer = circles.append("path")
                    .attr("class", css.COLOR_POINTER + " " + css.INVISIBLE);


                svg.selectAll("." + css.COLOR_BUTTON)
                    .on("click", function(){_this.show(TOGGLE)});


                _doTheStyling(svg);
            };
            
            
            var _doTheStyling = function(svg){
                
                //styling                
                svg.select("."+css.COLOR_BACKGR)
                    .style("fill", "white");
    
                svg.select("."+css.COLOR_POINTER)
                    .style("stroke-width", 2)
                    .style("stroke", "white")
                    .style("pointer-events", "none")
                    .style("fill", "none")

                svg.selectAll("."+css.COLOR_BUTTON)
                    .style("cursor","pointer")
                
                svg.selectAll("text")
                    .style("dominant-baseline","hanging")
                    .style("fill","#D9D9D9")
                    .style("font-size","0.7em")
                    .style("text-transform","uppercase");

                svg.selectAll("circle." + css.COLOR_BUTTON)
                    .style("stroke-width", 2);
            }
            
            
            var _this = colorPicker;
        
            var _cellHover = function(value, view){
                // show color pointer if the view is set (a cell of colorwheel)
                if(view!=null) colorPointer.classed(css.INVISIBLE, false).attr("d", d3.select(view).attr("d"));
                
                sampleRect.style("fill", value);
                sampleText.text(value);
                callback(value);
            }
            var _cellUnHover = function(){
                colorPointer.classed(css.INVISIBLE, true);
            }
                

            //Use this function to hide or show the color picker
            //true = show, false = hide, "toggle" or TOGGLE = toggle
            var TOGGLE = 'toggle';
            colorPicker.show = function(arg){
                if (!arguments.length) return showColorPicker;
                if(svg == null)console.warn("Color picker is missing SVG element. Was init sequence performed?");
                showColorPicker = (arg==TOGGLE? !showColorPicker : arg);
                svg.classed(css.INVISIBLE, !showColorPicker);
            }
                
        
            // getters and setters
            colorPicker.nCellsH = function(arg) {if (!arguments.length) return nCellsH; nCellsH = arg; return colorPicker;};
            colorPicker.minH = function(arg) {if (!arguments.length) return minH; minH = arg; return colorPicker;};
            colorPicker.nCellsL = function(arg) {if (!arguments.length) return nCellsL; nCellsL = arg; return colorPicker;};
            colorPicker.minL = function(arg) {if (!arguments.length) return minL; minL = arg; return colorPicker;};
            colorPicker.outerL_display = function(arg) {if (!arguments.length) return outerL_display; outerL_display = arg; return colorPicker;};
            colorPicker.outerL_meaning = function(arg) {if (!arguments.length) return outerL_meaning; outerL_meaning = arg; return colorPicker;};
            colorPicker.satConstant = function(arg) {if (!arguments.length) return satConstant; satConstant = arg; return colorPicker;};
            colorPicker.firstAngleSat = function(arg) {if (!arguments.length) return firstAngleSat; firstAngleSat = arg; return colorPicker;};
            colorPicker.minRadius = function(arg) {if (!arguments.length) return minRadius; minRadius = arg; return colorPicker;};
            colorPicker.margin = function(arg) {if (!arguments.length) return margin; margin = arg; return colorPicker;};
            
            colorPicker.callback = function(arg) {if (!arguments.length) return callback; callback = arg; return colorPicker;};
            
            colorPicker.colorDef = function (arg) {
                if (!arguments.length) return colorDef;
                colorDef = arg;
                if(svg == null)console.warn("Color picker is missing SVG element. Was init sequence performed?");
                svg.select("."+css.COLOR_DEFAULT).style("fill",colorDef);
                return colorPicker;
            };
            colorPicker.colorOld = function (arg) {
                if (!arguments.length) return colorOld;
                colorOld = arg;
                if(svg == null)console.warn("Color picker is missing SVG element. Was init sequence performed?");
                svg.select("rect."+css.COLOR_SAMPLE).style("fill",colorOld);
                svg.select("text."+css.COLOR_SAMPLE).text(colorOld);
                return colorPicker;
            };
            
            
            return colorPicker;
        }();
        
        

        
    }; //d3.svg.axisSmart = function(){

}).call(this);
















            
(function() {

    "use strict";

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

            var linScale = d3.scale.linear().domain([0, eps]).range([0, delta]);


            var abs = function(arg){
                if(arg instanceof Array) return arg.map(function(d){return Math.abs(d)});
                return Math.abs(arg);
            }
            var oneside = function(arg){
                var sign = Math.sign(arg[0]);
                for(var i=0; i<arg.length; i++){ if(Math.sign(arg[i])!=sign)return false; }
                return true;
            }


            function scale(x) {
                var ratio = 1;
                var shiftNeg = 0;
                var shiftPos = 0;
                var shiftAll = 0;
                
                //console.log("DOMAIN log lin", logScale.domain(), linScale.domain());
                //console.log("RANGE log lin", logScale.range(), linScale.range());
                
                var domainPointingForward = domain[0]<domain[domain.length-1];
                var rangePointingForward = range[0]<range[range.length-1];
                
                if(d3.min(domain)<0 && d3.max(domain)>0){
                    var minAbsDomain = d3.min(abs([ domain[0], domain[domain.length-1] ]));
                    //var maxAbsDomain = d3.max(abs([ domain[0], domain[domain.length-1] ]));
                    
                    
                    //ratio shows how the + and - scale should fit as compared to a simple + or - scale
                    ratio = domainPointingForward != rangePointingForward ?
                        ( d3.max(range) + d3.max(range) - logScale( Math.max(eps,minAbsDomain) ) ) / d3.max(range) 
                        :
                        ( d3.max(range) + logScale( Math.max(eps,minAbsDomain)) ) / d3.max(range);
                    
                    
                    
                    if(domainPointingForward && !rangePointingForward){
                        shiftNeg = (d3.max(range) + linScale(0))/ratio;
                        // if the bottom is heavier we need to shift the entire chart
                        if(abs(domain[0])>abs(domain[domain.length-1])) shiftAll -= logScale( Math.max(eps,minAbsDomain) )/ratio;
                        
                    }else if(!domainPointingForward && !rangePointingForward){                        
                        shiftAll = logScale( Math.max(eps,minAbsDomain) ) / ratio;
                        //if the top is heavier we need to shift the entire chart
                        if(abs(domain[0])<abs(domain[domain.length-1])) shiftAll += ( d3.max(range)-logScale( Math.max(eps,minAbsDomain) ) )/ratio;
                        
                    } else if(domainPointingForward && rangePointingForward){
                        shiftAll = d3.max(range)/ratio;
                        // if the top is heavier we need to shift the entire chart
                        if(abs(domain[0])<abs(domain[domain.length-1])) shiftAll -= ( d3.max(range)-logScale( Math.max(eps,minAbsDomain) ) )/ratio;
                        
                    }else if(!domainPointingForward && rangePointingForward){
                        shiftNeg = (d3.max(range) + linScale(0))/ratio;
                        //if the top is heavier we need to shift the entire chart
                        if(abs(domain[0])<abs(domain[domain.length-1])) shiftAll -= logScale( Math.max(eps,minAbsDomain) )/ratio;
                    }
                    
                    
                }else if(d3.min(domain)<0 && d3.max(domain)<0){
                    shiftNeg = d3.max(range);
                }

                
                if (x > eps) return logScale(x)/ratio + shiftAll + shiftPos;
                if (x < -eps) return -logScale(-x)/ratio + shiftAll + shiftNeg ;
                if (0 <= x && x <= eps) return linScale(x)/ratio + shiftAll + shiftPos;
                if (-eps <= x && x < 0) return -linScale(-x)/ratio + shiftAll + shiftNeg ;
            }
            scale.eps = function (arg) {
                if (!arguments.length) return eps;
                eps = arg;
                scale.domain(domain);
                return scale;
            }
            scale.delta = function (arg) {
                if (!arguments.length) return delta;
                delta = arg;
                scale.range(range);
                return scale;
            }

            scale.domain = function (_arg) {
                if (!arguments.length) return domain;
                
                // this is an internal array, it will be modified. the input _arg should stay intact
                var arg = [];

                if(_arg.length!=2)console.warn("generic log scale is best for 2 values in domain, but it tries to support other cases too");
                
                switch (_arg.length){
                    // if no values are given, reset input to the default domain (do nothing)
                    case 0: arg = domain; break;
                    // use the given value as a center, get the domain /2 and *2 around it
                    case 1: arg = [_arg[0]/2, _arg[0]*2]; break;
                    // two is the standard case. just use these
                    case 2: arg = [_arg[0], _arg[1]]; break;
                    // use the edge values as domain, center as ±epsilon
                    case 3: arg = [_arg[0], _arg[2]]; eps = abs(_arg[1]); break;
                    // use the edge values as domain, center two values as ±epsilon
//                    case 4: arg = [_arg[0], _arg[3]]; 
//                        // if the domain is pointing forward
//                        if(_arg[0]<=_arg[3]){eNeg = -abs(_arg[1]); ePos = abs(_arg[2]);}
//                        // if the domain is pointing backward
//                        if(_arg[0]>=_arg[3]){eNeg = -abs(_arg[2]); ePos = abs(_arg[1]);}
//                         break;
                    // use the edge values as domain, the minimum of the rest be the epsilon
                    default: arg = [_arg[0], _arg[_arg.length-1]];
                        eps = d3.min(abs(_arg.filter(function(d, i){return i!=0 && i!=_arg.length-1})));
                        break;
                }

                //if the domain is just a single value
                if (arg[0]==arg[1]){arg[0] = arg[0]/2; arg[1] = arg[1]*2};


                //if the desired domain is one-seded
                if(oneside(arg) && d3.min(abs(arg)) >= eps) {

                    //if the desired domain is above +epsilon
                    if(arg[0]>0 && arg[1]>0){
                        //then fallback to a regular log scale. nothing special
                        logScale.domain(arg);
                    }else{
                        //otherwise it's all negative, we take absolute and swap the arguments
                        logScale.domain([-arg[1], -arg[0]]);
                    }

                    useLinear = false;

                //if the desired domain is one-sided and takes part of or falls within 0±epsilon
                } else if (oneside(arg) && d3.min(abs(arg)) < eps) {


                    //if the desired domain is all positive
                    if(arg[0]>0 && arg[1]>0){
                        //the domain is all positive

                        //check the direction of the domain
                        if(arg[0]<=arg[1]){
                            //if the domain is pointing forward
                            logScale.domain([eps,arg[1]]);
                            linScale.domain([0,eps]);
                        }else{
                            //if the domain is pointing backward
                            logScale.domain([arg[0],eps]);
                            linScale.domain([eps,0]);
                        }
                    }else{
                        //otherwise it's all negative, we take absolute and swap the arguments

                        //check the direction of the domain
                        if(arg[0]<=arg[1]){
                            //if the domain is pointing forward
                            logScale.domain([eps,-arg[0]]);
                            linScale.domain([0,eps]);
                        }else{
                            //if the domain is pointing backward
                            logScale.domain([-arg[1],eps]);
                            linScale.domain([eps,0]);
                        }
                    }

                    useLinear = true;

                // if the desired domain is two-sided and fully or partially covers 0±epsilon
                } else if (!oneside(arg)){

                    //check the direction of the domain
                    if(arg[0]<=arg[1]){
                        //if the domain is pointing forward
                        logScale.domain([eps,d3.max(abs(arg))]);
                        linScale.domain([0,eps]);
                    }else{
                        //if the domain is pointing backward
                        logScale.domain([d3.max(abs(arg)),eps]);
                        linScale.domain([eps,0]);
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
                if (!arguments.length) return range;

                if(arg.length!=2)console.warn("generic log scale is best for 2 values in range, but it tries to support other cases too");
                switch (arg.length){
                    // reset input to the default range
                    case 0: arg = range; break;
                    // use the only value as a center, get the range ±100 around it
                    case 1: arg = [arg[0]-100, arg[0]+100]; break;
                    // two is the standard case. do nothing
                    case 2: arg = arg; break;
                    // use the edge values as range, center as delta
                    case 3: delta = arg[1]; arg = [arg[0], arg[2]]; break;
                    // use the edge values as range, the minimum of the rest be the delta
                    default: delta = d3.min(arg.filter(function(d, i){return i!=0 && i!=arg.length-1}));
                            arg = [arg[0], arg[arg.length-1]];
                            break;
                }

                if(!useLinear){
                    logScale.range(arg);
                }else{
                    if(arg[0] < arg[1]){
                        //range is pointing forward
                        
                        //check where domain is pointing
                        if(domain[0] < domain[domain.length-1]){
                            //domain is pointing forward
                            logScale.range([delta, arg[1]]);
                            linScale.range([0, delta]);
                        }else{
                            //domain is pointing backward
                            logScale.range([0, arg[1]-delta]);
                            linScale.range([arg[1]-delta, arg[1]]);
                        }
                    }else{
                        //range is pointing backward

                        //check where domain is pointing
                        if(domain[0] < domain[domain.length-1]){
                            //domain is pointing forward
                            logScale.range([arg[0]-delta, 0]);
                            linScale.range([arg[0], arg[0]-delta]);
                        }else{
                            //domain is pointing backward
                            logScale.range([arg[0], delta]);
                            linScale.range([delta, 0]);
                        }
                    }
                }

//
//console.log("LOG and LIN range:", logScale.range(), linScale.range());
                range = arg;
                return scale;
            };





            scale.copy = function () {
                return d3_scale_genericLog(d3.scale.log().domain([1, 10])).domain(domain).range(range).eps(eps).delta(delta);
            };

            return d3.rebind(scale, logScale, "invert", "base", "rangeRound", "interpolate", "clamp", "nice", "tickFormat", "ticks");
        }(d3.scale.log().domain([1, 10]));

    }

}).call(this);

(function() {

    "use strict";

    var root = this;

    if (!Vizabi._require('d3')) return;

    d3.svg.worldMap = function(){
        
        return function d3_world_map() {

//Antarctica is disabled
//<g id="ant"> \
//	<path id="east_antarctica" d="M388.52,622.99l3.83-5.11l14.89-7.66l2.55-5.529l6.381-1.28l5.96-7.66l5.96-0.43l1.279-5.96   l5.11-3.83l4.26,1.279l12.34-3.829l2.98,2.979l5.53,0.43l5.109-2.55l30.641-0.43l11.06,2.979l14.04-2.979l4.68,0.43l1.28-4.26h4.68   l6.38,6.81l11.921-7.659l13.189-3.83l4.68,2.979l0.431-5.96l6.81-0.85l7.23,3.399v3.4l18.3,7.66l5.109-0.431l2.131,2.551   l-5.96,6.81v4.68l5.529,2.98l1.28-2.98l25.11-9.79l18.3-1.699l3.83,2.13l14.47,2.13l3.4,1.28l4.68-2.551l6.81-0.43l6.381,4.68   l0.43,5.11l14.47-2.98l2.13,0.851l0.851,4.68l13.189,4.26l4.26-2.979l0.431,3.83l4.68,0.43l6.38,5.11l5.96-2.55l5.11,0.43h3.83   l2.55-0.43l0.43,6.81l8.511,5.11L388.52,622.99L388.52,622.99z"/> \
//	<path id="antarctic_peninsula" d="M260.01,622.99l13.62-3.83l0.85-3.83l14.471-3.4l8.51,2.13l18.72-7.659l-0.43-8.08l-5.53-8.511   l1.28-2.13l-2.13-5.529v-5.961h3.399l-2.13-4.26l15.32-13.189l-0.431,5.96l-2.979,0.85l-2.98,5.11l2.98,1.279l-2.98,4.261   l-3.399-0.851l-1.7,3.83l0.43,5.11l5.11-0.43l3.4,4.68l1.279,5.96l6.811,8.51l0.43,10.641l-2.55,1.279l2.13,5.53l-1.28,2.13   L260.01,622.99L260.01,622.99z"/> \
//	<path id="thurston" d="M250.22,615.33l5.11-0.85l2.13,1.699l-0.851,2.131l-0.43,2.55l-2.979,1.279l-2.131-2.55h-8.51v-1.7   l3.83-0.85L250.22,615.33L250.22,615.33z"/> \
//	<path id="alexander" d="M304.69,587.67l-4.26,0.85l2.55,4.681l2.98,1.28l-1.28,2.55v1.7l-8.09,2.13l0.85,2.55l3.4,1.28l3.83-2.98   l3.399,0.85l-2.13,3.4l1.28,0.85l3.83-1.699l2.979-5.53L304.69,587.67L304.69,587.67z"/> \
//	<path id="smyley" d="M295.75,606.82l-3.4,2.979l2.98,0.851l3.83,0.85l3.829-2.55l-3.829-0.851L295.75,606.82L295.75,606.82z"/> \
//	<path id="robert" d="M319.57,556.47l-2.489,0.5l-0.551,2.55l4.761-0.699L319.57,556.47L319.57,556.47z"/> \
//	<path id="king_george" d="M323.59,552.54l-2.99,0.57l0.57,2.31l3.64-0.13L323.59,552.54L323.59,552.54z"/> \
//	<path id="james_ross" d="M328.34,557.17l0.02,3.561l2.051,0.09l1.659-2.641L328.34,557.17L328.34,557.17z"/> \
//	<path id="elephant" d="M329.33,547.24l-2.16,0.85l-0.55,2.04l1.869,0.68l3.141-2.159L329.33,547.24L329.33,547.24z"/> \
//</g> \
            
            var world = ' \
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 950 620"> \
<g id="afr"> \
	<path id="algeria" d="M473.88,227.49l-4.08-1.37l-16.98,3.19l-3.7,2.81l2.261,11.67l-6.75,0.27l-4.061,6.53l-9.67,2.32l0.03,4.75   l31.85,24.35l5.43,0.46l18.11-14.15l-1.81-2.28l-3.4-0.46l-2.04-3.42v-14.15l-1.359-1.37l0.229-3.65l-3.62-3.65l-0.45-3.88   l1.58-1.14l-0.68-4.11L473.88,227.49L473.88,227.49z"/> \
	<path id="morocco" d="M448.289,232.28h-11.55l-2.26,5.02l-5.21,2.51l-4.3,11.64l-8.38,5.02l-11.771,19.39l11.55-0.23l0.45-5.7h2.94   v-7.76h10.189l0.23-10.04l9.74-2.28l4.08-6.62l6.34-0.23L448.289,232.28L448.289,232.28z"/> \
	<path id="mauretania" d="M404.9,276.66l2.18,2.85l-0.449,12.32l3.17-2.28l2.26-0.46l3.17,1.14l3.62,5.02l3.4-2.28l16.529-0.23   l-4.08-27.61l4.38-0.02l-8.159-6.25l0.01,4.06l-10.33,0.01l-0.05,7.75l-2.97-0.01l-0.381,5.72L404.9,276.66L404.9,276.66z"/> \
	<path id="senegal" d="M410.119,290.32l-3.939,2.86l-0.9,1.6l-0.279,1.6l1.449,1.04l4.84-0.07l3.11-0.84l0.351,1.53l-0.28,2.02   l2.97,1.46l0.62,0.7l3.94,0.14l0.14-1.74l-3.601-4.32l-4.01-5.43l-2.49-1.04L410.119,290.32L410.119,290.32z"/> \
	<path id="gambia" d="M406.89,298.34l-0.13,1.11l6.92-0.1l0.35-1.03l-0.149-1.04l-1.99,0.81L406.89,298.34L406.89,298.34z"/> \
	<path id="casamance" d="M406.789,300.22l1.24,3.01l0.69-1.86l8.41,0.88l-3.641-1.87L406.789,300.22L406.789,300.22z"/> \
	<path id="bissau" d="M408.6,304.53l1.4,2.77l3.93-3.38l0.04-1.04l-4.63-0.67L408.6,304.53L408.6,304.53z"/> \
	<path id="guinee" d="M410.42,307.94l3.04,4.68l3.96-3.44l4.06-0.18l3.38,4.49l2.87,1.89l1.08-2.1l0.96-0.54l-0.07-4.62l-1.91-5.48   l-5.859,0.65l-7.25-0.58l-0.04,1.86L410.42,307.94L410.42,307.94z"/> \
	<path id="sierra_leone" d="M413.93,313.13l5.649,5.46l4.03-4.89l-2.52-3.95l-3.471,0.35L413.93,313.13L413.93,313.13z"/> \
	<path id="liberia" d="M420.17,319.19l10.979,7.34l-0.26-5.561l-3.32-3.91l-3.24-2.869L420.17,319.19L420.17,319.19z"/> \
	<path id="ivoire" d="M432.07,326.75l4.28-3.03l5.32-0.93l5.43,1.17l-2.771-4.19l-0.81-2.56l0.81-7.57l-4.85,0.23l-2.2-2.101   l-4.62,0.12l-2.2,0.351l0.23,5.12l-1.16,0.47l-1.39,2.56l3.58,4.19L432.07,326.75L432.07,326.75z"/> \
	<path id="mali" d="M419.459,295.84l3.08-2.11l17.12-0.1l-3.96-27.54l4.521-0.13l21.87,16.69l2.939,0.42l-1.109,9.28l-13.75,1.25   l-10.61,7.92l-1.93,5.42l-7.37,0.31l-1.88-5.41l-5.65,0.4l0.22-1.77L419.459,295.84L419.459,295.84z"/> \
	<path id="burkina" d="M450.59,294.28l3.64-0.29l5.97,8.44l-5.54,4.18l-4.01-1.03l-5.39,0.07l-0.87,3.16l-4.521,0.221l-1.239-1.69   l1.6-5.14L450.59,294.28L450.59,294.28z"/> \
	<path id="niger" d="M460.89,302l2.55-0.06l2.3-3.45l3.86-0.69l4.109,2.51l8.771,0.25l6.78-2.76l2.55-2.19l0.189-2.88l4.73-4.77   l1.25-10.53l-3.11-6.52l-7.96-1.94l-18.42,14.36l-2.609-0.25l-1.12,9.97l-9.4,0.94L460.89,302L460.89,302z"/> \
	<path id="ghana" d="M444.34,317.05l1.119,2.63l2.921,4.58l1.62-0.06l4.42-2.51l-0.311-14.29l-3.42-1l-4.79,0.13L444.34,317.05   L444.34,317.05z"/> \
	<path id="togo" d="M455.22,321.25l2.68-1.57l-0.06-10.35l-1.74-2.82l-1.12,0.94L455.22,321.25L455.22,321.25z"/> \
	<path id="benin" d="M458.709,319.49h2.12l0.12-6.021l2.681-3.89l-0.12-6.77l-2.431-0.06l-4.17,3.26l1.74,3.32L458.709,319.49   L458.709,319.49z"/> \
	<path id="nigeria" d="M461.57,319.37l3.92,0.189l4.73,5.271l2.3,0.63l1.8-0.88l2.74-0.38l0.93-3.82l3.73-2.45l4.04-0.189   l7.399-13.61l-0.12-3.07l-3.42-2.63l-6.84,3.01l-9.149-0.13l-4.36-2.76l-3.11,0.69l-1.62,2.82l-0.119,7.959l-2.61,3.7   L461.57,319.37L461.57,319.37z"/> \
	<path id="tunisia" d="M474.909,227.33l5.53-2.23l1.82,1.18l0.069,1.44l-0.85,1.11l0.13,1.97l0.851,0.46v3.54l-0.98,1.64l0.13,1.05   l3.71,1.31l-2.99,4.65l-1.17-0.07l-0.2,3.74l-1.3,0.2l-1.109-0.98l0.26-3.8l-3.64-3.54l-0.46-3.08l1.76-1.38L474.909,227.33   L474.909,227.33z"/> \
	<path id="libya" d="M480.05,248.03l1.56-0.26l0.46-3.6h0.78l3.189-5.24l7.87,2.29l2.15,3.34l7.74,3.54l4.029-1.7l-0.39-1.7   l-1.76-1.7l0.2-1.18l2.859-2.42h5.66l2.15,2.88l4.55,0.66l0.59,36.89l-3.38-0.13l-20.42-10.62l-2.21,1.25l-8.391-2.1l-2.279-3.01   l-3.32-0.46l-1.69-3.01L480.05,248.03L480.05,248.03z"/> \
	<path id="egypt" d="M521.93,243.06l2.67,0.07l5.2,1.44l2.47,0.07l3.06-2.56h1.431l2.6,1.44h3.29l0.59-0.04l2.08,5.98l0.59,1.93   l0.55,2.89L545.48,255l-1.69-0.85l-1.949-6.36l-1.761-0.13l-0.13,2.16l1.17,3.74l9.37,11.6l0.2,4.98l-2.73,3.15L522.32,273   L521.93,243.06L521.93,243.06z"/> \
	<path id="chad" d="M492.789,296l0.131-2.95l4.739-4.61l1.271-11.32l-3.16-6.04l2.21-1.13l21.4,11.15l-0.13,10.94l-3.771,3.21v5.64   l2.47,4.78h-4.359l-7.221,7.14l-0.189,2.16l-5.33-0.069l-0.07,0.979l-3.04-0.399l-2.08-3.931l-1.56-0.77l0.2-1.2l1.96-1.5v-7.02   l-2.71-0.42l-3.271-2.43L492.789,296L492.789,296L492.789,296z"/> \
	<path id="sudan" d="M520.15,292.43l0.18-11.83l2.46,0.07l-0.279-6.57l25.8,0.23l3.69-3.72l7.96,12.73l-4.36,5.14v7.85l-6.86,14.75   l-2.359,1.04l0.75,4.11h2.939l3.99,5.79l-3.2,0.409l-0.82,1.49l-0.079,2.15l-9.601-0.17l-0.979-1.49l-6.71-0.38l-12.32-12.681   l1.229-0.739l0.33-2.98l-2.949-1.74l-2.69-5.31l0.15-4.94L520.15,292.43L520.15,292.43z"/> \
	<path id="cameroon" d="M477.82,324.28l3.22,2.96l-0.229,4.58l17.66-0.41l1.439-1.62l-5.06-5.45l-0.75-1.97l3.22-6.03l-2.189-4   l-1.841-0.99v-2.029l2.131-1.391l0.119-6.32l-1.689-0.19l-0.03,3.32l-7.42,13.85l-4.54,0.23l-3.109,2.14L477.82,324.28   L477.82,324.28z"/> \
	<path id="eritrea" d="M556.71,294.7l-0.25-5.89l3.96-4.62l1.069,0.82l1.95,6.52l9.36,6.97l-1.7,2.09l-6.85-5.89H556.71   L556.71,294.7z"/> \
	<path id="djibouti" d="M571.48,301.54l-0.57,3.36l3.96-0.06l0.061-4.94l-1.45-0.89L571.48,301.54L571.48,301.54z"/> \
	<path id="ethiopia" d="M549.49,311.76l7.28-16.2l7.23,0.04l6.409,5.57l-0.45,4.59h4.971l0.51,2.76l8.04,4.811l4.96,0.25   l-9.43,10.13l-12.95,3.99h-3.21l-5.72-4.88l-2.261-0.95l-4.38-6.45l-2.89,0.04l-0.34-2.96L549.49,311.76L549.49,311.76z"/> \
	<path id="somaliland" d="M575.74,305.04l4.08,2.78l1.21-0.061l10.13-3.48l1.15,3.71l-0.81,3.13l-2.19,1.74l-5.47-0.351l-7.83-4.81   L575.74,305.04L575.74,305.04z"/> \
	<path id="soqotra" d="M599.619,299.65l2.131,2.38l2.88-1.74l1.04-0.35l-1.32-1.28l-2.53,0.75L599.619,299.65L599.619,299.65z"/> \
	<path id="somalia" d="M591.97,304.05l4.37-1.68l1.55,0.93l-0.17,3.88l-4.03,11.48l-21.81,23.359l-2.53-1.739l-0.17-9.86l3.279-3.77   l6.961-2.15l10.21-10.78l2.67-2.38l0.75-3.479L591.97,304.05L591.97,304.05z"/> \
	<path id="centrafrique" d="M495.659,324.05l4.66,5.04l1.84-2.38l2.931,0.12l0.63-2.32l2.88-1.8l5.979,4.12l3.45-3.42L531.42,324   L519,311.18l1.67-1.04l0.229-2.26l-2.82-1.33h-4.14l-6.67,6.61l-0.23,2.72l-5.29-0.17l-0.17,1.16l-3.45-0.351l-3.109,5.91   L495.659,324.05L495.659,324.05z"/> \
	<path id="sao_tome" d="M470.74,337.15l1.15-0.58l0.86,0.699l-0.86,1.33l-1.04-0.409L470.74,337.15L470.74,337.15z"/> \
	<path id="principe" d="M473.05,333.5l1.729-0.29l0.58,1.1l-0.859,0.931l-0.86-0.12L473.05,333.5L473.05,333.5z"/> \
	<path id="bioko" d="M476.84,327.41l-0.46,1.97l1.38,0.75l1.319-0.99l-0.46-2.029L476.84,327.41L476.84,327.41z"/> \
	<path id="gabon" d="M486.39,332.63l-0.12,2.49l-5.64-0.12l-3.45,6.67l8.109,8.87l2.011-1.68l-0.061-1.74l-1.38-0.64v-1.221   l3.11-1.97l2.76,2.09l3.05,0.061l-0.06-10.49l-4.83-0.23l-0.061-2.2L486.39,332.63L486.39,332.63z"/> \
	<path id="equatorial_guinea" d="M480.99,332.69l-0.06,1.39l4.54,0.229l-0.061-1.569L480.99,332.69L480.99,332.69z"/> \
	<path id="congo" d="M491,332.52l-0.061,1.45l4.78,0.12l0.17,12.41l-4.37-0.12l-2.53-1.97l-1.96,1.1l-0.09,0.55l1.01,0.49l0.29,2.55   l-2.7,2.32l0.58,1.22l2.99-2.319h1.44l0.46,1.39l1.899,0.81l6.101-5.159l-0.12-3.771l1.27-3.07l3.91-2.899l1.05-9.811l-2.779,0.011   l-3.221,4.41L491,332.52L491,332.52z"/> \
	<path id="cabinda" d="M486.55,353.23l1.739,2.26l2.25-2.13l-0.659-2.21l-0.561-0.04L486.55,353.23L486.55,353.23z"/> \
	<path id="drc" d="M489.38,355.71l10.31-0.18l2.09,2.97l-0.08,2.19l0.771,0.699h5.12l1.47-2.89h2.09l0.851,0.86l2.869-0.08   l0.851,10.08l4.96,0.159v0.78l13.33,6.01l0.62,1.171h2.79l-0.311-4.221l-5.04-2.42l0.311-3.2l2.17-5.08l4.96-0.159l-4.26-14.141   l0.079-6.01l6.74-10.54l0.08-1.48l-1.01-0.55l0.04-2.859l-1.23-0.11l-1.239-1.58l-20.351-0.92l-3.729,3.63l-6.11-4.02l-2.15,1.319   l-1.56,13.13l-3.86,2.98l-1.159,2.64l0.21,3.91l-6.96,5.69l-1.851-0.84l0.25,1.09L489.38,355.71L489.38,355.71z"/> \
	<path id="rwanda" d="M537.82,339.9l2.811,2.59l-0.12,2.77l-4.36,0.09v-3.06L537.82,339.9L537.82,339.9z"/> \
	<path id="burundi" d="M536.21,346.21l4.27-0.09l-1.11,3.74l-1.08,0.939h-1.319l-0.94-2.53L536.21,346.21L536.21,346.21z"/> \
	<path id="uganda" d="M538.3,339.09l3.029,2.84l1.9-1.21l5.14-0.84l0.881,0.09l0.33-1.95l2.899-6.1l-2.439-5.08l-7.91,0.05   l-0.05,2.091l1.06,1.02l-0.16,2.09L538.3,339.09L538.3,339.09z"/> \
	<path id="kenya" d="M550.829,326.52l2.66,5.19l-3.189,6.69l-0.42,2.029l15.93,9.851l4.94-7.761l-2.5-2.029l-0.051-10.221l3.13-3.42   l-4.989,1.66l-3.771,0.05l-5.899-4.979l-1.86-0.8l-3.45,0.319l-0.609,1.021L550.829,326.52L550.829,326.52z"/> \
	<path id="tanzania" d="M550.57,371.42l17.47-2.14l-3.93-7.601l-0.21-7.279l1.271-3.48l-16.62-10.439l-5.21,0.859l-1.811,1.34   l-0.16,3.05l-1.17,4.23l-1.22,1.45l-1.75,0.16l3.35,11.609l5.471,2.57l3.77,0.11L550.57,371.42L550.57,371.42z"/> \
	<path id="zambia" d="M514.55,384.7l3.17,4.399l4.91,0.301l1.739,0.96l5.141,0.06l4.43-6.21l12.38-5.54l1.08-4.88l-1.44-6.99   l-6.46-3.68l-4.31,0.3l-2.15,4.76l0.061,2.17l5.08,2.471l0.3,5.37l-4.37,0.239l-1.08-1.81l-12.14-5.18l-0.36,3.979l-5.74,0.18   L514.55,384.7L514.55,384.7z"/> \
	<path id="angola" d="M488.619,356.71l3.41,12.73l-0.08,4.02l-4.989,5.36l-0.75,8.71l19.199,0.17l6.24,2.26l5.15-0.67l-3-3.76   l0.01-10.74l5.9-0.25v-4.19l-4.79-0.199l-0.96-9.921l-2.021,0.03l-1.09-0.979l-1.19,0.06l-1.579,3.061H502l-1.41-1.421l0.42-2.01   l-1.66-2.43L488.619,356.71L488.619,356.71z"/> \
	<path id="malawi" d="M547.159,379.4l3.11,3.25l-0.061,4.159l0.601,1.75l4.13-4.46l-0.48-5.67l-2.21-1.689l-1.97-9.95l-3.41-0.12   l1.551,7.17L547.159,379.4L547.159,379.4z"/> \
	<path id="mozambique" d="M541.17,413.28l2.689,2.229l6.34-3.859l1.021-5.73v-9.46l10.17-8.32l1.74,0.061l6.159-5.91l-0.96-12.18   L552,372.17l0.479,3.68l2.81,2.17l0.66,6.631l-5.5,5.369l-1.319-3.01l0.239-3.979l-3.17-3.44l-7.779,3.62l7.239,3.68l0.24,10.73   l-4.79,7.11L541.17,413.28L541.17,413.28z"/> \
	<path id="zimbabwe" d="M524.659,392.3l8.971,10.13l6.88,1.75l4.609-7.229l-0.359-9.58l-7.48-3.86l-2.81,1.271l-4.19,6.39l-5.8-0.06   L524.659,392.3L524.659,392.3z"/> \
	<path id="namibia" d="M496.55,421.96l3.35,0.24l1.97,1.99l4.67,0.06l1.141-13.26v-8.681l2.99-0.6l1.14-9.1l7.6-0.24l2.69-2.23   l-4.55-0.18l-6.16,0.84l-6.64-2.41h-18.66l0.479,5.3l6.22,9.16l-1.079,4.7l0.06,2.47L496.55,421.96L496.55,421.96z"/> \
	<path id="botswana" d="M508.51,411.23l2.149,0.659l-0.3,6.15l2.21,0.3l5.08-4.58l6.101,0.66l1.619-4.1l7.721-7.051l-9.271-10.67   l-0.12-1.75l-1.02-0.3l-2.811,2.59l-7.3,0.181l-1.02,9.1l-2.87,0.66L508.51,411.23L508.51,411.23z"/> \
	<path id="swaziland" d="M540.869,414l-2.51,0.42l-1.08,2.95l1.92,1.75h2.33l1.97-2.83L540.869,414L540.869,414z"/> \
	<path id="lesotho" d="M527.409,425.39l3.05-2.35l1.44,0.06l1.74,2.17l-0.181,2.171l-2.93,1.079v0.841l-3.229-0.181l-0.78-2.35   L527.409,425.39L527.409,425.39z"/> \
	<path id="south_africa" d="M534.159,403.63l-7.899,7.3l-1.88,4.511l-6.261-0.78l-5.21,4.63l-3.46-0.34l0.28-6.4l-1.23-0.43   l-0.859,13.09l-6.141-0.06l-1.85-2.181l-2.71-0.029l2.47,7.09l4.41,4.17l-3.149,3.67l2.039,4.6l4.721,1.801l3.76-3.2l10.77,0.06   l0.771-0.96l4.78-0.84l16.17-16.1l-0.061-5.07l-1.729,2.24h-2.59l-3.15-2.641l1.6-3.979l2.75-0.561l-0.25-8.18L534.159,403.63   L534.159,403.63z M530.369,422.13l1.511-0.06l2.449,2.66l-0.069,3.079l-2.87,1.45l-0.18,1.021l-4.381,0.05l-1.369-3.3l1.25-2.42   L530.369,422.13L530.369,422.13z"/> \
	<path id="mauritius" d="M613.01,398.99l-1.521,1.99l0.3,2.149l3.2-2.61L613.01,398.99L613.01,398.99z"/> \
	<path id="reunion" d="M607.38,402.37l-2.28,0.149l-0.15,1.99l1.521,0.311l2.28-1.07L607.38,402.37L607.38,402.37z"/> \
	<path id="madagascar" d="M592.3,372.92l-2.13,5.061l-3.65,6.439l-6.39,0.46l-2.74,3.22l0.46,9.82l-3.96,4.6l0.46,7.82l3.35,3.83   l3.96-0.46l3.96-2.92l-0.909-4.6l9.13-15.801l-1.83-1.989l1.83-3.83l1.979,0.609l0.61-1.529l-1.83-7.82l-1.07-3.22L592.3,372.92   L592.3,372.92z"/> \
	<path id="grande_comore" d="M577.69,371.23l0.46,1.529l1.98,0.311l0.76-1.99L577.69,371.23L577.69,371.23z"/> \
	<path id="mayotte" d="M580.579,374.3l0.761,1.69h1.22l0.61-2.15L580.579,374.3L580.579,374.3z"/> \
	<path id="aldabra" d="M602.35,358.34l-0.61,1.23l1.67,1.38l1.221-1.38L602.35,358.34L602.35,358.34z"/> \
	<path id="praslin" d="M610.88,349.14l-1.83,1.23l1.37,2.149h1.83L610.88,349.14L610.88,349.14z"/> \
	<path id="mahe" d="M611.64,354.51l-1.22,1.38l0.909,1.38L613,357.58l0.149-2.92L611.64,354.51L611.64,354.51z"/> \
	<path id="flores_1_" d="M372.64,217.02l-1.36,1.37l2.44,1.37l0.27-1.91L372.64,217.02L372.64,217.02z"/> \
	<path id="terceira" d="M379.97,216.2l-1.63,1.09l1.359,1.09l2.171-0.55L379.97,216.2L379.97,216.2z"/> \
	<path id="pico" d="M381.05,220.03l-0.811,2.19l1.08,1.37l1.36-1.09L381.05,220.03L381.05,220.03z"/> \
	<path id="sao_miguel" d="M387.56,224.4l-0.54,1.37l0.811,0.82l2.17-1.37L387.56,224.4L387.56,224.4z"/> \
	<path id="madeira" d="M408.18,236.42l-1.08,1.37l1.08,1.37l1.63-0.82L408.18,236.42L408.18,236.42z"/> \
	<path id="lanzarote" d="M415.619,253.73l-1.75,1.01l0.811,0.82L415.619,253.73L415.619,253.73z"/> \
	<path id="gran_canaria" d="M409.539,253.92l-2.17,0.55l1.08,1.64h1.63L409.539,253.92L409.539,253.92z"/> \
	<path id="tenerife" d="M404.38,252.28l-1.36,1.37l1.9,1.64l1.08-2.46L404.38,252.28L404.38,252.28z"/> \
	<path id="santo_antao" d="M387.56,290.54l-1.899,1.09l1.359,1.09l1.63-0.82L387.56,290.54L387.56,290.54z"/> \
	<path id="boa_vista" d="M392.23,292.74l-1.24,1.1l0.881,1.63l2.119-0.95L392.23,292.74L392.23,292.74z"/> \
	<path id="santiago" d="M389.52,295.83l-1.59,0.95l1.71,2.29l1.35-0.71L389.52,295.83L389.52,295.83z"/> \
</g> \
<g id="ame"> \
	<path id="mexico" d="M137.49,225.43l4.83,15.21l-2.25,1.26l0.25,3.02l4.25,3.27v6.05l5.25,5.04l-2.25-14.86l-3-9.83l0.75-6.8   l2.5,0.25l1,2.27l-1,5.79l13,25.44v9.07l10.5,12.34l11.5,5.29l4.75-2.77l6.75,5.54l4-4.03l-1.75-4.54l5.75-1.76l1.75,1.01   l1.75-1.76h2.75l5-8.82l-2.5-2.27l-9.75,2.27l-2.25,6.55l-5.75,1.01l-6.75-2.77l-3-9.57l2.271-12.07l-4.64-2.89l-2.211-11.59   l-1.85-0.79l-3.38,3.43l-3.88-2.07l-1.521-7.73l-15.37-1.61l-7.939-5.97L137.49,225.43L137.49,225.43z"/> \
	<path id="disko" d="M342.89,92.49l1.63,2.45l-0.819,2.99h-1.631l-2.18-2.45l0.54-1.9L342.89,92.49L342.89,92.49z"/> \
	<path id="st._lawrence_island_west" d="M69.17,53.35l3.46,6.47l2.22-0.5v-2.24L69.17,53.35L69.17,53.35z"/> \
	<path id="unalaska_west" d="M49.66,110.26l-0.17,3.01l2.159-0.5v-1.34L49.66,110.26L49.66,110.26z"/> \
	<path id="umnak_west" d="M46.34,111.6l-4.32,2.18l0.67,2.34l1.66-1.34l3.32-1.51L46.34,111.6L46.34,111.6z"/> \
	<path id="another_aleutian_west" d="M28.39,114.44l-2.99-0.67l-0.5,1.34l0.33,2.51L28.39,114.44L28.39,114.44z"/> \
	<path id="adak_west" d="M22.07,114.28l-2.829-1.17l-1,1.84l1.829,1.84L22.07,114.28L22.07,114.28z"/> \
	<path id="amchitka_west" d="M12.27,111.6l-1.33-1.84l-1.33,0.5v2.51l1.5,1L12.27,111.6L12.27,111.6z"/> \
	<path id="path13641" d="M10,248.7l-0.141,2.33l2.04,1.37l1.221-1.09L10,248.7L10,248.7z"/> \
	<path id="path13643" d="M15.29,252.13l-1.9,1.37l1.63,2.05l1.9-1.64L15.29,252.13L15.29,252.13z"/> \
	<path id="path13645" d="M19.1,255.41l-1.63,2.19l0.54,1.37l2.31-1.09L19.1,255.41L19.1,255.41z"/> \
	<path id="hawaii" d="M21.81,259.65l-0.95,5.47l0.95,2.05l3.12-0.96l1.63-2.74l-3.399-3.15L21.81,259.65L21.81,259.65z"/> \
	<path id="raiatea" d="M27.25,402.68l-1.9-0.14l-0.14,1.78l1.49,0.96l1.77-1.09L27.25,402.68L27.25,402.68z"/> \
	<path id="tahiti" d="M33.77,404.6l-2.72,1.78l2.04,2.46l1.77-0.41l0.95-1.229L33.77,404.6L33.77,404.6z"/> \
	<path id="guadeloupe" d="M276.6,283.37l-1.5,0.62l0.53,1.33l1.76-1.15l-0.35-0.36L276.6,283.37L276.6,283.37z"/> \
	<path id="dominica" d="M279.07,284.88l-0.88,1.87l1.061,1.42l1.319-1.15L279.07,284.88L279.07,284.88z"/> \
	<path id="martinique" d="M282.07,290.03l-1.06,0.98l0.79,1.6l1.5-0.44L282.07,290.03L282.07,290.03z"/> \
	<path id="st._lucia" d="M281.98,294.03l-0.71,1.51l1.15,1.24l1.5-0.8L281.98,294.03L281.98,294.03z"/> \
	<path id="st._vincent" d="M282.07,297.85l-1.229,0.89l0.97,1.78l1.59-0.89L282.07,297.85L282.07,297.85z"/> \
	<path id="grenada" d="M280.57,301.31l-1.149,1.15l0.439,0.71h1.41l0.44-1.16L280.57,301.31L280.57,301.31z"/> \
	<path id="trinidad" d="M282.24,304.78l-1.06,0.98l-1.15,0.18v1.42l2.12,1.949l0.88-1.42l0.53-1.6l-0.18-1.33L282.24,304.78   L282.24,304.78z"/> \
	<path id="puerto_rico" d="M271.05,281.06l-2.64-0.89l-2.12,1.33l1.06,1.24l3.61,0.53L271.05,281.06L271.05,281.06z"/> \
	<path id="haiti-dominican_border" d="M250.87,275.38l-1.67,1.71l1.909,0.78l0.28,2.39l-4.229,0.37l0.43,2.3l1.229,0.09l0.71-1.06   l4.94,0.16l0.89,1.71l1.141-1.34l3.33-0.9l2.93,0.62l0.34-1.77l-5.28-3.45l-3.42-1.28L250.87,275.38L250.87,275.38z"/> \
	<path id="domincan_republic" d="M263.11,280.44l-5.29-3.46l-2.5-0.85l-0.84,6l0.88,1.69l1.15-1.33l3.35-0.89l2.91,0.62   L263.11,280.44L263.11,280.44z"/> \
	<path id="haiti" d="M250.86,275.38l3.44,0.36l-0.41,4.22l-0.34,2.22l-4.01-0.22l-0.71,1.07l-1.23-0.09l-0.439-2.31l4.229-0.35   l-0.26-2.4l-1.94-0.8L250.86,275.38L250.86,275.38z"/> \
	<path id="falklands_west" d="M307.95,508.18l-2.631-0.29l-2.619,1.761l1.899,2.06L307.95,508.18L307.95,508.18z"/> \
	<path id="falklands_east" d="M310.57,506.86l-0.869,2.79l-2.48,2.199l0.15,0.73l4.229-1.62l1.75-2.2L310.57,506.86L310.57,506.86z"/> \
	<path id="cuba" d="M220.85,266.92v1.27l5.32,0.1l2.51-1.46l0.39,1.07l5.221,1.27l4.64,4.19l-1.06,1.46l0.189,1.66l3.87,0.97   l3.87-1.75l1.74-1.75l-2.511-1.27l-12.949-7.6l-4.54-0.49L220.85,266.92L220.85,266.92z"/> \
	<path id="bimini" d="M239.61,259.13l-1.26-0.39l-0.1,2.43l1.55,1.56l1.06-1.56L239.61,259.13L239.61,259.13z"/> \
	<path id="andros" d="M242.12,262.93l-1.74,0.97l1.64,2.34l0.87-1.17L242.12,262.93L242.12,262.93z"/> \
	<path id="inagua" d="M247.73,264.68l-1.84-0.1l0.19,1.17l1.35,1.95l1.16-1.27L247.73,264.68L247.73,264.68z"/> \
	<path id="eleuthera" d="M246.86,262.35l-3-1.27l-0.58-3.02l1.16-0.49l1.16,2.34l1.16,0.88L246.86,262.35L246.86,262.35z"/> \
	<path id="grand_bahama" d="M243.96,256.21l-1.55-0.39l-0.29-1.95l-1.641-0.58l1.061-1.07l1.93,0.68l1.45,0.88L243.96,256.21   L243.96,256.21z"/> \
	<path id="jamaica" d="M238.93,279.59l-3.479,0.88v0.97l2.029,1.17h2.13l1.351-1.56L238.93,279.59L238.93,279.59z"/> \
	<path id="alaska_1_" d="M93.11,44.89l-8.39,1.99l1.73,9.45l9.13,2.49l0.489,1.99L82.5,65.04l-7.65,12.68l2.71,13.43L82,94.13   l3.46-3.23l0.99,1.99l-4.2,4.97l-16.29,7.46l-10.37,2.49l-0.25,3.73l23.939-6.96l9.87-2.74l9.13-11.19l10.12-6.71l-5.18,8.7   l5.68,0.75l9.63-4.23l1.73,6.96l6.66,1.49l6.91,6.71l0.489,4.97l-0.989,1.24l1.229,4.72h1.73l0.25-7.96h1.97l0.49,19.64l4.939-4.23   l-3.46-20.39h-5.18l-5.68-7.21l27.89-47.25l-27.64-21.63L99.02,32.19l-1.229,9.45l6.66,3.98l-2.471,6.47L93.11,44.89L93.11,44.89z"/> \
	<path id="galapagos" d="M194.97,338.18l-0.62,2.75l-1.149,1.16l0.789,1.42l2.03-0.8l0.97-1.69l-0.619-1.779L194.97,338.18   L194.97,338.18z"/> \
	<path id="banks" d="M203.73,35.89l0.221,4.02l-7.98,8.27l2,6.7l5.76-1.56l3.33-4.92l8.42-3.13l6.87-0.45l-5.32-5.81l-2.659,2.01   l-2-0.67l-1.11-2.46l-2.44-2.46L203.73,35.89L203.73,35.89z"/> \
	<path id="prince_patrick" d="M214.15,24.05l-1.77,3.13l8.649,3.13l3.101-4.69l1.33,3.13h2.22l4.21-4.69l-5.1-1.34l-2-1.56   l-2.66,2.68L214.15,24.05L214.15,24.05z"/> \
	<path id="eglinton" d="M229.23,30.31l-6.87,2.9v2.23l8.87,3.35l-2,2.23l1.33,2.9l5.54-2.46h4.66l2.22,3.57l3.771-3.8l-0.891-3.58   l-3.1,1.12l-0.44-4.47l1.551-2.68h-1.551l-2.439,1.56l-1.11,0.89l0.67,3.13l-1.77,1.34l-2.66-0.22l-0.67-4.02L229.23,30.31   L229.23,30.31z"/> \
	<path id="mackenzie_king" d="M238.32,23.38l-0.67,2.23l4.21,2.01l3.101-1.79l-0.22-1.34L238.32,23.38L238.32,23.38z"/> \
	<path id="king_christian" d="M241.64,19.58l-3.1,1.12l0.22,1.56l6.87-0.45l-0.22-1.56L241.64,19.58L241.64,19.58z"/> \
	<path id="ellef_ringnes" d="M256.5,23.38l-0.44,1.56l-1.109,1.56v2.23l4.21-0.67l4.43,3.8h1.55v-3.8l-4.43-4.92L256.5,23.38   L256.5,23.38z"/> \
	<path id="amund_ringnes" d="M267.81,27.85l1.771,2.01l-1.551,2.68l1.11,2.9l4.88-2.68v-2.01l-2.88-3.35L267.81,27.85L267.81,27.85z   "/> \
	<path id="axel_heiberg" d="M274.24,22.71l0.221,3.57h5.99l1.55,1.34l-0.221,1.56l-5.319,0.67l3.77,5.14l5.101,0.89l7.09-3.13   l-10.2-15.42l-3.1,2.01l0.22,2.68l-3.55-1.34L274.24,22.71L274.24,22.71z"/> \
	<path id="victoria" d="M222.58,47.96l-8.42,2.23l-4.881,4.25l0.44,4.69l8.87,2.68l-2,4.47l-6.43-4.021l-1.771,3.35l4.21,2.9   l-0.22,4.69l6.43,1.79l7.76-0.45l1.33-2.46l5.761,6.48l3.989-1.34l0.67-4.47l2.881,2.01l0.439-4.47l-3.55-2.23l0.22-14.07   l-3.1-2.46L231.89,56L222.58,47.96L222.58,47.96z"/> \
	<path id="prince_of_wales" d="M249.63,57.79l-2.88-1.34l-1.55,2.01l3.1,4.92l0.22,4.69l6.65-4.02v-5.81l2.439-2.46l-2.439-1.79   h-3.99L249.63,57.79L249.63,57.79z"/> \
	<path id="prescott" d="M263.82,55.78l-4.659,3.8l1.109,4.69h2.88l1.33-2.46l2,2.01l2-0.22l5.32-4.47L263.82,55.78L263.82,55.78z"/> \
	<path id="cornwallis" d="M263.37,48.4l-1.11,2.23l4.88,1.79l1.33-2.01L263.37,48.4L263.37,48.4z"/> \
	<path id="bathurst" d="M260.49,39.91l-4.88,0.67l-2.88,2.68l5.32,0.22l-1.55,4.02l1.109,1.79l1.551-0.22l3.77-6.03L260.49,39.91   L260.49,39.91z"/> \
	<path id="devon" d="M268.92,38.35l-2.66,0.89l0.44,3.57l4.43,2.9l0.22,2.23l-1.33,1.34l0.67,4.47l17.07,5.58l4.66,1.56l4.66-4.02   l-5.54-4.47l-5.101,1.34l-7.09-0.67l-2.66-2.68l-0.67-7.37l-4.43-2.23L268.92,38.35L268.92,38.35z"/> \
	<path id="baffin" d="M282.88,61.59L278,61.14l-5.761,2.23l-3.1,4.24l0.89,11.62l9.53,0.45l9.09,4.47l6.431,7.37l4.88-0.22   l-1.33,6.92l-4.43,7.37l-4.881,2.23l-3.55-0.67l-1.77-1.56l-2.66,3.57l1.11,3.57l3.77,0.22l4.66-2.23l3.99,10.28l9.979,6.48   l6.87-8.71l-5.76-9.38l3.33-3.8l4.659,7.82l8.421-7.37l-1.551-3.35l-5.76,1.79l-3.99-10.95l3.771-6.25l-7.54-8.04l-4.21,2.9   l-3.99-8.71l-8.42,1.12l-2.22-10.5l-6.87,4.69l-0.67,5.81h-3.771l0.44-5.14L282.88,61.59L282.88,61.59z"/> \
	<path id="bylot" d="M292.86,65.61l-1.77,1.79l1.55,2.46l7.32,0.89l-4.66-4.92L292.86,65.61L292.86,65.61z"/> \
	<path id="ellesmere" d="M285.77,40.36v2.01l-4.88,1.12l1.33,2.229l5.54,2.23l6.21,0.67l4.43,3.13l4.431-2.46l-3.101-3.13h3.99   l2.44-2.68l5.989-0.89v-1.34l-3.33-2.23l0.44-2.46l9.31,1.56l13.75-5.36l-5.1-1.56l1.33-1.79h10.64l1.771-1.79l-21.511-7.6   l-5.1-1.79l-5.54,4.02l-6.21-5.14l-3.33-0.22l-0.67,4.25l-4.21-3.8l-4.88,1.56l0.89,2.46l7.32,1.56l-0.44,3.57l3.99,2.46l9.76-2.46   l0.221,3.35l-7.98,3.8l-4.88-3.8l-4.43,0.45l4.43,6.26l-2.22,1.12l-3.33-2.9l-2.44,1.56l2.221,4.24h3.77l-0.89,4.02l-3.101-0.45   l-3.99-4.25L285.77,40.36L285.77,40.36z"/> \
	<path id="southhampton" d="M266.01,101.85l-4.23,5.32l-0.26,5.86l3.7-2.13h4.49l3.17,2.93l2.91-2.4L266.01,101.85L266.01,101.85z"/> \
	<path id="newfoundland" d="M317.52,171.05l-10.569,10.12l1.06,2.4l12.939,4.79l1.851-3.19l-1.061-5.32l-4.229,0.53l-2.38-2.66   l3.96-3.99L317.52,171.05L317.52,171.05z"/> \
	<path id="canada" d="M158.22,48.66l1.99,3.01l1,4.02l4.979,1.25l3.49-3.76l2.99,1.51l8.47,0.75l5.98-2.51l1,8.28h3.489V57.7   l3.49,0.25l8.72,10.29l5.73,3.51l-2.99,4.77l1.25,1.25L219,80.03l0.25,5.02l2.989,0.5l0.75-7.53l4.73-1.25l3.49,5.27l7.47,3.51   l3.74,0.75l2.49-3.01l0.25-4.77l4.479-2.76l1.49,4.02l-3.99,7.03l0.5,3.51l2.24-3.51l4.479-4.02l0.25-5.27l-2.489-4.02l0.75-3.26   l5.979-3.01l2.74,2.01l0.5,17.57l4.229-3.76l2.49,1.51l-3.49,6.02l4.48,1l6.479-10.04l5.48,5.77l-2.24,10.29l-5.479,3.01   l-5.23-2.51l-9.46,2.01l1,3.26l-2.49,4.02l-7.72,1.76l-8.72,6.78l-7.72,10.29l-1,3.26l5.229,2.01l1.99,5.02l7.22,7.28l11.46,5.02   l-2.49,11.54l-0.25,3.26l2.99,2.01l3.99-5.27l0.5-10.04l6.229-0.25l2.99-5.77l0.5-8.78l7.97-15.56l9.961,3.51l5.229,7.28   l-2.24,7.28l3.99,2.26l9.71-6.53l2.74,17.82l8.97,10.79l0.25,5.52l-9.96,2.51l-4.729,5.02l-9.96-2.26l-4.98-0.25l-8.72,6.78   l5.229-1.25l6.48-1.25l1.25,1.51l-1.74,5.52l0.25,5.02l2.99,2.01l2.99-0.75l1.5-2.26h1.989l-3.239,6.02l-6.23,0.25l-2.74,4.02   h-3.49l-1-3.01l4.98-5.02l-5.98,2.01l-0.27-8.53l-1.72-1l-5.23,2.26l-0.5,4.27h-11.96l-10.21,7.03l-13.7,4.52l-1.489-2.01   l6.899-10.3l-3.92-3.771l-2.49-4.78l-5.069-3.87l-5.44-0.45l-9.75-6.83l-70.71-11.62l-1.17-4.79l-6.48-6.02v-5.02l1-4.52l-0.5-2.51   l-2.489-2.51l-0.5-4.02l6.479-4.521l-3.99-21.58l-5.479-0.25l-4.98-6.53L158.22,48.66L158.22,48.66z"/> \
	<path id="usa" d="M148.76,158.34l-1,4.02l-3.49-2.26h-1.74l-1,4.27l-12.21,27.36l3.24,23.84l3.99,2.01l0.75,6.53h8.22l7.97,6.02   l15.69,1.51l1.74,8.03l2.49,1.76l3.489-3.51l2.74,1.25l2.49,11.54l4.229,2.76l3.49-6.53l10.71-7.78l6.97,3.26l5.98,0.5l0.25-3.76   l12.45,0.25l2.49,2.76l0.5,6.27l-1.49,3.51l1.74,6.02h3.739l3.74-5.77l-1.49-2.76l-1.489-6.02l2.239-6.78l10.21-8.78l7.721-2.26   l-1-7.28l10.71-11.55l10.71-1.76L272.8,199l10.46-6.02v-8.03l-1-0.5l-3.74,1.25l-0.5,4.92l-12.43,0.15l-9.74,6.47l-15.29,5   l-2.439-2.99l6.939-10.5l-3.43-3.27l-2.33-4.44l-4.83-3.88l-5.25-0.44l-9.92-6.77L148.76,158.34L148.76,158.34z"/> \
	<path id="haida_gwaii" d="M133.83,128.41l-1.7,3.26l0.59,2.31l1.11,0.69l-0.261,0.94l-1.189,0.34l0.34,3.43l1.28,1.29l1.02-1.11   l-1.28-3.34l0.761-2.66l1.87-2.49l-1.36-2.31L133.83,128.41L133.83,128.41z"/> \
	<path id="vancouver" d="M139.45,147.95l-1.53,0.6l2.81,3.26l0.681,3.86l2.81,3l2.38-0.43v-3.94l-2.89-1.8L139.45,147.95   L139.45,147.95z"/> \
	<path id="guatemala" d="M194.88,291.52l5.93,4.34l5.98-7.43l-1.021-1.54l-2.04-0.07v-4.35l-1.529-0.93l-4.631,1.38l1.771,4.08   L194.88,291.52L194.88,291.52z"/> \
	<path id="honduras" d="M207.55,288.78l9.24-0.35l2.739,3.26l-1.71-0.39l-3.29,0.14l-4.3,4.04l-1.84,4.09l-1.21-0.64l-0.01-4.48   l-2.66-1.78L207.55,288.78L207.55,288.78z"/> \
	<path id="el_salvador" d="M201.65,296.27l4.7,2.34l-0.07-3.71l-2.409-1.47L201.65,296.27L201.65,296.27z"/> \
	<path id="nicaragua" d="M217.74,292.11l2.19,0.44l0.07,4.49l-2.55,7.28l-6.87-0.68l-1.53-3.51l2.04-4.26l3.87-3.6L217.74,292.11   L217.74,292.11z"/> \
	<path id="costa_rica" d="M217.38,304.98l1.39,2.72l1.13,1.5l-1.52,4.51l-2.9-2.04l-4.74-4.34v-2.87L217.38,304.98L217.38,304.98z"/> \
	<path id="panama" d="M220.59,309.61l-1.46,4.56l4.82,1.25l2.989,0.59l0.511-3.529l3.21-1.62l2.85,1.47l1.12,1.79l1.359-0.16   l1.07-3.25l-3.56-1.47l-2.7-1.471l-2.7,1.841l-3.21,1.62l-3.28-1.32L220.59,309.61L220.59,309.61z"/> \
	<path id="colombia" d="M253.73,299.78l-2.06-0.21l-13.62,11.23l-1.44,3.95l-1.859,0.21l0.83,8.73l-4.75,11.649l5.159,4.37   l6.61,0.42l4.54,6.66l6.6,0.21l-0.21,4.99H256l2.68-9.15l-2.479-3.12l0.619-5.819l5.16-0.42l-0.62-13.521l-11.56-3.74l-2.68-7.279   L253.73,299.78L253.73,299.78z"/> \
	<path id="venezuela" d="M250.46,305.92l0.439,2.59l3.25,1.03l0.74-4.77l3.43-3.55l3.431,4.02l7.89,2.149l6.68-1.399l4.551,5.609   l3.43,2.15l-3.76,5.73l1.26,4.34l-2.15,2.66l-2.229,1.869l-4.83-2.43l-1.11,1.12v3.46l3.53,1.68l-2.6,2.811l-2.601,2.81l-3.43-0.28   l-3.45-3.789L262.2,319.47l-11.78-4.02l-2.141-6.271L250.46,305.92L250.46,305.92z"/> \
	<path id="guyana" d="M285.05,314.13l7.22,6.54l-2.87,3.32l-0.229,1.97l3.77,3.89l-0.09,3.74l-6.56,2.5l-3.931-5.31l0.841-6.38   l-1.681-4.75L285.05,314.13L285.05,314.13z"/> \
	<path id="suriname" d="M293.13,321.14l2.04,1.87l3.16-1.96l2.88,0.09l-0.37,1.12l-1.21,2.521l-0.19,6.27l-5.75,2.34l0.28-4.02   l-3.71-3.46l0.19-1.78L293.13,321.14L293.13,321.14z"/> \
	<path id="guyane" d="M302.13,321.8l5.85,3.65l-3.06,6.08l-1.11,1.399l-3.25-1.87l0.09-6.55L302.13,321.8L302.13,321.8z"/> \
	<path id="ecuador" d="M230.2,335.85l-4.73,2.94l-0.34,4.36l-0.95,1.43l2.98,2.86l-1.29,1.409l0.3,3.601l5.33,1.27l8.069-9.55   l-0.02-3.33l-3.87-0.25L230.2,335.85L230.2,335.85z"/> \
	<path id="peru" d="M225.03,349.52l-1.939,1.961l0.13,3.13l16.94,30.88l17.59,11.34l2.72-4.561l0.65-10.029l-1.42-6.25l-4.79-8.08   l-2.851,0.91l-1.29,1.43l-5.689-6.52l1.42-7.69l6.6-4.3l-0.52-4.04l-6.721-0.26l-3.489-5.86l-1.94-0.65l0.13,3.521l-8.66,10.29   l-6.47-1.561L225.03,349.52L225.03,349.52z"/> \
	<path id="bolivia" d="M258.71,372.79l8.229-3.59l2.721,0.26l1.81,7.56l12.54,4.171l2.07,6.39l5.17,0.65l2.2,5.47l-1.551,4.95   l-8.409,0.649l-3.101,7.95l-6.6-0.13l-2.07-0.39l-3.81,3.699l-1.881-0.18l-6.47-14.99l1.79-2.68l0.63-10.6l-1.6-6.311   L258.71,372.79L258.71,372.79z"/> \
	<path id="paraguay" d="M291.76,399.51l2.2,2.4l-0.26,5.08l6.34-0.391l4.79,6.131l-0.391,5.47l-3.1,4.689L295,423.15l-0.261-2.61   l1.811-4.3l-6.21-3.91h-5.17l-3.88-4.17l2.819-8.061L291.76,399.51L291.76,399.51z"/> \
	<path id="uruguay" d="M300.36,431.93l-2.05,2.19l0.851,11.78l6.439,1.869l8.19-8.21L300.36,431.93L300.36,431.93z"/> \
	<path id="argentina" d="M305.47,418.2l1.94,1.819l-7.37,10.95l-2.59,2.87l0.899,12.51l5.69,6.91l-4.78,8.34l-3.62,1.561h-4.14   l1.16,6.51l-6.471,2.22l1.55,5.471l-3.88,12.38l4.79,3.91l-2.59,6.38l-4.399,6.91l2.329,4.819l-5.689,0.91l-4.66-5.729   l-0.78-17.851l-7.239-30.32l2.189-10.6l-4.66-13.55l3.101-17.59l2.85-3.391l-0.7-2.569l3.66-3.34l8.16,0.56l4.56,4.87l5.271,0.09   l5.4,3.3l-1.591,3.72l0.38,3.761l7.65-0.36L305.47,418.2L305.47,418.2z"/> \
	<path id="tierra_del_fuego_chile" d="M285.04,514.1l-4.271,9.381l7.37,0.779l0.13-6.25L285.04,514.1L285.04,514.1z"/> \
	<path id="tierra_del_fuego_argentina" d="M288.92,518.79l0.26,5.729l4.4-0.39l3.75-2.479l-6.34-1.301L288.92,518.79L288.92,518.79z   "/> \
	<path id="chile" d="M283.59,512.63l-3.21,3.55l-0.391,4.17l-6.21-3.52l-6.6-9.51l-1.94-3.391l2.721-3.52l-0.26-4.431l-3.101-1.3   l-2.46-1.819l0.521-2.48l3.229-0.91l0.65-14.33l-5.04-2.87l-3.29-74.59l0.85-1.479l6.44,14.85l2.06,0.04l0.67,2.37l-2.74,3.32   l-3.149,17.87l4.479,13.76l-2.069,10.42l7.3,30.64l0.77,17.92l5.23,6.051L283.59,512.63L283.59,512.63z"/> \
	<path id="chiloe" d="M262.28,475.14l-1.29,1.95l0.65,3.391l1.29,0.13l0.65-4.3L262.28,475.14L262.28,475.14z"/> \
	<path id="brazil" d="M314.24,438.85l6.25-12.02l0.23-10.1l11.66-7.521h6.53l5.13-8.69l0.93-16.68l-2.1-4.46l12.359-11.28   l0.47-12.449l-16.789-8.221l-20.28-6.34l-9.561-0.939l2.57-5.4l-0.7-8.22l-2.09-0.69l-3.09,6.141l-1.62,2.029l-4.16-1.84   l-13.99,4.93l-4.659-5.869l0.75-6.131l-4.4,4.48l-4.86-2.62l-0.489,0.69l0.01,2.13l4.189,2.25l-6.289,6.63l-3.971-0.04l-4.02-4.09   l-4.55,0.14l-0.561,4.86l2.61,3.17l-3.08,9.87l-3.601,0.279l-5.729,3.62l-1.4,7.11l4.971,5.32l0.909-1.03l3.49-0.94l2.98,5.021   l8.529-3.66l3.311,0.19l2.28,8.069l12.17,3.86l2.1,6.439l5.18,0.62l2.471,6.15l-1.67,5.47l2.18,2.86l-0.32,4.26l5.84-0.55   l5.351,6.76l-0.42,4.75l3.17,2.68l-7.601,11.511L314.24,438.85L314.24,438.85z"/> \
	<path id="belize" d="M204.56,282.4l-0.05,3.65h0.84l2.86-5.34h-1.94L204.56,282.4L204.56,282.4z"/> \
</g> \
<g id="asi"> \
	<path id="kalimantan" d="M781.68,324.4l-2.311,8.68l-12.529,4.229l-3.75-4.399l-1.82,0.5l3.4,13.12l5.09,0.569l6.79,2.57v2.57   l3.109-0.57l4.53-6.27v-5.131l2.55-5.13l2.83,0.57l-3.399-7.13l-0.521-4.59L781.68,324.4L781.68,324.4z"/> \
	<path id="papua_new_guinea" d="M852.76,348.29l-0.37,24.44l3.52-0.19l4.63-5.41l3.891,0.19l2.5,2.239l0.83,6.9l7.96,4.2l2.04-0.75   v-2.521l-6.391-5.319l-3.149-7.28l2.5-1.21l-1.851-4.01l-3.699-0.09l-0.931-4.29l-9.81-6.62L852.76,348.29L852.76,348.29z"/> \
	<path id="australia" d="M761.17,427.98l-0.351,25.38l-3.899,2.859l-0.351,2.5l5.32,3.57l13.13-2.5h6.74l2.479-3.58l14.9-2.86   l10.64,3.221l-0.71,4.29l1.42,4.29l8.16-1.431l0.35,2.141l-5.319,3.93l1.77,1.43l3.9-1.43l-1.061,11.8l7.45,5.721L830,485.88   l2.13,2.141l12.42-1.79l11.71-18.95l4.26-1.07l8.51-15.729l2.13-13.58l-5.319-6.79l2.13-1.431l-4.261-13.229l-4.609-3.22   l0.71-17.87l-4.26-3.221l-1.061-10.01h-2.13l-7.1,23.59l-3.9,0.36l-8.87-8.94l4.97-13.229l-9.22-1.79l-10.29,2.86l-2.84,8.22   l-4.609,1.069l-0.351-5.72l-18.8,11.44l0.35,4.29l-2.84,3.93h-7.1l-15.26,6.43L761.17,427.98L761.17,427.98z"/> \
	<path id="tasmania" d="M825.74,496.26l-1.77,7.15l0.35,5l5.32-0.36l6.03-9.29L825.74,496.26L825.74,496.26z"/> \
	<path id="new_zealand_north_island" d="M913.02,481.96l1.061,11.8l-1.421,5.36l-5.319,3.93l0.35,4.65v5l1.42,1.79l14.55-12.511   v-2.859h-3.55l-4.97-16.8L913.02,481.96L913.02,481.96z"/> \
	<path id="new_zealand_south_island" d="M902.38,507.7l2.84,5.359l-7.811,7.511l-0.71,3.93l-5.319,0.71l-8.87,8.22l-8.16-3.93   l-0.71-2.86l14.899-6.43L902.38,507.7L902.38,507.7z"/> \
	<path id="new_caledonia" d="M906.64,420.47l-0.351,1.79l4.61,6.431l2.48,1.069l0.35-2.5L906.64,420.47L906.64,420.47z"/> \
	<path id="sumatra" d="M722.48,317.57l-0.28,2.279l6.79,11.41h1.98l14.149,23.67l5.66,0.57l2.83-8.27l-4.53-2.851l-0.85-4.56   L722.48,317.57L722.48,317.57z"/> \
	<path id="east_malaysia" d="M764.14,332.92l3.02,3.49l11.58-4.01l2.29-8.841l5.16-0.369l4.72-3.421l-6.12-4.46l-1.399-2.449   l-3.021,5.569l1.11,3.2l-1.84,2.67l-3.47-0.89l-8.41,6.17l0.22,3.57L764.14,332.92L764.14,332.92z"/> \
	<path id="brunei" d="M779.77,319.25l-2.88,3.49l2.36,0.74l1.329-1.86L779.77,319.25L779.77,319.25z"/> \
	<path id="sulawesi" d="M789.53,349.11l2.26,2.77l-1.47,4.16v0.79h3.34l1.181-10.4l1.08,0.301l1.96,9.5l1.87,0.5l1.77-4.061   l-1.77-6.14l-1.471-2.67l4.62-3.37l-1.08-1.49l-4.42,2.87h-1.18l-2.16-3.17l0.69-1.391l3.64-1.779l5.5,1.68l1.67-0.1l4.13-3.86   l-1.67-1.68l-3.83,2.97h-2.46L798,332.76l-2.65,0.101l-2.95,4.75l-1.87,8.22L789.53,349.11L789.53,349.11z"/> \
	<path id="maluku" d="M814.19,330.5l-1.87,4.55l2.95,3.86h0.98l1.279-2.57l0.69-0.89l-1.28-1.391l-1.87-0.689L814.19,330.5   L814.19,330.5z"/> \
	<path id="seram" d="M819.99,345.45l-4.03,0.89l-1.18,1.29l0.98,1.68l2.649-0.989l1.67-0.99l2.46,1.98l1.08-0.891l-1.96-2.38   L819.99,345.45L819.99,345.45z"/> \
	<path id="java" d="M753.17,358.32l-2.75,1.88l0.59,1.58l8.75,1.979l4.42,0.79l1.87,1.98l5.01,0.399l2.36,1.98l2.159-0.5l1.971-1.78   l-3.641-1.68l-3.14-2.67l-8.16-1.98L753.17,358.32L753.17,358.32z"/> \
	<path id="bali" d="M781.77,366.93l-2.16,1.19l1.28,1.39l3.14-1.189L781.77,366.93L781.77,366.93z"/> \
	<path id="lombok" d="M785.5,366.04l0.39,1.88l2.26,0.59l0.88-1.09l-0.979-1.49L785.5,366.04L785.5,366.04z"/> \
	<path id="sumba" d="M790.909,370.99l-2.75,0.399l2.46,2.08h1.96L790.909,370.99L790.909,370.99z"/> \
	<path id="flores" d="M791.69,367.72l-0.59,1.19l4.42,0.689l3.439-1.979l-1.96-0.59l-3.14,0.89l-1.18-0.99L791.69,367.72   L791.69,367.72z"/> \
	<path id="timor" d="M806.14,368.42l-5.11,4.26l0.49,1.09l2.16-0.399l2.55-2.38l5.01-0.69l-0.979-1.68L806.14,368.42L806.14,368.42z   "/> \
	<path id="new_ireland" d="M880.48,349l-0.88,1.25l4.81,4.26l0.66,2.5l1.31-0.149l0.15-2.57l-1.46-1.32L880.48,349L880.48,349z"/> \
	<path id="new_britain" d="M882.89,355.03l-0.95,0.22l-0.58,2.57l-1.82,1.18l-5.47,0.96l0.22,2.06l5.761-0.289l3.649-2.28   l-0.22-3.97L882.89,355.03L882.89,355.03z"/> \
	<path id="bougainville" d="M889.38,359.51l1.239,3.45l2.19,2.13l0.66-0.59l-0.22-2.28l-2.48-3.01L889.38,359.51L889.38,359.51z"/> \
	<path id="choiseul" d="M895.43,364.65l0.15,2.279l1.39,1.32l1.31-0.81l-1.17-2.431L895.43,364.65L895.43,364.65z"/> \
	<path id="new_georgia" d="M897.18,370.31l-1.17,1.25l1.24,2.28l1.459,0.44l-0.069-1.54L897.18,370.31L897.18,370.31z"/> \
	<path id="santa_isabel" d="M900.03,368.99l1.021,2.5l1.97,2.35l1.09-1.76l-1.46-2.5L900.03,368.99L900.03,368.99z"/> \
	<path id="malaita" d="M905.14,372.74l0.58,3.09l1.39,1.91l1.17-2.42L905.14,372.74L905.14,372.74z"/> \
	<path id="santa_ana" d="M906.74,379.65l-0.51,0.88l1.68,2.21l1.17,0.069l-0.729-2.869L906.74,379.65L906.74,379.65z"/> \
	<path id="rennell" d="M903.02,384.05l-1.75,0.811l1.53,2.13l1.31-0.74L903.02,384.05L903.02,384.05z"/> \
	<path id="espiritu_santo" d="M920.869,397.22l-1.239,1.66l0.52,1.87l0.62,0.42l1.13-1.46L920.869,397.22L920.869,397.22z"/> \
	<path id="malakula" d="M921.49,402.31l0.101,1.351l1.34,0.42l0.93-0.521l-0.93-1.46L921.49,402.31L921.49,402.31z"/> \
	<path id="efate" d="M923.449,414.37l-0.619,0.939l0.93,1.04l1.55-0.52L923.449,414.37L923.449,414.37z"/> \
	<path id="fiji" d="M948.619,412.29l-1.239,1.66l-0.101,1.87l1.44,1.46L948.619,412.29L948.619,412.29z"/> \
	<path id="palawan" d="M789.369,297.53l-0.859,1.64l-0.48,2.02l-4.779,6.07l0.289,1.25l2.011-0.29l6.21-6.94L789.369,297.53   L789.369,297.53z"/> \
	<path id="negros" d="M797.11,295.22l-0.1,5.01l1.819,1.83l0.671,3.56l1.819,0.39l0.86-2.22l-1.43-1.06l-0.381-6.26L797.11,295.22   L797.11,295.22z"/> \
	<path id="cebu" d="M802.28,297.15l-0.1,4.43l1.05,1.73l1.82-2.12l-0.48-3.85L802.28,297.15L802.28,297.15z"/> \
	<path id="samar" d="M803.42,293.29l1.819,2.41l0.86,2.31h1.63l-0.29-3.95l-1.82-1.25L803.42,293.29L803.42,293.29z"/> \
	<path id="path7462" d="M806.96,302.35l0.38,2.89l-3.351,2.7l-2.77,0.29l-2.96,3.18l0.1,1.45l2.771-0.87l1.909-1.25l1.631,4.14   l2.869,2.021l1.15-0.391l1.05-1.25l-2.29-2.31l1.34-1.061l1.53,1.25l1.05-1.729l-1.05-2.12l-0.189-4.72L806.96,302.35   L806.96,302.35z"/> \
	<path id="luzon" d="M791.38,272.97l-2.58,1.83l-0.29,5.78l4.02,7.8l1.34,1.06l1.721-1.16l2.96,0.48l0.569,2.6l2.2,0.19l1.05-1.44   l-1.34-1.83l-1.63-1.54l-3.439-0.38l-1.82-2.99l2.1-3.18l0.19-2.79l-1.43-3.56L791.38,272.97L791.38,272.97z"/> \
	<path id="mindoro" d="M792.72,290.21l0.76,2.7l1.34,0.87l0.96-1.25l-1.529-2.12L792.72,290.21L792.72,290.21z"/> \
	<path id="hainan" d="M759.829,270.17l-2.39,0.67l-1.72,2.12l1.43,2.79l2.101,0.19l2.39-2.12l0.57-2.79L759.829,270.17   L759.829,270.17z"/> \
	<path id="kyushu" d="M803.23,216.42l-1.63,1.64l0.67,2.31l1.43,0.1l0.96,5.01l1.15,1.25l2.01-1.83l0.86-3.28l-2.49-3.56   L803.23,216.42L803.23,216.42z"/> \
	<path id="shikoku" d="M812.03,213.15l-2.77,2.6l-0.101,2.99l0.67,0.87l3.73-3.18l-0.29-3.18L812.03,213.15L812.03,213.15z"/> \
	<path id="honshu" d="M808.199,206.98l-4.88,5.59l0.86,1.35l2.39,0.29l4.49-3.47l3.16-0.58l2.87,3.37l2.199-0.77l0.86-3.28l4.11-0.1   l4.02-4.82l-2.1-8l-0.96-4.24l2.1-1.73l-4.78-7.22l-1.239,0.1l-2.58,2.89v2.41l1.149,1.35l0.38,6.36l-2.96,3.66l-1.72-1.06   l-1.34,2.99l-0.29,2.79l1.05,1.64l-0.67,1.25l-2.2-1.83h-1.529l-1.341,0.77L808.199,206.98L808.199,206.98z"/> \
	<path id="hokkaido" d="M816.43,163.44l-1.53,1.35l0.771,2.89l1.34,1.35l-0.101,4.43l-1.72,0.67l-1.34,2.99l3.92,5.39l2.58-0.87   l0.479-1.35l-2.77-2.5l1.72-2.22l1.82,0.29l1.43,1.54l0.101-3.18l3.92-3.18l2.2-0.58l-1.82-3.08l-0.86-1.35l-1.43,0.96l-1.24,1.54   l-2.68-0.58l-2.771-1.83L816.43,163.44L816.43,163.44z"/> \
	<path id="sri_lanka" d="M680.539,308.05l0.25,2.72l0.25,1.98l-1.47,0.25l0.74,4.45l2.21,1.24l3.43-1.98l-0.979-4.69l0.25-1.729   l-3.19-2.96L680.539,308.05L680.539,308.05z"/> \
	<path id="irian_jaya" d="M831.93,339.34l-4.17,0.47l-2.68,1.96l1.109,2.24l4.54,0.84v0.841l-2.87,2.329l1.391,4.851l1.39,0.09   l1.2-4.76h2.22l0.93,4.66l10.83,8.96l0.28,7l3.7,4.01l1.67-0.09l0.37-24.721l-6.29-4.38l-5.931,4.011l-2.13,1.31l-3.52-2.24   l-0.09-7.09L831.93,339.34L831.93,339.34z"/> \
	<path id="china" d="M670.4,170.07l-3.46,8.7l-4.77-0.25l-5.03,11.01l4.27,5.439l-8.8,12.15l-4.52-0.76l-3.021,3.8l0.75,2.28   l3.521,0.25l1.76,4.05l3.52,0.76l10.811,13.93v7.09l5.28,3.29l5.779-1.01l7.29,4.3l8.8,2.53l4.271-0.51l4.78-0.51l10.05-6.58   l3.27,0.51l1.25,2.97l2.771,0.83l3.77,5.57l-2.51,5.57l1.51,3.8l4.271,1.52l0.75,4.56l5.03,0.51l0.75-2.28l7.29-3.8l4.52,0.25   l5.28,5.82l3.52-1.52l2.261,0.25l1.01,2.79l1.76,0.25l2.51-3.54l10.051-3.8l9.05-10.89l3.02-10.38l-0.25-6.84l-3.77-0.76l2.26-2.53   l-0.5-4.05l-9.55-9.62v-4.81l2.76-3.54l2.76-1.27l0.25-2.79h-7.04l-1.26,3.8l-3.27-0.76l-4.021-4.3l2.51-6.58l3.521-3.8l3.27,0.25   l-0.5,5.82l1.761,1.52l4.27-4.3l1.51-0.25l-0.5-3.29l4.021-4.81l3.02,0.25l1.761-5.57l2.06-1.09l0.21-3.47l-2-2.1l-0.17-5.48   l3.85-0.25l-0.25-14.13l-2.699,1.62l-1.011,3.62l-4.51-0.01l-13.07-7.35l-9.439-11.38l-9.58-0.1l-2.44,2.12l3.101,7.1l-1.08,6.66   l-3.86,1.6l-2.17-0.17l-0.16,6.59l2.26,0.51l4.021-1.77l5.28,2.53v2.53l-3.771,0.25l-3.02,6.58l-2.761,0.25l-9.8,12.91l-10.3,4.56   l-7.04,0.51l-4.77-3.29l-6.79,3.55l-7.29-2.28l-1.76-4.81l-12.311-0.76l-6.53-10.63h-2.76l-2.22-4.93L670.4,170.07z"/> \
	<path id="mongolia" d="M673.8,170.17l5.819-7.72l6.99,3.23l4.75,1.27l5.82-5.34l-3.95-2.91l2.6-3.67l7.761,2.74l2.689,4.41   l4.86,0.13l2.54-1.89l5.229-0.21l1.141,1.94l8.689,0.44l5.5-5.61l7.61,0.8l-0.44,7.64l3.33,0.76l4.09-1.86l4.33,2.14l-0.1,1.08   l-3.14,0.09l-3.271,6.86l-2.54,0.25l-9.88,12.91l-10.09,4.45l-6.311,0.49l-5.239-3.38l-6.7,3.58l-6.601-2.05l-1.869-4.79   l-12.5-0.88l-6.4-10.85l-3.11-0.2L673.8,170.17L673.8,170.17z"/> \
	<path id="north_korea" d="M778.28,194.27l1.84,0.77l0.561,6.44l3.65,0.21l3.439-4.03l-1.189-1.06l0.14-4.32l3.16-3.82l-1.61-2.9   l1.05-1.2l0.58-3l-1.83-0.83l-1.56,0.79l-1.93,5.86l-3.12-0.27l-3.61,4.26L778.28,194.27L778.28,194.27z"/> \
	<path id="south_korea" d="M788.34,198.2l6.18,5.04l1.05,4.88l-0.21,2.62l-3.02,3.4l-2.601,0.14l-2.95-6.37l-1.119-3.04l1.189-0.92   l-0.28-1.27l-1.47-0.66L788.34,198.2L788.34,198.2z"/> \
	<path id="turkmenistan" d="M593.85,207.59l-0.62,2.63h-4.15v3.561l4.46,2.94l-1.38,4.03v1.86l1.851,0.31l2.46-3.25l5.54-1.24   l11.84,4.49l0.15,3.25l6.609,0.62l7.38-7.75l-0.92-2.48l-4.92-1.08l-13.84-8.99l-0.62-3.25h-5.229l-2.311,4.34h-2.31L593.85,207.59   L593.85,207.59z"/> \
	<path id="uzbekistan" d="M628.92,219.06l3.08,0.16v-5.27l-2.921-1.7l4.921-6.2h2l2,2.33l5.229-2.01L636,203.89l-0.28-1.5   l-1.72,0.42l-1.69,2.94l-7.29-0.24l-5.35-7.57l-9.4,0.93l-4.48-4.44l-6.199-1.05l-4.5,1.83l2.609,8.68l0.03,2.92l1.9,0.04   l2.33-4.44l6.199,0.08l0.921,3.41l13.289,8.82l5.141,1.18L628.92,219.06L628.92,219.06z"/> \
	<path id="tajikistan" d="M630.19,211.84l4.11-5.1h1.55l0.54,1.14l-1.9,1.38v1.14l1.25,0.9l6.01,0.36l1.96-0.84L644.6,211l0.6,1.92   l3.57,0.36l1.79,3.78l-0.54,1.14l-0.71,0.06l-0.71-1.44l-1.55-0.12l-2.681,0.36l-0.18,2.52l-2.68-0.18l0.12-3.18l-1.96-1.92   l-2.98,2.46l0.06,1.62l-2.619,0.9h-1.551l0.12-5.58L630.19,211.84L630.19,211.84z"/> \
	<path id="kirgizstan" d="M636.81,199.21l-0.31,2.53l0.25,1.56l8.699,2.92l-7.64,3.08l-0.87-0.72l-1.65,1.06l0.08,0.58l0.881,0.4   l5.359,0.14l2.72-0.82l3.49-4.4l4.37,0.76l5.27-7.3l-14.1-1.92l-1.95,4.73l-2.46-2.64L636.81,199.21L636.81,199.21z"/> \
	<path id="afghanistan" d="M614.119,227.05l1.591,12.46l3.96,0.87l0.369,2.24l-2.84,2.37l5.29,4.27l10.28-3.7l0.82-4.38l6.47-4.04   l2.479-9.36l1.851-1.99l-1.92-3.34l6.26-3.87l-0.8-1.12l-2.891,0.18l-0.26,2.66l-3.88-0.04l-0.07-3.55l-1.25-1.49l-2.1,1.91   l0.06,1.75l-3.17,1.2l-5.85-0.37l-7.6,7.96L614.119,227.05L614.119,227.05z"/> \
	<path id="pakistan" d="M623.13,249.84l2.6,3.86l-0.25,1.99l-3.46,1.37l-0.25,3.24h3.96l1.36-1.12h7.54l6.8,5.98l0.87-2.87h5.069   l0.12-3.61l-5.189-4.98l1.109-2.74l5.32-0.37l7.17-14.95l-3.96-3.11l-1.48-5.23l9.641-0.87l-5.69-8.1l-3.03-0.82l-1.239,1.5   l-0.931,0.07l-5.689,3.61l1.859,3.12l-2.1,2.24l-2.6,9.59l-6.431,4.11l-0.869,4.49L623.13,249.84L623.13,249.84z"/> \
	<path id="india" d="M670.98,313.01l4.58-2.24l2.72-9.839l-0.12-12.08l15.58-16.82v-3.99l3.21-1.25l-0.12-4.61l-3.46-6.73l1.98-3.61   l4.33,3.99l5.56,0.25v2.24l-1.729,1.87l0.37,1l2.97,0.12l0.62,3.36h0.87l2.229-3.99l1.11-10.46l3.71-2.62l0.12-3.61l-1.48-2.87   l-2.35-0.12l-9.2,6.08l0.58,3.91l-6.46-0.02l-2.28-2.79l-1.24,0.16l0.42,3.88l-13.97-1l-8.66-3.86l-0.46-4.75l-5.77-3.58   l-0.07-7.37l-3.96-4.53l-9.1,0.87l0.989,3.96l4.46,3.61l-7.71,15.78l-5.159,0.39l-0.851,1.9l5.08,4.7l-0.25,4.75l-5.189-0.08   l-0.561,2.36l4.311-0.19l0.12,1.87l-3.091,1.62l1.98,3.74l3.83,1.25l2.35-1.74l1.11-3.11l1.359-0.62l1.61,1.62l-0.49,3.99   l-1.109,1.87l0.25,3.24L670.98,313.01L670.98,313.01z"/> \
	<path id="bangladesh" d="M695.57,253.11l-1.31,2.37l3.399,6.46l0.101,5.04l0.62,1.35l3.989,0.07l2.261-2.17l1.64,0.99l0.33,3.07   l1.31-0.82l0.08-3.92l-1.1-0.13l-0.69-3.33l-2.779-0.1l-0.69-1.85l1.7-2.27l0.03-1.12h-4.94L695.57,253.11L695.57,253.11z"/> \
	<path id="burma" d="M729.44,303.65l-2.77-4.44l2.01-2.82l-1.9-3.49l-1.79-0.34l-0.34-5.86l-2.68-5.19l-0.78,1.24l-1.79,3.04   l-2.24,0.34l-1.12-1.47l-0.56-3.95l-1.68-3.16l-6.841-6.45l1.681-1.11l0.31-4.67l2.5-4.2l1.08-10.45l3.62-2.47l0.12-3.81l2.17,0.72   l3.42,4.95l-2.54,5.44l1.71,4.27l4.23,1.66l0.77,4.65l5.68,0.88l-1.569,2.71l-7.16,2.82l-0.78,4.62l5.26,6.76l0.221,3.61   l-1.23,1.24l0.11,1.13l3.92,5.75l0.11,5.97L729.44,303.65L729.44,303.65z"/> \
	<path id="thailand" d="M730.03,270.47l3.24,4.17v5.07l1.12,0.56l5.149-2.48l1.011,0.34l6.149,7.1l-0.22,4.85l-2.01-0.34l-1.79-1.13   l-1.34,0.11l-2.351,3.94l0.45,2.14l1.9,1.01l-0.11,2.37l-1.34,0.68l-4.59-3.16v-2.82l-1.9-0.11l-0.78,1.24l-0.399,12.62l2.97,5.42   l5.26,5.07l-0.22,1.47l-2.8-0.109l-2.57-3.83h-2.689l-3.36-2.71l-1.01-2.82l1.45-2.37l0.5-2.14l1.58-2.8l-0.07-6.44l-3.86-5.58   l-0.16-0.68l1.25-1.26l-0.29-4.43l-5.14-6.51l0.6-3.75L730.03,270.47L730.03,270.47z"/> \
	<path id="malaysia" d="M732.71,315.45l2.01,4.51l0.45,5.86l2.689,4.17l6.49,3.939l2.46,0.23l-0.45-4.061l-2.13-5.18l-3.12-6.63   l-0.26,1.16l-3.76-0.17l-2.7-3.88L732.71,315.45L732.71,315.45z"/> \
	<path id="cambodia" d="M740.48,299.47l4.09,4.37l7.61-5.64l0.67-8.9l-3.93,2.71l-2.04-1.14l-2.771-0.37l-1.55-1.09l-0.75,0.04   l-2.03,3.33l0.33,1.54l2.061,1.15l-0.25,3.13L740.48,299.47L740.48,299.47z"/> \
	<path id="laos" d="M735.47,262.93l-2.42,1.23l-2.011,5.86l3.36,4.28l-0.56,4.73l0.56,0.23l5.59-2.71l7.5,8.38l-0.18,5.28l1.63,0.88   l4.03-3.27l-0.33-2.59l-11.63-11.05l0.109-1.69l1.45-1.01l-1.01-2.82l-4.81-0.79L735.47,262.93L735.47,262.93z"/> \
	<path id="vietnam" d="M745.06,304.45l1.19,1.87l0.22,2.14l3.13,0.34l3.8-5.07l3.58-1.01l1.9-5.18l-0.891-8.34l-3.689-5.07   l-3.891-3.11l-4.95-8.5l3.551-5.94l-5.08-5.83l-4.07-0.18l-3.66,1.97l1.09,4.71l4.881,0.86l1.31,3.63l-1.72,1.12l0.109,0.9   l11.45,11.2l0.45,3.29l-0.69,10.4L745.06,304.45L745.06,304.45z"/> \
	<path id="georgia" d="M555.46,204.16l3.27,4.27l4.08,1.88l2.51-0.01l4.311-1.17l1.08-1.69l-12.75-4.77L555.46,204.16L555.46,204.16   z"/> \
	<path id="armenia" d="M569.72,209.89l4.8,6.26l-1.41,1.65l-3.4-0.59l-4.22-3.78l0.23-2.48L569.72,209.89L569.72,209.89z"/> \
	<path id="azerbaijan" d="M571.409,207.72l-1.01,1.72l4.71,6.18l1.641-0.53l2.699,2.83l1.17-4.96l2.931,0.47l-0.12-1.42l-4.82-4.22   l-0.92,2.48L571.409,207.72L571.409,207.72z"/> \
	<path id="iran" d="M569.65,217.95l-1.22,1.27l0.12,2.01l1.52,2.13l5.391,5.9l-0.82,2.36h-0.94l-0.47,2.36l3.05,3.9l2.811,0.24   l5.63,7.79l3.16,0.24l2.46,1.77l0.12,3.54l9.729,5.67h3.63l2.23-1.89l2.81-0.12l1.641,3.78l10.51,1.46l0.31-3.86l3.48-1.26   l0.16-1.38l-2.771-3.78l-6.17-4.96l3.24-2.95l-0.23-1.3l-4.06-0.63l-1.72-13.7l-0.2-3.15l-11.011-4.21l-4.88,1.1l-2.729,3.35   l-2.42-0.16l-0.7,0.59l-5.39-0.35l-6.801-4.96l-2.529-2.77l-1.16,0.28l-2.09,2.39L569.65,217.95L569.65,217.95z"/> \
	<path id="turkey" d="M558.699,209.19l-2.229,2.36l-8.2-0.24l-4.92-2.95l-4.8-0.12l-5.511,3.9l-5.159,0.24l-0.471,2.95h-5.859   l-2.34,2.13v1.18l1.409,1.18v1.3l-0.59,1.54l0.59,1.3l1.881-0.94l1.88,2.01l-0.471,1.42l-0.699,0.95l1.05,1.18l5.16,1.06l3.63-1.54   v-2.24l1.76,0.35l4.22,2.48l4.57-0.71l1.99-1.89l1.29,0.47v2.13h1.76l1.52-2.95l13.36-1.42l5.83-0.71l-1.54-2.02l-0.03-2.73   l1.17-1.4l-4.26-3.42l0.23-2.95h-2.341L558.699,209.19L558.699,209.19z"/> \
	<path id="yemen" d="M571.99,289.23l1.44,4.28v4.18l3.46,3.14l24.38-9.93l0.23-2.73l-3.91-7.02l-9.811,3.13l-5.63,5.54l-6.53-3.86   L571.99,289.23L571.99,289.23z"/> \
	<path id="oman" d="M598.38,280.84l7.39-4.26l1.31-6.25l-1.619-0.93l0.67-6.7l1.409-0.82l1.511,2.37l8.989,4.7v2.61l-10.89,16.03   l-5.01,0.17L598.38,280.84L598.38,280.84z"/> \
	<path id="emirates" d="M594.01,264.94l0.87,3.48l9.859,0.87l0.69-7.14l1.899-1.04l0.521-2.61l-3.11,0.87l-3.46,5.23L594.01,264.94   L594.01,264.94z"/> \
	<path id="qatar" d="M592.63,259.02l-0.521,4.01l1.54,1.17l1.4-0.13l0.52-5.05l-1.21-0.87L592.63,259.02L592.63,259.02z"/> \
	<path id="saudi" d="M584,253.24l7.01,9.77l2.26,1.8l1.01,4.38l10.79,0.85l1.22,0.64l-1.21,5.4l-7.09,4.18l-10.37,3.14l-5.529,5.4   l-6.57-3.83l-3.98,3.48L566,279.4l-3.801-1.74l-1.38-2.09v-4.53l-13.83-16.72l-0.52-2.96h3.979l4.84-4.18l0.17-2.09l-1.38-1.39   l2.771-2.26l5.88,0.35l10.03,8.36l5.92-0.27l0.38,1.46L584,253.24L584,253.24z"/> \
	<path id="syria" d="M546.67,229.13l-0.351,2.54l2.82,1.18l-0.12,7.04l2.82-0.06l2.819-2.13l1.061-0.18l6.399-5.09l1.29-7.39   l-12.79,1.3l-1.35,2.96L546.67,229.13L546.67,229.13z"/> \
	<path id="iraq" d="M564.31,225.03l-1.56,7.71l-6.461,5.38l0.41,2.54l6.311,0.43l10.05,8.18l5.62-0.16l0.149-1.89l2.061-2.21   l2.88,1.63l0.38-0.36l-5.57-7.41l-2.64-0.16l-3.51-4.51l0.7-3.32l1.069-0.14l0.37-1.47l-4.78-5.03L564.31,225.03L564.31,225.03z"/> \
	<path id="jordan" d="M548.9,240.78l-2.46,8.58l-0.11,1.31h3.87l4.33-3.82l0.11-1.45l-1.771-1.81l3.17-2.63l-0.46-2.44l-0.87,0.2   l-2.64,1.89L548.9,240.78L548.9,240.78z"/> \
	<path id="israel" d="M545.32,238.06l-1.58,5.03l2.05,6.03l2.351-8.81v-1.89L545.32,238.06L545.32,238.06z"/> \
	<path id="cyprus" d="M543.21,229.84l1.229,0.89l-3.81,3.61l-1.82-0.06l-1.35-0.95l0.18-1.77l2.76-0.18L543.21,229.84L543.21,229.84   z"/> \
	<path id="lebanon" d="M546.199,232.44l0.061,1.95l-0.82,2.96l2.82,0.24l0.18-4.2L546.199,232.44L546.199,232.44z"/> \
	<path id="kuwait" d="M583.289,247.17l-2.25-1.22l-1.56,1.57l0.17,3.14l3.63,1.39L583.289,247.17L583.289,247.17z"/> \
	<path id="bhutan" d="M695.4,248.08l1.55,2.12l5.24,0.04l-0.53-2.9L695.4,248.08L695.4,248.08z"/> \
	<path id="nepal" d="M671.19,242.56l0.46,4.27l8.08,3.66l12.95,0.96l-0.49-3.13l-8.65-2.38l-7.34-4.37L671.19,242.56L671.19,242.56z   "/> \
	<path id="male" d="M656.4,320.76l0.3,2.61l1.67,0.61l0.301-2.301L656.4,320.76L656.4,320.76z"/> \
	<path id="maldive" d="M658.53,326.28l-0.149,3.22l1.22,0.61l1.07-2.15L658.53,326.28L658.53,326.28z"/> \
	<path id="gan" d="M658.84,332.57l-1.07,1.069l1.22,1.07l1.521-1.07L658.84,332.57L658.84,332.57z"/> \
	<path id="taiwan" d="M787.46,248.31l-3.54,2.7l-0.19,5.2l3.06,3.56l0.761-0.67L787.46,248.31L787.46,248.31z"/> \
	<path id="attu_west" d="M-22.16,106.33l1.66,1.17l-0.5,1.34h-1.16V106.33L-22.16,106.33z"/> \
	<path id="kerguelen" d="M622.76,499.62l-0.15,4.29l5.94,1.38l1.37-3.53l-2.131,0.61l-2.739,0.61l-0.761-3.221L622.76,499.62   L622.76,499.62z"/> \
</g> \
<g id="eur"> \
	<path id="estonia" d="M517.77,143.66l-5.6-0.2l-3.551,2.17l-0.05,1.61l2.3,2.17l7.15,1.21L517.77,143.66L517.77,143.66z"/> \
	<path id="iceland" d="M406.36,117.31l-1.96-1.11l-2.64,1.67l-2.271,2.1l0.061,1.17l2.939,0.37l-0.18,2.1l-1.04,1.05l0.25,0.68   l2.939,0.19v3.4l4.23,0.74l2.51,1.42l2.82,0.12l4.84-2.41l3.74-4.94l0.06-3.34l-2.27-1.92l-1.9-1.61l-0.859,0.62l-1.29,1.67   l-1.471-0.19l-1.47-1.61l-1.899,0.18l-2.761,2.29l-1.66,1.79l-0.92-0.8l-0.06-1.98l0.92-0.62L406.36,117.31L406.36,117.31z"/> \
	<path id="spitsbergen" d="M488.26,53.96l-1.65-1.66l-3.66,1.78h-6.72L475.17,58l3.77,3.33l1.65-0.24l2.359-4.04l2,1.43l-1.42,2.85   l-0.71,4.16l1.65,2.61l3.54-5.94l4.6-5.59l-1.77-1.54L488.26,53.96L488.26,53.96z"/> \
	<path id="nordaustlandet" d="M490.26,46.83l-2.95,2.73l1.77,2.73h3.181l1.3,1.78l3.89,2.02l4.48-2.61l3.07-2.61l-1.061-2.14   l-3.07-1.78l-2.239,2.02l-1.53-1.9l-1.18,0.12l-1.53,3.33l-2.24-2.26l-0.24-1.54L490.26,46.83L490.26,46.83z"/> \
	<path id="edgeoya" d="M496.98,59.07l-2.36,2.14l-2,1.54l0.94,1.66l1.89,0.59l3.07-1.43l1.42-1.78l-1.3-2.14L496.98,59.07   L496.98,59.07z"/> \
	<path id="prince_george" d="M547.82,38.79l1.72,0.69l-1.21,2.08v2.95l-2.58,1.56H543l-1.551-1.91l0.17-2.08l1.21-1.56h2.41   L547.82,38.79L547.82,38.79z"/> \
	<path id="salisbury" d="M554.36,36.88v2.08l1.72,1.39l2.41-0.17l2.07-1.91v-1.39h-1.89l-1.551,0.52l-1.21-1.39L554.36,36.88   L554.36,36.88z"/> \
	<path id="wilczek" d="M564.18,37.06l1.21,2.6l2.41,0.17l1.72-0.69l-0.86-2.43l-2.239-0.52L564.18,37.06L564.18,37.06z"/> \
	<path id="bell" d="M573.99,33.59l-1.89-0.35l-1.72,1.74l0.859,1.56l0.521,2.43l2.24-1.73l0.52-1.91L573.99,33.59L573.99,33.59z"/> \
	<path id="novaya_zemlya_north" d="M584.49,51.98l-0.52,2.43l-3.96,3.47l-8.44,1.91l-6.89,11.45l-1.21,3.3l6.89,1.74l1.03-4.16   l2.069-6.42l5.341-2.78l4.479-3.47l3.271-1.39h1.72v-4.68L584.49,51.98L584.49,51.98z"/> \
	<path id="novaya_zemlya_south" d="M562.28,77.31l4.65,0.52l1.55,5.38l3.96,4.16l-1.38,2.78h-2.41l-2.24-2.6l-4.989-0.17l-2.07-2.78   v-1.91l3.1-0.87L562.28,77.31L562.28,77.31z"/> \
	<path id="komsomolets" d="M634.949,18.15l-2.239-1.39h-2.58l-0.521,1.56l-2.75,1.56l-2.07,0.69l-0.34,2.08l4.82,0.35L634.949,18.15   L634.949,18.15z"/> \
	<path id="october" d="M640.28,18.67l-1.21,2.6l-2.41-0.17l-3.79,2.78l-1.029,3.47h2.41l1.38-2.26l3.27,2.43L642,26.13l2.239-1.91   l-0.859-2.95l-1.21-2.08L640.28,18.67L640.28,18.67z"/> \
	<path id="bolshevik" d="M645.28,20.58l1.21,4.86l1.891,4.51l2.069-3.64l3.96-0.87v-2.6l-2.579-1.91L645.28,20.58L645.28,20.58z"/> \
	<path id="kotelny" d="M739.76,12.8l2.689,2.26l1.91-0.79l0.561-3.17L741,8.39l-2.58,1.7l-6.28,0.57v2.83l-6.62,0.11v4.63l7.74,5.76   l2.02-1.47l-0.45-4.07l4.94-1.24l-1.01-1.92l-1.79-1.81L739.76,12.8L739.76,12.8z"/> \
	<path id="novaya_sibir" d="M746.94,10.09l1.79,3.39l6.96-0.79l1.91-2.49l-0.45-2.15l-1.91-0.79l-1.79,1.36l-5.16,1.13L746.94,10.09   L746.94,10.09z"/> \
	<path id="lyakhovsky" d="M746.49,23.31l-3.479-0.9L741,24.56l-0.9,2.94l4.71-0.45l3.59-1.81L746.49,23.31L746.49,23.31z"/> \
	<path id="wrangel" d="M836.68,3.76l-2.92-0.9L830.4,4.1l-1.68,2.49l2.13,2.83l5.609-2.49l1.121-1.24L836.68,3.76L836.68,3.76z"/> \
	<path id="russia" d="M817.97,72.93l1.76,6.08l3.521,1.01l3.52-5.57l-2.01-3.8l0.75-3.29h5.279l-1.26,2.53l0.5,9.12l-7.54,18.74   l0.75,4.05l-0.25,6.84l14.07,20.51l2.76,0.76l0.25-16.71l2.761-2.53l-3.021-6.58l2.51-2.79l-5.53-7.34l-3.02,0.25l-1-12.15   l7.79-2.03l0.5-3.55l4.021-1.01l2.26,2.03l2.76-11.14l4.77-8.1l3.771-2.03l3.271,0.25v-3.8l-5.28-1.01l-7.29-6.08l3.52-4.05   l-3.02-6.84l2.51-2.53l3.02,4.05l7.541,2.79l8.289,0.76l1.011-3.54l-4.271-4.3l4.771-6.58l-10.811-3.8l-2.76,5.57l-3.521-4.56   l-19.85-6.84l-18.85,3.29l-2.761,1.52v1.52l4.021,2.03l-0.5,4.81l-7.29-3.04l-16.08,6.33l-2.76-5.82H780.49l-5.029,5.32   l-17.841-4.05l-16.33,3.29l-2.01,5.06l2.51,0.76l-0.25,3.8l-15.829,1.77l1.01,5.06l-14.58-2.53l3.52-6.58l-14.83-0.76l1.261,6.84   l-4.771,2.28l-4.02-3.8l-16.33,2.79l-6.28,5.82l-0.25,3.54l-4.02,0.25l-0.5-4.05l12.819-11.14v-7.6l-8.29-2.28l-10.81,3.54   l-4.521-4.56h-2.01l-2.51,5.06l2.01,2.28l-14.33,7.85l-12.31,9.37l-7.54,10.38v4.3l8.04,3.29l-4.021,3.04l-8.54-3.04l-3.52,3.04   l-5.28-6.08l-1.01,2.28l5.779,18.23l1.511,0.51l4.02-2.03l2.011,1.52v3.29l-3.771-1.52l-2.26,1.77l1.51,3.29l-1.26,8.61l-7.79,0.76   l-0.5-2.79l4.52-2.79l1.011-7.6l-5.03-6.58l-1.76-11.39l-8.04-1.27l-0.75,4.05l1.51,2.03l-3.271,2.79l1.261,7.6l4.77,2.03   l1.01,5.57l-4.779-3.04l-12.311-2.28l-1.51,4.05l-9.8,3.54l-1.51-2.53l-12.82,7.09l-0.25,4.81l-5.03,0.76l1.51-3.54v-3.54   l-5.029-1.77l-3.271,1.27l2.76,5.32l2.011,3.54v2.79l-3.771-0.76l-0.75-0.76l-3.77,4.05l2.01,3.54l-8.54-0.25l2.76,3.55l-0.75,1.52   h-4.52l-3.271-2.28l-0.75-6.33l-5.28-2.03v-2.53l11.061,2.28l6.03,0.51l2.51-3.8l-2.26-4.05l-16.08-6.33l-5.551,1.38l-1.899,1.63   l0.59,3.75l2.36,0.41l-0.551,5.9l7.28,17.1l-5.26,8.34l-0.36,1.88l2.67,1.88l-2.409,1.59l-1.601,0.03l0.3,7.35l2.21,3.13l0.03,3.04   l2.83,0.26l4.33,1.65l4.58,6.3l0.05,1.66l-1.49,2.55l3.42-0.19l3.33,0.96l4.5,6.37l11.08,1.01l-0.479,7.58l-3.82,3.27l0.79,1.28   l-3.77,4.05l-1,3.8l2.26,3.29l7.29,2.53l3.02-1.77l19.351,7.34l0.75-2.03l-4.021-3.8v-4.81l-2.51-0.76l0.5-4.05l4.02-4.81   l-7.21-5.4l0.5-7.51l7.71-5.07l9.051,0.51l1.51,2.79l9.3,0.51l6.79-3.8l-3.521-3.8l0.75-7.09l17.591-8.61l13.529,6.1l4.521-4.05   l13.32,12.66l10.05-1.01l3.52,3.54l9.55,1.01l6.28-8.61l8.04,3.55l4.271,0.76l4.27-3.8l-3.77-2.53l3.27-5.06l9.3,3.04l2.011,4.05   l4.02,0.25l2.51-1.77l6.79-0.25l0.75,1.77l7.79,0.51l5.28-5.57l10.81,1.27l3.271-1.27l1-6.08l-3.271-7.34l3.271-2.79h10.3   l9.8,11.65l12.561,7.09h3.77l0.5-3.04l4.521-2.79l0.5,16.46l-4.021,0.25v4.05l2.26,2.79l-0.42,3.62l1.67,0.69l1.011-2.53l1.51,0.51   l1,1.01l4.521-1.01l4.52-13.17l0.5-16.46l-5.78-13.17l-7.29-8.86l-3.52,0.51v2.79l-8.54-3.29l3.27-7.09l2.761-18.74l11.56-3.54   l5.53-3.54h6.03L805.86,96l1.51,2.53l5.28-5.57l3.021,0.25l-0.5-3.29l-4.78-1.01l3.27-11.9L817.97,72.93L817.97,72.93z"/> \
	<path id="kazakhstan" d="M576.69,188.62l4.1-1.75l4.58-0.16l0.32,7h-2.68l-2.05,3.34l2.68,4.45l3.95,2.23l0.359,2.55l1.45-0.48   l1.34-1.59l2.21,0.48l1.11,2.23h2.84v-2.86l-1.74-5.09l-0.79-4.13l5.051-2.23l6.79,1.11l4.26,4.29l9.63-0.95l5.37,7.63l6.31,0.32   l1.74-2.86l2.21-0.48l0.32-3.18l3.31-0.16l1.74,2.07l1.74-4.13l14.99,2.07l2.52-3.34l-4.26-5.25l5.68-12.4l4.58,0.32l3.16-7.63   l-6.311-0.64l-3.63-3.5l-10,1.16l-12.88-12.45l-4.54,4.03l-13.77-6.25l-16.891,8.27l-0.47,5.88l3.95,4.61l-7.7,4.35l-9.99-0.22   l-2.09-3.07l-7.83-0.43l-7.42,4.77l-0.16,6.521L576.69,188.62L576.69,188.62z"/> \
	<path id="norway" d="M515.46,102.14l2.02-1.48L517.3,99l-1.28-0.74l0.18-2.03h1.101v-1.11l-4.771-1.29l-7.15,0.74l-0.729,3.14   L503,97.16l-1.101-1.85l-3.49,0.18l-0.37,3.51l-1.649,0.74l-0.92-1.85l-7.34,5.91l1.47,1.66l-2.75,1.29l-6.24,12.38l-2.2,1.48   l0.181,1.11l2.199,1.11l-0.55,2.4l-3.67-0.19l-1.1-1.29l-2.38,2.77l-1.471,1.11l-0.369,2.59l-1.28,0.74l-3.3,0.74l-1.65,5.18   l1.1,8.5l1.28,3.88l1.47,1.48l3.301-0.18l4.77-4.62l1.83-3.14l0.55,4.62l3.12-5.54l0.18-15.53l2.54-1.6l0.761-8.57l7.699-11.09   l3.67-1.29l1.65-2.03l5.5,1.29l2.75,1.66l0.92-4.62l4.59-2.77L515.46,102.14L515.46,102.14z"/> \
	<path id="britain" d="M446.119,149.08l-1.83,2.77l0.73,1.11h4.22v1.85l-1.1,1.48l0.729,3.88l2.381,4.62l1.829,4.25l2.931,1.11   l1.279,2.22l-0.18,2.03l-1.83,1.11l-0.18,0.92l1.28,0.74l-1.101,1.48l-2.569,1.11l-4.95-0.55l-7.71,3.51l-2.57-1.29l7.34-4.25   l-0.92-0.55l-3.85-0.37l2.38-3.51l0.37-2.96l3.12-0.37l-0.551-5.73l-3.67-0.18l-1.1-1.29l0.18-4.25l-2.2,0.18l2.2-7.39l4.04-2.96   L446.119,149.08L446.119,149.08z"/> \
	<path id="ulster" d="M438.42,161.47l-3.301,0.37l-0.18,2.96l2.2,1.48l2.38-0.55l0.92-1.66L438.42,161.47L438.42,161.47z"/> \
	<path id="ireland" d="M439.51,166.55l-0.91,6l-8.07,2.96h-2.57l-1.829-1.29v-1.11l4.04-2.59l-1.101-2.22l0.181-3.14l3.489,0.18   l1.601-3.76l-0.21,3.34l2.71,2.15L439.51,166.55L439.51,166.55z"/> \
	<path id="sweden" d="M497.72,104.58l1.96,1.81h3.67l2.02,3.88l0.551,6.65l-4.95,3.51v3.51l-3.49,4.81l-2.021,0.18l-2.75,4.62   l0.181,4.44l4.77,3.51l-0.37,2.03l-1.83,2.77l-2.75,2.4l0.181,7.95l-4.22,1.48l-1.471,3.14h-2.02l-1.101-5.54l-4.59-7.04   l3.771-6.31l0.26-15.59l2.6-1.43l0.631-8.92l7.409-10.61L497.72,104.58L497.72,104.58z"/> \
	<path id="finland" d="M506.789,116.94l2.07,0.91l1.28,2.4l-1.28,1.66l-6.42,7.02l-1.1,3.7l1.47,5.36l4.95,3.7l6.6-3.14l5.32-0.74   l4.95-7.95l-3.67-8.69l-3.49-8.32l0.55-5.36l-2.2-0.37l-0.569-3.91l-2.961-4.83l-3.279,2.27l-1.29,5.27l-3.48-2.09l-4.84-1.18   l-1.08,1.26l1.86,1.68l3.39-0.06l2.73,4.41L506.789,116.94L506.789,116.94z"/> \
	<path id="estonia_1_" d="M518.07,151.37l-6.85-1.11l0.149,3.83l6.351,3.88l2.6-0.76l-0.149-2.92L518.07,151.37L518.07,151.37z"/> \
	<path id="hiumaa" d="M506.76,147.64l-1.55-0.05l-0.9,0.91l0.65,0.96l1.55,0.1l0.8-1.16L506.76,147.64L506.76,147.64z"/> \
	<path id="saaremaa" d="M506.61,151.72l-1.5-0.15l-2.7,3.23v1.51l0.9,0.35l1.75,0.05l2.899-2.37l0.4-0.81L506.61,151.72   L506.61,151.72z"/> \
	<path id="lithuania" d="M510.81,154.7l-2.15-0.05l-2.95,2.82h-2.5l0.15,3.53l-1.5,2.77l5.4,0.05l1.55-0.2l1.55,1.87l3.55-0.15   l3.4-4.33l-0.2-2.57L510.81,154.7L510.81,154.7z"/> \
	<path id="belarus" d="M510.659,166.29l1.5,2.47l-0.6,1.97l0.1,1.56l0.551,1.87l3.1-1.76l3.85,0.1l2.7,1.11h6.85l2-4.79l1.2-1.81   v-1.21l-4.3-6.05l-3.8-1.51l-3.1-0.35l-2.7,0.86l0.1,2.72l-3.75,4.74L510.659,166.29L510.659,166.29z"/> \
	<path id="poland" d="M511.459,174.76l0.851,1.56l0.2,1.66l-0.7,1.61l-1.601,3.08l-1.35,0.61l-1.75-0.76l-1.05,0.05l-2.55,0.96   l-2.9-0.86l-4.7-3.33l-4.6-2.47l-1.851-2.82l-0.35-6.65l3.6-3.13l4.7-1.56l1.75-0.2l-0.7,1.41l0.45,0.55l7.91,0.15l1.7-0.05   l2.8,4.29l-0.7,1.76l0.301,2.07L511.459,174.76L511.459,174.76z"/> \
	<path id="spain" d="M448.36,205h-12.74l-2.569-1.16l-1.24,0.09l-1.5,3.12l0.53,3.21l4.869,0.45l0.62,2.05l-2.12,11.95l0.091,2.14   l3.45,1.87l3.979,0.271l7.96-1.96l3.89-4.9l0.091-4.99l6.899-6.24l0.351-2.76l-6.28-0.09L448.36,205L448.36,205z"/> \
	<path id="portugal" d="M430.93,211.24l-0.62,8.65l-1.771,1.6l0.181,0.98l1.239,2.05l-0.8,2.5l1.33,0.45l3.101-0.36l-0.181-2.5   l2.03-11.59l-0.439-1.6L430.93,211.24L430.93,211.24z"/> \
	<path id="majorca" d="M461.1,217.21l-1.59,0.54l0.35,1.43h2.3l0.971-1.07L461.1,217.21L461.1,217.21z"/> \
	<path id="sardinia" d="M477.56,213.38l-2.65,1.34l0.351,5.17l2.12,0.36l1.59-1.52v-4.9L477.56,213.38L477.56,213.38z"/> \
	<path id="corsica" d="M477.829,206.96l-1.949,1.96l-0.181,1.78l1.59,0.98l0.62-0.09l0.351-2.59L477.829,206.96L477.829,206.96z"/> \
	<path id="france" d="M460.4,178.7l-2.21,0.54l-4.42,4.81l-1.33,0.09l-1.77-1.25l-1.15,0.27l-0.88,2.76l-6.46,0.18l0.18,1.43   l4.42,2.94l5.13,4.1l-0.09,4.9l-2.739,4.81l5.93,2.85l6.02,0.18l1.86-2.14l3.8,0.09l1.061,0.98l3.8-0.271l1.95-2.5l-2.48-2.94   l-0.18-1.87l0.529-2.05l-1.239-1.78l-2.12,0.62l-0.271-1.6l4.69-5.17v-3.12l-3.101-1.78l-1.59-0.27L460.4,178.7L460.4,178.7z"/> \
	<path id="netherlands" d="M470.09,168.27l-4.53,2.23l0.96,0.87l0.1,2.23l-0.96-0.19l-1.06-1.65l-2.53,4.01l3.891,0.81l1.449,1.53   l0.771,0.02l0.51-3.46l2.45-1.03L470.09,168.27L470.09,168.27z"/> \
	<path id="belgium" d="M461.61,176.52l-0.64,1.6l6.88,4.54l1.979,0.47l0.07-2.15l-1.729-1.94h-1.061l-1.45-1.65L461.61,176.52   L461.61,176.52z"/> \
	<path id="germany" d="M471.14,167.88l3.57-0.58v-2.52l2.989-0.49l1.641,1.65l1.729,0.19l2.7-1.17l2.41,0.68l2.12,1.84l0.29,6.89   l2.12,2.82l-2.79,0.39l-4.631,2.91l0.391,0.97l4.14,3.88l-0.29,1.94l-3.85,1.939l-3.57,0.1l-0.87,1.84h-1.83l-0.87-1.94l-3.18-0.78   l-0.1-3.2l-2.7-1.84l0.29-2.33l-1.83-2.52l0.48-3.3l2.5-1.17L471.14,167.88L471.14,167.88z"/> \
	<path id="denmark" d="M476.77,151.5l-4.15,4.59l-0.149,2.99l1.89,4.93l2.96-0.56l-0.37-4.03l2.04-2.28l-0.04-1.79l-1.439-3.73   L476.77,151.5L476.77,151.5z"/> \
	<path id="sjælland" d="M481.44,159.64l-0.93-0.04l-1.221,1.12l0.15,1.75l2.89,0.08l0.15-1.98L481.44,159.64L481.44,159.64z"/> \
	<path id="gotland" d="M498.49,150.17l-2.109,1.67l1.06,2.45l1.87-1.82L498.49,150.17L498.49,150.17z"/> \
	<path id="switzerland" d="M472.909,189.38l-4.359,4.64l0.09,0.47l1.79-0.56l1.609,2.24l2.721-0.96l1.88,1.46l0.77-0.44l2.32-3.64   l-0.59-0.56l-2.29-0.06l-1.11-2.27L472.909,189.38L472.909,189.38z"/> \
	<path id="czech" d="M488.43,184.87h2.97h1.46l2.37,1.69l4.39-3.65l-4.26-3.04l-4.22-2.04l-2.89,0.52l-3.921,2.52L488.43,184.87   L488.43,184.87z"/> \
	<path id="slovakia" d="M495.84,187.13l0.689,0.61l0.09,1.04l7.631-0.17l5.64-2.43l-0.09-2.47l-1.08,0.48l-1.55-0.83l-0.95-0.04   l-2.5,1l-3.4-0.82L495.84,187.13L495.84,187.13z"/> \
	<path id="austria" d="M480.63,190.12l-0.65,1.35l0.56,0.96l2.33-0.48h1.98l2.15,1.82l4.569-0.83l3.36-2l0.859-1.35l-0.13-1.74   l-3.02-2.26l-4.05,0.04l-0.34,2.3l-4.261,2.08L480.63,190.12L480.63,190.12z"/> \
	<path id="hungary" d="M496.74,189.6l-1.16,1.82l0.091,2.78l1.85,0.95l5.689,0.17l7.931-6.68l0.04-1.48l-0.86-0.43l-5.729,2.6   L496.74,189.6L496.74,189.6z"/> \
	<path id="slovenia" d="M494.8,191.99l-2.54,1.52l-4.74,1.04l0.95,2.74l3.319,0.04l3.061-2.56L494.8,191.99L494.8,191.99z"/> \
	<path id="croatia" d="M495.619,195.16l-3.529,2.91h-3.58l-0.431,2.52l1.641,0.43l0.819-1.22l1.291,1.13l1.029,3.6l7.07,3.3l0.7-0.8   l-7.17-7.4l0.729-1.35l6.811-0.26l0.689-2.17l-4.439,0.13L495.619,195.16L495.619,195.16z"/> \
	<path id="bosnia" d="M494.8,198.94l-0.37,0.61l6.71,6.92l2.46-3.62l-0.09-1.43l-2.15-2.61L494.8,198.94L494.8,198.94z"/> \
	<path id="italy" d="M472.27,196.98l-0.62,1.57l0.17,1.71l2.391,2.79l3.76-0.13l8.3,9.64l5.18,1.5l3.061,2.89l0.729,6.59l1.641-0.96   l1.42-3.59l-0.351-2.58l2.431-0.22l0.35-1.46l-6.85-3.28l-6.5-6.39l-2.591-3.82l-0.63-3.63l3.311-0.79l-0.851-2.39l-2.029-1.71   l-1.75-0.08l-2.44,0.67l-2.3,3.22l-1.39,0.92l-2.15-1.32L472.27,196.98L472.27,196.98z"/> \
	<path id="sicily" d="M492.44,223.02l-1.45-0.78l-4.95,0.78l0.17,1.34l4.45,2.24l0.67,0.73l1.171,0.17L492.44,223.02L492.44,223.02z   "/> \
	<path id="malta" d="M492.61,230.47l-1.67,0.34l0.061,1.85l1.5,0.5l0.67-0.56L492.61,230.47L492.61,230.47z"/> \
	<path id="ukraine" d="M515.57,173.15l-2.899,1.63l0.72,3.08l-2.681,5.65l0.021,2.49l1.26,0.8l8.08,0.4l2.26-1.87l2.42,0.81   l3.471,4.63l-2.54,4.56l3.02,0.88l3.95-4.55l2.26,0.41l2.101,1.46l-1.851,2.44l2.5,3.9h2.66l1.37-2.6l2.82-0.57l0.08-2.11   l-5.24-0.81l0.16-2.271h5.08l5.479-4.39l2.42-2.11l0.4-6.66l-10.8-0.97l-4.431-6.25l-3.06-1.05l-3.71,0.16l-1.67,4.13l-7.601,0.1   l-2.47-1.14L515.57,173.15L515.57,173.15z"/> \
	<path id="moldova" d="M520.75,187.71l3.1,4.77l-0.26,2.7l1.109,0.05l2.63-4.45l-3.159-3.92l-1.79-0.74L520.75,187.71L520.75,187.71   z"/> \
	<path id="romania" d="M512.18,187.6l-0.26,1.48l-5.79,4.82l4.84,7.1l3.1,2.17h5.58l1.84-1.54l2.47-0.32l1.841,1.11l3.26-3.71   l-0.63-1.86l-3.311-0.85l-2.26-0.11l0.11-3.18l-3-4.72L512.18,187.6L512.18,187.6z"/> \
	<path id="serbia_and_montenegro" d="M505.55,194.54l-2.05,1.54h-1l-0.681,2.12l2.42,2.81l0.16,2.23l-3,4.24l0.42,1.27l1.74,0.32   l1.37-1.86l0.74-0.05l1.26,1.22l3.84-1.17l-0.32-5.46L505.55,194.54L505.55,194.54z"/> \
	<path id="bulgaria" d="M511.44,202.39l0.16,4.98l1.68,3.5l6.311,0.11l2.84-2.01l2.79-1.11l-0.681-3.18l0.631-1.7l-1.42-0.74   l-1.95,0.16l-1.53,1.54l-6.42,0.05L511.44,202.39L511.44,202.39z"/> \
	<path id="albania" d="M504.02,209.76v4.61l1.32,2.49l0.949-0.11l1.631-2.97l-0.95-1.33l-0.37-3.29l-1.26-1.17L504.02,209.76   L504.02,209.76z"/> \
	<path id="macedonia" d="M510.92,208.01l-3.37,1.11l0.16,2.86l0.79,1.01l4-1.86L510.92,208.01L510.92,208.01z"/> \
	<path id="greece" d="M506.709,217.6l-0.109,1.33l4.63,2.33l2.21,0.85l-1.16,1.22l-2.58,0.26l-0.369,1.17l0.89,2.01l2.89,1.54   l1.26,0.11l0.16-3.45l1.891-2.28l-5.16-6.1l0.68-2.07l1.21-0.05l1.84,1.48l1.16-0.58l0.37-2.07l5.42,0.05l0.21-3.18l-2.26,1.59   l-6.63-0.16l-4.311,2.23L506.709,217.6L506.709,217.6z"/> \
	<path id="thrace" d="M523.02,209.7l-0.16,3.55l3.101-0.95l1.42-0.95l-0.42-1.54l-1.471-1.17L523.02,209.7L523.02,209.7z"/> \
	<path id="crete" d="M516.76,230.59l1.63,0.05l0.68,1.01h2.37l1.58-0.58l0.53,0.64l-1.05,1.38l-4.631,0.16l-0.84-1.11l-0.89-0.53   L516.76,230.59L516.76,230.59z"/> \
	<path id="iturup" d="M830.86,160.45l-2.68,3.76l0.189,1.83l1.34-0.58l3.15-3.95L830.86,160.45L830.86,160.45z"/> \
	<path id="urup" d="M834.4,154.96l-0.96,2.6l0.1,1.73l1.631-1.06l1.529-3.08V154L834.4,154.96L834.4,154.96z"/> \
	<path id="paramushir" d="M840.039,132.03l-1.239,1.54l0.1,2.41l1.15-0.1l1.909-3.37L840.039,132.03L840.039,132.03z"/> \
	<path id="onekotan" d="M837.75,137.91v4.24l1.34,0.48l0.96-1.54v-3.27L837.75,137.91L837.75,137.91z"/> \
	<path id="sakhalin" d="M798.64,122.59l-0.09,6.17l7.739,11.95l2.771,10.4l4.88,9.25l1.91,0.67l1.63-1.35l0.76-2.22l-6.979-7.61   l0.189-3.95l1.53-0.67l0.38-2.31l-13.67-19.36L798.64,122.59L798.64,122.59z"/> \
	<path id="bering_island" d="M852.57,103.42l-1.91,0.19l1.15,1.64l2.39,1.64l0.67-0.77L852.57,103.42L852.57,103.42z"/> \
	<path id="medny" d="M856.289,104.58l0.29,1.64l2.96,0.87l0.29-1.16L856.289,104.58L856.289,104.58z"/> \
	<path id="attu" d="M872.539,110.87l1.25,2.24l2.08-0.14l0.42-1.54L872.539,110.87L872.539,110.87z"/> \
	<path id="greenland" d="M321.13,50.07l-1.36,2.17l2.45,2.45l-1.09,2.45l3.54,4.62l4.35-1.36l5.71-0.54l6.53,7.07l4.35,11.69   l-3.529,7.34l4.89-0.82l2.72,1.63l0.271,3.54l-5.98,0.27l3.261,3.26l4.079,0.82l-8.97,11.96l-1.09,7.34l1.9,5.98l-1.36,3.54   l2.45,7.61l4.62,5.17l1.359-0.27l2.99-0.82l0.27,4.35l1.9,2.72l3.53-0.271l2.72-10.06l8.16-10.06l12.24-4.89l7.609-9.52l3.53,1.63   h7.34l5.98-5.98l7.34-2.99l0.819-4.62l-4.62-4.08l-4.079-1.36l-2.181-5.71l5.17-2.99l8.16,4.35l2.721-2.99l-4.351-2.45l9.25-12.51   l-1.63-5.44l-4.35-0.27l1.63-4.89l5.439-2.45l11.15-9.79l-3.26-3.53l-12.511,1.09l-6.529,6.53l3.81-8.43l-4.35-1.09l-2.45,4.35   l-3.53-2.99l-9.79,1.09l2.72-4.35l16.04-0.54l-4.08-5.44l-17.399-3.26l-7.07,1.09l0.271,3.54l-7.34-2.45l0.27-2.45l-5.17,1.09   l-1.09,2.72l5.439,1.9l-5.71,4.08l-4.079-4.62l-5.71-1.63l-0.82,4.35h-5.71l-2.181-4.62l-8.97-1.36l-4.89,2.45l-0.271,3.26   l-6.25-0.82l-3.81,1.63l0.27,3.81v1.9l-7.069,1.36l-3.261-2.17l-2.18,3.53l3.26,3.54l6.801-0.82l0.54,2.18l-5.171,2.45   L321.13,50.07L321.13,50.07z"/> \
	<path id="milne" d="M410.869,85.69l4.62,1.36l-0.27,3.81l-4.891-2.45l-1.09-1.36L410.869,85.69L410.869,85.69z"/> \
</g> \
</svg> \
'

            
            function worldMap(container) {
                container.selectAll("svg").remove();
                container.html(world);
                container.selectAll("g").each(function(){
                    var g = d3.select(this);
                    var region = g.attr("id");
                    g.selectAll("path")
                        .datum(function(){
                            return {
                                "geo.name": d3.select(this).attr("id"), 
                                "geo.region": region, 
                            }
                        })
                })
            };
            
            return worldMap;
        }();
        
        

        
    }; 

}).call(this);
//# sourceMappingURL=vizabi.js.map