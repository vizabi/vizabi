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
                    callback.apply(ctx, [obj[i], i]);
                }
            } else {
                for (var item in obj) {
                    callback.apply(ctx, [obj[item], item]);
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
         * @returns {Array} unique items
         * http://stackoverflow.com/questions/1960473/unique-values-in-an-array
         */
        unique: function(arr) {
            var u = {},
                a = [];
            for (var i = 0, l = arr.length; i < l; ++i) {
                if (u.hasOwnProperty(arr[i])) {
                    continue;
                }
                a.push(arr[i]);
                u[arr[i]] = 1;
            }
            return a;
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
            if(options.method === "POST") {
                request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            }
            request.onload = function() {
                if (request.status >= 200 && request.status < 400) {
                    // Success!
                    var data = (options.json)? JSON.parse(request.responseText) : request.responseText;
                    if(options.success) options.success(data);
                } else {
                    if(options.error) options.error();
                }
            };
            request.onerror = function() {
                if(options.error) options.error();
            };
            request.send(options.data);
        },

        /*
         * Performs a GET http request
         */
        get: function(url, pars, success, error, json) {
            var pars = [];
            this.forEach(pars, function(value, key) {
                pars.push(key+"="+value);
            });
            url = (pars.length) ? url+"?"+pars.join("&") : url;
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