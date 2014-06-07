define([
  'd3',
  'underscore',
  'components/component'
], function(d3, _, Component) {

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
      this.layout = core.getInstance("layout");

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

        _this.events.bind('change:state', function(state) {
        });

      });
    }

  });

  return Tool;
});
