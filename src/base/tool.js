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
            // Define default template 
            this.template = this.template || "tools/tool";
            this.profiles = this.profiles || {
                'default': {
                    timeslider: true,
                    buttonlist: true,
                    title: true
                }
            };

            this.layout = new Layout();

            //state validation is preset or empty
            this.state_validate = this.state_validate || [];
            //model queries might be present or not
            this.model_queries = this.model_queries || {};

            this.model = new ToolModel(options, this.state_validate, this.model_queries);

            // Same constructor as components
            // this passed as root parent
            this._super(options, this);

            this._id = _.uniqueId("t");

            //todo: improve these events
            //bind loading events
            var _this = this;
            this.model.on("load:start", function() {
                _this.beforeLoading();
            });
            this.model.on("load:end", function() {
                _this.afterLoading();
            });
        },

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

        setOptions: function(options, overwrite, silent) {
            if (overwrite) {
                this.model.reset(options, silent);
                this.reassignModel();
            } else {
                this.model.propagate(options, silent);
            }
            this.update();
        },

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

        //empty getQuery
        getQuery: function() {
            return false;
        }
    });

    return Tool;
});