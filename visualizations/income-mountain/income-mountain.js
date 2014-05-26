define([
    'd3',
    'vizabi.base.object',
    'vizabi.base.svg.rectBox',
    'vizabi.tools.scale',
    'vizabi.widgets.mountains',
    'vizabi.widgets.axis',
    'vizabi.visualizations.income-mountain.data-helper'
], function(d3, object, RectBox, Scale, Mountains, Axis, DataHelper) {
    var extend = object.extend;

    var template = function(core, options) {
        this.id = options.id || 'id-undefined';
        this.selector = options.selector || 'body';

        // The visualization *state*. This contains the properties of the
        // visualization that is being displayed to the user.
        this.state = {
            year: 1800,
            geo: [],
            stack: false
        };

        // The language of this visualization (*strongly suggested to exist*)
        this.language = 'dev';

        // SVG builder
        this.wrapperName = 'vizabi-bare-minimum-' + this.id;

        this.container = d3.select(this.selector).append('div')
            .attr('id', this.wrapperName)
            .attr('class', 'vizabi');

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
            hScale: new Scale({
                type: 'log',
                valueStart: 182.5,
                valueEnd: 182000,
                rangeStart: 0,
                rangeEnd: 880
            })
        };

        // aliases
        var translate = this.instances.i18n.translate;

        // Widgets that are used by the visualization. On this template,
        // we load the 'text' and the axis Widgets.
        this.widgets = {
            header1: new Text(this, {
                text: translate('viz-im', 'People by Income'),
                cssClass: 
            })
            mountains: new Mountains(this, {
                scale: this.tools.hScale
            }),

            axis: new Axis(this, this.tools.hScale, {
                values: [365, 3650, 36500],
                tickFormat: function(d) { return '$' + d + '/day'; },
            })
        };
    };

    template.prototype = {
        start: function() {
            // Rectboxes
            var axisRectBox = new RectBox(this.widgets.axis.getGroup());
            var mountainRectBox =
                new RectBox(this.widgets.mountains.getGroup());

            // Layout positioning for the layout manager
            this.layout = {
                desktop: {
                    axis: {
                        render: this.widgets.axis.render,
                        rectBox: axisRectBox,
                        bottom: {
                            parent: 'stage',
                            anchor: 'height',
                            padding: -5
                        },
                        left: 0,
                        right: {
                            parent: 'stage',
                            anchor: 'width',
                            padding: -5
                        }
                    },

                    mountains: {
                        render: this.widgets.mountains.render,
                        rectBox: mountainRectBox,
                        top: 0,
                        bottom: {
                            parent: 'axis',
                            anchor: 'top'
                        },
                        left: {
                            parent: 'axis',
                            anchor: 'left'
                        },
                        right: {
                            parent: 'axis',
                            anchor: 'right'
                        }
                    }
                }
            };

            // Set the layout
            this.setLayout(this.layout);

            // Start Widgets
            this.widgets.axis.start();
            this.widgets.mountains.start();

            // Bindings
            var _this = this;

            // set mountain data
            this.instances.data.getIMShapes({
                item: 'WORLD',
                start: 2000,
                end: 2000
            }, function(json) {
                _this.widgets.mountains.setData([{
                    id: 'WORLD',
                    color: 'orange',
                    data: json['world']['2000']
                }]);
                _this.widgets.mountains.render();
            });

            this.instances.events.bind('change:state', function(state) {
                
            });

            this.instances.events.bind('change:language', function(lang) {
                
            });

            window.addEventListener('resize', function() {
                _this.instances.layout.update();
            });

            // Runs first layout manager update
            this.instances.layout.update();

            // returns self
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
