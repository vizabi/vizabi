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


  /**
   * Computes the intersection of keys in all hooks: a set of keys that have data in each hook
   * @returns array of keys that have data in all hooks of this._datacube
   */
    getIntersectionOfKeys: function() {
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
  /**
   * 
   * @param {String|null} time of a particularly requested data frame. Null if all frames are requested
   * @param {function} cb 
   * @return null
   */
    getFrame: function(time, cb) {
      var _this = this;
      if (!this.cachedFrames) this.cachedFrames = {};
      this._dataCube = this._dataCube || this.getSubhooks(true);  
      
      //array of steps -- names of all frames  
      var steps = this._parent.time.getAllSteps();
        
      var cachePath = steps[0] + " - " + steps[steps.length-1];
      utils.forEach(this._dataCube, function(hook, name) {
          cachePath = cachePath + ", " + name + ":" + hook.which;
      });
    
      // check if the requested time point has a cached animation frame
      if(time && _this.cachedFrames[cachePath] && _this.cachedFrames[cachePath][time]) {
        // if it does, then return that frame directly and stop here
        //QUESTION: can we call the callback and return the frame? this will allow callbackless API too
        return cb(_this.cachedFrames[cachePath][time], time);
      } else {
        // if it doesn't (the requested time point falls between animation frames or frame is not cached yet)
        // check if interpolation makes sense: we've requested a particular time and we have more than one frame
        if (time && steps.length > 1) {
          
          //find the next frame after the requested time point
          var nextFrameIndex = d3.bisectLeft(steps, time);
          
          //if "time" doesn't hit the frame precisely 
          if (steps[nextFrameIndex].toString() != time.toString()) {
            
            //interpolate between frames and fire the callback
            this._interpolateBetweenFrames(time, nextFrameIndex, steps, function (response) {
              return cb(response, time); 
            }); 
          }
        }
        
        //QUESTION: we don't need any further execution after we called for interpolation, right?
        //request preparing the data, wait until it's done
        _this.getFrames(time).then(function() {
          if (!time && _this.cachedFrames[cachePath]) {
            //time can be null: then return all frames
            return cb(_this.cachedFrames[cachePath], time);
          } else if(_this.cachedFrames[cachePath][time]) {
            //time can be !null: then a particular frame calculation was forced and now it's done  
            return cb(_this.cachedFrames[cachePath][time], time);
          } else {
            utils.warn("marker.js getFrame: Frame was not built for time: " + time + ": " + cachePath);
            return cb({}, time);
          }
        }); 
      }
    },
    
    _interpolateBetweenFrames: function(time, nextFrameIndex, steps, cb) {
      var _this = this;
      
      if (nextFrameIndex == 0) {
        //getFrame makes sure the frane is ready because a frame with non-existing data might be adressed
        this.getFrame(steps[nextFrameIndex], function(values) { 
          return cb(values);
        });
      } else {
        var prevFrameTime = steps[nextFrameIndex - 1];
        var nextFrameTime = steps[nextFrameIndex];
          
        //getFrame makes sure the frane is ready because a frame with non-existing data might be adressed
        this.getFrame(prevFrameTime, function(pValues) {
          _this.getFrame(nextFrameTime, function(nValues) {
            var fraction = (time - prevFrameTime) / (nextFrameTime - prevFrameTime);
            var dataBetweenFrames = {};
            
            //loop across the hooks
            utils.forEach(pValues, function(values, hook) {
              dataBetweenFrames[hook] = {};
            
              //loop across the entities
              utils.forEach(values, function(val1, key) {
                var val2 = nValues[hook][key];
                  
                if(!utils.isNumber(val1)){
                    //we can be interpolating string values
                    dataBetweenFrames[hook][key] = val1;
                }else{
                    //interpolation between number and null should rerurn null, not a value in between (#1350)
                    dataBetweenFrames[hook][key] = (val1==null || val2==null) ? null : val1 + ((val2 - val1) * fraction);
                }
              });
            });
            cb(dataBetweenFrames);
          })
        })
      }
    },

    getFrames: function(forceFrame) {
      var _this = this;
      if (!this.frameQueues) this.frameQueues = {}; //static queue of frames
      if (!this.partialResult) this.partialResult = {};
        
      //array of steps -- names of all frames  
      var steps = this._parent.time.getAllSteps();
        
      var cachePath = steps[0] + " - " + steps[steps.length-1];
      utils.forEach(this._dataCube, function(hook, name) {
          cachePath = cachePath + ", " + name + ":" + hook.which;
      });

      //if the collection of frames for this data cube is not scheduled yet (otherwise no need to repeat calculation)
      if (!this.frameQueues[cachePath] || !this.frameQueues[cachePath] instanceof Promise) {
        
        //this is a promise nobody listens to - it prepares all the frames we need without forcing any  
        this.frameQueues[cachePath] = new Promise(function(resolve, reject) { 

          _this.partialResult[cachePath] = {};
          steps.forEach(function(t) { _this.partialResult[cachePath][t] = {}; });

          // Assemble the list of keys as an intersection of keys in all queries of all hooks
          var keys = _this.getIntersectionOfKeys();

          var deferredHooks = [];
        
          // Assemble data from each hook. Each frame becomes a vector containing the current configuration of hooks.
          // frame -> hooks -> entities: values
          utils.forEach(_this._dataCube, function(hook, name) {
            if(hook.use === "constant") {
              //special case: fill data with constant values
              steps.forEach(function(t) {
                _this.partialResult[cachePath][t][name] = {};
                keys.forEach(function(key) {
                  _this.partialResult[cachePath][t][name][key] = hook.which;
                });
              });
            } else if(hook.which === "geo") {
              //special case: fill data with keys to data itself
              //TODO: what if it's not "geo"? Treat any dimension alike
              steps.forEach(function(t) {
                _this.partialResult[cachePath][t][name] = {};
                keys.forEach(function(key) {
                  _this.partialResult[cachePath][t][name][key] = key;
                });
              });
            } else if(hook.which === "time") {
              //special case: fill data with time points
              //TODO: what if it's not "time"? Treat any animatable alike
              steps.forEach(function(t) {
                _this.partialResult[cachePath][t][name] = {};
                keys.forEach(function(key) {
                  _this.partialResult[cachePath][t][name][key] = new Date(t);
                });
              });
            } else {
              //calculation of async frames is taken outside the loop
              //hooks with real data that needs to be fetched from datamanager
              deferredHooks.push({hook: hook, name: name}); 
            }
          });
            
          //check if we have any data to get from datamanager
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
            //wait until the above promise is resolved, then resolve the current promise
          _this.frameQueues[cachePath].then(function() {
            resolve(); //going back to getFrame(), to ".then"
          });
        } else {
          var promises = [];
          utils.forEach(_this._dataCube, function(hook, name) {
            //exception: we know that these are knonwn, no need to calculate these
            if(hook.use !== "constant" && hook.which !== "geo" && hook.which !== "time") {
              (function(_hook, _name) {
                promises.push(new Promise(function(res, rej) {
                  _this.getDataManager().getFrame(_hook._dataId, steps, forceFrame).then(function(response) {
                    _this.partialResult[cachePath][forceFrame][_name] = response[forceFrame][_hook.which];
                    res();
                  })
                }));
              }(hook, name)); //isolate this () code with its own hook and name
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