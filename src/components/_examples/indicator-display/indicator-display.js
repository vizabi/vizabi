//Indicator Display
define([
    'd3',
    'lodash',
    'base/utils',
    'base/component'
], function(d3, _, utils, Component) {

    var IndicatorDisplay = Component.extend({

		/*
         * INIT:
         * Executed once, before template loading
         */
        init: function(options, context) {
            this.name = "indicator-display";
            this.template = "components/_examples/indicator-display/indicator-display";

            //define expected models for this component
            this.model_expects = ["rows", "time"];

            this._super(options, context);
        },

        /*
         * POSTRENDER:
         * Executed after template is loaded
         * Ideally, it contains instantiations related to template
         */
        postRender: function() {

        },


        /*
         * UPDATE:
         * Executed whenever data is changed
         * Ideally, it contains only operations related to data events
         */
        update: function() {
            var indicator = this.model.show.indicator,
                time = parseInt(d3.time.format("%Y")(this.model.time.value),10),
                rows = this.model.rows.getItems(),
                countriesCurr = [];

            countriesCurr = _.filter(countries, function(d) {
                    return (d.time == time);
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
            var indicator = this.model.show.indicator;

            if (this.getLayoutProfile() === 'small' && indicator === 'pop') {
                this.element.selectAll("p")
                    .text(function(d) {
                        return d["geo.name"] + ": " + Math.round(d[indicator] / 100000) / 10 + " M";
                    });
            } else if (indicator === 'pop') {
                this.element.selectAll("p")
                    .text(function(d) {
                        return d["geo.name"] + ": " + Math.round(d[indicator]).toLocaleString();
                    });
            }
            else  {
                this.element.selectAll("p")
                    .text(function(d) {
                        return d["geo.name"] + ": " + d[indicator].toLocaleString();
                    });
            }
        },


    });

    return IndicatorDisplay;

});
