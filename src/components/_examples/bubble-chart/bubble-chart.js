define([
    'd3',
    'base/component',
    'd3genericLogScale',
    'd3axisWithLabelPicker',
    'd3collisionResolver'
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
                    _this.redrawDataPoints();
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
            this.selectDataPointsOnce = false;
            
            
            
            // default UI settings
            this.ui = _.extend({
                whenHovering: {},
                trails: {},
                labels: {}
            }, this.ui["vzb-tool-"+this.name]);
            
            this.ui.whenHovering = _.extend({
                showProjectionLineX: true,
                showProjectionLineY: true,
                higlightValueX: true,
                higlightValueY: true
            }, this.ui.whenHovering);
            
            this.ui.trails = _.extend({
                on: true
            }, this.ui.trails);
            
            this.ui.labels = _.extend({
                autoResolveCollisions: false,
                dragging: true
            }, this.ui.labels);

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
            
            this.projectionX = this.graph.select(".vzb-bc-projection-x");
            this.projectionY = this.graph.select(".vzb-bc-projection-y");
                  
            this.trailsContainer = this.graph.select('.vzb-bc-trails');
            this.bubbleContainer = this.graph.select('.vzb-bc-bubbles');
            this.labelsContainer = this.graph.select('.vzb-bc-labels');
            this.entityBubbles = null;
            this.entityLabels = null;
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

            this.collisionResolver = d3.svg.collisionResolver()
                .value("valueY")
                .selector("text")
                .scale(this.yScale)
                .handleResult(this.repositionLabels);
            
            
           this.dragger = d3.behavior.drag()
                .on("drag", function(d,i) {
                    _this.cached[d.geo].dragged = true;
                    _this.cached[d.geo].labelX2 += d3.event.dx;
                    _this.cached[d.geo].labelY2 += d3.event.dy;
                    d3.select(this).selectAll("text")
                        .attr("x", _this.cached[d.geo].labelX2)
                        .attr("y", _this.cached[d.geo].labelY2);
                    d3.select(this).select("line")
                        .attr("x2", _this.cached[d.geo].labelX2)
                        .attr("y2", _this.cached[d.geo].labelY2);
                });
            
            
            if(this.selectDataPointsOnce) this.model.entities.select = [];
            
            var _this = this;
            this.yAxis.tickFormat(function(d) {
                return _this.model.marker.axis_y.getTick(d);
            });
            this.xAxis.tickFormat(function(d) {
                return _this.model.marker.axis_x.getTick(d);
            });
            
            _this.cached = {};
            this.timeFormatter = d3.time.format(_this.model.time.formatInput);
            
            // get array of GEOs, sorted by the size hook
            // that makes larger bubbles go behind the smaller ones
            this.data = this.model.marker.label.getItems({ time: _this.model.time.end })
                .map(function(d){d.sortValue = _this.model.marker.size.getValue(d); return d})
                .sort(function(a,b){return b.sortValue - a.sortValue;});
            
            this.entityTrails = this.trailsContainer.selectAll(".vzb-bc-entity")
                .data(this.data, function(d){return d.geo});
            
            this.entityTrails.exit().remove();
            
            this.entityTrails.enter().append("g")
                .attr("class", function(d){return  "vzb-bc-entity" + " " + d.geo});

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
            this.data.forEach(function(d){d.time = _this.time});
            
            this.yearEl.text(this.time.getFullYear().toString());
            
            
            
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
            this.height = parseInt(this.element.style("height"), 10) - margin.top - margin.bottom;
            this.width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;

            this.collisionResolver.height(this.height);
            
            //graph group is shifted according to margins (while svg element is at 100 by 100%)
            this.graph
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            //center year 
            var widthAxisY = this.yAxisEl[0][0].getBBox().width;
            var heightAxisX = this.xAxisEl[0][0].getBBox().height;

            this.yearEl
                .attr("x", this.width/2)
                .attr("y", this.height/3*2)
                .style("font-size", Math.max(this.height/4, this.width/4) + "px");

            //update scales to the new range
            if (this.model.marker.axis_y.scale !== "ordinal") {
                this.yScale.range([this.height, 0]);
            } else {
                this.yScale.rangePoints([this.height, 0], padding).range();
            }
            if (this.model.marker.axis_x.scale !== "ordinal") {
                this.xScale.range([0, this.width]);
            } else {
                this.xScale.rangePoints([0, this.width], padding).range();
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

            this.xAxisEl.attr("transform", "translate(0," + this.height + ")");
            this.xTitleEl.attr("transform", "translate("+ this.width +"," + this.height + ")");
            this.sTitleEl.attr("transform", "translate("+ this.width +"," + 0 + ") rotate(-90)");
            
            this.yAxisEl.call(this.yAxis);
            this.xAxisEl.call(this.xAxis);
            
            this.projectionX.attr("y1",_this.yScale.range()[0]);
            this.projectionY.attr("x2",_this.xScale.range()[0]);

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
            
            
            this.entityBubbles = this.bubbleContainer.selectAll('.vzb-bc-entity')
                .data(this.data, function(d){return d.geo} );
            
            //exit selection
            this.entityBubbles.exit().remove();

            //enter selection -- init circles
            this.entityBubbles.enter().append(shape)
                .attr("class", "vzb-bc-entity")
                .on("mousemove", function(d, i) {
                    //TODO: improve tooltip
                    var mouse = d3.mouse(_this.graph.node()).map(function(d) {
                        return parseInt(d);
                    });

                    //position tooltip
                    _this.tooltip.classed("vzb-hidden", false)
                        .attr("style", "left:" + (mouse[0] + 50) + "px;top:" + (mouse[1] + 50) + "px")
                        .html(_this.model.marker.label.getValue(d));
                
                
                
                    var valueY = _this.model.marker.axis_y.getValue(d);
                    var valueX = _this.model.marker.axis_x.getValue(d);
                    var valueS = _this.model.marker.size.getValue(d);
                    var radius = areaToRadius(_this.sScale(valueS))
                
                    if(_this.ui.whenHovering.showProjectionLineX){
                        _this.projectionX
                            .style("opacity",1)
                            .attr("y2",_this.yScale(valueY) + radius)
                            .attr("x1",_this.xScale(valueX))
                            .attr("x2",_this.xScale(valueX));
                    }
                    if(_this.ui.whenHovering.showProjectionLineY){
                        _this.projectionY
                            .style("opacity",1)
                            .attr("y1",_this.yScale(valueY))
                            .attr("y2",_this.yScale(valueY))
                            .attr("x1",_this.xScale(valueX) - radius);
                    }

                    if(_this.ui.whenHovering.higlightValueX) _this.xAxisEl.call(
                        _this.xAxis.highlightValue(valueX)
                    );

                    if(_this.ui.whenHovering.higlightValueY) _this.yAxisEl.call(
                        _this.yAxis.highlightValue(valueY)
                    );
                
                })
                .on("mouseout", function(d, i) {
                    _this.tooltip.classed("vzb-hidden", true);
                    _this.projectionX.style("opacity",0);
                    _this.projectionY.style("opacity",0);
                    _this.xAxisEl.call(_this.xAxis.highlightValue("none"));
                    _this.yAxisEl.call(_this.yAxis.highlightValue("none"));
                })
                .on("click", function(d, i) {
                    _this.model.entities.selectEntity(d, _this.timeFormatter);
                });
                        
            
            
  
            if(!_this.selectDataPointsOnce) _this.selectDataPoints();
            
            
            switch (shape){
                case "circle":
                this.entityBubbles.each(function(d, index){
                    var view = d3.select(this);
                    var valueY = _this.model.marker.axis_y.getValue(d);
                    var valueX = _this.model.marker.axis_x.getValue(d);
                    var valueS = _this.model.marker.size.getValue(d);
                    var valueL = _this.model.marker.label.getValue(d);
                    var valueC = _this.model.marker.color.getValue(d);
                    
                    if(valueL == null || valueY==null || valueX==null || valueS==null) {
                        view.classed("vzb-transparent", true)
                    }else{
                        var scaledS = areaToRadius(_this.sScale(valueS));
                        
                        view.classed("vzb-transparent", false)
                            .style("fill", valueC)
                            .transition().duration(_this.duration).ease("linear")
                            .attr("cy", _this.yScale(valueY))
                            .attr("cx", _this.xScale(valueX))
                            .attr("r", scaledS)
                        
                        // only for selected entities
                        if(_this.model.entities.isSelected(d) && _this.entityLabels!=null){
                            
                            if(_this.cached[d.geo] == null) _this.cached[d.geo] = {valueY: null, valueX: null, labelY1: null, labelX1: null};
                            _this.cached[d.geo].valueY = valueY;
                            _this.cached[d.geo].valueX = valueX;
                            
                            if(_this.ui.trails.on){
                                var select = _.find(_this.model.entities.select, function(f){return f.geo == d.geo} );
                                var trailStartTime = _this.timeFormatter.parse(""+select.trailStartTime);
                                
                                if(trailStartTime - _this.time>0 || select.trailStartTime == null){
                                    select.trailStartTime = _this.timeFormatter(_this.time);
                                    _this.cached[d.geo].labelY1 = valueY;
                                    _this.cached[d.geo].labelX1 = valueX;
                                }else{
                                    _this.cached[d.geo].labelY1 = _this.model.marker.axis_y.getValue({geo:d.geo, time: trailStartTime});
                                    _this.cached[d.geo].labelX1 = _this.model.marker.axis_x.getValue({geo:d.geo, time: trailStartTime});
                                }
                            }
                            
                            
                            // reposition label
                            _this.entityLabels.filter(function(f){return f.geo == d.geo})
                                .each(function(groupData){
                                
                                    var labelGroup = d3.select(this);
                                    var line = labelGroup.select("line")
                                        .style("stroke-dasharray", "0 " + (scaledS + 2) + " 100%")
                                        .attr("x1",_this.xScale(_this.cached[d.geo].labelX1 || valueX))
                                        .attr("y1",_this.yScale(_this.cached[d.geo].labelY1 || valueY));

                                    var text = labelGroup.selectAll("text")
                                        .text(valueL);                                        
                                
                                    if(_this.cached[d.geo].dragged == true) return;
                                
                                    _this.cached[d.geo].labelX2 = _this.xScale(_this.cached[d.geo].labelX1 || valueX) + scaledS;
                                    _this.cached[d.geo].labelY2 = _this.yScale(_this.cached[d.geo].labelY1 || valueY);
                                
                                    text.transition().duration(_this.duration).ease("linear")
                                        .attr("x",_this.cached[d.geo].labelX2)
                                        .attr("y",_this.cached[d.geo].labelY2)

                                    line.transition().duration(_this.duration).ease("linear")
                                        .attr("x2",_this.cached[d.geo].labelX2)
                                        .attr("y2",_this.cached[d.geo].labelY2);
                                })
                        }else{
                            //for non-selected bubbles
                            //make sure there is no cached data
                            if(_this.cached[d.geo] != null){delete _this.cached[d.geo]};
                        }
                        
                    }// data exists
                    
                    
                    
                }); // bubbles
                    
                
                if(_this.ui.trails.on) _this.redrawTrails();
                    
                                
                break;                        
//                case "rect":
//                var barWidth = Math.max(2,d3.max(_this.xScale.range()) / _this.data.length - 5);
//                this.entityBubbles.each(function(d){
//                    var view = d3.select(this);
//                    var valueY = _this.model.marker.axis_y.getValue(d);
//                    var valueX = _this.model.marker.axis_x.getValue(d);
//                    
//                    if(valueY==null || valueX==null) {
//                        view.classed("vzb-transparent", true)
//                    }else{
//                        view.classed("vzb-transparent", false)
//                            .style("fill", _this.model.marker.color.getValue(d))
//                            .transition().duration(_this.duration).ease("linear")
//                            .attr("height", d3.max(_this.yScale.range()) - _this.yScale(valueY))
//                            .attr("y", _this.yScale(valueY))
//                            .attr("x", _this.xScale(valueX) - barWidth/2)
//                            .attr("width", barWidth);
//                    }
//                });
//                break;
            }
            
            // Call flush() after any zero-duration transitions to synchronously flush the timer queue
            // and thus make transition instantaneous. See https://github.com/mbostock/d3/issues/1951
            if(_this.duration==0)d3.timer.flush();


            
            
            
            
            // cancel previously queued simulation if we just ordered a new one
            clearTimeout(_this.collisionTimeout);
            
            
            if(_this.ui.labels.autoResolveCollisions){
                // place label layout simulation into a queue
                _this.collisionTimeout = setTimeout(function(){
    //                if(_this.forceLayout == null) return;
    //                
    //                // resume the simulation, fast-forward it, stop when done
    //                _this.forceLayout.resume();
    //                while(_this.forceLayout.alpha() > 0.01)_this.forceLayout.tick();
    //                _this.forceLayout.stop();


                    _this.entityLabels.call(_this.collisionResolver.data(_this.cached));

                },  _this.model.time.speed*1.5) 
            }

        }, //redraw

        
        
        repositionLabels: function(d, i, context, resolvedX, resolvedY){
            
            d3.select(context).selectAll("text")
                .transition()
                .duration(300)
                .attr("x", function(d){if(resolvedX!=null){return resolvedX}else{return}})
                .attr("y", resolvedY);
            
            d3.select(context).selectAll("line")
                .transition()
                .duration(300)
                .attr("x2", resolvedX)
                .attr("y2", resolvedY);
            
        },
        
        
        
        selectDataPoints: function(){
            var _this = this;
            this.selectDataPointsOnce = true;
            
            var some_selected = (_this.model.entities.select.length > 0);
            
            this.entityBubbles.classed("vzb-bc-selected", function(d) {
                    return some_selected && _this.model.entities.isSelected(d)
                })
            this.entityBubbles.classed("vzb-bc-unselected", function(d) {
                    return some_selected && !_this.model.entities.isSelected(d)
                }); 
            
            this.entityLabels = this.labelsContainer.selectAll('.vzb-bc-entity')
                .data(_this.model.entities.select, function(d) { return(d.geo); });

            
            this.entityLabels.exit()
                .each(function(d){ _this.removeTrails(d) })
                .remove();
            
            this.entityLabels
                .enter().append("g")
                .attr("class", "vzb-bc-entity")
                .on("click", function(d, i) {
                    if (d3.event.defaultPrevented === false) _this.model.entities.selectEntity(d);
                })
                .call(_this.dragger)
                .each(function(d, index){
                    var view = d3.select(this);
                    view.append("text").attr("class","vzb-bc-label-shadow");
                    view.append("text").attr("class","vzb-bc-label-primary");
                    view.append("line").attr("class","vzb-bc-label-line");
                
                    if(_this.ui.trails.on)_this.createTrails(d)
                });
        
            
            //this.collisionResolverRebuild(_this.model.entities.select);
            
        },
        
        
        createTrails: function(d){
            var _this = this;
            
            var start = +_this.timeFormatter(this.model.time.start);
            var end = +_this.timeFormatter(this.model.time.end);
            var step = this.model.time.step;
            var trailSegmentData = [];
            for(var time = start; time<=end; time+=step) trailSegmentData.push({t: _this.timeFormatter.parse(""+time)});
            
            this.entityTrails
                .filter(function(f){return f.geo==d.geo})
                .selectAll("g")
                .data(trailSegmentData)
                .enter().append("g")
                .attr("class","trailSegment")
                .each(function(segment,index){
                    segment.valueY = _this.model.marker.axis_y.getValue({geo:d.geo, time: segment.t});
                    segment.valueX = _this.model.marker.axis_x.getValue({geo:d.geo, time: segment.t});
                    segment.valueS = _this.model.marker.size.getValue({geo:d.geo, time: segment.t});
                    segment.valueC = _this.model.marker.color.getValue({geo:d.geo, time: segment.t});

                    var view = d3.select(this);
                    view.append("circle").style("fill", segment.valueC);
                    view.append("line").style("stroke", segment.valueC);
                });
            
        },
        
        removeTrails: function(d){
            this.entityTrails
                .filter(function(f){return f.geo==d.geo})
                .selectAll("g").remove();
        },
                
        
        redrawTrails: function(selection){
            var _this = this;
            
            selection = selection==null? _this.model.entities.select : [selection];
            selection.forEach(function(d){

                _this.entityTrails
                    .filter(function(f){return f.geo==d.geo})
                    .selectAll("g")
                    .each(function(segment,index){

                        var view = d3.select(this);
                        
                        var invisible = (segment.t - _this.time >= 0) || (_this.timeFormatter.parse(""+d.trailStartTime) - segment.t >= 0);
                        view.classed("vzb-transparent",invisible);
                    
                        if(invisible)return;

                        view.select("circle")
                            .attr("cy", _this.yScale(segment.valueY) )
                            .attr("cx", _this.xScale(segment.valueX) )
                            .attr("r", areaToRadius(_this.sScale(segment.valueS)));

                    
                        var next = this.parentNode.children[index+1];
                        
                        if(next!=null){
                            next = next.__data__;
                            if(segment.t - _this.time < 0 && _this.time - next.t < 0) next = _this.cached[d.geo];
                        
                            view.select("line")
                                .attr("x1", _this.xScale(next.valueX) )
                                .attr("y1", _this.yScale(next.valueY) )
                                .attr("x2", _this.xScale(segment.valueX) )
                                .attr("y2", _this.yScale(segment.valueY) );
                        }
                    
                    })
            });
        }
        
        
        
        
        
//        
//
//        
//        
//        collisionResolverStart: function(context){
//            var _this = context;
//            if(_this.dataForceLayout.links.length==0)return;
//        
//            _this.entityLabels.each(function(d, index){
//                var line = d3.select(this).select("line");
//                var text = d3.select(this).select("text");
//                var link = _this.dataForceLayout.links[index];
//
//                link.source.px = +line.attr("x1");
//                link.source.py = +line.attr("y1");
//                link.target.px = +line.attr("x2");
//                link.target.py = +line.attr("y2");
//
//                link.extension.length = text[0][0].getBBox().width;
//                link.extension.px = +line.attr("x2") + link.extension.length;
//                link.extension.py = +line.attr("y2");
//
//            });
//        },
//        
//    
//    
//    
//        collisionResolverTick: function(context){
//            var _this = context;
//            
//            _this.dataForceLayout.links.forEach(function (d, i) {
//                d.extension.x = d.target.x + d.extension.length;
//                d.extension.y = d.target.y;
//            })
//
//            _this.dataForceLayout.nodes.forEach(function (d, i) {
//                if(d.fixed)return;                        
//
//                if(d.x<0) d.x++; if(d.x>_this.width) d.x--;
//                if(d.y<0) d.y++; if(d.y>_this.height) d.y--;
//            })
//            
//        },
//        
//        collisionResolverEnd: function(context){
//            var _this = context;
//            if(_this.dataForceLayout.links.length==0)return;
//                                                
//            _this.entityLabels.each(function(d, index){
//                var view = d3.select(this);
//                var source = _this.dataForceLayout.links[index].source;
//                var target = _this.dataForceLayout.links[index].target;
//
//                var alpha = 0
//                    + (target.x > source.x && target.y < source.y?1:0) * ( Math.atan((target.y - source.y)/(source.x - target.x)) )
//                    + (target.x == source.x && target.y < source.y?1:0) * ( Math.PI/2 )
//                    + (target.x < source.x && target.y < source.y?1:0) * ( Math.PI - Math.atan((target.y - source.y)/(target.x - source.x)) )
//                    + (target.x < source.x && target.y == source.y?1:0) * ( Math.PI )
//                    + (target.x < source.x && target.y > source.y?1:0) * ( Math.PI + Math.atan((source.y - target.y)/(target.x - source.x)) )
//                    + (target.x == source.x && target.y > source.y?1:0) * ( Math.PI/2*3 )
//                    + (target.x > source.x && target.y > source.y?1:0) * ( Math.PI*2 - Math.atan((source.y - target.y)/(source.x - target.x)) )
//
//
//
//                view.selectAll("text")
//                    .style("text-anchor", Math.cos(alpha)>Math.cos(Math.PI/4)?"start" : (Math.cos(alpha)<-Math.cos(Math.PI/4)? "end": "middle"))
//                    .style("dominant-baseline", Math.sin(alpha)>Math.sin(Math.PI/4)?"alphabetical" : (Math.sin(alpha)<-Math.sin(Math.PI/4)? "hanging": "middle"))
//                    .transition().duration(300)
//                    .attr("x", target.x)
//                    .attr("y", target.y)
//
//                view.select("line")
//                    .transition().duration(300)
//                    .attr("x1", source.x)
//                    .attr("y1", source.y)
//                    .attr("x2", target.x)
//                    .attr("y2", target.y);
//
//
//            });
//                
//        },
//        
//        collisionResolverRebuild: function(selection){
//            var _this = this;
//            
//            //if(_this.forceLayout==null) _this.collisionResolverInit();
//            
//            this.dataForceLayout = {nodes: [], links: []};
//            
//            selection.forEach(function(d,i){
//                var source = {geo: d, role:_this.ROLE_MARKER, fixed: true};
//                var target = {geo: d, role:_this.ROLE_LABEL, fixed: false};
//                var extension = {geo: d, role:_this.ROLE_LABEL_EXT, fixed: true};
//                _this.dataForceLayout.nodes.push(source);
//                _this.dataForceLayout.nodes.push(target);
//                _this.dataForceLayout.nodes.push(extension);
//                _this.dataForceLayout.links.push({source: source, target: target, extension: extension});
//            })
//            
//            
//            this.forceLayout = d3.layout.force()
//                .nodes(this.dataForceLayout.nodes)
//                .links(this.dataForceLayout.links);
//            
//            _this.forceLayout.resume();
//            while(_this.forceLayout.alpha() > 0.01)_this.forceLayout.tick();
//            _this.forceLayout.stop();
//        },
//        
//        
//        
//        
//        
//        collisionResolverInit: function(){
//            var _this = this;
//            
//            this.dataForceLayout = {nodes: [], links: []};
//            this.ROLE_MARKER = 'node fixed to marker';
//            this.ROLE_LABEL = 'node for floating label';
//            this.ROLE_LABEL_EXT = 'node for floating label';
//            
//            
//            this.forceLayout = d3.layout.force()
//                .size([_this.width, _this.height])
//                .gravity(-0.05)
//                .charge(function(d){
//                        switch (d.role){
//                            case _this.ROLE_MARKER: return -0;
//                            case _this.ROLE_LABEL: return -1000;
//                            case _this.ROLE_LABEL_EXT: return -1000;
//                        }
//                    })
//                .linkDistance(10)
//                //.linkStrength(1)
//                //.chargeDistance(30)
//                .friction(0.2)
//                //.theta(0.8)
//                .nodes(this.dataForceLayout.nodes)
//                .links(this.dataForceLayout.links)
//                .on("start", function(){_this.collisionResolverStart(_this)})
//                .on("tick", function(){_this.collisionResolverTick(_this)})
//                .on("end", function(){_this.collisionResolverEnd(_this)})
//                .start();
//
//            
//        }
        
        
        
    });

    
    
    return BubbleChart;
});
