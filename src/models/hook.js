import * as utils from 'base/utils';
import Model from 'base/model';

/*!
 * HOOK MODEL
 */


var Hook = Model.extend({
    /**
   * Gets tick values for this hook
   * @returns {Number|String} value The value for this tick
   */
  tickFormatter: function(x, formatterRemovePrefix) {

    // Assumption: a hook has always time in its space
    if(utils.isDate(x)) return this._space.time.timeFormat(x);
    if(utils.isString(x)) return x;

    var format = "f";
    var prec = 0;
    if(Math.abs(x) < 1) {
      prec = 1;
      format = "r"
    };

    var prefix = "";
    if(formatterRemovePrefix) return d3.format("." + prec + format)(x);

    //---------------------
    // BEAUTIFIERS GO HOME!
    // don't break formatting please
    //---------------------
    switch(Math.floor(Math.log(Math.abs(x))/Math.LN10)) {
      case -13: x = x * 1000000000000; prefix = "p"; break; //0.1p
      case -10: x = x * 1000000000; prefix = "n"; break; //0.1n
      case -7: x = x * 1000000; prefix = "µ"; break; //0.1µ
      case -6: x = x * 1000000; prefix = "µ"; break; //1µ
      case -5: x = x * 1000000; prefix = "µ"; break; //10µ
      case -4: break; //0.0001
      case -3: break; //0.001
      case -2: break; //0.01
      case -1: break; //0.1
      case 0:  break; //1
      case 1:  break; //10
      case 2:  break; //100
      case 3:  break; //1000
      case 4:  break; //10000
      case 5:  x = x / 1000; prefix = "k"; break; //0.1M
      case 6:  x = x / 1000000; prefix = "M"; prec = 1; break; //1M
      case 7:  x = x / 1000000; prefix = "M"; break; //10M
      case 8:  x = x / 1000000; prefix = "M"; break; //100M
      case 9:  x = x / 1000000000; prefix = "B"; prec = 1; break; //1B
      case 10: x = x / 1000000000; prefix = "B"; break; //10B
      case 11: x = x / 1000000000; prefix = "B"; break; //100B
      case 12: x = x / 1000000000000; prefix = "T"; prec = 1; break; //1T
      //use the D3 SI formatting for the extreme cases
      default: return(d3.format("." + prec + "s")(x)).replace("G", "B");
    }

    // use manual formatting for the cases above
    return(d3.format("." + prec + format)(x) + prefix).replace("G", "B");

  },

  /**
   * Gets the d3 scale for this hook. if no scale then builds it
   * @returns {Array} domain
   */
  getScale: function(margins) {
    if(!this.scale) {
      this.buildScale(margins);
    }
    return this.scale;
  },

  /**
   * Gets the domain for this hook
   * @returns {Array} domain
   */
  buildScale: function() {
    if(!this.isHook()) {
      return;
    }
    var domain;
    var scaleType = this.scaleType || 'linear';
    switch(this.use) {
      case 'indicator':
        var limits = this.getLimits(this.which);
        domain = [
          limits.min,
          limits.max
        ];
        break;
      case 'property':
        domain = this.getUnique(this.which);
        break;
      default:
        domain = [this.which];
        break;
    }
    //TODO: d3 is global?
    this.scale = scaleType === 'time' ? d3.time.scale.utc().domain(domain) : d3.scale[scaleType]().domain(domain);
  },

      //TODO: this should go down to datamanager, hook should only provide interface
  /**
   * gets maximum, minimum and mean values from the dataset of this certain hook
   */
  gerLimitsPerFrame: function() {

    if(this.use === "property") return utils.warn("getMaxMinMean: strange that you ask min max mean of a property");
    if(!this.isHook) return utils.warn("getMaxMinMean: only works for hooks");

    var result = {};
    var values = [];
    var value = null;

    var steps = this._parent._parent.time.getAllSteps();

    if(this.use === "constant") {
        steps.forEach(function(t){
            value = this.which;
            result[t] = {
                min: value,
                max: value
            }
        });

    }else if(this.which==="time"){
        steps.forEach(function(t){
            value = new Date(t);
            result[t] = {
                min: value,
                max: value
            }
        });

    }else{
        var args = {framesArray: steps, which: this.which};
        result = this.getDataManager().get(this._dataId, 'limitsPerFrame', args, globals.metadata.indicatorsDB);
        result = this.getDataManager().get(this._dataId, 'limitsPerFrame', args);
    }

    return result;
  },


     /**
     * Gets unique values in a column
     * @param {String|Array} attr parameter
     * @returns {Array} unique values
     */
    getUnique: function(attr) {
        if(!this.isHook()) return;
        if(!attr) attr = this._getFirstDimension({type: "time"});
        return this.getDataManager().get(this._dataId, 'unique', attr);
    },


  /**
   * gets the items associated with this hook without values
   * @param filter filter
   * @returns {Array} keys
   */
  getKeys: function(filter) {
      // If there is no _dataId, then no data was loaded
      if (!this._dataId) return utils.warn("hook:getKeys() -- returning nothing since no data is loaded");

      //all dimensions except time (continuous)
      var dimensions = this._getAllDimensions({exceptType: 'time'});
      var excluded = this._getAllDimensions({onlyType: 'time'});

      return this.getUnique(dimensions).map(function(item) {
        utils.forEach(excluded, function(e) {
          if(filter && filter[e]) {
            item[e] = filter[e];
          }
        });
        return item;
      });
  },

  /**
   * Gets the metadata of the hook's "which"
   * @returns {Object} metadata
   */
  getMetadata: function() {
    return this.use !== 'constant' ? this.getDataManager().getMetadata(this.which) : {};
  }
});

export default Hook;
