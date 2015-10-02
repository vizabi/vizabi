import * as utils from '../base/utils';
import Model from '../base/model';

/*
 * VIZABI Data Model (options.data)
 */

var DataModel = Model.extend({

  /**
   * Initializes the data model.
   * @param {Object} values The initial values of this model
   * @param parent A reference to the parent model
   * @param {Object} bind Initial events to bind
   */
  init: function(values, parent, bind) {

    this._type = "data";
    values = utils.extend({
      reader: "csv",
      splash: false
    }, values);

    //same constructor as parent, with same arguments
    this._super(values, parent, bind);
  }

});

export default DataModel;