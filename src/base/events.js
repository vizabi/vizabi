import * as utils from 'utils';
import Class from 'class';

var _freezeAllEvents = false;
var _frozenEventInstances = [];
var _freezeAllExceptions = {};

var Event = Class.extend({

  type: '',
  source: '',

  init: function() {
  }

});

var EventEmitter = Class.extend({

  /**
   * Initializes the event class
   */
  init: function() {
    this._id = this._id || utils.uniqueId('e');
    this._events = {};
    //freezing events
    this._freeze = false;
    this._freezer = [];
    this._freezeExceptions = {};
  },

  /**
   * Binds a callback function to an event
   * @param {String|Array} type type of event or array with types
   * @param {Function} func function to be linked with event
   */
  on: function(type, targetStr, func) {
    var i;
    //bind multiple functions at the same time
    if(utils.isArray(func)) {
      for(i = 0; i < func.length; i += 1) {
        this.on(type, targetStr, func[i]);
      }
      return;
    }
    //bind multiple events at a time to one function
    if(utils.isArray(targetStr)) {
      for(i = 0; i < targetStr.length; i += 1) {
        this.on(type, targetStr[i], func);
      }
      return;
    }
    // multiple at a time with object format
    if(utils.isObject(targetStr)) {
      for(i in targetStr) {
        this.on(type, i, targetStr[i]);
      }
      return;
    }
    // if target is nested
    var splitPos = targetStr.indexOf(':')
    if(splitPos !== -1) {
      var firstChild = targetStr.substr(0, splitPos);
      var furtherChildren = targetStr.substr(splitPos);
      if (this[firstChild])
        this[firstChild].on(type, furtherChildren, func);
      else 
        utils.warn('Can\'t bind event \'' + type + ', ' + targetStr + '\'. Can\'t find child "' + firstChild + '" of the current model.');
      return;
    }

    /*
    if(utils.isString(targetStr)) {
      // target is deeper (i.e. in a submodel, for a change event)
      targetParts = targetStr.split(':');
      for (i = 0; i < (targetParts.length-1); i++) {
      }
    // if target is not given
    } else {
      func = targetStr;
    }*/
    // on('change', 'marker:axis_x:min');

    this._events[type] = this._events[type] || [];
    if(typeof func === 'function') {
      this._events[type].push(func);
    } else {
      utils.warn('Can\'t bind event \'' + type + '\'. It must be a function.');
    }


  },

  /**
   * Unbinds all events associated with a name or a specific one
   * @param {String|Array} name name of event or array with names
   */
  unbind: function(name) {
    //unbind multiple at a time
    if(utils.isArray(name)) {
      for(var i = 0; i < name.length; i += 1) {
        this.unbind(name[i]);
      }
      return;
    }
    if(this._events.hasOwnProperty(name)) {
      this._events[name] = [];
    }
  },

  /**
   * Unbinds all events
   */
  unbindAll: function() {
    this._events = {};
  },

  /**
   * Triggers an event, adding it to the buffer
   * @param {String|Array} name name of event or array with names
   * @param args Optional arguments (values to be passed)
   */
  trigger: function(name, args, original) {
    var i;
    var size;
    if(utils.isArray(name)) {
      for(i = 0, size = name.length; i < size; i += 1) {
        this.trigger(name[i], args);
      }
    } else {

      if(!this._events.hasOwnProperty(name)) {
        return;
      }
      for(i = 0; i < this._events[name].length; i += 1) {

        var eventPath = original || name;

        var f = this._events[name][i].f;
        var origin = this._events[name][i].origin;

        //Concatenate original name with eventPath
        var eventPathParts = origin.concat(eventPath.split(':'));
        eventPath = utils.unique(eventPathParts).join(':');

        //if not in buffer, add and execute
        var _this = this;
        var execute = function() {
          var msg = 'Vizabi Event: ' + name + ' - ' + eventPath;
          utils.timeStamp(msg);
          f.apply(_this, [
            eventPath,
            args
          ]);
        };
        //TODO: improve readability of freezer code
        //only execute if not frozen and exception doesnt exist
        if(this._freeze || _freezeAllEvents) {
          //if exception exists for freezing, execute
          if(_freezeAllEvents && _freezeAllExceptions.hasOwnProperty(name) || !_freezeAllEvents && this._freeze &&
            this._freezeExceptions.hasOwnProperty(name)) {
            execute();
          } //otherwise, freeze it
          else {
            this._freezer.push(execute);
            if(_freezeAllEvents && !_frozenEventInstances[this._id]) {
              this.freeze();
              _frozenEventInstances[this._id] = this;
            }
          }
        } else {
          execute();
        }
      }
    }
  },

  /**
   * Triggers an event and all parent events
   * @param {String|Array} name name of event or array with names
   * @param args Optional arguments (values to be passed)
   */
  triggerAll: function(name, args, original) {
    var to_trigger = [];
    //default to array
    if(!utils.isArray(name)) {
      name = [name];
    }
    var i;
    var size;
    var n;
    for(i = 0, size = name.length; i < size; i += 1) {
      n = name[i];
      original = original || n;
      var parts = n.split(':');
      while(parts.length) {
        to_trigger.push([
          n,
          args,
          original
        ]);
        parts.pop();
        n = parts.join(':');
      }
    }
    var once = utils.unique(to_trigger, function(d) {
      return d[0]; //name of the event
    });
    for(i = 0; i < once.length; i += 1) {
      this.trigger.apply(this, once[i]);
    }
  },

  /**
   * Prevents all events from being triggered, buffering them
   */
  freeze: function(exceptions) {
    this._freeze = true;
    if(!exceptions) {
      return;
    }
    if(!utils.isArray(exceptions)) {
      exceptions = [exceptions];
    }
    for(var i = 0; i < exceptions.length; i += 1) {
      this._freezeExceptions[exceptions[i]] = true;
    }
  },

  /**
   * triggers all frozen events
   */
  unfreeze: function() {
    this._freeze = false;
    this._freezeExceptions = {};
    //execute old frozen events
    while(this._freezer.length) {
      var execute = this._freezer.shift();
      execute();
    }
  },

  /**
   * clears all frozen events
   */
  clearFrozen: function() {
    this._freeze = false;
    this._freezeExceptions = {};
    this._freezer = [];
  }
});

EventEmitter.freezeAll = freezeAll;
EventEmitter.unfreezeAll = unfreezeAll;

//generic event functions
/**
 * freezes all events
 */
function freezeAll(exceptions) {
  _freezeAllEvents = true;
  if(!exceptions) {
    return;
  }
  if(!utils.isArray(exceptions)) {
    exceptions = [exceptions];
  }
  utils.forEach(exceptions, function(e) {
    _freezeAllExceptions[e] = true;
  });
};

/**
 * triggers all frozen events form all instances
 */
function unfreezeAll() {
  _freezeAllEvents = false;
  _freezeAllExceptions = {};
  //unfreeze all instances
  var keys = Object.keys(_frozenEventInstances);
  for(var i = 0; i < keys.length; i++) {
    var instance = _frozenEventInstances[keys[i]];
    if(!instance) {
      continue;
    }
    instance.unfreeze();
  }
  _frozenEventInstances = {};
};

export default EventEmitter;