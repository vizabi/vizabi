define([
    'jquery',
    'lodash',
    'base/utils',
    'base/intervals',
    'base/model'
], function($, _, utils, Intervals, Model) {

    var ToolModel = Model.extend({

        /**
         * Initializes the tool model.
         * @param {Object} values The initial values of this model
         * @param {Object} binds contains initial bindings for the model
         * @param {Function|Array} validade validate rules
         * @param {Function} query getQuery function
         */
        init: function(values, binds, validate, query) {
            this._id = _.uniqueId("tm");
            //all intervals are managed at tool level
            this._intervals = new Intervals();

            //generate validation function
            this.validate = this._generateValidate(validate);
            this._query = query;

            //default submodels
            values = _.extend({
                state: {},
                language: {},
                data: {},
                ui: {},
                bind: {}
            }, values);

            //constructor is similar to model
            this._super(values, this._intervals, binds);
            
            //load whenever show or language changes
            var _this = this;
            this.on(["change:state:show", "change:language"], function() {
                _this.load().done(function() {
                    _this.trigger("reloaded");
                });
            });
        },

        /* ==========================
         * Loading
         * ==========================
         */

        /**
         * Loads all submodels
         * @returns defer to be resolved when everything is loaded
         */
        load: function() {
            var _this = this,
                defer = $.Deferred(),
                promises = [],
                submodels = this.get(),
                query = this._query(this),
                language = this.language.id;

            //load each submodel
            for (var i in submodels) {
                var submodel = submodels[i];
                if (submodel.load) {
                    promises.push(submodel.load(query, language));
                }
            };

            $.when.apply(null, promises).then(function() {
                _this.validate();
                defer.resolve();
            });

            return defer;
        },

        /* ==========================
         * Validation methods
         * ==========================
         */

        /**
         * Generates a validation function based on specific model validation
         * @returns {Function} validate function
         */
        //todo: improve loops and maybe generalize to all components
        _generateValidate: function(validate) {

            var _this = this;
            return function() {
                var model = JSON.stringify(_this.getObject()),
                    c = 0,
                    max = 20;
                while (c < max) {
                    validate(_this);
                    model2 = JSON.stringify(_this.getObject());
                    if (model === model2) {
                        break;
                    } else {
                        c++;
                        model = model2;
                        if (c >= max) {
                            console.log("Validation error: " + _this._id);
                            console.log(model);
                            break;
                        }
                    }
                }
                return;
            }
        }

    });

    return ToolModel;
});