/*!
 * VIZABI LINECHART DEFAULT OPTIONS
 */

(function() {
    "use strict";
    var LineChart = this.Vizabi.Tool.get('LineChart');

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
                }
            }
        }
    });

}).call(this);