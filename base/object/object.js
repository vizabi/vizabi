define([
    'jquery'
], function($) {
    var iterate = function(object, callback) {
        for (var prop in object) {
            if (object.hasOwnProperty(prop)) {
                callback(prop, object[prop]);
            }
        }
    };

    var extend = function(target, object) {
        return $.extend(true, target, object);
    };

    var shallowExtend = function(target, object) {
        return $.extend(target, object);
    };

    var clearExtend = function(target, object) {
        for (var i = 0, keys = Object.keys(object); i < keys.length; i++) {
            console.log(keys, i);
            target[keys[i]] = undefined;
        };

        return $.extend(target, object);
    };

    return {
        iterate: iterate,
        extend: extend,
        shallowExtend: shallowExtend,
        clearExtend: clearExtend
    };
});
