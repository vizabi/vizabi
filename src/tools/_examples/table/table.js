define([
    'base/tool'
], function(Tool) {
    var table = Tool.extend({

        /**
         * Initialized the tool
         * @param config tool configurations, such as placeholder div
         * @param options tool options, such as state, data, etc
         */
        init: function(config, options) {

            this.name = 'table';
            this.template = "tools/_examples/table/table";

            //instantiating components
            this.components = [{
                component: '_gapminder/header',
                placeholder: '.vzb-tool-title'
            }, {
                component: '_examples/table',
                placeholder: '.vzb-tool-viz', //div to render
                model: ["state.show", "state.time", "data"]
            }];

            //same as constructor
            this._super(config, options);
        },

        /**
         * Validating the tool model
         */
        validate: function() {

            var state = this.model.state;
            var data = this.model.data;

            //don't validate anything if data hasn't been loaded
            if(!data.getItems() || data.getItems().length < 1) {
                return;
            }

            var dateMin = data.getLimits('time').min,
                dateMax = data.getLimits('time').max;

            if (state.time.start < dateMin) {
                state.time.start = dateMin;
            }
            if (state.time.end > dateMax) {
                state.time.end = dateMax;
            }
        }

    });



    return table;
});
