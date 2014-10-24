define([
    'base/tool'
], function(Tool) {

    var lineChart = Tool.extend({
        init: function(parent, options) {
            
            this.name = 'pop-slider';
            this.template = "tools/_examples/pop-slider/pop-slider";

            //instantiating components
            this.components = [{
                component: '_examples/year-display',
                placeholder: '.vzb-tool-year', //div to render
                model: ["time"]
            },{
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider', //div to render
                model: ["time"]
            }];

            this._super(parent, options);
        }
    });


    return lineChart;
});
