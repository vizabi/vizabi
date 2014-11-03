//Example Timeslider A
define([
    'base/tool'
], function(Tool) {


    var OneTSOneModel = Tool.extend({
        init: function(config, options) {

            //tool basic settings
            this.name = 'one-ts-one-model';
            this.template = 'tools/_examples-model-state/one-ts-one-model/one-ts-one-model';

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