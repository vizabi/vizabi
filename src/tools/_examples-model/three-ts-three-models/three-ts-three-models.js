//Example Timeslider A
define([
    'base/tool'
], function(Tool) {

    var ThreeTSThreeModel = Tool.extend({

        /**
         * Initialized the tool
         * @param config tool configurations, such as placeholder div
         * @param options tool options, such as state, data, etc
         */
        init: function(config, options) {

            //tool basic settings
            this.name = 'three-ts-three-models';
            this.template = 'tools/_examples-model/three-ts-three-models/three-ts-three-models';

            //instantiating components
            this.components = [{
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider-1', //div to render
                model: ["state.time_start"]
            },{
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider-2', //div to render
                model: ["state.time_end"]
            },{
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider-3', //div to render
                model: ["state.time"]
            }];

            this._super(config, options);
        },

        /**
         * Validating the tool model
         */
        validate: function() {

            var state = this.state;

            if (state.time_end.start != state.time_start.value) {
                state.time_end.start = state.time_start.value;
            }
            if (state.time.start != state.time_start.value) {
                state.time.start = state.time_start.value;
            }
            if (state.time.end != state.time_end.value) {
                state.time.end = state.time_end.value;
            }
        },

    });

    return ThreeTSThreeModel;
});
