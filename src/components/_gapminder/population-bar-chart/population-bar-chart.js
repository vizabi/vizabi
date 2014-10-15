//Population Bar Chart
define([
    'd3',
    'underscore',
    'base/component'
], function(d3, _, Component) {

    var svgEl,
        xAxisEl,
        yAxisEl,
        xScale,
        yScale,
        data,
        height,
        width;

	var PopulationBarChart = Component.extend({

		/*
         * INIT:
         * Executed once, before template loading
         */
        init: function(context, options) {
            this.name = 'population-bar-chart';
            this.template = "components/_gapminder/population-bar-chart/population-bar-chart";
            this.tool = context;
            
            this._super(context, options);
        },

        /*
         * POSTRENDER:
         * Executed after template is loaded
         * Ideally, it contains instantiations related to template
         */
        postRender: function() {
        	svgEl = this.element.select('svg');
        	xAxisEl = this.element.select('.axis.x');
        	yAxisEl = this.element.select('.axis.y');

            this.update();
        },


        /*
         * UPDATE:
         * Executed whenever data is changed
         * Ideally, it contains only operations related to data events
         */
        update: function() {
            //code here
            data = this.model.getData()[0];
            console.log(data);
        },

        /*
         * RESIZE:
         * Executed whenever the container is resized
         * Ideally, it contains only operations related to size
         */
        resize: function() {
            height = parseInt(this.element.style("height"), 10);// - margin.top - margin.bottom;
            width = parseInt(this.element.style("width"), 10);// - margin.left - margin.right;

            svgEl
                .attr("width", width)// + margin.right + margin.left)
                .attr("height", height)// + margin.top + margin.bottom)
                //.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        },


    });

    return PopulationBarChart;

});
