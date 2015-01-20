//TODO: refactor hardcoded dates //former FIXME
//TODO: remove date formatting from here //former FIXME

define([
    'lodash',
    'd3',
    'base/tool'
], function(_, d3, Tool) {

    var axisLabelerDemo = Tool.extend({
        /**
         * Initialized the tool
         * @param config tool configurations, such as placeholder div
         * @param options tool options, such as state, data, etc
         */
        init: function(config, options) {

            this.name = 'axis-labeler';
            this.template = "tools/_examples/axis-labeler/axis-labeler";

            //instantiating components
            this.components = [ {
                component: '_examples/axis-labeler',
                placeholder: '.vzb-tool-viz', //div to render
                model: ["state.scales"]
            }];

            this._super(config, options);

        },

        /**
         * Validating the tool model
         * @param model the current tool model to be validated
         */
        toolModelValidation: function(model) {}
    });

    return axisLabelerDemo;
});
