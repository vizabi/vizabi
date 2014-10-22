//Example Timeslider A
define([
    'base/tool'
], function(Tool) {

    var TwoTSOneModel = Tool.extend({
        init: function(parent, options) {

            //tool basic settings
            this.name = 'two-ts-one-model';
            this.template = 'tools/_examples-model-state/two-ts-one-model/two-ts-one-model';

            //instantiating components
            this.components = [{
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider-1', //div to render
                model: ["time"]
            },{
                component: '_gapminder/timeslider',
                placeholder: '.vzb-tool-timeslider-2', //div to render
                model: ["time"]
            }];

            this._super(parent, options);
        },

        // mapping: function() {
            
        // },

        validate: function() {

        },


    });

    return TwoTSOneModel;
});