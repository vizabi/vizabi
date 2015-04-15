//Bar Chart Tool
define([
    'base/tool'
], function(Tool) {

    var BarChartTool = Tool.extend({

        /**
         * Initializes the tool (Bar Chart Tool).
         * Executed once before any template is rendered.
         * @param {Object} config Initial config, with name and placeholder
         * @param {Object} options Options such as state, data, etc
         */
        init: function(config, options) {
            
            this.name = "barchart";
            this.template = "tools/_examples/barchart/barchart";

	        //specifying components
            this.components = [{
                component: '_examples/barchart',
                placeholder: '.vzb-your-placeholder'
                //model: ['time']  //pass this model to this component 
            },
            {
                component: '_gapminder/buttonlist',
                placeholder: '.vzb-tool-buttonlist'
                //model: ['time']  //pass this model to this component 
            },
            {
                component: '_gapminder/header',
                placeholder: '.vzb-tool-title'
                //model: ['time']  //pass this model to this component 
            },
            {
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider'
                //model: ['time']  //pass this model to this component 
            },
            ];

            //constructor is the same as any tool
            this._super(config, options);
        },

        /**
         * Validating the tool model
         * @param model the current tool model to be validated
         */
        toolModelValidation: function(model) {

            /* Example of model validation for time, show and data 

            var state = model.state,
                data = model.data;

            //don't validate anything if data hasn't been loaded
            if(!data.getItems() || data.getItems().length < 1) {
                return;
            }
            if (state.time.start < data.getLimits('time').min) {
                state.time.start = data.getLimits('time').min;
            }
            if (state.time.end > data.getLimits('time').max) {
                state.time.end = data.getLimits('time').max;
            }

            * End of example */
        }
    });

    return BarChartTool;
});