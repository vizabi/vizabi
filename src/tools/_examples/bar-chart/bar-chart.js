define([
    'base/tool'
], function(Tool) {

    var barChart = Tool.extend({
        init: function(parent, options) {

            this.name = 'bar-chart';
            this.template = "tools/_examples/bar-chart/bar-chart";

            //instantiating components
            this.components = [{
                component: '_gapminder/header',
                placeholder: '.vzb-tool-title'
            }, {
                component: '_examples/bar-chart',
                placeholder: '.vzb-tool-viz', //div to render
                model: ["show", "data", "time"]
            }, {
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider', //div to render
                model: ["time"]
            }, {
                component: '_gapminder/buttonlist',
                placeholder: '.vzb-tool-buttonlist'
            }];

            this._super(parent, options);
        },

        toolModelValidation: function(model) {
            var changes = false;

            if (!model.get("show.time_start") || model.get("time.start") != model.get("show.time_start")) {
                model.set("show.time_start", model.get("time.start"));
                changes = model;
            }
            if (!model.get("show.time_end") || model.get("time.end") != model.get("show.time_end")) {
                model.set("show.time_end", model.get("time.end"));
                changes = model;
            }
            if (model.get("show.time_start") < model.get("data.time_start")) {
                model.set("show.time_start", model.get("data.time_start"));
                changes = model;
            }
            if (model.get("show.time_end") > model.get("data.time_end")) {
                model.set("show.time_end", model.get("data.time_end"));
                changes = model;
            }
            if (model.get("time.start") < model.get("show.time_start")) {
                model.set("time.start", model.get("show.time_start"));
                changes = model;
            }
            if (model.get("time.end") > model.get("show.time_end")) {
                model.set("time.end", model.get("show.time_end"));
                changes = model;
            }
            return changes;
        },

        getQuery: function(model) {
            //build query with state info
            var query = [{
                "from": "data",
                "select": ["geo", "geo.name", "time", "geo.region", "geo.category", model.get("show.indicator")],
                "where": {
                    "geo": model.get("show.geo"),
                    "geo.category": model.get("show.geo_category"),
                    "time": [model.get("show.time_start") + "-" + model.get("show.time_end")]
                }
            }];

            return query;
        }
    });


    return barChart;
});