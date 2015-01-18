//TODO: refactor hardcoded dates //former FIXME
//TODO: remove date formatting from here //former FIXME

define([
    'lodash',
    'd3',
    'base/tool'
], function(_, d3, Tool) {

    var axisLabeler = Tool.extend({
        /**
         * Initialized the tool
         * @param config tool configurations, such as placeholder div
         * @param options tool options, such as state, data, etc
         */
        init: function(config, options) {

            this.name = 'axis-labeler';
            this.template = "tools/_examples/axis-labeler/axis-labeler";

            //instantiating components
            this.components = [ {
                component: '_examples/axis-labeler',
                placeholder: '.vzb-tool-viz', //div to render
                model: ["state.time", "state.entities", "state.marker", "data"]
            }, {
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider', //div to render
                model: ["state.time"]
            }];

            this._super(config, options);

        },

        /**
         * Validating the tool model
         * @param model the current tool model to be validated
         */
        toolModelValidation: function(model) {

            var time = model.state.time,
                markers = model.state.marker.label;

            //don't validate anything if data hasn't been loaded
            if (!markers.getItems() || markers.getItems().length < 1) {
                return;
            }

            var dateMin = markers.getLimits('time').min,
                dateMax = markers.getLimits('time').max;

            if (time.start < dateMin) {
                time.start = dateMin;
            }
            if (time.end > dateMax) {
                time.end = dateMax;
            }
        }
    });

    return axisLabeler;
});
