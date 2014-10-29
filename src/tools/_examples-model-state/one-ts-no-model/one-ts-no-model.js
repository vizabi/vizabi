//Example Timeslider A
define([
    'base/tool'
], function(Tool) {


    var OneTSNoModel = Tool.extend({
        init: function(options) {

            //tool basic settings
            this.name = 'one-ts-no-model';
            this.template = 'tools/_examples-model-state/one-ts-no-model/one-ts-no-model';

            //instantiating components
            this.components = [{
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider-1', //div to render
            }];

            this._super(options);
        },

        validate: function() {

        },


    });

    return OneTSNoModel;
});