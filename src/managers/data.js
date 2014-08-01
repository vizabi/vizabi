define([
    'base/class',
    'jquery',
    'underscore',
    //TODO: factory pattern for readers
    'readers/json-ajax'
], function(Class, $, _, Reader) {

    var dataManager = Class.extend({
        init: function(base_path, reader) {
            this.data = {};
            this.reader = new Reader(base_path);
        },

        //load resource
        load: function(options) {
            var _this = this,
                defer = $.Deferred(),
                force = options.force,
                promises = [],
                isCached = true,
                //TODO: rename before cb
                before = options.before,
                success = options.success,
                error = options.error,
                cached = options.cached;

            //reset = options.reset;

            var promise,
                isCached = this.isCached(options);

            //if result is cached, dont load anything unless forced to
            if (isCached && !force) {
                promise = true;
            }
            //if force or no cache, load it.
            else {
                isCached = false;
                promise = this.reader.read(options);
            }

            promises.push(promise);

            if (!isCached && before && _.isFunction(before)) before();

            $.when.apply(null, promises).then(
                // Success
                function() {

                    if (isCached && cached && _.isFunction(cached)) {
                        cached();
                    } else if (!isCached && success) {

                        _this.data = $.extend(true, _this.data, _this.reader.getData());
                        if (_.isFunction(success)) {
                            // Great success! :D
                            success();
                        }
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
            return (path) ? this.data[path] : this.data;
        },

        isCached: function(options) {
            var cached = true;

            if(!this.data.hasOwnProperty("definitions") || 
               !this.data.definitions.hasOwnProperty(options.language)) {
                cached = false;
            }

            if(!this.data.hasOwnProperty("stats") || 
               !this.data.stats.hasOwnProperty(options.indicator)) {
                cached = false;
            }

            return cached;
        },

        //later we can add an external way of clearing the cached data
        clear: function() {
            this.data = {};
        }
    });

    return dataManager;
});