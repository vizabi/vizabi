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
                    console.log("change", evt);
                },
                'change:time:value': function () {
                    //console.log("change time value");
                    _this.updateTime();
                    _this.redrawDataPoints();
                },
                'change:marker': function () {
                    //console.log("change marker stack");
                    _this.updateEntities();
                    _this.resize();
                    _this.updateTime();
                    _this.redrawDataPoints();
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
                //.order("inside-out")
                .values(function (d) { return _this.cached[d[_this.KEY]].points });

            // define sorting order: lower peaks to front for easier selection
            this.order = function order(a, b) {
                return peak(b) - peak(a);
            }
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
            this.mountains = null;
            this.tooltip = this.element.select('.vzb-tooltip');



            var _this = this;
            this.on("resize", function () {
                //console.log("acting on resize");
                _this.resize();
                _this.updateTime();
                _this.redrawDataPoints();
            });

            this.KEY = this.model.entities.getDimension();
            this.TIMEDIM = this.model.time.getDimension();

            this.updateEntities();
            this.resize();
            this.updateTime();
            this.redrawDataPoints();
        },


        /**
         * Updates entities
         */
        updateEntities: function () {
            var _this = this;
            var KEY = this.KEY;
            var TIMEDIM = this.TIMEDIM;


            this.translator = this.model.language.getTFunction();

            var xTitle = this.xTitleEl.selectAll("text").data([0]);
            xTitle.enter().append("text");
            xTitle.text(this.translator(this.model.marker.axis_x.unit));

            //scales
            this.yScale = this.model.marker.axis_y.getScale();
            this.xScale = this.model.marker.axis_x.getScale();
            this.cScale = this.model.marker.color.getScale();

            this.xAxis.tickFormat(function (d) {
                return _this.model.marker.axis_x.getTick(d);
            });




            //TODO i dunno how to remove this magic constant
            // we have to know in advance where to calculate distributions
            this.xScale
                .domain(this.model.marker.axis_x.scaleType == "log" ? [0.02, 200] : [1, 50]);




            var endTime = this.model.time.end;
            this.model.entities._visible = this.model.marker.getKeys()
                .map(function (d) {
                    var pointer = {};
                    pointer[KEY] = d[KEY];
                    pointer[TIMEDIM] = endTime;
                    pointer.sortValue = _this.peakValue(pointer);
                    return pointer;
                })
                .sort(function (a, b) {
                    return b.sortValue - a.sortValue;
                })
                .map(function (d, i) {
                    _this.cached[d[KEY]] = {};
                    return d;
                })


            this.mountains = this.mountainContainer.selectAll('.vzb-mc-mountain')
                .data(this.model.entities._visible, function (d) {
                    return d[KEY];
                });


         

            //exit selection
            this.mountains.exit().remove();

            //enter selection -- init circles
            this.mountains.enter().append("path")
                .attr("class", "vzb-mc-mountain")
                .on("mousemove", function (d, i) {
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
                })
                .on("click", function (d, i) {
                    _this.model.entities.selectEntity(d);
                });

        },


        /*
         * UPDATE TIME:
         * Ideally should only update when time or data changes
         */
        updateTime: function () {
            var _this = this;

            this.time = this.model.time.value;
            this.yearEl.text(this.time.getFullYear().toString());

        },



        peakValue: function (d) {

            var norm = this.model.marker.axis_y.getValue(d);
            var mean = this.model.marker.axis_x.getValue(d);
            var variance = this.model.marker.size.getValue(d);
            //var mean = this._math.gdpToMean(this.model.marker.axis_x.getValue(d));
            //var variance = this._math.giniToVariance(this.model.marker.size.getValue(d));

            return norm * this._math.pdf.y(Math.exp(Math.log(mean) - variance), Math.log(mean), variance, this._math.pdf.DISTRIBUTIONS_LOGNORMAL);

            //TODO: lazy way. remove it
            //return d3.max( this.generateDistribution(d).map(function(m){return m.y}) )
        },


        /**
         * Executes everytime the container or vizabi is resized
         * Ideally,it contains only operations related to size
         */
        resize: function () {

            var margin;
            var tick_spacing;
            var padding = 2;

            switch (this.getLayoutProfile()) {
            case "small":
                margin = { top: 30, right: 20, left: 20, bottom: 40 };
                tick_spacing = 60;
                break;
            case "medium":
                margin = { top: 30, right: 30, left: 30, bottom: 40 };
                tick_spacing = 80;
                break;
            case "large":
                margin = { top: 30, right: 30, left: 30, bottom: 40 };
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
                .attr("y", height / 3 * 1)
                .style("font-size", Math.max(height / 4, width / 4) + "px");

            //update scales to the new range
            this.yScale.range([height, 0]);
            this.xScale.range([0, width]);

            // we need to generate the distributions based on mu, variance and scale
            // we span a uniform range of 'points' across the entire X scale,
            // resolution: 1 point per pixel. If width not defined assume it equal 500px
            var scaleType = this.model.marker.axis_x.scaleType;
            var rangeFrom = scaleType == "linear" ? this.xScale.domain()[0] : Math.log(this.xScale.domain()[0]);
            var rangeTo = scaleType == "linear" ? this.xScale.domain()[1] : Math.log(this.xScale.domain()[1]);
            var rangeStep = (rangeTo - rangeFrom) / (width ? width / 3 : 196);
            this.mesh = d3.range(rangeFrom, rangeTo, rangeStep);
            if (scaleType != "linear") this.mesh =
                this.mesh.map(function (dX) {return Math.exp(dX)}).filter(function (dX) {return dX > 0});

            //axis is updated
            this.xAxis.scale(this.xScale)
                .orient("bottom")
                .tickSize(6, 0)
                .tickSizeMinor(3, 0)
                .labelerOptions({
                    scaleType: scaleType,
                    toolMargin: margin
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
        spawn: function (values, d) {
            var _this = this;

            var norm = values.axis_y[d[_this.KEY]];
            var mean = values.axis_x[d[_this.KEY]];
            var variance = values.size[d[_this.KEY]];

            if (!norm || !mean || !variance) return [];

            return this.mesh.map(function (dX) {
                return {
                    x: dX,
                    y0: 0, // the initial base of areas is at zero
                    y: norm * _this._math.pdf.y(dX, Math.log(mean), variance, _this._math.pdf.DISTRIBUTIONS_LOGNORMAL)
                }
            });

        },



        /*
         * REDRAW DATA POINTS:
         * Here plotting happens
         */
        redrawDataPoints: function () {
            var _this = this;
            var KEY = this.KEY;
            var TIMEDIM = this.TIMEDIM;

            //update selection
            //var speed = this.model.time.speed;

            var filter = {};
            filter[TIMEDIM] = this.time;
            var values = _this.model.marker.getValues(filter, [KEY]);

            
            //regenerate distributions
            this.model.entities._visible = this.model.entities._visible.map(function (d, i) {
                var points = _this.spawn(values, d);
                _this.cached[d[KEY]].points = points;
                _this.cached[d[KEY]].allZeros = (d3.sum(points.map(function (m) { return m.y })) == 0);
                return d;
            })
            .filter(function(f){
                return _this.cached[f[KEY]].points.length>0 && !_this.cached[f[KEY]].allZeros;
            })

            

            if (_this.model.marker.stack.use === "value") {
                if (_this.model.marker.stack.which === "all") _this.stack(this.cached);
            } else if (_this.model.marker.stack.use === "property") {
                //var unique = _this.model.marker.stack.getUnique(_this.KEY);

                var dataByGroup = d3.nest()
                    .key(function (d) {return values.stack[d[KEY]] })
                    .entries(this.model.entities._visible);
                
                dataByGroup.forEach(function (group) {
                    _this.stack(group.values);
                })
            }
            
            var yMax = 0;
            this.model.entities._visible.forEach(function(d){
                var max = d3.max(_this.cached[d[_this.KEY]].points.map(function(m){return m.y}) )
                if(max > yMax) yMax = max;
                
            })
            
            this.yScale.domain([0, yMax]);
            
            this.mountains.each(function (d, i) {
                var view = d3.select(this);

                var hidden = _this.model.entities._visible.indexOf(d)==-1;
                
                view.classed("vzb-hidden", hidden);
                if (!hidden) {

                    view //.transition().duration(speed).ease("linear")
                        .style("fill", _this.cScale(values.color[d[_this.KEY]]))
                        .attr("d", _this.area(_this.cached[d[_this.KEY]].points))
                }


            })


        }

    });


}).call(this);