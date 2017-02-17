import { forEach, warn } from "base/utils";

let initializing = false;
const fnTest = /xyz/.test(() => {
  let xyz;
}) ? /\b_super\b/ : /.*/;

function extend(name, extensions) {

  //in case there are two args
  extensions = arguments.length === 1 ? name : extensions;
  const _super = this.prototype;
  initializing = true;
  const prototype = new this();
  initializing = false;

  forEach(extensions, (method, name) => {
    if (typeof extensions[name] === "function" && typeof _super[name] === "function" && fnTest.test(extensions[name])) {
      prototype[name] = (function(name, fn) {
        return function() {
          const tmp = this._super;
          this._super = _super[name];
          const ret = fn.apply(this, arguments);
          this._super = tmp;
          return ret;
        };
      })(name, extensions[name]);
    } else {
      prototype[name] = method;
    }
  });

  function Class() {
    if (this.trackInstances)
      Class.instances.push(this);
    if (!initializing && this.init) {
      this.init(...arguments);
    }
  }

  // Populate our constructed prototype object
  Class.prototype = prototype;
  Class.prototype.constructor = Class;
  Class.extend = extend;

  Class._collection = {};
  Class.instances = [];
  Class.register = function(name, code) {
    if (typeof this._collection[name] !== "undefined") {
      warn('"' + name + '" is already registered. Overwriting...');
    }
    this._collection[name] = code;
  };

  Class.unregister = function(name) {
    this._collection[name] = void 0;
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
      warn('"' + name + '" was not found.');
    }
    return false;
  };
  //register extension by name
  if (arguments.length > 1 && this.register) {
    this.register(name, Class);
  }
  return Class;
}

const Class = function() {};
Class.extend = extend;

export default Class;
