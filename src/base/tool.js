define([
    'd3',
    'underscore',
    'base/component',
    'base/layout',
    'models/tool-model'
], function(d3, _, Component, Layout, ToolModel) {

    var class_loading_data = "vzb-loading-data";
    //Tool does everything a component does, but has different defaults
    //And possibly some extra methods
    var Tool = Component.extend({
        init: function(options) {
            //tool-specific values
            this._id = _.uniqueId("t");
            this.template = this.template || "tools/tool";
            this.layout = new Layout();

            /*
             * Building Tool Model
             */
            options.validate = options.validate || this.toolModelValidation;
            options.query = options.query || this.getQuery;
            this.model = new ToolModel(options);

            /*
             * Parent Constructor (this = root parent)
             */
            this._super(options, this);

            /*
             * Specific binding for tools
             */
            var _this = this;
            this.model.on("load:start", function() {
                _this.beforeLoading();
            });
            this.model.on("load:end", function() {
                _this.afterLoading();
            });
        },

        /* ==========================
         * Rendering
         * ==========================
         */

        //resizing the tool is resizing the components
        resize: function() {
            for (var i in this.components) {
                if (this.components.hasOwnProperty(i)) {
                    this.components[i].resize();
                }
            }
        },

        //updating the tool is updating the components
        update: function() {
            // var promise = this.loadData(),
            //     _this = this;

            // promise.done(function() {
            //     for (var i in _this.components) {
            //         if (_this.components.hasOwnProperty(i)) {
            //             _this.components[i].update();
            //         }
            //     }
            // });
            var _this = this;
            for (var i in _this.components) {
                if (_this.components.hasOwnProperty(i)) {
                    _this.components[i].update();
                }
            }
        },

        /* ==========================
         * Set Options from outside
         * ==========================
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
         * Data loading methods
         * ==========================
         */

        // is executed before loading actaul data
        beforeLoading: function() {
            this.element.classed(class_loading_data, true);
        },

        // is executed after loading actaul data
        afterLoading: function() {
            this.element.classed(class_loading_data, false);
        },

        // Load must be implemented here
        load: function(events) {

            var _this = this,
                defer = $.Deferred();

            //get info from options
            var language = this.model.get("language"),
                query = this.getQuery();

            if (query) {
                //load data and resolve the defer when it's done
                $.when(
                    this.model.data.load(query, language, events)
                ).done(function() {
                    defer.resolve();
                });
            } else {
                defer = true;
            }

            return defer;
        },

        /* ==========================
         * Validation and query
         * ==========================
         */

        toolModelValidation: function() {
            //placeholder for tool validation methos
        },

        getQuery: function() {
            return false; //return tool queries
        }


    });

    return Tool;
});