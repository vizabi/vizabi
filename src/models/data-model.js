define([
    'jquery',
    'underscore',
    'base/model',
    'base/data'
], function($, _, Model, DataManager) {

    var DataModel = Model.extend({
        init: function(values, interval) {

            values = _.extend({
                show: {},
                selected: {},
                source: {},
                language: "en"
            }, values);

            this._super(values, interval);
            this._query = this._query || [];
            this.setSource();

            //reload data everytime parameter show, source or language changes
            var _this = this;
            this.on(["change:show", "change:language"], function(evt) {
                _this.load();
            });
            //reload if source changes
            this.on(["change:source"], function(evt) {
                _this.reset();
                _this.setSource();
                _this.load();
            });
        },

        //set data
        setSource: function() {
            var datapath = this.get("source.path") || "";
            this._dataManager = new DataManager(datapath);
        },

        validate: function() {
            //validate
        },

        //overwrite get method
        //it is done simply to make get("data") an alias of getData()
        get: function(pars) {
            if (pars === "data") {
                return this.getData();
            }
            return this._super(pars);
        },

        getData: function() {
            return this._dataset;
        },

        setQuery: function(query) {
            this._query = query;
        },

        //todo: remove deferred from this
        load: function() {
            var _this = this,
                query = this._query,
                language = this.get("language")
                defer = $.Deferred();

            this.trigger("load:start");
            //when request is completed, set it
            this._dataManager.load(query, language)
                .done(function(data) {
                    if (data === 'error') {
                        _this.trigger("load:error", query);
                        _this.trigger("load:error");
                    } else {
                        _this._dataset = _this._dataManager.get();
                        _this.validate();
                        _this.trigger("load:end");
                        defer.resolve();
                    }
                });
            return defer;
        }

    });

    return DataModel;
});