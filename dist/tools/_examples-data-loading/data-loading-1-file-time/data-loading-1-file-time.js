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
            }, {
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider',
                model: ['state.time']
            }, ];

            //constructor is the same as any tool
            this._super(config, options);
        },

        /**
         * Validating the tool model
         */
        validate: function() {

            var model = this.model;
            var year = model.state.time.value.getFullYear().toString();
            var all_profits = this.all_profits;
            var profits = model.data.profits;
            var playing = model.state.time.playing;

            //load files first
            if (!model.data.all_profits && !model.data.isLoading("profits")) {

                //set loading of model
                model.data.setLoading("profits");

                //loading local file
                d3.json("../../local_data/myfile.json", function(err, data) {
                    //make only first year available to model
                    //simulate slow data loading
                    setTimeout(function() {
                        model.data.set('all_profits', data);
                        model.data.set('profits', [_.find(data, {
                            year: year
                        })]);

                        //set loading of model done
                        model.data.setLoadingDone("profits");
                    }, 1000);
                });
            }

            //in case it's been loaded, just grab the current year
            else if (model.data.all_profits && year != model.data.profits[0].year) {
                model.data.profits = [];
                model.data.profits.push(_.find(model.data.all_profits, {
                    year: year
                }));
            }
        }
    });

    return DataLoadingFileTime;
});