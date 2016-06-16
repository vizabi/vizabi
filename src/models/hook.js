import * as utils from 'base/utils';
import Model from 'base/model';

/*!
 * HOOK MODEL
 */


var Hook = Model.extend({
  
  //some hooks can be important. like axis x and y
  //that means, if X or Y doesn't have data at some point, we can't show markers
  _important: false,
  
    /**
   * Gets tick values for this hook
   * @returns {Number|String} value The value for this tick
   */
  getTickFormatter: function() {
      
    var _this = this;
      
    return function format(x, index, removePrefix){

    // Format time values
    // Assumption: a hook has always time in its space
    if(utils.isDate(x)) return _this._space.time.timeFormat(x);
      
    // Dealing with values that are supposed to be time
    if(_this.scaleType === "time" && !utils.isDate(x)) {
        return _this._space.time.timeFormat(new Date(x));
    }
      
    // Strings, null, NaN and undefined are bypassing any formatter
    if(utils.isString(x) || !x && x!==0) return x;

    if(Math.abs(x)<0.00000000000001) return "0";
        
    var format = "r"; //rounded format. use "f" for fixed
    var prec = 3; //round to so many significant digits
    
    var prefix = "";
    if(removePrefix) return d3.format("." + prec + format)(x);
        
    //---------------------
    // BEAUTIFIERS GO HOME!
    // don't break formatting please
    //---------------------
    // the tiny constant compensates epsilon-error when doing logsrithms
    switch(Math.floor(Math.log(Math.abs(x))/Math.LN10 + 0.00000000000001)) {
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
      case 4:  x = x / 1000; prefix = "k"; break; //10k
      case 5:  x = x / 1000; prefix = "k"; break; //100k
      case 6:  x = x / 1000000; prefix = "M"; break; //1M
      case 7:  x = x / 1000000; prefix = "M"; break; //10M
      case 8:  x = x / 1000000; prefix = "M"; break; //100M
      case 9:  x = x / 1000000000; prefix = "B"; break; //1B
      case 10: x = x / 1000000000; prefix = "B"; break; //10B
      case 11: x = x / 1000000000; prefix = "B"; break; //100B
      case 12: x = x / 1000000000000; prefix = "TR"; break; //1TR
      case 13: x = x / 1000000000000; prefix = "TR"; break; //10TR
      case 14: x = x / 1000000000000; prefix = "TR"; break; //100TR
      //use the D3 SI formatting for the extreme cases
      default: return(d3.format("." + prec + "s")(x)).replace("G", "B");
    }

    var formatted = d3.format("." + prec + format)(x);
    //remove trailing zeros if dot exists to avoid numbers like 1.0M, 3.0B, 1.500, 0.9700, 0.0
    if (formatted.indexOf(".")>-1) formatted = formatted.replace(/0+$/,"").replace(/\.$/,"");

    // use manual formatting for the cases above
    return(formatted + prefix);
    }
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
   * gets dataset without null or nan values with respect to this hook's which
   * @returns {Object} filtered items object
   */
  getValidItems: function() {
    return this.getDataManager().get(this._dataId, 'valid', this.which);
  },

  getNestedItems: function(groupBy) {
    return this.getDataManager().get(this._dataId, 'nested', groupBy);
  },
    
  getLimitsByDimensions: function(dims) {
    var filtered = this.getDataManager().get(this._dataId, 'nested', dims);
    var values = {};
    var limitsDim = {};
    var attr = this.which;
    
    var countLimits = function(items, limitsDim, id) {
 
      var filtered = items.reduce(function(filtered, d) {
        
        // check for dates
        var f = (utils.isDate(d[attr])) ? d[attr] : parseFloat(d[attr]);

        // if it is a number
        if(!isNaN(f)) {
          filtered.push(f);
        }

        //filter
        return filtered;
      }, []);
      
      // get min/max for the filtered rows
      var min;
      var max;
      var limits = {};
      for(var i = 0; i < filtered.length; i += 1) {
        var c = filtered[i];
        if(typeof min === 'undefined' || c < min) {
          min = c;
        }
        if(typeof max === 'undefined' || c > max) {
          max = c;
        }
      }
      limits.min = min || 0;
      limits.max = max || 100;
      limitsDim[id] = limits;    
    
    }
    
    var iterateGroupKeys = function(data, deep, result, cb) {
      deep--;
      utils.forEach(data, function(d, id) {
        if(deep) {
          result[id] = {};
          iterateGroupKeys(d, deep, result[id], cb);
        } else {
          cb(d, result, id);
        }
      });
    }
    
    iterateGroupKeys(filtered, dims.length, limitsDim, countLimits);
    
    return limitsDim;
  },
  
  
    
  /**
   * Gets the concept properties of the hook's "which"
   * @returns {Object} concept properties
   */
  getConceptprops: function() {
    return this.use !== 'constant' ? this.getDataManager().getConceptprops(this.which) : {};
  }    
});

export default Hook;
