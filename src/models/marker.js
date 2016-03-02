import * as utils from 'base/utils';
import Model from 'base/model';

/*!
 * HOOK MODEL
 */


var Marker = Model.extend({

  /**
   * Gets limits
   * @param {String} attr parameter
   * @returns {Object} limits (min and max)
   * this function is only needed to route the "time" to some indicator, to adjust time start and end to the max and min time available in data
   */
  getLimits: function(attr) {
    if(!this.isHook()) {
      //if there's subhooks, find the one which is an indicator
      var limits = {};
      utils.forEach(this.getSubhooks(), function(s) {
        var prop = (s.use === "property");
        if(!prop) {
          limits = s.getLimits(attr);
          return false;
        }
      });
      return limits;
    }

  },


    getResultKeys: function() {
        var _this = this;
        var resultKeys = [];
        utils.forEach(this._dataCube, function(hook, name) {

            // If hook use is constant, then we can provide no additional info about keys
            // We can just hope that we have something else than constants =)
            if(hook.use === "constant") return;

            // Get keys in data of this hook
            var nested = _this.getDataManager().get(hook._dataId, 'nested', ["geo", "time"]);
            var keys = Object.keys(nested);

            if(resultKeys.length == 0) {
                // If ain't got nothing yet, set the list of keys to result
                resultKeys = keys;
            } else {
                // If there is result accumulated aleready, remove the keys from it that are not in this hook
                resultKeys = resultKeys.filter(function(f) {
                    return keys.indexOf(f) > -1;
                })
            }
        });
        return resultKeys;
    },
    
    
  /**
   * gets the items associated with this hook without values
   * @param filter filter
   * @returns hooked value
   */
  getKeys: function(filter) {
      var sub = this.getSubhooks();
      var found = [];
      if(sub.length > 1) {
        utils.forEach(sub, function(s) {
          found = s.getKeys();
          return false;
        });
      }
      return found;
  },
    
    getFrame: function(time, cb) {
      var _this = this;
      if (!this.cachedFrames) this.cachedFrames = {};
      var cachePath = "";
      utils.forEach(this._dataCube, function(hook, name) {
          cachePath = cachePath + "," + name + ":" + hook.which + " " + _this._parent.time.start + " " + _this._parent.time.end;
      });
      var steps = this._parent.time.getAllSteps();
      if(_this.cachedFrames[cachePath] && _this.cachedFrames[cachePath][time]) {
          cb(_this.cachedFrames[cachePath][time]);
      } else if (time) {
        var timeId = d3.bisectLeft(steps, time);
        var frameTime = steps[timeId];
        if(frameTime.toString() != time.toString()) {
          if (timeId == 0) {
            this.getFrame(steps[timeId], function(response) {
              cb(response);
            });
          } else {
            this._shiftFrame(time, timeId, steps, function(response) {
              cb(response);
            });
          }
        } else {
          _this.getFrames(time).then(function() {
            if (!time && _this.cachedFrames[cachePath]) {
              cb(_this.cachedFrames[cachePath]);
            } else if(_this.cachedFrames[cachePath][time]) {
              cb(_this.cachedFrames[cachePath][time]);
            } else {
              utils.warn("Frame was not built for timestamp: " + time + " : " + cachePath);
              cb({});
            }
          });
        }
      }
    },
    _shiftFrame(time, timeId, steps, cb) {
      var _this = this;
      this.getFrame(steps[timeId], function(nValues) {
        _this.getFrame(steps[timeId - 1], function(pValues) {
          var fraction = (time - steps[timeId - 1]) / (steps[timeId] - steps[timeId - 1]);
          var curr = {};
          utils.forEach(pValues, function(values, hook) {
            curr[hook] = {};
            utils.forEach(values, function(val, id) {
              var val2 = nValues[hook][id];
              curr[hook][id] = (!utils.isNumber(val)) ? val : val + ((val2 - val) *
              fraction);
            });
          });
          cb(curr);
        })
      })
    },
    getLimitsPerFrame() {
      
    },

    getFrames: function(forceFrame) {
      var _this = this;
      if (!this.frameQueues) {
        this.frameQueues = {};
      }
      if (!this.partialResult) {
        this.partialResult = {};
      }
      var cachePath = "";


      utils.forEach(this._dataCube, function(hook, name) {
          cachePath = cachePath + "," + name + ":" + hook.which + " " + _this._parent.time.start + " " + _this._parent.time.end;
      });

      this._dataCube = this._dataCube || this.getSubhooks(true);

      var steps = this._parent.time.getAllSteps();
      if (!this.frameQueues[cachePath] || !this.frameQueues[cachePath] instanceof Promise) {
        this.frameQueues[cachePath] = new Promise(function(resolve, reject) {
          // Assemble the list of keys as an intersection of keys in all queries of all hooks
          _this.partialResult[cachePath] = {};
          steps.forEach(function(t) {
            _this.partialResult[cachePath][t] = {};
          });

          var resultKeys = _this.getResultKeys();

          var deferredHooks = [];
          utils.forEach(_this._dataCube, function(hook, name) {
            if(hook.use === "constant") {
              steps.forEach(function(t) {
                _this.partialResult[cachePath][t][name] = {};
                resultKeys.forEach(function(key) {
                  _this.partialResult[cachePath][t][name][key] = hook.which;
                });
              });
            } else if(hook.which === "geo") {
              steps.forEach(function(t) {
                _this.partialResult[cachePath][t][name] = {};
                resultKeys.forEach(function(key) {
                  _this.partialResult[cachePath][t][name][key] = key;
                });
              });
            } else if(hook.which === "time") {
              steps.forEach(function(t) {
                _this.partialResult[cachePath][t][name] = {};
                resultKeys.forEach(function(key) {
                  _this.partialResult[cachePath][t][name][key] = new Date(t);
                });
              });
            } else {
              deferredHooks.push({hook: hook, name: name});
            }
          });
          if (deferredHooks.length > 0) {
            var promises = [];
            for (var hookId = 0; hookId < deferredHooks.length; hookId++) {
              (function(hookKey) {
                var defer = deferredHooks[hookKey];
                promises.push(new Promise(function(res, rej) {
                  _this.getDataManager().getFrames(defer.hook._dataId, steps).then(function(response) {
                    utils.forEach(response, function (frame, t) {
                      _this.partialResult[cachePath][t][defer.name] = frame[defer.hook.which];
                    });
                    res();
                  })
                }));
              }(hookId));
            }
            Promise.all(promises).then(function() {
              _this.cachedFrames[cachePath] = _this.partialResult[cachePath];
              resolve();
            });
          } else {
            _this.cachedFrames[cachePath] = _this.partialResult[cachePath];
            resolve();
          }

        });
      }

      return new Promise(function(resolve, reject) {
        if (steps.length < 2 || !forceFrame) {
          _this.frameQueues[cachePath].then(function() {
            resolve();
          });
        } else {
          var promises = [];
          utils.forEach(_this._dataCube, function(hook, name) {
            if(hook.use !== "constant" && hook.which !== "geo" && hook.which !== "time") {
              (function(_hook, _name) {
                promises.push(new Promise(function(res, rej) {
                  _this.getDataManager().getFrame(_hook._dataId, steps, forceFrame).then(function(response) {
                    _this.partialResult[cachePath][forceFrame][_name] = response[forceFrame][_hook.which];
                    res();
                  })
                }));
              }(hook, name));
            }
          });
          if (promises.length > 0) {
            Promise.all(promises).then(function() {
              if (!_this.cachedFrames[cachePath]) {
                _this.cachedFrames[cachePath] = {};
              }
              _this.cachedFrames[cachePath][forceFrame] = _this.partialResult[cachePath][forceFrame];
              resolve();
            });
          }
        }
      });

    },



  /**
   * gets multiple values from the hook
   * @param {Object} filter Reference to the row. e.g: {geo: "swe", time: "1999", ... }
   * @param {Array} group_by How to nest e.g: ["geo"]
   * @param {Boolean} [previous = false] previous Append previous data points
   * @returns an array of values
   */
  getValues: function(filter, group_by, previous) {
    var _this = this;

    if(this.isHook()) {
      return [];
    }

    var dimTime, time, filtered, next, method, u, w, value, method;
    this._dataCube = this._dataCube || this.getSubhooks(true);
    filter = utils.clone(filter, this._getAllDimensions());
    dimTime = this._getFirstDimension({
      type: 'time'
    });
    time = new Date(filter[dimTime]); //clone date
    filter = utils.clone(filter, null, dimTime);

    var response = {};
    var f_keys = Object.keys(filter);
    var f_values = f_keys.map(function(k) {
      return filter[k];
    });

    //if there's a filter, interpolate only that
    if(f_keys.length) {
      utils.forEach(this._dataCube, function(hook, name) {
        u = hook.use;
        w = hook.which;

        if(hook.use !== "property") next = next || d3.bisectLeft(hook.getUnique(dimTime), time);        

        method = hook.getMetadata().interpolation;
        filtered = _this.getDataManager().get(hook._dataId, 'nested', f_keys);
        utils.forEach(f_values, function(v) {
          filtered = filtered[v]; //get precise array (leaf)
        });
        value = utils.interpolatePoint(filtered, u, w, next, dimTime, time, method);
        response[name] = hook.mapValue(value);

        //concat previous data points
        if(previous) {
          var values = utils.filter(filtered, filter).filter(function(d) {
            return d[dimTime] <= time;
          }).map(function(d) {
            return hook.mapValue(d[w]);
          }).concat(response[name]);
          response[name] = values;
        }
      });
    }
    //else, interpolate all with time
    else {
      utils.forEach(this._dataCube, function(hook, name) {
          
        filtered = _this.getDataManager().get(hook._dataId, 'nested', group_by);
            
        response[name] = {};
        //find position from first hook
        u = hook.use;
        w = hook.which;
          
        if(hook.use !== "property") next = (typeof next === 'undefined') ? d3.bisectLeft(hook.getUnique(dimTime), time) : next;
        
        method = hook.getMetadata().interpolation;


        utils.forEach(filtered, function(arr, id) {
          //TODO: this saves when geos have different data length. line can be optimised. 
          next = d3.bisectLeft(arr.map(function(m){return m.time}), time);
            
          value = utils.interpolatePoint(arr, u, w, next, dimTime, time, method);
          response[name][id] = hook.mapValue(value);

          //concat previous data points
          if(previous) {
            var values = utils.filter(arr, filter).filter(function(d) {
              return d[dimTime] <= time;
            }).map(function(d) {
              return hook.mapValue(d[w]);
            }).concat(response[name][id]);
            response[name][id] = values;
          }

        });
      });
    }

    return response;
  },

  /**
   * Gets the metadata of all hooks
   * @returns {Object} metadata
   */
  getMetadata: function() {
    return this.getDataManager().getMetadata();
  },
    
  /**
   * Gets the metadata of all hooks
   * @returns {Object} metadata
   */
  getIndicatorsTree: function() {
    return this.getDataManager().getIndicatorsTree();
  } 
    

});

export default Marker;