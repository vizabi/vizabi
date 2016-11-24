import * as utils from 'base/utils';
import Hook from 'models/hook';

/*
 * VIZABI Data Model (options.data)
 */

var LabelModel = Hook.extend({

  /**
   * Default values for this model
   */
  _defaults: {
    use: null,
    which: null
  },

  /**
   * Initializes the size hook
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init: function(name, values, parent, bind) {

    this._type = "label";
    
    this._super(name, values, parent, bind);
  }


});

export default LabelModel;
