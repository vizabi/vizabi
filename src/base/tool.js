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
                'set': function() {
                    //binding external events
                    _this._bindEvents();
                    //this ui is the model
                    _this.ui = _this.model.ui;
                    //rendering
                    var promise = _this.render();
                    //after rendering, we can set up hooks and load
                    $.when.apply(null, [promise]).then(function() {
                        //set hooks after all submodels are set
                        _this.model.setHooks();
                        //load after we have all hooks in place
                        _this.model.load();
                    });
                },
                'change': function(evt, val) {
                    if (_this._ready) {
                        _this.model.validate().done(function() {
                            _this.dataReady();
                        });
                    }
                    _this.triggerAll(evt, val);
                },
                'reloaded': function(evt, val) {
                    if (_this._ready) {
                        _this.model.validate().done(function() {
                            _this.dataReady();
                        });
                        _this.translateStrings();
                    }
                },
                'load_start': function() {
                    _this.beforeLoading();
                },
                'load_error': function() {
                    _this.errorLoading();
                },
                'load_end': function(evt, vals) {
                },
                'ready': function() {
                    _this.afterLoading();
                    _this.dataReady();
                }
            }, validate, query);

            // Parent Constructor (this = root parent)
            this._super(config, this);
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