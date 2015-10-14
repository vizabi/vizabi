import * as utils from 'base/utils';
import Model from 'base/model';
import globals from 'base/globals';

/*!
 * VIZABI Entities Model
 */

var EntitiesModel = Model.extend({

  /**
   * Default values for this model
   */
  _defaults: {
    show: {},
    select: [],
    highlight: [],
    opacitySelectDim: .3,
    opacityRegular: 1,
    needUpdate: {}
  },

  /**
   * Initializes the entities model.
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init: function(values, parent, bind) {

    this._type = "entities";
    //TODO: add defaults extend to super
    var defaults = utils.deepClone(this._defaults);
    values = utils.extend(defaults, values);

    this._visible = [];
    this._multiple = true;

    this._super(values, parent, bind);
  },

  /**
   * Validates the model
   * @param {boolean} silent Block triggering of events
   */
  validate: function(silent) {
    var _this = this;
    var dimension = this.getDimension();
    var visible_array = this._visible.map(function(d) {
      return d[dimension]
    });

    if(visible_array.length) {
      this.select = this.select.filter(function(f) {
        return visible_array.indexOf(f[dimension]) !== -1;
      });
      this.highlight = this.highlight.filter(function(f) {
        return visible_array.indexOf(f[dimension]) !== -1;
      });
    }
  },

  /**
   * Sets the visible entities
   * @param {Array} arr
   */
  setVisible: function(arr) {
    this._visible = arr;
  },

  /**
   * Gets the visible entities
   * @returns {Array} visible
   */
  getVisible: function(arr) {
    return this._visible;
  },

  /**
   * Determines whether multiple entities can be selected
   * @param {Boolean} bool
   */
  selectMultiple: function(bool) {
    this._multiple = bool;
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
    return this.show.getObject();
  },

  /**
   * Gets the selected items
   * @returns {Array} Array of unique selected values
   */
  getSelected: function() {
    var dim = this.getDimension();
    return this.select.map(function(d) {
      return d[dim];
    });
  },

  /**
   * Selects or unselects an entity from the set
   */
  selectEntity: function(d, timeDim, timeFormatter) {
    var dimension = this.getDimension();
    var value = d[dimension];
    if(this.isSelected(d)) {
      this.select = this.select.filter(function(d) {
        return d[dimension] !== value;
      });
    } else {
      var added = {};
      added[dimension] = value;
      added["labelOffset"] = [0, 0];
      if(timeDim && timeFormatter) {
        added["trailStartTime"] = timeFormatter(d[timeDim]);
      }
      this.select = (this._multiple) ? this.select.concat(added) : [added];
    }
  },
    
  /**
   * Shows or unshows an entity from the set
   */
  showEntity: function(d) {
    var dimension = this.getDimension();
    var value = d[dimension];
    var show = this.show[dimension].concat([]);
      
    if(show[0] === "*") show = [];
      
    if(this.isShown(d)) {
      show = show.filter(function(d) { return d !== value; });
    } else {
      show = show.concat(value);
    }
      
    if(show.length === 0) show = ["*"];
    this.show[dimension] = show.concat([]);
  },

  setLabelOffset: function(d, xy) {
    var dimension = this.getDimension();
    var value = d[dimension];

    utils.find(this.select, function(d) {
      return d[dimension] === value;
    }).labelOffset = xy;

    //force the model to trigger events even if value is the same
    this.set("select", this.select, true);
  },

  /**
   * Selects an entity from the set
   * @returns {Boolean} whether the item is selected or not
   */
  isSelected: function(d) {
    var dimension = this.getDimension();
    var value = d[this.getDimension()];

    return this.select
        .map(function(d) {return d[dimension];})
        .indexOf(value) !== -1;
  },
    
  /**
   * Selects an entity from the set
   * @returns {Boolean} whether the item is shown or not
   */
  isShown: function(d) {
    var dimension = this.getDimension();
    return this.show[dimension].indexOf(d[dimension]) !== -1;
  },

  /**
   * Clears selection of items
   */
  clearSelected: function() {
    this.select = [];
  },
  /**
   * Clears showing of items
   */
  clearShow: function() {
    var dimension = this.getDimension();
    this.show[dimension] = ["*"];
  },


  setHighlighted: function(arg) {
    this.highlight = [].concat(arg);
  },

  //TODO: join the following 3 methods with the previous 3

  /**
   * Highlights an entity from the set
   */
  highlightEntity: function(d, timeDim, timeFormatter) {
    var dimension = this.getDimension();
    var value = d[dimension];
    if(!this.isHighlighted(d)) {
      var added = {};
      added[dimension] = value;
      added = utils.extend(d, added);
      if(timeDim && timeFormatter) {
        added["trailStartTime"] = timeFormatter(d[timeDim]);
      }
      this.highlight = this.highlight.concat(added);
    }
  },

  /**
   * Unhighlights an entity from the set
   */
  unhighlightEntity: function(d) {
    var dimension = this.getDimension();
    var value = d[dimension];
    if(this.isHighlighted(d)) {
      this.highlight = this.highlight.filter(function(d) {
        return d[dimension] !== value;
      });
    }
  },

  /**
   * Checks whether an entity is highlighted from the set
   * @returns {Boolean} whether the item is highlighted or not
   */
  isHighlighted: function(d) {
    var dimension = this.getDimension();
    var value = d[this.getDimension()];

    var highlight_array = this.highlight.map(function(d) {
      return d[dimension];
    });

    return highlight_array.indexOf(value) !== -1;
  },

  /**
   * Clears selection of items
   */
  clearHighlighted: function() {
    this.highlight = [];
  },
  setNeedUpdate: function() {
    this.needUpdate = new Date();
  }
});

export default EntitiesModel;