/*!
 * VIZABI BUBBLECHART DEFAULT OPTIONS
 */

(function() {
        "use strict";
        var BubbleChart = this.Vizabi.Tool.get('BubbleChart');

        BubbleChart.define('default_options', {

            state: {
                time: {
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
                    label: {
                        use: "property",
                        which: "geo.name"
                    },
                    axis_y: {
                        use: "indicator",
                        which: "lex"
                    },
                    axis_x: {
                        use: "indicator",
                        which: "gdp_per_cap"
                    },
                    color: {
                        use: "property",
                        which: "geo.region"
                    },
                    size: {
                        use: "indicator",
                        which: "pop"
                    }
                }
            },
            data: {
                //reader: "waffle-server",
                reader: "csv-file",
                path: "local_data/waffles/{{LANGUAGE}}/basic-indicators.csv"
            },

            ui: {
                'vzb-tool-bubble-chart': {},
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

}).call(this);