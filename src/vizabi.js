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

    function startTool(tool, placeholder, options) {
        var toolsCollection = Vizabi.Tool._collection;
        if (toolsCollection.hasOwnProperty(tool)) {
            var t = new toolsCollection[tool](placeholder, options);
            Vizabi._instances[t._id] = t;
            return t;
        } else {
            Vizabi.utils.warn("Tool " + tool + " was not found.");
        }
    }

    //TODO: clear all objects and intervals as well
    //garbage collection
    Vizabi.clearInstances = function(id) {
        if(id) {
            delete Vizabi._instances[id];
        }
        else {
            Vizabi._instances = {};
        }
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