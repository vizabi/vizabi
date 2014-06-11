define([
  'jquery',
  'd3',
  'underscore',
  'base/utils',
  'base/class'
], function($, d3, _, utils, Class) {

  var Component = Class.extend({
    init: function(core, options) {
      this.name = this.name || options.name;
      this.state = this.state || options.state;
      this.placeholder = this.placeholder || options.placeholder;
      this.data = this.data || options.data;

      this.model = this.model;
      this.element = this.element || null;
      this.core = this.core || core;
      this.template = this.template || "components/component";
      this.template_data = this.template_data || {
        name: this.name
      };
      // Markup to define where a Component is going to be rendered.
      // Element which embodies the Component
      this.element = this.element || null;
      this.components = this.components || {};

      this.profiles = this.profiles || {};
      this.parent = parent;

      this.loading = true;

      this.dataManager = core.getInstance('dataManager');
      this.layout = core.getInstance('layout');
      this.events = core.getInstance('events');
    },

    //TODO: change the scary name! :D bootstrap is one good one
    render: function() {
      var defer = $.Deferred();
      var _this = this;

      // First, we load the template
      var promise = this.loadTemplate();

      // After the template is loaded, check if postRender exists
      promise.then(function() {

        // add css loading class to hide elements
        this.loading = true;
        _this.element.classed("loading", _this.loading);

        // attempt to execute postRender
        return _this.execute(_this.postRender);

      })
      // After postRender, resize and load components
      .then(function() {

        //TODO: Chance of refactoring
        //Every widget binds its resize function to the resize event
        _this.resize();
        _this.core.bind('resize', function() {
          _this.resize();
        });

        return _this.loadComponents();
      })
      // After loading components, render them
      .then(function() {
        return _this.renderComponents();
      })
      // After rendering the components, resolve the defer
      .done(function() {
        //not loading anytmore, remove class
        _this.loading = false;
        _this.element.classed("loading", _this.loading);

        defer.resolve();
      });

      return defer;
    },

    // Execute function if it exists, with promise support
    execute: function(func) {
      var defer = $.Deferred(),
          possiblePromise;

      // only try to execute if it is a function
      if(_.isFunction(func)) {
          possiblePromise = func.apply(this);
      };

      // if a promise is returned, solve it when its done
      if(possiblePromise && _.isFunction(possiblePromise.then)) {
        possiblePromise.done(function(){
          defer.resolve();
        });
      }
      // if no promise is returned, resolve right away
      else {
        defer.resolve();
      }

      return defer;
    },

    loadComponents: function(core) {
      var defer = $.Deferred();
      var defers = [];
      var _this = this;

      // Loops through components, loading them.
      _.each(this.components, function(placeholder, component) {
        var promise = _this.loadComponent(component, placeholder);
        defers.push(promise);
      });

      // When all components have been successfully loaded, resolve the defer
      $.when.apply(null,defers).done(function() {

        //todo: remove comments of simulation
        //setTimeout(function() {
          defer.resolve();
        //}, 1000);
      });

      return defer;
    },

    loadComponent: function(component,placeholder) {
      var _this = this;
      var defer = $.Deferred();
      var path = "components/" + component + "/" + component;

      // Loads the file we need
      require([path], function(subcomponent) {
        _this.components[component] = new subcomponent(_this, {
          name: component,
          placeholder: placeholder,
          state: _this.state,
          data: _this.data
        });

        // Resolve the defer after file has been loaded
        defer.resolve();
      });

      return defer;
    },

    renderComponents: function() {
      var defer = $.Deferred();
      var defers = [];

      // Loops through components, rendering them.
      _.each(this.components, function(component) {
        defers.push(component.render());
      });

      // After all components are rendered, resolve the defer
      $.when.apply(null, defers).done(function() {
        defer.resolve();
      });

      return defer;
    },

    loadTemplate: function() {
      var _this = this;
      var defer = $.Deferred();

      //require the template file
      require(["text!" + this.template + ".html"], function(html) {
        //render template using underscore
        var rendered = _.template(html, _this.template_data);

        //place the contents into the correct placeholder
        _this.placeholder = d3.select(_this.placeholder);
        _this.placeholder.html(rendered);

        //todo: refactor the way we select the first child
        //define this element inside the placeholder
        _this.element = utils.jQueryToD3(
          utils.d3ToJquery(_this.placeholder).children().first()
          );

        //Resolve defer
        defer.resolve();
      });

      return defer;
    },

    parent: function() {
      return this.parent;
    },

    setState: function(state) {
      this.state = _.extend(this.state, state);
      this.events.trigger('change:state', this.state);
      return this;
    },

    resize: function() {
      //what to do when page is resized
    },

    postRender: function() {

    }
  });


  return Component;
});
