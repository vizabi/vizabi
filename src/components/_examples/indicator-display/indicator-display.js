//Indicator Display
define([
    'd3',
    'underscore',
    'base/component'
], function(d3, _, Component) {

    var IndicatorDisplay = Component.extend({

		/*
         * INIT:
         * Executed once, before template loading
         */
        init: function(options, context) {
            this.name = "indicator-display";
            this.template = "components/_examples/indicator-display/indicator-display";            
            this._super(options, context);
        },

        /*
         * POSTRENDER:
         * Executed after template is loaded
         * Ideally, it contains instantiations related to template
         */
        postRender: function() {
            this.update();
        },


        /*
         * UPDATE:
         * Executed whenever data is changed
         * Ideally, it contains only operations related to data events
         */
        update: function() {
            var indicator = this.model.getState("indicator"),
                countries = this.model.getData()[0],
                year = this.model.getState("time");
            
            var countriesCurr = countries.filter(function(d) {
                return (d.time == year);
            });

            this.element.selectAll("p").remove();

            this.element.selectAll("p")
                .data(countriesCurr)
                .enter()
                .append("p");
            
            this.resize(); 
                
        },

        /*
         * RESIZE:
         * Executed whenever the container is resized
         * Ideally, it contains only operations related to size
         */
        resize: function() {
            var indicator = this.model.getState("indicator");

            if (this.getLayoutProfile() === 'small') {
                this.element.selectAll("p")
                .text(function(d) {
                    return d["geo.name"] + ": " + Math.round(d[indicator] / 100000) / 10 + " M"; 
                });
            }
            else {
                this.element.selectAll("p")
                .text(function(d) {
                    return d["geo.name"] + ": " + d[indicator]; 
                });
            }
        },


    });

    return IndicatorDisplay;

});