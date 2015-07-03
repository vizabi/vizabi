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
        }
    });

    MountainChart.define('default_options', {
        state: {
            time: {
                start: 1980,
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
                    //which: "gdp_per_cap",
                    scaleType: 'log',
                    unit: "indicator/dollarperday"
                },
                size: {
                    use: "indicator",
                    which: "variance",
                    //which: "gini",
                    scaleType: 'linear'
                },
                color: {
                    use: "property",
                    which: "geo.region",
                    scaleType: "ordinal"
                },
                stack: {
                    use: "property",
                    which: "geo.region" // set any property of data or values "all" or "none"
                }
            }
        },
        data: {
            reader: "csv-file",
            path: "local_data/waffles/{{LANGUAGE}}/mountains.csv"
            //path: "local_data/waffles/{{LANGUAGE}}/mountains-pop-var-mean.csv"
            //path: "local_data/waffles/{{LANGUAGE}}/mountains-pop-gdp-gini.csv"
        }
    });

}).call(this);