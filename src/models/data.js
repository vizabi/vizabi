import * as utils from 'base/utils';
import Model from 'base/model';

/*
 * VIZABI Data Model (model.data)
 */

var DataModel = Model.extend({

  /**
   * Default values for this model
   */
  _defaults: {
    reader: "csv",
    splash: false
  },


  /**
   * Initializes the data model.
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init: function(name, values, parent, bind) {

    this._type = "data";
    //TODO: add defaults extend to super
    var defaults = utils.deepClone(this._defaults);
    values = utils.extend(defaults, values);

    //same constructor as parent, with same arguments
    this._super(name, values, parent, bind);
  }

});

export default DataModel;