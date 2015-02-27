define([
    'jquery',
    'd3',
    'base/component'
], function($, d3, Component) {

    function order(a, b) {
        return radius(b) - radius(a);
    }

    function radius(d, indicator) {
        return d.pop;
    }
    
    function radiusToArea(r){return r*r*Math.PI}
    function areaToRadius(a){return Math.sqrt(a/Math.PI)}

    var BubbleChart = Component.extend({
        init: function(context, options) {
            var _this = this;
            this.name = 'bubble-chart';
            this.template = 'components/_examples/' + this.name + '/' + this.name;

            //define expected models for this component
            this.model_expects = [{
                name: "time",
                type: "time"
            }, {
                name: "entities",
                type: "entities"
            }, {
                name: "marker",
                type: "model"
            }, {
                name: "language",
                type: "language"
            }];

            this.model_binds = {
                "change": function(evt) {
                    //if it's not about time
                    if(evt.indexOf('change:time') === -1) {
                        console.log("bubble chart: CHANGE " + evt)
                    }
                },
                "ready":  function(evt) {
                    console.log("bubble chart: READY")
                    
                    _this.preprocessData();
                    _this.updateShow();
                    
                    _this.updateTime();
                    _this.updateSize();
                    _this.redrawDataPoints();
                },
                'change:time:value': function() {
                    console.log("bubble chart: NEW TIME");
                    _this.updateTime();
                    _this.redrawDataPoints();
                }
            }

            this._super(context, options);

            this.xScale = null;
            this.yScale = null;
            this.sScale = null;
            this.cScale = d3.scale.category10();

            this.xAxis = d3.svg.axisSmart();
            this.yAxis = d3.svg.axisSmart();

            this.isDataPreprocessed = false;
            this.timeUpdatedOnce = false;
            this.sizeUpdatedOnce = false;

        },


        /**
         * Executes right after the template is in place
         */
        domReady: function() {
            var _this = this;

            // reference elements
            this.graph = this.element.select('.vzb-bc-graph');
            this.yAxisEl = this.graph.select('.vzb-bc-axis-y');
            this.xAxisEl = this.graph.select('.vzb-bc-axis-x');
            this.yTitleEl = this.graph.select('.vzb-bc-axis-y-title');
            this.xTitleEl = this.graph.select('.vzb-bc-axis-x-title');
            this.sTitleEl = this.graph.select('.vzb-bc-axis-s-title');
            this.cTitleEl = this.graph.select('.vzb-bc-axis-c-title');
            this.yearEl = this.graph.select('.vzb-bc-year');
            this.bubbleContainer = this.graph.select('.vzb-bc-bubbles');
            this.bubbles = null;
            this.tooltip = this.element.select('.vzb-tooltip');

            //component events
            this.on("resize", function() {
                console.log("bubble chart: RESIZE");
                _this.updateSize();
                _this.updateTime();
                _this.redrawDataPoints();
            })

        },
        
        preprocessData: function(){
            this.model.marker.label.getItems().forEach(function(d) {
                d["geo.region"] = d["geo.region"] || "world";
            });
            this.isDataPreprocessed = true;
        },


        /*
         * UPDATE SHOW:
         * Ideally should only update when show parameters change or data changes
         */
        updateShow: function() {
            
            if (!this.isDataPreprocessed) this.preprocessData();
            
            this.translator = this.model.language.getTFunction();
            
            
            var titleStringY = this.translator("indicator/" + this.model.marker.axis_y.value);
            var titleStringX = this.translator("indicator/" + this.model.marker.axis_x.value);
            var titleStringS = this.translator("indicator/" + this.model.marker.size.value);
            var titleStringC = this.translator("indicator/" + this.model.marker.color.value);
                
            var yTitle = this.yTitleEl.selectAll("text").data([0]);
            yTitle.enter().append("text");
            yTitle
                .attr("y", "-6px")
                .attr("x", "-9px")
                .attr("dx", "-0.72em")
                .text(titleStringY);
            
            var xTitle = this.xTitleEl.selectAll("text").data([0]);
            xTitle.enter().append("text");
            xTitle
                .attr("text-anchor", "end")
                .attr("y", "-0.32em")
                .text(titleStringX);
            
            var sTitle = this.sTitleEl.selectAll("text").data([0]);
            sTitle.enter().append("text");
            sTitle
                .attr("text-anchor", "end")
                .text(this.translator("buttons/size") + ": " + titleStringS + ", " + 
                      this.translator("buttons/colors") + ": " + titleStringC );
            
            


            //scales
            this.yScale = this.model.marker.axis_y.getDomain();
            this.xScale = this.model.marker.axis_x.getDomain();
            this.sScale = this.model.marker.size.getDomain();

            var _this = this;
            this.yAxis.tickFormat(function(d) {
                return _this.model.marker.axis_y.getTick(d);
            });
            this.xAxis.tickFormat(function(d) {
                return _this.model.marker.axis_x.getTick(d);
            });

        },


        /*
         * UPDATE TIME:
         * Ideally should only update when time or data changes
         */
        updateTime: function() {
            var _this = this;
            //TLDR
            //this.time = parseInt(d3.time.format(this.model.time.formatInput)(this.model.time.value), 10);
            this.time = this.model.time.value;
            
            this.data = this.model.marker.label.getItems({ time: this.time });
            
            
            this.yearEl.text(this.time.getFullYear().toString());
            this.bubbles = this.bubbleContainer.selectAll('.vzb-bc-bubble')
                .data(this.data);
            
            this.timeUpdatedOnce = true;
        },

        /*
         * RESIZE:
         * Executed whenever the container is resized
         */
        updateSize: function() {


            var _this = this,
                margin,
                tick_spacing,
                maxRadius,
                minRadius,
                padding = 2;

            switch (this.getLayoutProfile()) {
                case "small":
                    margin = {top: 30, right: 20, left: 40, bottom: 40};
                    tick_spacing = 60;
                    maxRadius = 40;
                    break;
                case "medium":
                    margin = {top: 30, right: 60, left: 60, bottom: 40};
                    tick_spacing = 80;
                    maxRadius = 60;
                    break;
                case "large":
                    margin = {top: 30, right: 60, left: 60, bottom: 40};
                    tick_spacing = 100;
                    maxRadius = 80;
                    break;
            }

            minRadius = maxRadius * this.model.marker.size.min;
            maxRadius = maxRadius * this.model.marker.size.max;

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
            if (this.model.marker.axis_y.scale !== "ordinal") {
                this.yScale.range([height, 0]);
            } else {
                this.yScale.rangePoints([height, 0], padding).range();
            }
            if (this.model.marker.axis_x.scale !== "ordinal") {
                this.xScale.range([0, width]);
            } else {
                this.xScale.rangePoints([0, width], padding).range();
            }
            if (this.model.marker.size.scale !== "ordinal") {
                this.sScale.range([radiusToArea(minRadius), radiusToArea(maxRadius)]);
            } else {
                this.sScale.rangePoints([radiusToArea(minRadius), radiusToArea(maxRadius)], 0).range();
            }

            //apply scales to axes and redraw
            this.yAxis.scale(this.yScale)
                .orient("left")
                .tickSize(6, 0)
                .tickSizeMinor(3, 0)
                .labelerOptions({
                    scaleType: this.model.marker.axis_y.scale,
                    toolMargin: margin
                });

            this.xAxis.scale(this.xScale)
                .orient("bottom")
                .tickSize(6, 0)
                .tickSizeMinor(3, 0)
                .labelerOptions({
                    scaleType: this.model.marker.axis_x.scale,
                    toolMargin: margin
                });

            this.xAxisEl.attr("transform", "translate(0," + height + ")");
            this.xTitleEl.attr("transform", "translate("+ width +"," + height + ")");
            this.sTitleEl.attr("transform", "translate("+ width +"," + 0 + ") rotate(-90)");
            
            this.yAxisEl.call(this.yAxis);
            this.xAxisEl.call(this.xAxis);

            this.sizeUpdatedOnce = true;
        },

        /*
         * REDRAW DATA POINTS:
         * Here plotting happens
         */
        redrawDataPoints: function() {            
            var _this = this;
            if(!this.timeUpdatedOnce) this.updateTime();
            if(!this.sizeUpdatedOnce) this.updateSize();

            //exit selection
            this.bubbles.exit().remove();

            //enter selection -- init circles
            this.bubbles.enter().append("circle")
                .attr("class", "vzb-bc-bubble");

            //update selection
            var speed = (this.model.time.playing) ? this.model.time.speed : 0;

            var some_selected = (_this.model.entities.select.length > 0);

            this.bubbles
                .style("fill", function(d) {
                    return _this.model.marker.color.getValue(d)||this.model.marker.color.domain[0];
                })
                .transition().duration(speed).ease("linear")
                .attr("cy", function(d) {
                    var value = _this.model.marker.axis_y.getValue(d)||_this.yScale.domain()[0];
                    return _this.yScale(value);
                })
                .attr("cx", function(d) {
                    var value = _this.model.marker.axis_x.getValue(d)||_this.xScale.domain()[0];
                    return _this.xScale(value);
                })
                .attr("r", function(d) {
                    var value = _this.model.marker.size.getValue(d)||_this.sScale.domain()[0];
                    return areaToRadius(_this.sScale(value));
                });

            this.bubbles.classed("vzb-bc-selected", function(d) {
                    return some_selected && _this.model.entities.isSelected(d)
                })
            this.bubbles.classed("vzb-bc-unselected", function(d) {
                    return some_selected && !_this.model.entities.isSelected(d)
                });

            /* TOOLTIP */
            //TODO: improve tooltip
            this.bubbles.on("mousemove", function(d, i) {
                    var mouse = d3.mouse(_this.graph.node()).map(function(d) {
                        return parseInt(d);
                    });

                    //position tooltip
                    _this.tooltip.classed("vzb-hidden", false)
                        .attr("style", "left:" + (mouse[0] + 50) + "px;top:" + (mouse[1] + 50) + "px")
                        .html(_this.model.marker.label.getValue(d));

                })
                .on("mouseout", function(d, i) {
                    _this.tooltip.classed("vzb-hidden", true);
                })
                .on("click", function(d, i) {
                    _this.model.entities.selectEntity(d);
                });
        }

    });

    return BubbleChart;
});
