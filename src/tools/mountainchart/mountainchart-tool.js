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
            if (!marker.getKeys() || marker.getKeys().length < 1) {
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
                stack: true,
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
                    scaleType: 'log',
                    unit: "indicator/dollarperday"
                },
                size: {
                    use: "indicator",
                    which: "variance",
                    scaleType: 'linear'
                },
                color: {
                    use: "property",
                    which: "geo",
                    scaleType: "ordinal"
                }
            }
        },
        data: {
            reader: "csv-file",
            path: "local_data/waffles/{{LANGUAGE}}/mountains.csv"
        }
    });

}).call(this);