define([
    'd3',
    'underscore',
    'components/component',
    'tools/tool-model'
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
                var promise = _this.model.load();

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
            var promise = this.model.load(),
                _this = this;

            promise.done(function() {
                for (var i in _this.components) {
                    _this.components[i].update();
                }
            });



        },

        // Load data from the state

    });




    return Tool;
});