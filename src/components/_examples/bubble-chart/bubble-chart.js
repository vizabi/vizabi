define([
    'd3',
    'base/component',
    'd3genericLogScale',
    'd3axisWithLabelPicker',
    'd3collisionResolver'
], function(d3, Component) {

    function radiusToArea(r) {
        return r * r * Math.PI
    }

    function areaToRadius(a) {
        return Math.sqrt(a / Math.PI)
    }

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
                "change:time:trails": function(evt) {
                    //console.log("EVENT change:time:trails");
                    _this.toggleTrails(_this.model.time.trails);
                    _this.redrawDataPoints();
                },
                "change:time:lockNonSelected": function(evt) {
                    //console.log("EVENT change:time:lockNonSelected");
                    _this.redrawDataPoints(500);
                },
                "change:entities:show": function(evt) {
                    //console.log("EVENT change:entities:show");
                    _this.entitiesUpdatedRecently = true;
                },
                "change:marker": function(evt) {
                    // bubble size change is processed separately
                    if(evt == "change:marker:size:max") return; 
                    console.log("EVENT change:marker");
                    _this.updateIndicators();
                    _this.updateSize();
                    _this.updateMarkerSizeLimits();
                    _this.redrawDataPoints();
                },
                "change:entities:select": function() {
                    //console.log("EVENT change:entities:select");
                    _this.selectDataPoints();
                    _this.redrawDataPoints();
                    _this.resizeTrails();
                    _this.revealTrails();
                },
                "change:entities:brush": function() {
                    //console.log("EVENT change:entities:brush");
                    _this.highlightDataPoints();
                },
                "readyOnce": function(evt) {
                    //console.log("EVENT ready once");
                    _this.updateIndicators();
                    _this.updateEntities();
                    _this.updateTime();
                    _this.updateSize();
                    _this.updateMarkerSizeLimits();
                    _this.selectDataPoints();
                    _this.redrawDataPoints();
                    _this.resizeTrails();
                    _this.revealTrails();
                },
                "ready": function(evt) {
                    //TODO a workaround to fix the selection of entities
                    if (_this.entitiesUpdatedRecently) {
                        console.log("EVENT ready");
                        _this.updateEntities();
                        _this.updateSize();
                        _this.updateMarkerSizeLimits();
                        _this.redrawDataPoints();
                        
                        _this.entitiesUpdatedRecently = false;
                    }
                },
                'change:time:value': function() {
                    //console.log("EVENT change:time:value");
                    _this.updateTime();
                    _this.redrawDataPoints();
                    _this.revealTrails(null, _this.duration);
                },
                'change:marker:size:max': function() {
                    //console.log("EVENT change:marker:size:max");
                    _this.updateMarkerSizeLimits();
                    _this.redrawDataPoints();
                    _this.resizeTrails();   
                },
                'change:entities:opacityNonSelected': function() {
                    _this.updateBubbleOpacity();
                }
            }

            this._super(context, options);

            this.xScale = null;
            this.yScale = null;
            this.sScale = null;
            this.cScale = d3.scale.category10();

            this.xAxis = d3.svg.axisSmart();
            this.yAxis = d3.svg.axisSmart();


            this.cached = {};


            // default UI settings
            this.ui = _.extend({
                whenHovering: {},
                labels: {}
            }, this.ui["vzb-tool-" + this.name]);

            this.ui.whenHovering = _.extend({
                showProjectionLineX: true,
                showProjectionLineY: true,
                higlightValueX: true,
                higlightValueY: true
            }, this.ui.whenHovering);

            this.ui.labels = _.extend({
                autoResolveCollisions: false,
                dragging: true
            }, this.ui.labels);




            this.collisionResolver = d3.svg.collisionResolver()
                .value("labelY2")
                .fixed("labelFixed")
                .selector("text")
                .scale(this.yScale)
                .handleResult(this.repositionLabels);


            this.dragger = d3.behavior.drag()
                .on("dragstart", function(d, i) {
                    d3.event.sourceEvent.stopPropagation();
                })
                .on("drag", function(d, i) {
                    if (!_this.ui.labels.dragging) return;
                    var cache = _this.cached[d.geo];
                    cache.labelFixed = true;
                
                   cache.labelX_ += d3.event.dx/_this.width;
                   cache.labelY_ += d3.event.dy/_this.height;
                
                    var resolvedX = _this.xScale(cache.labelX0) + cache.labelX_ * _this.width;
                    var resolvedY = _this.yScale(cache.labelY0) + cache.labelY_ * _this.height;
                    var resolvedX0 = _this.xScale(cache.labelX0);
                    var resolvedY0 = _this.yScale(cache.labelY0);

                    _this.repositionLabels(d, i, this, resolvedX, resolvedY, resolvedX0, resolvedY0, _this.duration);
                })
                .on("dragend", function(d, i) {
                    _this.model.entities.setLabelOffset(d, [
                        Math.round(_this.cached[d.geo].labelX_*100)/100, 
                        Math.round(_this.cached[d.geo].labelY_*100)/100
                    ]);
                });



            this.gragRectangle = d3.behavior.drag()
                .on("dragstart", function(d, i) {
                    if (!(d3.event.sourceEvent.ctrlKey || d3.event.sourceEvent.metaKey)) return;

                    this.ctrlKeyLock = true;
                    this.origin = {
                        x: d3.mouse(this)[0] - _this.activeProfile.margin.left,
                        y: d3.mouse(this)[1] - _this.activeProfile.margin.top
                    };
                    _this.zoomRect.classed("vzb-invisible", false);
                })
                .on("drag", function(d, i) {
                    if (!this.ctrlKeyLock) return;
                    var origin = this.origin;
                    var mouse = {
                        x: d3.event.x - _this.activeProfile.margin.left,
                        y: d3.event.y - _this.activeProfile.margin.top
                    };

                    _this.zoomRect
                        .attr("x", Math.min(mouse.x, origin.x))
                        .attr("y", Math.min(mouse.y, origin.y))
                        .attr("width", Math.abs(mouse.x - origin.x))
                        .attr("height", Math.abs(mouse.y - origin.y));
                })

            .on("dragend", function(e) {
                if (!this.ctrlKeyLock) return;
                this.ctrlKeyLock = false;

                _this.zoomRect
                    .attr("width", 0)
                    .attr("height", 0)
                    .classed("vzb-invisible", true);

                this.target = {
                    x: d3.mouse(this)[0] - _this.activeProfile.margin.left,
                    y: d3.mouse(this)[1] - _this.activeProfile.margin.top
                };

                _this.zoomOnRectangle(d3.select(this), this.origin.x, this.origin.y, this.target.x, this.target.y, true);
            });

            this.zoomer = d3.behavior.zoom()
                .scaleExtent([1, 100])
                .on("zoom", function() {
                    if (d3.event.sourceEvent != null && (d3.event.sourceEvent.ctrlKey || d3.event.sourceEvent.metaKey)) return;

                    var zoom = d3.event.scale;
                    var pan = d3.event.translate;
                    var ratioY = _this.zoomer.ratioY;
                    var ratioX = _this.zoomer.ratioX;


                    //value protections and fallbacks
                    if (_.isNaN(zoom) || zoom == null) zoom = _this.zoomer.scale();
                    if (_.isNaN(zoom) || zoom == null) zoom = 1;
                    if (_.isNaN(pan[0]) || _.isNaN(pan[1]) || pan[0] == null || pan[1] == null) pan = _this.zoomer.translate();
                    if (_.isNaN(pan[0]) || _.isNaN(pan[1]) || pan[0] == null || pan[1] == null) pan = [0, 0];


                    // limit the zooming, so that it never goes below 1 for any of the axes
                    if (zoom * ratioY < 1) {
                        ratioY = 1 / zoom;
                        _this.zoomer.ratioY = ratioY
                    };
                    if (zoom * ratioX < 1) {
                        ratioX = 1 / zoom;
                        _this.zoomer.ratioX = ratioX
                    };

                    //limit the panning, so that we are never outside the possible range
                    if (pan[0] > 0) pan[0] = 0;
                    if (pan[1] > 0) pan[1] = 0;
                    if (pan[0] < (1 - zoom * ratioX) * _this.width) pan[0] = (1 - zoom * ratioX) * _this.width;
                    if (pan[1] < (1 - zoom * ratioY) * _this.height) pan[1] = (1 - zoom * ratioY) * _this.height;
                    _this.zoomer.translate(pan);

                    _this.xScale.range([0 * zoom * ratioX + pan[0], _this.width * zoom * ratioX + pan[0]]);
                    _this.yScale.range([_this.height * zoom * ratioY + pan[1], 0 * zoom * ratioY + pan[1]]);

                    // Keep the min and max size (pixels) constant, when zooming.            
                    //                    _this.sScale.range([radiusToArea(_this.minRadius) * zoom * zoom * ratioY * ratioX,
                    //                                        radiusToArea(_this.maxRadius) * zoom * zoom * ratioY * ratioX ]);

                    var optionsY = _this.yAxis.labelerOptions();
                    var optionsX = _this.xAxis.labelerOptions();
                    optionsY.limitMaxTickNumber = zoom * ratioY < 2 ? 7 : 14;
                    optionsY.transitionDuration = _this.zoomer.duration;
                    optionsX.transitionDuration = _this.zoomer.duration;

                    _this.xAxisEl.call(_this.xAxis.labelerOptions(optionsX));
                    _this.yAxisEl.call(_this.yAxis.labelerOptions(optionsY));
                    _this.redrawDataPoints(_this.zoomer.duration);
                    _this.resizeTrails(null, _this.zoomer.duration);
                    
                    _this.zoomer.duration = 0;
                });

            this.zoomer.ratioX = 1;
            this.zoomer.ratioY = 1;            
        },


        /**
         * Executes right after the template is in place, but the model is not yet ready
         */
        domReady: function() {
            var _this = this;

            // reference elements
            this.graph = this.element.select('.vzb-bc-graph');
            this.yAxisElContainer = this.graph.select('.vzb-bc-axis-y');
            this.yAxisEl = this.yAxisElContainer.select('g');
            
            this.xAxisElContainer = this.graph.select('.vzb-bc-axis-x');
            this.xAxisEl = this.xAxisElContainer.select('g');
            
            this.yTitleEl = this.graph.select('.vzb-bc-axis-y-title');
            this.xTitleEl = this.graph.select('.vzb-bc-axis-x-title');
            this.sTitleEl = this.graph.select('.vzb-bc-axis-s-title');
            this.cTitleEl = this.graph.select('.vzb-bc-axis-c-title');
            this.yearEl = this.graph.select('.vzb-bc-year');

            this.projectionX = this.graph.select(".vzb-bc-projection-x");
            this.projectionY = this.graph.select(".vzb-bc-projection-y");

            this.trailsContainer = this.graph.select('.vzb-bc-trails');
            this.bubbleContainerCrop = this.graph.select('.vzb-bc-bubbles-crop');
            this.bubbleContainer = this.graph.select('.vzb-bc-bubbles');
            this.labelsContainer = this.graph.select('.vzb-bc-labels');
            this.zoomRect = this.element.select('.vzb-bc-zoomRect');

            this.entityBubbles = null;
            this.entityLabels = null;
            this.tooltip = this.element.select('.vzb-tooltip');

            //component events
            this.on("resize", function() {
                //console.log("EVENT: resize");
                _this.updateSize();
                _this.updateMarkerSizeLimits();
                _this.redrawDataPoints();
                _this.resizeTrails();
            })

            //keyboard listeners
            d3.select("body")
                .on("keydown", function() {
                    if (d3.event.metaKey || d3.event.ctrlKey) _this.element.select("svg").classed("vzb-zoomin", true);
                })
                .on("keyup", function() {
                    if (!d3.event.metaKey && !d3.event.ctrlKey) _this.element.select("svg").classed("vzb-zoomin", false);
                })

            this.element
                .call(this.zoomer)
                .call(this.gragRectangle);
        },




        /*
         * UPDATE INDICATORS
         */
        updateIndicators: function() {
            var _this = this;

            this.translator = this.model.language.getTFunction();
            this.duration = this.model.time.speed;
            this.timeFormatter = d3.time.format(_this.model.time.formatInput);

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
                    this.translator("buttons/colors") + ": " + titleStringC);


            //scales
            this.yScale = this.model.marker.axis_y.getDomain();
            this.xScale = this.model.marker.axis_x.getDomain();
            this.sScale = this.model.marker.size.getDomain();

            this.collisionResolver.scale(this.yScale);


            this.yAxis.tickFormat(function(d) {
                return _this.model.marker.axis_y.getTick(d);
            });
            this.xAxis.tickFormat(function(d) {
                return _this.model.marker.axis_x.getTick(d);
            });
        },





        /*
         * UPDATE ENTITIES:
         * Ideally should only update when show parameters change or data changes
         */
        updateEntities: function() {
            var _this = this;

            // get array of GEOs, sorted by the size hook
            // that makes larger bubbles go behind the smaller ones
            var endTime = _this.model.time.end;
            this.model.entities.visible = this.model.marker.label.getItems()
                .map(function(d) {
                    return {
                        geo: d.geo,
                        time: endTime,
                        sortValue: _this.model.marker.size.getValue({ geo: d.geo, time: endTime})
                    }
                })
                .sort(function(a, b) {
                    return b.sortValue - a.sortValue;
                });





            this.entityBubbles = this.bubbleContainer.selectAll('.vzb-bc-entity')
                .data(this.model.entities.visible, function(d) {return d.geo});

            //exit selection
            this.entityBubbles.exit().remove();

            //enter selection -- init circles
            this.entityBubbles.enter().append("circle")
                .attr("class", "vzb-bc-entity")
                .on("mousemove", function(d, i) {
                    _this.model.entities.highlightEntity(d);

                    if (_this.model.entities.isSelected(d) && _this.model.time.trails) {
                        text = _this.timeFormatter(_this.time);
                        _this.entityLabels
                            .filter(function(f) {return f.geo == d.geo})
                            .classed("vzb-highlighted", true);
                    } else {
                        text = _this.model.marker.label.getValue(d);
                    }
                    _this.setTooltip(text);
                })
                .on("mouseout", function(d, i) {
                    _this.model.entities.clearHighlighted();
                    _this.setTooltip();
                    _this.entityLabels.classed("vzb-highlighted", false);
                })
                .on("click", function(d, i) {
                    _this.model.entities.selectEntity(d, _this.timeFormatter);
                });




            //TODO: no need to create trail group for all entities
            //TODO: instead of :append an :insert should be used to keep order, thus only few trail groups can be inserted
            this.entityTrails = this.trailsContainer.selectAll(".vzb-bc-entity")
                .data(this.model.entities.visible, function(d) {
                    return d.geo
                });

            this.entityTrails.exit().remove();

            this.entityTrails.enter().append("g")
                .attr("class", function(d) {
                    return "vzb-bc-entity" + " " + d.geo
                });

        },





        zoomOnRectangle: function(element, x1, y1, x2, y2, compensateDragging) {
            var _this = this;
            var zoomer = _this.zoomer;

            if (Math.abs(x1 - x2) < 10 || Math.abs(y1 - y2) < 10) return;


            if (Math.abs(x1 - x2) > Math.abs(y1 - y2)) {
                var zoom = _this.height / Math.abs(y1 - y2) * zoomer.scale();
                var ratioX = _this.width / Math.abs(x1 - x2) * zoomer.scale() / zoom * zoomer.ratioX;
                var ratioY = zoomer.ratioY;
            } else {
                var zoom = _this.width / Math.abs(x1 - x2) * zoomer.scale();
                var ratioY = _this.height / Math.abs(y1 - y2) * zoomer.scale() / zoom * zoomer.ratioY;
                var ratioX = zoomer.ratioX;
            }

            if (compensateDragging) {
                zoomer.translate([
                    zoomer.translate()[0] + x1 - x2,
                    zoomer.translate()[1] + y1 - y2
                ])
            }

            var pan = [
                (zoomer.translate()[0] - Math.min(x1, x2)) / zoomer.scale() / zoomer.ratioX * zoom * ratioX, (zoomer.translate()[1] - Math.min(y1, y2)) / zoomer.scale() / zoomer.ratioY * zoom * ratioY
            ]

            zoomer.scale(zoom);
            zoomer.ratioY = ratioY;
            zoomer.ratioX = ratioX;
            zoomer.translate(pan);
            zoomer.duration = 500;

            zoomer.event(element);
        },


        resetZoomer: function(element){
            this.zoomer.scale(1);
            this.zoomer.ratioY = 1;
            this.zoomer.ratioX = 1;
            this.zoomer.translate([0,0]);
            this.zoomer.duration = 0;
            this.zoomer.event(element||this.element);
        },



        /*
         * UPDATE TIME:
         * Ideally should only update when time or data changes
         */
        updateTime: function() {
            var _this = this;

            this.time_1 = this.time == null ? this.model.time.value : this.time;
            this.time = this.model.time.value;
            this.duration = this.model.time.playing && (this.time - this.time_1 > 0) ? this.model.time.speed : 0;

            this.yearEl.text(this.timeFormatter(this.time));
        },

        /*
         * RESIZE:
         * Executed whenever the container is resized
         */
        updateSize: function() {

            var _this = this;


            this.profiles = {
                "small": {
                    margin: { top: 30, right: 20, left: 40, bottom: 40 },
                    padding: 2,
                    minRadius: 2,
                    maxRadius: 40
                },
                "medium": {
                    margin: { top: 30, right: 60, left: 60, bottom: 40 },
                    padding: 2,
                    minRadius: 3,
                    maxRadius: 60
                },
                "large": {
                    margin: { top: 30, right: 60, left: 60, bottom: 40 },
                    padding: 2,
                    minRadius: 4,
                    maxRadius: 80
                }
            };

            this.activeProfile = this.profiles[this.getLayoutProfile()];
            var margin = this.activeProfile.margin;


            //stage
            this.height = parseInt(this.element.style("height"), 10) - margin.top - margin.bottom;
            this.width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;

            this.collisionResolver.height(this.height);

            //graph group is shifted according to margins (while svg element is at 100 by 100%)
            this.graph
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


            this.yearEl
                .attr("x", this.width / 2)
                .attr("y", this.height / 3 * 2)
                .style("font-size", Math.max(this.height / 4, this.width / 4) + "px");

            //update scales to the new range
            if (this.model.marker.axis_y.scale !== "ordinal") {
                this.yScale.range([this.height, 0]);
            } else {
                this.yScale.rangePoints([this.height, 0], _this.activeProfile.padding).range();
            }
            if (this.model.marker.axis_x.scale !== "ordinal") {
                this.xScale.range([0, this.width]);
            } else {
                this.xScale.rangePoints([0, this.width], _this.activeProfile.padding).range();
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
            
            
            this.bubbleContainerCrop
                .attr("width", this.width)
                .attr("height", this.height);
            
            this.xAxisElContainer
                .attr("width", this.width)
                .attr("height", this.activeProfile.margin.bottom)
                .attr("y", this.height);
            this.xAxisEl
                .attr("transform", "translate(0,"+1+")");
            
            this.yAxisElContainer
                .attr("width", this.activeProfile.margin.left)
                .attr("height", this.height)
                .attr("x", -this.activeProfile.margin.left);
            this.yAxisEl
                .attr("transform", "translate("+(this.activeProfile.margin.left-1)+","+0+")");
            
            this.xTitleEl.attr("transform", "translate(" + this.width + "," + this.height + ")");
            this.sTitleEl.attr("transform", "translate(" + this.width + "," + 0 + ") rotate(-90)");

            this.yAxisEl.call(this.yAxis);
            this.xAxisEl.call(this.xAxis);

            this.projectionX.attr("y1", _this.yScale.range()[0]);
            this.projectionY.attr("x2", _this.xScale.range()[0]);

            this.resetZoomer();
        },


        updateMarkerSizeLimits: function() {
            var _this = this;
            var minRadius = this.activeProfile.minRadius;
            var maxRadius = this.activeProfile.maxRadius;

            this.minRadius = Math.max(maxRadius * this.model.marker.size.min, minRadius);
            this.maxRadius = maxRadius * this.model.marker.size.max;

            if (this.model.marker.size.scale !== "ordinal") {
                this.sScale.range([radiusToArea(_this.minRadius), radiusToArea(_this.maxRadius)]);
            } else {
                this.sScale.rangePoints([radiusToArea(_this.minRadius), radiusToArea(_this.maxRadius)], 0).range();
            }

        },

        /*
         * REDRAW DATA POINTS:
         * Here plotting happens
         */
        redrawDataPoints: function(duration) {
            var _this = this;

            if(duration==null) duration = _this.duration; 
  
            this.entityBubbles.each(function(d, index) {
                var view = d3.select(this);

                if(_this.model.time.lockNonSelected && _this.someSelected && !_this.model.entities.isSelected(d)){
                    d.time = _this.timeFormatter.parse(""+_this.model.time.lockNonSelected);
                }else{
                    d.time = _this.time;
                }

                var valueY = _this.model.marker.axis_y.getValue(d);
                var valueX = _this.model.marker.axis_x.getValue(d);
                var valueS = _this.model.marker.size.getValue(d);
                var valueL = _this.model.marker.label.getValue(d);
                var valueC = _this.model.marker.color.getValue(d);

                
                // check if fetching data succeeded
                if (valueL == null || valueY == null || valueX == null || valueS == null) {
                    
                    // if entity is missing data it should hide
                    view.classed("vzb-invisible", true)
                    
                } else {
                    
                    // if entity has all the data we update the visuals
                    var scaledS = areaToRadius(_this.sScale(valueS));

                    view.classed("vzb-invisible", false)
                        .style("fill", valueC)
                        .transition().duration(duration).ease("linear")
                        .attr("cy", _this.yScale(valueY))
                        .attr("cx", _this.xScale(valueX))
                        .attr("r", scaledS)

                    // only for selected entities
                    if (_this.model.entities.isSelected(d) && _this.entityLabels != null) {

                        if (_this.cached[d.geo] == null) _this.cached[d.geo] = {};
                        var cached = _this.cached[d.geo];
                        
                        var select = _.find(_this.model.entities.select, function(f) {return f.geo == d.geo});
                        var trailStartTime = _this.timeFormatter.parse("" + select.trailStartTime);
                        
                        cached.valueX = valueX;
                        cached.valueY = valueY;
                        
                        if (!_this.model.time.trails || trailStartTime - _this.time > 0 || cached.labelX0==null || cached.labelY0 == null) {
                            select.trailStartTime = _this.timeFormatter(_this.time);
                            //the events in model are not triggered here. to trigger uncomment the next line
                            //_this.model.entities.triggerAll("change:select");
                            
                            cached.labelX0 = valueX;
                            cached.labelY0 = valueY;
                        }
                        
                        
                        // reposition label
                        _this.entityLabels.filter(function(f) {return f.geo == d.geo})
                            .each(function(groupData) {

                                var labelGroup = d3.select(this);

                                var text = labelGroup.selectAll("text.vzb-bc-label-content")
                                    .text(valueL + (_this.model.time.trails?" "+select.trailStartTime:""));

                                var line = labelGroup.select("line")
                                    .style("stroke-dasharray", "0 " + (scaledS + 2) + " 100%");
                            
                                var rect = labelGroup.select("rect");

                                var contentBBox = text[0][0].getBBox();
                                if(!cached.contentBBox || cached.contentBBox.width!=contentBBox.width){
                                    cached.contentBBox = contentBBox;

                                    labelGroup.select("text.vzb-bc-label-x")
                                        .attr("x", contentBBox.width + contentBBox.height * 0.0 + 2)
                                        .attr("y", contentBBox.height * 0.0 - 4);

                                    labelGroup.select("circle")
                                        .attr("cx", contentBBox.width + contentBBox.height * 0.0 + 2)
                                        .attr("cy", contentBBox.height * 0.0 - 4)
                                        .attr("r", contentBBox.height * 0.5);

                                    rect.attr("width",contentBBox.width+4)
                                        .attr("height",contentBBox.height+4)
                                        .attr("x",-2)
                                        .attr("y",-4)
                                        .attr("rx", contentBBox.height*0.2)
                                        .attr("ry", contentBBox.height*0.2);
                                }
                                                        
                                cached.labelX_ = select.labelOffset[0] || scaledS / _this.width;
                                cached.labelY_ = select.labelOffset[1] || scaledS / _this.width;

                                var resolvedX = _this.xScale(cached.labelX0) + cached.labelX_ * _this.width;
                                var resolvedY = _this.yScale(cached.labelY0) + cached.labelY_ * _this.height;

                                var limitedX = resolvedX > 0 ? (resolvedX < _this.width -cached.contentBBox.width ? resolvedX : _this.width -cached.contentBBox.width) : 0;
                                var limitedY = resolvedY > 0 ? (resolvedY < _this.height-cached.contentBBox.height ? resolvedY : _this.height-cached.contentBBox.height) : 0;

                                var limitedX0 = _this.xScale(cached.labelX0);
                                var limitedY0 = _this.yScale(cached.labelY0);

                                cached.stuckOnLimit = limitedX != resolvedX || limitedY != resolvedY;

                                rect.classed("vzb-transparent", !cached.stuckOnLimit);
                                line.classed("vzb-transparent", cached.stuckOnLimit);


                                _this.repositionLabels(d, index, this, limitedX, limitedY, limitedX0, limitedY0, duration);

                            })
                    } else {
                        //for non-selected bubbles
                        //make sure there is no cached data
                        if (_this.cached[d.geo] != null) {
                            delete _this.cached[d.geo]
                        };
                    }

                } // data exists



            }); // each bubble




            // case "rect":
            // var barWidth = Math.max(2,d3.max(_this.xScale.range()) / _this.data.length - 5);
            // this.entityBubbles.each(function(d){
            //     var view = d3.select(this);
            //     var valueY = _this.model.marker.axis_y.getValue(d);
            //     var valueX = _this.model.marker.axis_x.getValue(d);
            //     
            //     if(valueY==null || valueX==null) {
            //         view.classed("vzb-invisible", true)
            //     }else{
            //         view.classed("vzb-invisible", false)
            //             .style("fill", _this.model.marker.color.getValue(d))
            //             .transition().duration(_this.duration).ease("linear")
            //             .attr("height", d3.max(_this.yScale.range()) - _this.yScale(valueY))
            //             .attr("y", _this.yScale(valueY))
            //             .attr("x", _this.xScale(valueX) - barWidth/2)
            //             .attr("width", barWidth);
            //     }
            // });
            // break;
            

            // Call flush() after any zero-duration transitions to synchronously flush the timer queue
            // and thus make transition instantaneous. See https://github.com/mbostock/d3/issues/1951
            if (_this.duration == 0) d3.timer.flush();





            if (_this.ui.labels.autoResolveCollisions) {

                // cancel previously queued simulation if we just ordered a new one
                clearTimeout(_this.collisionTimeout);

                // place label layout simulation into a queue
                _this.collisionTimeout = setTimeout(function() {
                    //                if(_this.forceLayout == null) return;
                    //                
                    //                // resume the simulation, fast-forward it, stop when done
                    //                _this.forceLayout.resume();
                    //                while(_this.forceLayout.alpha() > 0.01)_this.forceLayout.tick();
                    //                _this.forceLayout.stop();


                    //  _this.entityLabels.call(_this.collisionResolver.data(_this.cached));

                }, _this.model.time.speed * 1.2)
            }

        }, //redraw



        repositionLabels: function(d, i, context, resolvedX, resolvedY, resolvedX0, resolvedY0, duration) {

            //            var text = d3.select(context).selectAll("text") //.transition().duration();
            //            var line = d3.select(context).selectAll("line") //.transition().duration();
            //
            //            if (resolvedX != null) {
            //                text.attr("x", resolvedX);
            //                line.attr("x2", resolvedX);
            //            }
            //            if (resolvedY != null) {
            //                text.attr("y", resolvedY);
            //                line.attr("y2", resolvedY);
            //            }

            var labelGroup = d3.select(context);

            labelGroup
                .transition().duration(duration || 0).ease("linear")
                .attr("transform", "translate(" + resolvedX + "," + resolvedY + ")");

            labelGroup.selectAll("line")
                .attr("x1", resolvedX0-resolvedX)
                .attr("y1", resolvedY0-resolvedY);

        },



        selectDataPoints: function() {
            var _this = this;

            _this.someSelected = (_this.model.entities.select.length > 0);

            this.updateBubbleOpacity();

            this.entityLabels = this.labelsContainer.selectAll('.vzb-bc-entity')
                .data(_this.model.entities.select, function(d) {
                    return (d.geo);
                });


            this.entityLabels.exit()
                .each(function(d) {
                    _this.removeTrails(d)
                })
                .remove();

            this.entityLabels
                .enter().append("g")
                .attr("class", "vzb-bc-entity")
                .call(_this.dragger)
                .each(function(d, index) {
                    var view = d3.select(this);
                    view.append("line").attr("class", "vzb-bc-label-line");
                
                    view.append("rect").attr("class", "vzb-transparent")
                        .on("click", function(d, i) {
                            //default prevented is needed to distinguish click from drag
                            if (d3.event.defaultPrevented) return

                            var maxmin = _this.cached[d.geo].maxMinValues;
                            var radius = areaToRadius(_this.sScale(maxmin.valueSmax));
                            _this.zoomOnRectangle(_this.element,
                                _this.xScale(maxmin.valueXmin) - radius,
                                _this.yScale(maxmin.valueYmin) + radius,
                                _this.xScale(maxmin.valueXmax) + radius,
                                _this.yScale(maxmin.valueYmax) - radius,
                                false);
                        });
                
                    view.append("text").attr("class", "vzb-bc-label-content vzb-bc-label-shadow");
                
                    view.append("text").attr("class", "vzb-bc-label-content");
                
                    view.append("circle").attr("class", "vzb-bc-label-x vzb-bc-label-shadow vzb-transparent")
                        .on("click", function(d, i) {
                            //default prevented is needed to distinguish click from drag
                            if (d3.event.defaultPrevented) return
                            _this.model.entities.selectEntity(d);
                        });
                
                    view.append("text").attr("class", "vzb-bc-label-x vzb-transparent").text("x");

                    if (_this.model.time.trails) _this.createTrails(d);
                })
                .on("mousemove", function() {
                    d3.select(this).selectAll(".vzb-bc-label-x")
                        .classed("vzb-transparent", false)
                    d3.select(this).select("rect")
                        .classed("vzb-transparent", false)
                })
                .on("mouseout", function(d) {
                    d3.select(this).selectAll(".vzb-bc-label-x")
                        .classed("vzb-transparent", true)
                    d3.select(this).select("rect")
                        .classed("vzb-transparent", !_this.cached[d.geo].stuckOnLimit)
                });


            //this.collisionResolverRebuild(_this.model.entities.select);

        },

        toggleTrails: function(toggle) {
            var _this = this;
            if (toggle) {
                _this.createTrails();
                _this.resizeTrails();
                _this.revealTrails();
            } else {
                _this.removeTrails();
                _this.model.entities.select.forEach(function(d) {
                    d.trailStartTime = null
                });
            }
        },

        createTrails: function(selection) {
            var _this = this;

            selection = selection == null ? _this.model.entities.select : [selection];

            selection.forEach(function(d) {
                var start = +_this.timeFormatter(_this.model.time.start);
                var end = +_this.timeFormatter(_this.model.time.end);
                var step = _this.model.time.step;
                var trailSegmentData = [];

                for (var time = start; time <= end; time += step) trailSegmentData.push({
                    t: _this.timeFormatter.parse("" + time)
                });

                if (_this.cached[d.geo] == null) _this.cached[d.geo] = {};
                _this.cached[d.geo].maxMinValues = {
                    valueXmax: null,
                    valueXmin: null,
                    valueYmax: null,
                    valueYmin: null,
                    valueSmax: null
                };

                var maxmin = _this.cached[d.geo].maxMinValues;

                _this.entityTrails
                    .filter(function(f) {return f.geo == d.geo})
                    .selectAll("g")
                    .data(trailSegmentData)
                    .enter().append("g")
                    .attr("class", "trailSegment")
                    .each(function(segment, index) {
                        segment.valueY = _this.model.marker.axis_y.getValue({geo: d.geo,time: segment.t});
                        segment.valueX = _this.model.marker.axis_x.getValue({geo: d.geo,time: segment.t});
                        segment.valueS = _this.model.marker.size.getValue({geo: d.geo,time: segment.t});
                        segment.valueC = _this.model.marker.color.getValue({geo: d.geo,time: segment.t});

                        if (segment.valueX > maxmin.valueXmax || maxmin.valueXmax == null) maxmin.valueXmax = segment.valueX;
                        if (segment.valueX < maxmin.valueXmin || maxmin.valueXmin == null) maxmin.valueXmin = segment.valueX;
                        if (segment.valueY > maxmin.valueYmax || maxmin.valueYmax == null) maxmin.valueYmax = segment.valueY;
                        if (segment.valueY < maxmin.valueYmin || maxmin.valueYmin == null) maxmin.valueYmin = segment.valueY;
                        if (segment.valueS > maxmin.valueSmax || maxmin.valueSmax == null) maxmin.valueSmax = segment.valueS;

                        if(index<trailSegmentData.length-1){
                            var view = d3.select(this);
                            view.append("circle").style("fill", segment.valueC);
                            view.append("line").style("stroke", segment.valueC);
                        }
                    })
                    .on("mousemove", function(segment, index) {
                        var geo = d3.select(this.parentNode).data()[0].geo;
                        _this.axisProjections({ geo: geo, time: segment.t });
                        _this.setTooltip(_this.timeFormatter(segment.t));
                        _this.entityLabels
                            .filter(function(f) {return f.geo == geo})
                            .classed("vzb-highlighted", true);
                    })
                    .on("mouseout", function(segment, index) {
                        _this.axisProjections();
                        _this.setTooltip();
                        _this.entityLabels.classed("vzb-highlighted", false);
                    })


            });

        },


        removeTrails: function(selection) {
            var _this = this;
            selection = selection == null ? _this.model.entities.select : [selection];

            selection.forEach(function(d) {

                _this.entityTrails
                    .filter(function(f) {return f.geo == d.geo})
                    .selectAll("g").remove();
            });
        },


        revealTrails: function(selection, duration) {
            var _this = this;
            if(!this.model.time.trails || !this.model.entities.select.length) return;
            if(!duration)duration=0;


            selection = selection == null ? _this.model.entities.select : [selection];
            selection.forEach(function(d) {
                
                var trailStartTime = _this.timeFormatter.parse("" + d.trailStartTime);

                _this.entityTrails
                    .filter(function(f) { return f.geo == d.geo })
                    .selectAll("g")
                    .each(function(segment, index) {

                        var view = d3.select(this);

                        // segment is transparent if it is after current time or before trail StartTime
                        var transparent = (segment.t - _this.time >= 0) 
                            || (trailStartTime - segment.t >  0) 
                            //no trail segment should be visible if leading bubble is shifted backwards
                            || (d.trailStartTime - _this.timeFormatter(_this.time) >= 0);
                        
                        view.classed("vzb-invisible", transparent);

                        if (transparent) return;

                    
                        var next = this.parentNode.children[index + 1];
                        if (next == null) return;
                        next = next.__data__;
                    
                        if (segment.t - _this.time <= 0 && _this.time - next.t <= 0) {
                            next = _this.cached[d.geo];

                            view.select("line")
                                .attr("x2", _this.xScale(segment.valueX))
                                .attr("y2", _this.yScale(segment.valueY))
                                .attr("x1", _this.xScale(segment.valueX))
                                .attr("y1", _this.yScale(segment.valueY))
                                .transition().duration(duration).ease("linear")
                                .attr("x1", _this.xScale(next.valueX))
                                .attr("y1", _this.yScale(next.valueY));
                        }else{
                            view.select("line")
                                .attr("x2", _this.xScale(segment.valueX))
                                .attr("y2", _this.yScale(segment.valueY))
                                .attr("x1", _this.xScale(next.valueX))
                                .attr("y1", _this.yScale(next.valueY));
                        }
                    })
            });
        },


        resizeTrails: function(selection, duration) {
            var _this = this;
            if(!this.model.time.trails || !this.model.entities.select.length) return;
            if(!duration)duration=0;

            selection = selection == null ? _this.model.entities.select : [selection];
            selection.forEach(function(d) {
                
                _this.entityTrails
                    .filter(function(f) { return f.geo == d.geo })
                    .selectAll("g")
                    .each(function(segment, index) {

                        var view = d3.select(this);

                        view.select("circle")
                            .transition().duration(duration).ease("linear")
                            .attr("cy", _this.yScale(segment.valueY))
                            .attr("cx", _this.xScale(segment.valueX))
                            .attr("r", areaToRadius(_this.sScale(segment.valueS)));

                        var next = this.parentNode.children[index + 1];
                        if (next == null) return;
                        next = next.__data__;

                        view.select("line")
                            .transition().duration(duration).ease("linear")
                            .attr("x1", _this.xScale(next.valueX))
                            .attr("y1", _this.yScale(next.valueY))
                            .attr("x2", _this.xScale(segment.valueX))
                            .attr("y2", _this.yScale(segment.valueY));
                    })
            });
        },


        setTooltip: function(tooltipText) {
            if (tooltipText) {
                var mouse = d3.mouse(this.graph.node()).map(function(d) {return parseInt(d)});

                //position tooltip
                this.tooltip.classed("vzb-hidden", false)
                    .attr("style", "left:" + (mouse[0] + 50) + "px;top:" + (mouse[1] + 50) + "px")
                    .html(tooltipText);

            } else {

                this.tooltip.classed("vzb-hidden", true);
            }
        },

        /*
         * Shows and hides axis projections
         */
        axisProjections: function(d) {
            if (d != null) {

                var valueY = this.model.marker.axis_y.getValue(d);
                var valueX = this.model.marker.axis_x.getValue(d);
                var valueS = this.model.marker.size.getValue(d);
                var radius = areaToRadius(this.sScale(valueS))

                if (this.ui.whenHovering.showProjectionLineX) {
                    this.projectionX
                        .style("opacity", 1)
                        .attr("y2", this.yScale(valueY) + radius)
                        .attr("x1", this.xScale(valueX))
                        .attr("x2", this.xScale(valueX));
                }
                if (this.ui.whenHovering.showProjectionLineY) {
                    this.projectionY
                        .style("opacity", 1)
                        .attr("y1", this.yScale(valueY))
                        .attr("y2", this.yScale(valueY))
                        .attr("x1", this.xScale(valueX) - radius);
                }

                if (this.ui.whenHovering.higlightValueX) this.xAxisEl.call(
                    this.xAxis.highlightValue(valueX)
                );

                if (this.ui.whenHovering.higlightValueY) this.yAxisEl.call(
                    this.yAxis.highlightValue(valueY)
                );

            } else {

                this.projectionX.style("opacity", 0);
                this.projectionY.style("opacity", 0);
                this.xAxisEl.call(this.xAxis.highlightValue("none"));
                this.yAxisEl.call(this.yAxis.highlightValue("none"));

            }

        },

        /*
         * Highlights all hovered bubbles
         */
        highlightDataPoints: function() {
            var _this = this;
            
            this.someHighlighted = (this.model.entities.brush.length > 0);

            this.updateBubbleOpacity();

            if(this.someHighlighted){
                var d = _.clone(this.model.entities.brush[0]); 
                
                if(_this.model.time.lockNonSelected && _this.someSelected && !_this.model.entities.isSelected(d)){
                    d["time"] = _this.timeFormatter.parse(""+_this.model.time.lockNonSelected);
                }else{
                    d["time"] = _this.time;
                }
                
                this.axisProjections(d);
            }else{
                this.axisProjections();
            }
        },
        
        updateBubbleOpacity: function(duration){
            var _this = this;
            //if(!duration)duration = 0;
            
            var OPACITY_HIGHLT = 1.0;
            var OPACITY_HIGHLT_DIM = 0.6;
            var OPACITY_SELECT = 0.9;
            var OPACITY_SELECT_DIM = this.model.entities.opacityNonSelected;
            var OPACITY_REGULAR = 0.8;
                        
            this.entityBubbles
                //.transition().duration(duration)
                .style("opacity", function(d){
                
                    if(_this.someHighlighted){
                        //highlight or non-highlight
                        if (_this.model.entities.isHighlighted(d)) return OPACITY_HIGHLT;
                    }
                
                    if(_this.someSelected){
                        //selected or non-selected
                        return _this.model.entities.isSelected(d)? OPACITY_SELECT : OPACITY_SELECT_DIM;
                    }
                    
                    if(_this.someHighlighted) return OPACITY_HIGHLT_DIM;
                
                    return OPACITY_REGULAR;
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
