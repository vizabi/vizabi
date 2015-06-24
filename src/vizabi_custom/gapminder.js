/*!
 * VIZABI GAPMINDER PREFERENCES (included only in Gapminder build)
 */

(function() {
    'use strict';
    var root = this;
    var Vizabi = root.Vizabi;

    //DEFAULT OPTIONS
    var BarChart = this.Vizabi.Tool.get('BarChart');
    var LineChart = this.Vizabi.Tool.get('LineChart');
    var BubbleChart = this.Vizabi.Tool.get('BubbleChart');

    BarChart.define('default_options', {
        state: {
            time: {
                start: "1952",
                end: "2012",
                value: "2000",
                step: 1,
                speed: 300,
                formatInput: "%Y"
            },
            entities: {
                dim: "geo",
                show: {
                    _defs_: {
                        "geo": ["*"],
                        "geo.cat": ["region"]
                    }
                }
            },
            marker: {
                space: ["entities", "time"],
                label: {
                    use: "property",
                    which: "geo.name"
                },
                axis_y: {
                    use: "indicator",
                    which: "lex",
                    scaleType: "linear"
                },
                axis_x: {
                    use: "property",
                    which: "geo.name"
                },
                color: {
                    use: "property",
                    which: "geo.region"
                }
            }
        },
        data: {
            reader: "csv-file",
            path: "local_data/waffles/{{LANGUAGE}}/basic-indicators.csv"
        },

        ui: {
            buttons: []
        },

        language: {
            id: "en",
            strings: {
                _defs_: {
                    en: {
                        "title": "",
                        "buttons/expand": "Go Big",
                        "buttons/unexpand": "Go Small",
                        "buttons/lock": "Lock",
                        "buttons/find": "Find",
                        "buttons/colors": "Colors",
                        "buttons/size": "Size",
                        "buttons/axes": "Axes",
                        "buttons/more_options": "Options",
                        "indicator/lex": "Life expectancy",
                        "indicator/gdp_per_cap": "GDP per capita",
                        "indicator/pop": "Population",
                        "indicator/_default": "Value",
                        "indicator/geo.region": "Region",
                        "indicator/geo": "Geo code",
                        "indicator/time": "",
                        "indicator/geo.category": "Geo category"
                    }
                }
            }
        }
    });

    LineChart.define('default_options', {
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
                dim: "geo",
                show: {
                    _defs_: {
                        "geo": ["*"],
                        "geo.cat": ["region"]
                    }
                }
            },
            //how we show it
            marker: {
                space: ["entities", "time"],
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
                    which: "geo.region"
                },
                color_shadow: {
                    use: "property",
                    which: "geo.region"
                }
            }
        },

        data: {
            //reader: "waffle-server",
            reader: "csv-file",
            path: "local_data/waffles/{{LANGUAGE}}/basic-indicators.csv"
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
            buttons: []
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
                    "indicator/_default": "Value"
                }
            }
        }
    });

    BubbleChart.define('default_options', {

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
                dim: "geo",
                show: {
                    _defs_: {
                        "geo": ["*"],
                        "geo.cat": ["country"]
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
                    "indicator/_default": "Value",
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
    });


}.call(this));