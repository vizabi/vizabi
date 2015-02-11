//Data Loading 2
define([
    'base/tool'
], function(Tool) {

    var DataLoading2 = Tool.extend({

        /**
         * Initializes the tool (Data Loading 2).
         * Executed once before any template is rendered.
         * @param {Object} config Initial config, with name and placeholder
         * @param {Object} options Options such as state, data, etc
         */
        init: function(config, options) {
            
            this.name = "data-loading-2";
            this.template = "tools/_examples-data-loading/data-loading-2/data-loading-2";

	        //specifying components
            this.components = [{
                component: '_examples/display-graph',
                placeholder: '.vzb-display-graph-wrapper',
                model: ["state.deps"]
            }];

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

    return DataLoading2;
});