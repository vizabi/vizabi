define([
    'jquery',
    'd3',
    'lodash',
    'base/component',
    'd3genericLogScale',
    'd3axisWithLabelPicker'
], function($, d3, _, Component) {



    var LineChart = Component.extend({

        init: function(context, options) {
            var _this = this;
            this.name = 'line-chart';
            this.template = 'components/_gapminder/' + this.name + '/' + this.name;

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
            
            
            this.components = [{
                component: '_gapminder/timeslider',
                placeholder: '.vzb-lc-timeslider',
                model: ["time"]
            }];

            
            this.model_binds = {
                "change": function(evt) {
                    //if it's not about time
                    if(evt.indexOf('change:time') === -1) {
                         _this.updateShow();
                         _this.redrawDataPoints();
                        _this.redrawTimeLabel();
                    }
                },
                "ready":  function(evt) {
                    _this.updateShow();
                    _this.updateSize();
                    _this.updateTime();
                    _this.redrawDataPoints();
                    _this.redrawTimeLabel();
                },
                'change:time:value': function() {
                    _this.updateTime();
                    _this.redrawDataPoints();
                    _this.redrawTimeLabel();
                }
            }
                        
            this._super(context, options);

            this.xScale = null;
            this.yScale = null;

            this.xAxis = d3.svg.axisSmart().orient("bottom");
            this.yAxis = d3.svg.axisSmart().orient("left");

            this.isDataPreprocessed = false;
            this.timeUpdatedOnce = false;
            this.sizeUpdatedOnce = false;
        },

        /*
         * domReady:
         * Executed after template is loaded
         * Ideally, it contains instantiations related to template
         */
        domReady: function() {
            var _this = this;
            
            this.graph = this.element.select('.vzb-lc-graph');
            this.yAxisEl = this.graph.select('.vzb-lc-axis-y');
            this.xAxisEl = this.graph.select('.vzb-lc-axis-x');
            this.yTitleEl = this.graph.select('.vzb-lc-axis-y-title');
            this.yearEl = this.graph.select('.vzb-lc-year');
            this.linesContainer = this.graph.select('.vzb-lc-lines');
            this.verticalNow = this.graph.select("g").select(".vzb-lc-vertical-now");
            
            this.timeSliderContainer = this.element.select('.vzb-lc-timeslider');
            this.timeSlider = this.timeSliderContainer.select('.vzb-timeslider');
            this.components[0].ui.show_value_when_drag_play = false;
            this.components[0].ui.axis_aligned = true;
            
            this.entities = null;
            this.totalLength_1 = {};

            //component events
            this.on("resize", function() {
                _this.updateSize();
                _this.updateTime();
                _this.redrawDataPoints();
                _this.redrawTimeLabel();
            })
        },



        
        
        /*
         * UPDATE SHOW:
         * Ideally should only update when show parameters change or data changes
         */
        updateShow: function() {
            var _this = this;
            
            this.duration = this.model.time.speed;
            this.translator = this.model.language.getTFunction();
            
            
            var titleString = this.translator("indicator/" + this.model.marker.axis_y.value) + ", "
                + d3.time.format(this.model.time.formatInput)(this.model.time.start) + " - "
                + d3.time.format(this.model.time.formatInput)(this.model.time.start)
                
            var yTitle = this.yTitleEl.selectAll("text").data([0]);
            yTitle.enter().append("text");
            yTitle
                .attr("y", "-6px")
                .attr("x", "-9px")
                .attr("dx", "-0.72em")
                .text(titleString);
            
            
            //scales
            this.yScale = this.model.marker.axis_y.getDomain();
            this.xScale = this.model.marker.axis_x.getDomain();
            
            this.yAxis.tickSize(6, 0);
            this.xAxis.tickSize(6, 0);
            
            //line template
            this.line = d3.svg.line()
                .interpolate("basis")
                .x(function(d) {return _this.xScale(d[0]); })
                .y(function(d) {return _this.yScale(d[1]); });
        },
        
        
        /*
         * UPDATE TIME:
         * Ideally should only update when time or data changes
         */
        updateTime: function() {
            var _this = this;
            
            this.time_1 = this.time==null? this.model.time.value : this.time;
            this.time = this.model.time.value;
            this.duration = this.model.time.playing && (this.time-this.time_1>0) ? this.model.time.speed*0.9 : 0;
            
            this.data = this.model.marker.label.getItems({ time: this.time });

            this.entities = this.linesContainer.selectAll('.vzb-lc-entity')
                .data(this.data);
               
            this.timeUpdatedOnce = true;

        },

        
        
        
        /*
         * RESIZE:
         * Executed whenever the container is resized
         * Ideally, it contains only operations related to size
         */
        updateSize: function() {
            
            var _this = this;
            
            var padding = 2;

            this.profiles = {
                "small": {
                    margin: { top: 30, right: 20, left: 40, bottom: 60},
                    tick_spacing: 60,
                    text_padding: 8,
                    lollipopRadius: 6,
                    limitMaxTickNumberX: 5
                },
                "medium": {
                    margin: {top: 30,right: 60,left: 60,bottom: 80},
                    tick_spacing: 80,
                    text_padding: 12,
                    lollipopRadius: 8,
                    limitMaxTickNumberX: 10
                },
                "large": {
                    margin: { top: 30, right: 60, left: 60, bottom: 100},
                    tick_spacing: 100,
                    text_padding: 20,
                    lollipopRadius: 10,
                    limitMaxTickNumberX: 0 // unlimited
                }
            };

            this.activeProfile = this.profiles[this.getLayoutProfile()];
            this.margin = this.activeProfile.margin;
            this.tick_spacing = this.activeProfile.tick_spacing;



            //adjust right this.margin according to biggest label
            var lineLabelsText = this.model.marker.label.getItems().map(function(d,i){
                return _this.model.marker.label.getValue(d)
            });
            
            var longestLabelWidth = 0;
            var lineLabelsView = this.linesContainer.selectAll(".samplingView").data(lineLabelsText);
            lineLabelsView
                .enter().append("text")
                .attr("class","samplingView vzb-lc-labelName")
                .style("opacity",0)
                .text(function(d){ return (d.length<13? d : d.substring(0, 10)+'...') })
                .each(function(d){
                    if(longestLabelWidth > this.getComputedTextLength()) return;
                    longestLabelWidth = this.getComputedTextLength();
                })
                .remove();

            this.margin.right = Math.max(this.margin.right, longestLabelWidth + this.activeProfile.text_padding + 20);


            //stage
            this.height = parseInt(this.element.style("height"), 10) - this.margin.top - this.margin.bottom;
            this.width = parseInt(this.element.style("width"), 10) - this.margin.left - this.margin.right;

            this.graph
                .attr("width", this.width + this.margin.right + this.margin.left)
                .attr("height", this.height + this.margin.top + this.margin.bottom)
                .select("g")
                .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

            //year
            this.widthAxisY = this.yAxisEl[0][0].getBBox().width;
            this.heightAxisX = this.xAxisEl[0][0].getBBox().height;
            
            if (this.model.marker.axis_y.scale !== "ordinal") {
                this.yScale.range([this.height, 0]);
            } else {
                this.yScale.rangePoints([this.height, 0], padding).range();
            }
            if (this.model.marker.axis_x.scale !== "ordinal" || 1) {
                this.xScale.range([0, this.width]);
            } else {
                this.xScale.rangePoints([0, this.width], padding).range();
            }
            


            this.yAxis.scale(this.yScale)
                .labelerOptions({
                    scaleType: this.model.marker.axis_y.scale,
                    toolMargin: {top: 5, right: this.margin.right, left: this.margin.left, bottom: this.margin.bottom},
                    limitMaxTickNumber: 6
                    //showOuter: true
                });
            
            this.xAxis.scale(this.xScale)
                .labelerOptions({
                    scaleType: this.model.marker.axis_x.scale,
                    toolMargin: this.margin,
                    limitMaxTickNumber: this.activeProfile.limitMaxTickNumberX
                    //showOuter: true
                });

            this.xAxisEl.attr("transform", "translate(0," + this.height + ")");
            this.yearEl.attr("transform", "translate(0," + this.height + ")")
                .attr("y",this.xAxis.tickPadding() + this.xAxis.tickSize());
            

            this.yAxisEl.call(this.yAxis);
            this.xAxisEl.call(this.xAxis);
            
            // adjust the vertical dashed line
            this.verticalNow.attr("y1",this.yScale.range()[0]).attr("y2",this.yScale.range()[1]);
            

            
            // set the right margin that depends on longest label width
            this.timeSlider.select(".vzb-ts-slider-wrapper")
                .style("right", this.margin.right)
            
            // override the sizing profile of time slider
            var tsProfiles = this.components[0].getSetProfile();
            
            tsProfiles[this.components[0].getLayoutProfile()].margin = 
                {bottom: 0, left: 0, right: 0, top: 0};
            
            this.components[0].getSetProfile(tsProfiles);
            
            // call resize of a child component to apply the changes
            this.components[0].resize();
            
            
            this.sizeUpdatedOnce = true;
        },
        
        
        
        
        redrawTimeLabel: function(){
            var _this = this;
            
            this.yearEl
                .text(this.time.getFullYear().toString())
                .transition()
                .duration(_this.duration)
                .ease("linear")
                .attr("x",this.xScale(this.time));
                
            this.xAxisEl.selectAll("g")
                .each(function(d,t){
                    d3.select(this).select("text")
                        .transition()
                        .duration(_this.duration)
                        .ease("linear")
                        .style("opacity",Math.min(1, Math.pow(Math.abs(d-_this.time)/(_this.model.time.end - _this.model.time.start)*5, 2)) )
                })
            
        },
        
        

        /*
         * REDRAW DATA POINTS:
         * Here plotting happens
         */
        redrawDataPoints: function() {
            var _this = this;
            if(!this.timeUpdatedOnce) this.updateTime();
            if(!this.sizeUpdatedOnce) this.updateSize();
            

            this.entities.exit().remove();
            this.entities.enter().append("g")
                .attr("class", "vzb-lc-entity")
                .each(function(d, i){
                    var group = d3.select(this);    
                    var color = _this.model.marker.color.getValue(d)||_this.model.marker.color.domain[0];
                    var label = _this.model.marker.label.getValue(d);
                
                    group.append("path")
                        .attr("class", "vzb-lc-line-shadow")
                        .style("stroke", d3.rgb(color).darker(0.3))
                        .attr("transform", "translate(0,1)");     
                    
                    group.append("path")
                        .attr("class", "vzb-lc-line")
                        .style("stroke", color)
                        .attr("data-tooltip", label);
                
                    group.append("circle")
                        .attr("class", "vzb-lc-circle")
                        .style("fill", color)
                        .style("stroke", d3.rgb(color).darker(0.3))
                        .attr("data-tooltip", label);
                
                    var labelGroup = group.append("g").attr("class", "vzb-lc-label");
                
                    labelGroup.append("text")
                        .attr("class", "vzb-lc-labelName")
                        .style("fill", d3.rgb(color).darker(0.3))
                        .attr("dy", ".35em");
                
                    labelGroup.append("text")
                        .attr("class", "vzb-lc-labelValue")
                        .style("fill", d3.rgb(color).darker(0.3))
                        .attr("dy", "1.6em");
                })
            
            
            this.entities
                .each(function(d,i){
                    var group = d3.select(this);       
                    var label = _this.model.marker.label.getValue(d);
                    
                    //TODO: optimization is possible if getValues would return both x and time
                    var x = _this.model.marker.axis_x.getValues(d);
                    var y = _this.model.marker.axis_y.getValues(d);
                    var xy = x.map(function(d,i){return [+x[i],+y[i]]});
                    
                    // the following fixes the ugly line butts sticking out of the axis line
                    if(x[0]!=null && x[1]!=null) xy.splice(1, 0, [(+x[0]*0.99+x[1]*0.01), y[0]]);
                
                    var path1 = group.select(".vzb-lc-line-shadow")
                        .attr("d", _this.line(xy));
                    var path2 = group.select(".vzb-lc-line")
                        .attr("d", _this.line(xy));

                    
                    // this section ensures the smooth transition while playing and not needed otherwise
                    if(_this.model.time.playing){
                        
                        var totalLength = path1.node().getTotalLength();
                        
                        if(_this.totalLength_1[d.geo]==null)_this.totalLength_1[d.geo]=totalLength;

                        path1
                          .attr("stroke-dasharray", totalLength)
                          .attr("stroke-dashoffset", totalLength-_this.totalLength_1[d.geo])
                          .transition()
                            .duration(_this.duration)
                            .ease("linear")
                            .attr("stroke-dashoffset", 0); 

                        path2
                          .attr("stroke-dasharray", totalLength)
                          .attr("stroke-dashoffset", totalLength-_this.totalLength_1[d.geo])
                          .transition()
                            .duration(_this.duration)
                            .ease("linear")
                            .attr("stroke-dashoffset", 0);

                        _this.totalLength_1[d.geo] = totalLength;
                    }else{
                        //reset saved line lengths
                        _this.totalLength_1[d.geo] = null;
                        
                        path1
                          .attr("stroke-dasharray", "none")
                          .attr("stroke-dashoffset", "none"); 

                        path2
                          .attr("stroke-dasharray", "none")
                          .attr("stroke-dashoffset", "none");                       
                    }
                
                
                    group.select(".vzb-lc-circle")
                        .transition()
                        .duration(_this.duration)
                        .ease("linear")
                        .attr("r", _this.profiles[_this.getLayoutProfile()].lollipopRadius)
                        .attr("cx", _this.xScale(_this.model.marker.axis_x.getValue(d)) )
                        .attr("cy", _this.yScale(_this.model.marker.axis_y.getValue(d)) + 1);     

                    group.select(".vzb-lc-label")
                        .transition()
                        .duration(_this.duration)
                        .ease("linear")
                        .attr("transform","translate(" + _this.xScale(_this.time) + "," + _this.yScale(y[y.length-1]) + ")" );
                
                    var value = _this.yAxis.tickFormat()(y[y.length-1]);
                    var name = label.length<13? label : label.substring(0, 10)+'...';
                
                    var t = group.select(".vzb-lc-labelName")
                        .attr("dx", _this.activeProfile.text_padding)
                        .text(name + " " + (_this.data.length<6?value:""));
                
                    group.select(".vzb-lc-labelValue")
                        .attr("dx", _this.activeProfile.text_padding)
                        .text("");
                    
                    if(_this.data.length<6){
                        // if too little space on the right, break up the text in two lines
                        if(_this.xScale(_this.time) + t[0][0].getComputedTextLength() 
                            + _this.activeProfile.text_padding > _this.width + _this.margin.right){
                            group.select(".vzb-lc-labelName").text(name);
                            group.select(".vzb-lc-labelValue").text(value);
                        }
                    }
                
                    // Call flush() after any zero-duration transitions to synchronously flush the timer queue
                    // and thus make transition instantaneous. See https://github.com/mbostock/d3/issues/1951
                    if(_this.duration==0)d3.timer.flush();
                })
            
            
                this.verticalNow
                    .transition()
                    .duration(_this.duration)
                    .ease("linear")
                    .attr("x1",this.xScale(this.time))
                    .attr("x2",this.xScale(this.time))
                    .style("opacity",this.time-this.model.time.start==0?0:1);
                
            
        }

    });

    return LineChart;
});