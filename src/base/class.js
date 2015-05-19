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

    function extend(extensions) {
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

        return Class;
    }

	Vizabi.Class = function() {};
	Vizabi.Class.extend = extend;

}).call(this);