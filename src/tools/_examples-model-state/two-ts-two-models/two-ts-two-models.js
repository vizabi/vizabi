//Example Timeslider A
define([
    'base/tool'
], function(Tool) {

    var TwoTSOneModel = Tool.extend({
        init: function(config, options) {

            //tool basic settings
            this.name = 'two-ts-two-models';
            this.template = 'tools/_examples-model-state/two-ts-two-models/two-ts-two-models';

            //instantiating components
            this.components = [{
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider-1', //div to render
                model: ["state.time"]
            },{
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider-2', //div to render
                model: ["state.time_2"]
            }];

            this._super(config, options);
        }


    });

    return TwoTSOneModel;
});