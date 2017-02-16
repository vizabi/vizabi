import * as utils from 'base/utils';
import DataConnected from 'models/dataconnected';

/*!
 * VIZABI Entities Model
 */

var EntitiesModel = DataConnected.extend({

  /**
   * Default values for this model
   */
  getClassDefaults: function() {
    var defaults = {
      show: {},
      dim: null,
      skipFilter: false
    };
    return utils.deepExtend(this._super(), defaults);
  },

  objectLeafs: ['show','autogenerate'],
  dataConnectedChildren: ['show','dim'],

  /**
   * Initializes the entities model.
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init: function(name, values, parent, bind) {

    this._type = "entities";

    this._super(name, values, parent, bind);
  },

  afterPreload: function() {
    if (this.dim == null && this.autogenerate) {
      var dataSource = this.getClosestModel(this.autogenerate.data);
      this.dim = dataSource.getConceptByIndex(this.autogenerate.conceptIndex).concept;
    }
  },

  /**
   * Gets the dimensions in this entities
   * @returns {String} String with dimension
   */
  getDimension: function() {
    return this.dim;
  },

  /**
   * Gets the filter in this entities
   * @returns {Array} Array of unique values
   */
  getFilter: function() {
    return this.skipFilter ? [] : this.show;
  },

  /**
   * Shows or unshows an entity from the set
   */
  showEntity: function(d) {
    //clear selected countries when showing something new
    var newShow = utils.deepClone(this.show);
    var dimension = this.getDimension();
    var _d;

    if(!utils.isArray(d)) {
      _d = [d];
    } else {
      _d = d;
    }

    var showArray = [];

    // get array from show
    if (this.show[dimension] && this.show[dimension]['$in'] && utils.isArray(this.show[dimension]['$in']))
      showArray = this.show[dimension]['$in'];

    utils.forEach(_d, d => {
      var value = d[dimension];
      if(this.isShown(d)) {
        showArray = showArray.filter(function(d) { return d !== value; });
      } else {
        showArray = showArray.concat(value);
      }
    });

    if (showArray.length === 0)
      delete newShow[dimension];
    else
      newShow[dimension] = { '$in': showArray };

    this.show = newShow;
  },

  /**
   * Selects an entity from the set
   * @returns {Boolean} whether the item is shown or not
   */
  isShown: function(d) {
    var dimension = this.getDimension();
    return this.show[dimension] && this.show[dimension]['$in'] && this.show[dimension]['$in'].indexOf(d[dimension]) !== -1;
  },

  /**
   * Clears showing of items
   */
  clearShow: function() {
    var dimension = this.getDimension();
    var show = utils.deepClone(this.show);
    delete show[dimension];
    this.show = show;
  },

  getFilteredEntities: function() {
    var dimension = this.getDimension();
    if (this.show[dimension] && this.show[dimension]['$in'] && utils.isArray(this.show[dimension]['$in'])) {
      var showArray = this.show[dimension]['$in'];
      return showArray.map(m => {
        var _m = {};
        _m[dimension] = m;
        return _m;
      });
    } else {
      return false;
    }
  }

});

export default EntitiesModel;
