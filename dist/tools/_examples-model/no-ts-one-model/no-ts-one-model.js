//Example Timeslider A
define([
    'base/tool'
], function(Tool) {

    var NoTSOneModel = Tool.extend({

        /**
         * Initialized the tool
         * @param config tool configurations, such as placeholder div
         * @param options tool options, such as state, data, etc
         */
        init: function(config, options) {

            //tool basic settings
            this.name = 'no-ts-one-model';
            this.template = 'tools/_examples-model/no-ts-one-model/no-ts-one-model';

            //instantiating components
            this.components = [{
                component: '_examples/year-display',
                placeholder: '.vzb-year-display-wrapper', //div to render
                model: ["state.time"]
            }];

            this._super(config, options);
        }
    });

    return NoTSOneModel;
});
