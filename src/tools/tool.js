define([
  'd3',
  'underscore',
  'components/component',
  'tools/tool-model'
], function(d3, _, Component, ToolModel) {

  //Tool does everything a component does, but has different defaults
  //And possibly some extra methods
  var Tool = Component.extend({
    init: function(core, options) {
      // Define default template 
      this.template = this.template || "tools/tool";
      this.profiles = this.profiles || {
        'default': {
          timeslider: true,
          buttonlist: true,
          title: true
        }
      };

      this.model = new ToolModel(options.state, options.data);
      // Same constructor as widgets
      this._super(core, options);
    },

    //Tools renders just like the widgets, but they update the layout
    render: function() {
      var _this = this;
      return this._super(function() {
        _this.layout.setContainer(_this.element);
        _this.layout.setProfile(_this.profiles);
        _this.layout.update();
        //binds resize event to update
        _this.events.bind('resize', function() {
          _this.layout.update();
        });

        _this.model.bind('change:state', function(state) {
            console.log("HELLO WORLD!");
        });

        _this.model.setState({name: "Amir"});

      });
    },

    getInstance: function(manager) {
      // TODO: Figure out a better way to store managers
      return this[manager];
    },

    bind: function(evt, func) {
      this.events.bind(evt, func);
      return this;
    },

    trigger: function(evt) {
      var args = Array.prototype.slice.call(arguments).slice(1);
      this.events.trigger(evt, args);
      return this;
    }
  });

  return Tool;
});
