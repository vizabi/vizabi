import * as utils from "base/utils";
import DataConnected from "models/dataconnected";

/*!
 * VIZABI Entities Model
 */

const EntitiesModel = DataConnected.extend({

  /**
   * Default values for this model
   */
  getClassDefaults() {
    const defaults = {
      show: {},
      showFallback: {},
      showItemsMaxCount: null,
      filter: {},
      dim: null,
      skipFilter: false
    };
    return utils.deepExtend(this._super(), defaults);
  },

  objectLeafs: ["show", "showFallback", "filter", "autoconfig"],
  dataConnectedChildren: ["show", "dim", "grouping"],

  /**
   * Initializes the entities model.
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init(name, values, parent, bind) {

    this._type = "entities";

    this._super(name, values, parent, bind);
  },

  preloadData() {
    this.dataSource = this.getClosestModel(this.data || "data");
    return this._super();
  },

  afterPreload() {
    this.autoconfigureModel();
  },

  autoconfigureModel() {
    if (!this.dim && this.autoconfig) {
      const concept = this.dataSource.getConcept(this.autoconfig);

      if (concept) this.dim = concept.concept;
      utils.printAutoconfigResult(this);
    }
  },

  setInterModelListeners() {
    this.getClosestModel("locale").on("dataConnectedChange", this.handleDataConnectedChange.bind(this));
  },

  validate() {
    this._super();
    if (!this.showFallback[this.dim] && !this.showItemsMaxCount) return;

    const dimShowFilter = this.show[this.dim] || (this.show.$and && this.show.$and.filter(f => f[this.dim])[0]);
    if (!dimShowFilter) {
      if (this.showFallback[this.dim]) {
        this.show = { [this.dim]: utils.deepClone(this.showFallback[this.dim]) };
      }
    } else if (dimShowFilter.$in && this.showItemsMaxCount && dimShowFilter.$in.length > this.showItemsMaxCount) {
      dimShowFilter.$in.splice(0, dimShowFilter.$in.length - this.showItemsMaxCount);
      this.show = utils.deepClone(this.show);
    }
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

  loadData() {
    this.setReady(false);
    this._loadCall = true;

    const _this = this;

    if (!this.dim) {
      this._entitySets = {};
      this._entitySetsData = {};
      this._entitySetsValues = {};
      return Promise.resolve();
    }

    const dim = this.dim;
    this._entitySets = { [dim]: this._root.dataManager.getAvailableDataForKey(dim, null, "entities")
      .filter(d => d.value !== dim && ["entity_set", "entity_domain"].includes(this._root.dataManager.getConceptProperty(d.value, "concept_type")))
      .map(d => d.value) };

    if (!this._entitySets[dim].length) {
      this._entitySetsValues = { [dim]: [] };
      this._entitySetsData = { [dim]: {} };
      return Promise.resolve();
    }

    const queryAddition = { "language": this.getClosestModel("locale").id };
    const loadPromises = [this._root.dataManager.getDimensionValues(dim, this._entitySets[dim], queryAddition)]
      .concat(this._entitySets[dim].map(entitySetName => this._root.dataManager.getDimensionValues(entitySetName, ["name"], queryAddition)));

    return Promise.all(loadPromises).then(data => {
      _this._entitySetsValues = { [dim]: data[0] };
      _this._entitySetsData = { [dim]: {} };
      _this._entitySets[dim].forEach((key, index) => {
        _this._entitySetsData[dim][key] = data[index + 1];
      });
    });
  },

  getEntitySets(type = "") {
    return this["_entitySets" + utils.capitalize(type)][this.dim];
  },
  /**
   * Gets the dimensions in this entities
   * @returns {String} String with dimension
   */
  getDimension() {
    return this.dim;
  },

  setDimension(dim) {
    if (this.dim === dim) return;
    const props = {};
    props.show = {};
    props.dim = dim;
    this.set(props);
  },
  /**
   * Gets the filter in this entities
   * @returns {Array} Array of unique values
   */
  getFilter({ entityTypeRequest } = {}) {
    const filter = utils.deepClone(this.filter[this.dim] || {});
    if (entityTypeRequest || this.skipFilter) return filter;

    const show = utils.deepClone(this.show);
    if (show[this.dim] && utils.isEmpty(show[this.dim])) {
      delete show[this.dim];
    }

    const $and = [];
    if (!utils.isEmpty(filter)) $and.push(filter);
    if (!utils.isEmpty(show)) $and.push(show);
    if ($and.length > 1) {
      return { $and };
    }

    return $and[0] || {};
  },

  /**
   * Shows or unshows an entity from the set
   */
  showEntity(d) {
    //clear selected countries when showing something new
    const newShow = utils.deepClone(this.show);
    const dimension = this.getDimension();
    let _d;

    if (!utils.isArray(d)) {
      _d = [d];
    } else {
      _d = d;
    }

    const showFilter = newShow[dimension] || (newShow.$and || []).filter(f => f[dimension])[0] || { $in: [] };

    utils.forEach(_d, d => {
      const value = d[dimension];
      if (this.isShown(d)) {
        showFilter["$in"] = showFilter["$in"].filter(d => d !== value);
      } else {
        showFilter["$in"] = showFilter["$in"].concat(value);
      }
    });

    if (showFilter["$in"].length === 0) {
      if (newShow.$and) {
        newShow.$and = newShow.$and.filter(f => !f[dimension]);
      } else {
        delete newShow[dimension];
      }
    } else {
      if (newShow.$and) {
        newShow.$and.push({ [dimension]: showFilter });
      } else {
        newShow[dimension] = showFilter;
      }
    }

    this.show = newShow;
  },

  /**
   * Selects an entity from the set
   * @returns {Boolean} whether the item is shown or not
   */
  isShown(d) {
    const dimension = this.getDimension();

    const { $in = [] } = this.show[dimension] || (this.show.$and || []).filter(f => f[dimension])[0] || {};

    return $in.includes(d[dimension]);
  },

  isInShowFilter(d, category) {
    const dim = this.getDimension();
    const key = d[dim];
    const filter = (this.show.$and || [this.show]).filter(f => f[category])[0] || {};

    return utils.getProp(filter, [category, "$in"], []).includes(d[category]);
  },

  /**
   * Clears showing of items
   */
  clearShow() {
    const dimension = this.getDimension();
    const show = utils.deepClone(this.show);
    delete show[dimension];
    this.show = show;
  },

  getFilteredEntities() {
    const dimension = this.getDimension();
    const { $in = [] } = this.show[dimension] || {};

    return $in.map(m => ({ [dimension]: m }));
  },

  isEntities() {
    return true;
  }

});

export default EntitiesModel;
