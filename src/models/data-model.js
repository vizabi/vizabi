define([
    'underscore',
    'base/model',
    'base/data'
], function(_, Model, DataManager) {

    var DataModel = Model.extend({
        init: function(values, interval) {

            values = _.extend({
                show: {},
                selected: {},
                source: {},
                language: "en"
            }, values);

            this._super(values, interval);
            this.setSource();

            //reload data everytime parameter show, source or language changes
            var _this = this;
            this.on(["change:show", "change:language"], function(evt) {
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

        getQuery: function() {
            
        },

        load: function() {
            var _this = this,
                query = this.getQuery(),
                language = this.get("language"),
                callbacks = {
                    cached: function() {
                        _this.trigger("load:cached", query);
                    },
                    before_loading: function() {
                        _this.trigger("load:before", query);
                    },
                    after_loading: function() {
                        _this.trigger("load:after", query);
                    }
                };
            //when request is completed, set it
            this._dataManager.load(query, language, callbacks)
                .done(function(data) {
                    if (data === 'error') {
                        _this.trigger("load:error", query);
                    } else {
                        _this._dataset = _this._dataManager.get();
                        _this.validate();
                        _this.trigger("load:success", query);
                    }
                });
        }

    });

    return DataModel;
});