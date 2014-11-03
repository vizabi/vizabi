define([
    'd3',
    'underscore',
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

            var validate = config.validate || this.toolModelValidation,
                query = config.query || this.getQuery;

            /*
             * Building Tool Model
             */
            var _this = this;
            this.model = new ToolModel(options, {
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
                    //model is ready, we can load data for the first time
                    _this.model.load();
                }
            }, validate, query);

            /*
             * Parent Constructor (this = root parent)
             */
            this._super(config, this);

            /*
             * Specific binding for tools
             */
            // var _this = this;
            // this.model.on("load:start", function() {
            //     _this.beforeLoading();
            // });
            // this.model.on("load:end", function() {
            //     _this.afterLoading();
            // });

            // if (this.model) {
            //     var _this = this;
            //     this.model.on("change", function() {
            //         if (_this._ready) {
            //             _this.update();
            //         }
            //     });
            //     this.model.on("reloaded", function() {
            //         if (_this._ready) {
            //             _this.translateStrings();
            //         }
            //     });
            // }
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
                this.model.propagate(options, silent);
            }
            this.update();
        },

        /* ==========================
         * Loading methods
         * ==========================
         */

        /**
         * Displays loading class
         */
        beforeLoading: function() {
            this.element.classed(class_loading_data, true);
        },

        /**
         * Removes loading class
         */
        afterLoading: function() {
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