import * as utils from 'base/utils';
import Model from 'base/model';
import EventSource from 'base/events';

/*!
 * DATACONNECTED MODEL
 *
 * Any model which may trigger a reload of data is here. Dimensions, Time, Hooks and Locales are DataConnected
 */

var DataConnected = Model.extend({

  dataConnectedChildren: [],

  checkDataChanges: function(changedChildren) {
    var _this = this;

    if (!changedChildren || !this.dataConnectedChildren)
      return

    if (!utils.isArray(changedChildren) && utils.isObject(changedChildren))
      changedChildren = Object.keys(changedChildren);

    if (changedChildren.length == 0 || this.dataConnectedChildren.length == 0)
      return

    var dataConnectedChangedChildren = changedChildren.filter(function (child) {
      return _this.dataConnectedChildren.indexOf(child) !== -1
    });

    if (dataConnectedChangedChildren.length > 0) {
      this.trigger('dataConnectedChange');
      this.startLoading();
    }

  }

});

export default DataConnected;
