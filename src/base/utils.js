define(['jquery', 'd3', 'underscore'], function($, d3, _) {

    var util = {
        d3ToJquery: function(selector) {
            return $(selector[0]);
        },
        jQueryToD3: function(selector) {
            return d3.selectAll(selector.toArray());
        },
        deepClone: function(obj, depth) {
            if (typeof obj !== 'object') return obj;
            if (_.isString(obj)) return obj.splice();
            if (_.isDate(obj)) return new Date(obj.getTime());
            if (_.isFunction(obj.clone)) return obj.clone();
            var clone = _.isArray(obj) ? obj.slice() : _.extend({}, obj);
            if (!_.isUndefined(depth) && (depth > 0)) {
                for (var key in clone) {
                    clone[key] = _.deepClone(clone[key], depth - 1);
                }
            }
            return clone;
        },
        deepExtend: function(target, src) {
            for (var p in src) {
                if (typeof src[p] === "object" &&
                    src[p] !== null) {
                    target[p] = target[p] || {};
                    this.deepExtend(target[p], src[p]);
                } else {
                    target[p] = src[p];
                }
            }
            return target;
        },
        interpolate: function(value1, value2, fraction) {
            return value1 + ((value2 - value1) * fraction);
        },

        interpolateRange: function(val1, val2, step) {
            return d3.range(val1, val2, step);
        }
    }


    return util;


});