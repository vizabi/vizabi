import * as utils from 'base/utils';
import Promise from 'bluebird';
import Model from 'base/model';

/*!
 * HOOK MODEL
 */

var Marker = Model.extend({

  /**
   * Gets the narrowest limits of the subhooks with respect to the provided data column
   * @param {String} attr parameter (data column)
   * @returns {Object} limits (min and max)
   * this function is only needed to route the "time" to some indicator,
   * to adjust time start and end to the max and min time available in data
   */
  getTimeLimits: function(attr) {
      var _this = this;
      var time = this._parent.time;
      var min, max, minArray = [], maxArray = [], items = {};
      if (!this.cachedTimeLimits) this.cachedTimeLimits = {};
      utils.forEach(this.getSubhooks(), function(hook) {
        if(hook.use !== "indicator" || !hook._important) return;
        var hookConceptprops = hook.getConceptprops();
        if(!hookConceptprops) return utils.warn(hook._name + ": " + hook.which + " is not found among concept properties. \
            Check that you read the correct file or server instance... \
            Check that the pointer 'which' of the hook is correct too");

        var availability = hookConceptprops.availability;
        var availabilityForHook = _this.cachedTimeLimits[hook._dataId + hook.which];

        if (availabilityForHook){
            //if already calculated the limits then no ned to do it again
            min = availabilityForHook.min;
            max = availabilityForHook.max;
        }else if (availability){
            //if date limits are supplied by the concept properties then use them
            min = time.timeFormat.parse(availability[0]+"");
            var timeEnd = time._defaults.end || availability[1];
            max = time.timeFormat.parse(Math.min(timeEnd, availability[1])+"");
        }else{
            //otherwise calculate own date limits (a costly operation)
            items = hook.getValidItems().map(function(m){return m[time.getDimension()];});
            if(items.length == 0) utils.warn("getTimeLimits() was unable to work with an empty array of valid datapoints")
            min = d3.min(items);
            max = d3.max(items);
        }
        _this.cachedTimeLimits[hook._dataId + hook.which] = {min: min, max: max};
        minArray.push(min);
        maxArray.push(max);
      });

      var resultMin = d3.max(minArray);
      var resultMax = d3.min(maxArray);
      if(resultMin > resultMax) {
          utils.warn("getTimeLimits(): Availability of the indicator's data has no intersection. I give up and just return some valid time range where you'll find no data points. Enjoy!")
          resultMin = d3.min(minArray);
          resultMax = d3.max(maxArray);
      }
      return {min: resultMin, max: resultMax}
  },


  /**
   * Computes the intersection of keys in all hooks: a set of keys that have data in each hook
   * @returns array of keys that have data in all hooks of this._datacube
   */
    getKeys: function(KEY) {
        var _this = this;
        var resultKeys = [];

        KEY = KEY || this._getFirstDimension();
        var TIME = this._getFirstDimension({type: "time"});

        utils.forEach(this._dataCube||this.getSubhooks(true), function(hook, name) {

            // If hook use is constant, then we can provide no additional info about keys
            // We can just hope that we have something else than constants =)
            if(hook.use === "constant") return;

            // Get keys in data of this hook
            var nested = hook.getNestedItems([KEY, TIME]);
            var noDataPoints = hook.getHaveNoDataPointsPerKey();

            var keys = Object.keys(nested);
            var keysNoDP = Object.keys(noDataPoints || []);

            // If ain't got nothing yet, set the list of keys to result
            if(resultKeys.length == 0) resultKeys = keys;

            // Remove the keys from it that are not in this hook
            if(hook._important) resultKeys = resultKeys.filter(function(f) {
              return _this._parent.time.splash !== false || keys.indexOf(f) > -1 && keysNoDP.indexOf(f) == -1;
            })
        });
        return resultKeys.map(function(d){var r = {}; r[KEY] = d; return r; });
    },

  /**
   * @param {Array} entities array of entities
   * @return String
   */
  _getCachePath: function(keys) {
    //array of steps -- names of all frames
    var steps = this._parent.time.getAllSteps();
    var cachePath = steps[0] + " - " + steps[steps.length-1];
    this._dataCube = this._dataCube || this.getSubhooks(true);
    var dataLoading = false;
    utils.forEach(this._dataCube, function(hook, name) {
      if (hook._loadCall) dataLoading = true;
      cachePath = cachePath + "_" +  hook._dataId;
    });
    if (dataLoading) {
      return null;
    }
    if (keys) {
      cachePath = cachePath + "_" + keys.join(",");
    }
    return cachePath;
  },

  _getAllDimensions: function(opts) {

    var models = [];
    var _this = this;
    utils.forEach(this.space, function(name) {
      models.push(_this.getClosestModel(name));
    });

    var optsStr = JSON.stringify(opts);
    if(optsStr in this._spaceDims) {
      return this._spaceDims[optsStr];
    }

    opts = opts || {};
    var dims = [];
    var dim;

    utils.forEach(models, function(m) {
      if(opts.exceptType && m.getType() === opts.exceptType) {
        return true;
      }
      if(opts.onlyType && m.getType() !== opts.onlyType) {
        return true;
      }
      if(dim = m.getDimension()) {
        dims.push(dim);
      }
    });

    this._spaceDims[optsStr] = dims;

    return dims;
  },


  /**
   * gets first dimension that matches type
   * @param {Object} options
   * @returns {Array} all unique dimensions
   */
  _getFirstDimension: function(opts) {
    var models = [];
    var _this = this;
    utils.forEach(this.space, function(name) {
      models.push(_this.getClosestModel(name));
    });

    opts = opts || {};

    var dim = false;
    utils.forEach(models, function(m) {
      if(opts.exceptType && m.getType() !== opts.exceptType) {
        dim = m.getDimension();
        return false;
      } else if(opts.type && m.getType() === opts.type) {
        dim = m.getDimension();
        return false;
      } else if(!opts.exceptType && !opts.type) {
        dim = m.getDimension();
        return false;
      }
    });
    return dim;
  },


  framesAreReady: function() {
    var cachePath = this._getCachePath();
    if (!this.cachedFrames) return false;
    return Object.keys(this.cachedFrames[cachePath]).length == this._parent.time.getAllSteps().length;
  },

  /**
   *
   * @param {String|null} time of a particularly requested data frame. Null if all frames are requested
   * @param {function} cb
   * @param {Array} keys array of entities
   * @return null
   */
    getFrame: function(time, cb, keys) {
      //keys = null;
      var _this = this;
      if (!this.cachedFrames) this.cachedFrames = {};

      var steps = this._parent.time.getAllSteps();
      // try to get frame from cache without keys
      var cachePath = this._getCachePath();
      if (!cachePath) return cb(null, time);
      if(time && _this.cachedFrames[cachePath] && _this.cachedFrames[cachePath][time]) {
        // if it does, then return that frame directly and stop here
        //QUESTION: can we call the callback and return the frame? this will allow callbackless API too
        return cb(_this.cachedFrames[cachePath][time], time);
      }
      cachePath = this._getCachePath(keys);
      if (!cachePath) return cb(null, time);

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

          if(!steps[nextFrameIndex]) {
            utils.warn("The requested frame is out of range: " + time);
            cb(null, time);
            return null;
          }

          //if "time" doesn't hit the frame precisely
          if (steps[nextFrameIndex].toString() != time.toString()) {

            //interpolate between frames and fire the callback
            this._interpolateBetweenFrames(time, nextFrameIndex, steps, function (response) {
              cb(response, time);
            }, keys);
            return null;
          }
        }

        //QUESTION: we don't need any further execution after we called for interpolation, right?
        //request preparing the data, wait until it's done
        _this.getFrames(time, keys).then(function() {
          if (!time && _this.cachedFrames[cachePath]) {
            //time can be null: then return all frames
            return cb(_this.cachedFrames[cachePath], time);
          } else if(_this.cachedFrames[cachePath] && _this.cachedFrames[cachePath][time]) {
            //time can be !null: then a particular frame calculation was forced and now it's done
            return cb(_this.cachedFrames[cachePath][time], time);
          } else {
            utils.warn("marker.js getFrame: Data is not available for frame: " + time);
            return cb(null, time);
          }
        });
      }
    },

    _interpolateBetweenFrames: function(time, nextFrameIndex, steps, cb, keys) {
      var _this = this;

      if (nextFrameIndex == 0) {
        //getFrame makes sure the frane is ready because a frame with non-existing data might be adressed
        this.getFrame(steps[nextFrameIndex], function(values) {
          return cb(values);
        }, keys);
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
                if(utils.isDate(val1)){
                  dataBetweenFrames[hook][key] = time;
                } else if(!utils.isNumber(val1)){
                    //we can be interpolating string values
                    dataBetweenFrames[hook][key] = val1;
                }else{
                    //interpolation between number and null should rerurn null, not a value in between (#1350)
                    dataBetweenFrames[hook][key] = (val1==null || val2==null) ? null : val1 + ((val2 - val1) * fraction);
                }
              });
            });
            cb(dataBetweenFrames);
          }, keys)
        }, keys)
      }
    },

    getFrames: function(forceFrame, selected) {
      var _this = this;
      if (!this.cachedFrames) this.cachedFrames = {};

      var KEY = this._getFirstDimension();
      var TIME = this._getFirstDimension({type: "time"});

      if (!this.frameQueues) this.frameQueues = {}; //static queue of frames
      if (!this.partialResult) this.partialResult = {};

      //array of steps -- names of all frames
      var steps = this._parent.time.getAllSteps();

      var cachePath = this._getCachePath(selected);
      if (!cachePath) return new Promise(function(resolve, reject) {resolve()});
      //if the collection of frames for this data cube is not scheduled yet (otherwise no need to repeat calculation)
      if (!this.frameQueues[cachePath] || !this.frameQueues[cachePath] instanceof Promise) {

        //this is a promise nobody listens to - it prepares all the frames we need without forcing any
        this.frameQueues[cachePath] = new Promise(function(resolve, reject) {

          _this.partialResult[cachePath] = {};
          steps.forEach(function(t) { _this.partialResult[cachePath][t] = {}; });

          // Assemble the list of keys as an intersection of keys in all queries of all hooks
          var keys = _this.getKeys();

          var deferredHooks = [];
          // Assemble data from each hook. Each frame becomes a vector containing the current configuration of hooks.
          // frame -> hooks -> entities: values
          utils.forEach(_this._dataCube, function(hook, name) {
            if(hook.use === "constant") {
              //special case: fill data with constant values
              steps.forEach(function(t) {
                _this.partialResult[cachePath][t][name] = {};
                keys.forEach(function(key) {
                  _this.partialResult[cachePath][t][name][key[KEY]] = hook.which;
                });
              });
            } else if(hook.which === KEY) {
              //special case: fill data with keys to data itself
              steps.forEach(function(t) {
                _this.partialResult[cachePath][t][name] = {};
                keys.forEach(function(key) {
                  _this.partialResult[cachePath][t][name][key[KEY]] = key[KEY];
                });
              });
            } else if(hook.which === TIME) {
              //special case: fill data with time points
              steps.forEach(function(t) {
                _this.partialResult[cachePath][t][name] = {};
                keys.forEach(function(key) {
                  _this.partialResult[cachePath][t][name][key[KEY]] = new Date(t);
                });
              });
            } else {
              //calculation of async frames is taken outside the loop
              //hooks with real data that needs to be fetched from datamanager
              deferredHooks.push(hook);
            }
          });

          //check if we have any data to get from datamanager
          if (deferredHooks.length > 0) {
            var promises = [];
            utils.forEach(deferredHooks, function(hook) {
              promises.push(new Promise(function(res, rej) {
                // need to save the hook state before calling getFrames.
                // `hook` state might change between calling and resolving the call.
                // The result needs to be saved to the correct cache, so we need to save current hook state
                var currentHookState = {
                  name: hook._name,
                  which: hook.which
                }
                hook.getFrames(steps, selected).then(function(response) {
                  utils.forEach(response, function (frame, t) {
                    _this.partialResult[cachePath][t][currentHookState.name] = frame[currentHookState.which];
                  });
                  res();
                })
              }));
            });
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
            if(hook.use !== "constant" && hook.which !== KEY && hook.which !== TIME) {
              (function(_hook, _name) {
                promises.push(new Promise(function(res, rej) {
                  _hook.getFrame(steps, forceFrame, selected).then(function(response) {
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

    listenFramesQueue: function(keys, cb) {
      var _this = this;
      var KEY = this._getFirstDimension();
      var TIME = this._getFirstDimension({type: "time"});
      var steps = this._parent.time.getAllSteps();
      var preparedFrames = {};
      this.getFrames();
      var dataIds = [];
      utils.forEach(_this._dataCube, function(hook, name) {
        if(!(hook.use === "constant" || hook.which === KEY || hook.which === TIME)) {
          if (dataIds.indexOf(hook._dataId) == -1) {
            dataIds.push(hook._dataId);

            hook.dataSource.listenFrame(hook._dataId, steps, keys, function(dataId, time) {
              var keyName = time.toString();
              if (typeof preparedFrames[keyName] == "undefined") preparedFrames[keyName] = [];
              if (preparedFrames[keyName].indexOf(dataId) == -1) preparedFrames[keyName].push(dataId);
              if (preparedFrames[keyName].length == dataIds.length)  {
                cb(time);
              }
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

    var dimTime, time, filtered, next, method, u, w, value;
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

        method = hook.getConceptprops ? hook.getConceptprops().interpolation : null;
        filtered = hook.getNestedItems(f_keys);
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

        filtered = hook.getNestedItems(group_by);

        response[name] = {};
        //find position from first hook
        u = hook.use;
        w = hook.which;

        if(hook.use !== "property") next = (typeof next === 'undefined') ? d3.bisectLeft(hook.getUnique(dimTime), time) : next;

        method = hook.getConceptprops ? hook.getConceptprops().interpolation : null;

        var interpolate = function(arr, result, id) {
          //TODO: this saves when geos have different data length. line can be optimised.
          next = d3.bisectLeft(arr.map(function(m){return m[dimTime]}), time);

          value = utils.interpolatePoint(arr, u, w, next, dimTime, time, method);
          result[id] = hook.mapValue(value);

          //concat previous data points
          if(previous) {
            var values = utils.filter(arr, filter).filter(function(d) {
              return d[dimTime] <= time;
            }).map(function(d) {
              return hook.mapValue(d[w]);
            }).concat(result[id]);
            result[id] = values;
          }

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

        iterateGroupKeys(filtered, group_by.length, response[name], interpolate);

      });
    }

    return response;
  },

  /**
   * Gets the concept properties of all hooks
   * @returns {Object} concept properties
   */
  getConceptprops: function() {
    // temporary hack to get conceptprops from hook. Fix should be that no one tries to get it from marker in the first place.
    var keys = Object.keys(this._data);
    var index = (keys[0] !== 'space') ? keys[0] : keys[1];
    return this._data[index].dataSource.getConceptprops();
  },

  getEntityLimits: function(entity) {
    var _this = this;
    var timePoints = this._parent.time.getAllSteps();
    var selectedEdgeTimes = [];
    var hooks = [];
    utils.forEach(_this.getSubhooks(), function(hook) {
      if(hook.use == "constant") return;
      if(hook._important) hooks.push(hook._name);
    });

    var findEntityWithCompleteHooks = function(values) {
      if (!values) return false;
      for(var i = 0, j = hooks.length; i < j; i++) {
        if(!(values[hooks[i]][entity] || values[hooks[i]][entity]===0)) return false;
      }
      return true;
    };

    var findSelectedTime = function(iterator, findCB) {
      var point = iterator();
      if(point == null) return;
      _this.getFrame(timePoints[point], function(values) {
        if(findEntityWithCompleteHooks(values)) {
          findCB(point);
        } else {
          findSelectedTime(iterator, findCB);
        }
      });
    };

    promises.push(new Promise(function(resolve, reject) {

      //find startSelected time
      findSelectedTime(function(){
        var max = timePoints.length;
        var i = 0;
        return function() {
          return i < max ? i++ : null;
        };
      }(), function(point){
        selectedEdgeTimes[0] = timePoints[point];
        resolve();
      });
    }));

    promises.push(new Promise(function(resolve, reject) {

      //find endSelected time
      findSelectedTime(function(){
        var i = timePoints.length - 1;
        return function() {
          return i >= 0 ? i-- : null;
        };
      }(), function(point){
        selectedEdgeTimes[1] = timePoints[point];
        resolve();
      });

    }));


    return Promise.all(promises).then(function() {
      resolve({"min": selectedEdgeTimes[0],"max": selectedEdgeTimes[1]});
    });
  },


  /**
   * Learn what this model should hook to
   * @returns {Array} space array
   */
  getSpace: function() {
    if(utils.isArray(this.space)) {
      return this.space;
    } 

    utils.error(
      'ERROR: space not found.\n You must specify the objects this hook will use under the "space" attribute in the state.\n Example:\n space: ["entities", "time"]'
    );
  }

});

export default Marker;
