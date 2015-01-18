define([
    'jquery',
    'd3',
    'base/component'
], function($, d3, Component) {

    function order(a, b) {
        return radius(b) - radius(a);
    }

    function radius(d, indicator) {
        return d.pop;
    }

    var AxisLabeler = Component.extend({
        init: function(context, options) {
            var _this = this;
            this.name = 'axis-labeler';
            this.template = 'components/_examples/' + this.name + '/' + this.name;

            //define expected models for this component
            this.model_expects = ["time", "entities", "marker", "data"];

            this._super(context, options);

            this.xScale = null;
            this.yScale = null;

            this.xAxis = d3.svg.axis();
            this.yAxis = d3.svg.axis();

            this.isDataPreprocessed = false;
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
            this.yearEl = this.graph.select('.vzb-bc-year');
            this.bubbleContainer = this.graph.select('.vzb-bc-bubbles');
            this.bubbles = null;
            this.tooltip = this.element.select('.vzb-tooltip');

            //model events
            this.model.on({
                "change": function(evt) {
                    console.log("Changed!", evt);
                },
                "load_start": function(evt) {
                    console.log("Started to load!", evt);
                },
                "load_end":  function() {
                    console.log("Finished loading!");
                },
                "ready": function() {
                    console.log("Model ready!");
//TODO: put here the following and remove it from "load_end" and from redrawDataPoints()
//                    _this.preprocessData();
//                    _this.updateShow();
//                    _this.updateTime();
//                    _this.redrawDataPoints();
                }
            });

            this.model.time.on({
                'change:value': function() {
                    _this.updateTime();
                    _this.redrawDataPoints();
                }
            });

            //component events
            this.on("resize", function() {
                console.log("Ops! Gotta resize...");
                _this.updateSize();
                _this.updateTime();
                _this.redrawDataPoints();
            })

        },

        preprocessData: function(){
            this.model.marker.label.getItems().forEach(function(d) {
                d["geo.region"] = d["geo.region"] || "world";
            });
            this.isDataPreprocessed = true;
        },


        /*
         * Updates the component as soon as the model/models change
         */
        modelReady: function(evt) {
            if (!this.isDataPreprocessed) this.preprocessData();
            this.updateShow();
            this.redrawDataPoints();
        },


        /*
         * UPDATE SHOW:
         * Ideally should only update when show parameters change or data changes
         */
        updateShow: function() {

            //scales
            this.yScale = this.model.marker.axis_y.getDomain();
            this.xScale = this.model.marker.axis_x.getDomain();

            var _this = this;
            this.yAxis.tickFormat(function(d) {
                return _this.model.marker.axis_y.getTick(d);
            });
            this.xAxis.tickFormat(function(d) {
                return _this.model.marker.axis_x.getTick(d);
            });

        },


        /*
         * UPDATE TIME:
         * Ideally should only update when time or data changes
         */
        updateTime: function() {
            var _this = this;
            this.time = this.model.time.value;
            this.data = this.model.marker.label.getItems({ time: this.time });
            this.yearEl.text(this.time.getFullYear().toString());
            this.bubbles = this.bubbleContainer.selectAll('.vzb-bc-bubble').data(this.data);
            this.timeUpdatedOnce = true;
        },

        /*
         * RESIZE:
         * Executed whenever the container is resized
         */
        updateSize: function() {

            if (!this.isDataPreprocessed) return;

            var _this = this,
                margin,
                tick_spacing,
                padding = 2;

            switch (this.getLayoutProfile()) {
                case "small":
                    margin = {top: 30, right: 20, left: 40, bottom: 40};
                    tick_spacing = 60;
                    break;
                case "medium":
                    margin = {top: 30, right: 60, left: 60, bottom: 40};
                    tick_spacing = 80;
                    break;
                case "large":
                    margin = {top: 30, right: 60, left: 60, bottom: 40};
                    tick_spacing = 100;
                    break;
            }


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
                this.yScale.range([height, 0]).nice();
            } else {
                this.yScale.rangePoints([height, 0], padding).range();
            }
            if (this.model.marker.axis_x.scale !== "ordinal") {
                this.xScale.range([0, width]).nice();
            } else {
                this.xScale.rangePoints([0, width], padding).range();
            }


            //apply scales to axes and redraw
            this.yAxis.scale(this.yScale)
                .orient("left")
                .tickSize(6, 0)
                .ticks(Math.max(height / tick_spacing, 2));

            this.xAxis.smartLabeler = function(options){
                var axis = this;

                axis.METHOD_REPEATING = 'repeating specified powers';
                axis.METHOD_DOUBLING = 'doubling the value';
                axis.DEFAULT_LOGBASE = 10;

                if(options==null) options = {}
                if(options.scaleType==null) {console.warn('please set scaleType to "lin", "log", "ordinal"'); return axis;};
                if(options.scaleType=='ordinal') return axis.tickValues(null);
                if(options.logBase==null) options.logBase = axis.DEFAULT_LOGBASE;
                if(options.method==null) options.method = axis.METHOD_REPEATING;
                if(options.baseValues==null) options.stops = [1,2,5,7];
                if(options.spaceOne==null) options.spaceOne = 75; //px
                if(options.isPivotAuto==null) options.isPivotAuto = false;

                var tickValues = [];
                var lengthDomain = axis.scale().domain()[1] - axis.scale().domain()[0];
                var lengthRange = axis.scale().range()[1] - axis.scale().range()[0];
                var getBaseLog = function(x, base) {
                    if(base == null) base = options.logBase;
                    return Math.log(x) / Math.log(base);
                };

                //console.log(getBaseLog(this.scale().domain()[0]))

                if(options.method == axis.METHOD_REPEATING){
                    var spawn = d3.range(
                            Math.ceil(getBaseLog(this.scale().domain()[0])),
                            Math.ceil(getBaseLog(this.scale().domain()[1])))
                        .map(function(d){return Math.pow(options.logBase, d)});

                    options.stops.forEach(function(stop){
                        if(lengthRange/tickValues.length<options.spaceOne) return;
                        tickValues = tickValues.concat(spawn.map(function(d){return d*stop}));
                    })

                }else if(options.method == axis.METHOD_DOUBLING) {
                    var spawn = d3.range(
                            Math.ceil(getBaseLog(this.scale().domain()[0],2)),
                            Math.ceil(getBaseLog(this.scale().domain()[1],2)))
                        .map(function(d){return Math.pow(2, d)});

                    tickValues = spawn;
                        //console.log(this.scale())
                }


                return axis
                    .tickFormat(d3.format(",.1s"))
                    .tickValues(tickValues);
            }


            this.xAxis.scale(this.xScale)
                .orient("bottom")
                //.ticks(Math.max(width / tick_spacing, 2));
                .tickSize(6, 0)
                .smartLabeler({scaleType: this.model.marker.axis_x.scale});

            this.xAxisEl.attr("transform", "translate(0," + height + ")");

            this.yAxisEl.call(this.yAxis);
            this.xAxisEl.call(this.xAxis);

            this.sizeUpdatedOnce = false;
        },

        /*
         * REDRAW DATA POINTS:
         * Here plotting happens
         */
        redrawDataPoints: function() {
            var _this = this;
            if(!this.timeUpdatedOnce) this.updateTime();
            if(!this.sizeUpdatedOnce) this.updateSize();

            //exit selection
            this.bubbles.exit().remove();

            //enter selection -- init circles
            this.bubbles.enter().append("circle")
                .attr("class", "vzb-bc-bubble");

            //update selection
            var speed = (this.model.time.playing) ? this.model.time.speed : 0;

            this.bubbles
                .style("fill", "#b5bf00")
                .transition().duration(speed).ease("linear")
                .attr("cy", function(d) {
                    var value = _this.model.marker.axis_y.getValue(d)||_this.yScale.domain()[0];
                    return _this.yScale(value);
                })
                .attr("cx", function(d) {
                    var value = _this.model.marker.axis_x.getValue(d)||_this.xScale.domain()[0];
                    return _this.xScale(value);
                })
                .attr("r", 5);

        }

    });

    return AxisLabeler;
});
