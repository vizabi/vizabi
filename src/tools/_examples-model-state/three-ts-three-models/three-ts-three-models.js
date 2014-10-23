//Example Timeslider A
define([
    'base/tool'
], function(Tool) {

    var ThreeTSThreeModel = Tool.extend({
        init: function(parent, options) {

            //tool basic settings
            this.name = 'three-ts-three-models';
            this.template = 'tools/_examples-model-state/three-ts-three-models/three-ts-three-models';

            //instantiating components
            this.components = [{
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider-1', //div to render
                model: ["time"]
            },{
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider-2', //div to render
                model: ["time_2"]
            },{
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider-3', //div to render
                model: ["time_3"]
            }];

            this._super(parent, options);
        },

        // mapping: function() {
            
        // },

        validate: function() {

        },


    });

    return ThreeTSThreeModel;
});