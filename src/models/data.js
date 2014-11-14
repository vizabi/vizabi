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
        getItems: function(which) {
            if (this._items.length === 1) return this._items[0];
            return this._items;
        },

        /**
         * Gets limits
         * @param {String} attr parameter
         * @param {Number} res result order
         * @returns {Object} time limits
         */
        //FIX ME improve way limits are checked
        //TODO: this only works for acceptable formats for new Date()
        getLimits: function(attr, res) {
            if (!attr) attr = 'time'; //fallback in case no attr is provided
            if (!res) res = 0; //fallback in case no order is provided
            var limits = {
                    min: 0,
                    max: 0
                },
                filtered = _.map(this._items[res], function(d) {
                    //TODO: Move this up to readers ?
                    return new Date(d[attr]);
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

            if (!query || !language || this._loading) {
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
                    _this._loading = false;
                    if (data === 'error') {
                        _this.trigger("load_error", query);
                    } else {
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