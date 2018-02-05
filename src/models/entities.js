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
      filter: {},
      dim: null
    };
    return utils.deepExtend(this._super(), defaults);
  },

  objectLeafs: ["show", "filter", "autoconfig"],
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
    const filter = utils.deepClone(this.filter);
    if (entityTypeRequest) return filter;

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

    let showArray = [];

    // get array from show
    if (this.show[dimension] && this.show[dimension]["$in"] && utils.isArray(this.show[dimension]["$in"]))
      showArray = this.show[dimension]["$in"];

    utils.forEach(_d, d => {
      const value = d[dimension];
      if (this.isShown(d)) {
        showArray = showArray.filter(d => d !== value);
      } else {
        showArray = showArray.concat(value);
      }
    });

    if (showArray.length === 0)
      delete newShow[dimension];
    else
      newShow[dimension] = { "$in": showArray };

    this.show = newShow;
  },

  loadData() {
    const _this = this;
    if (!this.dim) {
      this._entitySets = {};
      this._entitySetsData = {};
      this._entitySetsValues = {};
      return Propmise.resolve();
    }

    const dim = this.dim;
    this._entitySets = { [dim]: this._root.dataManager.getAvailableDataForKey(dim, null, "entities")
      .filter(d => ["entity_set", "entity_domain"].includes(this._root.dataManager.getConceptProperty(d.value, "concept_type")))
      .map(d => d.value) };

    const loadPromises = [this._root.dataManager.getDimensionValues(dim, this._entitySets[dim])]
      .concat(this._entitySets[dim].map(entitySetName => this._root.dataManager.getDimensionValues(entitySetName, ["name"])));

    return Promise.all(loadPromises).then(data => {
      _this._entitySetsValues = data[0];
      _this._entitySetsData = data.slice(1);
    });
  },

  /**
   * Selects an entity from the set
   * @returns {Boolean} whether the item is shown or not
   */
  isShown(d) {
    const dim = this.getDimension();
    const key = d[dim];

    const props = this._entitySetsValues[0].filter(v => v[dim] === key)[0] || {};

    const showFilter = this.show.$and || [this.show];

    let result = true;

    utils.forEach(showFilter, filter => {
      utils.forEach(Object.keys(filter), fKey => {
        result = utils.getProp(filter, [fKey, "$in"], []).includes(props[fKey]);
        return result;
      });
      return result;
    });

    return result;
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
