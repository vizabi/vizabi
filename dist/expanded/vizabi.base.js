/* VIZABI - http://www.gapminder.org - 2015-05-28 */

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
         * checks whether obj is a date
         * @param {Object} obj
         * @returns {Boolean}
         */
        isDate: function(obj) {
            return (obj instanceof Date);
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
            if (this.isArray(obj)) {
                var i;
                for (i = 0; i < obj.length; i++) {
                    if (callback.apply(ctx, [obj[i], i]) === false) {
                        break;
                    }
                }
            } else {
                for (var item in obj) {
                    if (callback.apply(ctx, [obj[item], item]) === false) {
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
            if(this.isArray(src)) {
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
            return arr.filter(function(i) {
                for (var f in filter) {
                    if (i[f] !== filter[f]) return false;
                }
                return true;
            });
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
            }
            else if (value === false){
                this.removeClass(el, className);
            }
            else {
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
         * returns the values of an object in an array format
         * @param {Object} obj
         * @return {Array}
         */
        values: function(obj) {
            var arr;
            for (var i in obj) {
                (arr = arr || []).push(obj[i])
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
            if ('resolved' === this.status) throw Error('Illegal call.');

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
         * @param {Object} reader Which reader to use. E.g.: "local-json"
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
        init: function(config, parent) {

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
            var i;
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
                        var msg = "Vizabi Event: "+ name +" - "+ original;
                        utils.timeStamp(msg);
                        f.apply(_this, [(original || name), args]);
                    };

                    //TODO: improve readability of freezer code
                    //only execute if not frozen and exception doesnt exist
                    if (this._freeze || _freezeAllEvents) {
                        //if exception exists for freezing, execute
                        if ((_freezeAllEvents && _freezeAllExceptions.hasOwnProperty(name))
                            || (!_freezeAllEvents && this._freeze && this._freezeExceptions.hasOwnProperty(name))) {
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
        triggerAll: function(name, args) {
            if (utils.isArray(name)) {
                for (var i = 0, size = name.length; i < size; i++) {
                    this.triggerAll(name[i], args);
                }
            } else {
                var original = name;
                var parts = name.split(":");
                while (parts.length) {
                    this.trigger(name, args, original);
                    parts.pop();
                    name = parts.join(":");
                }
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

                _this.triggerAll(events, _this.getObject());
                _this._setting = false;

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
                //check if parent dependency is ready (virtual models)
                for (var i = 0; i < this._deps.parent.length; i++) {
                    this._deps.parent[i].setReady();
                }
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
                    var lastValue = _interpolateValue(this, filter, this.use, this.which);
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
            //the submodel has been set (only once)
            'set': function(evt, vals) {
                //its set
            },
            //the submodel has initialized (only once)
            'init': function(evt, vals) {
                // evt = evt.replace('init', 'init:' + name);
                // ctx.triggerAll(evt, ctx.getObject());
            },
            //the submodel has changed (multiple times)
            'change': function(evt, vals) {
                evt = evt.replace('change', 'change:' + name);
                ctx.triggerAll(evt, ctx.getObject());
            },
            //loading has started in this submodel (multiple times)
            'hook_change': function(evt, vals) {
                ctx.trigger(evt, ctx.getObject());
                ctx.setReady(false);
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

            //domReady alias
            var _this = this;
            this.on({
                'dom_ready': function() {
                    if (typeof _this.domReady === 'function') {
                        _this.domReady();
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
                this.trigger('dom_ready');
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
            var model = new Vizabi.Model(values, null, model_binds, true);
            afterSet();

            return model;

            function afterSet() {
                var submodels = model.getSubmodels();

                for (var submodel in model.get()) {

                    if (typeof model[submodel]._id === 'undefined') continue;

                    //closure to set up the submodel
                    (function(model, submodel) {

                        model[submodel].on({
                            //the submodel has been set (only once)
                            'set': function(evt, vals) {
                                //trigger only for submodel
                                evt = evt.replace('set', 'set:' + submodel);
                                model.trigger(evt, vals);

                                //check if all are ready
                                var rdy = true;
                                utils.forEach(submodels, function(sm) {
                                    if (sm._set !== true) rdy = false;
                                });
                                if (rdy) {
                                    model.trigger('set', vals)
                                }
                            },
                            //the submodel has initialized (only once)
                            'init': function(evt, vals) {
                                evt = evt.replace('init', 'init:' + submodel);
                                model.triggerAll(evt, model.getObject());
                            },
                            //the submodel has changed (multiple times)
                            'change': function(evt, vals) {
                                evt = evt.replace('change', 'change:' + submodel);
                                model.triggerAll(evt, model.getObject());
                            },
                            //loading has started in this submodel (multiple times)
                            'load_start': function(evt, vals) {
                                evt = evt.replace('load_start', 'load_start:' + submodel);
                                model.triggerAll(evt, vals);
                                model.setReady(false);
                            },
                            //loading has failed in this submodel (multiple times)
                            'load_error': function(evt, vals) {
                                evt = evt.replace('load_error', 'load_error:' + submodel);
                                model.triggerAll(evt, vals);
                            },
                            //the submodel is ready/loading has ended
                            'ready': function(evt, vals) {
                                //trigger only for submodel
                                evt = evt.replace('ready', 'ready:' + submodel);
                                model.trigger(evt, vals);

                                //try to set virtual model ready, then orig one
                                model.setReady();
                            }
                        });

                    })(model, submodel); //self executing function

                }
            }

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
            utils.forEach(strings, function(str) {
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
        domReady: function() {},

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

        for (var field in defaults) {

            var blueprint = defaults[field];
            var original = values[field];
            //specified type, default value and possible values
            var type = utils.isObject(blueprint) ? blueprint._type_ : null;
            var defs = utils.isObject(blueprint) ? blueprint._defs_ : null;
            var opts = utils.isObject(blueprint) ? blueprint._opts_ : null;

            //in case there's no type, just deep extend as much as possible
            if (!type) {
                if (typeof original === "undefined") {
                    values[field] = blueprint;
                } else if (utils.isObject(blueprint) && utils.isObject(original)) {

                    values[field] = defaultOptions(original, blueprint);
                }
                continue;
            }

            //otherwise, each case has special verification
            if (type === "number" && isNaN(original)) {
                values[field] = isNaN(defs) ? 0 : defs;
            } else if (type === "string" && typeof original !== 'string') {
                values[field] = (typeof defs === 'string') ? defs : "";
            } else if (type === "array" && !utils.isArray(original)) {
                values[field] = utils.isArray(defs) ? defs : [];
            } else if (type === "object" && !utils.isObject(original)) {
                values[field] = utils.isObject(defs) ? defs : {};
            } else if (type === "model" || type === "hook") {
                if (!utils.isObject(original)) {
                    values[field] = {};
                }
                values[field] = defaultOptions(values[field], defs);
            }

            //if possible values are determined, we should respect it
            if (utils.isArray(opts) && defs && opts.indexOf(values[field]) === -1) {
                utils.warn("Vizabi options contain invalid value for '" + field + "'. Permitted values: " + JSON.stringify(opts) + ". Changing to default");
                values[field] = defs;
            }
        }
        return values;
    }

    Tool.isTool = function(c) {
        return (c._id && c._id[0] === 't');
    }


    Vizabi.Tool = Tool;


}).call(this);