//Example Timeslider A
define([
    'base/tool'
], function(Tool) {

    var NoTSOneModel = Tool.extend({
        init: function(parent, options) {

            //tool basic settings
            this.name = 'no-ts-one-model';
            this.template = 'tools/_examples-model-state/no-ts-one-model/no-ts-one-model';

            //instantiating components
            this.components = [{
                component: '_examples/year-display',
                placeholder: '.vzb-year-display', //div to render
                model: ["time"]
            }];

            this._super(parent, options);
        },

        // mapping: function() {
            
        // },

        validate: function() {

        },


    });

    return NoTSOneModel;
});