import * as utils from '../base/utils';
import Model from '../base/model';

/*
 * VIZABI Data Model (options.data)
 */

var SizeModel = Model.extend({

  /**
   * Initializes the size hook
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init: function(values, parent, bind) {

    this._type = "size";
    values = utils.extend({
      use: "value",
      min: 0,
      max: 1,
      which: undefined
    }, values);
    this._super(values, parent, bind);
  },

  /**
   * Validates a size hook
   */
  validate: function() {
    //there must be a min and a max
    if(typeof this.min === 'undefined' || this.min < 0) {
      this.min = 0;
    }
    if(typeof this.max === 'undefined' || this.max > 1) {
      this.max = 1;
    }
    if(this.max < this.min) {
      this.set('min', this.max, true);
    }

    //value must always be between min and max
    if(this.use === "value" && this.which > this.max) {
      this.which = this.max;
    } else if(this.use === "value" && this.which < this.min) {
      this.which = this.min;
    }
    if(!this.scaleType) {
      this.scaleType = 'linear';
    }
    if(this.use === "property") {
      this.scaleType = 'ordinal';
    }

    //TODO a hack that kills the scale, it will be rebuild upon getScale request in model.js
    if(this.which_1 != this.which || this.scaleType_1 != this.scaleType) this.scale = null;
    this.which_1 = this.which;
    this.scaleType_1 = this.scaleType;
  },

  /**
   * Gets the domain for this hook
   * @returns {Array} domain
   */
  buildScale: function() {
    if(this.use === "value") {
      this.scale = d3.scale.linear().domain([0, 1]);
    }
    this._super();
  }

});

export default SizeModel;