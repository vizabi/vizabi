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

            var _this = this;
            return function() {
                var model = JSON.stringify(_this.getObject()),
                    c = 0,
                    max = 10;
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