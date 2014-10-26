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
            }, values);

            this._super(values, interval);
            this._query = this._query || [];
            this._language = this._language || "en";
            this.setSource();

            //reload data everytime parameter show, source or language changes
            var _this = this;
            this.on(["change:show", "change:language", "change:query"], function(evt) {
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

        //validation
        //todo: improve this validation
        validate: function() {
            var indicator = this.get("show.indicator");
            if (_.isArray(indicator) && indicator.length === 1) {
                this.set("show.indicator", indicator[0]);
            }
            if (_.isArray(this._dataset) && this._dataset.length === 1) {
                this._dataset = this._dataset[0];
            }

            var times = _.map(this._dataset, function(d) {
                return parseInt(d.time,10);
            });

            if (times.length > 0) {
                var min_time = _.min(times),
                    max_time = _.max(times);
                if (this.get("show.time_start") < min_time) {
                    this.set("show.time_start", min_time);
                }

                if (this.get("show.time_end") > max_time) {
                    this.set("show.time_end", max_time);
                }
            }
        },

        //overwrite get method
        //it is done simply to make get("data") an alias of getData()
        get: function(pars) {
            if (pars === "data") {
                return this.getData();
            }
            if (pars === "language") {
                return this._language;
            }
            return this._super(pars);
        },

        //overwrite set method
        //it is done simply to make set("language", val) an alias
        set: function(pars, value) {
            if (pars === "query") {
                this.setQuery(value);
                this.trigger("change:query");
            } else if (pars === "language") {
                this.setLanguage(value);
                this.trigger("change:language");
            } else {
                this._super(pars, value);
            }
        },

        getData: function() {
            return this._dataset;
        },

        setQuery: function(query) {
            this._query = query;
        },

        setLanguage: function(lang) {
            this._language = lang;
        },

        //todo: remove deferred from this
        load: function() {
            var _this = this,
                query = this._query,
                language = this._language
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
                        _this.trigger("change");
                        defer.resolve();
                    }
                });
            return defer;
        }

    });

    return DataModel;
});