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
         * @param model the current tool model to be validated
         */
        toolModelValidation: function(model) {

            var time = model.state.time,
                rows = model.state.row.label;


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
        },

        /**
         * Returns the query (or queries) to be performed by this tool
         * @param model the tool model will be received
         */

        //TODO: separate into queries
        getQuery: function(model) {
            var state = model.state,
                time_start = d3.time.format("%Y")(state.time.start),
                time_end = d3.time.format("%Y")(state.time.end);

            var dimensions = state.entity.getDimensions(),
                indicators = state.getIndicators(),
                properties = state.getProperties();

            var queries = [];

            for (var i = 0; i < dimensions.length; i++) {
                var dim = dimensions[i],
                    query = {
                        "from": "data",
                        "select": _.union([dim, "time"], indicators, properties),
                        "where": _.extend({
                            "time": [time_start + "-" + time_end]
                        }, state.entity.show[i].filter)
                    };

                queries.push(query);
            };

            return queries;
        }

    });


    return popSlider;
});