define([
'd3',
'underscore',
'base/class',
'managers/events/events'
], function(d3, _, Class, events) {

var Widget = Class.extend({
    init: function(core, options) {
      this.name = this.name || options.name;
      this.state = this.state || options.state;
      this.placeholder = this.placeholder || options.placeholder;
      
      this.template = this.template || "widgets/widget";
      this.template_data = this.template_data || {};
      // Markup to define where a Widget is going to be rendered.
      // Element which embodies the Widget
      this.element = this.element || null;
      this.widgets = this.widgets || {};

      this.layout = core.getInstance("layout");
      this.layout.setContainer(this.placeholder);
      this.layout.setProfile(this.profiles);

      this.events = core.getInstance('events');
      this.loadWidgets(core);
  },

  render: function() {
    var _this = this;
    this.loadTemplate(function()  {
      
      _this.postRender();

      _this.renderWidgets();

      //TODO: Chance of refactoring
      _this.resize();
      events.bind('resize', function() {
        _this.layout.update();
        _this.resize();
      });
    });
  },

  //TODO: 
  postRender: function() {
    console.log("This comes after you load the template");
  },

  loadWidgets: function(core) {
    var _this = this;
    // Loops through widgets, instantiating them. 
    _.each(this.widgets, function(placeholder, widget) {
      var path = "widgets/" + widget + "/" + widget;
      // Loads the file we need
      require([path], function(subwidget) {

        _this.widgets[widget] = new subwidget(core, {
          name: widget,
          placeholder: placeholder,
          state: _this.state
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
      _this.placeholder = d3.select(_this.placeholder);
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