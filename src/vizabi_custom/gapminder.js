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
    var MountainChartComponent = this.Vizabi.Component.get('gapminder-mountainchart');
    var PopByAge = this.Vizabi.Tool.get('PopByAge');


    var language = {
        id: "en",
        strings: {
            en: {
                "buttons/expand": "Expand",
                "buttons/unexpand": "Restore",
                "buttons/trails": "Trails",
                "buttons/lock": "Lock",
                "buttons/find": "Find",
                "buttons/deselect": "Deselect",
                "buttons/ok": "OK",
                "buttons/colors": "Colors",
                "buttons/size": "Size",
                "buttons/axes": "X and Y",
                "buttons/axes-mc": "X and Y",
                "buttons/axis_x": "X axis",
                "buttons/axis_y": "Y axis",
                "buttons/stack": "Stack",
                "buttons/more_options": "Options",
                "buttons/opacityNonselect": "Opacity of non-selected",
                "buttons/opacityRegular": "Regular opacity",
                "hints/bubbl/setminsize": "Minimum bubble size:",
                "hints/bubbl/setmaxsize": "Maximum bubble size:",
                "hints/mount/maxYvalue": "Maximum Y value:",
                "hints/mount/logXstops": "X-axis logarithmic stops:",
                "hints/mount/howtostack": "Chose how to stack mountains:",
                "hints/mount/xlimits": "X-axis limits:",
                "hints/mount/povertyline": "Poverty line",
                "hints/min": "min",
                "hints/max": "max",
                "mount/maxYmode/immediate": "Immediate",
                "mount/maxYmode/latest": "Latest",
                "mount/maxYmode/total": "Total",
                "mount/stacking/region": "Region",
                "mount/stacking/world": "World",
                "mount/stacking/none": "None",
                "mount/manualSorting": "Manual sorting of groups",
                "mount/mergegrouped": "Merge grouped",
                "mount/mergestacked": "Merge stacked too",
                "mount/people": "people",
                "popbyage/yearOldsIn": "-year-olds in",
                "indicator/lex": "Life expectancy",
                "indicator/gdp_per_cap": "Yearly GDP per capita",
                "indicator/pop": "Population",
                "indicator/geo.region": "Region",
                "indicator/geo": "Geo code",
                "indicator/time": "Time",
                "indicator/geo.category": "Geo category",
                "indicator/geo.name": "Geo name",
                "indicator/childSurv": "Child survival",
                "indicator/u5mr": "Child under 5 mortality",
                "indicator/u5mr_not": "Prev u5mr with UNPOP",
                "indicator/size": "Big or mini",
                "indicator/gini": "Gini coefficient",
                "indicator/gdppc_pday": "Daily GDP per capita",
                "indicator/inc_pday": "Daily income",
                "unit/gdp_per_cap": "$/year",
                "indicator/_default": "Constant",
                "unit/": "",
                "unit/lex": "Years",
                "unit/time": "Years",
                "unit/childSurv": "per 1000",
                "unit/u5mr": "per 1000",
                "unit/gini": "",
                "unit/gdppc_pday": "$/day",
                "unit/inc_pday": "$/day",
                "unit/gdp_per_cap_daily": "$/day",
                "scaletype/linear": "Linear",
                "scaletype/log": "Logarithmic",
                "scaletype/genericLog": "Generic log",
                "scaletype/time": "Time",
                "scaletype/ordinal": "Ordinal",
                "color/_default": "Single color",
                "check/adaptMinMaxZoom": "Follow bubbles with zoom",
                "region/ame": "America",
                "region/asi": "Asia",
                "region/afr": "Africa",
                "region/eur": "Europe",
                "region/all": "World"
            },
            se: {
                "buttons/expand": "Större",
                "buttons/unexpand": "Mindre",
                "buttons/trails": "Ledar",
                "buttons/lock": "Lås",
                "buttons/find": "Hitta",
                "buttons/deselect": "Välj ej",
                "buttons/ok": "OK",
                "buttons/colors": "Färg",
                "buttons/size": "Storlek",
                "buttons/axes": "X och Y",
                "buttons/axes-mc": "X och Y",
                "buttons/axis_x": "X axel",
                "buttons/axis_y": "Y axel",
                "buttons/stack": "Stapel",
                "buttons/more_options": "Mer...",
                "buttons/opacityNonselect": "Synlighet av ej valda",
                "buttons/opacityRegular": "Vanlig synlighet",
                "hints/bubbl/setminsize": "Min bubblar storlek:",
                "hints/bubbl/setmaxsize": "Max bubblar storlek:",
                "hints/mount/maxYvalue": "Max Y-tal:",
                "hints/mount/logXstops": "Log X-axel stoppas vid:",
                "hints/mount/howtostack": "Välj hur ska berg stackas:",
                "hints/mount/xlimits": "X-axel gränser:",
                "hints/min": "min",
                "hints/max": "max",
                "mount/maxYmode/immediate": "Direkt",
                "mount/maxYmode/latest": "Senast",
                "mount/maxYmode/total": "Totalt",
                "mount/stacking/region": "Region",
                "mount/stacking/world": "Värld",
                "mount/stacking/none": "Ingen",
                "mount/mergegrouped": "Slå ihop de gruppade",
                "mount/mergestacked": "Slå ihop de stackade också",
                "mount/people": "människor",
                "mount/manualSorting": "Manual sorting of groups",
                "popbyage/yearOldsIn": "-åringar i",
                "indicator/lex": "Livslängd",
                "indicator/gdp_per_cap": "BNP per invånare",
                "indicator/pop": "Befolkning",
                "indicator/geo.region": "Regionen",
                "indicator/geo": "Geokod",
                "indicator/time": "Tid",
                "indicator/size": "Stor eller liten",
                "indicator/geo.category": "Geo kategori",
                "indicator/geo.name": "Geo namn",
                "indicator/_default": "Konstant",
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
                "color/_default": "Enkel färg",
                "check/adaptMinMaxZoom": "Följ bubblar med zoom",
                "region/ame": "Amerika",
                "region/asi": "Asien",
                "region/afr": "Afrika",
                "region/eur": "Europa",
                "region/all": "Värld"
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
                    scaleType: "linear",
                    allow: {scales: ["linear", "log"]}
                },
                axis_x: {
                    use: "property",
                    which: "geo.name",
                    allow: {scales: ["ordinal"]}
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
                start: 1800,
                end: 2030,
                value: 2030,
                step: 1,
                speed: 100,
                formatInput: "%Y",
                xLogStops: [1, 2, 5],
                yMaxMethod: "latest",
                povertyline: 1.82,
                povertyCutoff: 0.2,
                povertyFade: 0.7,
                gdpFactor: 1.039781626,
                //0.9971005335,
                gdpShift: -1.127066411,
                //-1.056221322,
                xPoints: 50
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
                    unit: "gdp_per_cap_daily",
                    min: 0.11, //0
                    max: 500 //100
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
                    use: "value",
                    which: "all" // set a property of data or values "all" or "none"
                },
                group: {
                    which: "geo.region", // set a property of data
                    manualSorting: ["eur", "ame", "afr", "asi"],
                    merge: false
                }
            }
        },
        language: language,
        data: {
            //reader: "waffle-server"
            reader: "csv-file",
            path: "local_data/waffles/mountains-pop-gdp-gini-1800-2030.csv"
            //path: "https://dl.dropboxusercontent.com/u/21736853/data/process/inc_mount_data_2015test/mountains-pop-gdp-gini-1800-2030.csv"
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
            reader: "waffle-server"
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
                end: "2014",
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
                    allow: {scales: ["linear", "log", "genericLog"]},
                    unit: "lex"
                },
                axis_x: {
                    use: "indicator",
                    which: "gdp_per_cap",
                    scaleType: "log",
                    allow: {scales: ["linear", "log", "genericLog"]},
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
                    allow: {scales: ["linear", "log"]},
                    min: 0.04,
                    max: 0.75,
                    unit: ""
                }
            }
        },
        data: {
            //reader: "waffle-server",
            reader: "csv-file",
            path: "local_data/waffles/basic-indicators.csv",
            metadata: "local_data/waffles/metadata.csv"
            //path: "local_data/waffles/bub_data_u5mr_inc_etc_20150823.csv"
            //path: "https://dl.dropboxusercontent.com/u/21736853/data/process/childsurv_2015test/bub_data_u5mr_inc_etc_20150823.csv"
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
                group_by: 1,
                label: {
                    use: "indicator",
                    which: "age"
                },
                label_name: {
                    use: "property",
                    which: "geo"
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
            path: "local_data/waffles/{{geo}}.csv",
        },
        language: language,
        ui: {
            buttons: []
        }
    });

    //Waffle Server Reader custom path
    var WaffleReader = this.Vizabi.Reader.get('waffle-server');
    WaffleReader.define('basepath', "http://52.18.235.31:8001/values/waffle");

    //preloading mountain chart precomputed shapes
    MountainChartComponent.define("preload", function(done) {
        var shape_path = "local_data/mc_precomputed_shapes.json";

        d3.json(shape_path, function(data) {
            MountainChartComponent.define('precomputedShapes', data);
            done.resolve();
        });
    });

    //preloading metadata for all charts
    Vizabi.Tool.define("preload", function(done) {
        var metadata_path = "local_data/waffles/metadata.json";
        var globals = Vizabi._globals;

        d3.json(metadata_path, function(data) {
            globals.metadata = data;
            done.resolve();
        });
    });

}.call(this));
