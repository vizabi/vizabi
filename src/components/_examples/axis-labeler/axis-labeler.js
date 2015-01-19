define([
    'jquery',
    'd3',
    'base/component'
], function($, d3, Component) {


    var Smartlabeler = function(orientation){
        var _this = this;
        this.VERTICAL = 'ordinate axis';
        this.HORIZONTAL = 'absciss axis';
        this.METHOD_REPEATING = 'repeating specified powers';
        this.METHOD_DOUBLING = 'doubling the value';
        this.DEFAULT_LOGBASE = 10;


        this.update = function(options){
            var axis = this;

            if(options==null) options = {}
            if(options.scaleType==null) {console.warn('please set scaleType to "lin", "log", "ordinal"'); return axis;};
            if(options.scaleType=='ordinal') return axis.tickValues(null);

            if(options.logBase==null) options.logBase = _this.DEFAULT_LOGBASE;
            if(options.method==null) options.method = _this.METHOD_REPEATING;
            if(options.baseValues==null) options.stops = [1,2,5,7,3,4,6,8,9];
            if(options.lengthWhenPivoting==null) options.lengthWhenPivoting = 44;
            if(options.isPivotAuto==null) options.isPivotAuto = true;
            if(options.formatter==null) options.formatter = d3.format(",.1s");
            if(options.widthToFontsizeRatio==null) options.widthToFontsizeRatio = 0.75;
            if(options.cssFontSize==null) options.cssFontSize = "13px";
            if(options.cssMarginLeft==null||options.cssMarginLeft=="0px") options.cssMarginLeft = "10px";
            if(options.cssMarginRight==null||options.cssMarginRight=="0px") options.cssMarginRight = "10px";
            if(options.tickSpacing==null)options.tickSpacing = 50;
            if(options.showOuter==null)options.showOuter = true;

            if(options.widthOfOneDigit==null) options.widthOfOneDigit =
                parseInt(options.cssFontSize)*options.widthToFontsizeRatio;

            var min = axis.scale().domain()[0];
            var max = axis.scale().domain()[1];

            //measure the longest formatted label
            var longestLabelLength = d3.max(
                d3.range(min, max, (max-min)/13).map(function(d){return options.formatter(d).length})
                );

            var spaceOneLabel =
                //calculate the number of symbols needed for the values
                longestLabelLength*options.widthOfOneDigit
                //add left and right margins
                +parseInt(options.cssMarginLeft)
                +parseInt(options.cssMarginRight)
            ;

            var ticksNumber = 5;
            var tickValues = [];
            var lengthDomain = Math.abs(axis.scale().domain()[1] - axis.scale().domain()[0]);
            var lengthRange = Math.abs(axis.scale().range()[1] - axis.scale().range()[0]);


            console.log(orientation);
            console.log("expected digits " + longestLabelLength);
            console.log("space for one label " + Math.round(spaceOneLabel));


            var getBaseLog = function(x, base) {
                if(base == null) base = options.logBase;
                return Math.log(x) / Math.log(base);
            };


            if(options.scaleType=="log"){
                if(options.method == _this.METHOD_REPEATING){
                    var spawn = d3.range(
                            Math.ceil(getBaseLog(axis.scale().domain()[0])),
                            Math.ceil(getBaseLog(axis.scale().domain()[1])),
                            min>max? -1 : 1)
                        .map(function(d){return Math.pow(options.logBase, d)});

                    if(options.showOuter)tickValues.push(max);

                    options.stops.forEach(function(stop){
                        //skip populating when there is no space on the screen
                        if(lengthRange/tickValues.length<spaceOneLabel) return;
                        //populate the stops in the order of importance
                        tickValues = tickValues.concat(spawn.map(function(d){return d*stop}));
                    })

                    if(!options.showOuter)tickValues.splice(tickValues.indexOf(min),1);

                }else if(options.method == _this.METHOD_DOUBLING) {
                    var spawn = d3.range(
                            Math.ceil(getBaseLog(this.scale().domain()[0],2)),
                            Math.ceil(getBaseLog(this.scale().domain()[1],2)),
                            min>max? -1 : 1)
                        .map(function(d){return Math.pow(2, d)});

                    tickValues = spawn;
                }


            tickValues = tickValues.filter(function(d){return Math.min(min,max)<=d && d<=Math.max(min,max)});
            } //logarithmic

            if(options.scaleType=="linear"){
                tickValues = null;
                ticksNumber = Math.max(lengthRange / options.tickSpacing, 2);
            }

            if(options.isPivotAuto){
                axis.pivot = spaceOneLabel>options.lengthWhenPivoting;
            }else{
                axis.pivot = false;
            }

            //if(min==max)tickValues = [min];


            console.log(tickValues);
            console.log("===========");
            return axis
                .ticks(ticksNumber)
                .tickFormat(options.formatter)
                .tickValues(tickValues);
        }
    };









    var AxisLabeler = Component.extend({
        init: function(context, options) {
            var _this = this;
            this.name = 'axis-labeler';
            this.template = 'components/_examples/' + this.name + '/' + this.name;

            //define expected models for this component
            this.model_expects = ["scales"];

            this._super(context, options);
            this.xAxis = d3.svg.axis();
            this.yAxis = d3.svg.axis();

            var smartlabelerX = new Smartlabeler("HORIZONTAL");
            var smartlabelerY = new Smartlabeler("VERTICAL");

            this.xAxis.smartLabeler = smartlabelerX.update;
            this.yAxis.smartLabeler = smartlabelerY.update;

        },




        /**
         * Executes right after the template is in place
         */
        domReady: function() {
            var _this = this;

            // reference elements
            this.graph = this.element.select('.vzb-bc-graph');
            this.xAxisEl = this.graph.select('.vzb-bc-axis-x');
            this.yAxisEl = this.graph.select('.vzb-bc-axis-y');


            //model events
            this.model.scales.on({
                'change': function() {
                console.log("Model.scales updated!");
                _this.initScales();
                _this.update();
                }
            });

            //component events
            this.on("resize", function() {
                console.log("Gotta resize!");
                _this.update();
            })

        },

        modelReady: function(evt) {
            this.initScales();
            this.update();
        },





        initScales: function(){
            this.xScale = d3.scale[this.model.scales.xScaleType]()
                .domain([this.model.scales.from, this.model.scales.to]);
            this.yScale = d3.scale[this.model.scales.yScaleType]()
                .domain([this.model.scales.from, this.model.scales.to]);
        },

        /*
         * RESIZE:
         * Executed whenever the container is resized
         */
        update: function() {
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


            //update scales to the new range
            if (this.model.scales.xScaleType !== "ordinal") {
                this.xScale.range([0, width]).nice();
            } else {
                this.xScale.rangePoints([0, width], padding).range();
            }

            if (this.model.scales.yScaleType !== "ordinal") {
                this.yScale.range([height, 0]).nice();
            } else {
                this.yScale.rangePoints([height, 0], padding).range();
            }

            // measure the width of one digit
            var widthSampleG = this.xAxisEl.append("g").attr("class","tick widthSampling");
            widthSampleT = widthSampleG.append('text').text('0');
            this.axisTextFontSize = widthSampleT.style("font-size");
            this.widthOfOneDigit = widthSampleT[0][0].getComputedTextLength();
            widthSampleG.remove();

            this.xAxis.scale(this.xScale)
                .orient("bottom")
                .tickSize(6, 0)
                .smartLabeler({
                    scaleType: this.model.scales.xScaleType,
                    widthOfOneDigit: this.widthOfOneDigit,
                    cssFontSize: this.axisTextFontSize,
                    lengthWhenPivoting: margin.bottom,
                    tickSpacing: tick_spacing
                });

            this.yAxis.scale(this.yScale)
                .orient("left")
                .tickSize(6, 0)
                .smartLabeler({
                    scaleType: this.model.scales.yScaleType,
                    widthOfOneDigit: this.widthOfOneDigit,
                    cssFontSize: this.axisTextFontSize,
                    lengthWhenPivoting: margin.left,
                    tickSpacing: tick_spacing
                });

            this.xAxisEl.attr("transform", "translate(0," + height + ")");

            this.xAxisEl
                .call(this.xAxis)
                .selectAll("text")
                    .attr("transform","rotate("+(this.xAxis.pivot?-90:0)+")")
                    .style("text-anchor", this.xAxis.pivot?"end":"middle")
                    .attr("dx", this.xAxis.pivot?"-0.71em":"0.00em")
                    .attr("dy", this.xAxis.pivot?"-0.32em":"0.71em")

            this.yAxisEl
                .call(this.yAxis)
                .selectAll("text")
                    .attr("transform","rotate("+(this.yAxis.pivot?-90:0)+")")
                    .style("text-anchor", this.yAxis.pivot?"middle":"end")
                    .attr("dx", this.yAxis.pivot?"+0.71em":"0.00em")
                    .attr("dy", this.yAxis.pivot?"-0.71em":"0.32em")


        }




    });

    return AxisLabeler;
});
