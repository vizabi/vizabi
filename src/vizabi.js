import requireAll from 'helpers/requireAll';
import * as utils from 'base/utils';
import Tool from 'base/tool';
import Component from 'base/component';
import Model from 'base/model';
import Reader from 'base/reader';
import Events from 'base/events';
import globals from 'base/globals';

var Vzb = function(name, placeholder, external_model) {
  var tool = Tool.get(name);
  if(tool) {
    var t = new tool(placeholder, external_model);
    Vzb._instances[t._id] = t;
    return t;
  } else {
    utils.error('Tool "' + name + '" was not found.');
  }
};

//stores reference to each tool on the page
Vzb._instances = {};
//stores global variables accessible by any tool or component
Vzb._globals = globals;

//TODO: clear all objects and intervals as well
//garbage collection
Vzb.clearInstances = function(id) {
  if(id) {
    Vzb._instances[id] = void 0;
  } else {
    for(var i in Vzb._instances) {
      Vzb._instances[i].clear();
    }
    Vzb._instances = {};
  }
};

//available readers = all
const readers = requireAll(require.context('./readers', true, /\.js$/));

//register available readers
utils.forEach(readers, function(reader, name) {
  Reader.register(name, reader);
});

const components = requireAll(require.context('./components', true, /\.js$/), 1);

//register available components
utils.forEach(components, function(component, name) {
  Component.register(name, component);
});


//d3 addons

import genericLog from 'helpers/d3.genericLogScale';
import { onTap, onLongTap } from 'helpers/d3.touchEvents';
import * as touchFixes from 'helpers/d3.touchFixes';

d3.scale.genericLog = genericLog;
d3.selection.prototype.onTap = onTap;
d3.selection.prototype.onLongTap = onLongTap;

//TODO: Fix for scroll on mobile chrome on d3 v3.5.17. It must be retested/removed on d3 v4.x.x
//see explanation here https://github.com/vizabi/vizabi/issues/2020#issuecomment-250205191
d3.svg.brush = touchFixes.brush;
d3.behavior.drag = touchFixes.drag;
d3.behavior.zoom = touchFixes.zoom;

//makes all objects accessible
Vzb.Tool = Tool;
Vzb.Component = Component;
Vzb.Model = Model;
Vzb.Reader = Reader;
Vzb.Events = Events;
Vzb.utils = utils;

export default Vzb;
