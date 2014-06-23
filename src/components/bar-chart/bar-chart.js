//TODO: make this more readable
define([
    'd3',
    'underscore',
    'components/component'
], function(d3, _, Component) {

    var width,
        height,
        margin = {
            top: 20,
            right: 20,
            bottom: 30,
            left: 40
        },
        bar_radius = 5,
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

        //what to do after we load template
        postRender: function() {

            var _this = this;
            var range = this.model.getRange();
            var yearData = this.model.getYearData();

            //HTML elements
            graph = _this.element.select('#graph');
            xAxisEl = graph.select('#x_axis');
            yAxisEl = graph.select('#y_axis');
            yTitleEl = graph.select('#y_axis_title');
            bars = graph.select('#bars');

            //Scales and Axis
            x = d3.scale.ordinal();
            y = (this.model.getState("yaxis").scale == "log") ? d3.scale.log() : d3.scale.linear();
            xAxis = d3.svg.axis().scale(x).orient("bottom");
            yAxis = d3.svg.axis().scale(y).orient("left");


            //Y Domain 
            var maxY = this.model.getState("yaxis").max || (range.maxValue + range.maxValue / 10);
            var minY = this.model.getState("yaxis").min || ((this.model.getState("yaxis").scale == "log") ? range.minValue : 0);
            y.domain([minY, maxY]);

            var unit = this.model.getState("yaxis").unit || 1;
            //Y tick format
            yAxis.tickFormat(function(d) {
                return d / unit;
            }).tickSize(6, 0);

            yAxisEl.call(yAxis);

            //TODO: Using yaxis, language and waffle path here is messy
            var indicator = this.model.getState("yaxis").indicator,
                language = this.model.getState("language"),
                indicator_name = this.model.getData("waffle-" + language + ".json").definitions.indicators[indicator].name;

            yTitleEl.text(indicator_name)
                .attr("transform", "translate(10,10)");

            //X Domain
            x.domain(_.map(yearData, function(d, i) {
                return d.id;
            }));

            //X tick format
            xAxis.tickFormat(function(d) {
                return _this.model.getData("things")[d].name;
            }).tickSize(6, 0);

            //Actual data
            bars.selectAll(".bar")
                .data(yearData)
                .enter()
                .append("path")
                .attr("class", "bar");
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


            width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;
            height = parseInt(this.element.style("height"), 10) - margin.top - margin.bottom;

            x.rangeRoundBands([0, width], .1, .2);
            y.range([height, 0]);

            //number of ticks
            if(this.model.getState("yaxis").scale == "log") {
                yAxis.ticks(5, '100');
            } else {
                yAxis.ticks(Math.max((Math.round(height/tick_spacing)), 2));
            }

            //graph
            graph.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            //axes
            xAxisEl.attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            yAxisEl.call(yAxis);

            bars.selectAll(".bar")
                .attr("d", function(d, i) {
                    return topRoundedRect(x(d.id),
                        y(d.value),
                        x.rangeBand(),
                        height - y(d.value),
                        bar_radius);
                });

        },

        //TODO: optimize data binding
        update: function() {

            var range = this.model.getRange();
            var yearData = this.model.getYearData();

            x.domain(_.map(yearData, function(d, i) {
                return d.id;
            }));

            //TODO: read from data manager
            xAxis.tickFormat(function(d) {
                return d;
            });

            xAxisEl.call(xAxis);

            //Scales and Axis
            y = (this.model.getState("yaxis").scale == "log") ? d3.scale.log() : d3.scale.linear();
            yAxis = d3.svg.axis().scale(y).orient("left");

            //Y Domain 
            var maxY = this.model.getState("yaxis").max || (range.maxValue + range.maxValue / 10);
            var minY = this.model.getState("yaxis").min || ((this.model.getState("yaxis").scale == "log") ? range.minValue : 0);
            y.domain([minY, maxY]);

            y.range([height, 0]);

            //Y tick format
            var unit = this.model.getState("yaxis").unit || 1;
            //Y tick format
            yAxis.tickFormat(function(d) {
                return d / unit;
            }).tickSize(6, 0);

            yAxisEl.call(yAxis);

            //TODO: Using yaxis, language and waffle path here is messy
            var indicator = this.model.getState("yaxis").indicator,
                language = this.model.getState("language"),
                indicator_name = this.model.getData("waffle-" + language + ".json").definitions.indicators[indicator].name;

            yTitleEl.text(indicator_name);


            //remove old bars
            bars.selectAll(".bar").remove();

            //update data bars
            bars.selectAll(".bar")
                .data(yearData)
                .enter()
            // .append("rect")
            .append("path")
                .attr("class", "bar")
                .attr("d", function(d, i) {
                    return topRoundedRect(x(d.id),
                        y(d.value),
                        x.rangeBand(),
                        height - y(d.value),
                        bar_radius);
                });

            this.resize();

        },

        //load barchart data

    });

    //draw top rounded paths

    function topRoundedRect(x, y, width, height, radius) {
        return "M" + (x + radius) + "," + y + "h" + (width - (radius * 2)) + "a" + radius + "," + radius + " 0 0 1 " + radius + "," + radius + "v" + (height - radius) + "h" + (0 - width) + "v" + (0 - (height - radius)) + "a" + radius + "," + radius + " 0 0 1 " + radius + "," + -radius + "z";
    }

    return BarChart;
});