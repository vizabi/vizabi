define([
    'lodash',
    'base/tool'
], function(_, Tool) {

    var bubbleChart = Tool.extend({
        /**
         * Initialized the tool
         * @param config tool configurations, such as placeholder div
         * @param options tool options, such as state, data, etc
         */
        init: function(config, options) {

            this.name = 'bubble-chart';
            this.template = "tools/_examples/bubble-chart/bubble-chart";

            //instantiating components
            this.components = [{
                component: '_gapminder/header',
                placeholder: '.vzb-tool-title'
            }, {
                component: '_examples/bubble-chart',
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

            var state = model.state,
                data = model.data;

            //don't validate anything if data hasn't been loaded
            if(!data.getItems() || data.getItems().length < 1) {
                return;
            }
            if (state.time.start < data.getLimits('time').min) {
                state.time.start = data.getLimits('time').min;
            }
            if (state.time.end > data.getLimits('time').max) {
                state.time.end = data.getLimits('time').max;
            }
        },

        /**
         * Returns the query (or queries) to be performed by this tool
         * @param model the tool model will be received
         */
        getQuery: function(model) {
            var state = model.state;
            return [{
                "from": "data",
                //FIXME not sure if we need union here. barchart doesn't have it
                "select": _.union(["geo", "geo.name", "time", "geo.region", state.show.indicator]),
                "where": {
                    "geo": state.show.geo,
                    "geo.category": state.show.geo_category,
                    "time": [state.time.start + "-" + state.time.end]
                }
            }];
        }
    });

    return bubbleChart;
});
