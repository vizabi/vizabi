/*!
 * VIZABI MOUNTAINCHART
 */

(function () {

    "use strict";

    var Vizabi = this.Vizabi;
    var utils = Vizabi.utils;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) return;

    //MOUNTAIN CHART TOOL
    var MountainChart = Vizabi.Tool.extend('MountainChart', {

        /**
         * Initializes the tool (Bar Chart Tool).
         * Executed once before any template is rendered.
         * @param {Object} config Initial config, with name and placeholder
         * @param {Object} options Options such as state, data, etc
         */
        init: function (config, options) {

            this.name = "mountainchart";

            //specifying components
            this.components = [{
                component: 'gapminder-mountainchart',
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

            //constructor is the same as any tool
            this._super(config, options);
        },

        /**
         * Validating the tool model
         * @param model the current tool model to be validated
         */
        validate: function (model) {

            model = this.model || model;

            var time = model.state.time;
            var marker = model.state.marker.label;

            //don't validate anything if data hasn't been loaded
            if (!marker.getItems() || marker.getItems().length < 1) {
                return;
            }

            var dateMin = marker.getLimits(time.getDimension()).min;
            var dateMax = marker.getLimits(time.getDimension()).max;

            if (time.start < dateMin) {
                time.start = dateMin;
            }
            if (time.end > dateMax) {
                time.end = dateMax;
            }
        }
    });

    MountainChart.define('default_options', {
        state: {
            time: {
                start: 1970,
                end: 2006,
                value: 1970,
                step: 1,
                speed: 100,
                formatInput: "%Y"
            },
            entities: {
                dim: "geo",
                show: {
                    _defs_: {
                        "geo": ['swe', 'nor', 'fin', 'bra', 'usa', 'chn', 'jpn', 'zaf', 'ind', 'ago'],
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
                    which: "mean",
                    scaleType: 'log'
                },
                size: {
                    use: "indicator",
                    which: "variance",
                    scaleType: 'linear'
                },
                color: {
                    use: "property",
                    which: "geo.region",
                    scaleType: "ordinal"
                }
            }
        },
        data: {
            reader: "json-file",
            path: "local_data/waffles/{{LANGUAGE}}/mountains.json"
        },

        ui: {
        },

        language: {
            id: "en",
            strings: {
                _defs_: {
                    en: {
                        "title": "",
                        "buttons/expand": "Go Big",
                        "buttons/unexpand": "Go Small",
                        "buttons/find": "Find",
                        "buttons/colors": "Colors",
                        "buttons/size": "Size",
                        "buttons/axes": "Axes",
                        "buttons/more_options": "Options"
                    }
                }
            }
        }
    });

}).call(this);