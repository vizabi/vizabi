import * as utils from "base/utils";
import DataConnected from "models/dataconnected";
import EventSource from "base/events";

/*!
 * HOOK MODEL
 */

const Hook = DataConnected.extend({

  //some hooks can be important. like axis x and y
  //that means, if X or Y doesn't have data at some point, we can't show markers
  _important: false,

  objectLeafs: ["autoconfig"],
  dataConnectedChildren: ["use", "which"],

  getClassDefaults() {
    const defaults = {
      data: "data",
      which: null
    };
    return utils.deepExtend(this._super(), defaults);
  },

  buildScale() {
    //overloaded by specific hook models, like axis and color
  },

  /**
   * After complete model tree is created, this allows models to listen to eachother.
   */
  setInterModelListeners() {
    const spaceRefs = this._parent.getSpace(this);

    //check what we want to hook this model to
    utils.forEach(spaceRefs, name => {
      //hook with the closest prefix to this model
      this._space[name] = this.getClosestModel(name);
      //if hooks change, this should load again
      this._space[name].on("dataConnectedChange", this.handleDataConnectedChange.bind(this));
    });
    this.getClosestModel("locale").on("dataConnectedChange", this.handleDataConnectedChange.bind(this));
  },

  onSuccessfullLoad() {
    this.validate();
    this.buildScale();
    this._super();
  },

  setWhich(newValue) {

    const obj = { which: newValue.concept };

    if (newValue.dataSource) obj.data = newValue.dataSource;
    const newDataSource = this.getClosestModel(obj.data || this.data);
    const conceptProps = newDataSource.getConceptprops(newValue.concept);

    if (newValue.use) obj.use = newValue.use;
    if (conceptProps && conceptProps.scales) obj.scaleType = conceptProps.scales[0];

    if (this.getType() === "axis" || this.getType() === "size") {
      obj.domainMin = null;
      obj.domainMax = null;
      obj.zoomedMin = null;
      obj.zoomedMax = null;
    }

    //FIXME: this will set spaceRef ofa hook when there are multiple dimensions to chose from
    //this has a limitation because hook can only be 1-dimensional here (but now it can point to any of the dimensions)
    //when we introduce hook spaces this should be replaced by setting space of a hook based on newValue
    if (newValue.use === "property" && newValue.key && newValue.key.length === 1) {
      obj.spaceRef = utils.find(this._space, entityMdl => entityMdl.dim === newValue.key[0].concept)._name;
    }
    if (newValue.use === "constant" || newValue.use === "indicator") {
      obj.spaceRef = null;
    }

    this.set(obj, null, null, null, this.setWhich);
  },

  setScaleType(newValue) {
    this.buildScale(newValue);
  },

  preloadData() {
    this.dataSource = this.getClosestModel(this.data);
    //TODO
    if (!this.spaceRef) this.spaceRef = this.updateSpaceReference();
    return this._super();
  },

  afterPreload() {
    this.autoconfigureModel();
  },

  autoconfigureModel(autoconfigResult) {

    if (!this.which && this.autoconfig) {
      if (!autoconfigResult) autoconfigResult = this._parent.getAvailableConcept(this.autoconfig);

      if (autoconfigResult) {
        const concept = autoconfigResult.value;
        const obj = {
          //dataSource: autoconfigResult.dataSource,
          which: concept.concept,
          use: ((autoconfigResult.key.size || autoconfigResult.key.length) > 1 || this.autoconfig.type === "time") ? "indicator" : "property",
          scaleType: concept.scales[0] || "linear"
        };
        this.set(obj);
      } else {
        const obj = {
          which: "_default",
          use: "constant",
          scaleType: "ordinal"
        };
        this.set(obj);
      }

      utils.printAutoconfigResult(this);
    }
  },

  updateSpaceReference() {
    if (this.use !== "property") return null;
    const newSpaceRef = "entities" + this._name.replace(this._type, "");

    return  this._space[newSpaceRef] ? newSpaceRef : this._parent.getSpace()[0]._name;
  },

  /**
   * Hooks loads data, models ask children to load data
   * Basically, this method:
   * loads is theres something to be loaded:
   * does not load if there's nothing to be loaded
   * @param {Object} options (includes splashScreen)
   * @returns defer
   */
  loadData(opts = {}) {

    // then start loading data

    if (!this.which || this.use === "constant") return Promise.resolve();

    this.trigger("hook_change");

    // TODO: should be set on data source switch, but load happens before change events
    this.dataSource = this.getClosestModel(this.data);

    const query = this.getQuery(opts.splashScreen);

    if (query === true) return Promise.resolve();

    //useful to check if in the middle of a load call
    this._loadCall = true;

    this.setReady(false);

    utils.timeStamp("Vizabi Model: Loading Data: " + this._id);

    const parsers = this._getAllParsers();

    const dataPromise = this.dataSource.load(query, parsers);

    dataPromise.then(
      this.afterLoad.bind(this),
      err => utils.warn("Problem with query: ", err, JSON.stringify(query))
    );

    return dataPromise;

  },

  handleDataConnectedChange(evt) {
    //defer is necessary because other events might be queued.
    //load right after such events
    utils.defer(() => {
      this.startLoading()
        .catch(utils.warn);
    });
  },

  _isLoading() {
    return (!this._loadedOnce || this._loadCall);
  },

  /**
   * executes after data has actually been loaded
   */
  afterLoad(dataId) {
    this._dataId = dataId;

    utils.timeStamp("Vizabi Model: Data loaded: " + this._id);
  },

  /**
   * gets query that this model/hook needs to get data
   * @returns {Array} query
   */
  getQuery(splashScreen) {
    let filters;

    //error if there's nothing to hook to
    if (Object.keys(this._space).length < 1) {
      utils.error("Error:", this._id, "can't find the space");
      return true;
    }

    const prop = (this.use === "property") || (this.use === "constant");
    const exceptions = (prop) ? { exceptType: "time" } : {};

    // select
    // we remove this.which from values if it duplicates a dimension
    const allDimensions = utils.unique(this._getAllDimensions(exceptions));
    const dimensions = (this.use === "property" && allDimensions.length > 1) ? [allDimensions.indexOf(this.which) !== -1 ? this.which : this.getEntity().dim] : allDimensions;

    if (!dimensions || !dimensions.length) {
      utils.warn("getQuery() produced no query because no keys are available");
      return true;
    }

    const select = {
      key: dimensions,
      value: dimensions.indexOf(this.which) != -1 || this.use === "constant" ? [] : [this.which]
    };

    // animatable
    const animatable = this._getFirstDimension({ type: "time" });
    // from
    const from = prop ? "entities" : "datapoints";

    // where
    filters = this._getAllFilters(exceptions, { splash: splashScreen, entityTypeRequest: prop });
    if (prop && allDimensions.length > 1) {
      const f = {};
      if (filters[dimensions]) f[dimensions] = filters[dimensions];
      filters = f;
    }

    // make root $and explicit
    const explicitAndFilters = {};
    if (Object.keys(filters).length > 0) {
      explicitAndFilters["$and"] = [];
      for (const filterKey in filters) {
        const filter = {};
        filter[filterKey] = filters[filterKey];
        explicitAndFilters["$and"].push(filter);
      }
    }

    // join
    let join = this._getAllJoins(exceptions, { splash: splashScreen, entityTypeRequest: prop });
    if (prop && allDimensions.length > 1) {
      const j = {};
      if (join["$" + dimensions]) j["$" + dimensions] = join["$" + dimensions];
      join = j;
    }

    // grouping
    let grouping = this._parent._getGrouping();
    if (grouping) {
      grouping = utils.clone(grouping, dimensions);
      if (utils.isEmpty(grouping)) grouping = false;
    }

    //return query
    const query = {
      "language": this.getClosestModel("locale").id,
      "from": from,
      "animatable": animatable,
      "select": select,
      "where": explicitAndFilters,
      "join": join,
      "order_by": prop ? ["rank"] : [this._space.time.dim]
    };
    if (grouping) query["grouping"] = grouping;
    return query;
  },


  /**
   * gets all hook dimensions
   * @param {Object} opts options with exceptType or onlyType
   * @returns {Array} all unique dimensions
   */
  _getAllDimensions(opts) {

    // hook dimensions = marker dimensions. Later, hooks might have extra dimensions : )
    return this._parent._getAllDimensions(opts);

  },

  /**
   * gets first dimension that matches type
   * @param {Object} options
   * @returns {Array} all unique dimensions
   */
  _getFirstDimension(opts) {

    // hook dimensions = marker dimensions. Later, hooks might have extra dimensions : )
    return this._parent._getFirstDimension(opts);

  },


  /**
   * gets all hook filters
   * @param {Boolean} filterOpts get filters for first screen only
   * @returns {Object} filters
   */
  _getAllFilters(opts, filterOpts) {
    opts = opts || {};
    let filters = {};
    const _this = this;
    utils.forEach(this._space, h => {
      if (opts.exceptType && h.getType() === opts.exceptType) {
        return true;
      }
      if (opts.onlyType && h.getType() !== opts.onlyType) {
        return true;
      }
      // if query's dimensions are the same as the hook's, no join
      if (utils.arrayEquals(_this._getAllDimensions(opts), [h.getDimension()])) {
        filters = utils.extend(filters, h.getFilter(filterOpts));
      } else {
        const joinFilter = h.getFilter(filterOpts);
        if (joinFilter != null && !utils.isEmpty(joinFilter)) {
          const filter = {};
          filter[h.getDimension()] = "$" + h.getDimension();
          filters = utils.extend(filters, filter);
        }
      }
    });
    return filters;
  },

  _getAllJoins(opts, filterOpts) {
    const joins = {};
    const _this = this;
    utils.forEach(this._space, h => {
      if (opts.exceptType && h.getType() === opts.exceptType) {
        return true;
      }
      if (opts.onlyType && h.getType() !== opts.onlyType) {
        return true;
      }
      if (utils.arrayEquals(_this._getAllDimensions(opts), [h.getDimension()])) {
        return true;
      }

      const filter = h.getFilter(filterOpts);
      if (filter != null && !utils.isEmpty(filter)) {
        joins["$" + h.getDimension()] = {
          key: h.getDimension(),
          where: h.getFilter(filterOpts)
        };
      }
    });
    return joins;
  },

  /**
   * gets all hook filters
   * @returns {Object} filters
   */
  _getAllParsers() {
    return Object.values(this._space).concat(this)
      .reduce((result, model) => {
        const parser = model.getParser();
        const column = model.getDimensionOrWhich();

        parser && column && !(column in result) && (result[column] = parser);

        return result;
      }, {});
  },

  /**
   * Gets tick values for this hook
   * @returns {Function} That returns the value for this tick
   */
  getTickFormatter() {

    const _this = this;
    const SHARE = "share";
    const PERCENT = "percent";

    // percentageMode works like rounded if set to SHARE, but multiplies by 100 and suffixes with "%"
    // percentageMode works like rounded if set to PERCENT, but suffixes with "%"

    return (x, index, group, removePrefix, percentageMode) => {

      percentageMode = _this.getConceptprops().format;
      if (percentageMode === SHARE) x *= 100;

      // Format time values
      // Assumption: a hook has always time in its space
      if (utils.isDate(x)) return _this._space.time.formatDate(x);

      // Dealing with values that are supposed to be time
      if (_this.scaleType === "time" && !utils.isDate(x)) {
        return _this._space.time.formatDate(new Date(x));
      }

      // Strings, null, NaN and undefined are bypassing any formatter
      if (utils.isString(x) || !x && x !== 0) return x;

      if (Math.abs(x) < 0.00000000000001) return "0";

      const format = "r"; //rounded format. use "f" for fixed
      const prec = 3; //round to so many significant digits

      let prefix = "";
      if (removePrefix) return d3.format("." + prec + format)(x);

      //---------------------
      // BEAUTIFIERS GO HOME!
      // don't break formatting please
      //---------------------
      // the tiny constant compensates epsilon-error when doing logsrithms
      /* eslint-disable */
    switch (Math.floor(Math.log(Math.abs(x)) / Math.LN10 + 0.00000000000001)) {
      case -13: x *= 1000000000000; prefix = "p"; break; //0.1p
      case -10: x *= 1000000000; prefix = "n"; break; //0.1n
      case -7: x *= 1000000; prefix = "µ"; break; //0.1µ
      case -6: x *= 1000000; prefix = "µ"; break; //1µ
      case -5: x *= 1000000; prefix = "µ"; break; //10µ
      case -4: break; //0.0001
      case -3: break; //0.001
      case -2: break; //0.01
      case -1: break; //0.1
      case 0:  break; //1
      case 1:  break; //10
      case 2:  break; //100
      case 3:  break; //1000
      case 4:  x /= 1000; prefix = "k"; break; //10k
      case 5:  x /= 1000; prefix = "k"; break; //100k
      case 6:  x /= 1000000; prefix = "M"; break; //1M
      case 7:  x /= 1000000; prefix = "M"; break; //10M
      case 8:  x /= 1000000; prefix = "M"; break; //100M
      case 9:  x /= 1000000000; prefix = "B"; break; //1B
      case 10: x /= 1000000000; prefix = "B"; break; //10B
      case 11: x /= 1000000000; prefix = "B"; break; //100B
      case 12: x /= 1000000000000; prefix = "TR"; break; //1TR
      case 13: x /= 1000000000000; prefix = "TR"; break; //10TR
      case 14: x /= 1000000000000; prefix = "TR"; break; //100TR
      //use the D3 SI formatting for the extreme cases
      default: return (d3.format("." + prec + "s")(x)).replace("G", "B");
    }
    /* eslint-enable */

      let formatted = d3.format("." + prec + format)(x);
      //remove trailing zeros if dot exists to avoid numbers like 1.0M, 3.0B, 1.500, 0.9700, 0.0
      if (formatted.indexOf(".") > -1) formatted = formatted.replace(/0+$/, "").replace(/\.$/, "");


      // use manual formatting for the cases above
      return (formatted + prefix + (percentageMode === PERCENT || percentageMode === SHARE ? "%" : ""));
    };
  },

  /**
   * Gets the d3 scale for this hook. if no scale then builds it
   * @returns {Array} domain
   */
  getScale() {
    if (this.scale == null) console.warn("scale is null");
    return this.scale;
  },

  /**
   * Gets unique values in a column
   * @param {String|Array} attr parameter
   * @returns {Array} unique values
   */
  getUnique(attr) {
    if (!this.isHook()) return;
    if (!attr) attr = this._getFirstDimension({ type: "time" });
    return this.dataSource.getData(this._dataId, "unique", attr);
  },


  getData() {
    return this.dataSource.getData(this._dataId);
  },

  /**
   * gets dataset without null or nan values with respect to this hook's which
   * @returns {Object} filtered items object
   */
  getValidItems() {
    return this.dataSource.getData(this._dataId, "valid", this.which);
  },

  /**
   * gets nested dataset
   * @param {Array} keys define how to nest the set
   * @returns {Object} hash-map of key-value pairs
   */
  getNestedItems(keys) {
    if (!keys) return utils.warn("No keys provided to getNestedItems(<keys>)");
    return this.dataSource.getData(this._dataId, "nested", keys);
  },

  getHaveNoDataPointsPerKey() {
    return this.dataSource.getData(this._dataId, "haveNoDataPointsPerKey", this.which);
  },

  /**
   * Gets limits
   * @param {String} attr parameter
   * @returns {Object} limits (min and max)
   */
  getLimits(attr) {
    return this.dataSource.getData(this._dataId, "limits", attr);
  },

  getFrame(steps, forceFrame, selected) {
    return this.dataSource.getFrame(this._dataId, steps, forceFrame, selected);
  },

  getFrames(steps, selected) {
    return this.dataSource.getFrames(this._dataId, steps, selected);
  },

  /**
   * gets hook values according dimension values
   */
  getItems() {
    const _this = this;
    const dim = this.spaceRef && this._space[this.spaceRef] ? this._space[this.spaceRef].dim : _this._getFirstDimension({ exceptType: "time" });
    const items = {};
    const validItems = this.getValidItems();

    if (utils.isArray(validItems)) {
      validItems.forEach(d => {
        items[d[dim]] = d[_this.which];
      });
    }

    return items;
  },

  getLimitsByDimensions(dims) {
    const filtered = this.dataSource.getData(this._dataId, "nested", dims);
    const values = {};
    const limitsDim = {};
    const attr = this.which;

    const countLimits = function(items, limitsDim, id) {

      const filtered = items.reduce((filtered, d) => {

        // check for dates
        const f = (utils.isDate(d[attr])) ? d[attr] : parseFloat(d[attr]);

        // if it is a number
        if (!isNaN(f)) {
          filtered.push(f);
        }

        //filter
        return filtered;
      }, []);

      // get min/max for the filtered rows
      let min;
      let max;
      const limits = {};
      for (let i = 0; i < filtered.length; i += 1) {
        const c = filtered[i];
        if (typeof min === "undefined" || c < min) {
          min = c;
        }
        if (typeof max === "undefined" || c > max) {
          max = c;
        }
      }
      limits.min = min || 0;
      limits.max = max || 100;
      limitsDim[id] = limits;

    };

    utils.forEach(filtered, (times, key) => {
      const limit = limitsDim[JSON.parse(key).join(",")] = {};
      utils.forEach(times, (item, time) => {
        countLimits(item, limit, time);
      });
    });

    return limitsDim;
  },

  /**
   * Gets the concept properties of the hook's "which"
   * @returns {Object} concept properties
   */
  getConceptprops() {
    return this.use !== "constant" && this.dataSource ? this.dataSource.getConceptprops(this.which) : {};
  },

  /**
   * Find if a current model is discrete
   * @returns {boolean} true if it's a discrete model, false if continious
   */
  isDiscrete() {
    return this.scaleType === "ordinal";
  },

  validate() {
    this._super();

    // validate scale type: only makes sense if which is defined
    if (this.which) {
      const { scaleType } = this;
      let { scales = [] } = this.getConceptprops() || {};
      if (this.allow && this.allow.scales && this.allow.scales.length > 0) {
        scales = scales.filter(val => this.allow.scales.indexOf(val) != -1);
      }

      const scaleTypeIsAllowed = scales.includes(scaleType);
      const genericLogIsAllowed = scales.includes("log") && scaleType === "genericLog";
      if (!(scaleTypeIsAllowed || genericLogIsAllowed) && scales.length > 0) {
        const [firstAllowedScaleType] = scales;
        this.set({ scaleType: firstAllowedScaleType }, null, false);
      }
    }
  },

  getEntity() {
    return this._space[this.spaceRef] || this._parent._space[this.spaceRef] || this._parent._space[this._parent.getSpace()[0]];
  },

  getDataKeys() {
    return this.spaceRef ? [this.getEntity().dim] : this._getAllDimensions({ exceptType: "time" });
  }
});

export default Hook;
