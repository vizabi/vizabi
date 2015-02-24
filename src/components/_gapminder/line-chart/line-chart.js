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
                name: "data",
                type: "data"
            }];

            
            this.model_binds = {
                "change": function(evt) {
                    //if it's not about time
                    if(evt.indexOf('change:time') === -1) {
                         _this.updateShow();
                         _this.redrawDataPoints();
                    }
                },
                "ready":  function(evt) {
                    _this.updateShow();
                    _this.updateSize();
                    _this.updateTime();
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
            this.linesContainer = this.graph.select('.vzb-lc-lines');
            this.entities = null;
            this.totalLength_1 = {};

            //component events
            this.on("resize", function() {
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
            var _this = this;
            
            this.duration = this.model.time.speed;
            
            //scales
            this.yScale = this.model.marker.axis_y.getDomain();
            this.xScale = this.model.marker.axis_x.getDomain();
            
            this.yAxis.tickSize(6, 0);
            this.xAxis.tickSize(6, 0);
            
            //line template
            this.line = d3.svg.line()
                .interpolate("cardinal")
                .x(function(d) {return _this.xScale(d[0]); })
                .y(function(d) {return _this.yScale(d[1]); });
        },
        
        
        /*
         * UPDATE TIME:
         * Ideally should only update when time or data changes
         */
        updateTime: function() {
            var _this = this;
            this.time = this.model.time.value;
            
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
                    margin: { top: 30, right: 20, left: 40, bottom: 40},
                    tick_spacing: 60,
                    text_padding: 5
                },
                "medium": {
                    margin: {top: 30,right: 60,left: 60,bottom: 40},
                    tick_spacing: 80,
                    text_padding: 10
                },
                "large": {
                    margin: { top: 30, right: 60, left: 60, bottom: 40},
                    tick_spacing: 100,
                    text_padding: 15
                }
            };

            this.margin = this.profiles[this.getLayoutProfile()].margin;
            this.tick_spacing = this.profiles[this.getLayoutProfile()].tick_spacing;



            //adjust right this.margin according to biggest label
            var lineLabelsText = this.model.marker.label.getItems().map(function(d,i){
                return _this.model.marker.label.getValue(d)
            });
            
            var longestLabelWidth = 0;
            var lineLabelsView = this.linesContainer.selectAll(".samplingView").data(lineLabelsText);
            lineLabelsView
                .enter().append("text")
                .attr("class","samplingView vzb-lc-label")
                .style("opacity",0)
                .text(function(d){return d})
                .each(function(d){
                    if(longestLabelWidth > this.getBBox().width) return;
                    longestLabelWidth = this.getBBox().width
                })
                .remove();

            this.margin.right = Math.max(this.margin.right, longestLabelWidth + 20);


            //stage
            this.height = parseInt(this.element.style("height"), 10) - this.margin.top - this.margin.bottom;
            this.width = parseInt(this.element.style("width"), 10) - this.margin.left - this.margin.right;

            this.graph
                .attr("width", this.width + this.margin.right + this.margin.left)
                .attr("height", this.height + this.margin.top + this.margin.bottom)
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
                    toolMargin: this.margin
                    //showOuter: true
                });
            
            this.xAxis.scale(this.xScale)
                .labelerOptions({
                    scaleType: this.model.marker.axis_x.scale,
                    toolMargin: this.margin
                    //showOuter: true
                });

            this.xAxisEl.attr("transform", "translate(0," + this.height + ")");

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
                        .attr("transform", "translate(0,2)");     
                    
                    group.append("path")
                        .attr("class", "vzb-lc-line")
                        .style("stroke", color)
                        .attr("data-tooltip", label);
                
                    group.append("text")
                        .attr("class", "vzb-lc-label")
                        .attr("dy", ".35em")
                        .style("fill", d3.rgb(color).darker(0.3))
                        .text(label.length<13? label : label.substring(0, 10)+'...');
                })
            
            
            this.entities
                .each(function(d,i){
                    var group = d3.select(this);       
                    
                    //TODO: optimization is possible if getValues would return both x and time
                    var x = _this.model.marker.axis_x.getValues(d);
                    var y = _this.model.marker.axis_y.getValues(d);
                    var xy = x.map(function(d,i){return [+x[i],+y[i]]}); 
                    
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
                            .duration(_this.duration*0.9)
                            .ease("linear")
                            .attr("stroke-dashoffset", 0); 

                        path2
                          .attr("stroke-dasharray", totalLength)
                          .attr("stroke-dashoffset", totalLength-_this.totalLength_1[d.geo])
                          .transition()
                            .duration(_this.duration*0.9)
                            .ease("linear")
                            .attr("stroke-dashoffset", 0);

                        _this.totalLength_1[d.geo] = totalLength;
                    }
                
                    group.select(".vzb-lc-label")
                        .transition()
                        .duration(_this.model.time.playing?_this.duration*0.9:0)
                        .ease("linear")
                        .attr("transform", function(d) {
                            return "translate(" + _this.xScale(x[x.length-1]) + "," + _this.yScale(y[y.length-1]) + ")";
                        })
                        .attr("x", _this.profiles[_this.getLayoutProfile()].text_padding);
                
                    // Call flush() after any zero-duration transitions to synchronously flush the timer queue
                    // and thus make transition instantaneous. See https://github.com/mbostock/d3/issues/1951
                    d3.timer.flush();
                })
            
            
        }

    });

    return LineChart;
});