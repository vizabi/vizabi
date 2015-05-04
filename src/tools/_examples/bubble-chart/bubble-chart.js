define([
    'lodash',
    'd3',
    'base/tool'
], function(_, d3, Tool) {

    var bubbleChart = Tool.extend({
        /**
         * Initialized the tool
         * @param config tool configurations, such as placeholder div
         * @param options tool options, such as state, data, etc
         */
        init: function(config, options) {

            this.name = 'bubble-chart';
            this.template = "tools/_examples/bubble-chart/bubble-chart";

            //instantiating components
            this.components = [{
                component: '_examples/bubble-chart',
                placeholder: '.vzb-tool-viz', //div to render
                model: ["state.time", "state.entities", "state.marker", "language"]
            }, {
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider', //div to render
                model: ["state.time"]
            }, {
                component: '_gapminder/buttonlist',
                placeholder: '.vzb-tool-buttonlist',
                model: ['state', 'ui', 'language'],
                buttons: ['fullscreen', 'find', 'size', 'trails', 'lock', 'colors']
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
                                round: "ceil",
                                formatInput: "%Y",
                                trails: true,
                                lockNonSelected: 0
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
                                            _defs_: "geo",
                                        },
                                        filter: {
                                            _type_: "object",
                                            _defs_: {
                                                "geo": ["afg", "alb", "dza", "ago", "atg", "arg", "arm", "abw", "aus", "aut", "aze", "bhs", "bhr", "bgd", "brb", "blr", "bel", "blz", "ben", "btn", "bol", "bih", "bwa", "bra", "chn", "brn", "bgr", "bfa", "bdi", "khm", "cmr", "can", "cpv", "caf", "tcd", "_cis", "chl", "col", "com", "cod", "cog", "cri", "civ", "hrv", "cub", "cyp", "cze", "dnk", "dji", "dom", "ecu", "egy", "slv", "gnq", "eri", "est", "eth", "fji", "fin", "fra", "guf", "pyf", "gab", "gmb", "geo", "deu", "gha", "grc", "grd", "glp", "gum", "gtm", "gin", "gnb", "guy", "hti", "hnd", "hkg", "hun", "isl", "ind", "idn", "irn", "irq", "irl", "isr", "ita", "jam", "jpn", "jor", "kaz", "ken", "kir", "prk", "kor", "kwt", "kgz", "lao", "lva", "lbn", "lso", "lbr", "lby", "ltu", "lux", "mac", "mkd", "mdg", "mwi", "mys", "mdv", "mli", "mlt", "mtq", "mrt", "mus", "myt", "mex", "fsm", "mda", "mng", "mne", "mar", "moz", "mmr", "nam", "npl", "nld", "ant", "ncl", "nzl", "nic", "ner", "nga", "nor", "omn", "pak", "pan", "png", "pry", "per", "phl", "pol", "prt", "pri", "qat", "reu", "rou", "rus", "rwa", "lca", "vct", "wsm", "stp", "sau", "sen", "srb", "syc", "sle", "sgp", "svk", "svn", "slb", "som", "zaf", "sds", "esp", "lka", "sdn", "sur", "swz", "swe", "che", "syr", "twn", "tjk", "tza", "tha", "tls", "tgo", "ton", "tto", "tun", "tur", "tkm", "uga", "ukr", "are", "gbr", "usa", "ury", "uzb", "vut", "ven", "pse", "esh", "vnm", "vir", "yem", "zmb", "zwe"],
                                                "geo.category": ["country"]
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
                                type: "geometry",
                                shape: "circle",
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
                                            _defs_: "indicator",
                                            _opts_: ["property", "indicator", "value"]
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
                                            _defs_: "indicator",
                                            _opts_: ["property", "indicator", "value"]
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
                                size: {
                                    _type_: "hook",
                                    _defs_: {
                                        use: {
                                            _type_: "string",
                                            _defs_: "indicator",
                                            _opts_: ["property", "indicator", "value"]
                                        },
                                        value: {
                                            _type_: "string",
                                            _defs_: "pop"
                                        },
                                        scale: {
                                            _type_: "string",
                                            _defs_: "linear"
                                        },
                                        max: {
                                            _type_: "number",
                                            _defs_: 0.75
                                        }
                                    }
                                },
                                color: {
                                    _type_: "hook",
                                    _defs_: {
                                        use: {
                                            _type_: "string",
                                            _defs_: "property",
                                            _opts_: ["property", "indicator", "value"]
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
//                        reader: {
//                            _type_: "string",
//                            _defs_: "local-json"
//                        },
//                        path: {
//                            _type_: "string",
//                            _defs_: "../../local_data/waffles/{{LANGUAGE}}/basic-indicators.json"
//                        }
                    }
                },

                ui: {
                    _type_: "model",
                    _defs_: {
                        'vzb-tool-bar-chart': {
                            _type_: "object",
                            _defs_: {
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
                                    "title": "Bubble Chart Title",
                                    "buttons/expand": "Go big",
                                    "buttons/unexpand": "Go small",
                                    "buttons/trails": "Trails",
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

            this._super(config, options);

        },

        /**
         * Validating the tool model
         */
        validate: function() {

            var time = this.model.state.time,
                markers = this.model.state.marker.label;

            //don't validate anything if data hasn't been loaded
            if (!markers.getItems() || markers.getItems().length < 1) {
                return;
            }

            var dateMin = markers.getLimits('time').min,
                dateMax = markers.getLimits('time').max;

            if (time.start < dateMin) {
                time.start = dateMin;
            }
            if (time.end > dateMax) {
                time.end = dateMax;
            }

        }
    });

    return bubbleChart;
});