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
        init: function(parent, options) {
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
            this.model = new ToolModel(options);

            // Same constructor as components
            this._super(parent, options);

            this._id = _.uniqueId("t");

        },

        //Tools renders just like the widgets, but they update the layout
        render: function() {
            var _this = this;
            return this._super(function() {
                var defer = $.Deferred();

                $.when(
                    _this.loadData()
                ).done(function() {

                    _this.layout.setContainer(_this.element);
                    _this.layout.setProfile(_this.profiles);
                    _this.layout.resize();

                    //binds resize event to update
                    _this.layout.on('resize', function() {
                        _this.resize();
                    });

                    // call update of each component when the state changes
                    // or when the language changes
                    // _this.model.on([
                    //     'change:state',
                    //     'change:language',
                    //     'change:data'
                    // ], function(evt, new_values) {
                    //     _this.update();
                    //     _this.trigger(evt, new_values);
                    // });


                    defer.resolve();
                });
                return defer;
            });
        },

        on: function(evt, func) {
            this.events.bind(evt, func);
        },

        trigger: function(evt, values) {
            this.events.trigger(evt, values);
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
            var promise = this.loadData(),
                _this = this;

            $.when([promise]).done(function() {
                for (var i in _this.components) {
                    if (_this.components.hasOwnProperty(i)) {
                        _this.components[i].update();
                    }
                }
            });
        },
 
        setOptions: function(options, overwrite, silent) {
            if(overwrite) {
                this.model.reset(options, silent);
                this.reassignModel();
            }
            else {
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

        loadData: function() {
            var _this = this,
                events = {
                    before: function() {
                        _this.beforeLoading();
                    },
                    success: function() {
                        _this.afterLoading();
                    }
                };

            return this.load(events);
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