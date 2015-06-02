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
                                    "geo": ["afg", "alb", "dza", "ago", "atg", "arg", "arm", "abw", "aus", "aut", "aze", "bhs", "bhr", "bgd", "brb", "blr", "bel", "blz", "ben", "btn", "bol", "bih", "bwa", "bra", "chn", "brn", "bgr", "bfa", "bdi", "khm", "cmr", "can", "cpv", "caf", "tcd", "_cis", "chl", "col", "com", "cod", "cog", "cri", "civ", "hrv", "cub", "cyp", "cze", "dnk", "dji", "dom", "ecu", "egy", "slv", "gnq", "eri", "est", "eth", "fji", "fin", "fra", "guf", "pyf", "gab", "gmb", "geo", "deu", "gha", "grc", "grd", "glp", "gum", "gtm", "gin", "gnb", "guy", "hti", "hnd", "hkg", "hun", "isl", "ind", "idn", "irn", "irq", "irl", "isr", "ita", "jam", "jpn", "jor", "kaz", "ken", "kir", "prk", "kor", "kwt", "kgz", "lao", "lva", "lbn", "lso", "lbr", "lby", "ltu", "lux", "mac", "mkd", "mdg", "mwi", "mys", "mdv", "mli", "mlt", "mtq", "mrt", "mus", "myt", "mex", "fsm", "mda", "mng", "mne", "mar", "moz", "mmr", "nam", "npl", "nld", "ant", "ncl", "nzl", "nic", "ner", "nga", "nor", "omn", "pak", "pan", "png", "pry", "per", "phl", "pol", "prt", "pri", "qat", "reu", "rou", "rus", "rwa", "lca", "vct", "wsm", "stp", "sau", "sen", "srb", "syc", "sle", "sgp", "svk", "svn", "slb", "som", "zaf", "sds", "esp", "lka", "sdn", "sur", "swz", "swe", "che", "syr", "twn", "tjk", "tza", "tha", "tls", "tgo", "ton", "tto", "tun", "tur", "tkm", "uga", "ukr", "are", "gbr", "usa", "ury", "uzb", "vut", "ven", "pse", "esh", "vnm", "vir", "yem", "zmb", "zwe"],
                                    "geo.cat": ["country"]
                                }
                            }
                        }
                    },
                    marker: {
                        dimensions: ["entities", "time"],
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
                            unit: "",
                            palette: {
                                _defs_: {
                                    "_default": "#ffb600",
                                    "world": "#ffb600",
                                    "eur": "#FFE700",
                                    "afr": "#00D5E9",
                                    "asi": "#FF5872",
                                    "ame": "#7FEB00"
                                }
                            }
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
                    reader: "json-file",
                    path: "local_data/waffles/{{LANGUAGE}}/basic-indicators.json"
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
