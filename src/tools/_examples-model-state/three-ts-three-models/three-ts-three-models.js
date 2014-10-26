//Example Timeslider A
define([
    'base/tool'
], function(Tool) {

    var ThreeTSThreeModel = Tool.extend({
        init: function(options) {

            //tool basic settings
            this.name = 'three-ts-three-models';
            this.template = 'tools/_examples-model-state/three-ts-three-models/three-ts-three-models';

            //instantiating components
            this.components = [{
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider-1', //div to render
                model: ["time_start"]
            },{
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider-2', //div to render
                model: ["time_end"]
            },{
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider-3', //div to render
                model: ["time"]
            }];

            //rules to validate state
            this.state_validate = [
                ["time_end.start", "=", "time_start.value"],
                ["time.start", "=", "time_start.value"],
                ["time.end", "=", "time_end.value"]
            ];

            this._super(options);
        }

    });

    return ThreeTSThreeModel;
});