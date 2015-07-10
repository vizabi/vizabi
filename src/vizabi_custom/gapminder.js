/*!
 * VIZABI GAPMINDER PREFERENCES (included only in Gapminder build)
 */

(function () {
    'use strict';
    var root = this;
    var Vizabi = root.Vizabi;

    //DEFAULT OPTIONS
    var BarChart = this.Vizabi.Tool.get('BarChart');
    var LineChart = this.Vizabi.Tool.get('LineChart');
    var BubbleChart = this.Vizabi.Tool.get('BubbleChart');
    var MountainChart = this.Vizabi.Tool.get('MountainChart');
    var PopByAge = this.Vizabi.Tool.get('PopByAge');


    var language = {
        id: "en",
        strings: {
            en: {
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
                "buttons/axes-mc": "X and Y",
                "buttons/axis_x": "X axis",
                "buttons/axis_y": "Y axis",
                "buttons/stack": "Stack",
                "buttons/more_options": "Options",
                "buttons/opacityNonselect": "Opacity of non-selected",
                "buttons/opacityRegular": "Regular opacity",
                "hints/bubbl/setmaxsize": "Maximum bubble size:",
                "hints/mount/maxYvalue": "Maximum Y value:",
                "hints/mount/logXstops": "X-axis logarithmic stops:",
                "hints/mount/howtostack": "Chose how to stack mountains:",
                "mount/maxYmode/immediate": "Immediate",
                "mount/maxYmode/latest": "Latest",
                "mount/maxYmode/total": "Total",
                "mount/stacking/region": "Region",
                "mount/stacking/world": "World",
                "mount/stacking/none": "None",
                "popbyage/yearOldsIn": "-year-olds in",
                "indicator/lex": "Life expectancy",
                "indicator/gdp_per_cap": "GDP per capita",
                "indicator/pop": "Population",
                "indicator/geo.region": "Region",
                "indicator/geo": "Geo code",
                "indicator/time": "Time",
                "indicator/geo.category": "Geo category",
                "unit/gdp_per_cap": "$/year/person",
                "unit/": "",
                "unit/lex": "Years",
                "unit/time": "Years",
                "unit/gdp_per_cap_daily": "$/day",
                "scaletype/linear": "Linear",
                "scaletype/log": "Logarithmic",
                "scaletype/genericLog": "Generic log",
                "scaletype/time": "Time",
                "scaletype/ordinal": "Ordinal",
                "color/_default": "Other",
                "check/adaptMinMaxZoom": "Follow bubbles with zoom"
            },
            se: {
                "buttons/expand": "Gå stor",
                "buttons/unexpand": "Gå små",
                "buttons/trails": "Ledar",
                "buttons/lock": "Lås",
                "buttons/find": "Hitta",
                "buttons/deselect": "Välj ej",
                "buttons/ok": "OK",
                "buttons/colors": "Färg",
                "buttons/size": "Storlek",
                "buttons/axes": "Axlar",
                "buttons/axes-mc": "X och Y",
                "buttons/axis_x": "X axel",
                "buttons/axis_y": "Y axel",
                "buttons/stack": "Stack",
                "buttons/more_options": "Mer...",
                "buttons/opacityNonselect": "Synlighet av ej valda",
                "buttons/opacityRegular": "Vanlig synlighet",
                "hints/bubbl/setmaxsize": "Max bubblar storlek:",
                "hints/mount/maxYvalue": "Max Y-tal:",
                "hints/mount/logXstops": "Log X-axel stoppas vid:",
                "hints/mount/howtostack": "Välj hur ska berg stackas:",
                "mount/maxYmode/immediate": "Direkt",
                "mount/maxYmode/latest": "Senast",
                "mount/maxYmode/total": "Totalt",
                "mount/stacking/region": "Region",
                "mount/stacking/world": "Värld",
                "mount/stacking/none": "Ingen",
                "popbyage/yearOldsIn": "-åringar i",
                "indicator/lex": "Livslängd",
                "indicator/gdp_per_cap": "PIB pro capita",
                "indicator/pop": "Befolkning",
                "indicator/geo.region": "Region",
                "indicator/geo": "Geokod",
                "indicator/time": "Tid",
                "indicator/geo.category": "Geo kategori",
                "unit/gdp_per_cap": "$/år/person",
                "unit/": "",
                "unit/lex": "År",
                "unit/time": "År",
                "unit/gdp_per_cap_daily": "$/dag",
                "scaletype/linear": "Linjär",
                "scaletype/log": "Logaritmisk",
                "scaletype/genericLog": "Generic log",
                "scaletype/time": "Tid",
                "scaletype/ordinal": "Ordning",
                "color/_default": "Annat",
                "check/adaptMinMaxZoom": "Följ bubblar med zoom"
            }
        }
    };

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
                    which: "geo",
                    palette: {
                        "asi": "#FF5872",
                        "eur": "#FFE700",
                        "ame": "#7FEB00",
                        "afr": "#00D5E9",
                        "_default": "#ffb600"
                    }
                }
            }
        },
        data: {
            reader: "waffle-server"
        },
        language: language,
        ui: {
            buttons: []
        }
    });

    MountainChart.define('default_options', {
        state: {
            time: {
                start: 1850,
                end: 2000,
                value: 2000,
                step: 1,
                speed: 100,
                formatInput: "%Y",
                xLogStops: [1],
                yMaxMethod: "latest"
            },
            entities: {
                dim: "geo",
                opacitySelectDim: 0.3,
                opacityRegular: 0.6,
                show: {
                    _defs_: {
                        "geo": ['*'], //['swe', 'nor', 'fin', 'bra', 'usa', 'chn', 'jpn', 'zaf', 'ind', 'ago'],
                        "geo.cat": ["country"]
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
                    which: "pop",
                    scaleType: 'linear'
                },
                axis_x: {
                    use: "indicator",
                    //which: "mean",
                    which: "gdp_per_cap",
                    scaleType: 'log',
                    unit: "gdp_per_cap_daily"
                },
                size: {
                    use: "indicator",
                    //which: "variance",
                    which: "gini",
                    scaleType: 'linear'
                },
                color: {
                    use: "property",
                    which: "geo.region",
                    scaleType: "ordinal"
                },
                stack: {
                    use: "property",
                    which: "geo.region" // set a property of data or values "all" or "none"
                },
                group: {
                    which: "geo.region" // set a property of data
                }
            }
        },
        language: language,
        data: {
            reader: "csv-file",
            //path: "local_data/waffles/{{LANGUAGE}}/mountains.csv"
            //path: "local_data/waffles/{{LANGUAGE}}/mountains-pop-var-mean.csv"
            path: "local_data/waffles/{{LANGUAGE}}/mountains-pop-gdp-gini.csv"
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
                    which: "geo",
                    palette: {
                        "asi": "#FF5872",
                        "eur": "#FFE700",
                        "ame": "#7FEB00",
                        "afr": "#00D5E9",
                        "_default": "#ffb600"
                    }
                },
                color_shadow: {
                    use: "property",
                    which: "geo",
                    palette: {
                        "asi": "#FF5872",
                        "eur": "#FFE700",
                        "ame": "#7FEB00",
                        "afr": "#00D5E9",
                        "_default": "#ffb600"
                    }
                }
            }
        },

        data: {
            reader: "waffle-server",
        },
        language: language,
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
                    unit: "lex"
                },
                axis_x: {
                    use: "indicator",
                    which: "gdp_per_cap",
                    scaleType: "log",
                    unit: "gdp_per_cap"
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
        language: language,
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
        }
    });

    PopByAge.define('default_options', {
        state: {
            time: {
                value: '2013'
            },
            entities: {
                dim: "geo",
                show: {
                    _defs_: {
                        "geo": ["usa"]
                    }
                }
            },
            entities_age: {
                dim: "age",
                show: {
                    _defs_: {
                        "age": [[1, 100]] //show 1 through 100
                    }
                }
            },
            marker: {
                space: ["entities", "entities_age", "time"],
                label: {
                    use: "indicator",
                    which: "age"
                },
                axis_y: {
                    use: "indicator",
                    which: "age"
                },
                axis_x: {
                    use: "indicator",
                    which: "population"
                },
                color: {
                    use: "value",
                    which: "#ffb600"
                }
            }
        },
        data: {
            reader: "csv-file",
            path: "local_data/csv/{{geo}}.csv"
        },
        language: language,
        ui: {
            buttons: []
        }
    });

    //Waffle Server Reader custom path
    var WaffleReader = this.Vizabi.Reader.get('waffle-server');
    WaffleReader.define('basepath', "http://54.154.191.20:8001/values/waffle");

}.call(this));