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
                    _this.redrawDataPoints();
                    _this.redrawSelectList();
                    _this.updatePovertyLine();
                },
                'change:time:povertyCutoff': function () {
                    //console.log("change time value");
                    _this.updateTime();
                    _this._adjustMaxY({force:true});
                    _this.redrawDataPoints();
                    _this.redrawSelectList();
                    _this.updatePovertyLine();
                },
                'change:time:gdpFactor': function () {
                    //console.log("change time value");
                    _this.updateTime();
                    _this._adjustMaxY({force:true});
                    _this.redrawDataPoints();
                    _this.redrawSelectList();
                    _this.updatePovertyLine();
                },
                'change:time:gdpShift': function () {
                    //console.log("change time value");
                    _this.updateTime();
                    _this._adjustMaxY({force:true});
                    _this.redrawDataPoints();
                    _this.redrawSelectList();
                    _this.updatePovertyLine();
                },
                'change:time:povertyFade': function () {
                    //console.log("change time value");
                    _this.updateTime();
                    _this._adjustMaxY({force:true});
                    _this.redrawDataPoints();
                    _this.redrawSelectList();
                    _this.updatePovertyLine();
                },
                'change:time:xPoints': function () {
                    //console.log("acting on resize");
                    _this.updateSize();
                    _this.updateTime(); // respawn is needed
                    _this.redrawDataPoints();
                    _this.redrawSelectList();
                    _this.updatePovertyLine();
                },
                'change:time:record': function () {
                    //console.log("change time record");
                    if(_this.model.time.record) {
                        _this._export.open(this.element, this.name);
                    }else{
                        _this._export.reset();
                    }
                },
                'change:time:xLogStops': function () {
                    _this.updateSize();
                },
                "change:entities:highlight": function () {
                  if (!_this._readyOnce) return;
                  //console.log("EVENT change:entities:highlight");
                  _this.highlightEntities();
                    _this.updateOpacity();
                },
                'change:entities:select': function () {
                  if (!_this._readyOnce) return;
                  //console.log("EVENT change:entities:select");
                  _this.selectEntities();
                    _this.redrawSelectList();
                    _this.updateOpacity();
                    _this.redrawDataPoints();
                },
                'change:time:yMaxMethod': function () {
                    _this._adjustMaxY({force: true});
                    _this.redrawDataPoints();
                },
                'change:time:povertyline': function () {
                    _this.updatePovertyLine();
                },
                'change:marker': function (evt) {
                    if (!_this._readyOnce) return;
                    //console.log("EVENT change:marker", evt);                    
                    if (evt.indexOf("min") > -1 || evt.indexOf("max") > -1) {
                      _this.updateSize();
                      _this.updateTime();
                      _this._adjustMaxY({force:true});
                      _this.redrawDataPoints();
                    }
                },
                'change:marker:group': function (evt) {
                    if (!_this._readyOnce) return;
                    if(evt == "change:marker:group:merge") return;
                    //console.log("group event")
                    _this.ready();
                },
                
                'change:marker:group:merge': function (evt) {
                    if (!_this._readyOnce) return;
                    //console.log("group merge event")
                    _this.updateTime();
                    _this.redrawDataPoints();
                },
                'change:marker:stack': function (evt) {
                    if (!_this._readyOnce) return;
                    _this.ready();
                },
                'change:entities:opacitySelectDim': function () {
                  _this.updateOpacity();
                },
                'change:entities:opacityRegular': function () {
                  _this.updateOpacity();
                },
                'change:time:dragging': function () {
                  if (!_this._readyOnce) return;
                  if(_this.model.marker.stack.which === "none") return;
                    
                  if(_this.model.time.dragging){
                    _this.groupMergeTemp = _this.model.marker.group.merge;
                    _this.model.marker.group.merge = true;
                  }
                    
                  if(!_this.model.time.dragging){
                    _this.model.marker.group.merge = _this.groupMergeTemp;
                  }
                },
                'change:time:playing': function () {
                  if (!_this._readyOnce) return;
                  if(_this.model.marker.stack.which === "none") return;    
                  
                  if(_this.model.time.playing){
                    _this.groupMergeTemp = _this.model.marker.group.merge;
                    _this.model.marker.group.merge = true;
                  }
                    
                  if(!_this.model.time.playing){
                    _this.model.marker.group.merge = _this.groupMergeTemp;
                  }
                }
            }



            this._super(config, context);

            var MountainChartMath = Vizabi.Helper.get("gapminder-mountainchart-math");
            var Exporter = Vizabi.Helper.get("gapminder-svgexport");
            this._math = new MountainChartMath(this);
            this._export = new Exporter(this);
            this._export
                .prefix("vzb-mc-")
                .deleteClasses(["vzb-mc-mountains-mergestacked", "vzb-mc-mountains-mergegrouped", "vzb-mc-mountains", "vzb-mc-year", "vzb-mc-mountains-labels", "vzb-mc-axis-labels"]);

            this.xScale = null;
            this.yScale = null;
            this.cScale = null;

            this.xAxis = d3.svg.axisSmart();

            this.cached = {};
            this.mesh = [];
            this.yMax = 0;
            

            this.rescale = function(x){
                return Math.exp( _this.model.time.gdpFactor* Math.log(x) + _this.model.time.gdpShift  );
            }
            this.unscale = function(x){
                return Math.exp((Math.log( x ) - _this.model.time.gdpShift )/_this.model.time.gdpFactor);
            }

            // define path generator
            this.area = d3.svg.area()
                .interpolate("basis")
                .x(function (d) { return _this.xScale(_this.rescale(d.x)) })
                .y0(function (d) { return _this.yScale(d.y0) })
                .y1(function (d) { return _this.yScale(d.y0 + d.y) });

                           
            this.stack = d3.layout.stack()
                .order("reverse")
                .values(function (d) { return _this.cached[d.KEY()] })
                .out(function out(d, y0, y) {
                  d.y0 = y0;
                  if(_this.yMax < y+y0) _this.yMax = y+y0;
                });
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
            this.tooltip = this.element.select('.vzb-tooltip');
            this.povertylineEl = this.element.select('.vzb-mc-povertyline');
            this.eventAreaEl = this.element.select(".vzb-mc-eventarea");
            
            this.eventAreaEl.on("mousemove", function(){
                var mouse = d3.mouse(_this.graph.node()).map(function (d) { return parseInt(d); });

                //console.log(mouse[0], )
                _this.updatePovertyLine({level: _this.xScale.invert(mouse[0]), full: true})
            
            }).on("mouseout", function(){
                var mouse = d3.mouse(_this.graph.node()).map(function (d) { return parseInt(d); });

                _this.updatePovertyLine();
            
            })

            var _this = this;
            this.on("resize", function () {
                //console.log("acting on resize");
                _this.updateSize();
                _this.updateTime(); // respawn is needed
                _this.redrawDataPoints();
                _this.redrawSelectList();
                _this.updatePovertyLine();
            });

            this.KEY = this.model.entities.getDimension();
            this.TIMEDIM = this.model.time.getDimension();

            this.updateUIStrings();
            this.updateIndicators();
            this.updateEntities();
            this.updateSize();
            this.updateTime();
            this._adjustMaxY({force:true});
            this.redrawDataPoints();
            this.highlightEntities();
            this.selectEntities();
            this.redrawSelectList();
            this.updateOpacity();
            this.updatePovertyLine();
            
            this.mountainContainer.select(".vzb-mc-prerender").remove();
            
        },

        ready: function(){
//            var _this = this;
//            if (_this.markersUpdatedRecently) {
//                _this.markersUpdatedRecently = false;
//                console.log("ready");
                this.updateUIStrings();
                this.updateIndicators();
                this.updateEntities();
                this.updateSize();
                this.updateTime();
                this._adjustMaxY({force:true});
                this.redrawDataPoints();
                this.highlightEntities();
                this.selectEntities();
                this.redrawSelectList();
                this.updateOpacity();      
                this.updatePovertyLine();
//            }
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
            var endTime = this.model.time.end;
            this.mountainPointers = this.model.marker.getKeys()
                .map(function (d) {
                    var pointer = {};
                    pointer[_this.KEY] = d[_this.KEY];
                    pointer[_this.TIMEDIM] = endTime;
                    pointer.KEY = function(){return this[_this.KEY]};
                    pointer.sortValue = [_this.model.marker.axis_y.getValue(pointer), 0];
                    pointer.aggrLevel = 0;
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
                .entries(this.mountainPointers);
            
            
            var groupManualSort = this.model.marker.group.manualSorting;
            this.groupedPointers.forEach(function (group) {
                    var groupSortValue = d3.sum(group.values.map(function (m) {
                        return m.sortValue[0];
                    }));
                
                    if(groupManualSort && groupManualSort.length>1) groupSortValue = groupManualSort.indexOf(group.key);
                        
                    group.values.forEach(function (d) {
                        d.sortValue[1] = groupSortValue;
                    })
                    
                    group[_this.model.entities.getDimension()] = group.key; // hack to get highlihgt and selection work
                    group.KEY = function(){return this.key};
                    group.aggrLevel = 1;
                })
            
            var sortGroupKeys = {};
            _this.groupedPointers.map(function(m){sortGroupKeys[m.key] = m.values[0].sortValue[1] });
            
            
            // update the stacked pointers
            if (_this.model.marker.stack.which === "none"){
                this.stackedPointers = [];
                this.mountainPointers.sort(function (a, b) {return b.sortValue[0] - a.sortValue[0];})

            }else{
                this.stackedPointers = d3.nest()
                    .key(function (d) { return _this.model.marker.stack.getValue(d) })
                    .key(function (d) { return _this.model.marker.group.getValue(d) })
                    .sortKeys(function(a,b) {return sortGroupKeys[b] - sortGroupKeys[a]})
                    .sortValues(function (a, b) {return b.sortValue[0] - a.sortValue[0]})
                    .entries(this.mountainPointers);
                
                this.mountainPointers.sort(function (a, b) {return b.sortValue[1] - a.sortValue[1];})
                
                
                this.stackedPointers.forEach(function (stack) {
                    stack.KEY = function(){return this.key};
                    stack[_this.model.entities.getDimension()] = stack.key; // hack to get highlihgt and selection work
                    stack.aggrLevel = 2;
                })
            }
                      
            //console.log(JSON.stringify(this.mountainPointers.map(function(m){return m.geo})))
            //console.log(this.stackedPointers)

            
            //bind the data to DOM elements
            this.mountainsMergeStacked = this.mountainContainer.selectAll('.vzb-mc-mountain.vzb-mc-aggrlevel2')
                .data(this.stackedPointers);
            this.mountainsMergeGrouped = this.mountainContainer.selectAll('.vzb-mc-mountain.vzb-mc-aggrlevel1')
                .data(this.groupedPointers);
            this.mountainsAtomic = this.mountainContainer.selectAll('.vzb-mc-mountain.vzb-mc-aggrlevel0')
                .data(this.mountainPointers);

            //exit selection -- remove shapes
            this.mountainsMergeStacked.exit().remove();
            this.mountainsMergeGrouped.exit().remove();
            this.mountainsAtomic.exit().remove();
            
            //enter selection -- add shapes
            this.mountainsMergeStacked.enter().append("path")
                .attr("class", "vzb-mc-mountain vzb-mc-aggrlevel2");
            this.mountainsMergeGrouped.enter().append("path")
                .attr("class", "vzb-mc-mountain vzb-mc-aggrlevel1");
            this.mountainsAtomic.enter().append("path")
                .attr("class", "vzb-mc-mountain vzb-mc-aggrlevel0");
            
            //add interaction
            this.mountainContainer.selectAll('.vzb-mc-mountain')
                .on("mousemove", this._interact().mousemove)
                .on("mouseout", this._interact().mouseout)
                .on("click", this._interact().click);
            
        },
    
        
        _interact: function() {
            var _this = this;
            
            return {
                mousemove: function (d, i) {
                    
                    _this.model.entities.highlightEntity(d);
                    
                    var mouse = d3.mouse(_this.graph.node()).map(function (d) { return parseInt(d); });

                    //position tooltip
                    _this.tooltip.classed("vzb-hidden", false)
                        .attr("style", "left:" + (mouse[0] + 25) + "px;top:" + (mouse[1] + 25) + "px")
                        .html(d.key?_this.translator("region/" + d.key):_this.model.marker.label.getValue(d));

                },
                mouseout: function (d, i) {
                    _this.tooltip.classed("vzb-hidden", true);
                    _this.model.entities.clearHighlighted();
                },
                click: function (d, i) {
                    _this.model.entities.selectEntity(d);
                }
            }
        
        },
        
        
        /*
         * Highlights all hovered shapes
         */
        highlightEntities: function () {
            var _this = this;
            this.someHighlighted = (this.model.entities.highlight.length > 0);
            
            if(!this.selectList || !this.someSelected) return;
            this.selectList.classed("vzb-highlight", function(d){return _this.model.entities.isHighlighted(d)});
        },



        selectEntities: function () {
            var _this = this;
            this.someSelected = (this.model.entities.select.length > 0);
            
            var listData = this.mountainPointers.concat(this.groupedPointers).concat(this.stackedPointers).filter(function(f){
                    return _this.model.entities.isSelected(f);
                })
                .sort(function (a, b) {
                    if(b.yMax && a.yMax) return b.yMax - a.yMax;
                    return b.sortValue[0] - a.sortValue[0];
                });
            
            this.selectList = this.mountainLabelContainer.selectAll("g").data(listData)
            this.selectList.exit().remove();
            this.selectList.enter().append("g")
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
        
        
        getDeep: function(branch, marker){
            var _this = this;
            if(!branch.key) return _this.values[marker][branch.KEY()];
            return d3.sum( branch.values.map(function(m){
                return _this.getDeep(m, marker)
            }) )
        },
        
        redrawSelectList: function(){
            var _this = this;
            if(!this.selectList || !this.someSelected) return;
            
            var sample = this.mountainLabelContainer.append("g").attr("class", "vzb-mc-label").append("text").text("0");
            var fontHeight = sample[0][0].getBBox().height;
            d3.select(sample[0][0].parentNode).remove();
            var formatter = _this.model.marker.axis_y.tickFormatter;
            
            
            this.selectList
                .attr("transform", function(d,i){return "translate(0," + (fontHeight*i) + ")"})
                .each(function(d, i){
                
                
                    var name = d.key? _this.translator("region/" + d.key) : _this.values.label[d.KEY()];
                    var number = _this.getDeep(d, "axis_y");
                        
                        //d3.sum(d.values.map(function(m){return _this.values.axis_y[m.KEY()]}))
                        //: _this.values.axis_y[d.KEY()] ; 
                
                    var string = name + ": " + formatter(number) + (i==0?" people":"");
                
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

          this.mountainsAtomic
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
            
            
            this.mountainsMergeStacked
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

          var someSelectedAndOpacityZero = _this.someSelected && _this.model.entities.opacitySelectDim < 0.01;

          // when pointer events need update...
          if (someSelectedAndOpacityZero != this.someSelectedAndOpacityZero_1) {
            this.mountainsAtomic.style("pointer-events", function (d) {
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
            this.mountainPointers.forEach(function (d, i) {
                var vertices = _this._spawn(_this.values, d)
                _this.cached[d.KEY()] = vertices;
                d.hidden = vertices.length==0 || d3.sum(vertices.map(function(m){return m.y}))==0;
            });
            
            this.yMax = 0;

            
            //recalculate stacking
            this.stackedPointers.forEach(function (group) {
                var toStack = [];
                group.values.forEach(function(subgroup){
                    toStack = toStack.concat(subgroup.values.filter(function(f){return !f.hidden}))
                })
                _this.stack(toStack);
            })
            
            this.mountainPointers.forEach(function(d){
                d.yMax = d3.max(_this.cached[d.KEY()].map(function(m){return m.y0 + m.y}));
                if(_this.yMax < d.yMax) _this.yMax = d.yMax;
            })
            
            var mergeGrouped = _this.model.marker.group.merge;
            var mergeStacked = _this.model.marker.stack.merge;

            if(mergeStacked){
                this.stackedPointers.forEach(function (d) {
                    var visible = d.values[0].values.filter(function(f){return !f.hidden});
                    var first = visible[0].KEY();
                    d.yMax = visible[0].yMax;

                    var vertices = _this.mesh.map(function(m, i){
                        var y = _this.cached[first][i].y0 + _this.cached[first][i].y;
                        return { x: m, y0: 0, y: y};
                    })

                    _this.values.color[d.key] = "_default";
                    _this.cached[d.key] = vertices;
                })     
            }
            
            if(mergeGrouped || mergeStacked){
                this.groupedPointers.forEach(function (d) {
                    var visible = d.values.filter(function(f){return !f.hidden});
                    var first = visible[0].KEY();
                    var last = visible[visible.length-1].KEY();
                    d.yMax = visible[0].yMax;

                    var vertices = _this.mesh.map(function(m, i){
                        var y = _this.cached[first][i].y0 + _this.cached[first][i].y - _this.cached[last][i].y0;
                        var y0 = _this.cached[last][i].y0;
                        return { x: m, y0: y0, y: y}
                    })

                    _this.values.color[d.key] = _this.values.color[first];
                    _this.cached[d.key] = vertices;
                })
            }
            
            
            
            if(!mergeStacked && !mergeGrouped && this.model.marker.stack.which!="all" && this.model.marker.stack.which!="none"){
                this.groupedPointers.forEach(function (d) {
                    var visible = d.values.filter(function(f){return !f.hidden});
                    d.yMax = visible[0].yMax;
                    d.values.forEach(function(e){e.yMaxGroup = d.yMax});
                })
            }
            

        },





        /**
         * Executes everytime the container or vizabi is resized
         * Ideally,it contains only operations related to size
         */
        updateSize: function (meshLength) {

            var margin;
            var padding = 2;

            switch (this.getLayoutProfile()) {
            case "small":
                margin = { top: 10, right: 10, left: 10, bottom: 40 };
//                margin = {top: 30, right: 20, left: 40, bottom: 40}
                break;
            case "medium":
                margin = { top: 20, right: 10, left: 10, bottom: 70 };
//                margin = {top: 30, right: 60, left: 60, bottom: 70}
                break;
            case "large":
                margin = { top: 30, right: 10, left: 10, bottom: 90  };
//                margin = {top: 30, right: 60, left: 60, bottom: 60}
                break;
            };
            
            

            this.height = parseInt(this.element.style("height"), 10) - margin.top - margin.bottom;
            this.width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;

            //graph group is shifted according to margins (while svg element is at 100 by 100%)
            this.graph
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            //year is centered
            this.yearEl
                .attr("x", this.width / 2)
                .attr("y", this.height / 3 * 1.5)
                .style("font-size", Math.max(this.height / 4, this.width / 4) + "px");

            //update scales to the new range
            this.yScale.range([this.height, 0]);
            this.xScale.range([0, this.width]);

            // we need to generate the distributions based on mu, variance and scale
            // we span a uniform mesh across the entire X scale,
            if(!meshLength) meshLength = this.model.time.xPoints;
            
            var scaleType = this._readyOnce? this.model.marker.axis_x.scaleType : "log";
            var rangeFrom = scaleType == "linear" ? this.xScale.domain()[0] : Math.log(this.unscale(this.xScale.domain()[0]));
            var rangeTo = scaleType == "linear" ? this.xScale.domain()[1] : Math.log(this.unscale(this.xScale.domain()[1]));
            var rangeStep = (rangeTo - rangeFrom) / meshLength;
            this.mesh = d3.range(rangeFrom, rangeTo, rangeStep).concat(rangeTo);
            
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
                .attr("transform", "translate(0," + this.height + ")")
                .call(this.xAxis);

            this.xTitleEl
                .attr("transform", "translate(0," + this.height + ")")
                .select("text")
                .attr("dy", "-0.36em");
            
            this.eventAreaEl
                .attr("y", this.height)
                .attr("width", this.width)
                .attr("height", margin.bottom);

        },


        // get Y value for every X
        _spawn: function (values, d) {
            var _this = this;

            var norm = values.axis_y[d.KEY()];
            var sigma = _this._math.giniToSigma(values.size[d.KEY()]);
            var mu = _this._math.gdpToMu(values.axis_x[d.KEY()], sigma);

            if (!norm || !mu || !sigma) return [];

            var povertyline = this.unscale(this.model.time.povertyline);
            var level = this.unscale(this.model.time.povertyCutoff);
            var fade = this.model.time.povertyFade;
            var acc = 0;
            var mask = [];
            var distribution = [];
            
            
            this.mesh.map(function (dX,i) {
                distribution[i] = _this._math.pdf.lognormal(dX, mu, sigma);
                mask[i] = dX<level?1:(dX>fade*7?0:Math.exp((level-dX)/fade))
                acc += mask[i] * distribution[i];
            });
                 
            var k = 2*Math.PI/(Math.log(povertyline)-Math.log(level));
            var m = Math.PI - Math.log(povertyline) * k;  
            
            var cosineArea = d3.sum(this.mesh.map(function (dX) {
                return (dX>level && dX<povertyline? (1+Math.cos(Math.log(dX)*k+m)) : 0 )
            }));
            
            var result = this.mesh.map(function (dX, i) {
                
                return {x: dX, y0: 0, y: norm *(
                        (dX>level && dX<povertyline? (1+Math.cos(Math.log(dX)*k+m))/cosineArea * acc : 0 )
                         + distribution[i] * (1 - mask[i]) 
                        )
                }
                
            });

            //console.log(Math.round(d3.sum(distribution)/d3.sum(result.map(function(d){return d.y/norm}))*10000)/10000 )
            return result;
            
        },

        
        _adjustMaxY: function(options){
            if(!options) options = {};
            var _this = this;
            var method = this.model.time.yMaxMethod;
            
            if(method!=="immediate" && !options.force) return;
            
            if(method=="latest") _this.updateTime(_this.model.time.end);
 
            if(!_this.yMax)utils.warn("Setting yMax to " + _this.yMax + ". You failed again :-/");
            this.yScale.domain([0, _this.yMax]);
            
            if(method=="latest") _this.updateTime();
        },

        
        updatePovertyLine: function(options){
            var _this = this;
            if(!options)options = {};
            
            if(!options.level) options.level = this.model.time.povertyline;
            
            this.povertylineEl.classed("vzb-hidden", !options.level);
            if(!options.level) return;
            
            this.xAxisEl.call(this.xAxis.highlightValue(options.full? options.level : "none"));
            
            var sumValue = 0;
            var totalArea = 0;
            var leftArea = 0;
            
            this.mountainPointers
                .filter(function(f){return !f.hidden})
                .forEach(function(d){
                    sumValue += _this.values.axis_y[d.KEY()];
                    _this.cached[d.KEY()].forEach(function(d){
                        totalArea += d.y;
                        if(_this.rescale(d.x)<options.level)leftArea += d.y;
                    })
                })
            
            var formatter = d3.format(".3r");
            
            this.povertylineEl.select("line")
                .attr("x1",this.xScale(options.level))
                .attr("x2",this.xScale(options.level))
                .attr("y1",this.height)
                .attr("y2",this.height*0.66);

            this.povertylineEl.selectAll(".vzb-mc-povertyline-valueUL")
                .text(formatter(leftArea/totalArea*100) + "%") 
                .attr("x",this.xScale(options.level) - 5)
                .attr("y",this.height*0.66);
            
            this.povertylineEl.selectAll(".vzb-mc-povertyline-valueDL")
                .text(_this.model.marker.axis_y.tickFormatter(sumValue * leftArea / totalArea) )
                .attr("x",this.xScale(options.level) - 5)
                .attr("y",this.height*0.66)
                .attr("dy","1.5em")
                .classed("vzb-hidden", !options.full);
            
            this.povertylineEl.selectAll(".vzb-mc-povertyline-valueUR")
                .text(formatter(100-leftArea/totalArea*100) + "%")
                .attr("x",this.xScale(options.level) + 5)
                .attr("y",this.height*0.66)
                .classed("vzb-hidden", !options.full);
            
            this.povertylineEl.selectAll(".vzb-mc-povertyline-valueDR")
                .text(_this.model.marker.axis_y.tickFormatter(sumValue * (1 - leftArea / totalArea)) + " " + this.translator("mount/people"))
                .classed("vzb-hidden", !options.full)
                .attr("x",this.xScale(options.level) + 5)
                .attr("y",this.height*0.66)
                .attr("dy","1.5em");
            
            //if(this.model.time.record) console.log(this.model.time.value.getFullYear() + ", " + leftArea/totalArea*100);                        
            
        },
        

        /*
         * REDRAW DATA POINTS:
         * Here plotting happens
         */
        redrawDataPoints: function () {
            var _this = this;
            var mergeGrouped = _this.model.marker.group.merge;
            var mergeStacked = _this.model.marker.stack.merge;
            var stackMode = _this.model.marker.stack.which;
            
            //var speed = this.model.time.speed;
            this._adjustMaxY();
            
            this.mountainsMergeStacked.each(function (d) {
                var view = d3.select(this);
                var hidden = !mergeStacked;
                _this._renderShape(view, d.KEY(), hidden);
            })

            this.mountainsMergeGrouped.each(function (d) {
                var view = d3.select(this);
                var hidden = !mergeGrouped || (mergeStacked && !_this.model.entities.isSelected(d));
                _this._renderShape(view, d.KEY(), hidden);
            });

            this.mountainsAtomic.each(function (d, i) {
                var view = d3.select(this);
                var hidden = d.hidden || ((mergeGrouped || mergeStacked) && !_this.model.entities.isSelected(d));
                _this._renderShape(view, d.KEY(), hidden);
            })
            
            if(stackMode == "none"){
                this.mountainsAtomic.sort(function(a,b){return b.yMax - a.yMax});
            
            }else if(stackMode == "all"){
                // do nothing if everything is stacked
                
            }else{
                if(mergeGrouped){
                    this.mountainsMergeGrouped.sort(function(a,b){return b.yMax - a.yMax});
                }else{
                    this.mountainsAtomic.sort(function(a,b){return b.yMaxGroup - a.yMaxGroup});
                }
            }
            
                
//            if (!this.shapes) this.shapes = {}
//            this.shapes[this.model.time.value.getFullYear()] = _this.cached["all"].map(function (d) {return d3.format(".2e")(d.y)})
                
        },
        
        
        
        _renderShape: function(view, key, hidden){
            var record = this.model.time.record;
            var year = this.model.time.value.getFullYear();            
            
            view.classed("vzb-hidden", hidden);
            if(hidden){ 
                view.style("stroke-opacity", 0);
                return;
            }
            view
                .style("fill", this.cScale(this.values.color[key]))
                .attr("d", this.area(this.cached[key]))
                .transition().duration(500).ease("circle")
                .style("stroke-opacity", 0.5);
            
            if(record) this._export.write({type: "path", id: key, time: year, fill: this.cScale(this.values.color[key]), d: this.area(this.cached[key])});  
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
            this.povertylineEl = this.element.select('.vzb-mc-povertyline');
             this.eventAreaEl = this.element.select(".vzb-mc-eventarea");
            
            if(this.model.marker.stack.use == "property"){
                shape = this.precomputedShapes["incomeMount_shape_stack_region"][_this.model.time.value.getFullYear()]
            }else{
                shape = this.precomputedShapes["incomeMount_shape_stack_" + this.model.marker.stack.which][_this.model.time.value.getFullYear()]
            } 
            
            if(!shape || shape.length == 0) return;
                
            this.xScale = d3.scale.log().domain([this.model.marker.axis_x.min, this.model.marker.axis_x.max]);
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