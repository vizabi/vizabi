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
            
            this.name = "bar-chart";
            this.template = "tools/_examples/"+this.name+"/"+this.name;

	        //specifying components
            this.components = [{
                component: '_examples/bar-chart',
                placeholder: '.vzb-tool-viz',
                model: ["state.time", "state.entities", "state.marker", "language"]  //pass models to component
            },
            {
                component: '_gapminder/buttonlist',
                placeholder: '.vzb-tool-buttonlist',
                model: ['state', 'ui', 'language'],
                buttons: ['fullscreen', 'find', 'colors']
            },
            {
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider',
                model: ["state.time"]
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

            var time = this.model.state.time,
                marker = this.model.state.marker.label;

            //don't validate anything if data hasn't been loaded
            if (!marker.getItems() || marker.getItems().length < 1) {
                return;
            }

            var dateMin = marker.getLimits('time').min,
                dateMax = marker.getLimits('time').max;

            if (time.start < dateMin) {
                time.start = dateMin;
            }
            if (time.end > dateMax) {
                time.end = dateMax;
            }
        }
    });

    return BarChartTool;
});