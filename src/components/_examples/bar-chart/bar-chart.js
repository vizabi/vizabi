//TODO: Rename postrender & resize 
define([
    'd3',
    'lodash',
    'base/component'
], function(d3, _, Component) {

    var BarChart = Component.extend({

        /*
         * INIT:
         * Executed once, before template loading
         */
        init: function(options, context) {
            this.name = 'bar-chart';
            this.template = 'components/_examples/' + this.name + '/' + this.name;
            this._super(options, context);
        },

        /*
         * POSTRENDER:
         * Executed after template is loaded
         * Ideally, it contains instantiations related to template
         */
        postRender: function() {

            this.graph = this.element.select('.vzb-bc-graph');
            this.yAxisEl = this.graph.select('.vzb-bc-axis-y');
            this.xAxisEl = this.graph.select('.vzb-bc-axis-x');
            this.yTitleEl = this.graph.select('.vzb-bc-axis-y-title');
            this.bars = this.graph.select('.vzb-bc-bars');
        },


        //TODO: Optimize data binding
        update: function() {
            var indicator = this.model.show.indicator,
                data = _.cloneDeep(this.model.data.getItems()),
                time = this.model.time.value,
                categories = this.model.show.geo_categories,

                data_curr_year = data.filter(function(d) {
                    return (d.time == time);
                }),

                minValue = d3.min(data, function(d) {
                    return +d[indicator];
                }),
                maxValue = d3.max(data, function(d) {
                    return +d[indicator];
                }),
                scale = this.model.show.scale,
                minY = this.model.show.min || ((scale == "log") ? minValue : 0),
                maxY = this.model.show.max || (maxValue + maxValue / 10),
                unit = this.model.show.unit || 1,
                indicator_name = indicator;

            // Create X axis scale, X axis function and call it on element
            this.x = d3.scale.ordinal();

            this.x.domain(_.map(data, function(d, i) {
                return d["geo.name"];
            }));

            this.xAxis = d3.svg.axis().scale(this.x).orient("bottom")
                .tickFormat(function(d) {
                    return d;
                });

            
            this.y = (scale == "log") ? d3.scale.log() : d3.scale.linear();
            this.y.domain([minY, maxY])
                .range([this.height, 0]);

            this.yAxis = d3.svg.axis().scale(this.y).orient("left")
                .tickFormat(function(d) {
                    return d / unit;
                }).tickSize(6, 0);

            //this.yAxisEl.call(yAxis);
            this.yTitleEl.text(indicator_name);

            // Remove old this.bars if exist
            this.bars.selectAll(".vzb-bc-bar").remove();

            // Update data this.bars
            this.bars.selectAll(".vzb-bc-bar")
                .data(data_curr_year)
                .enter()
                .append("path")
                .attr("class", "vzb-bc-bar");

            this.resize();

        },

        //draw the this.graph for the first time
        resize: function() {
            var tick_spacing = 60,
                bar_radius = 5,
                margin;

            switch (this.getLayoutProfile()) {
                case "small":
                    margin = {
                        top: 20,
                        right: 20,
                        bottom: 30,
                        left: 40
                    };
                    break;
                case "medium":
                    margin = {
                        top: 25,
                        right: 25,
                        bottom: 35,
                        left: 50
                    };
                    tick_spacing = 80;
                    break;
                case "large":
                default:
                    margin = {
                        top: 30,
                        right: 30,
                        bottom: 40,
                        left: 60
                    };
                    tick_spacing = 100;
                    break;
            }

            this.height = parseInt(this.element.style("height"), 10) - margin.top - margin.bottom;

            // Update range of Y and call Y axis function on element
            this.y.range([this.height, 0]);
            // Number of ticks
            if (this.model.show.scale == "log") {
                this.yAxis.ticks(5, '100');
            } else {
                this.yAxis.ticks(Math.max((Math.round(this.height / tick_spacing)), 2));
            }
            this.yAxisEl.call(this.yAxis);

            this.yTitleEl.attr("transform", "translate(10,10)");

            //Adjusting margin according to length
            var yLabels = this.yAxisEl.selectAll("text")[0];

            if(yLabels && yLabels.length) {
                var topLabel = yLabels[(yLabels.length - 1)];
                margin.left = Math.max(margin.left, (topLabel.getBBox().width + 15));
            }

            var width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;

            // Update range of X and call X axis function on element
            this.x.rangeRoundBands([0, width], .1, .2);
            this.xAxisEl.attr("transform", "translate(0," + this.height + ")")
                .call(this.xAxis);

            //adjust this.graph position
            this.graph.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var indicator = this.model.show.indicator;

            // Update size of this.bars 
            var _this = this;
            this.bars.selectAll(".vzb-bc-bar")
                .attr("d", function(d, i) {
                    return topRoundedRect(_this.x(d["geo.name"]),
                        _this.y(d[indicator]),
                        _this.x.rangeBand(),
                        _this.height - _this.y(d[indicator]),
                        bar_radius);
                });

        },


    });

    //draw top rounded paths
    function topRoundedRect(x, y, width, height, radius) {
        return "M" + (x + radius) + "," + y + "h" + (width - (radius * 2)) + "a" + radius + "," + radius + " 0 0 1 " + radius + "," + radius + "v" + (height - radius) + "h" + (0 - width) + "v" + (0 - (height - radius)) + "a" + radius + "," + radius + " 0 0 1 " + radius + "," + -radius + "z";
    }

    return BarChart;
});