define([
    'underscore',
    'base/utils',
    'base/model',
    'base/intervals',
    'models/data-model',
    'models/language-model',
    'models/state-model',
    'models/time-model'
], function(_, utils, Model, Intervals, DataModel, LanguageModel, StateModel, TimeModel) {

    var ToolModel = Model.extend({
        init: function(options) {
            //all intervals are managed at tool level
            this.intervals = new Intervals();

            var model_config = this._generateModelConfig(options);
            this._super(model_config);

            //bind external events
            this.bindEvents(options.bind);
        },

        _generateModelConfig: function(options) {

            var model_config = {},
                _this = this;

            //todo: improve code below
            //generate state, data and language models by default
            model_config.state = this._generateModel("state", options.state)
            model_config.data = this._generateModel("data", options.data)
            model_config.bind = this._generateModel("bind", options.bind)
            model_config.language = this._generateModel("language", options.language);
            //bind them
            model_config.state.on("change", function(evt, new_values) {
                _this.trigger("change:state", new_values);
            });
            model_config.data.on("change", function(evt, new_values) {
                _this.trigger("change:data", new_values);
            });
            model_config.bind.on("change", function(evt, new_values) {
                _this.trigger("change:bind", new_values);
            });
            model_config.language.on("change", function(evt, new_values) {
                _this.trigger("change:language", new_values);
            });

            //include a model for each property in the state
            for (var i in options.state) {
                //naming convention: underscore -> time, time_2, time_overlay
                var name = i.split("_")[0];
                model_config[i] = this._generateModel(name, options.state[i]);

                //bind each state submodel to the state
                model_config[i].on("change", function(evt, new_values) {
                    _this.get("state").set(i, new_values);
                    _this.trigger("change:state:" + i, new_values);
                })
            }


            return model_config;
        },

        //generate model
        _generateModel: function(model_name, values) {

            //todo: possible improvement (load via require)
            var available_models = {
                    data: DataModel,
                    language: LanguageModel,
                    state: StateModel,
                    time: TimeModel,
                    bind: Model
                }
                //use specific model if it exists
            if (available_models.hasOwnProperty(model_name)) {
                return new available_models[model_name](values, this.intervals);
            } else {
                return new Model(values, this.intervals);
            }
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
            //data properties
            if (options.data) {
                this.get("data").set(options.data);
            }
            //language properties
            if (options.language) {
                this.get("language").set(options.language);
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
        }

    });

    return ToolModel;
});