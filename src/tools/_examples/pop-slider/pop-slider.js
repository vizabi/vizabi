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
                model: ["data"]
            }, {
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider', //div to render
                model: ["time"]
            }];

            //rules to validate state
            this.state_validate = [
                ["time.start", "=", "data.show.time_start"],
                ["time.end", "=", "data.show.time_end"],
                ["data.selected.time", "=", "time.value"]
            ];

            //todo: improve format
            this.model_queries = {
                "data": function(model) {
                    return [{
                        "from": "data",
                        "select": _.union(["geo", "geo.name", "time", "geo.region"], model.get("show.indicator")),
                        "where": {
                            "geo": model.get("show.geo"),
                            "geo.category": model.get("show.geo_category"),
                            "time": [model.get("show.time_start")+"-"+model.get("show.time_end")]
                        }
                    }];
                }
            };

            this._super(options);
        }
    });


    return popSlider;
});