/*
 * VIZABI Data Model (options.data)
 */

(function () {

  "use strict";

  var root = this;
  var Vizabi = root.Vizabi;
  var utils = Vizabi.utils;

  Vizabi.Model.extend('data', {

    /**
     * Initializes the data model.
     * @param {Object} values The initial values of this model
     * @param parent A reference to the parent model
     * @param {Object} bind Initial events to bind
     */
    init: function (values, parent, bind) {

      this._type = "data";
      values = utils.extend({
        reader: "csv",
        splash: false
      }, values);

      //same constructor as parent, with same arguments
      this._super(values, parent, bind);
    }

  });

}).call(this);
