/*!
 * VIZABI MAIN
 */
(function () {
  'use strict';
  var root = this;
  var previous = root.Vizabi;

  var Vizabi = function (tool, placeholder, options) {
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
  Vizabi.clearInstances = function (id) {
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
  Vizabi._require = function (variable) {
    if (typeof root[variable] === 'undefined') {
      Vizabi.utils.warn(variable + ' is required and could not be found.');
      return false;
    }
    return true;
  };

  //if AMD define
  if (typeof define === 'function' && define.amd) {
    define(function () {
      return Vizabi;
    });
  } else if (typeof module === 'object' && module.exports) {
    module.exports = Vizabi;
  }

  root.Vizabi = Vizabi;

}.call(this));
