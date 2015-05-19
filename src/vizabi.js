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

    //stores each registered tool
    Vizabi._tools = {};
    //stores reference to each tool on the page
    Vizabi._instances = {};

    function startTool(tool, placeholder, options) {
        if (Vizabi._tools.hasOwnProperty(tool)) {
            return Vizabi._tools[tool](tool, placeholder, options);
        } else {
            Vizabi.utils.warn("Tool " + tool + " was not found.");
        }
    }

    /*
     * registers a new tool to Vizabi
     * @param {String} toolname tool name
     * @param {Object} code
     */
    Vizabi.registerTool = function(toolname, code) {
        Vizabi._tools[toolname] = code;
    };

    /*
     * unregisters a tool in Vizabi
     * @param {String} toolname tool name
     */
    Vizabi.unregisterTool = function(toolname) {
        delete Vizabi._tools[toolname];
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

}).call(this);