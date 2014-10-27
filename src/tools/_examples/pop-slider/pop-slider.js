define([
    'underscore',
    'base/tool'
], function(_, Tool) {

    var popSlider = Tool.extend({
        init: function(options) {

            this.name = 'pop-slider';
            this.template = "tools/_examples/pop-slider/pop-slider";

            //instantiating components
            this.components = [{
                component: '_examples/year-display',
                placeholder: '.vzb-tool-year', //div to render
                model: ["time"]
            }, {
                component: '_examples/indicator-display',
                placeholder: '.vzb-tool-display', //div to render
                model: ["show", "data", "time"]
            }, {
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider', //div to render
                model: ["time"]
            }];

            this._super(options);
        },

        toolModelValidation: function(model) {
            var changes = false;
            if (model.get("show.time_start") < model.get("data.time_start")) {
                model.set("show.time_start", model.get("data.time_start"));
                changes = model;
            }
            if (model.get("show.time_end") > model.get("data.time_end")) {
                model.set("show.time_end", model.get("data.time_end"));
                changes = model;
            }
            if (model.get("time.start") != model.get("show.time_start")) {
                model.set("time.start", model.get("show.time_start"));
                changes = model;
            }
            if (model.get("time.end") != model.get("show.time_end")) {
                model.set("time.end", model.get("show.time_end"));
                changes = model;
            }
            return changes;
        },

        getQuery: function(toolModel) {
            return [{
                "from": "data",
                "select": _.union(["geo", "geo.name", "time", "geo.region"], toolModel.get("show.indicator")),
                "where": {
                    "geo": toolModel.get("show.geo"),
                    "geo.category": toolModel.get("show.geo_category"),
                    "time": [toolModel.get("show.time_start") + "-" + toolModel.get("show.time_end")]
                }
            }];
        }

    });


    return popSlider;
});