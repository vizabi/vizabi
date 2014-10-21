//Example Timeslider A
define([
    'base/tool'
], function(Tool) {

    var ExampleTimesliderA = Tool.extend({
        init: function(parent, options) {

            //tool basic settings
            this.name = 'example-timeslider-a';
            this.template = 'tools/_examples/example-timeslider-a/example-timeslider-a';

            //instantiating components
            this.components = [{
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider-1', //div to render
                model: ['time']  //model name and type derived from state
            }];

            this._super(parent, options);
        }
    });

    return ExampleTimesliderA;
});