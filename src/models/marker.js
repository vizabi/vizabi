import * as utils from 'base/utils';
import Model from 'base/model';
import globals from 'base/globals';

/*!
 * HOOK MODEL
 */


var Marker = Model.extend({

  /**
   * Gets limits
   * @param {String} attr parameter
   * @returns {Object} limits (min and max)
   */
  getLimits: function(attr) {
    if(!this.isHook()) {
      //if there's subhooks, find the one which is an indicator
      var limits = {};
      utils.forEach(this.getSubhooks(), function(s) {
        var prop = globals.metadata.indicatorsDB[s.which].use === "property";
        if(!prop) {
          limits = s.getLimits(attr);
          return false;
        }
      });
      return limits;
    }

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

    getFrame: function(time) {
      var _this = this;
      var steps = this._parent.time.getAllSteps();

      var cachePath = "";
      utils.forEach(this._dataCube, function(hook, name) {
          cachePath = cachePath + "," + name + ":" + hook.which + " " + _this._parent.time.start + " " + _this._parent.time.end;
      });
      return new Promise(function(resolve, reject) {
        if(_this.cachedFrames[cachePath] && _this.cachedFrames[cachePath][time]) {
          resolve(_this.cachedFrames[cachePath][time]);
        } else {
          _this.getFrames().then(function() {
            console.log("get frames after");
            var pValues, curr = {};
            if(_this.cachedFrames[cachePath][time]) {
              resolve(_this.cachedFrames[cachePath][time]);
            } else if(time < steps[0] || time > steps[steps.length - 1]) {
              //if the requested time point is out of the known range
              //then send nulls in the response
              pValues = this.cachedFrames[cachePath][steps[0]];
              utils.forEach(pValues, function(keys, hook) {
                curr[hook] = {};
                utils.forEach(keys, function(val, key) {
                  curr[hook][key] = null;
                });
              });
              resolve(curr);
            } else {
              var next = d3.bisectLeft(steps, time);

              if(next === 0) {
                resolve(_this.cachedFrames[cachePath][steps[0]]);
              } else {
                var fraction = (time - steps[next - 1]) / (steps[next] - steps[next - 1]);

                pValues = _this.cachedFrames[cachePath][steps[next - 1]];
                var nValues = _this.cachedFrames[cachePath][steps[next]];

                utils.forEach(pValues, function(values, hook) {
                  curr[hook] = {};
                  utils.forEach(values, function(val, id) {
                    var val2 = nValues[hook][id];
                    curr[hook][id] = (!utils.isNumber(val)) ? val : val + ((val2 - val) *
                    fraction);
                  });
                });
                resolve(curr);
              }
            }
          });
        }
      });
    },

    getFrames: function() {
      var _this = this;

      var cachePath = "";
      utils.forEach(this._dataCube, function(hook, name) {
          cachePath = cachePath + "," + name + ":" + hook.which + " " + _this._parent.time.start + " " + _this._parent.time.end;
      });

      var steps = this._parent.time.getAllSteps();
      var result = {};
      var getResultKeys = function () {
        var resultKeys = [];
        return new Promise(function(resolve, reject) {
          var promises = [];
          utils.forEach(_this._dataCube, function(hook, name) {

            // If hook use is constant, then we can provide no additional info about keys
            // We can just hope that we have something else than constants =)
            if(hook.use === "constant") return;

            // Get keys in data of this hook
            promises.push(_this.getDataManager().get(hook._dataId, 'nested', ["geo", "time"]))
          });
          Promise.all(promises).then(function(submodels) {
            utils.forEach(submodels, function(nested) {
              var keys = Object.keys(nested);

              if(resultKeys.length == 0) {
                // If ain't got nothing yet, set the list of keys to result
                resultKeys = keys;
              } else {
                // If there is result accumulated already, remove the keys from it that are not in this hook
                resultKeys = resultKeys.filter(function(f) {
                  return keys.indexOf(f) > -1;
                })
              }
            });
            resolve(resultKeys);
          });
        });
      };

      this._dataCube = this._dataCube || this.getSubhooks(true);
      return new Promise(function(resolve, reject) {
        // Assemble the list of keys as an intersection of keys in all queries of all hooks
        getResultKeys().then(function(resultKeys) {

          steps.forEach(function(t) {
            result[t] = {};
          });
          var promisesLength = 0;
          utils.forEach(_this._dataCube, function(hook, name) {

            if(hook.use === "constant") {
              steps.forEach(function(t) {
                result[t][name] = {};
                resultKeys.forEach(function(key) {
                  result[t][name][key] = hook.which;
                });
              });

            } else if(hook.which === "geo") {
              steps.forEach(function(t) {
                result[t][name] = {};
                resultKeys.forEach(function(key) {
                  result[t][name][key] = key;
                });
              });

            } else if(hook.which === "time") {
              steps.forEach(function(t) {
                result[t][name] = {};
                resultKeys.forEach(function(key) {
                  result[t][name][key] = new Date(t);
                });
              });

            } else {
              ++promisesLength;
              _this.getDataManager().get(hook._dataId, 'frames', steps, globals.metadata.indicatorsDB).then(function(frames) {
                utils.forEach(frames, function(frame, t) {
                  result[t][name] = frame[hook.which];
                });
                _this.cachedFrames[cachePath] = result;
                if (--promisesLength == 0) {
                  resolve(result);
                }
              });
            }
          });
          if (promisesLength == 0) { // we have no pending promises resolve data
            _this.cachedFrames[cachePath] = result;
            resolve(result);
          }
        });
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

    var dimTime, time, filtered, next, u, w, value, method;
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

        if(!globals.metadata.indicatorsDB[w] || globals.metadata.indicatorsDB[w].use !== "property") {
          next = next || d3.bisectLeft(hook.getUnique(dimTime), time);
        }

        method = globals.metadata.indicatorsDB[w].interpolation;
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

        if(!globals.metadata.indicatorsDB[w] || globals.metadata.indicatorsDB[w].use !== "property") {
          next = (typeof next === 'undefined') ? d3.bisectLeft(hook.getUnique(dimTime), time) : next;
        }

        method = globals.metadata.indicatorsDB[w]?globals.metadata.indicatorsDB[w].interpolation:null;


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




});

export default Marker;
