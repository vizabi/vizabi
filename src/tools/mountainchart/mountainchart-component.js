/*!
 * VIZABI MOUNTAINCHART
 */

(function () {

    "use strict";

    var Vizabi = this.Vizabi;
    var utils = Vizabi.utils;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) return;




    //MOUNTAIN CHART COMPONENT
    Vizabi.Component.extend('gapminder-mountainchart', {

        /**
         * Initializes the component (Mountain Chart).
         * Executed once before any template is rendered.
         * @param {Object} config The options passed to the component
         * @param {Object} context The component's parent
         */
        init: function (config, context) {

            var _this = this;
            this.name = 'mountainchart';
            this.template = 'src/tools/mountainchart/mountainchart.html';

            //define expected models for this component
            this.model_expects = [{
                    name: "time",
                    type: "time"
                },
                {
                    name: "entities",
                    type: "entities"
                },
                {
                    name: "marker",
                    type: "model"
                },
                {
                    name: "language",
                    type: "language"
                }];

            this.model_binds = {
                "change": function (evt) {
                    if (!_this._readyOnce) return;
                    if (evt.indexOf("change:time") != -1) return;
                    //console.log("change", evt);
                },
                'change:time:value': function () {
                    //console.log("change time value");
                    _this.updateTime();
                    if(_this.model.time.yMaxMethod==="immediate")_this._adjustMaxY();
                    _this.redrawDataPoints();
                    _this.redrawSelectList();
                },
                'change:time:xLogStops': function () {
                    _this.updateSize();
                },
                "change:entities:brush": function () {
                  if (!_this._readyOnce) return;
                  //console.log("EVENT change:entities:brush");
                  _this.highlightDataPoints();
                    _this.updateOpacity();
                },
                'change:entities:select': function () {
                  if (!_this._readyOnce) return;
                  //console.log("EVENT change:entities:select");
                  _this.selectDataPoints();
                    _this.redrawSelectList();
                    _this.updateOpacity();
                    _this.redrawDataPoints();
                },
                'change:time:yMaxMethod': function () {
                    var method = _this.model.time.yMaxMethod;
                    
                    if(method!=="immediate") _this.updateTime(_this.model.time.end);
                    _this._adjustMaxY(method);
                    if(method!=="immediate") _this.updateTime();
                    _this.redrawDataPoints();
                },
                'change:marker': function (evt) {
                    if (!_this._readyOnce) return;
                    //console.log("EVENT change:marker", evt);                    
                    if (evt.indexOf("min") > -1 || evt.indexOf("max") > -1) {
                      _this.updateSize();
                      _this.updateTime();
                      _this._adjustMaxY();
                      _this.redrawDataPoints();
                    }
                    
                    _this.markersUpdatedRecently = true;
                },
                'change:marker:group:merge': function (evt) {
                    if (!_this._readyOnce) return;
                    _this.markersUpdatedRecently = true;
                    _this.ready();
                },
                'change:marker:stack:merge': function (evt) {
                    if (!_this._readyOnce) return;
                    _this.markersUpdatedRecently = true;
                    _this.ready();
                },
                'change:entities:opacitySelectDim': function () {
                  _this.updateOpacity();
                },
                'change:entities:opacityRegular': function () {
                  _this.updateOpacity();
                }
            }



            this._super(config, context);

            var MountainChartMath = Vizabi.Helper.get("gapminder-mountainchart-math");
            var MountainChartExport = Vizabi.Helper.get("gapminder-mountainchart-export");
            this._math = new MountainChartMath(this);
            this._export = new MountainChartExport(this);

            this.xScale = null;
            this.yScale = null;
            this.cScale = null;

            this.xAxis = d3.svg.axisSmart();

            this.cached = {};
            this.mesh = [];

            // define path generator
            this.area = d3.svg.area()
                .x(function (d) { return _this.xScale(d.x) })
                .y0(function (d) { return _this.yScale(d.y0) })
                .y1(function (d) { return _this.yScale(d.y0 + d.y) });

            this.stack = d3.layout.stack()
                .order("reverse")
                .values(function (d) { return _this.cached[d.KEY()] });
            
            

        },

        /**
         * DOM is ready
         */
        readyOnce: function () {

            //this.element = d3.select(this.element);

            // reference elements
            this.graph = this.element.select('.vzb-mc-graph');
            this.xAxisEl = this.graph.select('.vzb-mc-axis-x');
            this.xTitleEl = this.graph.select('.vzb-mc-axis-x-title');
            this.yearEl = this.graph.select('.vzb-mc-year');
            this.mountainMergeStackedContainer = this.graph.select('.vzb-mc-mountains-mergestacked');
            this.mountainMergeGroupedContainer = this.graph.select('.vzb-mc-mountains-mergegrouped');
            this.mountainContainer = this.graph.select('.vzb-mc-mountains');
            this.mountainLabelContainer = this.graph.select('.vzb-mc-mountains-labels');
            this.mountains = null;
            this.tooltip = this.element.select('.vzb-tooltip');

            var _this = this;
            this.on("resize", function () {
                //console.log("acting on resize");
                _this.updateSize();
                _this.updateTime(); // respawn is needed
                _this.redrawDataPoints();
                _this.redrawSelectList();
            });

            this.KEY = this.model.entities.getDimension();
            this.TIMEDIM = this.model.time.getDimension();

            this.updateUIStrings();
            this.updateIndicators();
            this.updateEntities();
            this.updateSize();
            this.updateTime();
            this._adjustMaxY();
            this.redrawDataPoints();
            this.highlightDataPoints();
            this.selectDataPoints();
            this.redrawSelectList();
            this.updateOpacity();
            
            this.mountainContainer.select(".vzb-mc-prerender").remove();
        },

        ready: function(){
            var _this = this;
            if (_this.markersUpdatedRecently) {
                _this.markersUpdatedRecently = false;
                //console.log("change marker stack");
                _this.updateUIStrings();
                _this.updateIndicators();
                _this.updateEntities();
                _this.updateSize();
                _this.updateTime();
                _this._adjustMaxY();
                _this.redrawDataPoints();
                _this.highlightDataPoints();
                _this.selectDataPoints();
                _this.redrawSelectList();
                _this.updateOpacity();              
            }
        },
        
        
        updateUIStrings: function(){
            this.translator = this.model.language.getTFunction();

            var xTitle = this.xTitleEl.selectAll("text").data([0]);
            xTitle.enter().append("text");
            xTitle.text(this.translator("unit/" + this.model.marker.axis_x.unit));

        },

        /**
         * Updates indicators
         */
        updateIndicators: function () {
            var _this = this;

            //scales
            this.yScale = this.model.marker.axis_y.getScale();
            this.xScale = this.model.marker.axis_x.getScale();
            this.cScale = this.model.marker.color.getScale();
            
            this.xAxis.tickFormat(_this.model.marker.axis_x.tickFormatter);


            //TODO i dunno how to remove this magic constant
            // we have to know in advance where to calculate distributions
            //this.xScale
            //    .domain(this.model.marker.axis_x.scaleType == "log" ? [0.05, 1000] : [0, 100]);

        },
        
        
        /**
         * Updates entities
         */
        updateEntities: function () {
            var _this = this;

            // construct pointers
            var stackMode = this.model.marker.stack.which;
            var endTime = this.model.time.end;
            this.model.entities._visible = this.model.marker.getKeys()
                .map(function (d) {
                    var pointer = {};
                    pointer[_this.KEY] = d[_this.KEY];
                    pointer[_this.TIMEDIM] = endTime;
                    pointer.KEY = function(){return this[_this.KEY]};
                    pointer.sortValue = [_this.model.marker.axis_y.getValue(pointer), 0];
                    return pointer;
                })
            
            
            //TODO: optimise this!
            this.groupedPointers = d3.nest()
                .key(function (d) {
                    return _this.model.marker.stack.use === "property"?
                        _this.model.marker.stack.getValue(d)
                        : 
                        _this.model.marker.group.getValue(d)
                    })
                .sortValues(function (a, b) {return b.sortValue[0] - a.sortValue[0]})
                .entries(this.model.entities._visible);
            
            this.groupedPointers.forEach(function (group) {
                    var groupSortValue = d3.sum(group.values.map(function (m) {
                        return m.sortValue[0];
                    }));
                    group.values.forEach(function (d) {
                        d.sortValue[1] = groupSortValue;
                    })
                })
            
            var sortGroupKeys = {};
            _this.groupedPointers.map(function(m){sortGroupKeys[m.key] = m.values[0].sortValue[1] });
            
            
            // update the stacked pointers
            if (_this.model.marker.stack.which === "none"){
                this.stackedPointers = [];
                this.model.entities._visible.sort(function (a, b) {return b.sortValue[0] - a.sortValue[0];})

            }else{
                this.stackedPointers = d3.nest()
                    .key(function (d) { return _this.model.marker.stack.getValue(d) })
                    .key(function (d) { return _this.model.marker.group.getValue(d) })
                    .sortKeys(function(a,b) {return sortGroupKeys[b] - sortGroupKeys[a]})
                    .sortValues(function (a, b) {return b.sortValue[0] - a.sortValue[0]})
                    .entries(this.model.entities._visible);
                
                this.model.entities._visible.sort(function (a, b) {return b.sortValue[1] - a.sortValue[1];})
            }
                      
            //console.log(JSON.stringify(this.model.entities._visible.map(function(m){return m.geo})))
            //console.log(this.stackedPointers)

            
            this.mountainsMergeStacked = this.mountainMergeStackedContainer.selectAll('.vzb-mc-mountain')
                .data(this.stackedPointers);
            //exit selection
            this.mountainsMergeStacked.exit().remove();
            
            //enter selection -- init
            this.mountainsMergeStacked.enter().append("path")
                .attr("class", "vzb-mc-mountain")
                .on("mousemove", function (d, i) {
                
                    var mouse = d3.mouse(_this.graph.node()).map(function (d) { return parseInt(d); });

                    //position tooltip
                    _this.tooltip.classed("vzb-hidden", false)
                        .attr("style", "left:" + (mouse[0] + 25) + "px;top:" + (mouse[1] + 25) + "px")
                        .html(_this.translator("region/" + d.key));

                })
                .on("mouseout", function (d, i) {
                    _this.tooltip.classed("vzb-hidden", true);
                })
                .on("click", function (d, i) {
                });
            
            
            //bind the data to DOM elements
            this.mountainsMergeGrouped = this.mountainMergeGroupedContainer.selectAll('.vzb-mc-mountain')
                .data(this.groupedPointers);

            //exit selection
            this.mountainsMergeGrouped.exit().remove();

            //enter selection -- init
            this.mountainsMergeGrouped.enter().append("path")
                .attr("class", "vzb-mc-mountain")
                .on("mousemove", function (d, i) {
                
                    var mouse = d3.mouse(_this.graph.node()).map(function (d) { return parseInt(d); });

                    //position tooltip
                    _this.tooltip.classed("vzb-hidden", false)
                        .attr("style", "left:" + (mouse[0] + 25) + "px;top:" + (mouse[1] + 25) + "px")
                        .html(_this.translator("region/" + d.key));

                })
                .on("mouseout", function (d, i) {
                    _this.tooltip.classed("vzb-hidden", true);
                })
                .on("click", function (d, i) {
                });
            
            
            
            
            //bind the data to DOM elements
            this.mountains = this.mountainContainer.selectAll('.vzb-mc-mountain')
                .data(this.model.entities._visible);

            //exit selection
            this.mountains.exit().remove();

            //enter selection -- init circles
            this.mountains.enter().append("path")
                .attr("class", "vzb-mc-mountain")
                .on("mousemove", function (d, i) {
                
                    _this.model.entities.highlightEntity(d);
                
                
                    var mouse = d3.mouse(_this.graph.node()).map(function (d) {
                        return parseInt(d);
                    });

                    //position tooltip
                    _this.tooltip.classed("vzb-hidden", false)
                        .attr("style", "left:" + (mouse[0] + 25) + "px;top:" + (mouse[1] + 25) + "px")
                        .html(_this.model.marker.label.getValue(d));

                })
                .on("mouseout", function (d, i) {
                    _this.tooltip.classed("vzb-hidden", true);
                    _this.model.entities.clearHighlighted();
                })
                .on("click", function (d, i) {
                    _this.model.entities.selectEntity(d);
                });
            
        },
        
        /*
         * Highlights all hovered shapes
         */
        highlightDataPoints: function () {
            var _this = this;
            this.someHighlighted = (this.model.entities.brush.length > 0);
            
            if (this.model.entities.brush.length==1) {
                var key = this.model.entities.brush[0][_this.KEY];
                var sigma = _this._math.giniToSigma(_this.values.size[key]);
                var mu = _this._math.gdpToMu(_this.values.axis_x[key], sigma);
                
                // here we highlight the value where the mountain is reaching its peak
                // which is mode. not mean, not median and not mu. see https://en.wikipedia.org/wiki/Log-normal_distribution
                this.xAxisEl.call(this.xAxis.highlightValue( Math.exp(mu - sigma*sigma) ));
            }else{
                this.xAxisEl.call(this.xAxis.highlightValue("none"));
            }
            
            if(!this.mountainLabels || !this.someSelected) return;
            this.mountainLabels.classed("vzb-highlight", function(d){return _this.model.entities.isHighlighted(d)});
        },



        selectDataPoints: function () {
            var _this = this;
            this.someSelected = (this.model.entities.select.length > 0);
            
            var listData = this.model.entities._visible.filter(function(f){
                    return _this.model.entities.isSelected(f);
                })
                .sort(function (a, b) {
                    if(b.max&&a.max) return b.max - a.max;
                    return b.sortValue[0] - a.sortValue[0];
                });
            
            this.mountainLabels = this.mountainLabelContainer.selectAll("g").data(listData)
            this.mountainLabels.exit().remove();
            this.mountainLabels.enter().append("g")
                .attr("class", "vzb-mc-label")
                .each(function(d, i){
                    d3.select(this).append("circle");
                    d3.select(this).append("text").attr("class", "vzb-mc-label-shadow");
                    d3.select(this).append("text");
                })
                .on("mousemove", function (d, i) {
                    _this.model.entities.highlightEntity(d);
                })
                .on("mouseout", function (d, i) {
                    _this.model.entities.clearHighlighted();
                })
                .on("click", function (d, i) {
                    _this.model.entities.clearHighlighted();
                    _this.model.entities.selectEntity(d);
                });
                
        },
        
        
        redrawSelectList: function(){
            var _this = this;
            if(!this.mountainLabels || !this.someSelected) return;
            
            var sample = this.mountainLabelContainer.append("g").attr("class", "vzb-mc-label").append("text").text("0");
            var fontHeight = sample[0][0].getBBox().height;
            d3.select(sample[0][0].parentNode).remove();
            
            this.mountainLabels
                .attr("transform", function(d,i){return "translate(0," + (fontHeight*i) + ")"})
                .each(function(d, i){
                    var string = _this.values.label[d.KEY()] 
                        + ": " + 
                        _this.model.marker.axis_y.tickFormatter(_this.values.axis_y[d.KEY()])
                        + (i==0?" people":"");
                
                    d3.select(this).select("circle")
                        .attr("r", fontHeight/2.5)
                        .attr("cx", fontHeight/2)
                        .attr("cy", fontHeight/1.5)
                        .style("fill", _this.cScale(_this.values.color[d.KEY()]))
                    
                    
                    d3.select(this).selectAll("text")
                        .attr("x", fontHeight)
                        .attr("y", fontHeight)
                        .text(string)
            }) 
        },

        updateOpacity: function () {
          var _this = this;
          //if(!duration)duration = 0;

          var OPACITY_HIGHLT = 1.0;
          var OPACITY_HIGHLT_DIM = 0.3;
          var OPACITY_SELECT = 0.8;
          var OPACITY_REGULAR = this.model.entities.opacityRegular;
          var OPACITY_SELECT_DIM = this.model.entities.opacitySelectDim;

          this.mountains
            //.transition().duration(duration)
            .style("opacity", function (d) {

              if (_this.someHighlighted) {
                //highlight or non-highlight
                if (_this.model.entities.isHighlighted(d)) return OPACITY_HIGHLT;
              }

              if (_this.someSelected) {
                //selected or non-selected
                return _this.model.entities.isSelected(d) ? OPACITY_SELECT : OPACITY_SELECT_DIM;
              }

              if (_this.someHighlighted) return OPACITY_HIGHLT_DIM;

              return OPACITY_REGULAR;
            });
            
            this.mountainsMergeGrouped
                .style("opacity", _this.someSelected ? OPACITY_SELECT_DIM : OPACITY_REGULAR);
            
            this.mountainsMergeStacked
                .style("opacity", _this.someSelected ? OPACITY_SELECT_DIM : OPACITY_REGULAR);


          var someSelectedAndOpacityZero = _this.someSelected && _this.model.entities.opacitySelectDim < 0.01;

          // when pointer events need update...
          if (someSelectedAndOpacityZero != this.someSelectedAndOpacityZero_1) {
            this.mountains.style("pointer-events", function (d) {
              return (!someSelectedAndOpacityZero || _this.model.entities.isSelected(d)) ?
                "visible" : "none";
            });
          }

          this.someSelectedAndOpacityZero_1 = _this.someSelected && _this.model.entities.opacitySelectDim < 0.01;
        },

        
        
        
        

        /*
         * UPDATE TIME:
         * Ideally should only update when time or data changes
         */
        updateTime: function (time) {
            var _this = this;

            
            if(time==null)time = this.model.time.value;
            this.yearEl.text(time.getFullYear().toString());
            var filter = {};
            filter[_this.TIMEDIM] = time;
            this.values = this.model.marker.getValues(filter, [_this.KEY]);

            
            //regenerate distributions
            this.model.entities._visible.forEach(function (d, i) {
                var points = _this._spawn(_this.values, d)
                _this.cached[d.KEY()] = points;
                d.hidden = points.length==0 || d3.sum(points.map(function(m){return m.y}))==0;
            });

            
            //recalculate stacking
            this.stackedPointers.forEach(function (group) {
                var toStack = [];
                group.values.forEach(function(subgroup){
                    toStack = toStack.concat(subgroup.values.filter(function(f){return !f.hidden}))
                })
                _this.stack(toStack);
            })

        },



//        _peakValue: function (values, d) {
//            var _this = this;
//
//            var norm = values.axis_y[d.KEY()];
//            var mean = values.axis_x[d.KEY()];
//            var variance = values.size[d.KEY()];
//
//            return norm * this._math.pdf.y(Math.exp(Math.log(mean) - variance), Math.log(mean), variance, this._math.pdf.DISTRIBUTIONS_LOGNORMAL);
//        },


        /**
         * Executes everytime the container or vizabi is resized
         * Ideally,it contains only operations related to size
         */
        updateSize: function (meshLength) {

            var margin;
            var tick_spacing;
            var padding = 2;

            switch (this.getLayoutProfile()) {
            case "small":
                margin = { top: 10, right: 10, left: 10, bottom: 30 };
                tick_spacing = 60;
                break;
            case "medium":
                margin = { top: 20, right: 10, left: 10, bottom: 40 };
                tick_spacing = 80;
                break;
            case "large":
                margin = { top: 30, right: 10, left: 10, bottom: 50  };
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
                .attr("x", width / 2)
                .attr("y", height / 3 * 1.5)
                .style("font-size", Math.max(height / 4, width / 4) + "px");

            //update scales to the new range
            this.yScale.range([height, 0]);
            this.xScale.range([0, width]);

            // we need to generate the distributions based on mu, variance and scale
            // we span a uniform range of 'points' across the entire X scale,
            // resolution: 1 point per pixel. If width not defined assume it equal 500px
            if(!meshLength) meshLength =  Math.max(100,(width ? width / 5 : 100));
            var scaleType = this._readyOnce? this.model.marker.axis_x.scaleType : "log";
            var rangeFrom = scaleType == "linear" ? this.xScale.domain()[0] : Math.log(this.xScale.domain()[0]);
            var rangeTo = scaleType == "linear" ? this.xScale.domain()[1] : Math.log(this.xScale.domain()[1]);
            var rangeStep = (rangeTo - rangeFrom) / meshLength;
            this.mesh = d3.range(rangeFrom, rangeTo, rangeStep);
                
            if (scaleType != "linear") {
                this.mesh = this.mesh.map(function (dX) {return Math.exp(dX)});
            }else{
                this.mesh = this.mesh.filter(function (dX) {return dX > 0});
            }                

            //axis is updated
            this.xAxis.scale(this.xScale)
                .orient("bottom")
                .tickSize(6, 0)
                .tickSizeMinor(3, 0)
                .labelerOptions({
                    scaleType: scaleType,
                    toolMargin: margin,
                    method: this.xAxis.METHOD_REPEATING,
                    stops: this._readyOnce? this.model.time.xLogStops : [1] 
                });


            this.xAxisEl
                .attr("transform", "translate(0," + height + ")")
                .call(this.xAxis);

            this.xTitleEl
                .attr("transform", "translate(0," + height + ")")
                .select("text")
                .attr("dy", "-0.36em")
            
            if(this.model.time.record) this._export.open(this.element, width + margin.left + margin.right, height + margin.top + margin.bottom);

        },


        // get Y value for every X
        _spawn: function (values, d) {
            var _this = this;

            var norm = values.axis_y[d.KEY()];
            var sigma = _this._math.giniToSigma(values.size[d.KEY()]);
            var mu = _this._math.gdpToMu(values.axis_x[d.KEY()], sigma);

            if (!norm || !mu || !sigma) return [];

            return this.mesh.map(function (dX) {
                return {
                    x: dX,
                    y0: 0, // the initial base of areas is at zero
                    y: norm * _this._math.pdf.y(dX, mu, sigma, _this._math.pdf.DISTRIBUTIONS_LOGNORMAL, _this.model.marker.axis_x.scaleType)
                }
            });

        },

        
        _adjustMaxY: function(method){
            var _this = this;
            
            var yMax = 0;
            if(method==="total"){
                //TODO: simplification is taken here. max thickness of mountains is being summed
                // but as the mountains are not aligned this sum will be larger than the actual total height
                this.model.entities._visible.forEach(function(d){
                    var points = _this.cached[d.KEY()];
                    d.max = d3.max(points.map(function(m){return m.y + m.y0}));
                    var max = d3.max(points.map(function(m){return m.y}));
                    if(max > 0) yMax += max;
                })
            }else{
                this.model.entities._visible.forEach(function(d){
                    var points = _this.cached[d.KEY()];
                    d.max = d3.max(points.map(function(m){return m.y + m.y0}));
                    if(d.max > yMax) yMax = d.max;
                })
            }
            this.yScale.domain([0, yMax]);
            
            if(!yMax)utils.warn("Setting yMax to " + yMax + ". You failed again :-/");
        },


        /*
         * REDRAW DATA POINTS:
         * Here plotting happens
         */
        redrawDataPoints: function () {
            var _this = this;
            var mergeGrouped = _this.model.marker.group.merge;
            var mergeStacked = _this.model.marker.stack.merge;
            
            var record = this.model.time.record;
            var year = this.model.time.value.getFullYear();

            //update selection
            //var speed = this.model.time.speed;
//            
//            if (!this.shapes) this.shapes = {}
//            this.shapes[this.model.time.value.getFullYear().toString()] = 
//                this.mesh.map(function (d, i) {
//                    return d3.format(".2e")(d3.max(utils.values(_this.cached)
//                            .filter(function (f) {return f.length > 0})
//                            .map(function (m) {return m[i].y + m[i].y0})
//                        ))
//                    
//                })
            
            
                this.mountainsMergeStacked
                    .each(function (d) {
                        var view = d3.select(this);
                    
                        view.classed("vzb-hidden", !mergeStacked);
                        if(!mergeStacked) return;
                    
                        if(d.key == "all"){
                            var visible = d.values[0].values.filter(function(f){return !f.hidden});
                            var first = visible[0].KEY();
                            
                            var array = _this.mesh.map(function(m, i){
                                return { x: m, y0: 0, y: _this.cached[first][i].y0 + _this.cached[first][i].y }
                            })
                            
                            view //.transition().duration(speed).ease("linear")
                                .style("fill", "grey")
                                .attr("d", _this.area(array))
                            
                            if(record) _this._export.write({type: "path", id: d.key, time: year, fill: "grey", d: _this.area(array)});
                        }else{
                        
                            //TODO here should come the processing for regional stacking, but we haven't yet needed this case
                        }

                    })
            
                this.mountainsMergeGrouped
                    .each(function (d) {
                        var view = d3.select(this);
                    
                        view.classed("vzb-hidden", !mergeGrouped || mergeStacked);
                        if(!mergeGrouped || mergeStacked) return;
                    
                        var visible = d.values.filter(function(f){return !f.hidden});
                        //console.log(d, visible.map(function(m){return m.geo}))
                    
                        var first = visible[0].KEY();
                        var last = visible[visible.length-1].KEY();
                        //console.log(first, _this.cached[first].length, last, _this.cached[last].length)
                    
                        var array = _this.mesh.map(function(m, i){
                            return { x: m, y0: _this.cached[last][i].y0, y: _this.cached[first][i].y0 + _this.cached[first][i].y - _this.cached[last][i].y0 }
                        })
                        
                        view //.transition().duration(speed).ease("linear")
                            .style("fill", _this.cScale(_this.values.color[first]))
                            .attr("d", _this.area(array))
                        
                        if(record) _this._export.write({type: "path", id: d.key, time: year, fill: _this.cScale(_this.values.color[first]), d: _this.area(array)});

                    })
                                
                                

                this.mountains.each(function (d, i) {
                    var view = d3.select(this);
                    var hidden = d.hidden || ((mergeGrouped || mergeStacked) && !_this.model.entities.isSelected(d));
                    view.classed("vzb-hidden", hidden);
                    if (hidden) return;
                    view //.transition().duration(speed).ease("linear")
                        .style("fill", _this.cScale(_this.values.color[d.KEY()]))
                        .attr("d", _this.area(_this.cached[d.KEY()]))
                    
                    if(record) _this._export.write({type: "path", id: d.KEY(), time: year, fill: _this.cScale(_this.values.color[d.KEY()]), d: _this.area(_this.cached[d.KEY()])});

                })
        },
        
        
        
        domReady: function(){
            var _this = this;
            var shape = [];

            
            this.element = d3.select(this.element);
            
            if(!this.precomputedShapes) return;

            // reference elements
            this.graph = this.element.select('.vzb-mc-graph');
            this.xAxisEl = this.graph.select('.vzb-mc-axis-x');
            this.xTitleEl = this.graph.select('.vzb-mc-axis-x-title');
            this.yearEl = this.graph.select('.vzb-mc-year');
            this.mountainContainer = this.graph.select('.vzb-mc-mountains');
            
            if(this.model.marker.stack.use == "property"){
                shape = this.precomputedShapes["incomeMount_shape_stack_region"][_this.model.time.value.getFullYear()]
            }else{
                shape = this.precomputedShapes["incomeMount_shape_stack_" + this.model.marker.stack.which][_this.model.time.value.getFullYear()]
            } 
            
            
                
            this.xScale = d3.scale.log().domain([0.05, 1000]);
            this.yScale = d3.scale.linear().domain([0, d3.max(shape.map(function(m){return m})) ]);

            _this.updateSize(shape.length);
            
            shape = shape.map(function(m,i){return {x: _this.mesh[i], y0:0, y:+m}})
            
            var mountains = this.mountainContainer.selectAll('.vzb-mc-prerender')
                .data([0]);
            
            mountains.enter().append("path")
                .attr("class", "vzb-mc-prerender")
                .style("fill", "grey")
                .style("opacity", 0)
                .attr("d", _this.area(shape))
                .transition().duration(4000).ease("linear")
                .style("opacity", 1);
        }
        
        
    });


}).call(this);