define([
    'd3',
    'lodash',
    'base/component',
    'base/layout',
    'models/tool'
], function(d3, _, Component, Layout, ToolModel) {

    var class_loading_data = "vzb-loading-data",
        class_loading_error = "vzb-loading-error";
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

            var validate = config.validate || this.toolModelValidation,
                query = config.query || this.getQuery;

            //build tool model
            var _this = this;
            this.model = new ToolModel(options, {
                'change': function(evt, val) {
                    if (_this._ready) {
                        _this.model.validate().done(function() {
                             _.defer(function() {
                                _this.update();
                            });
                        });
                    }
                    _this.triggerAll(evt, val);
                },
                'reloaded': function(evt, val) {
                    if (_this._ready) {
                        _this.model.validate().done(function() {
                             _this.update();
                        });
                        _this.translateStrings();
                    }
                },
                'load_start': function() {
                    _this.beforeLoading();
                },
                'load_end': function() {
                    _this.afterLoading();
                },
                'load_error': function() {
                    _this.errorLoading();
                },
                'ready': function() {
                    //binding external events
                    _this._bindEvents();
                    //this ui is the model
                    _this.ui = _this.model.ui;
                    //rendering
                    _this.render();
                }
            }, validate, query);

            // Parent Constructor (this = root parent)
            this._super(config, this);
        },

        /**
         * Loads the model as a postRender function
         * @returns defer a promise to be resolved when model is loaded
         */
        postRender: function() {
            return this.model.load();
        },

        /**
         * Binds events in model to outside world
         */
        _bindEvents: function() {
            if (!this.model.bind) return;
            for (var i in this.model.bind.get()) {
                this.on(i, this.model.bind.get(i));
            }
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

        /* ==========================
         * Loading methods
         * ==========================
         */

        /**
         * Displays loading class
         */
        beforeLoading: function() {
            //do not update if it's loading
            this.blockUpdate(true);
            this.element.classed(class_loading_data, true);
        },

        /**
         * Removes loading class
         */
        afterLoading: function() {
            //it's ok to update if not loading
            this.blockUpdate(false);
            this.element.classed(class_loading_data, false);
        },

        /**
         * Adds loading error class
         */
        errorLoading: function() {
            this.element.classed(class_loading_error, false);
        },

        /* ==========================
         * Validation and query
         * ==========================
         */

        /**
         * Placeholder for model validation
         */
        toolModelValidation: function() {
            //placeholder for tool validation methods
        },

        /**
         * Placeholder for query
         */
        getQuery: function() {
            return []; //return tool queries
        }


    });

    return Tool;
});