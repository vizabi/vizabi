//Example Timeslider A
define([
    'base/tool'
], function(Tool) {

    /*
    state: {
        time: {
    
        },

    }
    */

    var ExampleTimesliderA = Tool.extend({
        init: function(parent, options) {

            //tool basic settings
            this.name = 'timeslider-a';
            this.template = 'tools/_examples-model-state/timeslider-a/timeslider-a';

            //instantiating components
            this.components = [{
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider-1', //div to render
                model: ["time"]
                //figure out a way to pass visual properties to component
            }];

            this.components = [{
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider-2', //div to render
                model: ["time_2"]
            }];

            this._super(parent, options);
        },

        mapping: function() {
            
        },

        validate: function() {

        },


    });

    return ExampleTimesliderA;
});