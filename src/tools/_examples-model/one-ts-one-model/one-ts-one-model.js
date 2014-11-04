//Example Timeslider A
define([
    'base/tool'
], function(Tool) {


    var OneTSOneModel = Tool.extend({

        /**
         * Initialized the tool
         * @param config tool configurations, such as placeholder div
         * @param options tool options, such as state, data, etc
         */
        init: function(config, options) {

            //tool basic settings
            this.name = 'one-ts-one-model';
            this.template = 'tools/_examples-model/one-ts-one-model/one-ts-one-model';

            //instantiating components
            this.components = [{
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider-1', //div to render
                model: ["state.time"]
            }];

            this._super(config, options);
        }
    });

    return OneTSOneModel;
});