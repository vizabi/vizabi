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