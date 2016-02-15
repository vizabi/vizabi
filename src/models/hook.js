import * as utils from 'base/utils';
import Model from 'base/model';
import Promise from 'promise';
import EventSource from 'events';

/*!
 * HOOK MODEL
 */

var Hook = Model.extend({


  init: function(name, values, parent, bind) {

    this._super(name, values, parent, bind);

    var _this = this;
    var spaceRefs = getSpace(this);

    //check what we want to hook this model to
    utils.forEach(spaceRefs, function(name) {
      //hook with the closest prefix to this model
      _this._space[name] = getClosestModel(_this, name);
      //if hooks change, this should load again
      //TODO: remove hardcoded 'show"
      if(_this._space[name].show) {
        _this._space[name].on('change:show', function(evt) {
          //hack for right size of bubbles
          if(_this._type === 'size' && _this.which === _this.which_1) {
            _this.which_1 = '';
          };
          //defer is necessary because other events might be queued.
          //load right after such events
          utils.defer(function() {
            _this.load().then(function() {

            }, function(err) {
              utils.warn(err);
            });
          });
        });
      }
    });
    //this is a hook, therefore it needs to reload when data changes
    this.on('change:which', function(evt) {
      //defer is necessary because other events might be queued.
      //load right after such events
      _this.load();
    });
  },

  getLoadSettings: function() {
    return {
      data: getClosestModel(this, 'data'),
      language: getClosestModel(this, 'language')
    }
  },

  /**
   * loads data (if hook)
   * Hooks loads data, models ask children to load data
   * Basically, this method:
   * loads is theres something to be loaded:
   * does not load if there's nothing to be loaded
   * @param {Object} options (includes splashScreen)
   * @returns defer
   */
  loadData: function(opts) {

    opts = opts || {};
    var splashScreen = opts.splashScreen || false;
    var loadSettings = this.getLoadSettings();

    this.query = this.getQuery(splashScreen);

    this._spaceDims = {};

    //get reader info
    var reader = loadSettings.data.getPlainObject();
    reader.parsers = this._getAllParsers();

    var lang = loadSettings.language ? loadSettings.language.id : 'en';

    EventSource.freezeAll([
      'load_start',
      'resize',
      'dom_ready'
    ]);

    utils.timeStamp('Vizabi Model: Loading Data: ' + this._id);
    var dataPromise = this.getDataManager().load(this.query, lang, reader);
    dataPromise.then(
      this.afterLoad.bind(this),
      this.loadError.bind(this)
    );

    return dataPromise;

  },

  /**
   * executes after data has actually been loaded
   */
  afterLoad: function(dataId) {
    this._dataId = dataId;
    utils.timeStamp('Vizabi Model: Data loaded: ' + this._id);
    EventSource.unfreezeAll();
  },

  loadError: function(err) {
    utils.warn('Problem with query: ', JSON.stringify(query));
    this._loadPromise.reject(err);
  },

  /**
   * gets all hook filters
   * @returns {Object} filters
   */
  _getAllParsers: function() {

    var parsers = {};

    function addParser(model) {
      // get parsers from model
      var parser = model.getParser();
      var column = model.getDimensionOrWhich();
      if (parser && column) {
        parsers[column] = parser;
      }
    }

    // loop through all models which can have filters
    utils.forEach(this._space, function(h) {
      addParser(h);
    });
    addParser(this);

    return parsers;
  },

  /**
   * gets all hook dimensions
   * @param {Object} opts options with exceptType or onlyType
   * @returns {Array} all unique dimensions
   */
  _getAllDimensions: function(opts) {

    var optsStr = JSON.stringify(opts);
    if(optsStr in this._spaceDims) {
      return this._spaceDims[optsStr];
    }

    opts = opts || {};
    var dims = [];
    var dim;

    var models = this._space;
    //in case it's a parent of hooks
    if(!this.isHook() && this.space) {
      models = [];
      var _this = this;
      utils.forEach(this.space, function(name) {
        models.push(getClosestModel(_this, name));
      });
    }

    utils.forEach(models, function(m) {
      if(opts.exceptType && m.getType() === opts.exceptType) {
        return true;
      }
      if(opts.onlyType && m.getType() !== opts.onlyType) {
        return true;
      }
      if(dim = m.getDimension()) {
        dims.push(dim);
      }
    });

    this._spaceDims[optsStr] = dims;

    return dims;
  },


  /**
   * gets all hook filters
   * @param {Boolean} splashScreen get filters for first screen only
   * @returns {Object} filters
   */
  _getAllFilters: function(opts, splashScreen) {
    opts = opts || {};
    var filters = {};
    utils.forEach(this._space, function(h) {
      if(opts.exceptType && h.getType() === opts.exceptType) {
        return true;
      }
      if(opts.onlyType && h.getType() !== opts.onlyType) {
        return true;
      }
      filters = utils.extend(filters, h.getFilter(splashScreen));
    });
    return filters;
  },


  /**
   * gets query that this model/hook needs to get data
   * @returns {Array} query
   */
  getQuery: function(splashScreen) {

    var dimensions, filters, select, datatype, groupBy, orderBy, q;

    //if it's not a hook, no query is necessary
    if(!this.isHook()) return true;
    //error if there's nothing to hook to
    if(Object.keys(this._space).length < 1) {
      utils.error('Error:', this._id, 'can\'t find the space');
      return true;
    }

    var prop = (this.use === "property");
    var exceptions = (prop) ? { exceptType: 'time' } : {};

    // select
    dimensions = this._getAllDimensions(exceptions);
    if(this.use !== 'constant') dimensions = dimensions.concat([this.which]);
    select = utils.unique(dimensions);

    // from
    datatype = prop ? 'entities' : 'datapoints';

    // where 
    filters = this._getAllFilters(exceptions, splashScreen);
    
    // grouping
    groupBy = this._getGrouping();

    // order by
    orderBy = (!prop) ? this._space.time.dim : null; // should be _space.animatable, but that's time for now

    //return query
    return {
      'select': select,
      'from': datatype,
      'where': filters,
      'grouping': groupBy,
      'orderBy': orderBy 
    };
  },

    /**
   * Gets tick values for this hook
   * @returns {Number|String} value The value for this tick
   */
  tickFormatter: function(x, formatterRemovePrefix) {

    // Assumption: a hook has always time in its space
    if(utils.isDate(x)) return this._space.time.timeFormat(x);
    if(utils.isString(x)) return x;

    var format = "f";
    var prec = 0;
    if(Math.abs(x) < 1) {
      prec = 1;
      format = "r"
    };

    var prefix = "";
    if(formatterRemovePrefix) return d3.format("." + prec + format)(x);

    //---------------------
    // BEAUTIFIERS GO HOME!
    // don't break formatting please
    //---------------------
    switch(Math.floor(Math.log(Math.abs(x))/Math.LN10)) {
      case -13: x = x * 1000000000000; prefix = "p"; break; //0.1p
      case -10: x = x * 1000000000; prefix = "n"; break; //0.1n
      case -7: x = x * 1000000; prefix = "µ"; break; //0.1µ
      case -6: x = x * 1000000; prefix = "µ"; break; //1µ
      case -5: x = x * 1000000; prefix = "µ"; break; //10µ
      case -4: break; //0.0001
      case -3: break; //0.001
      case -2: break; //0.01
      case -1: break; //0.1
      case 0:  break; //1
      case 1:  break; //10
      case 2:  break; //100
      case 3:  break; //1000
      case 4:  break; //10000
      case 5:  x = x / 1000; prefix = "k"; break; //0.1M
      case 6:  x = x / 1000000; prefix = "M"; prec = 1; break; //1M
      case 7:  x = x / 1000000; prefix = "M"; break; //10M
      case 8:  x = x / 1000000; prefix = "M"; break; //100M
      case 9:  x = x / 1000000000; prefix = "B"; prec = 1; break; //1B
      case 10: x = x / 1000000000; prefix = "B"; break; //10B
      case 11: x = x / 1000000000; prefix = "B"; break; //100B
      case 12: x = x / 1000000000000; prefix = "T"; prec = 1; break; //1T
      //use the D3 SI formatting for the extreme cases
      default: return(d3.format("." + prec + "s")(x)).replace("G", "B");
    }

    // use manual formatting for the cases above
    return(d3.format("." + prec + format)(x) + prefix).replace("G", "B");

  },
    
  /**
   * Gets the d3 scale for this hook. if no scale then builds it
   * @returns {Array} domain
   */
  getScale: function(margins) {
    if(!this.scale) {
      this.buildScale(margins);
    }
    return this.scale;
  },

  /**
   * Gets the domain for this hook
   * @returns {Array} domain
   */
  buildScale: function() {
    if(!this.isHook()) {
      return;
    }
    var domain;
    var scaleType = this.scaleType || 'linear';
    switch(this.use) {
      case 'indicator':
        var limits = this.getLimits(this.which);
        domain = [
          limits.min,
          limits.max
        ];
        break;
      case 'property':
        domain = this.getUnique(this.which);
        break;
      default:
        domain = [this.which];
        break;
    }
    //TODO: d3 is global?
    this.scale = scaleType === 'time' ? d3.time.scale.utc().domain(domain) : d3.scale[scaleType]().domain(domain);
  },
    
      //TODO: this should go down to datamanager, hook should only provide interface
  /**
   * gets maximum, minimum and mean values from the dataset of this certain hook
   */
  gerLimitsPerFrame: function() {
      
    if(this.use === "property") return utils.warn("getMaxMinMean: strange that you ask min max mean of a property"); 
    if(!this.isHook) return utils.warn("getMaxMinMean: only works for hooks");
      
    var result = {};
    var values = [];
    var value = null;
      
    var steps = this._parent._parent.time.getAllSteps();
      
    if(this.use === "constant") {
        steps.forEach(function(t){ 
            value = this.which;
            result[t] = {
                min: value,
                max: value
            }
        });

    }else if(this.which==="time"){
        steps.forEach(function(t){ 
            value = new Date(t);
            result[t] = {
                min: value,
                max: value
            }
        });

    }else{
        var args = {framesArray: steps, which: this.which};
        result = this.getDataManager().get(this._dataId, 'limitsPerFrame', args);   
    }
      
    return result;
  },
    
    
   /**
   * Gets unique values in a column
   * @param {String|Array} attr parameter
   * @returns {Array} unique values
   */
  getUnique: function(attr) {
     if(!this.isHook()) return;
    if(!attr) attr = this._getFirstDimension({type: "time"});
     return this.getDataManager().get(this._dataId, 'unique', attr);
  },
    
    
  /**
   * gets the items associated with this hook without values
   * @param filter filter
   * @returns hooked value
   */
  getKeys: function(filter) {
      // If there is no _dataId, then no data was loaded
      if (!this._dataId) return utils.warn("hook:getKeys() -- returning nothing since no data is loaded");
      
      //all dimensions except time (continuous)
      var dimensions = this._getAllDimensions({exceptType: 'time'});
      var excluded = this._getAllDimensions({onlyType: 'time'});

      return this.getUnique(dimensions).map(function(item) {
        utils.forEach(excluded, function(e) {
          if(filter && filter[e]) {
            item[e] = filter[e];
          }
        });
        return item;
      });
  },
    
  /**
   * Gets the metadata of the hook's "which"
   * @returns {Object} metadata
   */
  getMetadata: function() {

    if (this.use === 'constant')
      return {};

    var select = '*';
    var from = (this.use === 'property') ? 'entities' : 'datapoints';
    var where = { concept: this.which }

    return {
      select: select,
      from: from,
      where: where
    }

    this.getDataManager().load(query)

    return this.use !== 'constant' ? this.getDataManager().getMetadata(this.which) : {};
  }    
});


/**
 * gets closest prefix model moving up the model tree
 * @param {String} prefix
 * @returns {Object} submodel
 */
function getClosestModel(ctx, name) {
  var model = findSubmodel(ctx, name);
  if(model) {
    return model;
  } else if(ctx._parent) {
    return getClosestModel(ctx._parent, name);
  }
}

/**
 * find submodel with name that starts with prefix
 * @param {String} prefix
 * @returns {Object} submodel or false if nothing is found
 */
function findSubmodel(ctx, name) {
  for(var i in ctx._data) {
    //found submodel
    if(i === name && isModel(ctx._data[i])) {
      return ctx._data[i];
    }
  }
}

/**
 * Learn what this model should hook to
 * @returns {Array} space array
 */
function getSpace(model) {
  if(utils.isArray(model.space)) {
    return model.space;
  } else if(model._parent) {
    return getSpace(model._parent);
  } else {
    utils.error(
      'ERROR: space not found.\n You must specify the objects this hook will use under the "space" attribute in the state.\n Example:\n space: ["entities", "time"]'
    );
  }
}

/**
 * Checks whether an object is a model or not
 * if includeLeaf is true, a leaf is also seen as a model
 */
function isModel(model, includeLeaf) {
  return model && (model.hasOwnProperty('_data') || (includeLeaf &&  model.hasOwnProperty('_val')));
}

export default Hook;
