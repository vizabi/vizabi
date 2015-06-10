/*!
 * VIZABI BUBBLECHART
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) return;


    //BUBBLE CHART TOOL
    Vizabi.Tool.extend('BubbleChart', {

        /**
         * Initializes the tool (Bubble Chart Tool).
         * Executed once before any template is rendered.
         * @param {Object} config Initial config, with name and placeholder
         * @param {Object} options Options such as state, data, etc
         */
        init: function(config, options) {

            this.name = "bubblechart";

            //specifying components
            this.components = [{
                component: 'gapminder-bubblechart',
                placeholder: '.vzb-tool-viz',
                model: ["state.time", "state.entities", "state.marker", "language"] //pass models to component
            }, {
                component: 'gapminder-timeslider',
                placeholder: '.vzb-tool-timeslider',
                model: ["state.time"]
            }, {
                component: 'gapminder-buttonlist',
                placeholder: '.vzb-tool-buttonlist',
                model: ['state', 'ui', 'language']
            }];

            //default options
            this.default_options = {
                state: {
                    time: {
                        start: "1990",
                        end: "2012",
                        value: "2000",
                        step: 1,
                        speed: 300,
                        formatInput: "%Y",
                        round: "ceil",
                        trails: true,
                        lockNonSelected: 0,
                        adaptMinMaxZoom: false
                    },
                    entities: {
                        show: {
                            dim: "geo",
                            filter: {
                                _defs_: {
                                    "geo": ["*"],
                                    "geo.cat": ["country"]
                                }
                            }
                        }
                    },
                    marker: {
                        space: ["entities", "time"],
                        type: "geometry",
                        shape: "circle",
                        label: {
                            use: "property",
                            which: "geo.name"
                        },
                        axis_y: {
                            use: "indicator",
                            which: "lex",
                            scaleType: "linear",
                            unit: "years"
                        },
                        axis_x: {
                            use: "indicator",
                            which: "gdp_per_cap",
                            scaleType: "log",
                            unit: "$/year/person"
                        },
                        color: {
                            use: "property",
                            which: "geo.region",
                            scaleType: "ordinal",
                            unit: ""
                        },
                        size: {
                            use: "indicator",
                            which: "pop",
                            scaleType: "linear",
                            max: 0.75,
                            unit: ""
                        }
                    }
                },
                data: {
                    //reader: "waffle-server",
                    reader: "csv-file",
                    path: "local_data/waffles/{{LANGUAGE}}/basic-indicators.csv"
                },

                ui: {
                    'vzb-tool-bubble-chart': {
                        whenHovering: {
                            showProjectionLineX: true,
                            showProjectionLineY: true,
                            higlightValueX: true,
                            higlightValueY: true
                        },
                        labels: {
                            autoResolveCollisions: true,
                            dragging: true
                        }
                    },
                    buttons: []
                },

                language: {
                    id: "en",
                    strings: {
                        en: {
                            "title": "Bubble Chart Title",
                            "buttons/expand": "Go big",
                            "buttons/unexpand": "Go small",
                            "buttons/trails": "Trails",
                            "buttons/lock": "Lock",
                            "buttons/find": "Find",
                            "buttons/deselect": "Deselect",
                            "buttons/ok": "OK",
                            "buttons/colors": "Colors",
                            "buttons/size": "Size",
                            "buttons/axes": "Axes",
                            "buttons/more_options": "Options",
                            "indicator/lex": "Life expectancy",
                            "indicator/gdp_per_cap": "GDP per capita",
                            "indicator/pop": "Population",
                            "indicator/geo.region": "Region",
                            "indicator/geo": "Geo code",
                            "indicator/time": "Time",
                            "indicator/geo.category": "Geo category",
                            "scaletype/linear": "Linear",
                            "scaletype/log": "Logarithmic",
                            "scaletype/genericLog": "Generic log",
                            "scaletype/time": "Time",
                            "scaletype/ordinal": "Ordinal",
                            "color/geo.region/asi": "Asia",
                            "color/geo.region/eur": "Europe",
                            "color/geo.region/ame": "Americas",
                            "color/geo.region/afr": "Afrika",
                            "color/geo.region/_default": "Other"
                        }
                    }
                }
            };


            this._super(config, options);

        },


        /**
         * Validating the tool model
         * @param model the current tool model to be validated
         */
        validate: function(model) {

            model = this.model || model;

            var time = model.state.time;
            var marker = model.state.marker.label;

            //don't validate anything if data hasn't been loaded
            if (!marker.getItems() || marker.getItems().length < 1) return;

            var dateMin = marker.getLimits(time.getDimension()).min;
            var dateMax = marker.getLimits(time.getDimension()).max;

            if (time.start < dateMin) {
                time.start = dateMin;
            }
            if (time.end > dateMax) {
                time.end = dateMax;
            }
        }
    });


}).call(this);
