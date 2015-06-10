/*!
 * VIZABI LINECHART
 */

(function() {

    "use strict";

    var root = this;
    var Vizabi = root.Vizabi;
    var utils = Vizabi.utils;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) return;


    //LINE CHART COMPONENT
    Vizabi.Component.extend('gapminder-linechart', {

        init: function(context, options) {
            var _this = this;
            this.name = 'linechart';
            this.template = 'src/tools/linechart/linechart.html';

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
                    if (!_this._readyOnce) return;
                    if(evt.indexOf("change:time")!=-1) return;
                    //console.log("change", evt)
                     _this.updateShow();
                     _this.redrawDataPoints();
                },
                "ready": function(evt) {
                    if (!_this._readyOnce) return;
                    //console.log("ready", evt)
                    _this.updateShow();
                    _this.updateSize();
                    _this.updateTime();
                    _this.redrawDataPoints();
                },
                'change:time:value': function() {
                    if (!_this._readyOnce) return;
                    //console.log("change:time:value")
                    _this.updateTime();
                    _this.redrawDataPoints();
                }
            };
                        
            this._super(context, options);

            this.xScale = null;
            this.yScale = null;

            this.xAxis = d3.svg.axisSmart().orient("bottom");
            this.yAxis = d3.svg.axisSmart().orient("left");

            
            
            this.isDataPreprocessed = false;
            this.timeUpdatedOnce = false;
            this.sizeUpdatedOnce = false;
            
            

            // default UI settings
            this.ui = utils.extend({
                entity_labels: {},
                whenHovering: {}
            }, this.ui["vzb-tool-"+this.name]);
            
            this.ui.entity_labels = utils.extend({
                min_number_of_entities_when_values_hide: 10
            }, this.ui.entity_labels);
            
            this.ui.whenHovering = utils.extend({
                hideVerticalNow: true,
                showProjectionLineX: true,
                showProjectionLineY: true,
                higlightValueX: true,
                higlightValueY: true,
                showTooltip: true
            }, this.ui.whenHovering);
            
        },

        /*
         * domReady:
         * Executed after template is loaded
         * Ideally, it contains instantiations related to template
         */
        readyOnce: function() {
            var _this = this;
            
            this.element = d3.select(this.element);
            this.graph = this.element.select('.vzb-lc-graph');
            this.yAxisEl = this.graph.select('.vzb-lc-axis-y');
            this.xAxisEl = this.graph.select('.vzb-lc-axis-x');
            this.yTitleEl = this.graph.select('.vzb-lc-axis-y-title');
            this.xValueEl = this.graph.select('.vzb-lc-axis-x-value');
            this.yValueEl = this.graph.select('.vzb-lc-axis-y-value');
            
            this.linesContainer = this.graph.select('.vzb-lc-lines');
            this.labelsContainer = this.graph.select('.vzb-lc-labels');
            
            this.verticalNow = this.labelsContainer.select(".vzb-lc-vertical-now");
            this.tooltip = this.element.select('.vzb-tooltip');
//            this.filterDropshadowEl = this.element.select('#vzb-lc-filter-dropshadow');
            this.projectionX = this.graph.select("g").select(".vzb-lc-projection-x");
            this.projectionY = this.graph.select("g").select(".vzb-lc-projection-y");
            
            this.entityLines = null;
            this.entityLabels = null;
            this.totalLength_1 = {};
            
            this.KEY = this.model.entities.getDimension();

            //component events
            this.on("resize", function() {
                _this.updateSize();
                _this.updateTime();
                _this.redrawDataPoints();
            }); 
            
            _this.updateShow();
            _this.updateSize();
            _this.updateTime();
            _this.redrawDataPoints();
        },

        /*
         * UPDATE SHOW:
         * Ideally should only update when show parameters change or data changes
         */
        updateShow: function() {
            var _this = this;
            var KEY = this.KEY;
            
            this.duration = this.model.time.speed;
            this.translator = this.model.language.getTFunction();
            
            
            var titleString = this.translator("indicator/" + this.model.marker.axis_y.which); 
//                + ", "
//                + d3.time.format(this.model.time.formatInput)(this.model.time.start) + " - "
//                + d3.time.format(this.model.time.formatInput)(this.model.time.end)
                
            var yTitle = this.yTitleEl.selectAll("text").data([0]);
            yTitle.enter().append("text");
            yTitle
                .attr("y", "-0px")
                .attr("x", "-9px")
                .attr("dy", "-0.36em")
                .attr("dx", "-0.72em")
                .text(titleString);
            
            
            this.cached = {};
            
            //scales
            this.yScale = this.model.marker.axis_y.getScale();
            this.xScale = this.model.marker.axis_x.getScale();
            this.cScale = this.model.marker.color.getScale();
            this.cShadeScale = this.model.marker.color_shadow.getScale();
            
            this.yAxis.tickSize(6, 0)
                .tickFormat(this.model.marker.axis_y.tickFormatter);
            this.xAxis.tickSize(6, 0)
                .tickFormat(this.model.marker.axis_x.tickFormatter);
            
            this.collisionResolver = d3.svg.collisionResolver()
                .selector(".vzb-lc-label")
                .value("valueY")
                .scale(this.yScale)
                .KEY(KEY);
            
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
            
            var time_1 = (this.time === null) ? this.model.time.value : this.time;
            this.time = this.model.time.value;
            this.duration = this.model.time.playing && (this.time - time_1>0) ? this.model.time.speed*0.9 : 0;
            
            this.data = this.model.marker.label.getItems({ time: this.time });

            this.entityLines = this.linesContainer.selectAll('.vzb-lc-entity').data(this.data);
            this.entityLabels = this.labelsContainer.selectAll('.vzb-lc-entity').data(this.data);
               
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
                    margin: { top: 30, right: 20, left: 40, bottom: 30},
                    tick_spacing: 60,
                    text_padding: 8,
                    lollipopRadius: 6,
                    limitMaxTickNumberX: 5
                },
                "medium": {
                    margin: {top: 40,right: 60,left: 60,bottom: 40},
                    tick_spacing: 80,
                    text_padding: 12,
                    lollipopRadius: 7,
                    limitMaxTickNumberX: 10
                },
                "large": {
                    margin: { top: 50, right: 60, left: 60, bottom: 50},
                    tick_spacing: 100,
                    text_padding: 20,
                    lollipopRadius: 9,
                    limitMaxTickNumberX: 0 // unlimited
                }
            };

            this.activeProfile = this.profiles[this.getLayoutProfile()];
            this.margin = this.activeProfile.margin;
            this.tick_spacing = this.activeProfile.tick_spacing;



            //adjust right this.margin according to biggest label
            var lineLabelsText = this.model.marker.label.getItems().map(function(d,i){
                return _this.model.marker.label.getValue(d);
            });
            
            var longestLabelWidth = 0;
            var lineLabelsView = this.linesContainer.selectAll(".samplingView").data(lineLabelsText);

            lineLabelsView
                .enter().append("text")
                .attr("class","samplingView vzb-lc-labelName")
                .style("opacity",0)
                .text(function(d){
                    return (d.length<13) ? d : d.substring(0, 10)+'...';
                })
                .each(function(d){
                    if(longestLabelWidth > this.getComputedTextLength()) {
                        return;
                    }
                    longestLabelWidth = this.getComputedTextLength();
                })
                .remove();

            this.margin.right = Math.max(this.margin.right, longestLabelWidth + this.activeProfile.text_padding + 20);


            //stage
            this.height = parseInt(this.element.style("height"), 10) - this.margin.top - this.margin.bottom;
            this.width = parseInt(this.element.style("width"), 10) - this.margin.left - this.margin.right;
            
            this.collisionResolver.height(this.height);
                
            this.graph
                .attr("width", this.width + this.margin.right + this.margin.left)
                .attr("height", this.height + this.margin.top + this.margin.bottom)
                .select("g")
                .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");


            
            if (this.model.marker.axis_y.scaleType !== "ordinal") {
                this.yScale.range([this.height, 0]);
            } else {
                this.yScale.rangePoints([this.height, 0], padding).range();
            }
            if (this.model.marker.axis_x.scaleType !== "ordinal" || 1) {
                this.xScale.range([0, this.width]);
            } else {
                this.xScale.rangePoints([0, this.width], padding).range();
            }
            


            this.yAxis.scale(this.yScale)
                .labelerOptions({
                    scaleType: this.model.marker.axis_y.scaleType,
                    toolMargin: {top: 0, right: this.margin.right, left: this.margin.left, bottom: this.margin.bottom},
                    limitMaxTickNumber: 6
                    //showOuter: true
                });
            
            this.xAxis.scale(this.xScale)
                .labelerOptions({
                    scaleType: this.model.marker.axis_x.scaleType,
                    toolMargin: this.margin,
                    limitMaxTickNumber: this.activeProfile.limitMaxTickNumberX
                    //showOuter: true
                });
            

            this.yAxisEl.call(this.yAxis);
            this.xAxisEl.call(this.xAxis);

            this.xAxisEl.attr("transform", "translate(0," + this.height + ")");
            this.xValueEl.attr("transform", "translate(0," + this.height + ")")
                .attr("y",this.xAxis.tickPadding() + this.xAxis.tickSize());

            
            
            // adjust the vertical dashed line
            this.verticalNow.attr("y1",this.yScale.range()[0]).attr("y2",this.yScale.range()[1])
                .attr("x1",0).attr("x2",0);
            this.projectionX.attr("y1",_this.yScale.range()[0]);
            this.projectionY.attr("x2",_this.xScale.range()[0]);


            this.parent.trigger('myEvent', {rangeMax: this.xScale.range()[1], mRight: this.margin.right});
            
            this.sizeUpdatedOnce = true;
        },

        /*
         * REDRAW DATA POINTS:
         * Here plotting happens
         */
        redrawDataPoints: function() {
            var _this = this;
            var KEY = this.KEY;
            
            if(!this.timeUpdatedOnce) {
                this.updateTime();
            }

            if(!this.sizeUpdatedOnce) {
                this.updateSize();
            }

            this.entityLabels.exit().remove();
            this.entityLines.exit().remove();
            
            this.entityLines.enter().append("g")
                .attr("class", "vzb-lc-entity")
                .on("mousemove", function(d,i){
                    _this.entityMousemove(d,i,_this);
                })
                .on("mouseout", function(d,i){
                    _this.entityMouseout(d,i,_this);
                })
                .each(function(d, index){
                    var entity = d3.select(this);    
                    var color = _this.cScale(_this.model.marker.color.getValue(d));
                    var colorShadow = _this.cShadeScale(_this.model.marker.color_shadow.getValue(d));
                    
                    entity.append("path")
                        .attr("class", "vzb-lc-line-shadow")
                        .style("stroke", colorShadow)
                        .attr("transform", "translate(0,2)");     
                    
                    entity.append("path")
                        .attr("class", "vzb-lc-line")
                        .style("stroke", color);
                
                });            
            
            this.entityLabels.enter().append("g")
                .attr("class", "vzb-lc-entity")
                .on("mousemove", function(d,i){
                    _this.entityMousemove(d,i,_this);
                })
                .on("mouseout", function(d,i){
                    _this.entityMouseout(d,i,_this);
                })
                .each(function(d, index){
                    var entity = d3.select(this);    
                    var color = _this.cScale(_this.model.marker.color.getValue(d));
                    var colorShadow = _this.cShadeScale(_this.model.marker.color_shadow.getValue(d));
                    var label = _this.model.marker.label.getValue(d);
                
                    entity.append("circle")
                        .attr("class", "vzb-lc-circle")
                        .style("fill", color)
                        .attr("cx", 0 );
                
                    var labelGroup = entity.append("g").attr("class", "vzb-lc-label");
                
                    labelGroup.append("text")
                        .attr("class", "vzb-lc-labelName")
                        .style("fill", colorShadow)
                        .attr("dy", ".35em");
                
                    labelGroup.append("text")
                        .attr("class", "vzb-lc-labelValue")
                        .style("fill", colorShadow)
                        .attr("dy", "1.6em");
            });
                    
            this.entityLines
                .each(function(d,index){
                    var entity = d3.select(this);       
                    var label = _this.model.marker.label.getValue(d);
                    
                    //TODO: optimization is possible if getValues would return both x and time
                    //TODO: optimization is possible if getValues would return a limited number of points, say 1 point per screen pixel
                    var x = _this.model.marker.axis_x.getValues(d);
                    var y = _this.model.marker.axis_y.getValues(d);
                    var xy = x.map(function(d,i){ return [+x[i],+y[i]]; });
                    xy = xy.filter(function(d){ return !utils.isNaN(d[1]); });
                    _this.cached[d[KEY]] = {valueY:xy[xy.length-1][1]};
                    
                    // the following fixes the ugly line butts sticking out of the axis line
                    //if(x[0]!=null && x[1]!=null) xy.splice(1, 0, [(+x[0]*0.99+x[1]*0.01), y[0]]);
                
                    var path1 = entity.select(".vzb-lc-line-shadow")
                        .attr("d", _this.line(xy));
                    var path2 = entity.select(".vzb-lc-line")
                        //.style("filter", "none")
                        .attr("d", _this.line(xy));

                    
                    // this section ensures the smooth transition while playing and not needed otherwise
                    if(_this.model.time.playing){
                        
                        var totalLength = path2.node().getTotalLength();
                        
                        if(_this.totalLength_1[d[KEY]]===null) {
                            _this.totalLength_1[d[KEY]]=totalLength;
                        }

                        path1
                          .attr("stroke-dasharray", totalLength)
                          .attr("stroke-dashoffset", totalLength - _this.totalLength_1[d[KEY]])
                          .transition()
                            .duration(_this.duration)
                            .ease("linear")
                            .attr("stroke-dashoffset", 0); 

                        path2
                          .attr("stroke-dasharray", totalLength)
                          .attr("stroke-dashoffset", totalLength - _this.totalLength_1[d[KEY]])
                          .transition()
                            .duration(_this.duration)
                            .ease("linear")
                            .attr("stroke-dashoffset", 0);

                        _this.totalLength_1[d[KEY]] = totalLength;
                    }else{
                        //reset saved line lengths
                        _this.totalLength_1[d[KEY]] = null;
                        
                        path1
                          .attr("stroke-dasharray", "none")
                          .attr("stroke-dashoffset", "none"); 

                        path2
                          .attr("stroke-dasharray", "none")
                          .attr("stroke-dashoffset", "none");                       
                    }
                
                });

            this.entityLabels
                .each(function(d,index){
                    var entity = d3.select(this);       
                    var label = _this.model.marker.label.getValue(d);
                                
                    entity.select(".vzb-lc-circle")
                        .transition()
                        .duration(_this.duration)
                        .ease("linear")
                        .attr("r", _this.profiles[_this.getLayoutProfile()].lollipopRadius)
                        .attr("cy", _this.yScale(_this.cached[d[KEY]].valueY) + 1);  
                                        

                    entity.select(".vzb-lc-label")
                        .transition()
                        .duration(_this.duration)
                        .ease("linear")
                        .attr("transform","translate(0," + _this.yScale(_this.cached[d[KEY]].valueY) + ")" );
                

                    var value = _this.yAxis.tickFormat()(_this.cached[d[KEY]].valueY);
                    var name = label.length<13? label : label.substring(0, 10)+'...';
                    var valueHideLimit = _this.ui.entity_labels.min_number_of_entities_when_values_hide;
                    
                    var t = entity.select(".vzb-lc-labelName")
                        .attr("dx", _this.activeProfile.text_padding)
                        .text(name + " " + (_this.data.length<valueHideLimit ? value : ""));
                
                    entity.select(".vzb-lc-labelValue")
                        .attr("dx", _this.activeProfile.text_padding)
                        .text("");
                    
                    if(_this.data.length < valueHideLimit){
                        
                        var size = _this.xScale(_this.time)
                                         + t[0][0].getComputedTextLength()
                                         + _this.activeProfile.text_padding;
                        var width = _this.width + _this.margin.right;

                        if(size > width){
                            entity.select(".vzb-lc-labelName").text(name);
                            entity.select(".vzb-lc-labelValue").text(value);
                        }
                    } 
            });
            
            this.labelsContainer
                .transition()
                .duration(_this.duration)
                .ease("linear")
                .attr("transform", "translate(" + _this.xScale(_this.time) + ",0)");
            
            this.verticalNow
                .style("opacity",this.time-this.model.time.start===0 || _this.hoveringNow?0:1);
                

            if(!this.hoveringNow) {
                this.xAxisEl.call(
                    this.xAxis.highlightValue(_this.time).highlightTransDuration(_this.duration)
                );
            }

            // Call flush() after any zero-duration transitions to synchronously flush the timer queue
            // and thus make transition instantaneous. See https://github.com/mbostock/d3/issues/1951
            if(_this.duration==0) {
                d3.timer.flush();
            }
            
            // cancel previously queued simulation if we just ordered a new one
            // then order a new collision resolving
            clearTimeout(_this.collisionTimeout);
            _this.collisionTimeout = setTimeout(function(){
                _this.entityLabels.call(_this.collisionResolver.data(_this.cached));
            },  _this.model.time.speed*1.5);
            
        }, 

        entityMousemove: function(me, index, context){
            var _this = context;
            var KEY = _this.KEY;
            
            _this.hoveringNow = me;

            _this.graph.selectAll(".vzb-lc-entity").each(function(){
                d3.select(this)
                    .classed("vzb-dimmed", function(d){
                        return d[KEY] !== _this.hoveringNow[KEY];
                    })
                    .classed("vzb-hovered", function(d){
                        return d[KEY] === _this.hoveringNow[KEY];
                    });
            });


            var mouse = d3.mouse(_this.graph.node()).map(function(d) {
                return parseInt(d);
            });

            var resolvedTime = _this.xScale.invert(mouse[0]-_this.margin.left);  
            if(_this.time - resolvedTime < 0) {
                resolvedTime = _this.time;
            }

            var pointer = {};
            pointer[KEY] = me[KEY];
            pointer.time = resolvedTime;
            var resolvedValue = _this.model.marker.axis_y.getValue(pointer);

            if(utils.isNaN(resolvedValue)) {
                return;
            }

            var scaledTime = _this.xScale(resolvedTime);
            var scaledValue = _this.yScale(resolvedValue);

            if(_this.ui.whenHovering.showTooltip){
                //position tooltip
                _this.tooltip
                    .style("right", (_this.width - scaledTime + _this.margin.left + _this.margin.right ) + "px")
                    .style("bottom", (_this.height - scaledValue + _this.margin.bottom) + "px")
                    .text(_this.yAxis.tickFormat()(resolvedValue))
                    .classed("vzb-hidden", false);
            }

            // bring the projection lines to the hovering point
            if(_this.ui.whenHovering.hideVerticalNow) {
                _this.verticalNow.style("opacity",0);  
            }

            if(_this.ui.whenHovering.showProjectionLineX){
                _this.projectionX
                    .style("opacity",1)
                    .attr("y2",scaledValue)
                    .attr("x1",scaledTime)
                    .attr("x2",scaledTime);
            }
            if(_this.ui.whenHovering.showProjectionLineY){
                _this.projectionY
                    .style("opacity",1)
                    .attr("y1",scaledValue)
                    .attr("y2",scaledValue)
                    .attr("x1",scaledTime);
            }

            if(_this.ui.whenHovering.higlightValueX) _this.xAxisEl.call(
                _this.xAxis.highlightValue(resolvedTime).highlightTransDuration(0)
            );

            if(_this.ui.whenHovering.higlightValueY) _this.yAxisEl.call(
                _this.yAxis.highlightValue(resolvedValue).highlightTransDuration(0)
            );

            clearTimeout(_this.unhoverTimeout);
                    
        },        
                
        entityMouseout: function(me, index, context){
            var _this = context;
            
            // hide and show things like it was before hovering
            _this.unhoverTimeout = setTimeout(function(){
                _this.tooltip.classed("vzb-hidden", true);
                _this.verticalNow.style("opacity",1);
                _this.projectionX.style("opacity",0);
                _this.projectionY.style("opacity",0);
                _this.xAxisEl.call(_this.xAxis.highlightValue(_this.time));
                _this.yAxisEl.call(_this.yAxis.highlightValue("none"));

                _this.graph.selectAll(".vzb-lc-entity").each(function(){
                    d3.select(this).classed("vzb-dimmed", false).classed("vzb-hovered", false);
                });

                _this.hoveringNow = null;                       
            }, 300);

        }
        
        

        
//        resolveLabelCollisions: function(){
//            var _this = this;
//            
//            // cancel previously queued simulation if we just ordered a new one
//            clearTimeout(_this.collisionTimeout);
//            
//            // place force layout simulation into a queue
//            _this.collisionTimeout = setTimeout(function(){
//                
//                _this.cached.sort(function(a,b){return a.value - b.value});
//
//                // update inputs of force layout -- fixed nodes
//                _this.dataForceLayout.links.forEach(function(d,i){
//                    var source = utils.find(_this.cached, {geo:d.source[KEY]});
//                    var target = utils.find(_this.cached, {geo:d.target[KEY]});
//
//                    d.source.px = _this.xScale(source.time);
//                    d.source.py = _this.yScale(source.value);
//                    d.target.px = _this.xScale(target.time) + 10;
//                    d.target.py = _this.yScale(target.value) + 10;
//                });
//
//                // shift the boundary nodes
//                _this.dataForceLayout.nodes.forEach(function(d){
//                    if(d[KEY] == "upper_boundary"){d.x = _this.xScale(_this.time)+10; d.y = 0; return};
//                    if(d[KEY] == "lower_boundary"){d.x = _this.xScale(_this.time)+10; d.y = _this.height; return};
//                });
//
//                // update force layout size for better gravity
//                _this.forceLayout.size([_this.xScale(_this.time)*2, _this.height]);
//
//                    // resume the simulation, fast-forward it, stop when done
//                    _this.forceLayout.resume();
//                    while(_this.forceLayout.alpha() > 0.01)_this.forceLayout.tick();
//                    _this.forceLayout.stop();
//            },  500)
//        },
//        
//        
//        
//        initLabelCollisionResolver: function(){
//            var _this = this;
//            
//            this.dataForceLayout = {nodes: [], links: []};
//            this.ROLE_BOUNDARY = 'boundary node';
//            this.ROLE_MARKER = 'node fixed to marker';
//            this.ROLE_LABEL = 'node for floating label';
//            
//            this.data = this.model.marker.label.getItems({ time: this.time });
//            this.data.forEach(function(d,i){
//                _this.dataForceLayout.nodes.push({geo: d[KEY], role:_this.ROLE_MARKER, fixed: true});
//                _this.dataForceLayout.nodes.push({geo: d[KEY], role:_this.ROLE_LABEL, fixed: false});
//                _this.dataForceLayout.links.push({source: i*2, target: i*2+1 });
//            })
//            _this.dataForceLayout.nodes.push({geo: "upper_boundary", role:_this.ROLE_BOUNDARY, fixed: true});
//            _this.dataForceLayout.nodes.push({geo: "lower_boundary", role:_this.ROLE_BOUNDARY, fixed: true});
//    
//            this.forceLayout = d3.layout.force()
//                .size([1000, 400])
//                .gravity(0.05)
//                .charge(function(d){
//                        switch (d.role){
//                            case _this.ROLE_BOUNDARY: return -1000;
//                            case _this.ROLE_MARKER: return -0;
//                            case _this.ROLE_LABEL: return -1000;
//                        }
//                    })
//                .linkDistance(10)
//                //.linkStrength(1)
//                .chargeDistance(30)
//                .friction(0.2)
//                //.theta(0.8)
//                .nodes(this.dataForceLayout.nodes)
//                .links(this.dataForceLayout.links)
//                .on("tick", function(){
//                    _this.dataForceLayout.nodes.forEach(function (d, i) {
//                        if(d.fixed)return;
//                        
//                        if(d.x<_this.xScale(_this.time)) d.x = _this.xScale(_this.time);
//                        if(d.x>_this.xScale(_this.time)+10) d.x--;
//                    })
//                })
//                .on("end", function () {
//                                    
//                    var entitiesOrderedByY = _this.cached
//                        .map(function(d){return d[KEY]});
//                    
//                    var suggestedY = _this.dataForceLayout.nodes
//                        .filter(function(d){return d.role==_this.ROLE_LABEL})
//                        .sort(function(a,b){return b.y-a.y});
//                
//                    _this.graph.selectAll(".vzb-lc-label")
//                        .each(function (d, i) {
//                            var geoIndex = _this.cached.map(function(d){return d[KEY]}).indexOf(d[KEY]);
//                            var resolvedY = suggestedY[geoIndex].y || _this.yScale(_this.cached[geoIndex][geoIndex]) || 0;
//                            d3.select(this)
//                                .transition()
//                                .duration(300)
//                                .attr("transform", "translate(" + _this.xScale(_this.time) + "," + resolvedY + ")")
//                        });
//
//
//                })
//                .start();
//            
//        }
    


    });


}).call(this);
