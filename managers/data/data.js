define([
    'base/loader',
    'managers/data/cache',
    'vizabi-config'
], function(loaderJSON, cache, config) {
    // {{oven-url}}
    var waffleUrl = config.url.oven.base + '/waffle/lang/';

    var dataManager = {
        cache: cache
    };

    dataManager.getCache = function() {
        return dataManager.cache;
    };

    dataManager.getIMShapes = function(o, callback) {
        var url = waffleUrl + 'en/shapes/income-mountain/' +
            o.item + '/' + o.start + '/' + o.end;

        loaderJSON.get(url, function(json) {
            if (typeof callback === 'function') {
                callback(json);
            }
        });
    };

    dataManager.getIMRaw = function(o, callback) {
        var url = waffleUrl + 'en/raw/income-mountain/' +
            o.item + '/' + o.start + '/' + o.end;

        loaderJSON.get(url, function(json) {
            if (typeof callback === 'function') {
                callback(json);
            }
        });
    };

    dataManager.getThing = function(thing, lang, callback) {
        var url = waffleUrl + lang + '/thing/' + thing;
        loaderJSON.get(url, function(json) {
            if (typeof callback === 'function') {
                callback(json);
            }
        });
    };

    dataManager.getCategoryThings = function(category, lang, callback) {
        var url = waffleUrl + lang + '/category/' + category + '/things';
        loaderJSON.get(url, function(json) {
            if (typeof callback === 'function') {
                callback(json);
            }
        });
    };

    dataManager.getAvailability = function(toolName, lang, callback) {
        if (toolName === 'income-mountain') {
            var url = waffleUrl + lang + '/income-mountain/available';
            loaderJSON.get(url, function(json) {
                if (typeof callback === 'function') {
                    callback(json);
                }
            });
        }
    };

    dataManager.getIndicator = function(indicator, lang, callback) {
        var url = waffleUrl + lang + '/indicator/' + indicator;
        loaderJSON.get(url, function(json) {
            cache.definitions.indicators[indicator] = json;
            if (typeof callback === 'function') {
                callback(json);
            }
        });
    };

    dataManager.getCategory = function(category, lang, callback) {
        var url = waffleUrl + lang + '/category/' + category;
        loaderJSON.get(url, function(json) {
            cache.definitions.categories[category] = json;
            if (typeof callback === 'function') {
                callback(json);
            }
        });
    };

    dataManager.getStats = function(indicator, callback) {
        var url = waffleUrl + 'en/indicator/' + indicator + '/stats';
        loaderJSON.get(url, function(json) {
            cache.stats[indicator] = json;
            if (typeof callback === 'function') {
                callback(json);
            }
        });
    };

    dataManager.retrieve = function(indicator, item, year) {
        if (cache.stats[indicator] &&
            cache.stats[indicator][item.toLowerCase()] &&
            cache.stats[indicator][item.toLowerCase()][year]) {
            return cache.stats[indicator][item.toLowerCase()][year].v;
        } else {
            return undefined;
        }
    };

    // The instance has its own view of the cache; it allows for keeping a more
    // coherent data object for each instance
    dataManager.instance = function() {
        return dataManager;
    }

    return dataManager;
});
