//TODO: Rename postrender & resize 
define([
    'd3',
    'underscore',
    'components/component'
], function(d3, _, Component) {

    var bar_radius = 5,
        width,
        height,
        margin,
        xAxis, yAxis,
        xAxisEl, yAxisEl,
        yTitleEl,
        x, y,
        graph,
        bars,
        year;

    var BarChart = Component.extend({
        init: function(context, options) {
            this.name = 'bar-chart';
            this.template = 'components/' + this.name + '/' + this.name;

            this._super(context, options);
        },

        // After loading template, select HTML elements
        postRender: function() {

            graph = this.element.select('#graph');
            xAxisEl = graph.select('#x_axis');
            yAxisEl = graph.select('#y_axis');
            yTitleEl = graph.select('#y_axis_title');
            bars = graph.select('#bars');

            this.update();
        },


        //TODO: Optimize data binding
        update: function() {

            var range = this.model.getRange(),
                yearData = this.model.getYearData(),
                minY = this.model.getState("yaxis").min || ((this.model.getState("yaxis").scale == "log") ? range.minValue : 0),
                maxY = this.model.getState("yaxis").max || (range.maxValue + range.maxValue / 10),
                unit = this.model.getState("yaxis").unit || 1,
                indicator = this.model.getState("yaxis").indicator,
                language = this.model.getState("language"),
                indicator_name = this.model.getData().definitions[language].indicators[indicator].name;

            // Create X axis scale, X axis function and call it on element
            x = d3.scale.ordinal();
            x.domain(_.map(yearData, function(d, i) {
                return d.id;
            }));
            //TODO: Read from data manager
            xAxis = d3.svg.axis().scale(x).orient("bottom")
                .tickFormat(function(d) {
                    return d;
                });

            //xAxisEl.call(xAxis);

            // Create Y axis scale, Y axis function and call it on element
            y = (this.model.getState("yaxis").scale == "log") ? d3.scale.log() : d3.scale.linear();
            y.domain([minY, maxY])
                .range([height, 0]);

            yAxis = d3.svg.axis().scale(y).orient("left")
                .tickFormat(function(d) {
                    return d / unit;
                }).tickSize(6, 0);

            //yAxisEl.call(yAxis);
            yTitleEl.text(indicator_name);

            // Remove old bars if exist
            bars.selectAll(".bar").remove();

            // Update data bars
            bars.selectAll(".bar")
                .data(yearData)
                .enter()
                .append("path")
                .attr("class", "bar");

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
            if (this.model.getState("yaxis").scale == "log") {
                yAxis.ticks(5, '100');
            } else {
                yAxis.ticks(Math.max((Math.round(height / tick_spacing)), 2));
            }
            yAxisEl.call(yAxis);

            yTitleEl.attr("transform", "translate(10,10)");

            //Adjusting margin according to length
            var yLabels = yAxisEl.selectAll("text")[0],
                topLabel = yLabels[(yLabels.length - 1)];
            margin.left = Math.max(margin.left,(topLabel.getBBox().width+ 15));

            width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;

            // Update range of X and call X axis function on element
            x.rangeRoundBands([0, width], .1, .2);
            xAxisEl.attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            //adjust graph position
            graph.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


            // Update size of bars 
            bars.selectAll(".bar")
                .attr("d", function(d, i) {
                    return topRoundedRect(x(d.id),
                        y(d.value),
                        x.rangeBand(),
                        height - y(d.value),
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