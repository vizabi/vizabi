define([
    'jquery',
    'd3',
    'base/component'
], function($, d3, Component) {

    var _this = null;

    // Various accessors that specify the dimensions of data to visualize
    function mean(d, indicator) {
        // TODO figure out where should the data pre-processing go
        if(indicator==null) return d.mean;
        return d[indicator];
    }

    function stdev(d, indicator) {
        // TODO figure out where should the data pre-processing go
        if(indicator==null) return Math.sqrt(d.variance);
        return d[indicator];
    }

    function peak(d, indicator) {
        // TODO figure out where should the data pre-processing go
        if(indicator==null) return d.pop;
        return d[indicator];
    }

    function key(d) {
        return d.name;
    }

    function color(d) {
        return d.region;
    }

    //constants
    var DISTRIBUTIONS_NORMAL = "normal distribution",
        DISTRIBUTIONS_LOGNORMAL = "lognormal distribution";

    // this function returns PDF values for a specified distribution
    // TODO this is in fact a universal utility function and thus it can go somewhere else
    function pdf(x, mu, sigma, type) {
        if (type==null) type = DISTRIBUTIONS_NORMAL;
        switch(type){
            case DISTRIBUTIONS_NORMAL:
            return Math.exp(
                - 0.5 * Math.log(2 * Math.PI)
                - Math.log(sigma)
                - Math.pow(x - mu, 2) / (2 * sigma * sigma)
                );

            case DISTRIBUTIONS_LOGNORMAL:
            return Math.exp(
                - 0.5 * Math.log(2 * Math.PI) - Math.log(x)
                - Math.log(sigma)
                - Math.pow(Math.log(x) - mu, 2) / (2 * sigma * sigma)
                );
        }
    };

    function log(d){console.log(d)};

    function populateDistributionsInto(d){
        // we need to generate the distributions based on mu, sigma and scale
        // we span a uniform range of 'points' across the entire X scale,
        // resolution: 1 point per pixel. If width not defined assume it equal 500px
        var rangeFrom = Math.log(_this.xScale.domain()[0]);
        var rangeTo = Math.log(_this.xScale.domain()[1]);
        var rangeStep = (rangeTo - rangeFrom)/500;//(width?500:width);

        d.points = d3.range(rangeFrom, rangeTo, rangeStep)
            .map(function(dX){
                // get Y value for every X
                return {x: Math.exp(dX),
                        y0: 0, // the initial base of areas is at zero
                        y:peak(d) * pdf(Math.exp(dX), Math.log(mean(d)), stdev(d), DISTRIBUTIONS_LOGNORMAL)}
            });
        return d;
    }



    var MountainChart = Component.extend({

        /**
        * Initializes the chart
        * @param config component configuration
        * @param context component context (parent)
        */
        init: function(config, context) {
            _this = this;
            this.name = 'mountain-chart';
            this.template = 'components/_examples/' + this.name + '/' + this.name;
            this._super(config, context);

            this.xScale = null;
            this.yScale = null;
            this.colorScale = d3.scale.category10();
            this.xAxis = d3.svg.axis();
            
            // define path generator
            this.area = d3.svg.area()
                .x(function(d) { return _this.xScale(d.x) })
                .y0(function(d) { return _this.yScale(d.y0) })
                .y1(function(d) { return _this.yScale(d.y0+d.y) });

            this.stack = d3.layout.stack()
                //.order("inside-out")
                .values(function(d) {return d.points; });

            // define sorting order: lower peaks to front for easier selection
            this.order = function order(a, b) {
                return peak(b) - peak(a);
            }
        },

        /**
         * POST RENDER
         * Executes right after the template is in place
         */
        postRender: function() {

            // reference elements
            this.graph = this.element.select('.vzb-bc-graph');
            this.xAxisEl = this.graph.select('.vzb-bc-axis-x');
            this.xTitleEl = this.graph.select('.vzb-bc-axis-x-title');
            this.yearEl = this.graph.select('.vzb-bc-year');
            this.mountains = this.graph.select('.vzb-bc-mountains');
        },


        /*
         * UPDATE:
         * Updates the component as soon as the model/models change
         * Ideally, it contains only operations related to data events
         */
        //FIXME when sliding through years, data is not changing (only year),
        // but the function is still called. is it ok?
        update: function() {
            this.indicator = this.model.show.indicator;
            this.data = this.model.data.getItems();
            this.time = this.model.time.value;
            this.stackingIsOn = this.model.show.stack;
            this.scale = this.model.show.scale;
            this.units = this.model.show.unit || [1, 1, 1];

            var minValue = this.indicator.map(function(ind) {
                    return d3.min(_this.data, function(d) {
                        return +d[ind];
                    })
                });
            var maxValue = this.indicator.map(function(ind) {
                    return d3.max(_this.data, function(d) {
                        return +d[ind];
                    })
                });

            //FIXME min and max should not really be used direclty on indicators.
            //FIXME instead they should be applied to arrays of XY points
            var min = this.scale.map(function(scale, i) {
                    return ((scale == "log") ? 1 : (minValue[i] - (maxValue[i] - minValue[i]) / 10));
                });
            var max = this.scale.map(function(scale, i) {
                    return maxValue[i] + (maxValue[i] - minValue[i]) / 10;
                });
            

            //axis
            this.yScale = d3.scale[this.scale[2]]()
                //TODO remove magic constant
                .domain([0, max[2]/6]);

            this.xScale = d3.scale[this.scale[1]]()
                //TODO remove magic constant
                .domain(this.scale[1]=="log"?[0.01,1000]:[0,20]);

            
            //mountains
            this.setYear(this.time);
            $.simpTooltip();
        },

        /*
         * RESIZE:
         * Executed whenever the container is resized
         * Ideally, it contains only operations related to size
         */
        resize: function() {
            var margin;
            var tick_spacing;

            switch (this.getLayoutProfile()) {
                case "small":
                    margin = {top: 30, right: 20, left: 20, bottom: 40};
                    tick_spacing = 60;
                    break;
                case "medium":
                    margin = {top: 30, right: 30, left: 30, bottom: 40};
                    tick_spacing = 80;
                    break;
                case "large":
                    margin = {top: 30, right: 30, left: 30, bottom: 40};
                    tick_spacing = 100;
                    break;
            };

            var height = parseInt(this.element.style("height"), 10) - margin.top - margin.bottom;
            var width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;

            //graph group is shifted according to margins (while svg element is at 100 by 100%)
            this.graph
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            //year is centered
            this.yearEl
                .attr("x", "50%")
                .attr("y", "50%")
                .attr("transform", "translate(" + (-margin.left) + ", " + (-margin.top) + ")");

            //scales are adjusted to cover width and height
            this.yScale.range([height, 0]).nice();
            this.xScale.range([0, width]).nice();

            //axis is updated
            this.xAxis.scale(this.xScale)
                .orient("bottom")
                .tickSize(6, 0)
                //FIXME: ticks() not working in log scale. why?
                .ticks(Math.max(width / tick_spacing, 2))
                .tickValues([0.1, 1, 10, 100])
                .tickFormat(function(d) {
                    if(d==0.1)return "$/day";
                    // throw away all ticks except of the few
                    if(d!=0.1&&d!=1&&d!=10&&d!=100)return "";
                    return d;
                });

            this.xAxisEl
                .attr("transform", "translate(0," + height + ")")
                .call(this.xAxis);

            //mountains
            //FIXME: cache mountains and move order somewhere else
            this.mountains.selectAll(".vzb-bc-mountain")
                .attr("d", function(d) { return _this.area(d.points); })
                .sort(this.order);
        },



        setYear: function(time) {
            this.yearEl.text(time);


            //FIXME: inefficiency of removing and then redrawing everything
            // i could not solve it because all interpolateData invokes a totally different selection
            // so everything falls into .exit() anyway and needs to .enter() again
            // need to understand how interpolateData works and why it returns something weird
            this.mountains.selectAll(".vzb-bc-mountain").remove();
            this.mountains.selectAll(".vzb-bc-mountain")
                .data(function(){
                    var result = interpolateData(_this.data, _this.indicator, time)
                        .map(function(dd){return populateDistributionsInto(dd)});

                    return _this.stackingIsOn?_this.stack(result):result;
                })
                .enter().append("path")
                .attr("class", "vzb-bc-mountain")
                .style("fill", function(d) {
                    return _this.colorScale(color(d));
                })
                .attr("data-tooltip", function(d) {
                    return d.name;
                });

            //FIXME: and then resize is being called in the end! WHYY?
            this.resize();
        }


    });

    // Interpolates the dataset for the given (fractional) year.
    function interpolateData(data, indicator, year) {

        var yearData = data.filter(function(d) {
            return (d.time == year);
        });

        return yearData.map(function(d) {
            var obj = {
                name: d["geo.name"],
                region: d["geo.region"] || "world"
            };
            indicator.forEach(function(indicator) {
                obj[indicator] = d[indicator];
            });

            return obj;
        });
    }

    //tooltip plugin (hotfix)
    //TODO: remove this plugin from here
    $.extend({
        simpTooltip: function(options) {
            var defaults = {
                position_x: -30,
                position_y: 20,
                target: "[data-tooltip]",
                extraClass: ""
            };
            options = $.extend(defaults, options);
            var targets = $(options.target);
            var xOffset = options.position_x;
            var yOffset = options.position_y;
            targets.hover(function(e) {
                var t = $(this).attr('data-tooltip');
                $("body").append("<div id='simpTooltip' class='simpTooltip " + options.extraClass + "'>" + t + "</div>");
                $("#simpTooltip").css("top", (e.pageY - xOffset) + "px").css("left", (e.pageX + yOffset) + "px").fadeIn("fast");
            }, function() {
                $("#simpTooltip").remove();
            });
            targets.mousemove(function(e) {
                $("#simpTooltip").css("top", (e.pageY + yOffset) + "px").css("left", (e.pageX + xOffset) + "px");
            });
        }
    });

    return MountainChart;
});
