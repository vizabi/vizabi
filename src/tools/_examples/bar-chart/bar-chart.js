//Bar Chart Tool
define([
    'base/tool'
], function(Tool) {

    var BarChartTool = Tool.extend({

        /**
         * Initializes the tool (Bar Chart Tool).
         * Executed once before any template is rendered.
         * @param {Object} config Initial config, with name and placeholder
         * @param {Object} options Options such as state, data, etc
         */
        init: function(config, options) {

            this.name = "bar-chart";
            this.template = "tools/_examples/" + this.name + "/" + this.name;

            //specifying components
            this.components = [{
                component: '_examples/bar-chart',
                placeholder: '.vzb-tool-viz',
                model: ["state.time", "state.entities", "state.marker", "language"] //pass models to component
            }, {
                component: '_gapminder/buttonlist',
                placeholder: '.vzb-tool-buttonlist',
                model: ['state', 'ui', 'language'],
                buttons: ['fullscreen']
            }, {
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider',
                model: ["state.time"]
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
                                start: 1952,
                                end: 2012,
                                value: 2000,
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
                                            _defs_: "lex"
                                        },
                                        scale: {
                                            _type_: "string",
                                            _defs_: "linear"
                                        }
                                    }
                                },
                                axis_x: {
                                    _type_: "hook",
                                    _defs_: {
                                        use: {
                                            _type_: "string",
                                            _defs_: "property",
                                            _opts_: ["property"]
                                        },
                                        value: {
                                            _type_: "string",
                                            _defs_: "geo.name"
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
                        'vzb-tool-bar-chart': {
                            _type_: "object",
                            _defs_: {}
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
                                    "title": "",
                                    "buttons/expand": "Full screen",
                                    "buttons/unexpand": "Leave full screen",
                                    "buttons/lock": "Lock",
                                    "buttons/find": "Find",
                                    "buttons/colors": "Colors",
                                    "buttons/size": "Size",
                                    "buttons/more_options": "Options",
                                    "indicator/lex": "Life expectancy",
                                    "indicator/gdp_per_cap": "GDP per capita",
                                    "indicator/pop": "Population",
                                    "indicator/geo.region": "Region",
                                    "indicator/geo": "Geo code",
                                    "indicator/time": "",
                                    "indicator/geo.category": "Geo category"
                                }
                            }
                        }
                    }
                }
            };

            //constructor is the same as any tool
            this._super(config, options);
        },

        /**
         * Validating the tool model
         * @param model the current tool model to be validated
         */
        toolModelValidation: function(model) {

            var time = this.model.state.time,
                marker = this.model.state.marker.label;

            //don't validate anything if data hasn't been loaded
            if (!marker.getItems() || marker.getItems().length < 1) {
                return;
            }

            var dateMin = marker.getLimits('time').min,
                dateMax = marker.getLimits('time').max;

            if (time.start < dateMin) {
                time.start = dateMin;
            }
            if (time.end > dateMax) {
                time.end = dateMax;
            }
        }
    });

    return BarChartTool;
});