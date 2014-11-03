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

            //rules to validate state (alterative method)
            // options.validate = [
            //     ["time_end.start", "=", "time_start.value"],
            //     ["time.start", "=", "time_start.value"],
            //     ["time.end", "=", "time_end.value"]
            // ];

            this._super(config, options);
        },

        toolModelValidation: function(model) {
            var changes = false;
            if (model.get("time_end.start") != model.get("time_start.value")) {
                model.set("time_end.start", model.get("time_start.value"));
                changes = model;
            }
            if (model.get("time.start") != model.get("time_start.value")) {
                model.set("time.start", model.get("time_start.value"));
                changes = model;
            }
            if (model.get("time.end") != model.get("time_end.value")) {
                model.set("time.end", model.get("time_end.value"));
                changes = model;
            }
            
            return changes;
        },

    });

    return ThreeTSThreeModel;
});