define([
    'jquery',
    'd3',
    'base/component',
    'd3genericLogScale',
    'd3axisWithLabelPicker'
], function($, d3, Component) {

    var AxisLabelerDemo = Component.extend({
        init: function(context, options) {
            var _this = this;
            this.name = 'axis-labeler';
            this.template = 'components/_examples/' + this.name + '/' + this.name;
            this.model_expects = [{name: "scales"}, {name: "show"}];
            //this._debugEvents = "trigger";
            this._super(context, options);
        },




        domReady: function() {
            var _this = this;

            // reference elements
            this.graph = this.element.select('.vzb-bc-graph');
            this.xAxisEl = this.graph.select('.vzb-bc-axis-x');
            this.yAxisEl = this.graph.select('.vzb-bc-axis-y');
            this.xAxis = d3.svg.axisSmart();
            this.yAxis = d3.svg.axisSmart();

            //component events
            this.on("resize", function() {
                console.log("Gotta resize!");
                _this.update();
            })

        },

        modelReady: function(evt) {
            console.log("Model ready");
            this.initScales();
            this.update();
        },





        initScales: function(){
            var _this = this;
            
            var domain = this.model.scales.domain;

            this.xScale = d3.scale[this.model.scales.xScaleType]();
            this.yScale = d3.scale[this.model.scales.yScaleType]();
            
            if(this.model.scales.xScaleType == "genericLog"){
                //this.xScale.eps(this.model.scales.xEps);
                this.xScale.domain(domain);
            }else{
                this.xScale.domain([domain[0], domain[domain.length-1]]);
            }
            
            if(this.model.scales.yScaleType == "genericLog"){
                //this.yScale.eps(this.model.scales.yEps);
                this.yScale.domain(domain);
            }else{
                this.yScale.domain([domain[0], domain[domain.length-1]]);
            }
            
            this.mockData = d3.range(domain[0],
                                     domain[domain.length-1],
                                     (domain[domain.length-1]-domain[0])/100
                                    );
            this.mockData.push(domain[domain.length-1]);


            this.line = d3.svg.line()
                .x(function(d) { return _this.xScale(d); })
                .y(function(d) { return _this.yScale(d); });

        },








        update: function() {
            var _this = this,
                tick_spacing,
                padding = 2;

            switch (this.getLayoutProfile()) {
                case "small": tick_spacing = 60; break;
                case "medium": ick_spacing = 80; break;
                case "large": tick_spacing = 100; break;
            }
            
            
            var margin = this.model.show.toolMargin;


            //stage
            var height = parseInt(this.element.style("height"), 10) - margin.top - margin.bottom;
            var width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;

            //graph group is shifted according to margins (while svg element is at 100 by 100%)
            this.graph
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


            //update scales to the new range
            if (this.model.scales.xScaleType !== "ordinal") {
                this.xScale.range([0, width])//.nice();
            } else {
                this.xScale.rangePoints([0, width], padding).range();
            }

            //update scales to the new range
            if (this.model.scales.yScaleType !== "ordinal") {
                this.yScale.range([height, 0])//.nice();
            } else {
                this.yScale.rangePoints([height, 0], padding).range();
            }

            
            
            


            this.xAxis.scale(this.xScale)
                .orient("bottom")
                .tickSize(6, 0)
                .labelerOptions({
                    scaleType: this.model.scales.xScaleType,
                    //TODO: remove. make font sizing and margins through plain CSS
                    cssFontSize: this.model.show.labelSize,
                    cssMarginLeft:   this.model.show.labelMargin.LR,
                    cssMarginRight:  this.model.show.labelMargin.LR,
                    cssMarginTop:    this.model.show.labelMargin.TB,
                    cssMarginBottom: this.model.show.labelMargin.TB,
                    toolMargin: margin,
                    showOuter: true,
                    pivotingLimit: margin.bottom,
                    isPivotAuto: true
                });

            this.yAxis.scale(this.yScale)
                .orient("left")
                .tickSize(6, 0)
                .labelerOptions({
                    scaleType: this.model.scales.yScaleType,
                    //TODO: remove. make font sizing and margins through plain CSS
                    cssFontSize: this.model.show.labelSize,
                    cssMarginLeft:   this.model.show.labelMargin.LR,
                    cssMarginRight:  this.model.show.labelMargin.LR,
                    cssMarginTop:    this.model.show.labelMargin.TB,
                    cssMarginBottom: this.model.show.labelMargin.TB,
                    toolMargin: margin,
                    showOuter: true,
                    pivotingLimit: margin.left,
                    //limitMaxTickNumber: 0,
                });

            
            
            
            
            
            
            this.xAxisEl.attr("transform", "translate(0," + height + ")");
            this.xAxisEl.call(this.xAxis);
            this.yAxisEl.call(this.yAxis);

            //TODO: remove. make font sizing through plain CSS
            this.xAxisEl.selectAll("text").style('font-size',this.model.show.labelSize);
            this.yAxisEl.selectAll("text").style('font-size',this.model.show.labelSize);


            var path = this.graph.selectAll(".line").data([0]);
            path.enter().append("path")
                .attr("class", "line")
                .style("stroke", "black")
                .style("fill", "none");
            path.datum(this.mockData).attr("d", this.line);

            var dots = this.graph.selectAll(".dots").data(this.mockData);
            dots.enter().append("circle")
                .attr("class","dots")
                .style("stroke", "#3fb500")
                .style("fill", "none")
                .style("opacity", 0.5)
                .attr("r",5);
            dots.exit().remove();
            dots.attr("cx",function(d){return _this.xScale(d)})
                .attr("cy",function(d){return _this.yScale(d)});




        }




    });

    return AxisLabelerDemo;
});


