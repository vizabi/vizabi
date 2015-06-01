
/*!
 * VIZABI LINECHART
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) return;


    //LINE CHART TOOL
    Vizabi.Tool.extend('LineChart', {
        /**
         * Initialized the tool
         * @param config tool configurations, such as placeholder div
         * @param options tool options, such as state, data, etc
         */
        init: function(config, options) {

            this.name = 'linechart';

            this.components = [{
                component: 'gapminder-linechart',
                placeholder: '.vzb-tool-viz',
                model: ["state.time", "state.entities", "state.marker", "language"] //pass models to component
            }, {
                component: 'gapminder-timeslider',
                placeholder: '.vzb-tool-timeslider',
                model: ["state.time"],
                ui: {show_value_when_drag_play: false, axis_aligned: true}
            }, {
                component: 'gapminder-buttonlist',
                placeholder: '.vzb-tool-buttonlist',
                model: ['state', 'ui', 'language']
            }];

            //default options
            this.default_options = {
                state: {
                    time: {
                        start: 1990,
                        end: 2012,
                        value: 2012,
                        step: 1,
                        speed: 300,
                        formatInput: "%Y"
                    },
                    //entities we want to show
                    entities: {
                        show: {
                            dim: "geo",
                            filter: {
                                "geo": ["*"],
                                "geo.cat": ["region"]
                            }

                        }
                    },
                    //how we show it
                    marker: {
                        dimensions: ["entities", "time"],
                        label: {
                            use: "property",
                            which: "geo.name"
                        },
                        axis_y: {
                            use: "indicator",
                            which: "gdp_per_cap",
                            scaleType: "log"
                        },
                        axis_x: {
                            use: "indicator",
                            which: "time",
                            scaleType: "time"
                        },
                        color: {
                            use: "property",
                            which: "geo.region",
                            palette: {
                                "_default": "#ffb600",
                                "eur": "#FFE700",
                                "afr": "#00D5E9",
                                "asi": "#FF5872",
                                "ame": "#7FEB00"
                            }
                        },
                        color_shadow: {
                            use: "property",
                            which: "geo.region",
                            palette: {
                                "_default": "#fbbd00",
                                "eur": "#fbaf09",
                                "afr": "#0098df",
                                "asi": "#da0025",
                                "ame": "#00b900"
                            }
                        }
                    }
                },

                data: {
                    //reader: "waffle-server",
                    reader: "local-json",
                    path: "local_data/waffles/{{LANGUAGE}}/basic-indicators.json"
                },

                ui: {
                    'vzb-tool-line-chart': {
                       entity_labels: {
                            min_number_of_entities_when_values_hide: 2 //values hide when showing 2 entities or more
                        },
                        whenHovering: {
                            hideVerticalNow: 0,
                            showProjectionLineX: true,
                            showProjectionLineY: true,
                            higlightValueX: true,
                            higlightValueY: true,
                            showTooltip: 0
                        }
                    },
                    buttons: ['fullscreen']
                },

                //language properties
                language: {
                    id: "en",
                    strings: {
                        en: {
                            "title": "Line Chart Title",
                            "buttons/find": "Find",
                            "buttons/expand": "Expand",
                            "buttons/colors": "Colors",
                            "buttons/size": "Size",
                            "buttons/more_options": "Options",
                            "indicator/lex": "Life expectancy",
                            "indicator/gdp_per_cap": "GDP per capita",
                            "indicator/pop": "Population",
                        },
                        pt: {
                            "title": "Título do Linulaula Chart",
                            "buttons/expand": "Expandir",
                            "buttons/find": "Encontre",
                            "buttons/colors": "Cores",
                            "buttons/size": "Tamanho",
                            "buttons/more_options": "Opções",
                            "indicator/lex": "Expectables Livappulo",
                            "indicator/gdp_per_cap": "PIB pers capitous",
                            "indicator/pop": "Peoples",
                        }
                    }
                }
            };

            this._super(config, options);
        },

        /**
         * Validating the tool model
         */
        validate: function(model) {
            
            model = this.model || model;

            var time = model.state.time;
            var marker = model.state.marker.label;

            //don't validate anything if data hasn't been loaded
            if (!marker.getItems() || marker.getItems().length < 1) return;

            var dateMin = marker.getLimits('time').min;
            var dateMax = marker.getLimits('time').max;

            if (time.start < dateMin) {
                time.start = dateMin;
            }
            if (time.end > dateMax) {
                time.end = dateMax;
            }
        }

    });

}).call(this);