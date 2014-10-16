//Population Bar Chart
define([
    'd3',
    'underscore',
    'base/component'
], function(d3, _, Component) {

    var profiles = {
        "small": {
            margin: {
                top: 30,
                right: 20,
                left: 40,
                bottom: 40
            },
            tick_spacing: 60,
            text_padding: 5
        },
        "medium": {
            margin: {
                top: 30,
                right: 60,
                left: 60,
                bottom: 40
            },
            tick_spacing: 80,
            text_padding: 10
        },
        "large": {
            margin: {
                top: 30,
                right: 60,
                left: 60,
                bottom: 40
            },
            tick_spacing: 100,
            text_padding: 15
        }
    };

    var svgEl,
        xAxisEl,
        yAxisEl,
        bars,
        plotEl,
        xScale,
        yScale,
        xAxis,
        yAxis,
        tick_spacing,
        data,
        height,
        width,
        selectedGroupBirthYear,
        unit = 1;

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
            plotEl = this.element.select('.plot');
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
            var _this = this;
            data = this.model.getData()[0];
            var time = this.model.getState('time');

            var oneYearData = data.filter(function(d) {
                d.age_group = parseInt(d.age_group);
                d.pop = parseFloat(d.pop);
                return d.time == time;
            })

            //AXIS
            xScale = d3.scale.linear()
                .domain([0, d3.max(oneYearData, function(d) {
                    return d.pop;
                })]);

            yScale = d3.scale.linear()
                .domain([d3.max(oneYearData, function(d) {
                    return d.age_group;
                }), 0]);


            xAxis = d3.svg.axis()
                //.tickFormat(function(d) {
                //return d;
                //})
                .tickSize(6, 0);

            yAxis = d3.svg.axis()
                //.tickFormat(function(d) {
                //return d / unit;
                //})
                .tickSize(6, 0);


            //BARS
            bars = plotEl
                .selectAll('.bar')
                .data(oneYearData, this.barId);

            bars.enter()
                .append('g')
                .attr('class', 'bar')
                .on('click', function(d) {
                    var y = parseInt(d.time) - parseInt(d.age_group);
                    _this.model.setState('selectedGroupBirthYear', y);

                    bars.classed('selected', false);
                    d3.select(this).classed('selected', true);
                })
                .append('rect');

            bars.exit().remove();

            this.updateAxis();
            this.updateBars();
        },

        /*
         * RESIZE:
         * Executed whenever the container is resized
         * Ideally, it contains only operations related to size
         */
        resize: function() {
            this.updateAxis();
            this.updateBars();
        },

        updateAxis: function() {
            margin = profiles[this.getLayoutProfile()].margin;
            tick_spacing = profiles[this.getLayoutProfile()].tick_spacing;

            height = parseInt(this.element.style("height"), 10) - margin.top - margin.bottom;
            width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;

            svgEl
                .attr("width", width + margin.right + margin.left)
                .attr("height", height + margin.top + margin.bottom)
                .select('.graph')
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            xScale.range([0, width]);
            yScale.range([0, height]);

            xAxis = xAxis.scale(xScale)
                .orient("bottom")
                .ticks(Math.max(width / tick_spacing, 2));
            yAxis = yAxis.scale(yScale)
                .orient("left")
                .ticks(Math.max(height / tick_spacing, 3));

            xAxisEl.call(xAxis);
            yAxisEl.call(yAxis);

            xAxisEl.attr("transform", "translate(0," + height + ")");

        },

        updateBars: function() {
            var barHeight = Math.max(height / bars.size(), 1);
            bars.attr('transform', function(d) {
                    return 'translate(0,' + (yScale(d.age_group) - barHeight) + ')';
                })
                .select('rect')
                .attr('height', barHeight)
                .attr('width', function(d) {
                    return xScale(d.pop);
                });

        },

        barId: function(d) {
            return parseInt(d.time) - parseInt(d.age_group);
        }

    });

    return PopulationBarChart;

});
