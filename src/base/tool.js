define([
    'd3',
    'underscore',
    'base/component',
    'base/tool-model',
    'base/layout'
], function(d3, _, Component, ToolModel, Layout) {

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

            this.model = new ToolModel(options.data);
            this.model.setState(options.state, true);

            //set language parameters
            this.model.set("language", options.language);
            this.model.set("ui_strings", options.ui_strings);

            this.layout = new Layout();


            // Same constructor as widgets
            this._super(parent, options);

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
                    _this.model.on(['change:state', 'change:language'], function(state) {
                        _this.update();
                    });


                    defer.resolve();
                });

                return defer;

            });
        },

        bind: function(evt, func) {
            this.events.bind(evt, func);
            return this;
        },

        trigger: function(evt) {
            var args = Array.prototype.slice.call(arguments).slice(1);
            this.events.trigger(evt, args);
            return this;
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

            promise.done(function() {
                for (var i in _this.components) {
                    if (_this.components.hasOwnProperty(i)) {
                        _this.components[i].update();
                    }
                }
            });
        },

        //TODO: expand for other options 
        setOptions: function(options) {
            this.setState(options.state);
            if (options.language) {
                this.model.set("language", options.language);
            }
            if (options.ui_strings) {
                this.model.set("ui_strings", _.extend(this.model.get("ui_strings"), options.ui_strings));
            }

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