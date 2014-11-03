define([
    'base/tool'
], function(Tool) {

    var popSlider = Tool.extend({
        init: function(config, options) {

            this.name = 'pop-slider';
            this.template = "tools/_examples-model-state/crazy-pop-slider/crazy-pop-slider";

            //instantiating components
            this.components = [{
                component: '_examples/year-display',
                placeholder: '.vzb-tool-year', //div to render
                model: ["state.time"]
            }, {
                component: '_examples/indicator-display',
                placeholder: '.vzb-tool-display', //div to render
                model: ["state.show", "data", "state.time"]
            }, {
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider', //div to render
                model: ["state.time"]
            }];

            this._super(config, options);
        },

        toolModelValidation: function(model) {

            //don't do anything if data hasn't been loaded
            if(!model.data.getItems() || model.data.getItems().length < 1) {
                return;
            }
            if (model.state.time.start < model.data.getLimits('time').min) {
                model.state.time.start = model.data.getLimits('time').min;
            }
            if (model.state.time.end > model.data.getLimits('time').max) {
                model.state.time.end = model.data.getLimits('time').max;
            }

            if (model.state.show.geo.length > 3 && model.state.show.indicator != "lex") {
                model.state.show.indicator = "lex";
            }
        },

        getQuery: function(model) {
            return [{
                "from": "data",
                "select": ["geo", "geo.name", "time", "geo.region", "geo.category", model.state.show.indicator],
                "where": {
                    "geo": model.state.show.geo,
                    "geo.category": model.state.show.geo_category,
                    "time": [model.state.time.start + "-" + model.state.time.end]
                }
            }];
        }

    });


    return popSlider;
});