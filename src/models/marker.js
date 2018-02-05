import * as utils from "base/utils";
import Model from "base/model";

/*!
 * HOOK MODEL
 */

const Marker = Model.extend({

  getClassDefaults() {
    const defaults = {
      select: [],
      highlight: [],
      superHighlight: [],
      opacityHighlightDim: 0.1,
      opacitySelectDim: 0.3,
      opacityRegular: 1,
      limit: 1000,
      allowSelectMultiple: true
    };
    return utils.deepExtend(this._super(), defaults);
  },

  init(name, value, parent, binds, persistent) {
    const _this = this;

    this._type = "marker";
    this._visible = [];

    this._super(name, value, parent, binds, persistent);

    this.on("change", "space", this.updateSpaceReferences.bind(this));
  },

  setInterModelListeners() {
    this._super();
    this.updateSpaceReferences();
  },

  updateSpaceReferences() {
    utils.forEach(this.getSpace(), dimensionModel => {
      // make reference to dimension
      this._space[dimensionModel] = this.getClosestModel(dimensionModel);
    });
  },

  setSpace(newSpace) {
    const subHooks = Object.keys(this.getSubhooks(true));
    const setProps = {};
    const setWhichProps = {};
    const newDimModels = setProps["space"] = this._root.dimensionManager.getDimensionModelsForSpace(this._space, newSpace);
    const addedDimModels = newDimModels.filter(f => !this.space.includes(f));
    addedDimModels.forEach(dimensionModel => {
      const dimModel = this.getClosestModel(dimensionModel);
      const labelModelName = "label" + dimensionModel.replace(dimModel._type, "");
      const props = { which: dimModel.dim, use: "property" };
      //change which to 'name' if 'name' property available for dimension
      const nameData = this._root.dataManager.getAvailableDataForKey(dimModel.dim, "name", "entities")[0];
      if (nameData) {
        props.which = nameData.value;
        props.data = nameData.data;
      }
      if (subHooks.includes(labelModelName)) {
        props.spaceRef = dimensionModel;
        setProps[labelModelName] = props;
      } else {
        props.key = [{ concept: dimModel.dim }];
        props.dataSource = props.data;
        props.concept = props.which;
        setWhichProps[labelModelName] = props;
        setProps[labelModelName] = {};
      }
    });
    this.set(setProps);

    utils.forEach(setWhichProps, (props, hookName) => {
      this[hookName].setInterModelListeners();
      this[hookName].setWhich(props);
    });

    this._dataCube = this.getSubhooks(true);
  },

  getAvailableSpaces() {
    const spaces = new Map();
    utils.forEach(this._root._data, dataSource => {
      if (dataSource._type !== "data") return;

      const indicatorsDB = dataSource.getConceptprops();

      dataSource.keyAvailability.forEach((space, str) => {
        if (space.length > 1) { // supported dimensions might later depend on tool.
          spaces.set(str, space.map(dimension => indicatorsDB[dimension]));
        }
      });
    });
    return spaces;
  },

  getAvailableData() {
    const data = [];

    if (d3.keys(this._space).length === 0) return utils.warn("getAvailableData() is trying to access missing _space items of marker '" + this._name + "' which likely haven't been resoled in time");
    const dimensions = utils.unique(this.space.map(dim => this._space[dim].dim));

    utils.forEach(this._root._data, dataSource => {
      if (dataSource._type !== "data") return;

      const indicatorsDB = dataSource.getConceptprops();

      dataSource.dataAvailability.datapoints.forEach(kvPair => {
        if (dimensions.length == kvPair.key.size && dimensions.every(dim => kvPair.key.has(dim))) {
          data.push({
            key: kvPair.key,
            value: indicatorsDB[kvPair.value],
            dataSource
          });
        }
      });

      // get all available entity properties for current marker space
      const entitiesAvailability = [];
      dataSource.dataAvailability.entities.forEach(kvPair => {
        if (kvPair.value == null) return;
        dimensions.forEach(dim => {
          if (kvPair.key.has(dim) && kvPair.value.indexOf("is--") === -1) {
            data.push({
              key: Array.from(kvPair.key).map(concept => indicatorsDB[concept]),
              value: indicatorsDB[kvPair.value],
              dataSource
            });
          }
        });
      });

    });

    // just first dataModel, can lead to problems if first data source doesn't contain dim-concept
    const firstDataModel = this._root.dataManager.getDataModels().values().next().value;
    dimensions
      .filter(dim => dim != null)
      .forEach(dim => data.push({
        key: [firstDataModel.getConceptprops(dim)],
        value: firstDataModel.getConceptprops(dim),
        dataSource: firstDataModel
      }));
    data.push({
      key: [firstDataModel.getConceptprops("_default")],
      value: firstDataModel.getConceptprops("_default"),
      dataSource: firstDataModel
    });

    return data;
  },


  getAvailableConcept({ index: index = 0, type: type = null, includeOnlyIDs: includeOnlyIDs = [], excludeIDs: excludeIDs = [] } = { }) {
    if (!type && includeOnlyIDs.length == 0 && excludeIDs.length == 0) {
      return null;
    }

    const filtered = this.getAvailableData().filter(f =>
      (!type || !f.value.concept_type || f.value.concept_type === type)
      && (includeOnlyIDs.length == 0 || includeOnlyIDs.indexOf(f.value.concept) !== -1)
      && (excludeIDs.length == 0 || excludeIDs.indexOf(f.value.concept) == -1)
    );
    return filtered[index] || filtered[filtered.length - 1];
  },

  setDataSourceForAllSubhooks(data) {
    const obj = {};
    this.getSubhooks().forEach(hook => { obj[hook._name] = { data }; });
    this.set(obj, null, false);
  },


  /**
   * Validates the model
   */
  validate() {
    const _this = this;
    const dimension = this.getDimension();
    const visible_array = this._visible.map(d => d[dimension]);

    if (visible_array.length) {
      this.select = this.select.filter(f => visible_array.indexOf(f[dimension]) !== -1);
      this.setHighlight(this.highlight.filter(f => visible_array.indexOf(f[dimension]) !== -1));
    }
  },

  /**
   * Sets the visible entities
   * @param {Array} arr
   */
  setVisible(arr) {
    this._visible = arr;
  },

  /**
   * Gets the visible entities
   * @returns {Array} visible
   */
  getVisible(arr) {
    return this._visible;
  },

  /**
   * Gets the selected items
   * @returns {Array} Array of unique selected values
   */
  getSelected(dim) {
    return dim ? this.select.map(d => d[dim]) : this.select;
  },

  selectMarker(d) {
    const _this = this;
    const value = this._createValue(d);
    if (this.isSelected(d)) {
      this.select = this.select.filter(d => JSON.stringify(_this._createValue(d)) !== JSON.stringify(value));
    } else {
      this.select = (this.allowSelectMultiple) ? this.select.concat(value) : [value];
    }
  },

  /**
   * Select all entities
   */
  selectAll(timeDim, timeFormatter) {
    if (!this.allowSelectMultiple) return;

    let added;
    const dimensions = utils.unique(this._getAllDimensions({ exceptType: "time" }));

    this.select = this._visible.map(d => {
      added = {};
      dimensions.forEach(dimension => added[dimension] = d[dimension]);
      return added;
    });
  },

  isSelected(d) {
    const _this = this;
    const value = JSON.stringify(this._createValue(d));

    return this.select
      .map(d => JSON.stringify(_this._createValue(d)) === value)
      .indexOf(true) !== -1;
  },

  _createValue(d) {
    const dims = this._getAllDimensions({ exceptType: "time" });
    return dims.reduce((value, key) => {
      value[key] = d[key];
      return value;
    }, {});
  },


  /**
   * Gets the highlighted items
   * @returns {Array} Array of unique highlighted values
   */
  getHighlighted(dim) {
    return dim ? this.highlight.map(d => d[dim]) : this.highlight;
  },

  setHighlight(arg) {
    if (!utils.isArray(arg)) {
      this.setHighlight([].concat(arg));
      return;
    }
    this.getModelObject("highlight").set(arg, false, false); // highlights are always non persistent changes
  },

  setSuperHighlight(value) {
    this.getModelObject("superHighlight")
      .set(utils.isArray(value) ? value : [value], false, false);
  },

  clearSuperHighlighted() {
    this.setSuperHighlight([]);
  },

  isSuperHighlighted(d) {
    const value = JSON.stringify(this._createValue(d));

    return ~this.superHighlight.findIndex(d => JSON.stringify(d) === value);
  },

  setSelect(arg) {
    if (!utils.isArray(arg)) {
      this.setSelect([].concat(arg));
      return;
    }
    this.getModelObject("select").set(arg);
  },

  //TODO: join the following 3 methods with the previous 3

  /**
   * Highlights an entity from the set
   */
  highlightMarker(d) {
    const value = this._createValue(d);
    if (!this.isHighlighted(d)) {
      this.setHighlight(this.highlight.concat(value));
    }
  },

  /**
   * Unhighlights an entity from the set
   */
  unhighlightEntity(d) {
    const value = this._createValue(d);
    if (this.isHighlighted(d)) {
      this.setHighlight(this.highlight.filter(d => d[dimension] !== value));
    }
  },

  /**
   * Checks whether an entity is highlighted from the set
   * @returns {Boolean} whether the item is highlighted or not
   */
  isHighlighted(d) {
    const _this = this;
    const value = JSON.stringify(this._createValue(d));
    return this.highlight
      .map(d => JSON.stringify(_this._createValue(d)) === value)
      .indexOf(true) !== -1;
  },

  /**
   * Clears selection of items
   */
  clearHighlighted() {
    this.setHighlight([]);
  },
  clearSelected() {
    this.select = [];
  },

  setLabelOffset(d, xy) {
    if (xy[0] === 0 && xy[1] === 1) return;

    const KEYS = utils.unique(this._getAllDimensions({ exceptType: "time" }));
    const KEY = KEYS.join(",");

    this.select
      .find(selectedMarker => utils.getKey(selectedMarker, KEYS) == d[KEY])
      .labelOffset = [Math.round(xy[0] * 1000) / 1000, Math.round(xy[1] * 1000) / 1000];

    //force the model to trigger events even if value is the same
    this.set("select", this.select, true);
  },

  /**
   * Gets the narrowest limits of the subhooks with respect to the provided data column
   * @param {String} attr parameter (data column)
   * @returns {Object} limits (min and max)
   * this function is only needed to route the "time" to some indicator,
   * to adjust time start and end to the max and min time available in data
   */
  getTimeLimits() {
    const _this = this;
    const time = this._parent.time;
    const minArray = [], maxArray = [];
    let min, max, items = {};
    if (!this.cachedTimeLimits) this.cachedTimeLimits = {};
    utils.forEach(this.getSubhooks(), hook => {

      //only indicators depend on time and therefore influence the limits
      if (hook.use !== "indicator" || hook.which == time.dim || !hook._important || !hook._dataId) return;

      const cachedLimits = _this.cachedTimeLimits[hook._dataId + hook.which];

      if (cachedLimits) {
        //if already calculated the limits then no ned to do it again
        min = cachedLimits.min;
        max = cachedLimits.max;
      } else {
        //otherwise calculate own date limits (a costly operation)
        items = hook.getValidItems().map(m => m[time.getDimension()]);
        if (items.length == 0) utils.warn("getTimeLimits() was unable to work with an empty array of valid datapoints");
        min = d3.min(items);
        max = d3.max(items);
      }
      _this.cachedTimeLimits[hook._dataId + hook.which] = { min, max };
      minArray.push(min);
      maxArray.push(max);
    });

    let resultMin = d3.max(minArray);
    let resultMax = d3.min(maxArray);
    if (resultMin > resultMax) {
      utils.warn("getTimeLimits(): Availability of the indicator's data has no intersection. I give up and just return some valid time range where you'll find no data points. Enjoy!");
      resultMin = d3.min(minArray);
      resultMax = d3.max(maxArray);
    }

    //return false for the case when neither of hooks was an "indicator" or "important"
    return !min && !max ? false : { min: resultMin, max: resultMax };
  },

  getImportantHooks() {
    const importantHooks = [];
    utils.forEach(this._dataCube || this.getSubhooks(true), (hook, name) => {
      if (hook._important) {
        importantHooks.push(name);
      }
    });
    return importantHooks;
  },

  getLabelHookNames() {
    const _this = this;
    const KEYS = utils.unique(this._getAllDimensions({ exceptType: "time" }));

    return KEYS.reduce((result, key) => {
      const names = {};
      utils.forEach(_this._dataCube || _this.getSubhooks(true), (hook, name) => {
        if (hook.use !== "property") return;
        if (hook._type === "label" && hook.getEntity().dim === key) {
          names.label = name;
        }
        if (hook._type !== "label" && hook.getEntity().dim === key) {
          names.key = name;
        }
        return !names.label || !names.key;
      });
      result[key] = names.label || names.key;
      return result;
    }, {});
  },

  getDataKeysPerHook() {
    const result = {};
    utils.forEach(this._dataCube || this.getSubhooks(true), (hook, name) => {
      result[name] = hook.getDataKeys();
    });
    return result;
  },

  /**
   * Computes the intersection of keys in all hooks: a set of keys that have data in each hook
   * @returns array of keys that have data in all hooks of this._datacube
   */
  getKeys(KEYS) {
    const _this = this;
    let resultKeys;

    KEYS = KEYS || utils.unique(this._getAllDimensions({ exceptType: "time" }));
    KEYS = Array.isArray(KEYS) ? KEYS : [KEYS];
    const TIME = this._getFirstDimension({ type: "time" });

    const subHooks = this._dataCube || this.getSubhooks(true);

    const hooksPerKey = KEYS.map(_ => []);
    const dataSourcePerKey = KEYS.map(_ => []);
    //try to find hooks with entity queries for each subkey of KEYS
    utils.forEach(subHooks, (hook, name) => {
      if (hook.use === "property") {
        const keyIndex = KEYS.indexOf(hook.getEntity().dim);
        if (keyIndex !== -1 && !dataSourcePerKey[keyIndex].includes(hook.dataSource)) {
          hooksPerKey[keyIndex].push(hook);
          dataSourcePerKey[keyIndex].push(hook.dataSource);
        }
      }
    });

    //try to get keys from indicators if marker does not have hooks with entity queries
    //in each dataSource for some subkey of KEYS
    utils.forEach(subHooks, (hook, name) => {
      if (hook.use === "indicator") {
        hook.getDataKeys().forEach(key => {
          const keyIndex = KEYS.indexOf(key);
          if (keyIndex !== -1 && !dataSourcePerKey[keyIndex].includes(hook.dataSource)) {
            hooksPerKey[keyIndex].push(hook);
          }
        });
      }
    });

    hooksPerKey.forEach((hooks, keyIndex) => {
      let keys = [];
      hooks.forEach(hook => {
        const hookKeys = hook.getDataKeys();
        const hookKeyIndex = hookKeys.indexOf(KEYS[keyIndex]);
        keys = keys.concat(Object.keys(hook.getNestedItems(hookKeys.concat(TIME))).map(key => [JSON.parse(key)[hookKeyIndex]]));
      });
      keys = utils.unique(keys);
      resultKeys = resultKeys ? d3.cross(resultKeys, keys, (a, b) => a.concat(b)) : keys;
    });

    utils.forEach(subHooks, (hook, name) => {
      // If hook use is constant, then we can provide no additional info about keys
      // We can just hope that we have something else than constants =)
      if (!hook._important || hook.use === "constant") return;

      const hookKEYS = hook.getDataKeys();
      const hookKEYSIndexes = hookKEYS.map(key => KEYS.indexOf(key)).reduce((indexes, index, i) => {
        if (index !== -1) indexes[i] = index;
        return indexes;
      }, []);

      if (!hookKEYSIndexes.length) return;

      // Get keys in data of this hook
      const nested = hook.getNestedItems(hookKEYS.concat(TIME));
      const noDataPoints = hook.getHaveNoDataPointsPerKey();

      const keys = Object.keys(nested);
      const keysNoDP = Object.keys(noDataPoints || []);

      // Remove the keys with no timepoints
      const keysSizeEqual = KEYS.every((key, i) => key === hookKEYS[i]);
      const filteredKeys = keys.reduce((keys, key) => {
        if (keysNoDP.indexOf(key) == -1) keys[JSON.stringify(hookKEYSIndexes.map((_, i) => JSON.parse(key)[i]))] = true;
        return keys;
      }, {});

      const resultKeysMapped = resultKeys.map(key => JSON.stringify(hookKEYSIndexes.map(index => key[index])));

      resultKeys = resultKeys.filter((_, i) => filteredKeys[resultKeysMapped[i]]);
    });

    if (resultKeys.length > _this.limit) {
      utils.warn("MARKER getKeys(): only showing the first " + _this.limit + " markerElements of " + _this._name + ". The rest are not displayed because chart may become slow and crash. Set a higher number in marker.limit or apply entity filters");
      resultKeys = resultKeys.slice(0, _this.limit);
    }
    return resultKeys.map(key => { const r = {}; KEYS.map((KEY, i) => r[KEY] = key[i]); return r; });
  },

  /**
   * @param {Array} entities array of entities
   * @return String
   */
  _getCachePath(keys) {
    //array of steps -- names of all frames
    const steps = this._parent.time.getAllSteps();
    let cachePath = `${this.getClosestModel("locale").id} - ${steps[0]} - ${steps[steps.length - 1]} - step:${this._parent.time.step}`;
    this._dataCube = this._dataCube || this.getSubhooks(true);
    let dataLoading = false;
    utils.forEach(this._dataCube, (hook, name) => {
      if (hook._loadCall) dataLoading = true;
      cachePath = cachePath + "_" +  hook._dataId + hook.which;
    });
    if (dataLoading) {
      return null;
    }
    if (keys) {
      cachePath = cachePath + "_" + keys.join(",");
    }
    return cachePath;
  },

  _getGrouping() {
    const subHooks = this._dataCube || this.getSubhooks(true);
    const space = subHooks[Object.keys(subHooks)[0]]._space;
    const result = {};
    utils.forEach(space, entities => {
      if (entities.grouping) {
        result[entities.dim] = { grouping: entities.grouping };
      }
    });
    return utils.isEmpty(result) ? false : result;
  },

  _getAllDimensions(opts) {

    const models = [];
    const _this = this;
    utils.forEach(this.space, name => {
      models.push(_this.getClosestModel(name));
    });

    opts = opts || {};
    const dims = [];
    let dim;

    utils.forEach(models, m => {
      if (opts.exceptType && m.getType() === opts.exceptType) {
        return true;
      }
      if (opts.onlyType && m.getType() !== opts.onlyType) {
        return true;
      }
      if (dim = m.getDimension()) {
        dims.push(dim);
      }
    });

    return dims;
  },


  /**
   * gets first dimension that matches type
   * @param {Object} options
   * @returns {Array} all unique dimensions
   */
  _getFirstDimension(opts) {
    const models = [];
    const _this = this;
    utils.forEach(this.space, name => {
      models.push(_this.getClosestModel(name));
    });

    opts = opts || {};

    let dim = false;
    utils.forEach(models, m => {
      if (opts.exceptType && m.getType() !== opts.exceptType) {
        dim = m.getDimension();
        return false;
      } else if (opts.type && m.getType() === opts.type) {
        dim = m.getDimension();
        return false;
      } else if (!opts.exceptType && !opts.type) {
        dim = m.getDimension();
        return false;
      }
    });
    return dim;
  },


  framesAreReady() {
    const cachePath = this._getCachePath();
    if (!this.cachedFrames) return false;
    return Object.keys(this.cachedFrames[cachePath]).length == this._parent.time.getAllSteps().length;
  },

  /**
   *
   * @param {String|null} time of a particularly requested data frame. Null if all frames are requested
   * @param {function} cb
   * @param {Array} keys array of entities
   * @return null
   */
  getFrame(time, cb, keys) {
    //keys = null;
    const _this = this;
    if (!this.cachedFrames) this.cachedFrames = {};

    const steps = this._parent.time.getAllSteps();
    // try to get frame from cache without keys
    let cachePath = this._getCachePath();
    if (!cachePath) return cb(null, time);
    if (time && _this.cachedFrames[cachePath] && _this.cachedFrames[cachePath][time]) {
      // if it does, then return that frame directly and stop here
      //QUESTION: can we call the callback and return the frame? this will allow callbackless API too
      return cb(_this.cachedFrames[cachePath][time], time);
    }
    cachePath = this._getCachePath(keys);
    if (!cachePath) return cb(null, time);

    // check if the requested time point has a cached animation frame
    if (time && _this.cachedFrames[cachePath] && _this.cachedFrames[cachePath][time]) {
      // if it does, then return that frame directly and stop here
      //QUESTION: can we call the callback and return the frame? this will allow callbackless API too
      return cb(_this.cachedFrames[cachePath][time], time);
    }

    // if it doesn't (the requested time point falls between animation frames or frame is not cached yet)
    // check if interpolation makes sense: we've requested a particular time and we have more than one frame
    if (time && steps.length > 1) {

      //find the next frame after the requested time point
      const nextFrameIndex = d3.bisectLeft(steps, time);

      if (!steps[nextFrameIndex]) {
        utils.warn("The requested frame is out of range: " + time);
        cb(null, time);
        return null;
      }

      //if "time" doesn't hit the frame precisely
      if (steps[nextFrameIndex].toString() != time.toString()) {

        //interpolate between frames and fire the callback
        this._interpolateBetweenFrames(time, nextFrameIndex, steps, response => {
          cb(response, time);
        }, keys);
        return null;
      }
    }

    //QUESTION: we don't need any further execution after we called for interpolation, right?
    //request preparing the data, wait until it's done
    _this.getFrames(time, keys).then(() => {
      if (!time && _this.cachedFrames[cachePath]) {
        //time can be null: then return all frames
        return cb(_this.cachedFrames[cachePath], time);
      } else if (_this.cachedFrames[cachePath] && _this.cachedFrames[cachePath][time]) {
        //time can be !null: then a particular frame calculation was forced and now it's done
        return cb(_this.cachedFrames[cachePath][time], time);
      }
      utils.warn("marker.js getFrame: Data is not available for frame: " + time);
      return cb(null, time);
    });
  },

  _interpolateBetweenFrames(time, nextFrameIndex, steps, cb, keys) {
    const _this = this;

    if (nextFrameIndex == 0) {
      //getFrame makes sure the frane is ready because a frame with non-existing data might be adressed
      this.getFrame(steps[nextFrameIndex], values => cb(values), keys);
    } else {
      const prevFrameTime = steps[nextFrameIndex - 1];
      const nextFrameTime = steps[nextFrameIndex];

      //getFrame makes sure the frane is ready because a frame with non-existing data might be adressed
      this.getFrame(prevFrameTime, pValues => {
        _this.getFrame(nextFrameTime, nValues => {
          const fraction = (time - prevFrameTime) / (nextFrameTime - prevFrameTime);
          const dataBetweenFrames = {};

          //loop across the hooks
          utils.forEach(pValues, (values, hook) => {
            dataBetweenFrames[hook] = {};

            //loop across the entities
            utils.forEach(values, (val1, key) => {
              const val2 = nValues[hook][key];
              if (utils.isDate(val1)) {
                dataBetweenFrames[hook][key] = time;
              } else if (!utils.isNumber(val1)) {
                //we can be interpolating string values
                dataBetweenFrames[hook][key] = val1;
              } else {
                //interpolation between number and null should rerurn null, not a value in between (#1350)
                dataBetweenFrames[hook][key] = (val1 == null || val2 == null) ? null : val1 + ((val2 - val1) * fraction);
              }
            });
          });
          cb(dataBetweenFrames);

        }, keys);
      }, keys);
    }
  },

  getFrames(forceFrame, selected) {
    const _this = this;
    if (!this.cachedFrames) this.cachedFrames = {};

    const KEYS = utils.unique(this._getAllDimensions({ exceptType: "time" }));
    const TIME = this._getFirstDimension({ type: "time" });

    if (!this.frameQueues) this.frameQueues = {}; //static queue of frames
    if (!this.partialResult) this.partialResult = {};

    //array of steps -- names of all frames
    const steps = this._parent.time.getAllSteps();

    const cachePath = this._getCachePath(selected);
    if (!cachePath) return new Promise((resolve, reject) => { resolve(); });
    //if the collection of frames for this data cube is not scheduled yet (otherwise no need to repeat calculation)
    if (!this.frameQueues[cachePath] || !(this.frameQueues[cachePath] instanceof Promise)) {

      //this is a promise nobody listens to - it prepares all the frames we need without forcing any
      this.frameQueues[cachePath] = new Promise((resolve, reject) => {

        _this.partialResult[cachePath] = {};
        steps.forEach(t => { _this.partialResult[cachePath][t] = {}; });

        // Assemble the list of keys as an intersection of keys in all queries of all hooks
        const keys = _this.getKeys();

        const deferredHooks = [];
        // Assemble data from each hook. Each frame becomes a vector containing the current configuration of hooks.
        // frame -> hooks -> entities: values
        utils.forEach(_this._dataCube, (hook, name) => {
          if (hook.use === "constant") {
            //special case: fill data with constant values
            steps.forEach(t => {
              _this.partialResult[cachePath][t][name] = {};
              keys.forEach(key => {
                _this.partialResult[cachePath][t][name][utils.getKey(key, KEYS)] = hook.which;
              });
            });
          } else if (KEYS.includes(hook.which)) {
            //special case: fill data with keys to data itself
            steps.forEach(t => {
              _this.partialResult[cachePath][t][name] = {};
              keys.forEach(key => {
                _this.partialResult[cachePath][t][name][key[hook.which]] = key[hook.which];
              });
            });
          } else if (hook.which === TIME) {
            //special case: fill data with time points
            steps.forEach(t => {
              _this.partialResult[cachePath][t][name] = {};
              keys.forEach(key => {
                _this.partialResult[cachePath][t][name][utils.getKey(key, KEYS)] = new Date(t);
              });
            });
          } else {
            //calculation of async frames is taken outside the loop
            //hooks with real data that needs to be fetched from datamanager
            deferredHooks.push(hook);
          }
        });

        //check if we have any data to get from datamanager
        if (deferredHooks.length > 0) {
          const promises = [];
          utils.forEach(deferredHooks, hook => {
            promises.push(new Promise((res, rej) => {
              // need to save the hook state before calling getFrames.
              // `hook` state might change between calling and resolving the call.
              // The result needs to be saved to the correct cache, so we need to save current hook state
              const currentHookState = {
                name: hook._name,
                which: hook.which
              };
              hook.getFrames(steps, selected).then(response => {
                utils.forEach(response, (frame, t) => {
                  _this.partialResult[cachePath][t][currentHookState.name] = frame[currentHookState.which];
                });
                res();
              });
            }));
          });
          Promise.all(promises).then(() => {
            _this.cachedFrames[cachePath] = _this.partialResult[cachePath];
            resolve();
          });
        } else {
          _this.cachedFrames[cachePath] = _this.partialResult[cachePath];
          resolve();
        }

      });
    }
    return new Promise((resolve, reject) => {
      if (steps.length < 2 || !forceFrame) {
        //wait until the above promise is resolved, then resolve the current promise
        _this.frameQueues[cachePath].then(() => {
          resolve(); //going back to getFrame(), to ".then"
        });
      } else {
        const promises = [];
        utils.forEach(_this._dataCube, (hook, name) => {
          //exception: we know that these are knonwn, no need to calculate these
          if (hook.use !== "constant" && !KEYS.includes(hook.which) && hook.which !== TIME) {
            (function(_hook, _name) {
              promises.push(new Promise((res, rej) => {
                _hook.getFrame(steps, forceFrame, selected).then(response => {
                  _this.partialResult[cachePath][forceFrame][_name] = response[forceFrame][_hook.which];
                  res();
                });
              }));
            })(hook, name); //isolate this () code with its own hook and name
          }
        });
        if (promises.length > 0) {
          Promise.all(promises).then(() => {
            if (!_this.cachedFrames[cachePath]) {
              _this.cachedFrames[cachePath] = {};
            }
            _this.cachedFrames[cachePath][forceFrame] = _this.partialResult[cachePath][forceFrame];
            resolve();
          });
        } else {
          resolve();
        }
      }
    });

  },

  listenFramesQueue(keys, cb) {
    const _this = this;
    const KEYS = utils.unique(this._getAllDimensions({ exceptType: "time" }));
    const TIME = this._getFirstDimension({ type: "time" });
    const steps = this._parent.time.getAllSteps();
    const preparedFrames = {};
    this.getFrames();
    const dataIds = [];

    const stepsCount = steps.length;
    let isDataLoaded = false;

    utils.forEach(_this._dataCube, (hook, name) => {
      if (!(hook.use === "constant" || KEYS.includes(hook.which) || hook.which === TIME)) {
        if (!dataIds.includes(hook._dataId)) {
          dataIds.push(hook._dataId);

          hook.dataSource.listenFrame(hook._dataId, steps, keys, (dataId, time) => {
            const keyName = time.toString();
            if (typeof preparedFrames[keyName] === "undefined") preparedFrames[keyName] = [];
            if (!preparedFrames[keyName].includes(dataId)) preparedFrames[keyName].push(dataId);
            if (preparedFrames[keyName].length === dataIds.length)  {
              if (!isDataLoaded && stepsCount === Object.keys(preparedFrames).length) {
                isDataLoaded = true;
                _this.trigger("dataLoaded");
              }

              cb(time);
            }
          });
        }
      }
    });
  },

  getEntityLimits(entity) {
    const _this = this;
    const timePoints = this._parent.time.getAllSteps();
    const selectedEdgeTimes = [];
    const hooks = [];
    utils.forEach(_this.getSubhooks(), hook => {
      if (hook.use == "constant") return;
      if (hook._important) hooks.push(hook._name);
    });

    const findEntityWithCompleteHooks = function(values) {
      if (!values) return false;
      for (let i = 0, j = hooks.length; i < j; i++) {
        if (!(values[hooks[i]][entity] || values[hooks[i]][entity] === 0)) return false;
      }
      return true;
    };

    const findSelectedTime = function(iterator, findCB) {
      const point = iterator();
      if (point == null) return;
      _this.getFrame(timePoints[point], values => {
        if (findEntityWithCompleteHooks(values)) {
          findCB(point);
        } else {
          findSelectedTime(iterator, findCB);
        }
      });
    };
    const promises = [];
    promises.push(new Promise((resolve, reject) => {

      //find startSelected time
      findSelectedTime((function() {
        const max = timePoints.length;
        let i = 0;
        return function() {
          return i < max ? i++ : null;
        };
      })(), point => {
        selectedEdgeTimes[0] = timePoints[point];
        resolve();
      });
    }));

    promises.push(new Promise((resolve, reject) => {

      //find endSelected time
      findSelectedTime((function() {
        let i = timePoints.length - 1;
        return function() {
          return i >= 0 ? i-- : null;
        };
      })(), point => {
        selectedEdgeTimes[1] = timePoints[point];
        resolve();
      });

    }));

    return Promise.all(promises).then(() => ({ "min": selectedEdgeTimes[0], "max": selectedEdgeTimes[1] }));
  },


  getCompoundLabelText(d, values) {
    const DATAMANAGER = this._root.dataManager;
    const KEYS = utils.unique(this._getAllDimensions({ exceptType: "time" }));
    const labelNames = this.getLabelHookNames();

    let text = KEYS
      .filter(key => d[key] !== DATAMANAGER.getConceptProperty(key, "totals_among_entities"))
      .map(key => values[labelNames[key]] ? values[labelNames[key]][d[key]] : d[key])
      .join(", ");

    if (text === "") text = this._root.locale.getTFunction()("hints/grandtotal");

    return text;
  },


  /**
   * Learn what this model should hook to
   * @returns {Array} space array
   */
  getSpace() {
    if (utils.isArray(this.space)) {
      return this.space;
    }

    utils.error(
      'ERROR: space not found.\n You must specify the objects this hook will use under the "space" attribute in the state.\n Example:\n space: ["entities", "time"]'
    );
  }

});

export default Marker;
