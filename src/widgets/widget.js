define([
'd3',
'underscore',
'base/class',
'managers/events/events'
], function(d3, _, Class, events) {

var Widget = Class.extend({
    init: function(options) {
      this.name = this.name || options.name;
      this.state = this.state || {};
      this.template = this.template || "widgets/widget";
      this.template_data = this.template_data || {};
      // Markup to define where a Widget is going to be rendered.
      this.placeholder = this.placeholder || null;
      // Element which embodies the Widget
      this.element = this.element || null;
      this.widgets = this.widgets || {};

      this.layout = core.getInstance("layout");
      this.layout.setContainer(this.placeholder);
      this.layout.setProfile(this.profiles);

      this.placeholder = d3.select(this.placeholder);
      this.loadWidgets();
  },

  render: function() {
    var _this = this;
    this.loadTemplate(function()  {
      _this.renderWidgets();

      //TODO: Chance of refactoring
      _this.resize();
      events.bind('resize', function() {
        _this.layout.update();
        _this.resize();
      });
    });
  },

  loadWidgets: function() {
    var _this = this;
    // Loops through widgets, instantiating them. 
    _.each(this.widgets, function(placeholder, widget) {
      var path = "widgets/" + widget + "/" + widget;
      // Loads the file we need
      require([path], function(subwidget) {

        _this.widgets[widget] = new subwidget(_this, {
          name: widget,
          placeholder: placeholder
        });

      });
    });
  },

  renderWidgets: function() {

    //TODO: Make sure the widgets are instantiated

    // Loops through widgets, rendering them. 
    _.each(this.widgets, function(widget) {
      widget.render();
    });
  },

  loadTemplate: function(ready) {
    var _this = this;
    //require the template file
    require(["text!" + this.template + ".html"], function(html) {
      //render template using underscore
      var rendered = _.template(html, _this.template_data);
      //place the contents into the correct placeholder
      _this.placeholder.html(rendered);
      
      if (_.isFunction(ready)) {
        ready(rendered);
      }
    });
  },

  resize: function() {

  }
});


return Widget;
});