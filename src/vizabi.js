import requireAll from "helpers/requireAll";
import * as utils from "base/utils";
import Tool from "base/tool";
import Component from "base/component";
import Model from "base/model";
import Reader from "base/reader";
import Events from "base/events";
import globals from "base/globals";

const Vzb = function(name, placeholder, external_model) {
  const tool = Tool.get(name);
  if (tool) {
    const t = new tool(placeholder, external_model);
    Vzb._instances[t._id] = t;
    return t;
  }
  utils.error('Tool "' + name + '" was not found.');
};

//stores reference to each tool on the page
Vzb._instances = {};
//stores global variables accessible by any tool or component
Vzb._globals = globals;

//TODO: clear all objects and intervals as well
//garbage collection
Vzb.clearInstances = function(id) {
  if (id) {
    Vzb._instances[id] = void 0;
  } else {
    for (const i in Vzb._instances) {
      Vzb._instances[i].clear();
    }
    Vzb._instances = {};
  }
};

//available readers = all
const readers = requireAll(require.context("./readers", true, /\.js$/));

//register available readers
utils.forEach(readers, (reader, name) => {
  Reader.register(name, reader);
});

const components = requireAll(require.context("./components", true, /\.js$/), 1);

//register available components
utils.forEach(components, (component, name) => {
  Component.register(name, component);
});


//d3 addons

import genericLog from "helpers/d3.genericLogScale";
import { onTap, onLongTap } from "helpers/d3.touchEvents";
//import * as touchFixes from 'helpers/d3.touchFixes';

//d3 v3 -> v4

// Copies a variable number of methods from source to target.
d3.rebind = function(target, source) {
  let i = 1, method;
  const n = arguments.length;
  while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
  return target;
};

// Method is assumed to be a standard D3 getter-setter:
// If passed with no arguments, gets the value.
// If passed with arguments, sets the value and returns the target.
function d3_rebind(target, source, method) {
  return function() {
    const value = method.apply(source, arguments);
    return value === source ? target : value;
  };
}

d3.scale = {};
d3.scale.linear = d3.scaleLinear;
d3.scale.sqrt = d3.scaleSqrt;
d3.scale.pow = d3.scalePow;
d3.scale.log = d3.scaleLog;
d3.scale.quantize = d3.scaleQuantize;
d3.scale.threshold = d3.scaleThreshold;
d3.scale.quantile = d3.scaleQuantile;
d3.scale.identity = d3.scaleIdentity;
d3.scale.ordinal = d3.scaleOrdinal;
d3.time = {};
d3.time.scale = d3.scaleTime;
d3.time.scale.utc = d3.scaleUtc;
d3.time.format = function(f) {
  const format = d3.timeFormat(f);
  format.parse = d3.timeParse(f);
  return format;
};
d3.time.format.utc = function(f) {
  const format = d3.utcFormat(f);
  format.parse = d3.utcParse(f);
  return format;
};
d3.time.format.iso = function(f) {
  const format = d3.isoFormat(f);
  format.parse = d3.isoParse(f);
  return format;
};
d3.round = function(x, n) {
  return n ? Math.round(x * (n = Math.pow(10, n))) / n : Math.round(x);
};


d3.scale.genericLog = genericLog;
d3.selection.prototype.onTap = onTap;
d3.selection.prototype.onLongTap = onLongTap;

//TODO: Fix for scroll on mobile chrome on d3 v3.5.17. It must be retested/removed on d3 v4.x.x
//see explanation here https://github.com/vizabi/vizabi/issues/2020#issuecomment-250205191
//d3.svg.brush = touchFixes.brush;
//d3.drag = touchFixes.drag;
//d3.behavior.zoom = touchFixes.zoom;

//makes all objects accessible
Vzb.Tool = Tool;
Vzb.Component = Component;
Vzb.Model = Model;
Vzb.Reader = Reader;
Vzb.Events = Events;
Vzb.utils = utils;

export default Vzb;
