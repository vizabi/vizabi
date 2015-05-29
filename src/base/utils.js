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