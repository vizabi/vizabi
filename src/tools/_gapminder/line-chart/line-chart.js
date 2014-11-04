define([
    'base/tool'
], function(Tool) {

    var lineChart = Tool.extend({
        /**
         * Initialized the tool
         * @param config tool configurations, such as placeholder div
         * @param options tool options, such as state, data, etc
         */
        init: function(config, options) {
            
            this.name = 'line-chart';
            this.template = "tools/_gapminder/line-chart/line-chart";

            this.state = options.state;

            this.components = [{
                component: '_gapminder/header',
                placeholder: '.vzb-tool-title'
            }, {
                component: '_gapminder/line-chart',
                placeholder: '.vzb-tool-viz',
                model: ["state.show", "data", "state.time"]
            }, {
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider',
                model: ["state.time"]
            },{
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
            if (!data.getItems() || data.getItems().length < 1) {
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
                "select": ["geo", "geo.name", "time", "geo.region", "geo.category", state.show.indicator],
                "where": {
                    "geo": state.show.geo,
                    "geo.category": state.show.geo_category,
                    "time": [state.time.start + "-" + state.time.end]
                }
            }];
        }
    });

    return lineChart;
});
