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
            if(pars === "data") {
                return this.getData();
            }
            return this._super(pars);
        },

        getData: function() {
            return this._dataset;
        },

        load: function(query, language) {
            var _this = this;
            //when request is completed, set it
            $.when(this._dataManager.load(query, _this.get("language"))).done(function() {
                _this._dataset = _this._dataManager.get();
                _this.validate();
                _this.trigger("change");
            });
        }

    });

    return DataModel;
});