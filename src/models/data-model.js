define([
    'underscore',
    'base/model',
    'base/data'
], function(_, Model, DataManager) {

    var DataModel = Model.extend({
        init: function(data_source) {
            this._super();
            this.setSource(data_source);
        },

        //set data
        setSource: function(data_source) {
            datapath = data_source ? data_source.path : "";
            this._dataManager = new DataManager(datapath);
        },

        validate: function() {
            //validate
        },

        load: function(query, language, events) {
            var _this = this,
                defer = $.Deferred(),
                promise = this._dataManager.load(query, language, events);

            //when request is completed, set it
            $.when(promise).done(function() {
                _this.set(_this._dataManager.get());
                defer.resolve();
            });

            return defer;
        }

    });

    return DataModel;
});