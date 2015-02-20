define([
    'd3',
    'lodash',
    'base/tool'
], function(d3, _, Tool) {

    var popSlider = Tool.extend({

        /**
         * Initialized the tool
         * @param config tool configurations, such as placeholder div
         * @param options tool options, such as state, data, etc
         */
        init: function(config, options) {

            this.name = 'pop-slider';
            this.template = "tools/_examples/pop-slider/pop-slider";

            //instantiating components
            this.components = [{
                component: '_examples/year-display',
                placeholder: '.vzb-tool-year', //div to render
                model: ["state.time"]
            }, {
                component: '_examples/indicator-display',
                placeholder: '.vzb-tool-display', //div to render
                model: ["state.row", "state.time"]
            }, {
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider', //div to render
                model: ["state.time"]
            }];

            this._super(config, options);
        },

        /**
         * Validating the tool model
         */
        validate: function() {

            var time = this.model.state.time,
                rows = this.model.state.row.label;

            //don't validate anything if data hasn't been loaded
            if (!rows.getItems() || rows.getItems().length < 1) {
                return;
            }

            var dateMin = rows.getLimits('time').min,
                dateMax = rows.getLimits('time').max;

            if (time.start < dateMin) {
                time.start = dateMin;
            }
            if (time.end > dateMax) {
                time.end = dateMax;
            }
        }

    });


    return popSlider;
});