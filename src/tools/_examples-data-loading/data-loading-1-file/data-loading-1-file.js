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

                console.timeStamp("Vizabi Event: ready ASKING FOR DATA");
                
                //set loading of model
                model.data.setLoading("profits");

                d3.json("../../local_data/myfile.json", function(err, data) {

                    //simulate slow data loading
                    setTimeout(function() {
                        console.log("LOADED JSON");
                        console.log(data);
                        model.data.profits = data;

                        console.timeStamp("Vizabi Event: ready DATA DONE");

                        //loading of external data is done
                        model.data.setLoadingDone("profits");

                        console.timeStamp("Vizabi Event: ready DATA DONE END");

                    }, 1000);
                });
            }

        }
    });

    return DataLoading1AsyncFile;
});