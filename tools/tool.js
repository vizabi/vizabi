define([
  'd3',
  'base/object',
  'widgets/widget'
], function(d3, object, Widget) {

  var Tool = Widget.extend({
    init: function(core, options) {
      // Define default template 
      this.template = this.template || "tools/tool";
      // Same constructor as the superclass

      this._super(options);
    }
  });

  return Tool;
});
