//Data Loading File Time
define([
    'd3',
    'lodash',
    'base/tool'
], function(d3, _, Tool) {

    var DataLoadingFileTime = Tool.extend({

        /**
         * Initializes the tool (Data Loading File Time).
         * Executed once before any template is rendered.
         * @param {Object} config Initial config, with name and placeholder
         * @param {Object} options Options such as state, data, etc
         */
        init: function(config, options) {
            
            this.name = "data-loading-1-file-time";
            this.template = "tools/_examples-data-loading/data-loading-1-file-time/data-loading-1-file-time";

	        //specifying components
            this.components = [{
                component: '_examples/display-json',
                placeholder: '.vzb-display-json-wrapper',
                model: ['data'] 
            },
            {
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider',
                model: ['state.time'] 
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

            var defer = $.Deferred();

            //current year
            var year = model.state.time.value.getFullYear().toString();
            var profits = model.data.profits;

            /*
             * ALTERNATIVE 1: Reading the file all the time, every change
             */
            if (!profits && !model.data.isLoading("profits") || (profits && profits[0].year != year)) {
                
                model.data.setLoading("profits");
                console.log("loading...");
                //loading local file
                d3.json("../../../local_data/myfile.json", function(err, data) {
                    console.log("loaded...");
                    model.data.profits = [];
                    model.data.profits.push(_.find(data, { year: year }));
                    model.data.setLoadingDone("profits");
                    defer.resolve();
                });
            }

            /*
             * ==============================================
             *
             * ALTERNATIVE 2: Reading the file when needed only
             */



             /*
             * ==============================================
             */

            return defer;
        }
    });

    return DataLoadingFileTime;
});