define([
    'jquery',
    'd3',
    'base/component'
], function($, d3, Component) {


    var smartlabeler = function(options){
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
                if(options.isPivotAuto==null) options.isPivotAuto = false;
                if(options.formatter==null) options.formatter = d3.format(",.1s");
                if(options.widthToFontsizeRatio==null) options.widthToFontsizeRatio = 0.75;
                if(options.cssFontSize==null) options.cssFontSize = "13px";
                if(options.cssMarginLeft==null||options.cssMarginLeft=="0px") options.cssMarginLeft = "10px";
                if(options.cssMarginRight==null||options.cssMarginRight=="0px") options.cssMarginRight = "10px";

                if(options.widthOfOneDigit==null) options.widthOfOneDigit =
                    parseInt(options.cssFontSize)*options.widthToFontsizeRatio;

                var spaceOneLabel =
                    //calculate a typical number of symbols needed for the values
                    (d3.format(",.1s")(d3.mean(axis.scale().domain())).length + 1)
                    //multiply this by width of one digit
                    *options.widthOfOneDigit
                    //add left and right margins
                    +parseInt(options.cssMarginLeft)
                    +parseInt(options.cssMarginRight)
                ;

                var tickValues = [];
                var lengthDomain = axis.scale().domain()[1] - axis.scale().domain()[0];
                var lengthRange = axis.scale().range()[1] - axis.scale().range()[0];


                console.log("expected digits " + (d3.format(",.1s")(d3.mean(axis.scale().domain())).length + 1));
                console.log("space for one label " + Math.round(spaceOneLabel));

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
                        //skip populating when there is no space on the screen
                        if(lengthRange/tickValues.length<spaceOneLabel) return;
                        //populate the stops in the order of importance
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
                    .tickFormat(options.formatter)
                    .tickValues(tickValues);
            };

    var AxisLabeler = Component.extend({
        init: function(context, options) {
            var _this = this;
            this.name = 'axis-labeler';
            this.template = 'components/_examples/' + this.name + '/' + this.name;

            //define expected models for this component
            this.model_expects = ["domain"];

            this._super(context, options);
            this.xAxis = d3.svg.axis();
            this.yAxis = d3.svg.axis();

            this.xAxis.smartLabeler = smartlabeler;
            this.yAxis.smartLabeler = smartlabeler;

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
            this.model.domain.on({
                'change': function() {
                console.log("Model.domain updated!");
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
            this.scaleType = "log";
            this.xScale = d3.scale.log().domain([this.model.domain.from, this.model.domain.to]);
            this.yScale = d3.scale.log().domain([this.model.domain.from, this.model.domain.to]);
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
            if (this.scaleType !== "ordinal") {
                this.xScale.range([0, width]).nice();
                this.yScale.range([height, 0]).nice();
            } else {
                this.xScale.rangePoints([0, width], padding).range();
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
                //.ticks(Math.max(width / tick_spacing, 2));
                .tickSize(6, 0)
                .smartLabeler({
                    scaleType: this.scaleType,
                    widthOfOneDigit: this.widthOfOneDigit,
                    cssFontSize: this.axisTextFontSize
                });

            this.yAxis.scale(this.yScale)
                .orient("left")
                .ticks(Math.max(height / tick_spacing, 2))
                .tickSize(6, 0);

            this.xAxisEl.attr("transform", "translate(0," + height + ")");

            this.xAxisEl.call(this.xAxis);
            this.yAxisEl.call(this.yAxis);
        }




    });

    return AxisLabeler;
});
