define([
    'jquery',
    'lodash',
    'base/model',
    'base/data'
], function($, _, Model, DataManager) {

    var DataModel = Model.extend({

        /**
         * Initializes the data model.
         * @param {Object} values The initial values of this model
         * @param intervals A parent intervals handler (from tool)
         * @param {Object} bind Initial events to bind
         */
        init: function(values, intervals, bind) {

            values = _.extend({
                reader: "local-json",
                path: "data.json"
            }, values);

            //initial values
            this._loading = false;
            this._items = [];
            this._query = [];
            this._language = "en";
            this._dataManager = new DataManager();

            //same constructor as parent, with same arguments
            this._super(values, intervals, bind);
        },

        /**
         * Overwrites the get method in order to get items easily
         * @param pars Optional attribute
         * @returns attr value or all values if attr is undefined
         */
        get: function(pars) {
            if (pars === "items") {
                return this.getItems();
            }
            return this._super(pars);
        },

        /**
         * Gets the items
         * @returns {Array} all items in the collection
         */
        getItems: function() {
            if (this._items.length === 1) return this._items[0];
            return this._items;
        },

        /**
         * Gets limits
         * @returns {Object} time limits
         */
        //todo: this only works for int
        getLimits: function(attr) {
            if (_.isArray(this._items) && this._items.length === 1) {
                this._items = this._items[0];
            }
            var limits = {
                    min: 0,
                    max: 0
                },
                filtered = _.map(this._items, function(d) {
                    return parseInt(d[attr], 10);
                });
            if (filtered.length > 0) {
                limits.min = _.min(filtered);
                limits.max = _.max(filtered);
            }
            return limits;
        },

        /**
         * Loads data using data manager
         * @returns a promise that will be resolved when data is available
         */
        load: function(query, language) {
            var _this = this,
                defer = $.Deferred();

            if (query || language || this._loading) {
                return true;
            }

            this._loading = true;
            this.trigger("load_start");
            //when request is completed, set it
            this._dataManager.load(query,
                    language,
                    this.reader,
                    this.path)
                .done(function(data) {
                    if (data === 'error') {
                        _this.trigger("load_error", query);
                    } else {
                        _this._loading = false;
                        _this._items = _this._dataManager.get();
                        _this.trigger(["load_end", "change"]);
                        defer.resolve();
                    }
                });

            return defer;
        }

    });

    return DataModel;
});