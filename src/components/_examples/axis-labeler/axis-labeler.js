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

            // measure the width of one digit
            var widthSampleG = this.xAxisEl.append("g").attr("class","tick widthSampling");
            widthSampleT = widthSampleG.append('text').text('0')
                .style("font-size",this.model.show.labelSize);
            this.widthOfOneDigit = widthSampleT[0][0].getBBox().width;
            this.heightOfOneDigit = widthSampleT[0][0].getBBox().height;
            widthSampleG.remove();

            this.xAxis.scale(this.xScale)
                .orient("bottom")
                .tickSize(6, 0)
                .smartLabeler({
                    scaleType: this.model.scales.xScaleType,
                    widthOfOneDigit: this.widthOfOneDigit,
                    cssFontSize: this.model.show.labelSize,
                    cssMarginLeft:   this.model.show.labelMargin.LR,
                    cssMarginRight:  this.model.show.labelMargin.LR,
                    cssMarginTop:    this.model.show.labelMargin.TB,
                    cssMarginBottom: this.model.show.labelMargin.TB,
                    toolMargin: margin,
                   // showOuter: false,
                    lengthWhenPivoting: margin.bottom,
                    isPivotAuto: true,
                   // formatterRemovePrefix: true,
                    tickSpacing: tick_spacing
                });

            this.yAxis.scale(this.yScale)
                .orient("left")
                .tickSize(6, 0)
                .smartLabeler({
                    scaleType: this.model.scales.yScaleType,
                    widthOfOneDigit: this.widthOfOneDigit,
                    heightOfOneDigit: this.heightOfOneDigit,
                    cssFontSize: this.model.show.labelSize,
                    cssMarginLeft:   this.model.show.labelMargin.LR,
                    cssMarginRight:  this.model.show.labelMargin.LR,
                    cssMarginTop:    this.model.show.labelMargin.TB,
                    cssMarginBottom: this.model.show.labelMargin.TB,
                    toolMargin: margin,
                    //showOuter: false,
                    lengthWhenPivoting: margin.left,
                    //limitMaxTickNumber: 0,
                   // formatterRemovePrefix: true,
                    tickSpacing: tick_spacing,
                   // method: this.yAxis.METHOD_DOUBLING
                });

            this.xAxisEl.attr("transform", "translate(0," + height + ")");

            this.xAxisEl
                .call(this.xAxis)
                .selectAll("text")
                    .each(function(d,i){
                        var view = d3.select(this);
                
                        view.attr("transform","rotate("+(_this.xAxis.pivot?-90:0)+")")
                        view.style("text-anchor", !_this.xAxis.pivot?"middle":"end")
                        view.attr("dy", _this.xAxis.pivot?".32em":".71em")
                        view.attr("x", !_this.xAxis.pivot?0:(-_this.xAxis.tickPadding() - _this.xAxis.tickSize()))
                        view.attr("y", !_this.xAxis.pivot?(_this.xAxis.tickPadding() + _this.xAxis.tickSize()):0)
                
                        if(_this.xAxis.repositionLabels == null) return;
                        var shift = _this.xAxis.repositionLabels[i]; 
                        view.attr("x",+view.attr("x") + shift.x);
                        view.attr("y",+view.attr("y") + shift.y);
                    })

            this.yAxisEl
                .call(this.yAxis)
                .selectAll("text")
                    .each(function(d,i){
                        var view = d3.select(this);
                
                        view.attr("transform","rotate("+(_this.yAxis.pivot?-90:0)+")")
                        view.style("text-anchor", _this.yAxis.pivot?"middle":"end")
                        view.attr("dy",_this.yAxis.pivot?0:".32em")
                        view.attr("x", _this.yAxis.pivot?0:(-_this.yAxis.tickPadding() - _this.yAxis.tickSize()))
                        view.attr("y", _this.yAxis.pivot?(-_this.yAxis.tickPadding() - _this.yAxis.tickSize()):0)
                        
                        if(_this.yAxis.repositionLabels == null) return;
                        var shift = _this.yAxis.repositionLabels[i]; 
                        view.attr("x",+view.attr("x") + shift.x);
                        view.attr("y",+view.attr("y") + shift.y);
                    })




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


this.xAxisEl.selectAll("text").style('font-size',this.model.show.labelSize);
this.yAxisEl.selectAll("text").style('font-size',this.model.show.labelSize);

a = JSON.stringify(this.mockData.map(function(d){return [d3.format(",.3s")(d),d3.format(",.3s")(_this.yScale(d))] })).replace(/"/g , "");

//
y = this.yScale;



        }




    });

    return AxisLabelerDemo;
});


