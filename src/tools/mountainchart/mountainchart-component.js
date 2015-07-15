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
                    _this.updateBubbleOpacity();
                },
                'change:entities:select': function () {
                  if (!_this._readyOnce) return;
                  //console.log("EVENT change:entities:select");
                  _this.selectDataPoints();
                    _this.redrawSelectList();
                    _this.updateBubbleOpacity();
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
                    _this.markersUpdatedRecently = true;
                },
                'change:entities:opacitySelectDim': function () {
                  _this.updateBubbleOpacity();
                },
                'change:entities:opacityRegular': function () {
                  _this.updateBubbleOpacity();
                }
            }



            this._super(config, context);

            var MountainChartMath = Vizabi.Helper.get("gapminder-mountainchart-math");
            this._math = new MountainChartMath(this);

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

            this.element = d3.select(this.element);

            // reference elements
            this.graph = this.element.select('.vzb-mc-graph');
            this.xAxisEl = this.graph.select('.vzb-mc-axis-x');
            this.xTitleEl = this.graph.select('.vzb-mc-axis-x-title');
            this.yearEl = this.graph.select('.vzb-mc-year');
            this.mountainContainer = this.graph.select('.vzb-mc-mountains');
            this.mountainLabelContainer = this.graph.select('.vzb-mc-mountains-labels');
            this.mountains = null;
            this.tooltip = this.element.select('.vzb-tooltip');

            var _this = this;
            this.on("resize", function () {
                //console.log("acting on resize");
                _this.updateSize();
                _this.redrawDataPoints();
                _this.redrawSelectList();
            });

            this.KEY = this.model.entities.getDimension();
            this.TIMEDIM = this.model.time.getDimension();

            this.drawPrecomputedShapes();
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
            this.updateBubbleOpacity();
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
                _this.updateBubbleOpacity();              
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
            this.xScale
                .domain(this.model.marker.axis_x.scaleType == "log" ? [0.05, 1000] : [0, 100]);

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
                .entries(this.model.entities._visible);
            
            this.groupedPointers .forEach(function (group) {
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
                        .attr("style", "left:" + (mouse[0] + 50) + "px;top:" + (mouse[1] + 50) + "px")
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

        updateBubbleOpacity: function () {
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
        updateSize: function () {

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
            var scaleType = this._readyOnce? this.model.marker.axis_x.scaleType : "log";
            var rangeFrom = scaleType == "linear" ? this.xScale.domain()[0] : Math.log(this.xScale.domain()[0]);
            var rangeTo = scaleType == "linear" ? this.xScale.domain()[1] : Math.log(this.xScale.domain()[1]);
            var rangeStep = (rangeTo - rangeFrom) / Math.max(100,(width ? width / 5 : 100));
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

            //update selection
            //var speed = this.model.time.speed;

            this.mountains.each(function (d, i) {
                var view = d3.select(this);
                view.classed("vzb-hidden", d.hidden);
                if (!d.hidden) {
                    view //.transition().duration(speed).ease("linear")
                        .style("fill", _this.cScale(_this.values.color[d.KEY()]))
                        .attr("d", _this.area(_this.cached[d.KEY()]))
                }
            })
        },
        
        drawPrecomputedShapes: function(){
            var _this = this;
            var world2000 = [{x:0.05000,y0:0,y:284825},{x:0.05331,y0:0,y:350864},{x:0.05683,y0:0,y:430833},{x:0.06059,y0:0,y:527329},{x:0.06460,y0:0,y:643351},{x:0.06888,y0:0,y:782345},{x:0.07343,y0:0,y:948249},{x:0.07829,y0:0,y:1145538},{x:0.08347,y0:0,y:1379270},{x:0.08899,y0:0,y:1655127},{x:0.09488,y0:0,y:1979451},{x:0.1012,y0:0,y:2359277},{x:0.1078,y0:0,y:2802361},{x:0.1150,y0:0,y:3317189},{x:0.1226,y0:0,y:3912983},{x:0.1307,y0:0,y:4599694},{x:0.1393,y0:0,y:5387968},{x:0.1486,y0:0,y:6289110},{x:0.1584,y0:0,y:7315013},{x:0.1689,y0:0,y:8478079},{x:0.1800,y0:0,y:9791109},{x:0.1920,y0:0,y:11267177},{x:0.2047,y0:0,y:12919477},{x:0.2182,y0:0,y:14761152},{x:0.2326,y0:0,y:16805098},{x:0.2480,y0:0,y:19063758},{x:0.2644,y0:0,y:21548894},{x:0.2819,y0:0,y:24271348},{x:0.3006,y0:0,y:27240799},{x:0.3205,y0:0,y:30465513},{x:0.3416,y0:0,y:33952104},{x:0.3643,y0:0,y:37705287},{x:0.3883,y0:0,y:41727665},{x:0.4140,y0:0,y:46019520},{x:0.4414,y0:0,y:50578632},{x:0.4706,y0:0,y:55400138},{x:0.5018,y0:0,y:60476414},{x:0.5350,y0:0,y:65797001},{x:0.5704,y0:0,y:71348572},{x:0.6081,y0:0,y:77114945},{x:0.6483,y0:0,y:83077139},{x:0.6912,y0:0,y:89213468},{x:0.7369,y0:0,y:101571964},{x:0.7857,y0:0,y:117668395},{x:0.8377,y0:0,y:135713933},{x:0.8931,y0:0,y:155839276},{x:0.9522,y0:0,y:178167024},{x:1.015,y0:0,y:202808551},{x:1.082,y0:0,y:229860684},{x:1.154,y0:0,y:259402223},{x:1.230,y0:0,y:291490353},{x:1.312,y0:0,y:326156995},{x:1.398,y0:0,y:363405171},{x:1.491,y0:0,y:403205447},{x:1.590,y0:0,y:445492548},{x:1.695,y0:0,y:490162229},{x:1.807,y0:0,y:537068523},{x:1.926,y0:0,y:586021478},{x:2.054,y0:0,y:636785514},{x:2.190,y0:0,y:689078532},{x:2.334,y0:0,y:742571907},{x:2.489,y0:0,y:796891501},{x:2.654,y0:0,y:851619805},{x:2.829,y0:0,y:906299303},{x:3.016,y0:0,y:960437122},{x:3.216,y0:0,y:1013511002},{x:3.429,y0:0,y:1064976535},{x:3.655,y0:0,y:1114275629},{x:3.897,y0:0,y:1160846041},{x:4.155,y0:0,y:1204131789},{x:4.430,y0:0,y:1243594207},{x:4.723,y0:0,y:1278723338},{x:5.035,y0:0,y:1309049330},{x:5.369,y0:0,y:1334153485},{x:5.724,y0:0,y:1353678568},{x:6.102,y0:0,y:1367338029},{x:6.506,y0:0,y:1374923796},{x:6.936,y0:0,y:1376312323},{x:7.395,y0:0,y:1371468669},{x:7.885,y0:0,y:1360448428},{x:8.406,y0:0,y:1343397417},{x:8.962,y0:0,y:1320549129},{x:9.555,y0:0,y:1292220013},{x:10.19,y0:0,y:1258802754},{x:10.86,y0:0,y:1220757782},{x:11.58,y0:0,y:1178603299},{x:12.35,y0:0,y:1132904155},{x:13.16,y0:0,y:1084259928},{x:14.03,y0:0,y:1033292571},{x:14.96,y0:0,y:980633961},{x:15.95,y0:0,y:926913687},{x:17.01,y0:0,y:872747337},{x:18.13,y0:0,y:818725533},{x:19.33,y0:0,y:765403891},{x:20.61,y0:0,y:713294052},{x:21.97,y0:0,y:662855882},{x:23.43,y0:0,y:614490934},{x:24.98,y0:0,y:568537205},{x:26.63,y0:0,y:525265276},{x:28.39,y0:0,y:484875854},{x:30.27,y0:0,y:447498813},{x:32.27,y0:0,y:413193767},{x:34.41,y0:0,y:381952256},{x:36.68,y0:0,y:353701559},{x:39.11,y0:0,y:328310166},{x:41.70,y0:0,y:306105830},{x:44.46,y0:0,y:308224930},{x:47.40,y0:0,y:309257953},{x:50.53,y0:0,y:309138727},{x:53.88,y0:0,y:307808534},{x:57.44,y0:0,y:305219050},{x:61.24,y0:0,y:301335514},{x:65.29,y0:0,y:296139944},{x:69.61,y0:0,y:289634195},{x:74.22,y0:0,y:281842583},{x:79.12,y0:0,y:272813829},{x:84.36,y0:0,y:262622071},{x:89.94,y0:0,y:251366759},{x:95.89,y0:0,y:239171313},{x:102.2,y0:0,y:226180522},{x:109.0,y0:0,y:212556784},{x:116.2,y0:0,y:198475350},{x:123.9,y0:0,y:184118865},{x:132.1,y0:0,y:169671508},{x:140.8,y0:0,y:156846553},{x:150.1,y0:0,y:147894026},{x:160.1,y0:0,y:138754815},{x:170.7,y0:0,y:129517408},{x:182.0,y0:0,y:120269512},{x:194.0,y0:0,y:111096012},{x:206.8,y0:0,y:102077116},{x:220.5,y0:0,y:93286718},{x:235.1,y0:0,y:84791056},{x:250.7,y0:0,y:76647669},{x:267.2,y0:0,y:68904690},{x:284.9,y0:0,y:61600461},{x:303.8,y0:0,y:54763465},{x:323.9,y0:0,y:48412551},{x:345.3,y0:0,y:42557401},{x:368.1,y0:0,y:37199231},{x:392.5,y0:0,y:32331636},{x:418.4,y0:0,y:27941570},{x:446.1,y0:0,y:24010393},{x:475.6,y0:0,y:20514942},{x:507.1,y0:0,y:17428594},{x:540.7,y0:0,y:14722286},{x:576.4,y0:0,y:12365452},{x:614.6,y0:0,y:10326875},{x:655.2,y0:0,y:8575425},{x:698.6,y0:0,y:7080685},{x:744.8,y0:0,y:5813453},{x:794.0,y0:0,y:4746138},{x:846.6,y0:0,y:3853042},{x:902.6,y0:0,y:3110539},{x:962.3,y0:0,y:2497180}];

                
                
            
            this.xScale = d3.scale.log().domain([0.05, 1000]);
            this.yScale = d3.scale.linear().domain([0, d3.max(world2000.map(function(m){return m.y})) ]);

            _this.updateSize();
            
            var mountains = this.mountainContainer.selectAll('.vzb-mc-mountain')
                .data([0]);
            
            mountains.enter().append("path")
                .attr("class", "vzb-mc-mountain")
                .style("fill", "grey")
                .attr("d", _this.area(world2000))
        }
        
        
    });


}).call(this);