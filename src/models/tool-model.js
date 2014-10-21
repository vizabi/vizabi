define([
    'underscore',
    'base/model',
    'models/data-model',
    'models/language-model',
    'models/state-model',
    'models/time-model'
], function(_, Model, DataModel, LanguageModel, StateModel, TimeModel) {

    var ToolModel = Model.extend({
        init: function(options) {
            var model_config = this._generateModelConfig(options);
            this._super(model_config);
        },

        _generateModelConfig: function(options) {

            var model_config = {},
                _this = this;

            //todo: improve code below
            //generate state, data and language models by default
            model_config.state = this._generateModel("state", options.state)
            model_config.data = this._generateModel("data", options.data)
            model_config.language = this._generateModel("language", {
                value: options.language,
                ui_strings: options.ui_strings
            });
            //bind them
            model_config.state.on("change", function(evt, new_values) {
                _this.trigger("change:state", new_values);
            });
            model_config.data.on("change", function(evt, new_values) {
                _this.trigger("change:data", new_values);
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
                    time: TimeModel
                }
                //use specific model if it exists
            if (available_models.hasOwnProperty(model_name)) {
                return new available_models[model_name](values);
            } else {
                return new Model(values);
            }
        }

    });

    return ToolModel;
});