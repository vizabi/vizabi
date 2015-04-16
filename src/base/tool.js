define([
    'd3',
    'lodash',
    'base/utils',
    'base/component',
    'base/layout',
    'models/tool'
], function(d3, _, utils, Component, Layout, ToolModel) {

    var class_placeholder = "vzb-placeholder",
        class_loading_data = "vzb-loading-data",
        class_loading_error = "vzb-loading-error",
        class_loading = "vzb-loading";
    //Tool does everything a component does, but has different defaults
    //And possibly some extra methods
    var Tool = Component.extend({

        /**
         * Initializes the tool
         * @param {Object} config Initial config, with name and placeholder
         * @param {Object} options Options such as state, data, etc
         */
        init: function(config, options) {
            //tool-specific values
            this._id = _.uniqueId("t");
            this.template = this.template || "tools/tool";
            this.layout = new Layout();
            this.ui = options.ui || {};
            this.model_binds = this.model_binds || {};

            //bind the validation function with the tool
            var validate = this.validate.bind(this);

            //build tool model
            var _this = this;
            this.model = new ToolModel(options, utils.extendCallbacks({
                'set': function(evt, val) {
                    //binding external events
                    _this._bindEvents();
                    //this ui is the model
                    _this.ui = _this.model.ui;
                    //rendering
                    _this.render().then(function() {
                        _this.triggerAll(evt, val);
                    });
                },
                'change': function(evt, val) {
                    //defer to give time for loading
                    _.defer(function() {
                        if (_this._ready) {
                            _this.model.validate().then(function() {
                                _this.triggerAll(evt, val);
                            });
                        }
                    });
                },
                'translate': function(evt, val) {
                    if (_this._ready) {
                        _this.model.load().then(function() {
                            _this.model.validate();
                            _this.translateStrings();
                        });
                    }
                },
                'load_start': function() {
                    _this.beforeLoading();
                },
                'load_error': function() {
                    _this.errorLoading();
                },
                'ready': function(evt) {
                    if (_this._ready) {
                        _this.afterLoading();
                    }
                },
                "arthur": [function() {
                    console.log("testing model binds");
                    if (_this._ready) {
                        _this.afterLoading();
                    }
                }, function() {
                    console.log("testing model binds");
                    if (_this._ready) {
                        _this.afterLoading();
                    }
                }]
            }, this.model_binds), validate);

            // Parent Constructor (this = root parent)
            this._super(config, this);

            //placeholder should have the placeholder class
            if (!this.placeholder.classed(class_placeholder)) {
                this.placeholder.classed(class_placeholder, true);
            }
            //placeholder always starts with loading class
            this.placeholder.classed(class_loading, true);
        },

        /**
         * Binds events in model to outside world
         */
        _bindEvents: function() {
            if (!this.model.bind) return;
            this.on(this.model.bind.get());
        },

        /**
         * Sets options from external page
         * @param {Object} options new options
         * @param {Boolean} overwrite overwrite everything instead of extending
         * @param {Boolean} silent prevent events
         */
        setOptions: function(options, overwrite, silent) {
            if (overwrite) {
                this.model.reset(options, silent);
                this.reassignModel();
            } else {
                this.model.set(options, silent);
            }
        },

        /**
         * Displays loading class
         */
        beforeLoading: function() {
            //do not update if it's loading
            if (!this.placeholder.classed(class_loading_data)) {
                this.placeholder.classed(class_loading_data, true);
                this.blockUpdate(true);
                this.blockResize(true);
            };
        },

        /**
         * Removes loading class
         */
        afterLoading: function() {
            //it's ok to update if not loading
            this.blockUpdate(false);
            this.blockResize(false);
            //defer to make sure it's updated
            var _this = this;
            _.defer(function() {
                _this.placeholder.classed(class_loading_data, false);
            });
        },

        /**
         * Adds loading error class
         */
        errorLoading: function() {
            this.placeholder.classed(class_loading_error, false);
        },

        /* ==========================
         * Validation and query
         * ==========================
         */

        /**
         * Placeholder for model validation
         */
        validate: function() {
            //placeholder for tool validation methods
        },

        //TODO: remove query from here
        /**
         * Placeholder for query
         */
        getQuery: function() {
            return []; //return tool queries
        }


    });

    return Tool;
});