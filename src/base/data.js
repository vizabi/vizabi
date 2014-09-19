define([
    'base/class',
    'jquery',
    'underscore',
    //TODO: factory pattern for readers
    'readers/local-json',
    'base/events'
], function(Class, $, _, Reader, Events) {

    var dataManager = Class.extend({
        init: function(base_path, reader) {
            this.data = {};
            this.reader = new Reader(base_path);
        },

        //load resource
        load: function(query, language, events) {

            var _this = this,
                defer = $.Deferred(),
                promises = [],
                isCached = true,

                //Events before, after, error and cached for data
                before = events.before,
                success = events.success,
                error = events.error,
                cached = events.cached;

            //reset = options.reset;

            var promise,
                isCached = this.isCached(query, language);

            //if result is cached, dont load anything unless forced to
            if (isCached) {
                promise = true;
            }
            //if force or no cache, load it.
            else {
                promise = this.reader.read(query, language);
                Events.trigger("change:query", {
                    query: query,
                    language: language
                });
            }

            promises.push(promise);

            if (!isCached && before && _.isFunction(before)) before();

            $.when.apply(null, promises).then(
                // Success
                function() {

                    if (isCached && cached && _.isFunction(cached)) {
                        cached();
                    } else if (!isCached) {

                        //_this.data = $.extend(true, _this.data, _this.reader.getData());
                        _this.data = _this.reader.getData();

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

        isCached: function(query, language) {
            var query = JSON.stringify(query);

            if(this.prevQuery === query && this.prevLang === language) {
                return true;
            }
            else {
                this.prevQuery = query;
                this.prevLang = language;
                return false;
            }
        },

        //later we can add an external way of clearing the cached data
        clear: function() {
            this.data = {};
        }
    });

    return dataManager;
});