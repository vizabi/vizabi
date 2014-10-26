define([
    'jquery',
    'underscore',
    'base/utils',
    'base/model',
    'base/intervals',
    'models/data-model',
    'models/language-model',
    'models/time-model'
], function($, _, utils, Model, Intervals, DataModel, LanguageModel, TimeModel) {

    var ToolModel = Model.extend({
        init: function(options, state_validate, model_queries) {
            //all intervals are managed at tool level
            this.intervals = new Intervals();

            var config = this._generateModelConfig(options, model_queries);
            this._super(config);

            //bind external events
            this.bindEvents(options.bind);

            //create validation method and trigger for the first time
            this.validate = this._generateValidate(state_validate);
            this.validate();

            //bind loading to each submodel
            var _this = this;
            submodels = this.get();
            for (var i = 0; i < submodels.length; i++) {
                var submodel = submodels[i];
                if (submodel.load) {
                    submodel.on("load:start", function() {
                        _this.trigger("load:start");
                    });
                    submodel.on("load:end", function() {
                        _this.trigger("load:end");
                    });
                    submodel.on("load:error", function() {
                        _this.trigger("load:error");
                    });
                }
            };
        },

        //load method (hotfix)
        //TODO: improve the whole loading logic. It should load, then render
        load: function() {
            var _this = this,
                defer = $.Deferred(),
                promises = [],
                submodels = this.get();

            //load each submodel
            for (var i = 0; i < submodels.length; i++) {
                var submodel = submodels[i];
                if (submodel.load) {
                    promises.push(submodel.load());
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

        //propagate option changes to model
        //todo: improve propagation of models
        propagate: function(options, silent) {
            //state properties
            if (options.state) {
                for (var i in options.state) {
                    this.get(i).set(options.state[i], silent);
                }
            }
            //bind properties
            if (options.bind) {
                this.get("bind").set(options.bind);
            }
            //binding
        },

        bindEvents: function(evts) {
            var _this = this;
            for (var i in evts) {
                _this.on(i, evts[i]);
            }
        },

        _generateModelConfig: function(options, model_queries) {

            var model_config = {},
                _this = this;

            //generate state, data and language models by default and bind
            var default_models = ["state", "bind"];
            for (var i = 0, size = default_models.length; i < size; i++) {
                var m = default_models[i];
                model_config[m] = this._generateModel(m, options[m]);
                model_config[m].on("change", this._subModelOnChange(m));
            }

            //include a model for each property in the state and bind
            for (var i in options.state) {
                //naming convention: underscore -> time, time_2, time_overlay
                var name = i.split("_")[0]
                queries = model_queries[i] || false;

                model_config[i] = this._generateModel(name, options.state[i], queries);
                model_config[i].on("change", _this._subStateOnChange(i));
            }

            return model_config;
        },

        //generate model
        _generateModel: function(model_name, values, queries) {
            //todo: possible improvement (load via require)
            var available_models = {
                    data: DataModel,
                    language: LanguageModel,
                    time: TimeModel
                },
                model;
            //use specific model if it exists
            if (available_models.hasOwnProperty(model_name)) {
                model = new available_models[model_name](values, this.intervals);
                //todo: generalize to anytime of model
                if(model_name === 'data' && queries) {
                    model.setQuery(queries(model));
                }
            } else {
                model = new Model(values, this.intervals);
            }
            return model;

        },

        _subModelOnChange: function(submodel) {
            var _this = this;
            return function(evt, new_values) {
                _this.trigger("change:" + submodel, new_values);
            }
        },

        _subStateOnChange: function(substate) {
            var _this = this;
            return function(evt, new_values) {
                _this.validate();
                _this.get("state").set(substate, new_values, false, true);
                _this.trigger("change:state:" + substate, new_values);
            };
        },

        _generateValidate: function(state_validate) {
            if (!state_validate || state_validate.length === 0) {
                this.validate; //return generic model validation
            }

            var val_functions = [];
            for (var i = 0, size = state_validate.length; i < size; i++) {
                var rule = state_validate[i];
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