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

            var _this = this;
            
            //constructor is similar to model
            this._super(values, this._intervals, binds);

            /*
             * Binding Events
             */
            //load whenever show or language changes
            // var _this = this;
            // this.on(["change:state:show", "change:language"], function() {
            //     _this.load().done(function() {
            //         _this.trigger("reloaded");
            //     });
            // });
        },

        /* ==========================
         * Loading and resetting
         * ==========================
         */

        //load method (hotfix)
        //TODO: improve the whole loading logic. It should load, then render
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

        reset: function(new_options, silent) {
            var model_config = this._generateModelConfig(new_options);
            this._super(model_config, silent);
            //rebind events
            this.bindEvents(new_options.bind);
        },

        /* ==========================
         * Binding and propagation
         * ==========================
         */

        bindEvents: function(evts) {
            var _this = this;
            for (var i in evts) {
                _this.on(i, evts[i]);
            }
        },

        //propagate option changes to model
        //todo: improve propagation of models
        propagate: function(options, silent) {
            //state properties
            // if (options.state) {
            //     for (var i in options.state) {
            //         this.get(i).set(options.state[i], silent);
            //     }
            // }
            // //language properties
            // if (options.language) {
            //     this.get("language").set(options.language, silent);
            // }
            // if (options.data) {
            //     this.get("data").set(options.data, silent);
            // }
            // //bind properties
            // if (options.bind) {
            //     this.get("bind").set(options.bind, silent);
            // }
            //binding
        },

        /* ==========================
         * Validation methods
         * ==========================
         */

        _generateValidate: function(validate) {
            /*
             * Function format
             * validate = function(model) {
             *     //change model
             *     //return model if changes were made
             *     //return false if no changes were made
             * }
             */

            if (typeof validate === 'function') {
                var _this = this;
                return function() {
                    while (validate(_this));
                    return;
                }
            }
            /*
             * Rules format
             * validate = [
             *     ["time.start", "=", "data.show.time_start"],
             *     ["time.end", "=", "data.show.time_end"],
             *     ["data.selected.time", "=", "time.value"]
             * ];
             */
            else {
                return this._parseValidate(validate);
            }
        },

        _parseValidate: function(validate) {
            if (!validate || validate.length === 0) {
                this.validate; //return generic model validation
            }

            var val_functions = [];
            for (var i = 0, size = validate.length; i < size; i++) {
                var rule = validate[i];
                if (rule.length !== 3) {
                    console.log("State validation format error: Rule " + i + ". Skipping...");
                    continue;
                }

                //rule is of the format [operand1, sign, operand2]
                //operand is a chain defined by a string: "model1.part.value"
                var v1 = rule[0].split("."), //split parts by "."
                    m1 = this.get(v1.shift()), //model is first part before "."
                    v1 = v1.join("."), //value is the rest, next parts
                    v2 = rule[2].split("."),
                    m2 = this.get(v2.shift()),
                    v2 = v2.join("."),
                    sign = rule[1]; //sign

                //generate validation for a single rule
                var evaluate = this._generateValidateRule(m1, v1, sign, m2, v2);
                val_functions.push(evaluate);
            };

            var validate_loop = false;
            //validate is the execution of each rule
            return function validate(silent) {
                //avoid validation loop
                if (validate_loop) {
                    validate_loop = false;
                    return;
                }
                validate_loop = true;
                for (var i = 0; i < val_functions.length; i++) {
                    val_functions[i](silent);
                };
            }
        },

        //arguments: model1, value1, sign, model2, value2:
        //example: 'time', 'value', '=', 'time_2', 'value'
        _generateValidateRule: function(m1, v1, sign, m2, v2) {
            var rule = function() {};
            switch (sign) {
                case '>':
                    rule = function(silent) {
                        if (m1.get(v1) <= m2.get(v2)) {
                            m1.set(v1, m2.get(v2) + 1, silent);
                        }
                    };
                    break;
                case '<':
                    rule = function(silent) {
                        if (m1.get(v1) >= m2.get(v2)) {
                            m1.set(v1, m2.get(v2) - 1, silent);
                        }
                    };
                    break;
                case '>=':
                    rule = function(silent) {
                        if (m1.get(v1) < m2.get(v2)) {
                            m1.set(v1, m2.get(v2), silent);
                        }
                    };
                    break;
                case '<=':
                    rule = function(silent) {
                        if (m1.get(v1) > m2.get(v2)) {
                            m1.set(v1, m2.get(v2), silent);
                        }
                    };
                    break;
                case '=':
                default:
                    rule = function(silent) {
                        if (m1.get(v1) != m2.get(v2)) {
                            m1.set(v1, m2.get(v2), silent);
                        }
                    };
                    break;
            }
            return rule;
        }

    });

    return ToolModel;
});