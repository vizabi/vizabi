define([
  'd3',
  'underscore',
  'widgets/widget'
], function(d3, _, Widget) {

  //Tool does everything a widget does, but has different defaults
  //And possibly some extra methods
  var Tool = Widget.extend({
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
      // Same constructor as the superclass
      this._super(core, options);

    },

    //Tools renders just like widgets, but they update the layout
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
      });
    }

  });

  return Tool;
});
