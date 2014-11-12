//FIXME: refactor hardcoded dates
//FIXME: remove date formatting from here

define([
    'd3',
    'base/tool'
], function(d3, Tool) {

    var barChart = Tool.extend({

        /**
         * Initialized the tool
         * @param config tool configurations, such as placeholder div
         * @param options tool options, such as state, data, etc
         */
        init: function(config, options) {

            this.name = 'bar-chart';
            this.template = "tools/_examples/bar-chart/bar-chart";

            //instantiating components
            this.components = [{
                component: '_gapminder/header',
                placeholder: '.vzb-tool-title'
            }, {
                component: '_examples/bar-chart',
                placeholder: '.vzb-tool-viz', //div to render
                model: ["state.show", "data", "state.time"]
            }, {
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider', //div to render
                model: ["state.time"]
            }, {
                component: '_gapminder/buttonlist',
                placeholder: '.vzb-tool-buttonlist'
            }];

            this._super(config, options);
        },

        /**
         * Validating the tool model
         * @param model the current tool model to be validated
         */
        toolModelValidation: function(model) {

            var state = model.state;
            var data = model.data;

            //don't validate anything if data hasn't been loaded
            if(!data.getItems() || data.getItems().length < 1) {
                return;
            }

            var dateMin = data.getLimits('time').min,
                dateMax = data.getLimits('time').max;

            if (state.time.start < dateMin) {
                state.time.start = dateMin;
            }
            if (state.time.end > dateMax) {
                state.time.end = dateMax;
            }
        },

        /**
         * Returns the query (or queries) to be performed by this tool
         * @param model the tool model will be received
         */
        getQuery: function(model) {
            var state = model.state,
                time_start = d3.time.format("%Y")(state.time.start),
                time_end = d3.time.format("%Y")(state.time.end);
            return [{
                "from": "data",
                "select": ["geo", "geo.name", "time", "geo.region", "geo.category", state.show.indicator],
                "where": {
                    "geo": state.show.geo,
                    "geo.category": state.show.geo_category,
                    "time": [time_start + "-" + time_end]
                }
            }];
        }
    });


    return barChart;
});
