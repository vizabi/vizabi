define([
    'jquery',
    'd3',
    'lodash',
    'base/component'
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
                    _this.preprocessData();
                    _this.updateShow();
                    _this.updateSize();
                    _this.updateTime();
                    _this.redrawDataPoints();
                    //TODO: dirty hack to avoid duplicate bubbles in the beginning (drawing twice)
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

            this.xAxis = d3.svg.axis();
            this.yAxis = d3.svg.axis();

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
            this.graph = this.element.select('.vzb-lc-graph');
            this.yAxisEl = this.graph.select('.vzb-lc-axis-y');
            this.xAxisEl = this.graph.select('.vzb-lc-axis-x');
            this.yTitleEl = this.graph.select('.vzb-lc-axis-y-title');
            this.linesContainer = this.graph.select('.vzb-lc-lines');
            this.entities = null;
            this.dataBuffer = {};

            //component events
            this.on("resize", function() {
                _this.updateSize();
                _this.updateTime();
                _this.redrawDataPoints();
            })
        },


        preprocessData: function(){
//            this.geos = _.uniq(_.map(this.model.marker.label.getItems(), function(d) {
//                return {
//                    geo: d.geo,
//                    name: d.value,
//                    region: d['geo.region'] || "world",
//                    category: d['geo.category']
//                };
//            }), false, function(d) {
//                return d.geo;
//            });
//            
//            this.model.marker.label.getItems().forEach(function(d) {
//                d["geo.region"] = d["geo.region"] || "world";
//            });
            this.isDataPreprocessed = true;
        },
        
        
        /*
         * UPDATE SHOW:
         * Ideally should only update when show parameters change or data changes
         */
        updateShow: function() {
            var _this = this;
//            var indicator = this.model.marker.axis_y.value;
//            var year = parseInt(d3.time.format("%Y")(this.model.time.value), 10);
//            var colors = ["#00D8ED", "#FC576B", "#FBE600", "#82EB05"];
            
            //scales
            this.yScale = this.model.marker.axis_y.getDomain();
            this.xScale = this.model.marker.axis_x.getDomain();
            
//            this.colorScale = d3.scale.ordinal().range(colors)
//                .domain(_.map(_this.geos, function(geo) {
//                    return geo.region;
//                }));
                        
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
            if (!this.isDataPreprocessed) return;
            
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


            //this.size year
            this.widthAxisY = this.yAxisEl[0][0].getBBox().width;
            this.heightAxisX = this.xAxisEl[0][0].getBBox().height;


            //adjust right this.margin according to biggest label
            var lineLabels = this.linesContainer.selectAll(".vzb-lc-label")[0],
                biggest = _.max(_.map(lineLabels, function(label) {
                    return label.getBBox().width;
                }));

            this.margin.right = Math.max(this.margin.right, biggest + 20);


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
                this.yScale.range([this.height, 0]).nice();
            } else {
                this.yScale.rangePoints([this.height, 0], padding).range();
            }
            if (this.model.marker.axis_x.scale !== "ordinal") {
                this.xScale.range([0, this.width]).nice();
            } else {
                this.xScale.rangePoints([0, this.width], padding).range();
            }
            


            this.yAxis.scale(this.yScale)
                .orient("left")
                .ticks(Math.max(this.height / this.tick_spacing, 2))
                .tickSize(6, 0)
                .tickFormat(function(d) {
                    return _this.model.marker.axis_y.getTick(d);
                });


            this.xAxis.scale(this.xScale)
                .orient("bottom")
                .ticks(Math.max(this.width / this.tick_spacing, 2))
                .tickSize(6, 0)
                .tickFormat(function(d) {
                    return _this.model.marker.axis_x.getTick(d);
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
                
                    group.append("path")
                        .attr("class", "vzb-lc-line-shadow")
                        .style("stroke", d3.rgb(color).darker(0.3))
                        .attr("transform", "translate(0,2)");     
                    
                    group.append("path")
                        .attr("class", "vzb-lc-line")
                        .style("stroke", color)
                        .attr("data-tooltip", _this.model.marker.label.getValue(d));
                })
            
            this.entities
                .each(function(d,i){
                    var group = d3.select(this);
                
                    if(_this.dataBuffer[d.geo]==null)_this.dataBuffer[d.geo] = [];
                    _this.dataBuffer[d.geo].push([
                        _this.model.marker.axis_x.getValue(d),
                        _this.model.marker.axis_y.getValue(d)
                    ]);
                    
                    group.select(".vzb-lc-line-shadow")
                        .attr("d", _this.line(_this.dataBuffer[d.geo]));
                    group.select(".vzb-lc-line")
                        .attr("d", _this.line(_this.dataBuffer[d.geo]));
                })
            
            console.log(_this.dataBuffer)

            //            //this.data up to year
//            this.data = _.filter(this.data, function(d) {
//                return d.time <= year;
//            });
//
//            //modify the this.data format
//            this.data = _.map(_this.geos, function(g) {
//                //ordered values of current geo
//                var geo_values = _.sortBy(_.filter(_this.data, function(d) {
//                    return d.geo === g.geo;
//                }), function(d) {
//                    return d.time;
//                });
//
//                g.values = _.map(geo_values, function(d) {
//                    return _.omit(d, ['geo', 'geo.name', 'geo.region', 'geo.category']);
//                })
//                return g;
//            });
            
            
            

//            entities.append("text")
//                .attr("class", "vzb-lc-label")
//                .datum(function(d) {
//                    return {
//                        name: d.name,
//                        region: d.region,
//                        value: d.values[d.values.length - 1]
//                    };
//                })
//                .attr("dy", ".35em")
//                .text(function(d) {
//                    return "abracadabra"
//                    //var size = d.name.length;
//                    //return (size < 13) ? d.name : d.name.substring(0, 10) + '...'; //only few first letters
//                })
//                .style("fill", function(d) {
//                    return d3.rgb(_this.colorScale(color(d))).darker(0.3);
//                });
            
            
//            this.linesContainer.selectAll(".vzb-lc-label")
//                .attr("transform", function(d) {
//                    return "translate(" + _this.xScale(d.value.time) + "," + _this.yScale(d.value.value) + ")";
//                })
//                .attr("x", _this.profiles[_this.getLayoutProfile()].text_padding);
        }


    });

    return LineChart;
});