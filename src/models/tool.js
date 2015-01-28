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
         */
        init: function(values, binds, validate) {
            this._id = _.uniqueId("tm");
            this._type = "tool";
            //all intervals are managed at tool level
            this._intervals = new Intervals();

            //generate validation function
            this.validate = this._generateValidate(validate);

            //default submodels
            values = _.extend({
                state: {},
                language: {},
                data: {},
                ui: {},
                bind: {}
            }, values);

            //constructor is similar to model
            this._super(values, null, binds);

            // change language
            if (values.language) {
                var _this = this;
                this.on("change:language", function() {
                    _this.trigger("translate");
                });
            }

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
            return function(i) {
                var model = JSON.stringify(_this.getObject()),
                    c = i || 0,
                    //maximum number of times a tool model can be validated
                    max = 20,
                    defer = $.Deferred();

                //validate model
                var val_promise = validate(_this);

                //if validation is not a promise, make it a confirmed one
                if (!val_promise || !val_promise.always) {
                    val_promise = $.when.apply(null, [this]);
                }

                //when validation is done, compare two models
                val_promise.always(function() {
                    var model2 = JSON.stringify(_this.getObject());
                    if (model === model2 || c >= max) {
                        if (c >= max) {
                            console.log("Validation error: " + _this._id);
                            console.log(model);
                        }
                        defer.resolve();
                    } else {
                        //recursively call if not the stable
                        _this.validate(i++);
                    }
                });

                return defer;
            }
        }

    });

    return ToolModel;
});