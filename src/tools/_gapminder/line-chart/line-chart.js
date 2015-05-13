define([
    'base/tool'
], function(Tool) {

    var lineChart = Tool.extend({
        /**
         * Initialized the tool
         * @param config tool configurations, such as placeholder div
         * @param options tool options, such as state, data, etc
         */
        init: function(config, options) {

            this.name = 'line-chart';
            this.template = "tools/_gapminder/line-chart/line-chart";

            this.components = [{
                component: '_gapminder/line-chart',
                placeholder: '.vzb-tool-stage',
                model: ["state.time", "state.entities", "state.marker", "language"]
            }, {
                component: '_gapminder/buttonlist',
                placeholder: '.vzb-tool-buttonlist',
                model: ["state", "ui", 'language'],
                buttons: ['fullscreen', 'colors']
            }];

            //default options
            this.default_options = {
                state: {
                    _type_: "model",
                    _defs_: {
                        //timespan of the visualization
                        time: {
                            _type_: "model",
                            _defs_: {
                                start: 1990,
                                end: 2012,
                                value: 2012,
                                step: 1,
                                speed: 300,
                                formatInput: "%Y"
                            }
                        },
                        //entities we want to show
                        entities: {
                            _type_: "model",
                            _defs_: {
                                show: {
                                    _type_: "model",
                                    _defs_: {
                                        dim: {
                                            _type_: "string",
                                            _defs_: "geo"
                                        },
                                        filter: {
                                            _type_: "object",
                                            _defs_: {
                                                "geo": ["*"],
                                                "geo.category": ["region"]
                                            }
                                        }
                                    }
                                }
                            }
                        },

                        //how we show it
                        marker: {
                            _type_: "model",
                            _defs_: {
                                dimensions: {
                                    _type_: "array",
                                    _defs_: ["entities", "time"]
                                },
                                label: {
                                    _type_: "hook",
                                    _defs_: {
                                        use: {
                                            _type_: "string",
                                            _defs_: "property",
                                            _opts_: ["property", "indicator", "value"]
                                        },
                                        value: {
                                            _type_: "string",
                                            _defs_: "geo.name"
                                        }
                                    }
                                },
                                axis_y: {
                                    _type_: "hook",
                                    _defs_: {
                                        use: {
                                            _type_: "string",
                                            _defs_: "indicator"
                                        },
                                        value: {
                                            _type_: "string",
                                            _defs_: "gdp_per_cap"
                                        },
                                        scale: {
                                            _type_: "string",
                                            _defs_: "log"
                                        }
                                    }
                                },
                                axis_x: {
                                    _type_: "hook",
                                    _defs_: {
                                        use: {
                                            _type_: "string",
                                            _defs_: "indicator"
                                        },
                                        value: {
                                            _type_: "string",
                                            _defs_: "time"
                                        },
                                        scale: {
                                            _type_: "string",
                                            _defs_: "time"
                                        }
                                    }
                                },
                                color: {
                                    _type_: "hook",
                                    _defs_: {
                                        use: {
                                            _type_: "string",
                                            _defs_: "property"
                                        },
                                        value: {
                                            _type_: "string",
                                            _defs_: "geo.region"
                                        },
                                        domain: {
                                            _type_: "object",
                                            _defs_: {
                                                "_default": "#ffb600",
                                                "world": "#ffb600",
                                                "eur": "#FFE700",
                                                "afr": "#00D5E9",
                                                "asi": "#FF5872",
                                                "ame": "#7FEB00"
                                            }
                                        },
                                        domain_type: {
                                            _type_: "string",
                                            _defs_: "continuous"
                                        }
                                    }
                                },
                                color_shadow: {
                                    _type_: "hook",
                                    _defs_: {
                                        use: {
                                            _type_: "string",
                                            _defs_: "property"
                                        },
                                        value: {
                                            _type_: "string",
                                            _defs_: "geo.region"
                                        },
                                        domain: {
                                            _type_: "object",
                                            _defs_: {
                                                "_default": "#fbbd00",
                                                "world": "#fb6d19",
                                                "eur": "#fbaf09",
                                                "afr": "#0098df",
                                                "asi": "#da0025",
                                                "ame": "#00b900"
                                            }
                                        },
                                        domain_type: {
                                            _type_: "string",
                                            _defs_: "continuous"
                                        }
                                    }
                                }
                            }
                        }

                    }
                },

                data: {
                    _type_: "model",
                    _defs_: {
                        reader: {
                            _type_: "string",
                            _defs_: "waffle-server"
                        }
                    }
                },

                ui: {
                    _type_: "model",
                    _defs_: {
                        'vzb-tool-line-chart': {
                            _type_: "object",
                            _defs_: {
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
                            }
                        }
                    }
                },

                //language properties
                language: {
                    _type_: "model",
                    _defs_: {
                        id: {
                            _type_: "string",
                            _defs_: "en"
                        },
                        strings: {
                            _type_: "object",
                            _defs_: {
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
                    }
                }
            };

            this._super(config, options);
        },

        /**
         * Validating the tool model
         */
        validate: function() {

            var state = this.model.state;
            var data = this.model.data;

            //don't validate anything if data hasn't been loaded
            if (!data.getItems() || data.getItems().length < 1) {
                return;
            }

            var dateMin = data.getLimits('time').min,
                dateMax = data.getLimits('time').max;

            if (state.time.start < dateMin) {
                state.time.start = dateMin;
            }
            if (state.time.end > dateMax) {
                state.time.end = dateMax;
            }
        }

    });

    return lineChart;
});