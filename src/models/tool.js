define([
    'q',
    'lodash',
    'base/utils',
    'base/intervals',
    'base/model'
], function(Q, _, utils, Intervals, Model) {

    var ToolModel = Model.extend({

        /**
         * Initializes the tool model.
         * @param {Object} values The initial values of this model
         * @param {Object} binds contains initial bindings for the model
         * @param {Function|Array} validade validate rules
         */
        init: function(values, defaults, binds, validate) {
            this._id = _.uniqueId("tm");
            this._type = "tool";
            //all intervals are managed at tool level
            this._intervals = new Intervals();

            //generate validation function
            this.validate = this._generateValidate(validate);

            //default submodels
            values = this.defaultOptions(values, defaults);

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
         * Default options methods
         * ==========================
         */

        /**
         * Generates a valid state based on default options
         */
        defaultOptions: function(values, defaults) {

            for(var field in defaults) {

                var blueprint = defaults[field];
                var original = values[field];
                //specified type, default value and possible values
                var type = _.isObject(blueprint) ? blueprint._type_ : null;
                var defs = _.isObject(blueprint) ? blueprint._defs_ : null;
                var opts = _.isObject(blueprint) ? blueprint._opts_ : null;

                if(!type) {
                    if(_.isUndefined(original)) {
                        values[field] = blueprint;
                    }
                    continue;
                }
                
                //each case has special verification
                if(type === "number" && !_.isNumber(original)) {
                    values[field] = _.isNumber(defs) ? defs : 0;
                }
                else if(type === "string" && !_.isString(original)) {
                    values[field] = _.isString(defs) ? defs : "";
                }
                else if(type === "array" && !_.isArray(original)) {
                    values[field] = _.isArray(defs) ? defs : [];
                }
                else if(type === "object" && !_.isPlainObject(original)) {
                    values[field] = _.isPlainObject(defs) ? defs : {};
                }
                else if(type === "model" || type === "hook") {
                    if(!_.isPlainObject(original)) {
                        values[field] = {};
                    }
                    values[field] = this.defaultOptions(values[field], defs);
                }

                //if possible values are determined, we should respect it
                if(_.isArray(opts) && defs
                   && _.indexOf(opts, values[field]) === -1) {
                    values[field] = defs;
                }

            }

            return values;

        },
        
        //todo: improve loops and maybe generalize to all components

        /* ==========================
         * Validation methods
         * ==========================
         */

        /**
         * Generates a validation function based on specific model validation
         * @returns {Function} val function
         */
        //todo: improve loops and maybe generalize to all components
        _generateValidate: function(val) {

            var _this = this;
            var v = val;
            
            function validate_func(i) {
                var model = JSON.stringify(_this.getObject()),
                    c = i || 0,
                    //maximum number of times a tool model can be validated
                    max = 10,
                    defer = Q.defer();

                //validate model
                Q((v() || true)).finally(function() {

                    var model2 = JSON.stringify(_this.getObject());
                    if (model === model2 || c >= max) {
                        if (c >= max) {
                            console.log(model);
                        }
                        defer.resolve();
                    } else {
                        //recursively call if not the stable
                        validate_func(++i).then(function() {
                            defer.resolve();
                        });
                    }
                });

                return defer.promise;
            }

            return validate_func;
        }

    });

    return ToolModel;
});