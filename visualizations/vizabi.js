define([
  'd3',
  'base/object',
], function(d3, object) {
  var extend = object.extend;

  var template = function(core, options) {
    this.id = (options && options.name) || 'id-undefined';
    this.selector = (options && options.selector) || 'body';

    this.state = {};
    this.language = 'dev';

    // SVG builder
    this.wrapperName = 'vizabi-' + this.id;

    this.container = d3.select(this.selector).append('div')
      .attr('id', this.wrapperName)
      .classed('vizabi', true);

    this.svg = this.container.append('svg');

    // Manager instances, obtained from the core
    this.managers = {
      events: core.getInstance('events'),
      data: core.getInstance('data'),
      layout: core.getInstance('layout'),
      i18n: core.getInstance('i18n')
    };

    // Sets up Managers
    this.managers.layout.setProperties({
      div: this.container,    // d3 object
      svg: this.svg,          // d3 object
      schema: 'desktop',
      defaultMeasures: { width: 900, height: 500 }
    });

    var _this = this;

    this.managers.events.bind('resize', function() {
      _this.managers.layout.update();
    });
  };

  template.prototype = {
    start: function() {
      // returns self
      return this;
    },

    // Ignore
    stop: function() {
      this.managers.events.trigger('vizabi:halt');
      return this;
    },

    // Improve
    destroy: function() {
      d3.select('#' + this.wrapperName).remove();
    },

    getSVG: function() {
      return this.svg;
    },

    getState: function() {
      return this.state;
    },

    setState: function(state) {
      extend(this.state, state);
      this.managers.events.trigger('change:state', this.state);
      return this;
    },

    setLanguage: function(lang) {
      if (!lang) return;  // let it fail silently?
      this.managers.i18n.setLanguage(lang, function(lang) {
        this.managers.events.trigger('change:language', lang);
      });
      return this;
    },

    getLanguage: function() {
      if (this.language) return this.language;
    },

    getLayout: function() {
      return this.layout;
    },

    setLayout: function(layout) {
      if (!layout) return this;   // let it fail silently.
      this.layout = layout;
      this.managers.layout.set(layout);
      return this;
    },

    getInstance: function(name) {
      if (!name) return this.managers;
      if (this.managers[name]) return this.managers[name];
      return null;
    }
  };

  return template;
});
