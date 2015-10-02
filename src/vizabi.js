import utils from './base/utils';
import Tool from './base/tool';
import Component from './base/component';
import Model from './base/model';
import Reader from './base/reader';
import globals from './base/globals';
import BubbleChart from './tools/bubblechart/bubblechart';

//available readers
import { csv, json, inline, waffle } from './readers/_index';

//availabel readers
Reader.register('csv', csv);
Reader.register('json', json);
Reader.register('inline', inline);
Reader.register('waffle', waffle);

var Vizabi = function(tool, placeholder, options) {
  return startTool(tool, placeholder, options);
};

//TODO: make this configurable
Vizabi._version = "0.8.1";

//stores reference to each tool on the page
Vizabi._instances = {};

//stores global variables accessible by any tool or component
Vizabi._globals = globals;

//stores global variables accessible by any tool or component

function startTool(name, placeholder, options) {
  var tool = Tool.get(name);
  if(tool) {
    var t = new tool(placeholder, options);
    Vizabi._instances[t._id] = t;
    return t;
  } else {
    utils.error('Tool "' + name + '" was not found.');
  }
}

//TODO: clear all objects and intervals as well
//garbage collection
Vizabi.clearInstances = function(id) {
  if(id) {
    Vizabi._instances[id] = void 0;
  } else {
    for(var i in Vizabi._instances) {
      Vizabi._instances[i].clear();
    }
    Vizabi._instances = {};
  }
};

(function(){})(BubbleChart);

/*
 * throws a warning if the required variable is not defined
 * returns false if the required variable is not defined
 * returns true if the required variable is defined
 * @param variable
 * @returns {Boolean}
 */
Vizabi._require = function(variable) {
  if(typeof root[variable] === 'undefined') {
    utils.warn(variable + ' is required and could not be found.');
    return false;
  }
  return true;
};

//makes all objects accessible
Vizabi.Tool = Tool;
Vizabi.Component = Component;
Vizabi.Model = Reader;
Vizabi.Reader = Reader;

export default Vizabi;