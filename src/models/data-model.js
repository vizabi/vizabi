define([
    'jquery',
    'underscore',
    'base/model',
    'base/data'
], function($, _, Model, DataManager) {

    var DataModel = Model.extend({
        init: function(values, interval) {

            values = _.extend({
                language: "en",
                reader: "local-json",
                path: ""
            }, values);

            this._super(values, interval);
            this._dataset = [];
            this.setSource();

            //reload data everytime parameter show, source or language changes
            var _this = this;
            this.on(["change:language", "change:query", "change:reader"], function(evt) {
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
            var datapath = this.get("path") || "";
            this._dataManager = new DataManager(datapath);
        },

        //validation
        //todo: improve this validation
        validate: function() {

            if (_.isArray(this._dataset) && this._dataset.length === 1) {
                this._dataset = this._dataset[0];
            }

            var times = _.map(this._dataset, function(d) {
                return parseInt(d.time, 10);
            });

            if (times.length > 0) {
                var min_time = _.min(times),
                    max_time = _.max(times);
                if (!this.get("time_start") || this.get("time_start") < min_time) {
                    this.set("time_start", min_time);
                }

                if (!this.get("time_end") || this.get("time_end") > max_time) {
                    this.set("time_end", max_time);
                }
            }
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
            if (this._dataset.length === 1) return this._dataset[0];
            return this._dataset;
        },

        //todo: remove deferred from this
        load: function() {
            var _this = this,
                query = this.get("query"),
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
                        _this.trigger("change");
                        defer.resolve();
                    }
                });
            return defer;
        }

    });

    return DataModel;
});