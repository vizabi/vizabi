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
   * Binds a callback function to an event: part 1: split grouped parameters in seperate calls
   * @param {String} type type of event
   * @param {String|Array} target path to object the event should be bound to or array of target paths
   * @param {Function|Array} func function to be bound with event or array with functions
   */
  on: function(type, path, func) {
    
    var i;

    // multiple at a time, array format: [{type: '', path: '', func: ''}, {..}]
    if(utils.isArray(type)) {
      for(i = 0; i < type.length; i += 1) {
        if (type[i].type && type[i].func)
          this.on(type[i].type, type[i].path, type[i].func);
        else
          this.on(type[i], func);
      }
      return;
    }

    //multiple at a time, object format: {type: function, ... } or { 'type:path': function, ... }
    if(utils.isObject(type)) {
      for(i in type) {
        this.on(i, type[i]);
      }
      return;
    }

    // type and path are both in type: on('type:path', func)
    // or
    // path undefined: on('type', func)
    if(typeof path === 'function') {
      func = path; // put callback function in func variable
      // on('type:path', func)
      if (type.indexOf(':') !== -1) {
        var split = type.split(':');  
        type = split[0];
        path = split[1];
      } 
      // on(type, func)
      else {
        path = undefined;
      }
      this.on(type, path, func);
      return;
    }

    // bind multiple paths at a time to one function: on(type, [path1, path2], func)
    if(utils.isArray(path)) {
      for(i = 0; i < path.length; i += 1) {
        this.on(type, path[i], func);
      }
      return;
    }

    //bind multiple functions at the same time to one path: on(type, path, [func1, func2])
    if(func && utils.isArray(func)) {
      for(i = 0; i < func.length; i += 1) {
        this.on(type, path, func[i]);
      }
      return;
    }

    // if there's nothing to split up anymore, continue
    this.onDescend(type, path, func);

  },
  /**
   * Continuation of on(): traversing down to target and registering the event on target
   * @param {String} type type of event or array with types
   * @param {String|Array} target path to object the event should be bound to, in string or array form
   * @param {Function} func callback function to be bound with event
   */
  onDescend: function(type, path, func) {

    // prepare path to array
    if (typeof path === 'string') {
      path = path.split('.'); // reverse because pop is far more efficient than shift
    }

    // if there is a path given, descent path to target
    if (utils.isArray(path) && path.length != 0) {
      // descent to next child to find target object
      var currentTarget = path.shift();
      if (this[currentTarget] === undefined)
        utils.warn('Can\'t bind event \'' + type + ', ' + currentTarget + '\'. Can\'t find child "' + currentTarget + '" of the current model.');
      else
        this.getActualObject(currentTarget).onDescend(type, path, func);
      return;
    }

    // register the event to this object
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
  trigger: function(eventType, args) {
    var i;
    var size;

    // split up eventType-paremeter for multiple event-triggers
    if(utils.isArray(eventType)) {
      for(i = 0, size = eventType.length; i < size; i += 1) {
        this.trigger(eventType[i], args);
      }
      return;
    } 

    // if this eventType has no events registered
    if(!this._events.hasOwnProperty(eventType)) {
      return;
    }
    // for each function registered to this eventType
    var _this = this;
    utils.forEach(this._events[eventType], function(func) {

      // prepare execution
      var execute = function() {
        var msg = 'Vizabi Event: ' + eventType; // + ' - ' + eventPath;
        utils.timeStamp(msg);
        func.apply(_this, [
          eventType,
          args
        ]);
      };

      //TODO: improve readability of freezer code
      //only execute if not frozen and exception doesnt exist
      if(_this._freeze || _freezeAllEvents) {
        //if exception exists for freezing, execute
        if(_freezeAllEvents && _freezeAllExceptions.hasOwnProperty(name) || !_freezeAllEvents && _this._freeze &&
          _this._freezeExceptions.hasOwnProperty(name)) {
          execute();
        } //otherwise, freeze it
        else {
          _this._freezer.push(execute);
          if(_freezeAllEvents && !_frozenEventInstances[_this._id]) {
            _this.freeze();
            _frozenEventInstances[_this._id] = _this;
          }
        }
      } else {
        execute();
      }
    })    
  },

  /**
   * Triggers an event and all parent events
   * @param {String|Array} name name of event or array with names
   * @param args Optional arguments (values to be passed)
   */
  triggerAll: function(eventTypes, args, original) {
    var to_trigger = [];
    //default to array
    if(!utils.isArray(eventTypes)) {
      eventTypes = [eventTypes];
    }
    var i;
    for(i = 0; i < eventTypes.length; i++) {
      to_trigger.push([
        eventTypes[i],
        args
      ]);
    }
    to_trigger = utils.unique(to_trigger, function(d) {
      return d[0]; //name of the event
    });
    for(i = 0; i < to_trigger.length; i++) {
      this.trigger.apply(this, to_trigger[i]);
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