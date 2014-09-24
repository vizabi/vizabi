//TODO: Rename postrender & resize 
define([
    'd3',
    'underscore',
    'base/component'
], function(d3, _, Component) {

    var width,
        height,
        margin,
        xAxis, yAxis,
        xAxisEl, yAxisEl,
        yTitleEl,
        x, y,
        graph,
        lines,
        year;

    var BarChart = Component.extend({
        init: function(context, options) {
            this.name = 'line-chart';
            this.template = 'components/' + this.name + '/' + this.name;
            this.tool = context;
            this._super(context, options);
        },

        // After loading template, select HTML elements
        postRender: function() {

            graph = this.element.select('#graph');
            xAxisEl = graph.select('#x_axis');
            yAxisEl = graph.select('#y_axis');
            yTitleEl = graph.select('#y_axis_title');
            lines = graph.select('#lines');

            this.update();
        },


        //TODO: Optimize data binding
        update: function() {
            var indicator = this.model.getState("indicator"),
                data = this.model.getData()[0],
                year = this.model.getState("time"),
                categories = this.model.getState("show")["geo.categories"],
                data_curr_year = data.filter(function(row) {
                    return (row.time == year);
                }),
                minValue = d3.min(data, function(d) {
                    return +d[indicator];
                }),
                maxValue = d3.max(data, function(d) {
                    return +d[indicator];
                }),
                scale = this.model.getState("scale"),
                minY = this.model.getState("min") || ((scale == "log") ? minValue : 0),
                maxY = this.model.getState("max") || (maxValue + maxValue / 10),
                unit = this.model.getState("unit") || 1,
                indicator_name = indicator;
            // Create X axis scale, X axis function and call it on element
            x = d3.scale.ordinal();

            x.domain(_.map(data, function(d, i) {
                return d["geo.name"];
            }));

            //TODO: Read from data manager
            xAxis = d3.svg.axis().scale(x).orient("bottom")
                .tickFormat(function(d) {
                    return d;
                });

            
            // Create Y axis scale, Y axis function and call it on element
            y = (scale == "log") ? d3.scale.log() : d3.scale.linear();
            y.domain([minY, maxY])
                .range([height, 0]);

            yAxis = d3.svg.axis().scale(y).orient("left")
                .tickFormat(function(d) {
                    return d / unit;
                }).tickSize(6, 0);

            //yAxisEl.call(yAxis);
            yTitleEl.text(indicator_name);

            // Remove old lines if exist
            lines.selectAll(".line").remove();

            // Update data lines
            lines.selectAll(".line")
                .data(data_curr_year)
                .enter()
                .append("path")
                .attr("class", "line");

            this.resize();

        },

        //draw the graph for the first time
        resize: function() {
            var tick_spacing = 60;

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

            height = parseInt(this.element.style("height"), 10) - margin.top - margin.bottom;

            // Update range of Y and call Y axis function on element
            y.range([height, 0]);
            // Number of ticks
            if (this.model.getState("scale") == "log") {
                yAxis.ticks(5, '100');
            } else {
                yAxis.ticks(Math.max((Math.round(height / tick_spacing)), 2));
            }
            yAxisEl.call(yAxis);

            yTitleEl.attr("transform", "translate(10,10)");

            //Adjusting margin according to length
            var yLabels = yAxisEl.selectAll("text")[0],
                topLabel = yLabels[(yLabels.length - 1)];
            margin.left = Math.max(margin.left, (topLabel.getBBox().width + 15));

            width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;

            xAxisEl.attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            //adjust graph position
            graph.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var indicator = this.model.getState("indicator");

        },


    });



    return BarChart;
});