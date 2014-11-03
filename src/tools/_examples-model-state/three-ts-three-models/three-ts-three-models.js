//Example Timeslider A
define([
    'base/tool'
], function(Tool) {

    var ThreeTSThreeModel = Tool.extend({
        init: function(config, options) {

            //tool basic settings
            this.name = 'three-ts-three-models';
            this.template = 'tools/_examples-model-state/three-ts-three-models/three-ts-three-models';

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

        toolModelValidation: function(model) {
            if (model.state.time_end.start != model.state.time_start.value) {
                model.state.time_end.start = model.state.time_start.value;
            }
            if (model.state.time.start != model.state.time_start.value) {
                model.state.time.start = model.state.time_start.value;
            }
            if (model.state.time.end != model.state.time_end.value) {
                model.state.time.end = model.state.time_end.value;
            }
        },

    });

    return ThreeTSThreeModel;
});