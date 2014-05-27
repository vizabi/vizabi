define([
    'd3',
    'vizabi.base.object',
    'vizabi.base.svg.rectBox'
], function(d3, object, RectBox) {
    var extend = object.extend;

    var template = function(core, options) {
        this.id = options.id || 'id-undefined';
        this.selector = options.selector || 'body';

        // The visualization *state*. This contains the properties of the
        // visualization that is being displayed to the user.
        this.state = {

        };

        // The language of this visualization (*strongly suggested to exist*)
        this.language = 'dev';

        // SVG builder
        this.wrapperName = 'vizabi-bare-minimum-' + this.id;

        this.container = d3.select(this.selector).append('div')
            .attr('id', this.wrapperName)
            .attr('class', 'bare-minimum');

        this.svg = d3.select('#' + this.wrapperName).append('svg')
            .attr('class', 'bare-minimum');

        // Manager instances, obtained from the core
        this.instances = {
            events: core.getInstance('events'),
            data: core.getInstance('data'),
            layout: core.getInstance('layout'),
            i18n: core.getInstance('i18n')
        };

        // Sets up Managers
        this.instances.layout.setProperties({
            div: this.container,    // d3 object
            svg: this.svg,          // d3 object
            schema: 'desktop',
            defaultMeasures: { width: 900, height: 500 }
        });

        // Tools are used by widgets
        this.tools = {

        };

        // Widgets that are used by the visualization. On this template,
        // we load the 'text' and the axis Widgets.
        this.widgets = {
            
        };
    };

    template.prototype = {
        start: function() {
            // Layout positioning for the layout manager
            this.layout = {
                desktop: {
                    
                }
            };

            // Set the layout
            this.setLayout(this.layout);

            // Build tools if necessary
            //this.tools.TOOL.build();
            
            // Start Widgets
            //this.widgets.WIDGET.start();

            // Bindings
            var _this = this;

            this.instances.events.bind('change:state', function(state) {
                
            });

            this.instances.events.bind('change:language', function(lang) {
                
            });

            this.instances.events.bind('resize', function() {
                _this.instances.layout.update();
            });

            // Run the layout manager for the first time
            this.instances.layout.update();

            // returns self

            console.log('este carro esta sendo roubado');
            return this;
        },

        // Ignore
        stop: function() {
            this.instances.events.trigger('interactive:halt');
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
            this.instances.events.trigger('change:state', this.state);
            return this;
        },

        setLanguage: function(lang) {
            if (!lang) return;  // let it fail silently?
            this.instances.i18n.setLanguage(lang, function(lang) {
                this.instances.events.trigger('change:language', lang);
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
            this.instances.layout.set(layout);
            return this;
        },

        getInstance: function(name) {
            if (name === 'events') {
                return this.instances.events;
            } else if (name === 'data') {
                return this.instances.data;
            } else if (name === 'layout') {
                return this.instances.layout;
            } else if (name === 'i18n') {
                return this.instances.i18n;
            } else {
                return this.instances;
            }
        },

        getProperties: function() {
            return { tools: this.tools, widgets: this.widgets };
        },

        setProperties: function(properties) {
            if (!properties) return this;   // let it fail silently?!
            
            // extend property by property
            if (properties.tools) extend(this.tools, properties.tools);
            if (properties.widgets) extend(this.widgets, properties.widgets);

            // Add whatever other conditions you want to set

            return this;
        }
    };

    return template;
});
