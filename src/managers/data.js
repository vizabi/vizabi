define([
    'base/class',
    'jquery',
    'underscore'
], function(Class, $, _) {

    var dataManager = Class.extend({
        init: function(base_path) {
            this.base_path = base_path || "";
            this.cache = {};
        },

        //load resource
        load: function(options) {
            var _this = this,
                defer = $.Deferred(),
                paths = options.paths,
                force = options.force,
                promises = [],
                isCached = true,
                //TODO: rename before cb
                before = options.before,
                success = options.success,
                error = options.error,
                cached = options.cached;

            //reset = options.reset;

            _.each(paths, function(path) {
                var promise;
                //if result is cached, dont load anything unless forced to
                if (_.isObject(_this.cache[path]) && !force) {
                    promise = true;
                }
                //if force or no cache, load it.
                else {
                    isCached = false;

                    promise = $.getJSON(_this.base_path + path, function(res) {
                        _this.cache[path] = res || {};
                    });
                }

                promises.push(promise);
            });

            if (!isCached && before && _.isFunction(before)) before();

            $.when.apply(null, promises).then(
                // Success
                function() {
                    if (isCached && cached && _.isFunction(cached)) {
                        cached();
                    } else if (!isCached && success && _.isFunction(success)) {
                        // Great success! :D
                        success();
                    }

                    defer.resolve();
                },
                // Error
                function() {
                    if (error && _.isFunction(error)) {
                        error();
                    }
                });

            return defer;
        },

        //return requested file or entire cache
        get: function(path) {
            return (path) ? this.cache[path] : this.cache;
        }
    });

    return dataManager;
});