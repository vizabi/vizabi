import * as utils from 'base/utils';
import DataConnected from 'models/dataconnected';
import EventSource from 'base/events';

/*!
 * HOOK MODEL
 */

var Hook = DataConnected.extend({

  //some hooks can be important. like axis x and y
  //that means, if X or Y doesn't have data at some point, we can't show markers
  _important: false,

  dataConnectedChildren: ['use', 'which'],

  init: function(name, values, parent, bind) {

    this._super(name, values, parent, bind);

    var _this = this;
    var spaceRefs = this._parent.getSpace(this);

    //check what we want to hook this model to
    utils.forEach(spaceRefs, function(name) {
      //hook with the closest prefix to this model
      _this._space[name] = _this.getClosestModel(name);
      //if hooks change, this should load again
      _this._space[name].on('dataConnectedChange', function(evt) {
        //hack for right size of bubbles
        if(_this._type === 'size' && _this.which === _this.which_1) {
          _this.which_1 = '';
        };
        //defer is necessary because other events might be queued.
        //load right after such events
        utils.defer(function() {
          _this.startLoading().then(function() {

          }, function(err) {
            utils.warn(err);
          });
        });
      })
    });
  },

  preloadData: function() {
    var dataModel = (this.data) ? this.data : 'data';
    this.dataSource = this.getClosestModel(dataModel);
    return this._super();
  },

  /**
   * Hooks loads data, models ask children to load data
   * Basically, this method:
   * loads is theres something to be loaded:
   * does not load if there's nothing to be loaded
   * @param {Object} options (includes splashScreen)
   * @returns defer
   */
  loadData: function(opts) {


    if(!this.which) return Promise.resolve();

    this.trigger('hook_change');

    opts = opts || {};

    var query = this.getQuery(opts.splashScreen);

    //useful to check if in the middle of a load call
    this._loadCall = true;

    this._spaceDims = {};
    this.setReady(false);


    var _this = this;

    utils.timeStamp('Vizabi Model: Loading Data: ' + this._id);

    var parsers = this._getAllParsers();
    var dataPromise = this.dataSource.load(query, parsers);

    dataPromise.then(
      this.afterLoad.bind(this),
      this.loadError.bind(this)
    );

    return dataPromise;

  },

  _isLoading: function() {
    return (!this._loadedOnce || this._loadCall);
  },

  /**
   * executes after data has actually been loaded
   */
  afterLoad: function(dataId) {
    this._dataId = dataId;
    utils.timeStamp('Vizabi Model: Data loaded: ' + this._id);
    this.scale = null; // needed for axis/scale resetting to new data
    EventSource.unfreezeAll();
  },

  loadError: function() {
      utils.warn('Problem with query: ', JSON.stringify(query));
  },

  /**
   * gets query that this model/hook needs to get data
   * @returns {Array} query
   */
  getQuery: function(splashScreen) {
    var _this = this;

    var dimensions, filters, select, from, order_by, q, animatable;

    //if it's not a hook, no query is necessary
    if(!this.isHook()) return true;
    //error if there's nothing to hook to
    if(Object.keys(this._space).length < 1) {
      utils.error('Error:', this._id, 'can\'t find the space');
      return true;
    }

    var prop = (this.use === "property") || (this.use === "constant");
    var exceptions = (prop) ? { exceptType: 'time' } : {};

    // select
    // we remove this.which from values if it duplicates a dimension
    var dimensions = this._getAllDimensions(exceptions);
    select = {
      key: dimensions,
      value: dimensions.indexOf(this.which)!=-1 || this.use === "constant" ? [] : [this.which]
    }

    // animatable
    animatable = this._getFirstDimension({type: "time"});

    // from
    from = prop ? "entities" : "datapoints";

    // where
    filters = this._getAllFilters(exceptions, splashScreen);

    // make root $and explicit
    var explicitAndFilters =  {};
    if (Object.keys(filters).length > 0) {
      explicitAndFilters['$and'] = [];
      for (var filterKey in filters) {
        var filter = {};
        filter[filterKey] = filters[filterKey];
        explicitAndFilters['$and'].push(filter);
      }
    }

    // join
    var join = this._getAllJoins(exceptions, splashScreen);

    //return query
    return {
      'language': this.getClosestModel('language').id,
      'from': from,
      'animatable': animatable,
      'select': select,
      'where': explicitAndFilters,
      'join': join,
      'order_by': prop ? ["rank"] : [this._space.time.dim]
    };
  },


  /**
   * gets all hook dimensions
   * @param {Object} opts options with exceptType or onlyType
   * @returns {Array} all unique dimensions
   */
  _getAllDimensions: function(opts) {

    // hook dimensions = marker dimensions. Later, hooks might have extra dimensions : )
    return this._parent._getAllDimensions(opts);

  },

  /**
   * gets first dimension that matches type
   * @param {Object} options
   * @returns {Array} all unique dimensions
   */
  _getFirstDimension: function(opts) {

    // hook dimensions = marker dimensions. Later, hooks might have extra dimensions : )
    return this._parent._getFirstDimension(opts);

  },


  /**
   * gets all hook filters
   * @param {Boolean} splashScreen get filters for first screen only
   * @returns {Object} filters
   */
  _getAllFilters: function(opts, splashScreen) {
    opts = opts || {};
    var filters = {};
    var _this = this;
    utils.forEach(this._space, function(h) {
      if(opts.exceptType && h.getType() === opts.exceptType) {
        return true;
      }
      if(opts.onlyType && h.getType() !== opts.onlyType) {
        return true;
      }
      // if query's dimensions are the same as the hook's, no join
      if (utils.arrayEquals(_this._getAllDimensions(opts), [h.getDimension()])) {
        filters = utils.extend(filters, h.getFilter(splashScreen));
      } else {
        var joinFilter = h.getFilter(splashScreen);
        if (joinFilter != null && !utils.isEmpty(joinFilter)) {
          var filter = {};
          filter[h.getDimension()] = "$"  + h.getDimension();
          filters = utils.extend(filters, filter);
        }
      }
    });
    return filters;
  },

  _getAllJoins: function(opts, splashScreen) {
    var joins = {};
    var _this = this;
    utils.forEach(this._space, function(h) {
      if(opts.exceptType && h.getType() === opts.exceptType) {
        return true;
      }
      if(opts.onlyType && h.getType() !== opts.onlyType) {
        return true;
      }
      if (utils.arrayEquals(_this._getAllDimensions(opts), [h.getDimension()])) {
        return true;
      }
      var filter = h.getFilter(splashScreen);
      if (filter != null && !utils.isEmpty(filter)) {
        joins["$" + h.getDimension()] = {
          key: h.getDimension(),
          where: h.getFilter(splashScreen)
        };
      }
    });
    return joins;
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
   * Gets tick values for this hook
   * @returns {Number|String} value The value for this tick
   */
  getTickFormatter: function() {

    var _this = this;
    var SHARE = "share";
    var PERCENT = "percent";

    // percentageMode works like rounded if set to SHARE, but multiplies by 100 and suffixes with "%"
    // percentageMode works like rounded if set to PERCENT, but suffixes with "%"

    return function format(x, index, removePrefix, percentageMode){

    percentageMode = _this.getConceptprops().format;
    if(percentageMode===SHARE) x*=100;

    // Format time values
    // Assumption: a hook has always time in its space
    if(utils.isDate(x)) return _this._space.time.timeFormat(x);

    // Dealing with values that are supposed to be time
    if(_this.scaleType === "time" && !utils.isDate(x)) {
        return _this._space.time.timeFormat(new Date(x));
    }

    // Strings, null, NaN and undefined are bypassing any formatter
    if(utils.isString(x) || !x && x!==0) return x;

    if(Math.abs(x)<0.00000000000001) return "0";

    var format = "r"; //rounded format. use "f" for fixed
    var prec = 3; //round to so many significant digits

    var prefix = "";
    if(removePrefix) return d3.format("." + prec + format)(x);

    //---------------------
    // BEAUTIFIERS GO HOME!
    // don't break formatting please
    //---------------------
    // the tiny constant compensates epsilon-error when doing logsrithms
    switch(Math.floor(Math.log(Math.abs(x))/Math.LN10 + 0.00000000000001)) {
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
      case 4:  x = x / 1000; prefix = "k"; break; //10k
      case 5:  x = x / 1000; prefix = "k"; break; //100k
      case 6:  x = x / 1000000; prefix = "M"; break; //1M
      case 7:  x = x / 1000000; prefix = "M"; break; //10M
      case 8:  x = x / 1000000; prefix = "M"; break; //100M
      case 9:  x = x / 1000000000; prefix = "B"; break; //1B
      case 10: x = x / 1000000000; prefix = "B"; break; //10B
      case 11: x = x / 1000000000; prefix = "B"; break; //100B
      case 12: x = x / 1000000000000; prefix = "TR"; break; //1TR
      case 13: x = x / 1000000000000; prefix = "TR"; break; //10TR
      case 14: x = x / 1000000000000; prefix = "TR"; break; //100TR
      //use the D3 SI formatting for the extreme cases
      default: return(d3.format("." + prec + "s")(x)).replace("G", "B");
    }

    var formatted = d3.format("." + prec + format)(x);
    //remove trailing zeros if dot exists to avoid numbers like 1.0M, 3.0B, 1.500, 0.9700, 0.0
    if (formatted.indexOf(".")>-1) formatted = formatted.replace(/0+$/,"").replace(/\.$/,"");



    // use manual formatting for the cases above
    return(formatted + prefix + (percentageMode===PERCENT || percentageMode===SHARE?"%":""));
    }
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


   /**
   * Gets unique values in a column
   * @param {String|Array} attr parameter
   * @returns {Array} unique values
   */
  getUnique: function(attr) {
    if(!this.isHook()) return;
    if(!attr) attr = this._getFirstDimension({type: "time"});
    return this.dataSource.getData(this._dataId, 'unique', attr);
  },


  getData: function() {
    return this.dataSource.getData(this._dataId);
  },

      /**
   * gets dataset without null or nan values with respect to this hook's which
   * @returns {Object} filtered items object
   */
  getValidItems: function() {
    return this.dataSource.getData(this._dataId, 'valid', this.which);
  },

  /**
   * gets nested dataset
   * @param {Array} keys define how to nest the set
   * @returns {Object} hash-map of key-value pairs
   */
  getNestedItems: function(keys) {
    if(!keys) return utils.warn("No keys provided to getNestedItems(<keys>)");
    return this.dataSource.getData(this._dataId, 'nested', keys);
  },

  getHaveNoDataPointsPerKey: function() {
    return this.dataSource.getData(this._dataId, 'haveNoDataPointsPerKey', this.which);
  },

  /**
   * Gets limits
   * @param {String} attr parameter
   * @returns {Object} limits (min and max)
   */
  getLimits: function(attr) {
    return this.dataSource.getData(this._dataId, 'limits', attr);
  },

  getFrame: function(steps, forceFrame, selected) {
    return this.dataSource.getFrame(this._dataId, steps, forceFrame, selected);
  },

  getFrames: function(steps, selected) {
    return this.dataSource.getFrames(this._dataId, steps, selected);
  },

  /**
   * gets hook values according dimension values
   */
  getItems: function() {
    var _this = this;
    var dim = _this._getFirstDimension({exceptType: "time"});
    var items = {};
    this.getValidItems().forEach(function(d){
      items[d[dim]] = d[_this.which];
    })
    return items;
  },

  getLimitsByDimensions: function(dims) {
    var filtered = this.dataSource.getData(this._dataId, 'nested', dims);
    var values = {};
    var limitsDim = {};
    var attr = this.which;

    var countLimits = function(items, limitsDim, id) {

      var filtered = items.reduce(function(filtered, d) {

        // check for dates
        var f = (utils.isDate(d[attr])) ? d[attr] : parseFloat(d[attr]);

        // if it is a number
        if(!isNaN(f)) {
          filtered.push(f);
        }

        //filter
        return filtered;
      }, []);

      // get min/max for the filtered rows
      var min;
      var max;
      var limits = {};
      for(var i = 0; i < filtered.length; i += 1) {
        var c = filtered[i];
        if(typeof min === 'undefined' || c < min) {
          min = c;
        }
        if(typeof max === 'undefined' || c > max) {
          max = c;
        }
      }
      limits.min = min || 0;
      limits.max = max || 100;
      limitsDim[id] = limits;

    }

    var iterateGroupKeys = function(data, deep, result, cb) {
      deep--;
      utils.forEach(data, function(d, id) {
        if(deep) {
          result[id] = {};
          iterateGroupKeys(d, deep, result[id], cb);
        } else {
          cb(d, result, id);
        }
      });
    }

    iterateGroupKeys(filtered, dims.length, limitsDim, countLimits);

    return limitsDim;
  },

  /**
   * Gets the concept properties of the hook's "which"
   * @returns {Object} concept properties
   */
  getConceptprops: function() {
    return this.use !== 'constant' ? this.dataSource.getConceptprops(this.which) : {};
  }
});

export default Hook;
