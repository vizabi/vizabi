import * as utils from "base/utils";
import Model from "base/model";
import EventSource from "base/events";

/*!
 * DATACONNECTED MODEL
 *
 * Any model which may trigger a reload of data is here. Dimensions, Time, Hooks and Locales are DataConnected
 */

const DataConnected = Model.extend({

  dataConnectedChildren: [],

  checkDataChanges(changedChildren) {
    const _this = this;

    if (!changedChildren || !this.dataConnectedChildren)
      return;

    if (!utils.isArray(changedChildren) && utils.isObject(changedChildren))
      changedChildren = Object.keys(changedChildren);

    if (changedChildren.length == 0 || this.dataConnectedChildren.length == 0)
      return;

    const dataConnectedChangedChildren = changedChildren.filter(child => _this.dataConnectedChildren.indexOf(child) !== -1);

    if (dataConnectedChangedChildren.length > 0) {
      this.trigger("dataConnectedChange");
      this.startLoading();
    }

  }

});

export default DataConnected;
