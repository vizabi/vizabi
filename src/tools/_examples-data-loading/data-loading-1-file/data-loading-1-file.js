//Data Loading 1 Async File
define([
    'd3',
    'base/tool'
], function(d3, Tool) {

    var DataLoading1AsyncFile = Tool.extend({

        /**
         * Initializes the tool (Data Loading 1 Async File).
         * Executed once before any template is rendered.
         * @param {Object} config Initial config, with name and placeholder
         * @param {Object} options Options such as state, data, etc
         */
        init: function(config, options) {
            
            this.name = "data-loading-1-file";
            this.template = "tools/_examples-data-loading/data-loading-1-file/data-loading-1-file";

	        //specifying components
            this.components = [{
                component: '_examples/display-json',
                placeholder: '.vzb-display-json-wrapper',
                model: ['data'] 
            }];

            //constructor is the same as any tool
            this._super(config, options);
        },

        /**
         * Validating the tool model
         * @param model the current tool model to be validated
         */
        toolModelValidation: function(model) {

            //if mydata is not there and if it's not loading mydata
            if (!model.data.profits && !model.data.isLoading("profits")) {
                model.data.setLoading("profits");

                d3.json("../../../local_data/myfile.json", function(err, data) {

                    //simulate slow data loading
                    setTimeout(function() {
                        console.log("LOADED JSON");
                        console.log(data);
                        model.data.profits = data;

                        model.data.setLoadingDone("profits");
                    }, 2000);
                });
            }

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

    return DataLoading1AsyncFile;
});