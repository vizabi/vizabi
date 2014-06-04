define([
  'd3',
  'base/object',
  'widgets/widget'
], function(d3, object, Widget) {

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

    }

  });

  return Tool;
});
