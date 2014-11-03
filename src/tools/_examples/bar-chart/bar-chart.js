define([
    'base/tool'
], function(Tool) {

    var barChart = Tool.extend({
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

        toolModelValidation: function(model) {
            //improve this validation
            if (model.state.time.start < model.data.time_start) {
                model.state.time.start =  model.data.time_start;
            }
            if (model.state.time.end < model.data.time_end) {
                model.state.time.end =  model.data.time_end;
            }
        },

        getQuery: function(model) {
            //build query with state info
            var query = [{
                "from": "data",
                "select": ["geo", "geo.name", "time", "geo.region", "geo.category", model.state.show.indicator],
                "where": {
                    "geo": model.state.show.geo,
                    "geo.category": model.state.show.geo_category,
                    "time": [model.state.time.start + "-" + model.state.time.end]
                }
            }];

            return query;
        }
    });


    return barChart;
});