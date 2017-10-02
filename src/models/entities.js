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
      dim: null,
      skipFilter: false
    };
    return utils.deepExtend(this._super(), defaults);
  },

  objectLeafs: ["show", "autoconfig"],
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
      const concept = this.dataSource.getConcept(this.autoconfig)
        || this.dataSource.getConcept({ type: "entity_domain" });

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
    if (this.dim === dim.concept) return;
    const props = {};
    props.show = {};
    props.dim = dim.concept;
    this.set(props);
  },
  /**
   * Gets the filter in this entities
   * @returns {Array} Array of unique values
   */
  getFilter() {
    let show;
    if (this.skipFilter) {
      show = {};
    } else {
      show = utils.deepClone(this.show);
      if (show[this.dim] && utils.isEmpty(show[this.dim])) {
        delete show[this.dim];
      }
    }
    return show;
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

  /**
   * Selects an entity from the set
   * @returns {Boolean} whether the item is shown or not
   */
  isShown(d) {
    const dimension = this.getDimension();

    return utils.getProp(this.show, [dimension, "$in"], []).includes(d[dimension]);
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
