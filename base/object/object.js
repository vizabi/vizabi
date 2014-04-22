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
    }

    return {
        iterate: iterate,
        extend: extend
    }
});
