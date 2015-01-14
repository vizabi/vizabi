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
            if(values.language) {
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
            return function() {
                var model = JSON.stringify(_this.getObject()),
                    c = 0,
                    max = 20,
                    defer = $.Deferred();
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
                //postpone resolution to last callstack
                _.defer(function() {
                    defer.resolve();
                });
                return defer;
            }
        }

    });

    return ToolModel;
});
