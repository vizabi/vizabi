//Year Display
define([
    'd3',
    'lodash',
    'base/component',
    'base/utils'
], function(d3, _, Component, utils) {


    var YearDisplay = Component.extend({

		/*
         * INIT:
         * Executed once, before template loading
         */
        init: function(options, context) {
            this.name = "year-display";
            this.template = "components/_examples/year-display/year-display";

            //define expected models for this component
            this.model_expects = [{
                name: "time",
                type: "time"
            }];

            this._super(options, context);
        },

        /*
         * domReady:
         * Executed after template is loaded
         * Ideally, it contains instantiations related to template
         */
        domReady: function() {

        },

        /*
         * modelReady:
         * Executed whenever data is changed
         * Ideally, it contains only operations related to data events
         */
        modelReady: function() {
            var time = this.model.time.getFormatted(); //gets formatted year
            this.element.html(time);
        },

        /*
         * RESIZE:
         * Executed whenever the container is resized
         * Ideally, it contains only operations related to size
         */
        resize: function() {
            //code here
        }


    });

    return YearDisplay;

});
