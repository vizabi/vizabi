import * as utils from 'base/utils';
import Hook from 'hook';

/*
 * VIZABI Rank Model
 */

var RankModel = Hook.extend({

  init: function(name, values, parent, bind) {

    this._type = "rank";
    this._super(name, values, parent, bind);
  }


});

export default RankModel;