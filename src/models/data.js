import * as utils from 'base/utils';
import Model from 'base/model';

/*
 * VIZABI Data Model (options.data)
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
  init: function(values, parent, bind) {

    this._type = "data";
    values = utils.extend(this._defaults, values);

    //same constructor as parent, with same arguments
    this._super(values, parent, bind);
  }

});

export default DataModel;