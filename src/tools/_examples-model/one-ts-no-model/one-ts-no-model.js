//Example Timeslider A
define([
    'base/tool'
], function(Tool) {


    var OneTSNoModel = Tool.extend({

        /**
         * Initialized the tool
         * @param config tool configurations, such as placeholder div
         * @param options tool options, such as state, data, etc
         */
        init: function(config, options) {

            //tool basic settings
            this.name = 'one-ts-no-model';
            this.template = 'tools/_examples-model/one-ts-no-model/one-ts-no-model';

            //instantiating components
            this.components = [{
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider-1' //div to render
            }];

            this._super(config, options);
        }
    });

    return OneTSNoModel;
});
