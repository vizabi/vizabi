import * as utils from 'base/utils';
import Class from 'base/class';

var _freezeAllEvents = false;
var _frozenEventInstances = [];
var _freezeAllExceptions = {};

export var DefaultEvent = Class.extend({

  source: '',
  type: 'default',

  init: function(source, type) {
    this.source = source;
    if (type) this.type = type;
  }

});

export var ChangeEvent = DefaultEvent.extend('change', {

  type: 'change',

  init: function(source) {
    this._super(source);
  }

})

var EventSource = Class.extend({

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

    // if parameters had to be split up in seperate calls, don't continue with this call
    if (this.splitEventParameters(type, path, func, this.on))
      return;

    // get the target model
    var target = this.traversePath(path);
    if (!target) return;

    // register the event to this object
    target._events[type] = target._events[type] || [];
    if(typeof func === 'function') {
      target._events[type].push(func);
    } else {
      utils.warn('Can\'t bind event \'' + type + '\'. It must be a function.');
    }
  },


  /**
   * Unbinds all events associated with a name or a specific one
   * @param {String|Array} name name of event or array with names
   */
  off: function(type, path, func) {

    // if no arguments, unbind all
    if (arguments.length == 0) {
      this._events = {};
      return;
    }

    // if parameters had to be split up in seperate calls, don't continue with this call
    if (this.splitEventParameters(type, path, func, this.off))
      return;

    // get target model
    var target = this.traversePath(path);
    if (!target) return;

    // unbind events
    if(target._events.hasOwnProperty(type)) {
      // if function not given, remove all events of type
      if (typeof func === 'undefined') {
        target._events[type] = [];
        return;
      }
      var index = target._events[type].indexOf(func);
      if (index > -1) {
        target._events[type].splice(index, 1);
      } else {
        utils.warn('Could not unbind function ' + func.name + '. Function not in bound function list.');
      }
    }
  },

  /**
   * Split grouped event parameters to seperate calls to given funtion
   * @param {String|Object|Array} type type of event
   * @param {String|Array} target path to object the event should be bound to or array of target paths
   * @param {Function|Array} func function to be bound with event or array with functions
   * @param {Function} eventFunc function to further process the split up parameters
   * @return {Boolean} true if the parameters where split up, false if nothing was split up
   * eventFunc is mostly arguments.callee but this is deprecated in ECMAscript 5: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments/callee
   */
  splitEventParameters: function(type, path, func, eventFunc) {
    var i;
    var calls = [];

    // multiple at a time, array format: [{type: function}, {'type:path': function}, ... ]
    // seems redundant but used so that binding-sets won't be turned into models (which happens when it's a pure object). Used e.g. in Tool.init();
    if(utils.isArray(type)) {
      for(i = 0; i < type.length; i += 1) {
        eventFunc.call(this, type[i], func);
      }
      return true;
    }

    //multiple at a time, object format: {type: function, 'type:path': function, ... }
    if(utils.isObject(type)) {
      for(i in type) {
        eventFunc.call(this, i, type[i]);
      }
      return true;
    }

    // type and path are both in type: on('type:path', function)
    // or
    // path undefined: on('type', function)
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
      eventFunc.call(this, type, path, func);
      return true;
    }

    // bind multiple paths at a time to one function: on(type, [path1, path2], function)
    if(utils.isArray(path)) {
      for(i = 0; i < path.length; i += 1) {
        eventFunc.call(this, type, path[i], func);
      }
      return true;
    }

    //bind multiple functions at the same time to one path: on(type, path, [function1, function2])
    if(func && utils.isArray(func)) {
      for(i = 0; i < func.length; i += 1) {
        eventFunc.call(this, type, path, func[i]);
      }
      return true;
    }
    return false;
  },

  /**
   * // TODO: if events will not be strictly model-bound, this might have to move to model.
   * Traverse path down the model tree
   * @param {String|Array} target path to object that should be returned. Either in string or array form
   */
  traversePath: function(path) {

    // if there's no path to traverse
    if (typeof path === 'undefined' || utils.isArray(path) && path.length == 0) {
      return this;
    }

    // prepare path to array
    if (typeof path === 'string') {
      path = path.split('.');
    }

    // check if path is an array
    if (!utils.isArray(path)) {
      utils.error('Path is wrong type. Path should be a string or array but is ' + typeof path + '.');
      return null;
    }

    // descent to next child to find target object
    var currentTarget = path.shift();
    if (this[currentTarget] === undefined)
      utils.warn('Can\'t find child "' + currentTarget + '" of the model ' + this._name + '.');
    else
      return this.getModelObject(currentTarget).traversePath(path);
  },

  createEventFromType: function(evtType) {
    if ((evtType instanceof DefaultEvent)) {
      return evtType
    }

    var eventClass = DefaultEvent.get(evtType, true); // silent
    if (eventClass) {
      return new eventClass(this);
    }

    return new DefaultEvent(this, evtType);
  },

  /**
   * Triggers an event, adding it to the buffer
   * @param {String|Array} name name of event or array with names
   * @param args Optional arguments (values to be passed)
   */
  trigger: function(evtType, args) {
    var i;
    var size;

    // split up eventType-paremeter for multiple event-triggers
    if(utils.isArray(evtType)) {
      for(i = 0, size = evtType.length; i < size; i += 1) {
        this.trigger(evtType[i], args);
      }
      return;
    }

    // create an event-object if necessary
    var evt = this.createEventFromType(evtType);

    // if this eventType has no events registered
    if(!this._events.hasOwnProperty(evt.type)) {
      return;
    }

    // for each function registered to this eventType on this object
    var _this = this;
    utils.forEach(this._events[evt.type], func => {

      // prepare execution
      var execute = function() {
        var msg = 'Vizabi Event: ' + evt.type; // + ' - ' + eventPath;
        utils.timeStamp(msg);
        func.apply(_this, [
          evt,
          args
        ]);
      };

      //TODO: improve readability of freezer code
      //only execute if not frozen and exception doesnt exist
      if(this.allowExecution(evt)) {
        execute();
      } else {
        this._freezer.push(execute);
        if(_freezeAllEvents && !_frozenEventInstances[this._id]) {
          this.freeze();
          _frozenEventInstances[this._id] = this;
        }
      }

    })
  },

  allowExecution: function(evt) {
    return (!this._freeze && !_freezeAllEvents) ||                                           // nothing frozen
      (_freezeAllEvents && _freezeAllExceptions.hasOwnProperty(evt.type)) ||                 // freeze all but exception
      (!_freezeAllEvents && this._freeze && this._freezeExceptions.hasOwnProperty(evt.type)) // freeze but exception
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

EventSource.freezeAll = freezeAll;
EventSource.unfreezeAll = unfreezeAll;

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

export default EventSource;
