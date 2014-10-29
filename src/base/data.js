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
            this.data = [];
        },

        //load resource
        load: function(query, language) {

            var _this = this,
                defer = $.Deferred(),
                promises = [],
                isCached = this.isCached(query, language),
                promise;

            //if result is cached, dont load anything unless forced to
            if (isCached) {
                promise = true;
            }
            //if force or no cache, load it.
            else {
                promise = this.reader.read(query, language);
                promise.then(function() {
                    _this.data = _this.reader.getData();
                });
            }

            promises.push(promise);

            $.when.apply(null, promises).then(
                // Great success! :D
                function() {
                    defer.resolve(_this.get());
                },
                // Unfortunate error
                function() {
                    defer.resolve('error');
                });

            return defer;
        },

        //return entire data
        get: function() {
            return this.data;
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
            this.data = [];
        }
    });

    return dataManager;
});