import * as utils from 'base/utils';
import DataConnected from 'models/dataconnected';

/*!
 * VIZABI Entities Model
 */

var EntitiesModel = DataConnected.extend({

  /**
   * Default values for this model
   */
  _defaults: {
    show: {},
  },

  objectLeafs: ['show'],
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
    return this.show;
  },

  /**
   * Shows or unshows an entity from the set
   */
  showEntity: function(d) {
    //clear selected countries when showing something new
    var newShow = utils.deepClone(this.show);
    var dimension = this.getDimension();
    var value = d[dimension];
    var showArray = [];

    // get array from show
    if (this.show[dimension] && this.show[dimension]['$in'] && utils.isArray(this.show[dimension]['$in']))
      showArray = this.show[dimension]['$in'];

    if(this.isShown(d)) {
      showArray = showArray.filter(function(d) { return d !== value; });
    } else {
      showArray = showArray.concat(value);
    }

    if (showArray.length === 0)
      delete newShow[dimension];
    else
      newShow[dimension] = { '$in': showArray };

    this.show = newShow;
  },

  setLabelOffset: function(d, xy) {
    if(xy[0]===0 && xy[1]===1) return;

    var dimension = this.getDimension();
    var value = d[dimension];

    utils.find(this.select, function(d) {
      return d[dimension] === value;
    }).labelOffset = [Math.round(xy[0]*1000)/1000, Math.round(xy[1]*1000)/1000];

    //force the model to trigger events even if value is the same
    this.set("select", this.select, true);
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
  }

});

export default EntitiesModel;
