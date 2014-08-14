define([
    'd3',
    'underscore',
    'base/component',
    'base/tool-model'
], function(d3, _, Component, ToolModel) {

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

            // Same constructor as widgets
            this._super(parent, options);

            this.layout = this.getInstance('layout');
        },
        
        //Tools renders just like the widgets, but they update the layout
        render: function() {
            var _this = this;
            return this._super(function() {
                var defer = $.Deferred();

                var promise = _this.loadData();

                promise.done(function() {

                    _this.layout.setContainer(_this.element);
                    _this.layout.setProfile(_this.profiles);
                    _this.layout.update();
                    //binds resize event to update
                    _this.events.bind('resize', function() {
                        _this.layout.update();
                    });

                    //call update of each component when the state changes
                    _this.model.bind('change:state', function(state) {
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
        },

        // is executed before loading actaul data
        beforeLoading: function() {
            this.element.classed("loading-data", true);
        },

        // is executed after loading actaul data
        afterLoading: function() {
            this.element.classed("loading-data", false);
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
        }
    });





    return Tool;
});