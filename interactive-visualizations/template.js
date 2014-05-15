define([
    'd3',
    'vizabi.base.object',
    'vizabi.base.svg.rectBox',
    'vizabi.tools.scale',
    'vizabi.widgets.text',
    'vizabi.widgets.axis',
    'vizabi.widgets.rectangle'
], function(d3, object, RectBox, Scale, TextWidget, AxisWidget, RectWidget) {
    var extend = object.extend;

    var template = function(core, options) {
        var _this = this;

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

        // Setting up the scales        
        this.verticalScale = new Scale({
            type: 'linear',
            valueStart: 600,
            valueEnd: 0,
            rangeStart: 0,
            rangeEnd: 600
        });

        this.horizontalScale = new Scale({
            type: 'linear',
            valueStart: 0,
            valueEnd: 600,
            rangeStart: 0,
            rangeEnd: 600 
        });

        // Alias for i18n.translate
        var i18nTranslate = this.instances.i18n.translate;

        // Functions for repeated use of the strings...
        this.strings = {
            header1: function() {
                return i18nTranslate('template', 'Bar chart');
            },
            header2: function() {
                return i18nTranslate('template', 'For one year',
                    'For %d years', _this.state.year);
            }
        }

        // Widgets that are used by the visualization. On this template,
        // we load the 'text' and the axis Widgets.
        this.widgets = {
            header1: new TextWidget(this, {
                text: this.strings.header1(),
                id: 'headerLeft',
                eventId: 'change:language',
                cssClass: 'header1'
            }),

            header2: new TextWidget(this, {
                text: this.strings.header2(),
                id: 'headerRight',
                eventId: 'change:language',
                cssClass: 'header2'
            }),

            vertical: new AxisWidget(this, this.verticalScale, {
                orientation: 'left',
                values: [100, 300, 500],
                tickFormat: function(d) { return d; },
                cssClass: 'vertical'
            }),

            horizontal: new AxisWidget(this, this.horizontalScale, {
                orientation: 'bottom',
                values: [50, 150, 250, 350, 450, 550],
                tickFormat: function(d) { return d; },
                cssClass: 'horizontal'
            }),

            rectangle: new RectWidget(this, undefined, this.verticalScale,
                this.horizontalScale)
        };
    };

    template.prototype = {
        start: function() {
            // Sets the data.
            // Mock data. The real data should come via the Data Manager
            this.widgets.rectangle.setData([/*{}])*/
                { x: 30, height: 200 },
                { x: 90, height: 300 },
                { x: 150, height: 100 },
                { x: 210, height: 500 },
                { x: 270, height: 250 },
                { x: 350, height: 350 },
                { x: 390, height: 550 },
                { x: 450, height: 450 },
                { x: 510, height: 210 },
                { x: 560, height: 110 }
            ]);

            // Build/Start Widgets
            this.widgets.header1.start();
            this.widgets.header2.start();
            this.widgets.vertical.start();
            this.widgets.horizontal.start();
            this.widgets.rectangle.start();

            // RectBox(es) for widgets
            var header1rb = new RectBox(this.widgets.header1.getGroup());
            var header2rb = new RectBox(this.widgets.header2.getGroup());
            var yAxisrb = new RectBox(this.widgets.vertical.getGroup());
            var xAxisrb = new RectBox(this.widgets.horizontal.getGroup());
            var rectrb = new RectBox(this.widgets.rectangle.getGroup());

            // Alias for axis render functions
            var yAxisRender = this.widgets.vertical.render;
            var xAxisRender = this.widgets.horizontal.render;
            var rectRender = this.widgets.rectangle.render;

            // Layout positioning for the layout manager
            this.layout = {
                desktop: {
                    header1: {
                        rectBox: header1rb,
                        top: '10',
                        left: '10'
                    },

                    header2: {
                        rectBox: header2rb,
                        top: {
                            parent: 'header1',
                            anchor: 'bottom'
                        },
                        left: {
                            parent: 'header1',
                            anchor: 'left'
                        }
                    },

                    vertical: {
                        rectBox: yAxisrb,
                        render: yAxisRender,
                        top: {
                            parent: 'header2',
                            anchor: 'bottom'
                        },
                        bottom: {
                            parent: 'stage',
                            anchor: 'height',
                            padding: -30
                        },
                        left: {
                            parent: 'header2',
                            anchor: 'left'
                        }
                    },

                    horizontal: {
                        rectBox: xAxisrb,
                        render: xAxisRender,
                        top: {
                            parent: 'vertical',
                            anchor: 'bottom'
                        },
                        left: {
                            parent: 'vertical',
                            anchor: 'right'
                        },
                        right: {
                            parent: 'stage',
                            anchor: 'width',
                            padding: -60
                        }
                    },

                    rectangle: {
                        rectBox: rectrb,
                        render: rectRender,
                        top: {
                            parent: 'vertical',
                            anchor: 'top'
                        },
                        bottom: {
                            parent: 'vertical',
                            anchor: 'bottom'
                        },
                        left: {
                            parent: 'horizontal',
                            anchor: 'left'
                        },
                        right: {
                            parent: 'horizontal',
                            anchor: 'right'
                        }
                    }
                }
            };

            this.instances.layout.set(this.layout);

            // Bindings
            var _this = this;

            this.instances.events.bind('change:state', function(state) {

            });

            this.instances.events.bind('change:language', function(lang) {
                this.widgets.header1.text(this.strings.header1());
                this.widgets.header2.text(this.strings.header2());
            });

            this.instances.events.bind('resize', function() {
                _this.instances.layout.update();
            })

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
