//Example Timeslider A
define([
    'base/tool'
], function(Tool) {

    var ExampleTimesliderA = Tool.extend({
        init: function(parent, options) {
            
            this.name = "example-timeslider-a";
            this.template = "tools/_examples/example-timeslider-a/example-timeslider-a";
            this.placeholder = options.placeholder;

            this.state = options.state;

	        //add components
            
            this.addComponent('_gapminder/timeslider', {
                placeholder: '.vzb-tool-timeslider-1'
            });
            

            this._super(parent, options);
        }
    });

    return ExampleTimesliderA;
});