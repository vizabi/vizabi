define([
    'jquery',
    'd3',
    'base/component'
], function($, d3, Component) {

    var DURATION_FAST = 100; //ms
    
    function order(a, b) {
        return radius(b) - radius(a);
    }
    
    function radius(d, indicator){
        return d.pop;
    }

    
    
    var BubbleChart = Component.extend({
        init: function(context, options) {
            var _this = this;
            this.name = 'bubble-chart';
            this.template = 'components/_examples/' + this.name + '/' + this.name;
            this.tool = context;
            this._super(context, options);

            this.xScale = null;
            this.yScale = null;
            this.rScale = null;
            this.cScale = d3.scale.category10();

            this.xAxis = d3.svg.axis();
            this.yAxis = d3.svg.axis();
            
            this.isDataPreprocessed = false;            
        },

        
        /**
         * POST RENDER
         * Executes right after the template is in place
         */
        postRender: function() {

            // reference elements
            this.graph = this.element.select('.vzb-bc-graph');
            this.yAxisEl = this.graph.select('.vzb-bc-axis-y');
            this.xAxisEl = this.graph.select('.vzb-bc-axis-x');
            this.yTitleEl = this.graph.select('.vzb-bc-axis-y-title');
            this.xTitleEl = this.graph.select('.vzb-bc-axis-x-title');
            this.yearEl = this.graph.select('.vzb-bc-year');
            this.bubbleContainer = this.graph.select('.vzb-bc-bubbles');
            this.bubbles = null;
        },


        /*
         * UPDATE:
         * Updates the component as soon as the model/models change
         */
        update: function() {
            //TODO: preprocessing should go somewhere else, when the data is loaded
            var _this = this;
            if(!this.isDataPreprocessed){                  
                _this.model.data.getItems().forEach(function(d){
                    d.name = d["geo.name"]; 
                    d.region = d["geo.region"] || "world";
                    _this.model.show.indicator.forEach(function(ind) { d[ind] = +d[ind]; });
                });
                this.isDataPreprocessed = true;
            }
            
            this.data = this.model.data.getItems();
            this.indicator = this.model.show.indicator;
            this.scale = this.model.show.scale;
            this.units = this.model.show.unit || [1, 1, 1];
            this.time = parseInt(d3.time.format("%Y")(this.model.time.value),10);
            
            //TODO: #32 run only if data or show models changed
            this.updateShow();
            //TODO: #32 run only if data or time models changed
            this.updateTime();
            //TODO: #32 run only on resize or on init
            this.resize();
        },
        
        
        /*
         * UPDATE SHOW:
         * Ideally should only update when show parameters change or data changes
         */
        updateShow: function(){
            var _this = this;
            
            var minValue = this.indicator.map(function(ind) {
                    return d3.min(_this.data, function(d) {
                        return +d[ind];
                    });
                });
            var maxValue = this.indicator.map(function(ind) {
                    return d3.max(_this.data, function(d) {
                        return +d[ind];
                    });
                });

            //10% difference margin in min and max
            var min = this.scale.map(function(scale, i) {
                    return ((scale === "log") ? 1 : (minValue[i] - (maxValue[i] - minValue[i]) / 10));
                });
            var max = this.scale.map(function(scale, i) {
                    return maxValue[i] + (maxValue[i] - minValue[i]) / 10;
                });

            //scales
            this.yScale = d3.scale[this.scale[0]]()
                .domain([min[0], max[0]]);
            
            this.xScale = d3.scale[this.scale[1]]()
                .domain([min[1], max[1]]);
            
            this.rScale = d3.scale[this.scale[2]]()
                .domain([0, max[2]]);

            this.yAxis.tickFormat(function (d) {
                return d / _this.units[0];
            });
            this.xAxis.tickFormat(function (d) {
                return d / _this.units[1];
            });
            
            $.simpTooltip();
        },
        
                
        /*
         * UPDATE TIME:
         * Ideally should only update when time or data changes
         */
        updateTime: function(){
            var _this = this;

            this.yearEl.text(this.time);
            this.bubbles = this.bubbleContainer.selectAll('.vzb-bc-bubble')
                .data(this.data.filter(function(d){return (+d.time === _this.time);}));
        },
        
        
        /*
         * REDRAW DATA POINTS:
         * Here plotting happens
         */     
        redrawDataPoints: function() {
            var _this = this;

            //exit selection
            this.bubbles.exit().remove();
            
            //enter selection -- init circles
            this.bubbles.enter().append("circle")            
                .attr("class", "vzb-bc-bubble")
                .style("fill", function(d) {
                    return _this.cScale(d.region);
                })
                .attr("data-tooltip", function(d) {
                    return d.name;
                });
            
            //update selection
            var speed = this.model.time.speed;
            this.bubbles.transition().duration(speed).ease("linear")            
                .attr("cy", function(d) {
                    return _this.yScale(d[_this.indicator[0]]);
                })
                .attr("cx", function(d) {
                    return _this.xScale(d[_this.indicator[1]]);
                })
                .attr("r", function(d) {
                    return _this.rScale(d[_this.indicator[2]] || 1);
                });
        },
        

        /*
         * RESIZE:
         * Executed whenever the container is resized
         */
        resize: function() {
            var _this = this;
            var margin;
            var tick_spacing;
            var maxRadius;

            switch (this.getLayoutProfile()) {
                case "small":
                    margin = {top: 30, right: 20, left: 40, bottom: 40};
                    tick_spacing = 60;
                    maxRadius = 30;
                    break;
                case "medium":
                    margin = {top: 30, right: 60, left: 60, bottom: 40};
                    tick_spacing = 80;
                    maxRadius = 30;
                    break;
                case "large":
                    margin = {top: 30, right: 60, left: 60, bottom: 40};
                    tick_spacing = 100;
                    maxRadius = 50;
                    break;
            }

            //stage
            var height = parseInt(this.element.style("height"), 10) - margin.top - margin.bottom;
            var width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;

            //graph group is shifted according to margins (while svg element is at 100 by 100%)
            this.graph
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            //center year 
            var widthAxisY = this.yAxisEl[0][0].getBBox().width;
            var heightAxisX = this.xAxisEl[0][0].getBBox().height;
            this.yearEl
                .attr("x", "50%")
                .attr("y", "50%")
                .attr("transform", "translate(" + (-1 * widthAxisY) + ", " + (heightAxisX) + ")");

            //update scales to the new range
            this.yScale.range([height, 0]).nice();
            this.xScale.range([0, width]).nice();
            this.rScale.range([1, maxRadius]);

            //apply scales to axes and redraw
            this.yAxis.scale(this.yScale)
                .orient("left")
                .tickSize(6, 0)
                .ticks(Math.max(height / tick_spacing, 2));

            this.xAxis.scale(this.xScale)
                .orient("bottom")
                .tickSize(6, 0)
                .ticks(Math.max(width / tick_spacing, 2));

            this.xAxisEl.attr("transform", "translate(0," + height + ")");

            this.yAxisEl.call(this.yAxis);
            this.xAxisEl.call(this.xAxis);

            this.redrawDataPoints();
        }

    });

    
    

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

    return BubbleChart;
});
