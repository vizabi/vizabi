define([
    'd3',
    'vizabi.base.object',
    'vizabi.base.svg.rectBox',
    'vizabi.widgets.text',
], function(d3, object, RectBox, TextWidget) {
    var extend = object.extend;

    var template = function(core, options) {
        this.id = options.id || 'id-undefined';
        this.selector = options.selector || 'body';

        // The visualization *state*. This contains the properties of the
        // visualization that is being displayed to the user.
        this.state = {
            startYear: 1800,
            endYear: 2100,
            year: 1988
        };

        // SVG builder
        this.wrapperName = 'vizabi-template-' + this.id;

        this.container = d3.select(this.selector).append('div')
            .attr('id', this.wrapperName)
            .attr('class', 'vizabi');

        this.svg = d3.select('#' + this.wrapperName).append('svg')
            .attr('class', 'template');

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

        // Widgets that are used by the visualization. On this template,
        // we load the 'text' and the axis Widgets.
        this.widgets = {
            header1: new TextWidget(this, {
                    text: ('year:' +
                        this.state.year),
                    id: 'headerLeft',
                    eventId: 'change:language',
                    cssClass: 'header1'
                }),

            header2: new TextWidget(this, {
                    text: ('year+1:' + (this.state.year + 1)),
                    id: 'headerRight',
                    eventId: 'change:language',
                    cssClass: 'header2'
                }),
        };
    };

    template.prototype = {
        start: function() {
            // Layout positioning for the layout manager
            this.layout = {
                desktop: {
                    header1: {
                        rectBox: new RectBox(this.widgets.header1.getGroup()),
                        top: '10',
                        left: '10'
                    },

                    header2: {
                        rectBox: new RectBox(this.widgets.header2.getGroup()),
                        top: {
                            parent: 'header1',
                            anchor: 'bottom'
                        },
                        left: {
                            parent: 'header1',
                            anchor: 'left'
                        }
                    }
                },

                mobile: {
                    header: {
                        g: new RectBox(this.widgets.header1.getGroup()),
                        top: '5',
                        left: '5'
                    },

                    axisUnderHeader: {
                        g: new RectBox(this.widgets.header2.getGroup()),
                        top: ['header.top'],
                        left: ['header.right']
                    }
                }
            };

            this.instances.layout.set(this.layout);

            // Build/Start Widgets
            this.widgets.header1.start();
            this.widgets.header2.start();

            // Bindings
            var _this = this;

            this.instances.events.bind('change:state', function(state) {
                console.log('STATE CHANGE')
                // The year might have changed; therefore, we must update
                // the text widgets
                _this.widgets.header1.set({
                    text: (_this.instances.i18n.translate('template', 'year:') +
                        _this.state.year)
                });

                _this.widgets.header2.set({
                    text: (_this.instances.i18n.translate('template',
                        'year+1:') + (_this.state.year + 1))
                });
            });

            this.instances.events.bind('change:language', function(lang) {
                // The language changed -- translation must happen
                _this.widgets.header1.set({
                    text: (_this.instances.i18n.translate('template', 'year:') +
                        _this.state.year)
                });

                _this.widgets.header2.set({
                    text: (_this.instances.i18n.translate('template',
                        'year+1:') + (_this.state.year + 1))
                });
            });

            window.addEventListener('resize', function() {
                _this.instances.layout.update();
            });

            // Runs first layout manager update
            this.instances.layout.update();

            // returns self
            return this;
        },

        stop: function() {
            this.instances.events.trigger('interactive:halt');
            return this;
        },

        remove: function() {
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
            this.instances.i18n.setLanguage(lang, function(lang) {
                this.instances.events.trigger('change:language', lang);
            });
            return this;
        },

        getLayout: function() {
            return this.layout;
        },

        setLayout: function(layout) {
            this.layout = layout;
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
            }
        }
    };

    return template;
});
