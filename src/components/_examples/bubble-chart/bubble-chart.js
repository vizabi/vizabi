define([
    'd3',
    'base/component'
], function(d3, Component) {

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
                "change:entities:show": function(evt) {
                    _this.updateShow();
                    _this.updateTime();
                    _this.updateSize();
                    _this.redrawDataPoints();
                },
                "change:entities:select": function() {
                    _this.selectDataPoints();
                },
                "ready":  function(evt) {
                    _this.updateShow();
                    _this.updateTime();
                    _this.updateSize();
                    _this.redrawDataPoints();
                },
                'change:time:value': function() {
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
                //console.log("bubble chart: RESIZE");
                _this.updateSize();
                _this.updateTime();
                _this.redrawDataPoints();
            })

        },


        /*
         * UPDATE SHOW:
         * Ideally should only update when show parameters change or data changes
         */
        updateShow: function() {
            
            this.duration = this.model.time.speed;
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
            
            
            // get array of GEOs, sorted by the size hook
            // that makes larger bubbles go behind the smaller ones
            this.data = this.model.marker.label.getItems({ time: _this.model.time.end })
                .sort(function(a,b){
                    var valueA = _this.model.marker.size.getValue(a)||_this.sScale.domain()[0];
                    var valueB = _this.model.marker.size.getValue(b)||_this.sScale.domain()[0];
                    return _this.sScale(valueB) - _this.sScale(valueA);                
                });

        },


        /*
         * UPDATE TIME:
         * Ideally should only update when time or data changes
         */
        updateTime: function() {
            var _this = this;
            
            this.time_1 = this.time==null? this.model.time.value : this.time;
            this.time = this.model.time.value;
            this.duration = this.model.time.playing && (this.time-this.time_1>0) ? this.model.time.speed : 0;
            
            //this.data = this.model.marker.label.getItems({ time: this.time });
            
            this.yearEl.text(this.time.getFullYear().toString());
            this.bubbles = this.bubbleContainer.selectAll('.vzb-bc-bubble')
                .data(this.data.map(function(d){d.time = _this.time; return d}));
            
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
                    minRadius = 2;
                    maxRadius = 40;
                    break;
                case "medium":
                    margin = {top: 30, right: 60, left: 60, bottom: 40};
                    tick_spacing = 80;
                    minRadius = 3;
                    maxRadius = 60;
                    break;
                case "large":
                    margin = {top: 30, right: 60, left: 60, bottom: 40};
                    tick_spacing = 100;
                    minRadius = 4;
                    maxRadius = 80;
                    break;
            }

            minRadius = Math.max(maxRadius * this.model.marker.size.min, minRadius);
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
                    toolMargin: margin,
                    limitMaxTickNumber: 6 
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

            var shape = this.model.marker.shape;
            
            //exit selection
            this.bubbles.exit().remove();

            //enter selection -- init circles
            this.bubbles.enter().append(shape)
                .attr("class", "vzb-bc-bubble")
                .on("mousemove", function(d, i) {
                    //TODO: improve tooltip
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
                        
            
            //update selection

            switch (shape){
                case "circle":
                this.bubbles.each(function(d){
                    var view = d3.select(this);
                    var valueY = _this.model.marker.axis_y.getValue(d);
                    var valueX = _this.model.marker.axis_x.getValue(d);
                    var valueR = _this.model.marker.size.getValue(d);
                    
                    if(valueY==null || valueX==null || valueR==null) {
                        view.classed("vzb-transparent", true)
                    }else{
                        view.classed("vzb-transparent", false)
                            .style("fill", _this.model.marker.color.getValue(d))
                            .transition().duration(_this.duration).ease("linear")
                            .attr("cy", _this.yScale(valueY))
                            .attr("cx", _this.xScale(valueX))
                            .attr("r", areaToRadius(_this.sScale(valueR)))
                    }
                });
                break;
                    
                case "rect":
                var barWidth = Math.max(2,d3.max(_this.xScale.range()) / _this.data.length - 5);
                this.bubbles.each(function(d){
                    var view = d3.select(this);
                    var valueY = _this.model.marker.axis_y.getValue(d);
                    var valueX = _this.model.marker.axis_x.getValue(d);
                    
                    if(valueY==null || valueX==null) {
                        view.classed("vzb-transparent", true)
                    }else{
                        view.classed("vzb-transparent", false)
                            .style("fill", _this.model.marker.color.getValue(d))
                            .transition().duration(_this.duration).ease("linear")
                            .attr("height", d3.max(_this.yScale.range()) - _this.yScale(valueY))
                            .attr("y", _this.yScale(valueY))
                            .attr("x", _this.xScale(valueX) - barWidth/2)
                            .attr("width", barWidth);
                    }
                });
                break;
            }
            
            // Call flush() after any zero-duration transitions to synchronously flush the timer queue
            // and thus make transition instantaneous. See https://github.com/mbostock/d3/issues/1951
            if(_this.duration==0)d3.timer.flush();



        }, //redraw

        
        selectDataPoints: function(){
            var _this = this;
            
            var some_selected = (_this.model.entities.select.length > 0);
            
            this.bubbles.classed("vzb-bc-selected", function(d) {
                    return some_selected && _this.model.entities.isSelected(d)
                })
            this.bubbles.classed("vzb-bc-unselected", function(d) {
                    return some_selected && !_this.model.entities.isSelected(d)
                });
        }
        
    });

    
    
    return BubbleChart;
});
