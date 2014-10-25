define([
    'base/class',
    'jquery',
    'underscore',
    //TODO: factory pattern for readers
    'readers/local-json',
], function(Class, $, _, Reader, Events) {

    var dataManager = Class.extend({
        init: function(base_path, reader) {
            this.reader = new Reader(base_path);
            this.data = {};
        },

        //load resource
        load: function(query, language, callbacks) {

            var _this = this,
                defer = $.Deferred(),
                promises = [],
                isCached = true,

                //Events before, after, error and cached for data
                before = callbacks.before,
                success = callbacks.success,
                error = callbacks.error,
                cached = callbacks.cached;

            var promise,
                isCached = this.isCached(query, language);

            //if result is cached, dont load anything unless forced to
            if (isCached) {
                promise = true;
            }
            //if force or no cache, load it.
            else {
                if (before && _.isFunction(before)) before();
                promise = this.reader.read(query, language);
            }

            promises.push(promise);

            $.when.apply(null, promises).then(
                // Great success! :D
                function() {
                    if (isCached && cached && _.isFunction(cached)) {
                        cached();
                    } else if (!isCached) {

                        _this.data = _this.reader.getData();

                        if (_.isFunction(success)) {
                            success();
                        }
                    }
                    defer.resolve(_this.get());
                },
                // Unfortunate error
                function() {
                    if (error && _.isFunction(error)) {
                        error();
                    }
                    defer.resolve('error');
                });

            return defer;
        },

        //return requested file or entire cache
        get: function(path) {
            return (path) ? this.data[path] : this.data;
        },

        //todo: larger caching system
        isCached: function(query, language) {
            var query = JSON.stringify(query);
            //compare to previous string
            if (this.prevQuery === query && this.prevLang === language) {
                return true;
            } else {
                this.prevQuery = query;
                this.prevLang = language;
                return false;
            }
        },

        //clearing cached data
        clear: function() {
            this.prevQuery = undefined;
            this.data = {};
        }
    });

    return dataManager;
});