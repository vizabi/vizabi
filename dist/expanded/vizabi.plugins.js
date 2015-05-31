/* VIZABI - http://www.gapminder.org - 2015-05-31 */

(function() {

    "use strict";

    var root = this;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) {
        return;
    }

    d3.svg.axisSmart = function(){
        
    return function d3_axis_smart(_super) {
        
        var VERTICAL = 'vertical axis';
        var HORIZONTAL = 'horizontal axis';
        var X = 'labels stack side by side';
        var Y = 'labels stack top to bottom';
        
        var OPTIMISTIC = 'optimistic approximation: labels have different lengths';
        var PESSIMISTIC = 'pessimistic approximation: all labels have the largest length';
        var DEFAULT_LOGBASE = 10;
        
        function onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
        }

        function axis(g) {
            if(highlightValue!=null){axis.highlightValueRun(g); return;}
            
            // measure the width and height of one digit
            var widthSampleG = g.append("g").attr("class","tick widthSampling");
            var widthSampleT = widthSampleG.append('text').text('0');
            
            options.cssMarginTop = widthSampleT.style("margin-top");
            options.cssMarginBottom = widthSampleT.style("margin-bottom");
            options.cssMarginLeft = widthSampleT.style("margin-left");
            options.cssMarginRight = widthSampleT.style("margin-right");
            options.widthOfOneDigit = widthSampleT[0][0].getBBox().width;
            options.heightOfOneDigit = widthSampleT[0][0].getBBox().height;
            widthSampleG.remove();
            
            
            // run label factory - it will store labels in tickValues property of axis
            axis.labelFactory(options);
            
            //if(axis.orient()=="bottom") console.log("ordered", axis.tickValues())
            // construct the view (d3 constructor is used)
            if(options.transitionDuration>0){
                _super(g.transition().duration(options.transitionDuration));
            }else{
                _super(g);
            }
            //if(axis.orient()=="bottom") console.log("received", g.selectAll("text").each(function(d){console.log(d)}))
            
            var orient = axis.orient()=="top"||axis.orient()=="bottom"?HORIZONTAL:VERTICAL;
            var dimension = (orient==HORIZONTAL && axis.pivot() || orient==VERTICAL && !axis.pivot())?Y:X;

            g.selectAll('.vzb-axis-value')
                .data([null])
                .enter().append('g')
                .attr("class",'vzb-axis-value')
                .append("text")
                .style("opacity",0);
            
            // patch the label positioning after the view is generated
            g.selectAll("text")
                .each(function(d,i){
                    var view = d3.select(this);
                
                    if(axis.pivot() == null) return;
                    view.attr("transform","rotate("+(axis.pivot()?-90:0)+")");
                    view.style("text-anchor", dimension==X?"middle":"end");
                    view.attr("x",  dimension==X?0:(-axis.tickPadding() - axis.tickSize()));
                    view.attr("y", dimension==X? (orient==VERTICAL?-1:1)*(axis.tickPadding() + axis.tickSize()):0);
                    view.attr("dy", dimension==X?(orient==VERTICAL?0:".72em"):".32em");
                    
                    if(axis.repositionLabels() == null) return;
                    var shift = axis.repositionLabels()[i] || {x:0, y:0}; 
                    view.attr("x",+view.attr("x") + shift.x);
                    view.attr("y",+view.attr("y") + shift.y);
                })
            
            if (axis.tickValuesMinor()==null) axis.tickValuesMinor([]);
                // add minor ticks
                var minorTicks = g.selectAll(".tickMinor").data(tickValuesMinor);
                minorTicks.exit().remove();
                minorTicks.enter().append("line")
                    .attr("class", "tickMinor");

                var tickLengthOut = axis.tickSizeMinor().outbound;
                var tickLengthIn = axis.tickSizeMinor().inbound;
                var scale = axis.scale();
                minorTicks
                    .attr("y1", orient==HORIZONTAL? (axis.orient()=="top"?1:-1)*tickLengthIn : scale)
                    .attr("y2", orient==HORIZONTAL? (axis.orient()=="top"?-1:1)*tickLengthOut : scale)
                    .attr("x1", orient==VERTICAL? (axis.orient()=="right"?-1:1)*tickLengthIn : scale)
                    .attr("x2", orient==VERTICAL? (axis.orient()=="right"?1:-1)*tickLengthOut : scale)
            
        };
        
        
        axis.highlightValueRun = function(g){
            var orient = axis.orient()=="top"||axis.orient()=="bottom"?HORIZONTAL:VERTICAL;
            
            g.selectAll(".tick")
                .each(function(d,t){
                    d3.select(this).select("text")
                        .transition()
                        .duration(highlightTransDuration)
                        .ease("linear")
                        .style("opacity", highlightValue=="none"? 1 : Math.min(1, Math.pow(
                                    Math.abs(axis.scale()(d)-axis.scale()(highlightValue))/
                                    (axis.scale().range()[1] - axis.scale().range()[0])*5, 2) 
                              ))
                })
            
            
            g.select('.vzb-axis-value')    
                .transition()
                .duration(highlightTransDuration)
                .ease("linear")
                .attr("transform", highlightValue=="none"? "translate(0,0)" : "translate("
                    + (orient==HORIZONTAL?axis.scale()(highlightValue):0) +","
                    + (orient==VERTICAL?axis.scale()(highlightValue):0) + ")"
                )
                
            g.select('.vzb-axis-value').select("text")
                .text(axis.tickFormat()(highlightValue=="none"?0:highlightValue))
                .style("opacity",(highlightValue=="none"?0:1));

            highlightValue = null;
        }
        
        
        var highlightValue = null;
        axis.highlightValue = function(arg){
            if (!arguments.length) return highlightValue;
            highlightValue = arg;
            return axis;
        }
        
        var highlightTransDuration = 0;
        axis.highlightTransDuration = function(arg){
            if (!arguments.length) return highlightTransDuration;
            highlightTransDuration = arg;
            return axis;
        }        
        
        var repositionLabels = null;
        axis.repositionLabels = function(arg){
            if (!arguments.length) return repositionLabels;
            repositionLabels = arg;
            return axis;
        };
        
        var pivot = false;
        axis.pivot = function(arg) {
            if (!arguments.length) return pivot;
            pivot = !!arg;
            return axis;
        };
                
        var tickValuesMinor = [];
        axis.tickValuesMinor = function(arg) {
            if (!arguments.length) return tickValuesMinor;
            tickValuesMinor = arg;
            return axis;
        };     
        
        var tickSizeMinor = {outbound:0, inbound:0};
        axis.tickSizeMinor = function(arg1, arg2) {
            if (!arguments.length) return tickSizeMinor;
            tickSizeMinor = {outbound:arg1, inbound:arg2||0};
            meow("setting", tickSizeMinor)
            return axis;
        };
        
        var options = {};
        axis.labelerOptions = function(arg) {
            if (!arguments.length) return options;
            options = arg;
            return axis;
        };
        
        axis.labelFactory = function(options){
            this.METHOD_REPEATING = 'repeating specified powers';
            this.METHOD_DOUBLING = 'doubling the value';

            if(options==null) options = {}
            if(options.scaleType!="linear"&&
               options.scaleType!="time"&&
               options.scaleType!="genericLog"&&
               options.scaleType!="log" && 
               options.scaleType!="ordinal") {
                return axis.ticks(ticksNumber)
                            .tickFormat(null)
                            .tickValues(null)
                            .tickValuesMinor(null)
                            .pivot(null)
                            .repositionLabels(null);
            };
            if(options.scaleType=='ordinal') return axis.tickValues(null);

            if(options.logBase==null) options.logBase = DEFAULT_LOGBASE;
            if(options.baseValues==null) options.stops = [1,2,5,3,7,4,6,8,9];
            
            
            
            if(options.removeAllLabels==null) options.removeAllLabels = false;

            if(options.formatterRemovePrefix==null) options.formatterRemovePrefix = false;

            if(options.formatter==null) options.formatter = function(d){
                               
                if(options.scaleType == "time") {
                    if(!(d instanceof Date)) d = new Date(d);
                    return d3.time.format("%Y")(d);
                }
                
                var format = "f";
                var prec = 0;
                if(Math.abs(d)<1) {prec = 1; format = "r"};

                var prefix = "";
                if(options.formatterRemovePrefix) return d3.format("."+prec+format)(d);

                switch (Math.floor(Math.log10(Math.abs(d)))){
                    case -13: d = d*1000000000000; prefix = "p"; break; //0.1p
                    case -10: d = d*1000000000; prefix = "n"; break; //0.1n
                    case  -7: d = d*1000000; prefix = "µ"; break; //0.1µ
                    case  -6: d = d*1000000; prefix = "µ"; break; //1µ
                    case  -5: d = d*1000000; prefix = "µ"; break; //10µ
                    case  -4: break; //0.0001
                    case  -3: break; //0.001
                    case  -2: break; //0.01
                    case  -1: break; //0.1
                    case   0: break; //1
                    case   1: break; //10
                    case   2: break; //100
                    case   3: break; //1000
                    case   4: break; //10000
                    case   5: d = d/1000; prefix = "k"; break; //0.1M
                    case   6: d = d/1000000; prefix = "M"; prec = 1; break; //1M
                    case   7: d = d/1000000; prefix = "M"; break; //10M
                    case   8: d = d/1000000; prefix = "M"; break; //100M
                    case   9: d = d/1000000000; prefix = "B"; prec = 1; break; //1B
                    case  10: d = d/1000000000; prefix = "B"; break; //10B
                    case  11: d = d/1000000000; prefix = "B"; break; //100B
                    case  12: d = d/1000000000000; prefix = "T"; prec = 1; break; //1T
                    //use the D3 SI formatting for the extreme cases
                    default: return (d3.format("."+prec+"s")(d)).replace("G","B");
                }


                // use manual formatting for the cases above
                return (d3.format("."+prec+format)(d)+prefix).replace("G","B");
            }
            options.cssLabelMarginLimit = 5; //px
            if(options.cssMarginLeft==null||parseInt(options.cssMarginLeft)<options.cssLabelMarginLimit) options.cssMarginLeft = options.cssLabelMarginLimit + "px";
            if(options.cssMarginRight==null||parseInt(options.cssMarginRight)<options.cssLabelMarginLimit) options.cssMarginRight = options.cssLabelMarginLimit + "px";
            if(options.cssMarginTop==null||parseInt(options.cssMarginTop)<options.cssLabelMarginLimit) options.cssMarginTop = options.cssLabelMarginLimit + "px";
            if(options.cssMarginBottom==null||parseInt(options.cssMarginBottom)<options.cssLabelMarginLimit) options.cssMarginBottom = options.cssLabelMarginLimit + "px";
            if(options.toolMargin==null) options.toolMargin = {left: 30, bottom: 30, right: 30, top: 30};

            if(options.pivotingLimit==null) options.pivotingLimit = options.toolMargin[this.orient()];
            
            if(options.showOuter==null)options.showOuter = false;
            if(options.limitMaxTickNumber==null)options.limitMaxTickNumber = 0; //0 is unlimited

            var orient = this.orient()=="top"||this.orient()=="bottom"?HORIZONTAL:VERTICAL;

            if(options.isPivotAuto==null) options.isPivotAuto = orient==VERTICAL;
            
            if(options.cssFontSize==null) options.cssFontSize = "13px";
            if(options.widthToFontsizeRatio==null) options.widthToFontsizeRatio = 0.75;
            if(options.heightToFontsizeRatio==null) options.heightToFontsizeRatio = 1.20;
            if(options.widthOfOneDigit==null) options.widthOfOneDigit =
                parseInt(options.cssFontSize)*options.widthToFontsizeRatio;
            if(options.heightOfOneDigit==null) options.heightOfOneDigit =
                parseInt(options.cssFontSize)*options.heightToFontsizeRatio;
            
            

meow("********** "+orient+" **********");
            
            var domain = axis.scale().domain();
            var range = axis.scale().range();
            var lengthDomain = Math.abs(domain[domain.length-1] - domain[0]);
            var lengthRange = Math.abs(range[range.length-1] - range[0]);
            
            var min = d3.min([domain[0],domain[domain.length-1]]);
            var max = d3.max([domain[0],domain[domain.length-1]]);
            var bothSidesUsed = (min<0 && max >0) && options.scaleType != "time";
            
            if(bothSidesUsed && options.scaleType == "log")console.error("It looks like your " + orient + " log scale domain is crossing ZERO. Classic log scale can only be one-sided. If need crossing zero try using genericLog scale instead")
                
            var tickValues = options.showOuter?[min, max]:[];
            var tickValuesMinor = []; //[min, max];
            var ticksNumber = 5;
            
            function getBaseLog(x, base) {
                if(base == null) base = options.logBase;
                return Math.log(x) / Math.log(base);
            };
            
            // estimate the longest formatted label in pixels
            var estLongestLabelLength =
                //take 17 sample values and measure the longest formatted label
                d3.max( d3.range(min, max, (max-min)/17).concat(max).map(function(d){return options.formatter(d).length}) ) 
                * options.widthOfOneDigit
                + parseInt(options.cssMarginLeft);

            var pivot = options.isPivotAuto 
                && (
                    (estLongestLabelLength + axis.tickPadding() + axis.tickSize() > options.pivotingLimit)
                    && (orient == VERTICAL)
                    ||
                    !(estLongestLabelLength + axis.tickPadding() + axis.tickSize() > options.pivotingLimit)
                    && !(orient == VERTICAL)
                );
            
            var labelsStackOnTop = (orient==HORIZONTAL && pivot || orient==VERTICAL && !pivot);
            
            
            
            
            // conditions to remove labels altogether
            var labelsJustDontFit = (!labelsStackOnTop && options.heightOfOneDigit > options.pivotingLimit);
            if(options.removeAllLabels) return axis.tickValues([]);
            
            // return a single tick if have only one point in the domain
            if (min==max) return axis.tickValues([min]).ticks(1).tickFormat(options.formatter);






            // LABELS FIT INTO SCALE
            // measure if all labels in array tickValues can fit into the allotted lengthRange
            // approximationStyle can be OPTIMISTIC or PESSIMISTIC
            // in optimistic style the length of every label is added up and then we check if the total pack of symbols fit
            // in pessimistic style we assume all labels have the length of the longest label from tickValues
            // returns TRUE if labels fit and FALSE otherwise
            var labelsFitIntoScale = function(tickValues, lengthRange, approximationStyle, rescalingLabels){
                if(tickValues == null || tickValues.length <= 1) return true;
                if (approximationStyle==null) approximationStyle = PESSIMISTIC;
                if (rescalingLabels==null) scaleType = "none";
                
                
                
                if(labelsStackOnTop){
                    //labels stack on top of each other. digit height matters
                    return lengthRange >
                        tickValues.length * (
                            options.heightOfOneDigit +
                            parseInt(options.cssMarginTop) +
                            parseInt(options.cssMarginBottom)
                        );
                }else{
                    //labels stack side by side. label width matters
                    var marginsLR = parseInt(options.cssMarginLeft) + parseInt(options.cssMarginRight);
                    var maxLength = d3.max(tickValues.map(function(d){return options.formatter(d).length}));
                    
                    // log scales need to rescale labels, so that 9 takes more space than 2
                    if(rescalingLabels=="log"){
                        // sometimes only a fragment of axis is used. in this case we want to limit the scope to that fragment
                        // yes, this is hacky and experimental 
                        lengthRange = Math.abs(axis.scale()(d3.max(tickValues)) - axis.scale()(d3.min(tickValues)));
                    
                        return lengthRange > 
                            d3.sum(tickValues.map(function(d){
                                    return (
                                        options.widthOfOneDigit 
                                            * (approximationStyle == PESSIMISTIC ? maxLength : options.formatter(d).length) 
                                        + marginsLR
                                    ) 
                                    // this is a logarithmic rescaling of labels
                                    * (1 + Math.log10((d+"").substr(0,1)))
                            }))

                    }else{
                        return lengthRange >
                            tickValues.length * marginsLR
                            + (approximationStyle == PESSIMISTIC ?
                                options.widthOfOneDigit 
                                    * tickValues.length * maxLength
                                : 0)
                            + (approximationStyle == OPTIMISTIC ?
                                options.widthOfOneDigit * (
                                    tickValues.map(function(d){return options.formatter(d)}).join("").length
                                )
                                : 0);
                    }
                }
            }
            
            
            
            
            
            // COLLISION BETWEEN
            // Check is there is a collision between labels ONE and TWO
            // ONE is a value, TWO can be a value or an array
            // returns TRUE if collision takes place and FALSE otherwise
            var collisionBetween = function(one, two){
                if(two==null || two.length == 0) return false;
                if(!(two instanceof Array))two = [two];
            
                for(var i = 0; i<two.length; i++){
                    if( 
                        one != two[i] && one != 0
                        &&
                        Math.abs(axis.scale()(one) - axis.scale()(two[i]))
                        <
                        (labelsStackOnTop? 
                            (options.heightOfOneDigit)
                            :
                            (options.formatter(one).length+options.formatter(two[i]).length)*options.widthOfOneDigit/2
                        )
                    ) return true; 
                
                }
                return false;
            }

            

            


            if(options.scaleType=="genericLog" || options.scaleType=="log"){
                var eps = axis.scale().eps ? axis.scale().eps() : 0;
                
                var spawnZero = bothSidesUsed? [0]:[];

                // check if spawn positive is needed. if yes then spawn!
                var spawnPos = max<eps? [] : (
                    d3.range(
                        Math.floor(getBaseLog(Math.max(eps,min))),
                        Math.ceil(getBaseLog(max)),
                        1)
                    .concat(Math.ceil(getBaseLog(max)))
                    .map(function(d){return Math.pow(options.logBase, d)})
                    );

                // check if spawn negative is needed. if yes then spawn!
                var spawnNeg = min>-eps? [] : (
                    d3.range(
                        Math.floor(getBaseLog(Math.max(eps,-max))),
                        Math.ceil(getBaseLog(-min)),
                    1)
                    .concat(Math.ceil(getBaseLog(-min)))
                    .map(function(d){return -Math.pow(options.logBase, d)})
                    );
                
                
                // automatic chosing of method if it's not explicitly defined
                if(options.method==null) {
                    var coverage = bothSidesUsed ? 
                        Math.max(Math.abs(max), Math.abs(min))/eps 
                        :
                        Math.max(Math.abs(max), Math.abs(min))/Math.min(Math.abs(max), Math.abs(min));
                    options.method = 10 <= coverage&&coverage <= 1024 ? this.METHOD_DOUBLING : this.METHOD_REPEATING;
                };

                
                //meow('spawn pos/neg: ', spawnPos, spawnNeg);
            
                    
                if(options.method == this.METHOD_DOUBLING) {
                    var doublingLabels = [];
                    if(bothSidesUsed)tickValues.push(0);
                    var avoidCollidingWith = [].concat(tickValues);

                    // start with the smallest abs number on the scale, rounded to nearest nice power
                    //var startPos = max<eps? null : Math.pow(options.logBase, Math.floor(getBaseLog(Math.max(eps,min))));
                    //var startNeg = min>-eps? null : -Math.pow(options.logBase, Math.floor(getBaseLog(Math.max(eps,-max))));
                    
                    var startPos = max<eps? null  : 4*spawnPos[Math.floor(spawnPos.length/2)-1];
                    var startNeg = min>-eps? null : 4*spawnNeg[Math.floor(spawnNeg.length/2)-1];
                    
                    //meow('starter pos/neg: ', startPos, startNeg);

                    if(startPos){ for(var l=startPos; l<=max; l*=2) doublingLabels.push(l);}
                    if(startPos){ for(var l=startPos/2; l>=Math.max(min,eps); l/=2) doublingLabels.push(l);}
                    if(startNeg){ for(var l=startNeg; l>=min; l*=2) doublingLabels.push(l);}
                    if(startNeg){ for(var l=startNeg/2; l<=Math.min(max,-eps); l/=2) doublingLabels.push(l);}
                                        
                    doublingLabels = doublingLabels
                        .sort(d3.ascending)
                        .filter(function(d){return min<=d&&d<=max});
                    
                    tickValuesMinor = tickValuesMinor.concat(doublingLabels);
                    
                    doublingLabels = groupByPriorities(doublingLabels,false); // don't skip taken values
                    
                    var tickValues_1 = tickValues;
                    for(var j = 0; j<doublingLabels.length; j++){

                        // compose an attempt to add more axis labels    
                        var trytofit = tickValues_1.concat(doublingLabels[j])
                            .filter(function(d){ return !collisionBetween(d,avoidCollidingWith); })
                            .filter(onlyUnique)
                        
                        // stop populating if labels don't fit 
                        if(!labelsFitIntoScale(trytofit, lengthRange, PESSIMISTIC, "none")) break;
                        
                        // apply changes if no blocking instructions
                        tickValues = trytofit
                    }
                }
                
                
                if(options.method == this.METHOD_REPEATING){
                    
                    var spawn = spawnZero.concat(spawnPos).concat(spawnNeg).sort(d3.ascending);
                    
                    options.stops.forEach(function(stop, i){
                        tickValuesMinor = tickValuesMinor.concat(spawn.map(function(d){return d*stop}));
                    });
                    
                    spawn = groupByPriorities(spawn);
                    var avoidCollidingWith = spawnZero.concat(tickValues);
                    
                    var stopTrying = false;

                    options.stops.forEach(function(stop, i){
                        if(i==0){
                            for(var j = 0; j<spawn.length; j++){
                                
                                // compose an attempt to add more axis labels    
                                var trytofit = tickValues
                                    .concat(spawn[j].map(function(d){return d*stop}))
                                    // throw away labels that collide with "special" labels 0, min, max
                                    .filter(function(d){return !collisionBetween(d,avoidCollidingWith);})
                                    .filter(function(d){return min<=d&&d<=max})
                                    .filter(onlyUnique);
                                
                                // stop populating if labels don't fit 
                                if(!labelsFitIntoScale(trytofit, lengthRange, OPTIMISTIC, "none")) break;
                                
                                // apply changes if no blocking instructions
                                tickValues = trytofit;
                            }
                            
                            //flatten the spawn array
                            spawn = [].concat.apply([], spawn);
                        }else{
                            if(stopTrying)return; 
                            
                            // compose an attempt to add more axis labels
                            var trytofit = tickValues
                                .concat(spawn.map(function(d){return d*stop}))
                                .filter(function(d){return min<=d&&d<=max})
                                .filter(onlyUnique);
                            
                            // stop populating if the new composition doesn't fit
                            if(!labelsFitIntoScale(trytofit, lengthRange, PESSIMISTIC, "log")) {stopTrying = true; return;}
                            // stop populating if the number of labels is limited in options
                            if(tickValues.length > options.limitMaxTickNumber && options.limitMaxTickNumber!=0) {stopTrying = true; return;}
                            
                            // apply changes if no blocking instructions
                            tickValues = trytofit;
                        }
                    })


                }//method

                
            } //logarithmic

            
            
            
            if(options.scaleType=="linear" || options.scaleType=="time"){
                if(bothSidesUsed)tickValues.push(0);
                var avoidCollidingWith = [].concat(tickValues);
                
                ticksNumber = Math.max(Math.floor(lengthRange / estLongestLabelLength), 2);
                
                // limit maximum ticks number
                if(options.limitMaxTickNumber!=0 && ticksNumber>options.limitMaxTickNumber)ticksNumber = options.limitMaxTickNumber;
                
                var addLabels = axis.scale().ticks.apply(axis.scale(), [ticksNumber])
                    .sort(d3.ascending)
                    .filter(function(d){return min<=d&&d<=max}); 
                
                tickValuesMinor = tickValuesMinor.concat(addLabels);
                
                addLabels = groupByPriorities(addLabels,false);
                
                var tickValues_1 = tickValues;
                for(var j = 0; j<addLabels.length; j++){

                    // compose an attempt to add more axis labels    
                    var trytofit = tickValues_1.concat(addLabels[j])
                        .filter(function(d){ return !collisionBetween(d,avoidCollidingWith); })
                        .filter(onlyUnique);

                    // stop populating if labels don't fit 
                    if(!labelsFitIntoScale(trytofit, lengthRange, PESSIMISTIC, "none")) break;

                    // apply changes if no blocking instructions
                    tickValues = trytofit
                }
                
                tickValues = tickValues//.concat(addLabels)
                    .filter(function(d){ return !collisionBetween(d,avoidCollidingWith); })
                    .filter(onlyUnique);

                
            }



            
            if(tickValues!=null && tickValues.length<=2 && !bothSidesUsed)tickValues = [min, max];
            
            if(tickValues!=null && tickValues.length<=3 && bothSidesUsed){
                if (!collisionBetween(0,[min,max])){ 
                    tickValues = [min, 0, max];
                }else{
                    tickValues = [min, max];
                }
            }
            
            if(tickValues!=null) tickValues.sort(function(a,b){
                return (orient==HORIZONTAL?-1:1)*(axis.scale()(b) - axis.scale()(a))
            });
            
            if(labelsJustDontFit) tickValues = [];
            tickValuesMinor = tickValuesMinor.filter(function(d){
                return tickValues.indexOf(d)==-1 && min<=d&&d<=max
            });
            

meow("final result",tickValues);
            
            return axis
                .ticks(ticksNumber)
                .tickFormat(options.formatter)
                .tickValues(tickValues)
                .tickValuesMinor(tickValuesMinor)
                .pivot(pivot)
                .repositionLabels(
                    repositionLabelsThatStickOut(tickValues, options, orient, axis.scale(), labelsStackOnTop?"y":"x")
                );
        };

        
        
        
        
        
        
        
        
        
        
        // GROUP ELEMENTS OF AN ARRAY, SO THAT...
        // less-prio elements are between the high-prio elements
        // Purpose: enable adding axis labels incrementally, like this for 9 labels:
        // PRIO 1: +--------, concat result: +-------- first we show only 1 label
        // PRIO 2: ----+---+, concat result: +---+---+ then we add 2 more, that are maximally spaced
        // PRIO 3: --+---+--, concat result: +-+-+-+-+ then we fill spaces with 2 more labels
        // PRIO 4: -+-+-+-+-, concat result: +++++++++ then we fill the remaing spaces and show all labels
        // exception: zero jumps to the front, if it's on the list
        // example1: [1 2 3 4 5 6 7] --> [[1][4 7][2 3 5 6]]
        // example2: [1 2 3 4 5 6 7 8 9] --> [[1][5 9][3 7][2 4 6 8]]
        // example3: [-4 -3 -2 -1 0 1 2 3 4 5 6 7] --> [[0][-4][2][-1 5][-3 -2 1 3 4 6 7]]
        // inputs:
        // array - the source array to be processed. Only makes sense if sorted
        // removeDuplicates - return incremental groups (true, default), or return concatinated result (false)
        // returns:
        // the nested array
        function groupByPriorities(array, removeDuplicates){
            if(removeDuplicates==null) removeDuplicates = true;

            var result = [];
            var taken = [];

            //zero is an exception, if it's present we manually take it to the front
            if(array.indexOf(0)!=-1){
                result.push([0]);
                taken.push(array.indexOf(0));
            }

            for(var k = array.length; k>=1; k = k<4? k-1 : k/2){
                // push the next group of elements to the result
                result.push(array.filter(function(d,i){
                    if(i % Math.floor(k) == 0 && (taken.indexOf(i)==-1 || !removeDuplicates)){
                        taken.push(i);
                        return true;
                    }
                    return false;
                }));
            }

            return result;
        }        
        
        
        
        
        
        
        
        
        // REPOSITION LABELS THAT STICK OUT
        // Purpose: the outer labels can easily be so large, they stick out of the allotted area
        // Example:
        // Label is fine:    Label sticks out:    Label sticks out more:    Solution - label is shifted:
        //      12345 |           1234|                123|5                   12345|          
        // _______.   |      _______. |           _______.|                 _______.|          
        // 
        // this is what the function does on the first step (only outer labels)
        // on the second step it shifts the inner labels that start to overlap with the shifted outer labels
        // 
        // requires tickValues array to be sorted from tail-first
        // tail means left or bottom, head means top or right
        //
        // dimension - which dimension requires shifting
        // X if labels stack side by side, Y if labels stack on top of one another
        //
        // returns the array of recommended {x,y} shifts
        
        function repositionLabelsThatStickOut(tickValues, options, orient, scale, dimension){
            if(tickValues==null)return null;
                
            // make an abstraction layer for margin sizes
            // tail means left or bottom, head means top or right
            var margin = 
                orient==VERTICAL?
                {head: options.toolMargin.top, tail: options.toolMargin.bottom}
                :
                {head: options.toolMargin.right, tail: options.toolMargin.left};
            
            
            var result = {};
                        
               
            // STEP 1:
            // for outer labels: avoid sticking out from the tool margin
            tickValues.forEach(function(d,i){
                if(i!=0 && i!=tickValues.length-1) return;
                
                // compute the influence of the axis head
                var repositionHead = margin.head
                    + (orient==HORIZONTAL?1:0) * d3.max(scale.range()) 
                    - (orient==HORIZONTAL?0:1) * d3.min(scale.range()) 
                    + (orient==HORIZONTAL?-1:1) * scale(d)
                    - (dimension=="x") * options.formatter(d).length * options.widthOfOneDigit / 2
                    - (dimension=="y") * options.heightOfOneDigit / 2
                    // we may consider or not the label margins to give them a bit of spacing from the edges
                    //- (dimension=="x") * parseInt(options.cssMarginRight);
                    //- (dimension=="y") * parseInt(options.cssMarginTop);
                
                // compute the influence of the axis tail
                var repositionTail = Math.min(margin.tail, options.widthOfOneDigit)
                    + (orient==VERTICAL?1:0) * d3.max(scale.range()) 
                    - (orient==VERTICAL?0:1) * d3.min(scale.range()) 
                    + (orient==VERTICAL?-1:1) * scale(d)
                    - (dimension=="x") * options.formatter(d).length * options.widthOfOneDigit / 2
                    - (dimension=="y") * options.heightOfOneDigit / 2
                    // we may consider or not the label margins to give them a bit of spacing from the edges
                    //- (dimension=="x") * parseInt(options.cssMarginLeft);
                    //- (dimension=="y") * parseInt(options.cssMarginBottom);
                
                // apply limits in order to cancel repositioning of labels that are good
                if(repositionHead>0)repositionHead=0;
                if(repositionTail>0)repositionTail=0;
                
                // add them up with appropriate signs, save to the axis
                result[i] = {x:0, y:0};
                result[i][dimension] = (dimension=="y" && orient==VERTICAL?-1:1) * (repositionHead - repositionTail);
            });
            

            // STEP 2:
            // for inner labels: avoid collision with outer labels
            tickValues.forEach(function(d,i){
                if(i==0 || i==tickValues.length-1) return;
                
                // compute the influence of the head-side outer label
                var repositionHead = 
                    // take the distance between head and the tick at hand
                    Math.abs(scale(d) - scale(tickValues[tickValues.length-1]) )
                    // substract the shift of the tail
                    - (dimension=="y" && orient==HORIZONTAL?-1:1) * result[tickValues.length-1][dimension]
                    
                    - (dimension=="x") * options.widthOfOneDigit / 2 
                        * options.formatter(d).length
                    - (dimension=="x") * options.widthOfOneDigit / 2 
                        * options.formatter(tickValues[tickValues.length-1]).length
                    - (dimension=="y") * options.heightOfOneDigit 
                        * 0.7; //TODO remove magic constant - relation of actual font height to BBox-measured height

                // compute the influence of the tail-side outer label
                var repositionTail = 
                    // take the distance between tail and the tick at hand
                    Math.abs(scale(d) - scale(tickValues[0]) )
                    // substract the shift of the tail
                    - (dimension=="y" && orient==VERTICAL?-1:1) * result[0][dimension]
                
                    - (dimension=="x") * options.widthOfOneDigit / 2 
                        * options.formatter(d).length
                    - (dimension=="x") * options.widthOfOneDigit / 2 
                        * options.formatter(tickValues[0]).length
                    - (dimension=="y") * options.heightOfOneDigit 
                        * 0.7; //TODO remove magic constant - relation of actual font height to BBox-measured height
                
                // apply limits in order to cancel repositioning of labels that are good
                if(repositionHead>0)repositionHead=0;
                if(repositionTail>0)repositionTail=0;
                
                // add them up with appropriate signs, save to the axis
                result[i] = {x:0, y:0};
                result[i][dimension] = (dimension=="y" && orient==VERTICAL?-1:1) * (repositionHead - repositionTail);
            });
            
            
            return result;
        } // function repositionLabelsThatStickOut()
        
        
        
        
        axis.copy = function () {
            return d3_axis_smart(d3.svg.axis());
        };
        
        return d3.rebind(axis, _super, 
            "scale", "orient", "ticks", "tickValues", "tickFormat", 
            "tickSize", "innerTickSize", "outerTickSize", "tickPadding", 
            "tickSubdivide"
            );
        
        
        function meow(l1,l2,l3,l4,l5){
            if(!axis.labelerOptions().isDevMode)return;
            if(l5!=null){console.log(l1,l2,l3,l4,l5); return;}
            if(l4!=null){console.log(l1,l2,l3,l4); return;}
            if(l3!=null){console.log(l1,l2,l3); return;}
            if(l2!=null){console.log(l1,l2); return;}
            if(l1!=null){console.log(l1); return;}
        }
        
        }(d3.svg.axis());
        
    }; //d3.svg.axisSmart = function(){

}).call(this);


(function() {

    "use strict";

    var root = this;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) {
        return;
    }
    
    d3.svg.collisionResolver = function(){
        
    return function collision_resolver() {

        var DURATION = 300;
        var labelHeight = {};
        var labelPosition = {};

        
        // MAINN FUNCTION. RUN COLLISION RESOLVER ON A GROUP g
        function resolver(g) {
            
            if(data == null){console.warn(
                "D3 collision resolver stopped: missing data to work with. Example: data = {asi: {valueY: 45, valueX: 87}, ame: {valueY: 987, valueX: 767}}"); return;}
            if(selector == null){console.warn(
                "D3 collision resolver stopped: missing a CSS slector"); return;}
            if(height == null){console.warn(
                "D3 collision resolver stopped: missing height of the canvas"); return;}
            if(value == null){console.warn(
                "D3 collision resolver stopped: missing pointer within data objects. Example: value = 'valueY' "); return;}
  
            g.each(function(d, index) {
                labelHeight[d.geo] = d3.select(this).select(selector)[0][0].getBBox().height;
            });

            labelPosition = resolver.calculatePositions(data, value, height, scale);
 
            //actually reposition the labels
            g.each(function (d, i) {
                
                if(data[d.geo][fixed]) return;
                
                var resolvedY = labelPosition[d.geo] || scale(data[d.geo][value]) || 0;
                var resolvedX = null;
                
                if(handleResult!=null) {handleResult(d, i, this, resolvedX, resolvedY); return;}
                
                d3.select(this).selectAll(selector)
                    .transition()
                    .duration(DURATION)
                    .attr("transform", "translate(0," + resolvedY + ")")
            });

   
        };
        
        
        
                
        // CALCULATE OPTIMIZED POSITIONS BASED ON LABELS' HEIGHT AND THEIR PROXIMITY (DELTA)
            
        resolver.calculatePositions = function(data, value, height, scale){
            
            var result = {};
                        
            var keys = Object.keys(data).sort(function(a,b){return data[a][value] - data[b][value]});
                            
            keys.forEach(function(d, index){

                //initial positioning
                result[d] = scale(data[d][value]);

                // check the overlapping chain reaction all the way down 
                for(var j = index; j>0; j--){
                    // if overlap found shift the overlapped label downwards
                    var delta = result[keys[j-1]] - result[keys[j]] - labelHeight[keys[j]];
                    if(delta<0) result[keys[j-1]] -= delta;

                    // if the chain reaction stopped because found some gap in the middle, then quit
                    if(delta>0) break;
                }

            })
                
                
            // check if the lowest label is breaking the boundary...
            var delta = height - result[keys[0]] - labelHeight[keys[0]];

            // if it does, then                
            if(delta<0){
                // shift the lowest up
                result[keys[0]] += delta;

                // check the overlapping chain reaction all the way up 
                for(var j = 0; j<keys.length-1; j++){
                    // if overlap found shift the overlapped label upwards
                    var delta = result[keys[j]] - result[keys[j+1]] - labelHeight[keys[j+1]];
                    if(delta<0) result[keys[j+1]] += delta;

                    // if the chain reaction stopped because found some gap in the middle, then quit
                    if(delta>0) break;
                }
            }
            
            

            return result;
        };
        
        
        
        
        // GETTERS AND SETTERS
        
        var data = null;
        resolver.data = function(arg) {
            if (!arguments.length) return data;
            data = arg;
            return resolver;
        };
        var selector = null;
        resolver.selector = function(arg) {
            if (!arguments.length) return selector;
            selector = arg;
            return resolver;
        };
        var height = null;
        resolver.height = function(arg) {
            if (!arguments.length) return height;
            height = arg;
            return resolver;
        };
        var scale = d3.scale.linear().domain([0,1]).range([0,1]);
        resolver.scale = function(arg) {
            if (!arguments.length) return scale;
            scale = arg;
            return resolver;
        };
        var value = null;
        resolver.value = function(arg) {
            if (!arguments.length) return value;
            value = arg;
            return resolver;
        };
        var fixed = null;
        resolver.fixed = function(arg) {
            if (!arguments.length) return fixed;
            fixed = arg;
            return resolver;
        };
        var handleResult = null;
        resolver.handleResult = function(arg) {
            if (!arguments.length) return handleResult;
            handleResult = arg;
            return resolver;
        };
        

        return resolver;
        
    }();
        
    }; //d3.svg.collisionResolver = function(){

}).call(this);


(function() {

    "use strict";

    var root = this;

    if (!Vizabi._require('d3')) return;

    d3.svg.colorPicker = function(){
        
        return function d3_color_picker() {
        
            

            // tuning defaults
            var nCellsH = 15; // number of cells by hues (angular)
            var minH = 0; // which hue do we start from: 0 to 1 instead of 0 to 365
            var nCellsL = 4; // number of cells by lightness (radial)
            var minL = 0.50; // which lightness to start from: 0 to 1. Recommended 0.3...0.5
            var satConstant = 0.7; // constant saturation for color wheel: 0 to 1. Recommended 0.7...0.8
            
            var outerL_display = 0.40; // ecxeptional saturation of the outer circle. the one displayed 0 to 1
            var outerL_meaning = 0.30; // ecxeptional saturation of the outer circle. the one actually ment 0 to 1
            var firstAngleSat = 0.0; // exceptional saturation at first angular segment. Set 0 to have shades of grey
            
            var minRadius = 15; //radius of the central hole in color wheel: px
            
            var margin = {top: 0.1, bottom: 0.1, left: 0.1, right: 0.1}; //margins in % of container's width and height
            
            var colorOld = "#000";
            var colorDef = "#000";
            
            // names of CSS classes
            var css = {
                INVISIBLE: "vzb-invisible",
                COLOR_POINTER: "vzb-colorPicker-colorPointer",
                COLOR_BUTTON: "vzb-colorPicker-colorCell",
                COLOR_DEFAULT: "vzb-colorPicker-defaultColor",
                COLOR_SAMPLE: "vzb-colorPicker-colorSample",
                COLOR_PICKER: "vzb-colorPicker-colorPicker",
                COLOR_CIRCLE: "vzb-colorPicker-colorCircle",
                COLOR_SEGMENT: "vzb-colorPicker-colorSegment",
                COLOR_BACKGR: "vzb-colorPicker-background"
            }
            
            var colorData = []; //here we store color data. formatted as follows:
            /*
            [
                [ // outer circle
                    {display: "#123456", meaning: "#123456"}, // first angle
                    ... 
                    {display: "#123456", meaning: "#123456"} // last angle, clockwise
                ],
                [ // next circle
                    {display: "#123456", meaning: "#123456"}, // first angle
                    ...
                    {display: "#123456", meaning: "#123456"} // last angle, clockwise
                ],
                
                ...
                
                [ // inner circle
                    {display: "#123456", meaning: "#123456"}, // first angle
                    ...
                    {display: "#123456", meaning: "#123456"} // last angle, clockwise
                ]
            ]
            */
            var arc = d3.svg.arc();

            var pie = d3.layout.pie()
                .sort(null)
                .value(function(d) { return 1 });
            
            var svg = null;
            var colorPointer = null;
            var showColorPicker = false;
            var sampleRect = null;
            var sampleText = null;
            var background = null;
            
            var callback = function(value){console.info("Color picker callback example. Setting color to " + value)}; 

            function _generateColorData() {
                var result = [];
                
                // loop across circles
                for(var l = 0; l<nCellsL; l++) {
                    var lightness = (minL+(1-minL)/nCellsL * l);

                    // new circle of cells
                    result.push([]);
                    
                    // loop across angles
                    for(var h = 0; h<=nCellsH; h++) {
                        var hue = minH+(1-minH)/nCellsH * h;
                        
                        // new cell
                        result[l].push({
                            display: _hslToRgb(hue, h==0?firstAngleSat:satConstant, l==0?outerL_display:lightness),
                            meaning: _hslToRgb(hue, h==0?firstAngleSat:satConstant, l==0?outerL_meaning:lightness)
                        });
                    }
                }
                return result;
            }
            
            
            function _hslToRgb(h, s, l){
                var r, g, b;

                if(s == 0){
                    r = g = b = l; // achromatic
                }else{
                    var _hue2rgb = function _hue2rgb(p, q, t){
                        if(t < 0) t += 1;
                        if(t > 1) t -= 1;
                        if(t < 1/6) return p + (q - p) * 6 * t;
                        if(t < 1/2) return q;
                        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                        return p;
                    }

                    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                    var p = 2 * l - q;
                    r = _hue2rgb(p, q, h + 1/3);
                    g = _hue2rgb(p, q, h);
                    b = _hue2rgb(p, q, h - 1/3);
                }

                return "#" + Math.round(r * 255).toString(16) + Math.round(g * 255).toString(16) + Math.round(b * 255).toString(16);
            }

            
            // this is init function. call it once after you are satisfied with parameters tuning
            // container should be a D3 selection that has a div where we want to render color picker
            // that div should have !=0 width and height in its style 
            function colorPicker(container) {
                colorData = _generateColorData();
                
                svg = container.append("svg")
                    .style("position", "absolute")
                    .style("top", "0")
                    .style("left", "0")
                    .style("width", "100%")
                    .style("height", "100%")
                    .attr("class", css.COLOR_PICKER)
                    .classed(css.INVISIBLE, !showColorPicker);

                var width = parseInt(svg.style("width"));
                var height = parseInt(svg.style("height"));
                var maxRadius = width / 2 * (1 - margin.left - margin.right);
                
                background = svg.append("rect")
                    .attr("width", width)
                    .attr("height", height)
                    .attr("class", css.COLOR_BUTTON + " " + css.COLOR_BACKGR)
                    .on("mouseover", function(d){_cellHover(colorOld)});
                
                var circles = svg.append("g")
                    .attr("transform", "translate(" + (maxRadius + width * margin.left) + "," 
                                                    + (maxRadius + height * margin.top) + ")");
                
                
                svg.append("rect")
                    .attr("class", css.COLOR_SAMPLE)
                    .attr("width", width/2)
                    .attr("height", height * margin.top/2);
                
                sampleRect = svg.append("rect")
                    .attr("class", css.COLOR_SAMPLE)
                    .attr("width", width/2)
                    .attr("x", width/2)
                    .attr("height", height * margin.top/2);

                svg.append("text")
                    .attr("x", width * margin.left)
                    .attr("y", height * margin.top/2)
                    .attr("dy", "0.5em")
                    .style("text-anchor", "start")
                    .attr("class", css.COLOR_SAMPLE);

                sampleText = svg.append("text")
                    .attr("x", width * (1-margin.right))
                    .attr("y", height * margin.top/2)
                    .attr("dy", "0.5em")
                    .style("text-anchor", "end")
                    .attr("class", css.COLOR_SAMPLE);

                svg.append("text")
                    .attr("x", width*0.1)
                    .attr("y", height*(1-margin.bottom))
                    .attr("dy", "0.3em")
                    .style("text-anchor", "start")
                    .text("default");


                svg.append("circle")
                    .attr("class", css.COLOR_DEFAULT + " " + css.COLOR_BUTTON)
                    .attr("r", width * margin.left/2)
                    .attr("cx", width * margin.left * 1.5)
                    .attr("cy", height * (1 - margin.bottom * 1.5))
                    .on("mouseover", function(){
                        d3.select(this).style("stroke", "#444");
                        _cellHover(colorDef);
                    })
                    .on("mouseout", function(){
                        d3.select(this).style("stroke", "none");
                    });

                circles.append("circle")
                    .attr("r", minRadius-1)
                    .attr("fill", "#FFF")
                    .attr("class", css.COLOR_BUTTON)
                    .on("mouseover", function(){
                        d3.select(this).style("stroke", "#444");
                        _cellHover("#FFF");
                    })
                    .on("mouseout", function(){
                        d3.select(this).style("stroke", "none");
                    });


                circles.selectAll("." + css.COLOR_CIRCLE)
                    .data(colorData)
                    .enter().append("g")
                    .attr("class", css.COLOR_CIRCLE)
                    .each(function(circleData, index){

                        arc.outerRadius(minRadius+(maxRadius-minRadius)/nCellsL*(nCellsL-index))
                            .innerRadius(minRadius+(maxRadius-minRadius)/nCellsL*(nCellsL-index-1));


                        var segment = d3.select(this).selectAll("." + css.COLOR_SEGMENT)
                            .data(pie(circleData))
                            .enter().append("g")
                            .attr("class", css.COLOR_SEGMENT);

                        segment.append("path")
                            .attr("class", css.COLOR_BUTTON)
                            .attr("d", arc)
                            .style("fill", function(d) {return d.data.display })
                            .style("stroke", function(d) {return d.data.display })
                            .on("mouseover", function(d){_cellHover(d.data.meaning, this)})
                            .on("mouseout", function(d){_cellUnHover()});
                    })

                colorPointer = circles.append("path")
                    .attr("class", css.COLOR_POINTER + " " + css.INVISIBLE);


                svg.selectAll("." + css.COLOR_BUTTON)
                    .on("click", function(){_this.show(TOGGLE)});


                _doTheStyling(svg);
            };
            
            
            var _doTheStyling = function(svg){
                
                //styling                
                svg.select("."+css.COLOR_BACKGR)
                    .style("fill", "white");
    
                svg.select("."+css.COLOR_POINTER)
                    .style("stroke-width", 2)
                    .style("stroke", "white")
                    .style("pointer-events", "none")
                    .style("fill", "none")

                svg.selectAll("."+css.COLOR_BUTTON)
                    .style("cursor","pointer")
                
                svg.selectAll("text")
                    .style("dominant-baseline","hanging")
                    .style("fill","#D9D9D9")
                    .style("font-size","0.7em")
                    .style("text-transform","uppercase");

                svg.selectAll("circle." + css.COLOR_BUTTON)
                    .style("stroke-width", 2);
            }
            
            
            var _this = colorPicker;
        
            var _cellHover = function(value, view){
                // show color pointer if the view is set (a cell of colorwheel)
                if(view!=null) colorPointer.classed(css.INVISIBLE, false).attr("d", d3.select(view).attr("d"));
                
                sampleRect.style("fill", value);
                sampleText.text(value);
                callback(value);
            }
            var _cellUnHover = function(){
                colorPointer.classed(css.INVISIBLE, true);
            }
                

            //Use this function to hide or show the color picker
            //true = show, false = hide, "toggle" or TOGGLE = toggle
            var TOGGLE = 'toggle';
            colorPicker.show = function(arg){
                if (!arguments.length) return showColorPicker;
                if(svg == null)console.warn("Color picker is missing SVG element. Was init sequence performed?");
                showColorPicker = (arg==TOGGLE? !showColorPicker : arg);
                svg.classed(css.INVISIBLE, !showColorPicker);
            }
                
        
            // getters and setters
            colorPicker.nCellsH = function(arg) {if (!arguments.length) return nCellsH; nCellsH = arg; return colorPicker;};
            colorPicker.minH = function(arg) {if (!arguments.length) return minH; minH = arg; return colorPicker;};
            colorPicker.nCellsL = function(arg) {if (!arguments.length) return nCellsL; nCellsL = arg; return colorPicker;};
            colorPicker.minL = function(arg) {if (!arguments.length) return minL; minL = arg; return colorPicker;};
            colorPicker.outerL_display = function(arg) {if (!arguments.length) return outerL_display; outerL_display = arg; return colorPicker;};
            colorPicker.outerL_meaning = function(arg) {if (!arguments.length) return outerL_meaning; outerL_meaning = arg; return colorPicker;};
            colorPicker.satConstant = function(arg) {if (!arguments.length) return satConstant; satConstant = arg; return colorPicker;};
            colorPicker.firstAngleSat = function(arg) {if (!arguments.length) return firstAngleSat; firstAngleSat = arg; return colorPicker;};
            colorPicker.minRadius = function(arg) {if (!arguments.length) return minRadius; minRadius = arg; return colorPicker;};
            colorPicker.margin = function(arg) {if (!arguments.length) return margin; margin = arg; return colorPicker;};
            
            colorPicker.callback = function(arg) {if (!arguments.length) return callback; callback = arg; return colorPicker;};
            
            colorPicker.colorDef = function (arg) {
                if (!arguments.length) return colorDef;
                colorDef = arg;
                if(svg == null)console.warn("Color picker is missing SVG element. Was init sequence performed?");
                svg.select("."+css.COLOR_DEFAULT).style("fill",colorDef);
                return colorPicker;
            };
            colorPicker.colorOld = function (arg) {
                if (!arguments.length) return colorOld;
                colorOld = arg;
                if(svg == null)console.warn("Color picker is missing SVG element. Was init sequence performed?");
                svg.select("rect."+css.COLOR_SAMPLE).style("fill",colorOld);
                svg.select("text."+css.COLOR_SAMPLE).text(colorOld);
                return colorPicker;
            };
            
            
            return colorPicker;
        }();
        
        

        
    }; //d3.svg.axisSmart = function(){

}).call(this);
















            
(function() {

    "use strict";

    var root = this;

    //warn client if d3 is not defined
    if (!Vizabi._require('d3')) {
        return;
    }

    d3.scale.genericLog = function () {


        return function d3_scale_genericLog(logScale) {

            var _this = this;
            var eps = 0.001;
            var ePos = 0.001;
            var eNeg = -0.001;
            var delta = 5;
            var domain = logScale.domain();
            var range = logScale.range();
            var useLinear = false;

            var linScale = d3.scale.linear().domain([0, eps]).range([0, delta]);


            var abs = function(arg){
                if(arg instanceof Array) return arg.map(function(d){return Math.abs(d)});
                return Math.abs(arg);
            }
            var oneside = function(arg){
                var sign = Math.sign(arg[0]);
                for(var i=0; i<arg.length; i++){ if(Math.sign(arg[i])!=sign)return false; }
                return true;
            }


            function scale(x) {
                var ratio = 1;
                var shiftNeg = 0;
                var shiftPos = 0;
                var shiftAll = 0;
                
                //console.log("DOMAIN log lin", logScale.domain(), linScale.domain());
                //console.log("RANGE log lin", logScale.range(), linScale.range());
                
                var domainPointingForward = domain[0]<domain[domain.length-1];
                var rangePointingForward = range[0]<range[range.length-1];
                
                if(d3.min(domain)<0 && d3.max(domain)>0){
                    var minAbsDomain = d3.min(abs([ domain[0], domain[domain.length-1] ]));
                    //var maxAbsDomain = d3.max(abs([ domain[0], domain[domain.length-1] ]));
                    
                    
                    //ratio shows how the + and - scale should fit as compared to a simple + or - scale
                    ratio = domainPointingForward != rangePointingForward ?
                        ( d3.max(range) + d3.max(range) - logScale( Math.max(eps,minAbsDomain) ) ) / d3.max(range) 
                        :
                        ( d3.max(range) + logScale( Math.max(eps,minAbsDomain)) ) / d3.max(range);
                    
                    
                    
                    if(domainPointingForward && !rangePointingForward){
                        shiftNeg = (d3.max(range) + linScale(0))/ratio;
                        // if the bottom is heavier we need to shift the entire chart
                        if(abs(domain[0])>abs(domain[domain.length-1])) shiftAll -= logScale( Math.max(eps,minAbsDomain) )/ratio;
                        
                    }else if(!domainPointingForward && !rangePointingForward){                        
                        shiftAll = logScale( Math.max(eps,minAbsDomain) ) / ratio;
                        //if the top is heavier we need to shift the entire chart
                        if(abs(domain[0])<abs(domain[domain.length-1])) shiftAll += ( d3.max(range)-logScale( Math.max(eps,minAbsDomain) ) )/ratio;
                        
                    } else if(domainPointingForward && rangePointingForward){
                        shiftAll = d3.max(range)/ratio;
                        // if the top is heavier we need to shift the entire chart
                        if(abs(domain[0])<abs(domain[domain.length-1])) shiftAll -= ( d3.max(range)-logScale( Math.max(eps,minAbsDomain) ) )/ratio;
                        
                    }else if(!domainPointingForward && rangePointingForward){
                        shiftNeg = (d3.max(range) + linScale(0))/ratio;
                        //if the top is heavier we need to shift the entire chart
                        if(abs(domain[0])<abs(domain[domain.length-1])) shiftAll -= logScale( Math.max(eps,minAbsDomain) )/ratio;
                    }
                    
                    
                }else if(d3.min(domain)<0 && d3.max(domain)<0){
                    shiftNeg = d3.max(range);
                }

                
                if (x > eps) return logScale(x)/ratio + shiftAll + shiftPos;
                if (x < -eps) return -logScale(-x)/ratio + shiftAll + shiftNeg ;
                if (0 <= x && x <= eps) return linScale(x)/ratio + shiftAll + shiftPos;
                if (-eps <= x && x < 0) return -linScale(-x)/ratio + shiftAll + shiftNeg ;
            }
            scale.eps = function (arg) {
                if (!arguments.length) return eps;
                eps = arg;
                scale.domain(domain);
                return scale;
            }
            scale.delta = function (arg) {
                if (!arguments.length) return delta;
                delta = arg;
                scale.range(range);
                return scale;
            }

            scale.domain = function (_arg) {
                if (!arguments.length) return domain;
                
                // this is an internal array, it will be modified. the input _arg should stay intact
                var arg = [];

                if(_arg.length!=2)console.warn("generic log scale is best for 2 values in domain, but it tries to support other cases too");
                
                switch (_arg.length){
                    // if no values are given, reset input to the default domain (do nothing)
                    case 0: arg = domain; break;
                    // use the given value as a center, get the domain /2 and *2 around it
                    case 1: arg = [_arg[0]/2, _arg[0]*2]; break;
                    // two is the standard case. just use these
                    case 2: arg = [_arg[0], _arg[1]]; break;
                    // use the edge values as domain, center as ±epsilon
                    case 3: arg = [_arg[0], _arg[2]]; eps = abs(_arg[1]); break;
                    // use the edge values as domain, center two values as ±epsilon
//                    case 4: arg = [_arg[0], _arg[3]]; 
//                        // if the domain is pointing forward
//                        if(_arg[0]<=_arg[3]){eNeg = -abs(_arg[1]); ePos = abs(_arg[2]);}
//                        // if the domain is pointing backward
//                        if(_arg[0]>=_arg[3]){eNeg = -abs(_arg[2]); ePos = abs(_arg[1]);}
//                         break;
                    // use the edge values as domain, the minimum of the rest be the epsilon
                    default: arg = [_arg[0], _arg[_arg.length-1]];
                        eps = d3.min(abs(_arg.filter(function(d, i){return i!=0 && i!=_arg.length-1})));
                        break;
                }

                //if the domain is just a single value
                if (arg[0]==arg[1]){arg[0] = arg[0]/2; arg[1] = arg[1]*2};


                //if the desired domain is one-seded
                if(oneside(arg) && d3.min(abs(arg)) >= eps) {

                    //if the desired domain is above +epsilon
                    if(arg[0]>0 && arg[1]>0){
                        //then fallback to a regular log scale. nothing special
                        logScale.domain(arg);
                    }else{
                        //otherwise it's all negative, we take absolute and swap the arguments
                        logScale.domain([-arg[1], -arg[0]]);
                    }

                    useLinear = false;

                //if the desired domain is one-sided and takes part of or falls within 0±epsilon
                } else if (oneside(arg) && d3.min(abs(arg)) < eps) {


                    //if the desired domain is all positive
                    if(arg[0]>0 && arg[1]>0){
                        //the domain is all positive

                        //check the direction of the domain
                        if(arg[0]<=arg[1]){
                            //if the domain is pointing forward
                            logScale.domain([eps,arg[1]]);
                            linScale.domain([0,eps]);
                        }else{
                            //if the domain is pointing backward
                            logScale.domain([arg[0],eps]);
                            linScale.domain([eps,0]);
                        }
                    }else{
                        //otherwise it's all negative, we take absolute and swap the arguments

                        //check the direction of the domain
                        if(arg[0]<=arg[1]){
                            //if the domain is pointing forward
                            logScale.domain([eps,-arg[0]]);
                            linScale.domain([0,eps]);
                        }else{
                            //if the domain is pointing backward
                            logScale.domain([-arg[1],eps]);
                            linScale.domain([eps,0]);
                        }
                    }

                    useLinear = true;

                // if the desired domain is two-sided and fully or partially covers 0±epsilon
                } else if (!oneside(arg)){

                    //check the direction of the domain
                    if(arg[0]<=arg[1]){
                        //if the domain is pointing forward
                        logScale.domain([eps,d3.max(abs(arg))]);
                        linScale.domain([0,eps]);
                    }else{
                        //if the domain is pointing backward
                        logScale.domain([d3.max(abs(arg)),eps]);
                        linScale.domain([eps,0]);
                    }

                    useLinear = true;
                }

//
//console.log("LOG scale domain:", logScale.domain());
//if(useLinear)console.log("LIN scale domain:", linScale.domain());
                domain = _arg;
                return scale;
            };





            scale.range = function (arg) {
                if (!arguments.length) return range;

                if(arg.length!=2)console.warn("generic log scale is best for 2 values in range, but it tries to support other cases too");
                switch (arg.length){
                    // reset input to the default range
                    case 0: arg = range; break;
                    // use the only value as a center, get the range ±100 around it
                    case 1: arg = [arg[0]-100, arg[0]+100]; break;
                    // two is the standard case. do nothing
                    case 2: arg = arg; break;
                    // use the edge values as range, center as delta
                    case 3: delta = arg[1]; arg = [arg[0], arg[2]]; break;
                    // use the edge values as range, the minimum of the rest be the delta
                    default: delta = d3.min(arg.filter(function(d, i){return i!=0 && i!=arg.length-1}));
                            arg = [arg[0], arg[arg.length-1]];
                            break;
                }

                if(!useLinear){
                    logScale.range(arg);
                }else{
                    if(arg[0] < arg[1]){
                        //range is pointing forward
                        
                        //check where domain is pointing
                        if(domain[0] < domain[domain.length-1]){
                            //domain is pointing forward
                            logScale.range([delta, arg[1]]);
                            linScale.range([0, delta]);
                        }else{
                            //domain is pointing backward
                            logScale.range([0, arg[1]-delta]);
                            linScale.range([arg[1]-delta, arg[1]]);
                        }
                    }else{
                        //range is pointing backward

                        //check where domain is pointing
                        if(domain[0] < domain[domain.length-1]){
                            //domain is pointing forward
                            logScale.range([arg[0]-delta, 0]);
                            linScale.range([arg[0], arg[0]-delta]);
                        }else{
                            //domain is pointing backward
                            logScale.range([arg[0], delta]);
                            linScale.range([delta, 0]);
                        }
                    }
                }

//
//console.log("LOG and LIN range:", logScale.range(), linScale.range());
                range = arg;
                return scale;
            };





            scale.copy = function () {
                return d3_scale_genericLog(d3.scale.log().domain([1, 10])).domain(domain).range(range).eps(eps).delta(delta);
            };

            return d3.rebind(scale, logScale, "invert", "base", "rangeRound", "interpolate", "clamp", "nice", "tickFormat", "ticks");
        }(d3.scale.log().domain([1, 10]));

    }

}).call(this);

(function() {

    "use strict";

    var root = this;

    if (!Vizabi._require('d3')) return;

    d3.svg.worldMap = function(){
        
        return function d3_world_map() {

//Antarctica is disabled
//<g id="ant"> \
//	<path id="east_antarctica" d="M388.52,622.99l3.83-5.11l14.89-7.66l2.55-5.529l6.381-1.28l5.96-7.66l5.96-0.43l1.279-5.96   l5.11-3.83l4.26,1.279l12.34-3.829l2.98,2.979l5.53,0.43l5.109-2.55l30.641-0.43l11.06,2.979l14.04-2.979l4.68,0.43l1.28-4.26h4.68   l6.38,6.81l11.921-7.659l13.189-3.83l4.68,2.979l0.431-5.96l6.81-0.85l7.23,3.399v3.4l18.3,7.66l5.109-0.431l2.131,2.551   l-5.96,6.81v4.68l5.529,2.98l1.28-2.98l25.11-9.79l18.3-1.699l3.83,2.13l14.47,2.13l3.4,1.28l4.68-2.551l6.81-0.43l6.381,4.68   l0.43,5.11l14.47-2.98l2.13,0.851l0.851,4.68l13.189,4.26l4.26-2.979l0.431,3.83l4.68,0.43l6.38,5.11l5.96-2.55l5.11,0.43h3.83   l2.55-0.43l0.43,6.81l8.511,5.11L388.52,622.99L388.52,622.99z"/> \
//	<path id="antarctic_peninsula" d="M260.01,622.99l13.62-3.83l0.85-3.83l14.471-3.4l8.51,2.13l18.72-7.659l-0.43-8.08l-5.53-8.511   l1.28-2.13l-2.13-5.529v-5.961h3.399l-2.13-4.26l15.32-13.189l-0.431,5.96l-2.979,0.85l-2.98,5.11l2.98,1.279l-2.98,4.261   l-3.399-0.851l-1.7,3.83l0.43,5.11l5.11-0.43l3.4,4.68l1.279,5.96l6.811,8.51l0.43,10.641l-2.55,1.279l2.13,5.53l-1.28,2.13   L260.01,622.99L260.01,622.99z"/> \
//	<path id="thurston" d="M250.22,615.33l5.11-0.85l2.13,1.699l-0.851,2.131l-0.43,2.55l-2.979,1.279l-2.131-2.55h-8.51v-1.7   l3.83-0.85L250.22,615.33L250.22,615.33z"/> \
//	<path id="alexander" d="M304.69,587.67l-4.26,0.85l2.55,4.681l2.98,1.28l-1.28,2.55v1.7l-8.09,2.13l0.85,2.55l3.4,1.28l3.83-2.98   l3.399,0.85l-2.13,3.4l1.28,0.85l3.83-1.699l2.979-5.53L304.69,587.67L304.69,587.67z"/> \
//	<path id="smyley" d="M295.75,606.82l-3.4,2.979l2.98,0.851l3.83,0.85l3.829-2.55l-3.829-0.851L295.75,606.82L295.75,606.82z"/> \
//	<path id="robert" d="M319.57,556.47l-2.489,0.5l-0.551,2.55l4.761-0.699L319.57,556.47L319.57,556.47z"/> \
//	<path id="king_george" d="M323.59,552.54l-2.99,0.57l0.57,2.31l3.64-0.13L323.59,552.54L323.59,552.54z"/> \
//	<path id="james_ross" d="M328.34,557.17l0.02,3.561l2.051,0.09l1.659-2.641L328.34,557.17L328.34,557.17z"/> \
//	<path id="elephant" d="M329.33,547.24l-2.16,0.85l-0.55,2.04l1.869,0.68l3.141-2.159L329.33,547.24L329.33,547.24z"/> \
//</g> \
            
            var world = ' \
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 950 620"> \
<g id="afr"> \
	<path id="algeria" d="M473.88,227.49l-4.08-1.37l-16.98,3.19l-3.7,2.81l2.261,11.67l-6.75,0.27l-4.061,6.53l-9.67,2.32l0.03,4.75   l31.85,24.35l5.43,0.46l18.11-14.15l-1.81-2.28l-3.4-0.46l-2.04-3.42v-14.15l-1.359-1.37l0.229-3.65l-3.62-3.65l-0.45-3.88   l1.58-1.14l-0.68-4.11L473.88,227.49L473.88,227.49z"/> \
	<path id="morocco" d="M448.289,232.28h-11.55l-2.26,5.02l-5.21,2.51l-4.3,11.64l-8.38,5.02l-11.771,19.39l11.55-0.23l0.45-5.7h2.94   v-7.76h10.189l0.23-10.04l9.74-2.28l4.08-6.62l6.34-0.23L448.289,232.28L448.289,232.28z"/> \
	<path id="mauretania" d="M404.9,276.66l2.18,2.85l-0.449,12.32l3.17-2.28l2.26-0.46l3.17,1.14l3.62,5.02l3.4-2.28l16.529-0.23   l-4.08-27.61l4.38-0.02l-8.159-6.25l0.01,4.06l-10.33,0.01l-0.05,7.75l-2.97-0.01l-0.381,5.72L404.9,276.66L404.9,276.66z"/> \
	<path id="senegal" d="M410.119,290.32l-3.939,2.86l-0.9,1.6l-0.279,1.6l1.449,1.04l4.84-0.07l3.11-0.84l0.351,1.53l-0.28,2.02   l2.97,1.46l0.62,0.7l3.94,0.14l0.14-1.74l-3.601-4.32l-4.01-5.43l-2.49-1.04L410.119,290.32L410.119,290.32z"/> \
	<path id="gambia" d="M406.89,298.34l-0.13,1.11l6.92-0.1l0.35-1.03l-0.149-1.04l-1.99,0.81L406.89,298.34L406.89,298.34z"/> \
	<path id="casamance" d="M406.789,300.22l1.24,3.01l0.69-1.86l8.41,0.88l-3.641-1.87L406.789,300.22L406.789,300.22z"/> \
	<path id="bissau" d="M408.6,304.53l1.4,2.77l3.93-3.38l0.04-1.04l-4.63-0.67L408.6,304.53L408.6,304.53z"/> \
	<path id="guinee" d="M410.42,307.94l3.04,4.68l3.96-3.44l4.06-0.18l3.38,4.49l2.87,1.89l1.08-2.1l0.96-0.54l-0.07-4.62l-1.91-5.48   l-5.859,0.65l-7.25-0.58l-0.04,1.86L410.42,307.94L410.42,307.94z"/> \
	<path id="sierra_leone" d="M413.93,313.13l5.649,5.46l4.03-4.89l-2.52-3.95l-3.471,0.35L413.93,313.13L413.93,313.13z"/> \
	<path id="liberia" d="M420.17,319.19l10.979,7.34l-0.26-5.561l-3.32-3.91l-3.24-2.869L420.17,319.19L420.17,319.19z"/> \
	<path id="ivoire" d="M432.07,326.75l4.28-3.03l5.32-0.93l5.43,1.17l-2.771-4.19l-0.81-2.56l0.81-7.57l-4.85,0.23l-2.2-2.101   l-4.62,0.12l-2.2,0.351l0.23,5.12l-1.16,0.47l-1.39,2.56l3.58,4.19L432.07,326.75L432.07,326.75z"/> \
	<path id="mali" d="M419.459,295.84l3.08-2.11l17.12-0.1l-3.96-27.54l4.521-0.13l21.87,16.69l2.939,0.42l-1.109,9.28l-13.75,1.25   l-10.61,7.92l-1.93,5.42l-7.37,0.31l-1.88-5.41l-5.65,0.4l0.22-1.77L419.459,295.84L419.459,295.84z"/> \
	<path id="burkina" d="M450.59,294.28l3.64-0.29l5.97,8.44l-5.54,4.18l-4.01-1.03l-5.39,0.07l-0.87,3.16l-4.521,0.221l-1.239-1.69   l1.6-5.14L450.59,294.28L450.59,294.28z"/> \
	<path id="niger" d="M460.89,302l2.55-0.06l2.3-3.45l3.86-0.69l4.109,2.51l8.771,0.25l6.78-2.76l2.55-2.19l0.189-2.88l4.73-4.77   l1.25-10.53l-3.11-6.52l-7.96-1.94l-18.42,14.36l-2.609-0.25l-1.12,9.97l-9.4,0.94L460.89,302L460.89,302z"/> \
	<path id="ghana" d="M444.34,317.05l1.119,2.63l2.921,4.58l1.62-0.06l4.42-2.51l-0.311-14.29l-3.42-1l-4.79,0.13L444.34,317.05   L444.34,317.05z"/> \
	<path id="togo" d="M455.22,321.25l2.68-1.57l-0.06-10.35l-1.74-2.82l-1.12,0.94L455.22,321.25L455.22,321.25z"/> \
	<path id="benin" d="M458.709,319.49h2.12l0.12-6.021l2.681-3.89l-0.12-6.77l-2.431-0.06l-4.17,3.26l1.74,3.32L458.709,319.49   L458.709,319.49z"/> \
	<path id="nigeria" d="M461.57,319.37l3.92,0.189l4.73,5.271l2.3,0.63l1.8-0.88l2.74-0.38l0.93-3.82l3.73-2.45l4.04-0.189   l7.399-13.61l-0.12-3.07l-3.42-2.63l-6.84,3.01l-9.149-0.13l-4.36-2.76l-3.11,0.69l-1.62,2.82l-0.119,7.959l-2.61,3.7   L461.57,319.37L461.57,319.37z"/> \
	<path id="tunisia" d="M474.909,227.33l5.53-2.23l1.82,1.18l0.069,1.44l-0.85,1.11l0.13,1.97l0.851,0.46v3.54l-0.98,1.64l0.13,1.05   l3.71,1.31l-2.99,4.65l-1.17-0.07l-0.2,3.74l-1.3,0.2l-1.109-0.98l0.26-3.8l-3.64-3.54l-0.46-3.08l1.76-1.38L474.909,227.33   L474.909,227.33z"/> \
	<path id="libya" d="M480.05,248.03l1.56-0.26l0.46-3.6h0.78l3.189-5.24l7.87,2.29l2.15,3.34l7.74,3.54l4.029-1.7l-0.39-1.7   l-1.76-1.7l0.2-1.18l2.859-2.42h5.66l2.15,2.88l4.55,0.66l0.59,36.89l-3.38-0.13l-20.42-10.62l-2.21,1.25l-8.391-2.1l-2.279-3.01   l-3.32-0.46l-1.69-3.01L480.05,248.03L480.05,248.03z"/> \
	<path id="egypt" d="M521.93,243.06l2.67,0.07l5.2,1.44l2.47,0.07l3.06-2.56h1.431l2.6,1.44h3.29l0.59-0.04l2.08,5.98l0.59,1.93   l0.55,2.89L545.48,255l-1.69-0.85l-1.949-6.36l-1.761-0.13l-0.13,2.16l1.17,3.74l9.37,11.6l0.2,4.98l-2.73,3.15L522.32,273   L521.93,243.06L521.93,243.06z"/> \
	<path id="chad" d="M492.789,296l0.131-2.95l4.739-4.61l1.271-11.32l-3.16-6.04l2.21-1.13l21.4,11.15l-0.13,10.94l-3.771,3.21v5.64   l2.47,4.78h-4.359l-7.221,7.14l-0.189,2.16l-5.33-0.069l-0.07,0.979l-3.04-0.399l-2.08-3.931l-1.56-0.77l0.2-1.2l1.96-1.5v-7.02   l-2.71-0.42l-3.271-2.43L492.789,296L492.789,296L492.789,296z"/> \
	<path id="sudan" d="M520.15,292.43l0.18-11.83l2.46,0.07l-0.279-6.57l25.8,0.23l3.69-3.72l7.96,12.73l-4.36,5.14v7.85l-6.86,14.75   l-2.359,1.04l0.75,4.11h2.939l3.99,5.79l-3.2,0.409l-0.82,1.49l-0.079,2.15l-9.601-0.17l-0.979-1.49l-6.71-0.38l-12.32-12.681   l1.229-0.739l0.33-2.98l-2.949-1.74l-2.69-5.31l0.15-4.94L520.15,292.43L520.15,292.43z"/> \
	<path id="cameroon" d="M477.82,324.28l3.22,2.96l-0.229,4.58l17.66-0.41l1.439-1.62l-5.06-5.45l-0.75-1.97l3.22-6.03l-2.189-4   l-1.841-0.99v-2.029l2.131-1.391l0.119-6.32l-1.689-0.19l-0.03,3.32l-7.42,13.85l-4.54,0.23l-3.109,2.14L477.82,324.28   L477.82,324.28z"/> \
	<path id="eritrea" d="M556.71,294.7l-0.25-5.89l3.96-4.62l1.069,0.82l1.95,6.52l9.36,6.97l-1.7,2.09l-6.85-5.89H556.71   L556.71,294.7z"/> \
	<path id="djibouti" d="M571.48,301.54l-0.57,3.36l3.96-0.06l0.061-4.94l-1.45-0.89L571.48,301.54L571.48,301.54z"/> \
	<path id="ethiopia" d="M549.49,311.76l7.28-16.2l7.23,0.04l6.409,5.57l-0.45,4.59h4.971l0.51,2.76l8.04,4.811l4.96,0.25   l-9.43,10.13l-12.95,3.99h-3.21l-5.72-4.88l-2.261-0.95l-4.38-6.45l-2.89,0.04l-0.34-2.96L549.49,311.76L549.49,311.76z"/> \
	<path id="somaliland" d="M575.74,305.04l4.08,2.78l1.21-0.061l10.13-3.48l1.15,3.71l-0.81,3.13l-2.19,1.74l-5.47-0.351l-7.83-4.81   L575.74,305.04L575.74,305.04z"/> \
	<path id="soqotra" d="M599.619,299.65l2.131,2.38l2.88-1.74l1.04-0.35l-1.32-1.28l-2.53,0.75L599.619,299.65L599.619,299.65z"/> \
	<path id="somalia" d="M591.97,304.05l4.37-1.68l1.55,0.93l-0.17,3.88l-4.03,11.48l-21.81,23.359l-2.53-1.739l-0.17-9.86l3.279-3.77   l6.961-2.15l10.21-10.78l2.67-2.38l0.75-3.479L591.97,304.05L591.97,304.05z"/> \
	<path id="centrafrique" d="M495.659,324.05l4.66,5.04l1.84-2.38l2.931,0.12l0.63-2.32l2.88-1.8l5.979,4.12l3.45-3.42L531.42,324   L519,311.18l1.67-1.04l0.229-2.26l-2.82-1.33h-4.14l-6.67,6.61l-0.23,2.72l-5.29-0.17l-0.17,1.16l-3.45-0.351l-3.109,5.91   L495.659,324.05L495.659,324.05z"/> \
	<path id="sao_tome" d="M470.74,337.15l1.15-0.58l0.86,0.699l-0.86,1.33l-1.04-0.409L470.74,337.15L470.74,337.15z"/> \
	<path id="principe" d="M473.05,333.5l1.729-0.29l0.58,1.1l-0.859,0.931l-0.86-0.12L473.05,333.5L473.05,333.5z"/> \
	<path id="bioko" d="M476.84,327.41l-0.46,1.97l1.38,0.75l1.319-0.99l-0.46-2.029L476.84,327.41L476.84,327.41z"/> \
	<path id="gabon" d="M486.39,332.63l-0.12,2.49l-5.64-0.12l-3.45,6.67l8.109,8.87l2.011-1.68l-0.061-1.74l-1.38-0.64v-1.221   l3.11-1.97l2.76,2.09l3.05,0.061l-0.06-10.49l-4.83-0.23l-0.061-2.2L486.39,332.63L486.39,332.63z"/> \
	<path id="equatorial_guinea" d="M480.99,332.69l-0.06,1.39l4.54,0.229l-0.061-1.569L480.99,332.69L480.99,332.69z"/> \
	<path id="congo" d="M491,332.52l-0.061,1.45l4.78,0.12l0.17,12.41l-4.37-0.12l-2.53-1.97l-1.96,1.1l-0.09,0.55l1.01,0.49l0.29,2.55   l-2.7,2.32l0.58,1.22l2.99-2.319h1.44l0.46,1.39l1.899,0.81l6.101-5.159l-0.12-3.771l1.27-3.07l3.91-2.899l1.05-9.811l-2.779,0.011   l-3.221,4.41L491,332.52L491,332.52z"/> \
	<path id="cabinda" d="M486.55,353.23l1.739,2.26l2.25-2.13l-0.659-2.21l-0.561-0.04L486.55,353.23L486.55,353.23z"/> \
	<path id="drc" d="M489.38,355.71l10.31-0.18l2.09,2.97l-0.08,2.19l0.771,0.699h5.12l1.47-2.89h2.09l0.851,0.86l2.869-0.08   l0.851,10.08l4.96,0.159v0.78l13.33,6.01l0.62,1.171h2.79l-0.311-4.221l-5.04-2.42l0.311-3.2l2.17-5.08l4.96-0.159l-4.26-14.141   l0.079-6.01l6.74-10.54l0.08-1.48l-1.01-0.55l0.04-2.859l-1.23-0.11l-1.239-1.58l-20.351-0.92l-3.729,3.63l-6.11-4.02l-2.15,1.319   l-1.56,13.13l-3.86,2.98l-1.159,2.64l0.21,3.91l-6.96,5.69l-1.851-0.84l0.25,1.09L489.38,355.71L489.38,355.71z"/> \
	<path id="rwanda" d="M537.82,339.9l2.811,2.59l-0.12,2.77l-4.36,0.09v-3.06L537.82,339.9L537.82,339.9z"/> \
	<path id="burundi" d="M536.21,346.21l4.27-0.09l-1.11,3.74l-1.08,0.939h-1.319l-0.94-2.53L536.21,346.21L536.21,346.21z"/> \
	<path id="uganda" d="M538.3,339.09l3.029,2.84l1.9-1.21l5.14-0.84l0.881,0.09l0.33-1.95l2.899-6.1l-2.439-5.08l-7.91,0.05   l-0.05,2.091l1.06,1.02l-0.16,2.09L538.3,339.09L538.3,339.09z"/> \
	<path id="kenya" d="M550.829,326.52l2.66,5.19l-3.189,6.69l-0.42,2.029l15.93,9.851l4.94-7.761l-2.5-2.029l-0.051-10.221l3.13-3.42   l-4.989,1.66l-3.771,0.05l-5.899-4.979l-1.86-0.8l-3.45,0.319l-0.609,1.021L550.829,326.52L550.829,326.52z"/> \
	<path id="tanzania" d="M550.57,371.42l17.47-2.14l-3.93-7.601l-0.21-7.279l1.271-3.48l-16.62-10.439l-5.21,0.859l-1.811,1.34   l-0.16,3.05l-1.17,4.23l-1.22,1.45l-1.75,0.16l3.35,11.609l5.471,2.57l3.77,0.11L550.57,371.42L550.57,371.42z"/> \
	<path id="zambia" d="M514.55,384.7l3.17,4.399l4.91,0.301l1.739,0.96l5.141,0.06l4.43-6.21l12.38-5.54l1.08-4.88l-1.44-6.99   l-6.46-3.68l-4.31,0.3l-2.15,4.76l0.061,2.17l5.08,2.471l0.3,5.37l-4.37,0.239l-1.08-1.81l-12.14-5.18l-0.36,3.979l-5.74,0.18   L514.55,384.7L514.55,384.7z"/> \
	<path id="angola" d="M488.619,356.71l3.41,12.73l-0.08,4.02l-4.989,5.36l-0.75,8.71l19.199,0.17l6.24,2.26l5.15-0.67l-3-3.76   l0.01-10.74l5.9-0.25v-4.19l-4.79-0.199l-0.96-9.921l-2.021,0.03l-1.09-0.979l-1.19,0.06l-1.579,3.061H502l-1.41-1.421l0.42-2.01   l-1.66-2.43L488.619,356.71L488.619,356.71z"/> \
	<path id="malawi" d="M547.159,379.4l3.11,3.25l-0.061,4.159l0.601,1.75l4.13-4.46l-0.48-5.67l-2.21-1.689l-1.97-9.95l-3.41-0.12   l1.551,7.17L547.159,379.4L547.159,379.4z"/> \
	<path id="mozambique" d="M541.17,413.28l2.689,2.229l6.34-3.859l1.021-5.73v-9.46l10.17-8.32l1.74,0.061l6.159-5.91l-0.96-12.18   L552,372.17l0.479,3.68l2.81,2.17l0.66,6.631l-5.5,5.369l-1.319-3.01l0.239-3.979l-3.17-3.44l-7.779,3.62l7.239,3.68l0.24,10.73   l-4.79,7.11L541.17,413.28L541.17,413.28z"/> \
	<path id="zimbabwe" d="M524.659,392.3l8.971,10.13l6.88,1.75l4.609-7.229l-0.359-9.58l-7.48-3.86l-2.81,1.271l-4.19,6.39l-5.8-0.06   L524.659,392.3L524.659,392.3z"/> \
	<path id="namibia" d="M496.55,421.96l3.35,0.24l1.97,1.99l4.67,0.06l1.141-13.26v-8.681l2.99-0.6l1.14-9.1l7.6-0.24l2.69-2.23   l-4.55-0.18l-6.16,0.84l-6.64-2.41h-18.66l0.479,5.3l6.22,9.16l-1.079,4.7l0.06,2.47L496.55,421.96L496.55,421.96z"/> \
	<path id="botswana" d="M508.51,411.23l2.149,0.659l-0.3,6.15l2.21,0.3l5.08-4.58l6.101,0.66l1.619-4.1l7.721-7.051l-9.271-10.67   l-0.12-1.75l-1.02-0.3l-2.811,2.59l-7.3,0.181l-1.02,9.1l-2.87,0.66L508.51,411.23L508.51,411.23z"/> \
	<path id="swaziland" d="M540.869,414l-2.51,0.42l-1.08,2.95l1.92,1.75h2.33l1.97-2.83L540.869,414L540.869,414z"/> \
	<path id="lesotho" d="M527.409,425.39l3.05-2.35l1.44,0.06l1.74,2.17l-0.181,2.171l-2.93,1.079v0.841l-3.229-0.181l-0.78-2.35   L527.409,425.39L527.409,425.39z"/> \
	<path id="south_africa" d="M534.159,403.63l-7.899,7.3l-1.88,4.511l-6.261-0.78l-5.21,4.63l-3.46-0.34l0.28-6.4l-1.23-0.43   l-0.859,13.09l-6.141-0.06l-1.85-2.181l-2.71-0.029l2.47,7.09l4.41,4.17l-3.149,3.67l2.039,4.6l4.721,1.801l3.76-3.2l10.77,0.06   l0.771-0.96l4.78-0.84l16.17-16.1l-0.061-5.07l-1.729,2.24h-2.59l-3.15-2.641l1.6-3.979l2.75-0.561l-0.25-8.18L534.159,403.63   L534.159,403.63z M530.369,422.13l1.511-0.06l2.449,2.66l-0.069,3.079l-2.87,1.45l-0.18,1.021l-4.381,0.05l-1.369-3.3l1.25-2.42   L530.369,422.13L530.369,422.13z"/> \
	<path id="mauritius" d="M613.01,398.99l-1.521,1.99l0.3,2.149l3.2-2.61L613.01,398.99L613.01,398.99z"/> \
	<path id="reunion" d="M607.38,402.37l-2.28,0.149l-0.15,1.99l1.521,0.311l2.28-1.07L607.38,402.37L607.38,402.37z"/> \
	<path id="madagascar" d="M592.3,372.92l-2.13,5.061l-3.65,6.439l-6.39,0.46l-2.74,3.22l0.46,9.82l-3.96,4.6l0.46,7.82l3.35,3.83   l3.96-0.46l3.96-2.92l-0.909-4.6l9.13-15.801l-1.83-1.989l1.83-3.83l1.979,0.609l0.61-1.529l-1.83-7.82l-1.07-3.22L592.3,372.92   L592.3,372.92z"/> \
	<path id="grande_comore" d="M577.69,371.23l0.46,1.529l1.98,0.311l0.76-1.99L577.69,371.23L577.69,371.23z"/> \
	<path id="mayotte" d="M580.579,374.3l0.761,1.69h1.22l0.61-2.15L580.579,374.3L580.579,374.3z"/> \
	<path id="aldabra" d="M602.35,358.34l-0.61,1.23l1.67,1.38l1.221-1.38L602.35,358.34L602.35,358.34z"/> \
	<path id="praslin" d="M610.88,349.14l-1.83,1.23l1.37,2.149h1.83L610.88,349.14L610.88,349.14z"/> \
	<path id="mahe" d="M611.64,354.51l-1.22,1.38l0.909,1.38L613,357.58l0.149-2.92L611.64,354.51L611.64,354.51z"/> \
	<path id="flores_1_" d="M372.64,217.02l-1.36,1.37l2.44,1.37l0.27-1.91L372.64,217.02L372.64,217.02z"/> \
	<path id="terceira" d="M379.97,216.2l-1.63,1.09l1.359,1.09l2.171-0.55L379.97,216.2L379.97,216.2z"/> \
	<path id="pico" d="M381.05,220.03l-0.811,2.19l1.08,1.37l1.36-1.09L381.05,220.03L381.05,220.03z"/> \
	<path id="sao_miguel" d="M387.56,224.4l-0.54,1.37l0.811,0.82l2.17-1.37L387.56,224.4L387.56,224.4z"/> \
	<path id="madeira" d="M408.18,236.42l-1.08,1.37l1.08,1.37l1.63-0.82L408.18,236.42L408.18,236.42z"/> \
	<path id="lanzarote" d="M415.619,253.73l-1.75,1.01l0.811,0.82L415.619,253.73L415.619,253.73z"/> \
	<path id="gran_canaria" d="M409.539,253.92l-2.17,0.55l1.08,1.64h1.63L409.539,253.92L409.539,253.92z"/> \
	<path id="tenerife" d="M404.38,252.28l-1.36,1.37l1.9,1.64l1.08-2.46L404.38,252.28L404.38,252.28z"/> \
	<path id="santo_antao" d="M387.56,290.54l-1.899,1.09l1.359,1.09l1.63-0.82L387.56,290.54L387.56,290.54z"/> \
	<path id="boa_vista" d="M392.23,292.74l-1.24,1.1l0.881,1.63l2.119-0.95L392.23,292.74L392.23,292.74z"/> \
	<path id="santiago" d="M389.52,295.83l-1.59,0.95l1.71,2.29l1.35-0.71L389.52,295.83L389.52,295.83z"/> \
</g> \
<g id="ame"> \
	<path id="mexico" d="M137.49,225.43l4.83,15.21l-2.25,1.26l0.25,3.02l4.25,3.27v6.05l5.25,5.04l-2.25-14.86l-3-9.83l0.75-6.8   l2.5,0.25l1,2.27l-1,5.79l13,25.44v9.07l10.5,12.34l11.5,5.29l4.75-2.77l6.75,5.54l4-4.03l-1.75-4.54l5.75-1.76l1.75,1.01   l1.75-1.76h2.75l5-8.82l-2.5-2.27l-9.75,2.27l-2.25,6.55l-5.75,1.01l-6.75-2.77l-3-9.57l2.271-12.07l-4.64-2.89l-2.211-11.59   l-1.85-0.79l-3.38,3.43l-3.88-2.07l-1.521-7.73l-15.37-1.61l-7.939-5.97L137.49,225.43L137.49,225.43z"/> \
	<path id="disko" d="M342.89,92.49l1.63,2.45l-0.819,2.99h-1.631l-2.18-2.45l0.54-1.9L342.89,92.49L342.89,92.49z"/> \
	<path id="st._lawrence_island_west" d="M69.17,53.35l3.46,6.47l2.22-0.5v-2.24L69.17,53.35L69.17,53.35z"/> \
	<path id="unalaska_west" d="M49.66,110.26l-0.17,3.01l2.159-0.5v-1.34L49.66,110.26L49.66,110.26z"/> \
	<path id="umnak_west" d="M46.34,111.6l-4.32,2.18l0.67,2.34l1.66-1.34l3.32-1.51L46.34,111.6L46.34,111.6z"/> \
	<path id="another_aleutian_west" d="M28.39,114.44l-2.99-0.67l-0.5,1.34l0.33,2.51L28.39,114.44L28.39,114.44z"/> \
	<path id="adak_west" d="M22.07,114.28l-2.829-1.17l-1,1.84l1.829,1.84L22.07,114.28L22.07,114.28z"/> \
	<path id="amchitka_west" d="M12.27,111.6l-1.33-1.84l-1.33,0.5v2.51l1.5,1L12.27,111.6L12.27,111.6z"/> \
	<path id="path13641" d="M10,248.7l-0.141,2.33l2.04,1.37l1.221-1.09L10,248.7L10,248.7z"/> \
	<path id="path13643" d="M15.29,252.13l-1.9,1.37l1.63,2.05l1.9-1.64L15.29,252.13L15.29,252.13z"/> \
	<path id="path13645" d="M19.1,255.41l-1.63,2.19l0.54,1.37l2.31-1.09L19.1,255.41L19.1,255.41z"/> \
	<path id="hawaii" d="M21.81,259.65l-0.95,5.47l0.95,2.05l3.12-0.96l1.63-2.74l-3.399-3.15L21.81,259.65L21.81,259.65z"/> \
	<path id="raiatea" d="M27.25,402.68l-1.9-0.14l-0.14,1.78l1.49,0.96l1.77-1.09L27.25,402.68L27.25,402.68z"/> \
	<path id="tahiti" d="M33.77,404.6l-2.72,1.78l2.04,2.46l1.77-0.41l0.95-1.229L33.77,404.6L33.77,404.6z"/> \
	<path id="guadeloupe" d="M276.6,283.37l-1.5,0.62l0.53,1.33l1.76-1.15l-0.35-0.36L276.6,283.37L276.6,283.37z"/> \
	<path id="dominica" d="M279.07,284.88l-0.88,1.87l1.061,1.42l1.319-1.15L279.07,284.88L279.07,284.88z"/> \
	<path id="martinique" d="M282.07,290.03l-1.06,0.98l0.79,1.6l1.5-0.44L282.07,290.03L282.07,290.03z"/> \
	<path id="st._lucia" d="M281.98,294.03l-0.71,1.51l1.15,1.24l1.5-0.8L281.98,294.03L281.98,294.03z"/> \
	<path id="st._vincent" d="M282.07,297.85l-1.229,0.89l0.97,1.78l1.59-0.89L282.07,297.85L282.07,297.85z"/> \
	<path id="grenada" d="M280.57,301.31l-1.149,1.15l0.439,0.71h1.41l0.44-1.16L280.57,301.31L280.57,301.31z"/> \
	<path id="trinidad" d="M282.24,304.78l-1.06,0.98l-1.15,0.18v1.42l2.12,1.949l0.88-1.42l0.53-1.6l-0.18-1.33L282.24,304.78   L282.24,304.78z"/> \
	<path id="puerto_rico" d="M271.05,281.06l-2.64-0.89l-2.12,1.33l1.06,1.24l3.61,0.53L271.05,281.06L271.05,281.06z"/> \
	<path id="haiti-dominican_border" d="M250.87,275.38l-1.67,1.71l1.909,0.78l0.28,2.39l-4.229,0.37l0.43,2.3l1.229,0.09l0.71-1.06   l4.94,0.16l0.89,1.71l1.141-1.34l3.33-0.9l2.93,0.62l0.34-1.77l-5.28-3.45l-3.42-1.28L250.87,275.38L250.87,275.38z"/> \
	<path id="domincan_republic" d="M263.11,280.44l-5.29-3.46l-2.5-0.85l-0.84,6l0.88,1.69l1.15-1.33l3.35-0.89l2.91,0.62   L263.11,280.44L263.11,280.44z"/> \
	<path id="haiti" d="M250.86,275.38l3.44,0.36l-0.41,4.22l-0.34,2.22l-4.01-0.22l-0.71,1.07l-1.23-0.09l-0.439-2.31l4.229-0.35   l-0.26-2.4l-1.94-0.8L250.86,275.38L250.86,275.38z"/> \
	<path id="falklands_west" d="M307.95,508.18l-2.631-0.29l-2.619,1.761l1.899,2.06L307.95,508.18L307.95,508.18z"/> \
	<path id="falklands_east" d="M310.57,506.86l-0.869,2.79l-2.48,2.199l0.15,0.73l4.229-1.62l1.75-2.2L310.57,506.86L310.57,506.86z"/> \
	<path id="cuba" d="M220.85,266.92v1.27l5.32,0.1l2.51-1.46l0.39,1.07l5.221,1.27l4.64,4.19l-1.06,1.46l0.189,1.66l3.87,0.97   l3.87-1.75l1.74-1.75l-2.511-1.27l-12.949-7.6l-4.54-0.49L220.85,266.92L220.85,266.92z"/> \
	<path id="bimini" d="M239.61,259.13l-1.26-0.39l-0.1,2.43l1.55,1.56l1.06-1.56L239.61,259.13L239.61,259.13z"/> \
	<path id="andros" d="M242.12,262.93l-1.74,0.97l1.64,2.34l0.87-1.17L242.12,262.93L242.12,262.93z"/> \
	<path id="inagua" d="M247.73,264.68l-1.84-0.1l0.19,1.17l1.35,1.95l1.16-1.27L247.73,264.68L247.73,264.68z"/> \
	<path id="eleuthera" d="M246.86,262.35l-3-1.27l-0.58-3.02l1.16-0.49l1.16,2.34l1.16,0.88L246.86,262.35L246.86,262.35z"/> \
	<path id="grand_bahama" d="M243.96,256.21l-1.55-0.39l-0.29-1.95l-1.641-0.58l1.061-1.07l1.93,0.68l1.45,0.88L243.96,256.21   L243.96,256.21z"/> \
	<path id="jamaica" d="M238.93,279.59l-3.479,0.88v0.97l2.029,1.17h2.13l1.351-1.56L238.93,279.59L238.93,279.59z"/> \
	<path id="alaska_1_" d="M93.11,44.89l-8.39,1.99l1.73,9.45l9.13,2.49l0.489,1.99L82.5,65.04l-7.65,12.68l2.71,13.43L82,94.13   l3.46-3.23l0.99,1.99l-4.2,4.97l-16.29,7.46l-10.37,2.49l-0.25,3.73l23.939-6.96l9.87-2.74l9.13-11.19l10.12-6.71l-5.18,8.7   l5.68,0.75l9.63-4.23l1.73,6.96l6.66,1.49l6.91,6.71l0.489,4.97l-0.989,1.24l1.229,4.72h1.73l0.25-7.96h1.97l0.49,19.64l4.939-4.23   l-3.46-20.39h-5.18l-5.68-7.21l27.89-47.25l-27.64-21.63L99.02,32.19l-1.229,9.45l6.66,3.98l-2.471,6.47L93.11,44.89L93.11,44.89z"/> \
	<path id="galapagos" d="M194.97,338.18l-0.62,2.75l-1.149,1.16l0.789,1.42l2.03-0.8l0.97-1.69l-0.619-1.779L194.97,338.18   L194.97,338.18z"/> \
	<path id="banks" d="M203.73,35.89l0.221,4.02l-7.98,8.27l2,6.7l5.76-1.56l3.33-4.92l8.42-3.13l6.87-0.45l-5.32-5.81l-2.659,2.01   l-2-0.67l-1.11-2.46l-2.44-2.46L203.73,35.89L203.73,35.89z"/> \
	<path id="prince_patrick" d="M214.15,24.05l-1.77,3.13l8.649,3.13l3.101-4.69l1.33,3.13h2.22l4.21-4.69l-5.1-1.34l-2-1.56   l-2.66,2.68L214.15,24.05L214.15,24.05z"/> \
	<path id="eglinton" d="M229.23,30.31l-6.87,2.9v2.23l8.87,3.35l-2,2.23l1.33,2.9l5.54-2.46h4.66l2.22,3.57l3.771-3.8l-0.891-3.58   l-3.1,1.12l-0.44-4.47l1.551-2.68h-1.551l-2.439,1.56l-1.11,0.89l0.67,3.13l-1.77,1.34l-2.66-0.22l-0.67-4.02L229.23,30.31   L229.23,30.31z"/> \
	<path id="mackenzie_king" d="M238.32,23.38l-0.67,2.23l4.21,2.01l3.101-1.79l-0.22-1.34L238.32,23.38L238.32,23.38z"/> \
	<path id="king_christian" d="M241.64,19.58l-3.1,1.12l0.22,1.56l6.87-0.45l-0.22-1.56L241.64,19.58L241.64,19.58z"/> \
	<path id="ellef_ringnes" d="M256.5,23.38l-0.44,1.56l-1.109,1.56v2.23l4.21-0.67l4.43,3.8h1.55v-3.8l-4.43-4.92L256.5,23.38   L256.5,23.38z"/> \
	<path id="amund_ringnes" d="M267.81,27.85l1.771,2.01l-1.551,2.68l1.11,2.9l4.88-2.68v-2.01l-2.88-3.35L267.81,27.85L267.81,27.85z   "/> \
	<path id="axel_heiberg" d="M274.24,22.71l0.221,3.57h5.99l1.55,1.34l-0.221,1.56l-5.319,0.67l3.77,5.14l5.101,0.89l7.09-3.13   l-10.2-15.42l-3.1,2.01l0.22,2.68l-3.55-1.34L274.24,22.71L274.24,22.71z"/> \
	<path id="victoria" d="M222.58,47.96l-8.42,2.23l-4.881,4.25l0.44,4.69l8.87,2.68l-2,4.47l-6.43-4.021l-1.771,3.35l4.21,2.9   l-0.22,4.69l6.43,1.79l7.76-0.45l1.33-2.46l5.761,6.48l3.989-1.34l0.67-4.47l2.881,2.01l0.439-4.47l-3.55-2.23l0.22-14.07   l-3.1-2.46L231.89,56L222.58,47.96L222.58,47.96z"/> \
	<path id="prince_of_wales" d="M249.63,57.79l-2.88-1.34l-1.55,2.01l3.1,4.92l0.22,4.69l6.65-4.02v-5.81l2.439-2.46l-2.439-1.79   h-3.99L249.63,57.79L249.63,57.79z"/> \
	<path id="prescott" d="M263.82,55.78l-4.659,3.8l1.109,4.69h2.88l1.33-2.46l2,2.01l2-0.22l5.32-4.47L263.82,55.78L263.82,55.78z"/> \
	<path id="cornwallis" d="M263.37,48.4l-1.11,2.23l4.88,1.79l1.33-2.01L263.37,48.4L263.37,48.4z"/> \
	<path id="bathurst" d="M260.49,39.91l-4.88,0.67l-2.88,2.68l5.32,0.22l-1.55,4.02l1.109,1.79l1.551-0.22l3.77-6.03L260.49,39.91   L260.49,39.91z"/> \
	<path id="devon" d="M268.92,38.35l-2.66,0.89l0.44,3.57l4.43,2.9l0.22,2.23l-1.33,1.34l0.67,4.47l17.07,5.58l4.66,1.56l4.66-4.02   l-5.54-4.47l-5.101,1.34l-7.09-0.67l-2.66-2.68l-0.67-7.37l-4.43-2.23L268.92,38.35L268.92,38.35z"/> \
	<path id="baffin" d="M282.88,61.59L278,61.14l-5.761,2.23l-3.1,4.24l0.89,11.62l9.53,0.45l9.09,4.47l6.431,7.37l4.88-0.22   l-1.33,6.92l-4.43,7.37l-4.881,2.23l-3.55-0.67l-1.77-1.56l-2.66,3.57l1.11,3.57l3.77,0.22l4.66-2.23l3.99,10.28l9.979,6.48   l6.87-8.71l-5.76-9.38l3.33-3.8l4.659,7.82l8.421-7.37l-1.551-3.35l-5.76,1.79l-3.99-10.95l3.771-6.25l-7.54-8.04l-4.21,2.9   l-3.99-8.71l-8.42,1.12l-2.22-10.5l-6.87,4.69l-0.67,5.81h-3.771l0.44-5.14L282.88,61.59L282.88,61.59z"/> \
	<path id="bylot" d="M292.86,65.61l-1.77,1.79l1.55,2.46l7.32,0.89l-4.66-4.92L292.86,65.61L292.86,65.61z"/> \
	<path id="ellesmere" d="M285.77,40.36v2.01l-4.88,1.12l1.33,2.229l5.54,2.23l6.21,0.67l4.43,3.13l4.431-2.46l-3.101-3.13h3.99   l2.44-2.68l5.989-0.89v-1.34l-3.33-2.23l0.44-2.46l9.31,1.56l13.75-5.36l-5.1-1.56l1.33-1.79h10.64l1.771-1.79l-21.511-7.6   l-5.1-1.79l-5.54,4.02l-6.21-5.14l-3.33-0.22l-0.67,4.25l-4.21-3.8l-4.88,1.56l0.89,2.46l7.32,1.56l-0.44,3.57l3.99,2.46l9.76-2.46   l0.221,3.35l-7.98,3.8l-4.88-3.8l-4.43,0.45l4.43,6.26l-2.22,1.12l-3.33-2.9l-2.44,1.56l2.221,4.24h3.77l-0.89,4.02l-3.101-0.45   l-3.99-4.25L285.77,40.36L285.77,40.36z"/> \
	<path id="southhampton" d="M266.01,101.85l-4.23,5.32l-0.26,5.86l3.7-2.13h4.49l3.17,2.93l2.91-2.4L266.01,101.85L266.01,101.85z"/> \
	<path id="newfoundland" d="M317.52,171.05l-10.569,10.12l1.06,2.4l12.939,4.79l1.851-3.19l-1.061-5.32l-4.229,0.53l-2.38-2.66   l3.96-3.99L317.52,171.05L317.52,171.05z"/> \
	<path id="canada" d="M158.22,48.66l1.99,3.01l1,4.02l4.979,1.25l3.49-3.76l2.99,1.51l8.47,0.75l5.98-2.51l1,8.28h3.489V57.7   l3.49,0.25l8.72,10.29l5.73,3.51l-2.99,4.77l1.25,1.25L219,80.03l0.25,5.02l2.989,0.5l0.75-7.53l4.73-1.25l3.49,5.27l7.47,3.51   l3.74,0.75l2.49-3.01l0.25-4.77l4.479-2.76l1.49,4.02l-3.99,7.03l0.5,3.51l2.24-3.51l4.479-4.02l0.25-5.27l-2.489-4.02l0.75-3.26   l5.979-3.01l2.74,2.01l0.5,17.57l4.229-3.76l2.49,1.51l-3.49,6.02l4.48,1l6.479-10.04l5.48,5.77l-2.24,10.29l-5.479,3.01   l-5.23-2.51l-9.46,2.01l1,3.26l-2.49,4.02l-7.72,1.76l-8.72,6.78l-7.72,10.29l-1,3.26l5.229,2.01l1.99,5.02l7.22,7.28l11.46,5.02   l-2.49,11.54l-0.25,3.26l2.99,2.01l3.99-5.27l0.5-10.04l6.229-0.25l2.99-5.77l0.5-8.78l7.97-15.56l9.961,3.51l5.229,7.28   l-2.24,7.28l3.99,2.26l9.71-6.53l2.74,17.82l8.97,10.79l0.25,5.52l-9.96,2.51l-4.729,5.02l-9.96-2.26l-4.98-0.25l-8.72,6.78   l5.229-1.25l6.48-1.25l1.25,1.51l-1.74,5.52l0.25,5.02l2.99,2.01l2.99-0.75l1.5-2.26h1.989l-3.239,6.02l-6.23,0.25l-2.74,4.02   h-3.49l-1-3.01l4.98-5.02l-5.98,2.01l-0.27-8.53l-1.72-1l-5.23,2.26l-0.5,4.27h-11.96l-10.21,7.03l-13.7,4.52l-1.489-2.01   l6.899-10.3l-3.92-3.771l-2.49-4.78l-5.069-3.87l-5.44-0.45l-9.75-6.83l-70.71-11.62l-1.17-4.79l-6.48-6.02v-5.02l1-4.52l-0.5-2.51   l-2.489-2.51l-0.5-4.02l6.479-4.521l-3.99-21.58l-5.479-0.25l-4.98-6.53L158.22,48.66L158.22,48.66z"/> \
	<path id="usa" d="M148.76,158.34l-1,4.02l-3.49-2.26h-1.74l-1,4.27l-12.21,27.36l3.24,23.84l3.99,2.01l0.75,6.53h8.22l7.97,6.02   l15.69,1.51l1.74,8.03l2.49,1.76l3.489-3.51l2.74,1.25l2.49,11.54l4.229,2.76l3.49-6.53l10.71-7.78l6.97,3.26l5.98,0.5l0.25-3.76   l12.45,0.25l2.49,2.76l0.5,6.27l-1.49,3.51l1.74,6.02h3.739l3.74-5.77l-1.49-2.76l-1.489-6.02l2.239-6.78l10.21-8.78l7.721-2.26   l-1-7.28l10.71-11.55l10.71-1.76L272.8,199l10.46-6.02v-8.03l-1-0.5l-3.74,1.25l-0.5,4.92l-12.43,0.15l-9.74,6.47l-15.29,5   l-2.439-2.99l6.939-10.5l-3.43-3.27l-2.33-4.44l-4.83-3.88l-5.25-0.44l-9.92-6.77L148.76,158.34L148.76,158.34z"/> \
	<path id="haida_gwaii" d="M133.83,128.41l-1.7,3.26l0.59,2.31l1.11,0.69l-0.261,0.94l-1.189,0.34l0.34,3.43l1.28,1.29l1.02-1.11   l-1.28-3.34l0.761-2.66l1.87-2.49l-1.36-2.31L133.83,128.41L133.83,128.41z"/> \
	<path id="vancouver" d="M139.45,147.95l-1.53,0.6l2.81,3.26l0.681,3.86l2.81,3l2.38-0.43v-3.94l-2.89-1.8L139.45,147.95   L139.45,147.95z"/> \
	<path id="guatemala" d="M194.88,291.52l5.93,4.34l5.98-7.43l-1.021-1.54l-2.04-0.07v-4.35l-1.529-0.93l-4.631,1.38l1.771,4.08   L194.88,291.52L194.88,291.52z"/> \
	<path id="honduras" d="M207.55,288.78l9.24-0.35l2.739,3.26l-1.71-0.39l-3.29,0.14l-4.3,4.04l-1.84,4.09l-1.21-0.64l-0.01-4.48   l-2.66-1.78L207.55,288.78L207.55,288.78z"/> \
	<path id="el_salvador" d="M201.65,296.27l4.7,2.34l-0.07-3.71l-2.409-1.47L201.65,296.27L201.65,296.27z"/> \
	<path id="nicaragua" d="M217.74,292.11l2.19,0.44l0.07,4.49l-2.55,7.28l-6.87-0.68l-1.53-3.51l2.04-4.26l3.87-3.6L217.74,292.11   L217.74,292.11z"/> \
	<path id="costa_rica" d="M217.38,304.98l1.39,2.72l1.13,1.5l-1.52,4.51l-2.9-2.04l-4.74-4.34v-2.87L217.38,304.98L217.38,304.98z"/> \
	<path id="panama" d="M220.59,309.61l-1.46,4.56l4.82,1.25l2.989,0.59l0.511-3.529l3.21-1.62l2.85,1.47l1.12,1.79l1.359-0.16   l1.07-3.25l-3.56-1.47l-2.7-1.471l-2.7,1.841l-3.21,1.62l-3.28-1.32L220.59,309.61L220.59,309.61z"/> \
	<path id="colombia" d="M253.73,299.78l-2.06-0.21l-13.62,11.23l-1.44,3.95l-1.859,0.21l0.83,8.73l-4.75,11.649l5.159,4.37   l6.61,0.42l4.54,6.66l6.6,0.21l-0.21,4.99H256l2.68-9.15l-2.479-3.12l0.619-5.819l5.16-0.42l-0.62-13.521l-11.56-3.74l-2.68-7.279   L253.73,299.78L253.73,299.78z"/> \
	<path id="venezuela" d="M250.46,305.92l0.439,2.59l3.25,1.03l0.74-4.77l3.43-3.55l3.431,4.02l7.89,2.149l6.68-1.399l4.551,5.609   l3.43,2.15l-3.76,5.73l1.26,4.34l-2.15,2.66l-2.229,1.869l-4.83-2.43l-1.11,1.12v3.46l3.53,1.68l-2.6,2.811l-2.601,2.81l-3.43-0.28   l-3.45-3.789L262.2,319.47l-11.78-4.02l-2.141-6.271L250.46,305.92L250.46,305.92z"/> \
	<path id="guyana" d="M285.05,314.13l7.22,6.54l-2.87,3.32l-0.229,1.97l3.77,3.89l-0.09,3.74l-6.56,2.5l-3.931-5.31l0.841-6.38   l-1.681-4.75L285.05,314.13L285.05,314.13z"/> \
	<path id="suriname" d="M293.13,321.14l2.04,1.87l3.16-1.96l2.88,0.09l-0.37,1.12l-1.21,2.521l-0.19,6.27l-5.75,2.34l0.28-4.02   l-3.71-3.46l0.19-1.78L293.13,321.14L293.13,321.14z"/> \
	<path id="guyane" d="M302.13,321.8l5.85,3.65l-3.06,6.08l-1.11,1.399l-3.25-1.87l0.09-6.55L302.13,321.8L302.13,321.8z"/> \
	<path id="ecuador" d="M230.2,335.85l-4.73,2.94l-0.34,4.36l-0.95,1.43l2.98,2.86l-1.29,1.409l0.3,3.601l5.33,1.27l8.069-9.55   l-0.02-3.33l-3.87-0.25L230.2,335.85L230.2,335.85z"/> \
	<path id="peru" d="M225.03,349.52l-1.939,1.961l0.13,3.13l16.94,30.88l17.59,11.34l2.72-4.561l0.65-10.029l-1.42-6.25l-4.79-8.08   l-2.851,0.91l-1.29,1.43l-5.689-6.52l1.42-7.69l6.6-4.3l-0.52-4.04l-6.721-0.26l-3.489-5.86l-1.94-0.65l0.13,3.521l-8.66,10.29   l-6.47-1.561L225.03,349.52L225.03,349.52z"/> \
	<path id="bolivia" d="M258.71,372.79l8.229-3.59l2.721,0.26l1.81,7.56l12.54,4.171l2.07,6.39l5.17,0.65l2.2,5.47l-1.551,4.95   l-8.409,0.649l-3.101,7.95l-6.6-0.13l-2.07-0.39l-3.81,3.699l-1.881-0.18l-6.47-14.99l1.79-2.68l0.63-10.6l-1.6-6.311   L258.71,372.79L258.71,372.79z"/> \
	<path id="paraguay" d="M291.76,399.51l2.2,2.4l-0.26,5.08l6.34-0.391l4.79,6.131l-0.391,5.47l-3.1,4.689L295,423.15l-0.261-2.61   l1.811-4.3l-6.21-3.91h-5.17l-3.88-4.17l2.819-8.061L291.76,399.51L291.76,399.51z"/> \
	<path id="uruguay" d="M300.36,431.93l-2.05,2.19l0.851,11.78l6.439,1.869l8.19-8.21L300.36,431.93L300.36,431.93z"/> \
	<path id="argentina" d="M305.47,418.2l1.94,1.819l-7.37,10.95l-2.59,2.87l0.899,12.51l5.69,6.91l-4.78,8.34l-3.62,1.561h-4.14   l1.16,6.51l-6.471,2.22l1.55,5.471l-3.88,12.38l4.79,3.91l-2.59,6.38l-4.399,6.91l2.329,4.819l-5.689,0.91l-4.66-5.729   l-0.78-17.851l-7.239-30.32l2.189-10.6l-4.66-13.55l3.101-17.59l2.85-3.391l-0.7-2.569l3.66-3.34l8.16,0.56l4.56,4.87l5.271,0.09   l5.4,3.3l-1.591,3.72l0.38,3.761l7.65-0.36L305.47,418.2L305.47,418.2z"/> \
	<path id="tierra_del_fuego_chile" d="M285.04,514.1l-4.271,9.381l7.37,0.779l0.13-6.25L285.04,514.1L285.04,514.1z"/> \
	<path id="tierra_del_fuego_argentina" d="M288.92,518.79l0.26,5.729l4.4-0.39l3.75-2.479l-6.34-1.301L288.92,518.79L288.92,518.79z   "/> \
	<path id="chile" d="M283.59,512.63l-3.21,3.55l-0.391,4.17l-6.21-3.52l-6.6-9.51l-1.94-3.391l2.721-3.52l-0.26-4.431l-3.101-1.3   l-2.46-1.819l0.521-2.48l3.229-0.91l0.65-14.33l-5.04-2.87l-3.29-74.59l0.85-1.479l6.44,14.85l2.06,0.04l0.67,2.37l-2.74,3.32   l-3.149,17.87l4.479,13.76l-2.069,10.42l7.3,30.64l0.77,17.92l5.23,6.051L283.59,512.63L283.59,512.63z"/> \
	<path id="chiloe" d="M262.28,475.14l-1.29,1.95l0.65,3.391l1.29,0.13l0.65-4.3L262.28,475.14L262.28,475.14z"/> \
	<path id="brazil" d="M314.24,438.85l6.25-12.02l0.23-10.1l11.66-7.521h6.53l5.13-8.69l0.93-16.68l-2.1-4.46l12.359-11.28   l0.47-12.449l-16.789-8.221l-20.28-6.34l-9.561-0.939l2.57-5.4l-0.7-8.22l-2.09-0.69l-3.09,6.141l-1.62,2.029l-4.16-1.84   l-13.99,4.93l-4.659-5.869l0.75-6.131l-4.4,4.48l-4.86-2.62l-0.489,0.69l0.01,2.13l4.189,2.25l-6.289,6.63l-3.971-0.04l-4.02-4.09   l-4.55,0.14l-0.561,4.86l2.61,3.17l-3.08,9.87l-3.601,0.279l-5.729,3.62l-1.4,7.11l4.971,5.32l0.909-1.03l3.49-0.94l2.98,5.021   l8.529-3.66l3.311,0.19l2.28,8.069l12.17,3.86l2.1,6.439l5.18,0.62l2.471,6.15l-1.67,5.47l2.18,2.86l-0.32,4.26l5.84-0.55   l5.351,6.76l-0.42,4.75l3.17,2.68l-7.601,11.511L314.24,438.85L314.24,438.85z"/> \
	<path id="belize" d="M204.56,282.4l-0.05,3.65h0.84l2.86-5.34h-1.94L204.56,282.4L204.56,282.4z"/> \
</g> \
<g id="asi"> \
	<path id="kalimantan" d="M781.68,324.4l-2.311,8.68l-12.529,4.229l-3.75-4.399l-1.82,0.5l3.4,13.12l5.09,0.569l6.79,2.57v2.57   l3.109-0.57l4.53-6.27v-5.131l2.55-5.13l2.83,0.57l-3.399-7.13l-0.521-4.59L781.68,324.4L781.68,324.4z"/> \
	<path id="papua_new_guinea" d="M852.76,348.29l-0.37,24.44l3.52-0.19l4.63-5.41l3.891,0.19l2.5,2.239l0.83,6.9l7.96,4.2l2.04-0.75   v-2.521l-6.391-5.319l-3.149-7.28l2.5-1.21l-1.851-4.01l-3.699-0.09l-0.931-4.29l-9.81-6.62L852.76,348.29L852.76,348.29z"/> \
	<path id="australia" d="M761.17,427.98l-0.351,25.38l-3.899,2.859l-0.351,2.5l5.32,3.57l13.13-2.5h6.74l2.479-3.58l14.9-2.86   l10.64,3.221l-0.71,4.29l1.42,4.29l8.16-1.431l0.35,2.141l-5.319,3.93l1.77,1.43l3.9-1.43l-1.061,11.8l7.45,5.721L830,485.88   l2.13,2.141l12.42-1.79l11.71-18.95l4.26-1.07l8.51-15.729l2.13-13.58l-5.319-6.79l2.13-1.431l-4.261-13.229l-4.609-3.22   l0.71-17.87l-4.26-3.221l-1.061-10.01h-2.13l-7.1,23.59l-3.9,0.36l-8.87-8.94l4.97-13.229l-9.22-1.79l-10.29,2.86l-2.84,8.22   l-4.609,1.069l-0.351-5.72l-18.8,11.44l0.35,4.29l-2.84,3.93h-7.1l-15.26,6.43L761.17,427.98L761.17,427.98z"/> \
	<path id="tasmania" d="M825.74,496.26l-1.77,7.15l0.35,5l5.32-0.36l6.03-9.29L825.74,496.26L825.74,496.26z"/> \
	<path id="new_zealand_north_island" d="M913.02,481.96l1.061,11.8l-1.421,5.36l-5.319,3.93l0.35,4.65v5l1.42,1.79l14.55-12.511   v-2.859h-3.55l-4.97-16.8L913.02,481.96L913.02,481.96z"/> \
	<path id="new_zealand_south_island" d="M902.38,507.7l2.84,5.359l-7.811,7.511l-0.71,3.93l-5.319,0.71l-8.87,8.22l-8.16-3.93   l-0.71-2.86l14.899-6.43L902.38,507.7L902.38,507.7z"/> \
	<path id="new_caledonia" d="M906.64,420.47l-0.351,1.79l4.61,6.431l2.48,1.069l0.35-2.5L906.64,420.47L906.64,420.47z"/> \
	<path id="sumatra" d="M722.48,317.57l-0.28,2.279l6.79,11.41h1.98l14.149,23.67l5.66,0.57l2.83-8.27l-4.53-2.851l-0.85-4.56   L722.48,317.57L722.48,317.57z"/> \
	<path id="east_malaysia" d="M764.14,332.92l3.02,3.49l11.58-4.01l2.29-8.841l5.16-0.369l4.72-3.421l-6.12-4.46l-1.399-2.449   l-3.021,5.569l1.11,3.2l-1.84,2.67l-3.47-0.89l-8.41,6.17l0.22,3.57L764.14,332.92L764.14,332.92z"/> \
	<path id="brunei" d="M779.77,319.25l-2.88,3.49l2.36,0.74l1.329-1.86L779.77,319.25L779.77,319.25z"/> \
	<path id="sulawesi" d="M789.53,349.11l2.26,2.77l-1.47,4.16v0.79h3.34l1.181-10.4l1.08,0.301l1.96,9.5l1.87,0.5l1.77-4.061   l-1.77-6.14l-1.471-2.67l4.62-3.37l-1.08-1.49l-4.42,2.87h-1.18l-2.16-3.17l0.69-1.391l3.64-1.779l5.5,1.68l1.67-0.1l4.13-3.86   l-1.67-1.68l-3.83,2.97h-2.46L798,332.76l-2.65,0.101l-2.95,4.75l-1.87,8.22L789.53,349.11L789.53,349.11z"/> \
	<path id="maluku" d="M814.19,330.5l-1.87,4.55l2.95,3.86h0.98l1.279-2.57l0.69-0.89l-1.28-1.391l-1.87-0.689L814.19,330.5   L814.19,330.5z"/> \
	<path id="seram" d="M819.99,345.45l-4.03,0.89l-1.18,1.29l0.98,1.68l2.649-0.989l1.67-0.99l2.46,1.98l1.08-0.891l-1.96-2.38   L819.99,345.45L819.99,345.45z"/> \
	<path id="java" d="M753.17,358.32l-2.75,1.88l0.59,1.58l8.75,1.979l4.42,0.79l1.87,1.98l5.01,0.399l2.36,1.98l2.159-0.5l1.971-1.78   l-3.641-1.68l-3.14-2.67l-8.16-1.98L753.17,358.32L753.17,358.32z"/> \
	<path id="bali" d="M781.77,366.93l-2.16,1.19l1.28,1.39l3.14-1.189L781.77,366.93L781.77,366.93z"/> \
	<path id="lombok" d="M785.5,366.04l0.39,1.88l2.26,0.59l0.88-1.09l-0.979-1.49L785.5,366.04L785.5,366.04z"/> \
	<path id="sumba" d="M790.909,370.99l-2.75,0.399l2.46,2.08h1.96L790.909,370.99L790.909,370.99z"/> \
	<path id="flores" d="M791.69,367.72l-0.59,1.19l4.42,0.689l3.439-1.979l-1.96-0.59l-3.14,0.89l-1.18-0.99L791.69,367.72   L791.69,367.72z"/> \
	<path id="timor" d="M806.14,368.42l-5.11,4.26l0.49,1.09l2.16-0.399l2.55-2.38l5.01-0.69l-0.979-1.68L806.14,368.42L806.14,368.42z   "/> \
	<path id="new_ireland" d="M880.48,349l-0.88,1.25l4.81,4.26l0.66,2.5l1.31-0.149l0.15-2.57l-1.46-1.32L880.48,349L880.48,349z"/> \
	<path id="new_britain" d="M882.89,355.03l-0.95,0.22l-0.58,2.57l-1.82,1.18l-5.47,0.96l0.22,2.06l5.761-0.289l3.649-2.28   l-0.22-3.97L882.89,355.03L882.89,355.03z"/> \
	<path id="bougainville" d="M889.38,359.51l1.239,3.45l2.19,2.13l0.66-0.59l-0.22-2.28l-2.48-3.01L889.38,359.51L889.38,359.51z"/> \
	<path id="choiseul" d="M895.43,364.65l0.15,2.279l1.39,1.32l1.31-0.81l-1.17-2.431L895.43,364.65L895.43,364.65z"/> \
	<path id="new_georgia" d="M897.18,370.31l-1.17,1.25l1.24,2.28l1.459,0.44l-0.069-1.54L897.18,370.31L897.18,370.31z"/> \
	<path id="santa_isabel" d="M900.03,368.99l1.021,2.5l1.97,2.35l1.09-1.76l-1.46-2.5L900.03,368.99L900.03,368.99z"/> \
	<path id="malaita" d="M905.14,372.74l0.58,3.09l1.39,1.91l1.17-2.42L905.14,372.74L905.14,372.74z"/> \
	<path id="santa_ana" d="M906.74,379.65l-0.51,0.88l1.68,2.21l1.17,0.069l-0.729-2.869L906.74,379.65L906.74,379.65z"/> \
	<path id="rennell" d="M903.02,384.05l-1.75,0.811l1.53,2.13l1.31-0.74L903.02,384.05L903.02,384.05z"/> \
	<path id="espiritu_santo" d="M920.869,397.22l-1.239,1.66l0.52,1.87l0.62,0.42l1.13-1.46L920.869,397.22L920.869,397.22z"/> \
	<path id="malakula" d="M921.49,402.31l0.101,1.351l1.34,0.42l0.93-0.521l-0.93-1.46L921.49,402.31L921.49,402.31z"/> \
	<path id="efate" d="M923.449,414.37l-0.619,0.939l0.93,1.04l1.55-0.52L923.449,414.37L923.449,414.37z"/> \
	<path id="fiji" d="M948.619,412.29l-1.239,1.66l-0.101,1.87l1.44,1.46L948.619,412.29L948.619,412.29z"/> \
	<path id="palawan" d="M789.369,297.53l-0.859,1.64l-0.48,2.02l-4.779,6.07l0.289,1.25l2.011-0.29l6.21-6.94L789.369,297.53   L789.369,297.53z"/> \
	<path id="negros" d="M797.11,295.22l-0.1,5.01l1.819,1.83l0.671,3.56l1.819,0.39l0.86-2.22l-1.43-1.06l-0.381-6.26L797.11,295.22   L797.11,295.22z"/> \
	<path id="cebu" d="M802.28,297.15l-0.1,4.43l1.05,1.73l1.82-2.12l-0.48-3.85L802.28,297.15L802.28,297.15z"/> \
	<path id="samar" d="M803.42,293.29l1.819,2.41l0.86,2.31h1.63l-0.29-3.95l-1.82-1.25L803.42,293.29L803.42,293.29z"/> \
	<path id="path7462" d="M806.96,302.35l0.38,2.89l-3.351,2.7l-2.77,0.29l-2.96,3.18l0.1,1.45l2.771-0.87l1.909-1.25l1.631,4.14   l2.869,2.021l1.15-0.391l1.05-1.25l-2.29-2.31l1.34-1.061l1.53,1.25l1.05-1.729l-1.05-2.12l-0.189-4.72L806.96,302.35   L806.96,302.35z"/> \
	<path id="luzon" d="M791.38,272.97l-2.58,1.83l-0.29,5.78l4.02,7.8l1.34,1.06l1.721-1.16l2.96,0.48l0.569,2.6l2.2,0.19l1.05-1.44   l-1.34-1.83l-1.63-1.54l-3.439-0.38l-1.82-2.99l2.1-3.18l0.19-2.79l-1.43-3.56L791.38,272.97L791.38,272.97z"/> \
	<path id="mindoro" d="M792.72,290.21l0.76,2.7l1.34,0.87l0.96-1.25l-1.529-2.12L792.72,290.21L792.72,290.21z"/> \
	<path id="hainan" d="M759.829,270.17l-2.39,0.67l-1.72,2.12l1.43,2.79l2.101,0.19l2.39-2.12l0.57-2.79L759.829,270.17   L759.829,270.17z"/> \
	<path id="kyushu" d="M803.23,216.42l-1.63,1.64l0.67,2.31l1.43,0.1l0.96,5.01l1.15,1.25l2.01-1.83l0.86-3.28l-2.49-3.56   L803.23,216.42L803.23,216.42z"/> \
	<path id="shikoku" d="M812.03,213.15l-2.77,2.6l-0.101,2.99l0.67,0.87l3.73-3.18l-0.29-3.18L812.03,213.15L812.03,213.15z"/> \
	<path id="honshu" d="M808.199,206.98l-4.88,5.59l0.86,1.35l2.39,0.29l4.49-3.47l3.16-0.58l2.87,3.37l2.199-0.77l0.86-3.28l4.11-0.1   l4.02-4.82l-2.1-8l-0.96-4.24l2.1-1.73l-4.78-7.22l-1.239,0.1l-2.58,2.89v2.41l1.149,1.35l0.38,6.36l-2.96,3.66l-1.72-1.06   l-1.34,2.99l-0.29,2.79l1.05,1.64l-0.67,1.25l-2.2-1.83h-1.529l-1.341,0.77L808.199,206.98L808.199,206.98z"/> \
	<path id="hokkaido" d="M816.43,163.44l-1.53,1.35l0.771,2.89l1.34,1.35l-0.101,4.43l-1.72,0.67l-1.34,2.99l3.92,5.39l2.58-0.87   l0.479-1.35l-2.77-2.5l1.72-2.22l1.82,0.29l1.43,1.54l0.101-3.18l3.92-3.18l2.2-0.58l-1.82-3.08l-0.86-1.35l-1.43,0.96l-1.24,1.54   l-2.68-0.58l-2.771-1.83L816.43,163.44L816.43,163.44z"/> \
	<path id="sri_lanka" d="M680.539,308.05l0.25,2.72l0.25,1.98l-1.47,0.25l0.74,4.45l2.21,1.24l3.43-1.98l-0.979-4.69l0.25-1.729   l-3.19-2.96L680.539,308.05L680.539,308.05z"/> \
	<path id="irian_jaya" d="M831.93,339.34l-4.17,0.47l-2.68,1.96l1.109,2.24l4.54,0.84v0.841l-2.87,2.329l1.391,4.851l1.39,0.09   l1.2-4.76h2.22l0.93,4.66l10.83,8.96l0.28,7l3.7,4.01l1.67-0.09l0.37-24.721l-6.29-4.38l-5.931,4.011l-2.13,1.31l-3.52-2.24   l-0.09-7.09L831.93,339.34L831.93,339.34z"/> \
	<path id="china" d="M670.4,170.07l-3.46,8.7l-4.77-0.25l-5.03,11.01l4.27,5.439l-8.8,12.15l-4.52-0.76l-3.021,3.8l0.75,2.28   l3.521,0.25l1.76,4.05l3.52,0.76l10.811,13.93v7.09l5.28,3.29l5.779-1.01l7.29,4.3l8.8,2.53l4.271-0.51l4.78-0.51l10.05-6.58   l3.27,0.51l1.25,2.97l2.771,0.83l3.77,5.57l-2.51,5.57l1.51,3.8l4.271,1.52l0.75,4.56l5.03,0.51l0.75-2.28l7.29-3.8l4.52,0.25   l5.28,5.82l3.52-1.52l2.261,0.25l1.01,2.79l1.76,0.25l2.51-3.54l10.051-3.8l9.05-10.89l3.02-10.38l-0.25-6.84l-3.77-0.76l2.26-2.53   l-0.5-4.05l-9.55-9.62v-4.81l2.76-3.54l2.76-1.27l0.25-2.79h-7.04l-1.26,3.8l-3.27-0.76l-4.021-4.3l2.51-6.58l3.521-3.8l3.27,0.25   l-0.5,5.82l1.761,1.52l4.27-4.3l1.51-0.25l-0.5-3.29l4.021-4.81l3.02,0.25l1.761-5.57l2.06-1.09l0.21-3.47l-2-2.1l-0.17-5.48   l3.85-0.25l-0.25-14.13l-2.699,1.62l-1.011,3.62l-4.51-0.01l-13.07-7.35l-9.439-11.38l-9.58-0.1l-2.44,2.12l3.101,7.1l-1.08,6.66   l-3.86,1.6l-2.17-0.17l-0.16,6.59l2.26,0.51l4.021-1.77l5.28,2.53v2.53l-3.771,0.25l-3.02,6.58l-2.761,0.25l-9.8,12.91l-10.3,4.56   l-7.04,0.51l-4.77-3.29l-6.79,3.55l-7.29-2.28l-1.76-4.81l-12.311-0.76l-6.53-10.63h-2.76l-2.22-4.93L670.4,170.07z"/> \
	<path id="mongolia" d="M673.8,170.17l5.819-7.72l6.99,3.23l4.75,1.27l5.82-5.34l-3.95-2.91l2.6-3.67l7.761,2.74l2.689,4.41   l4.86,0.13l2.54-1.89l5.229-0.21l1.141,1.94l8.689,0.44l5.5-5.61l7.61,0.8l-0.44,7.64l3.33,0.76l4.09-1.86l4.33,2.14l-0.1,1.08   l-3.14,0.09l-3.271,6.86l-2.54,0.25l-9.88,12.91l-10.09,4.45l-6.311,0.49l-5.239-3.38l-6.7,3.58l-6.601-2.05l-1.869-4.79   l-12.5-0.88l-6.4-10.85l-3.11-0.2L673.8,170.17L673.8,170.17z"/> \
	<path id="north_korea" d="M778.28,194.27l1.84,0.77l0.561,6.44l3.65,0.21l3.439-4.03l-1.189-1.06l0.14-4.32l3.16-3.82l-1.61-2.9   l1.05-1.2l0.58-3l-1.83-0.83l-1.56,0.79l-1.93,5.86l-3.12-0.27l-3.61,4.26L778.28,194.27L778.28,194.27z"/> \
	<path id="south_korea" d="M788.34,198.2l6.18,5.04l1.05,4.88l-0.21,2.62l-3.02,3.4l-2.601,0.14l-2.95-6.37l-1.119-3.04l1.189-0.92   l-0.28-1.27l-1.47-0.66L788.34,198.2L788.34,198.2z"/> \
	<path id="turkmenistan" d="M593.85,207.59l-0.62,2.63h-4.15v3.561l4.46,2.94l-1.38,4.03v1.86l1.851,0.31l2.46-3.25l5.54-1.24   l11.84,4.49l0.15,3.25l6.609,0.62l7.38-7.75l-0.92-2.48l-4.92-1.08l-13.84-8.99l-0.62-3.25h-5.229l-2.311,4.34h-2.31L593.85,207.59   L593.85,207.59z"/> \
	<path id="uzbekistan" d="M628.92,219.06l3.08,0.16v-5.27l-2.921-1.7l4.921-6.2h2l2,2.33l5.229-2.01L636,203.89l-0.28-1.5   l-1.72,0.42l-1.69,2.94l-7.29-0.24l-5.35-7.57l-9.4,0.93l-4.48-4.44l-6.199-1.05l-4.5,1.83l2.609,8.68l0.03,2.92l1.9,0.04   l2.33-4.44l6.199,0.08l0.921,3.41l13.289,8.82l5.141,1.18L628.92,219.06L628.92,219.06z"/> \
	<path id="tajikistan" d="M630.19,211.84l4.11-5.1h1.55l0.54,1.14l-1.9,1.38v1.14l1.25,0.9l6.01,0.36l1.96-0.84L644.6,211l0.6,1.92   l3.57,0.36l1.79,3.78l-0.54,1.14l-0.71,0.06l-0.71-1.44l-1.55-0.12l-2.681,0.36l-0.18,2.52l-2.68-0.18l0.12-3.18l-1.96-1.92   l-2.98,2.46l0.06,1.62l-2.619,0.9h-1.551l0.12-5.58L630.19,211.84L630.19,211.84z"/> \
	<path id="kirgizstan" d="M636.81,199.21l-0.31,2.53l0.25,1.56l8.699,2.92l-7.64,3.08l-0.87-0.72l-1.65,1.06l0.08,0.58l0.881,0.4   l5.359,0.14l2.72-0.82l3.49-4.4l4.37,0.76l5.27-7.3l-14.1-1.92l-1.95,4.73l-2.46-2.64L636.81,199.21L636.81,199.21z"/> \
	<path id="afghanistan" d="M614.119,227.05l1.591,12.46l3.96,0.87l0.369,2.24l-2.84,2.37l5.29,4.27l10.28-3.7l0.82-4.38l6.47-4.04   l2.479-9.36l1.851-1.99l-1.92-3.34l6.26-3.87l-0.8-1.12l-2.891,0.18l-0.26,2.66l-3.88-0.04l-0.07-3.55l-1.25-1.49l-2.1,1.91   l0.06,1.75l-3.17,1.2l-5.85-0.37l-7.6,7.96L614.119,227.05L614.119,227.05z"/> \
	<path id="pakistan" d="M623.13,249.84l2.6,3.86l-0.25,1.99l-3.46,1.37l-0.25,3.24h3.96l1.36-1.12h7.54l6.8,5.98l0.87-2.87h5.069   l0.12-3.61l-5.189-4.98l1.109-2.74l5.32-0.37l7.17-14.95l-3.96-3.11l-1.48-5.23l9.641-0.87l-5.69-8.1l-3.03-0.82l-1.239,1.5   l-0.931,0.07l-5.689,3.61l1.859,3.12l-2.1,2.24l-2.6,9.59l-6.431,4.11l-0.869,4.49L623.13,249.84L623.13,249.84z"/> \
	<path id="india" d="M670.98,313.01l4.58-2.24l2.72-9.839l-0.12-12.08l15.58-16.82v-3.99l3.21-1.25l-0.12-4.61l-3.46-6.73l1.98-3.61   l4.33,3.99l5.56,0.25v2.24l-1.729,1.87l0.37,1l2.97,0.12l0.62,3.36h0.87l2.229-3.99l1.11-10.46l3.71-2.62l0.12-3.61l-1.48-2.87   l-2.35-0.12l-9.2,6.08l0.58,3.91l-6.46-0.02l-2.28-2.79l-1.24,0.16l0.42,3.88l-13.97-1l-8.66-3.86l-0.46-4.75l-5.77-3.58   l-0.07-7.37l-3.96-4.53l-9.1,0.87l0.989,3.96l4.46,3.61l-7.71,15.78l-5.159,0.39l-0.851,1.9l5.08,4.7l-0.25,4.75l-5.189-0.08   l-0.561,2.36l4.311-0.19l0.12,1.87l-3.091,1.62l1.98,3.74l3.83,1.25l2.35-1.74l1.11-3.11l1.359-0.62l1.61,1.62l-0.49,3.99   l-1.109,1.87l0.25,3.24L670.98,313.01L670.98,313.01z"/> \
	<path id="bangladesh" d="M695.57,253.11l-1.31,2.37l3.399,6.46l0.101,5.04l0.62,1.35l3.989,0.07l2.261-2.17l1.64,0.99l0.33,3.07   l1.31-0.82l0.08-3.92l-1.1-0.13l-0.69-3.33l-2.779-0.1l-0.69-1.85l1.7-2.27l0.03-1.12h-4.94L695.57,253.11L695.57,253.11z"/> \
	<path id="burma" d="M729.44,303.65l-2.77-4.44l2.01-2.82l-1.9-3.49l-1.79-0.34l-0.34-5.86l-2.68-5.19l-0.78,1.24l-1.79,3.04   l-2.24,0.34l-1.12-1.47l-0.56-3.95l-1.68-3.16l-6.841-6.45l1.681-1.11l0.31-4.67l2.5-4.2l1.08-10.45l3.62-2.47l0.12-3.81l2.17,0.72   l3.42,4.95l-2.54,5.44l1.71,4.27l4.23,1.66l0.77,4.65l5.68,0.88l-1.569,2.71l-7.16,2.82l-0.78,4.62l5.26,6.76l0.221,3.61   l-1.23,1.24l0.11,1.13l3.92,5.75l0.11,5.97L729.44,303.65L729.44,303.65z"/> \
	<path id="thailand" d="M730.03,270.47l3.24,4.17v5.07l1.12,0.56l5.149-2.48l1.011,0.34l6.149,7.1l-0.22,4.85l-2.01-0.34l-1.79-1.13   l-1.34,0.11l-2.351,3.94l0.45,2.14l1.9,1.01l-0.11,2.37l-1.34,0.68l-4.59-3.16v-2.82l-1.9-0.11l-0.78,1.24l-0.399,12.62l2.97,5.42   l5.26,5.07l-0.22,1.47l-2.8-0.109l-2.57-3.83h-2.689l-3.36-2.71l-1.01-2.82l1.45-2.37l0.5-2.14l1.58-2.8l-0.07-6.44l-3.86-5.58   l-0.16-0.68l1.25-1.26l-0.29-4.43l-5.14-6.51l0.6-3.75L730.03,270.47L730.03,270.47z"/> \
	<path id="malaysia" d="M732.71,315.45l2.01,4.51l0.45,5.86l2.689,4.17l6.49,3.939l2.46,0.23l-0.45-4.061l-2.13-5.18l-3.12-6.63   l-0.26,1.16l-3.76-0.17l-2.7-3.88L732.71,315.45L732.71,315.45z"/> \
	<path id="cambodia" d="M740.48,299.47l4.09,4.37l7.61-5.64l0.67-8.9l-3.93,2.71l-2.04-1.14l-2.771-0.37l-1.55-1.09l-0.75,0.04   l-2.03,3.33l0.33,1.54l2.061,1.15l-0.25,3.13L740.48,299.47L740.48,299.47z"/> \
	<path id="laos" d="M735.47,262.93l-2.42,1.23l-2.011,5.86l3.36,4.28l-0.56,4.73l0.56,0.23l5.59-2.71l7.5,8.38l-0.18,5.28l1.63,0.88   l4.03-3.27l-0.33-2.59l-11.63-11.05l0.109-1.69l1.45-1.01l-1.01-2.82l-4.81-0.79L735.47,262.93L735.47,262.93z"/> \
	<path id="vietnam" d="M745.06,304.45l1.19,1.87l0.22,2.14l3.13,0.34l3.8-5.07l3.58-1.01l1.9-5.18l-0.891-8.34l-3.689-5.07   l-3.891-3.11l-4.95-8.5l3.551-5.94l-5.08-5.83l-4.07-0.18l-3.66,1.97l1.09,4.71l4.881,0.86l1.31,3.63l-1.72,1.12l0.109,0.9   l11.45,11.2l0.45,3.29l-0.69,10.4L745.06,304.45L745.06,304.45z"/> \
	<path id="georgia" d="M555.46,204.16l3.27,4.27l4.08,1.88l2.51-0.01l4.311-1.17l1.08-1.69l-12.75-4.77L555.46,204.16L555.46,204.16   z"/> \
	<path id="armenia" d="M569.72,209.89l4.8,6.26l-1.41,1.65l-3.4-0.59l-4.22-3.78l0.23-2.48L569.72,209.89L569.72,209.89z"/> \
	<path id="azerbaijan" d="M571.409,207.72l-1.01,1.72l4.71,6.18l1.641-0.53l2.699,2.83l1.17-4.96l2.931,0.47l-0.12-1.42l-4.82-4.22   l-0.92,2.48L571.409,207.72L571.409,207.72z"/> \
	<path id="iran" d="M569.65,217.95l-1.22,1.27l0.12,2.01l1.52,2.13l5.391,5.9l-0.82,2.36h-0.94l-0.47,2.36l3.05,3.9l2.811,0.24   l5.63,7.79l3.16,0.24l2.46,1.77l0.12,3.54l9.729,5.67h3.63l2.23-1.89l2.81-0.12l1.641,3.78l10.51,1.46l0.31-3.86l3.48-1.26   l0.16-1.38l-2.771-3.78l-6.17-4.96l3.24-2.95l-0.23-1.3l-4.06-0.63l-1.72-13.7l-0.2-3.15l-11.011-4.21l-4.88,1.1l-2.729,3.35   l-2.42-0.16l-0.7,0.59l-5.39-0.35l-6.801-4.96l-2.529-2.77l-1.16,0.28l-2.09,2.39L569.65,217.95L569.65,217.95z"/> \
	<path id="turkey" d="M558.699,209.19l-2.229,2.36l-8.2-0.24l-4.92-2.95l-4.8-0.12l-5.511,3.9l-5.159,0.24l-0.471,2.95h-5.859   l-2.34,2.13v1.18l1.409,1.18v1.3l-0.59,1.54l0.59,1.3l1.881-0.94l1.88,2.01l-0.471,1.42l-0.699,0.95l1.05,1.18l5.16,1.06l3.63-1.54   v-2.24l1.76,0.35l4.22,2.48l4.57-0.71l1.99-1.89l1.29,0.47v2.13h1.76l1.52-2.95l13.36-1.42l5.83-0.71l-1.54-2.02l-0.03-2.73   l1.17-1.4l-4.26-3.42l0.23-2.95h-2.341L558.699,209.19L558.699,209.19z"/> \
	<path id="yemen" d="M571.99,289.23l1.44,4.28v4.18l3.46,3.14l24.38-9.93l0.23-2.73l-3.91-7.02l-9.811,3.13l-5.63,5.54l-6.53-3.86   L571.99,289.23L571.99,289.23z"/> \
	<path id="oman" d="M598.38,280.84l7.39-4.26l1.31-6.25l-1.619-0.93l0.67-6.7l1.409-0.82l1.511,2.37l8.989,4.7v2.61l-10.89,16.03   l-5.01,0.17L598.38,280.84L598.38,280.84z"/> \
	<path id="emirates" d="M594.01,264.94l0.87,3.48l9.859,0.87l0.69-7.14l1.899-1.04l0.521-2.61l-3.11,0.87l-3.46,5.23L594.01,264.94   L594.01,264.94z"/> \
	<path id="qatar" d="M592.63,259.02l-0.521,4.01l1.54,1.17l1.4-0.13l0.52-5.05l-1.21-0.87L592.63,259.02L592.63,259.02z"/> \
	<path id="saudi" d="M584,253.24l7.01,9.77l2.26,1.8l1.01,4.38l10.79,0.85l1.22,0.64l-1.21,5.4l-7.09,4.18l-10.37,3.14l-5.529,5.4   l-6.57-3.83l-3.98,3.48L566,279.4l-3.801-1.74l-1.38-2.09v-4.53l-13.83-16.72l-0.52-2.96h3.979l4.84-4.18l0.17-2.09l-1.38-1.39   l2.771-2.26l5.88,0.35l10.03,8.36l5.92-0.27l0.38,1.46L584,253.24L584,253.24z"/> \
	<path id="syria" d="M546.67,229.13l-0.351,2.54l2.82,1.18l-0.12,7.04l2.82-0.06l2.819-2.13l1.061-0.18l6.399-5.09l1.29-7.39   l-12.79,1.3l-1.35,2.96L546.67,229.13L546.67,229.13z"/> \
	<path id="iraq" d="M564.31,225.03l-1.56,7.71l-6.461,5.38l0.41,2.54l6.311,0.43l10.05,8.18l5.62-0.16l0.149-1.89l2.061-2.21   l2.88,1.63l0.38-0.36l-5.57-7.41l-2.64-0.16l-3.51-4.51l0.7-3.32l1.069-0.14l0.37-1.47l-4.78-5.03L564.31,225.03L564.31,225.03z"/> \
	<path id="jordan" d="M548.9,240.78l-2.46,8.58l-0.11,1.31h3.87l4.33-3.82l0.11-1.45l-1.771-1.81l3.17-2.63l-0.46-2.44l-0.87,0.2   l-2.64,1.89L548.9,240.78L548.9,240.78z"/> \
	<path id="israel" d="M545.32,238.06l-1.58,5.03l2.05,6.03l2.351-8.81v-1.89L545.32,238.06L545.32,238.06z"/> \
	<path id="cyprus" d="M543.21,229.84l1.229,0.89l-3.81,3.61l-1.82-0.06l-1.35-0.95l0.18-1.77l2.76-0.18L543.21,229.84L543.21,229.84   z"/> \
	<path id="lebanon" d="M546.199,232.44l0.061,1.95l-0.82,2.96l2.82,0.24l0.18-4.2L546.199,232.44L546.199,232.44z"/> \
	<path id="kuwait" d="M583.289,247.17l-2.25-1.22l-1.56,1.57l0.17,3.14l3.63,1.39L583.289,247.17L583.289,247.17z"/> \
	<path id="bhutan" d="M695.4,248.08l1.55,2.12l5.24,0.04l-0.53-2.9L695.4,248.08L695.4,248.08z"/> \
	<path id="nepal" d="M671.19,242.56l0.46,4.27l8.08,3.66l12.95,0.96l-0.49-3.13l-8.65-2.38l-7.34-4.37L671.19,242.56L671.19,242.56z   "/> \
	<path id="male" d="M656.4,320.76l0.3,2.61l1.67,0.61l0.301-2.301L656.4,320.76L656.4,320.76z"/> \
	<path id="maldive" d="M658.53,326.28l-0.149,3.22l1.22,0.61l1.07-2.15L658.53,326.28L658.53,326.28z"/> \
	<path id="gan" d="M658.84,332.57l-1.07,1.069l1.22,1.07l1.521-1.07L658.84,332.57L658.84,332.57z"/> \
	<path id="taiwan" d="M787.46,248.31l-3.54,2.7l-0.19,5.2l3.06,3.56l0.761-0.67L787.46,248.31L787.46,248.31z"/> \
	<path id="attu_west" d="M-22.16,106.33l1.66,1.17l-0.5,1.34h-1.16V106.33L-22.16,106.33z"/> \
	<path id="kerguelen" d="M622.76,499.62l-0.15,4.29l5.94,1.38l1.37-3.53l-2.131,0.61l-2.739,0.61l-0.761-3.221L622.76,499.62   L622.76,499.62z"/> \
</g> \
<g id="eur"> \
	<path id="estonia" d="M517.77,143.66l-5.6-0.2l-3.551,2.17l-0.05,1.61l2.3,2.17l7.15,1.21L517.77,143.66L517.77,143.66z"/> \
	<path id="iceland" d="M406.36,117.31l-1.96-1.11l-2.64,1.67l-2.271,2.1l0.061,1.17l2.939,0.37l-0.18,2.1l-1.04,1.05l0.25,0.68   l2.939,0.19v3.4l4.23,0.74l2.51,1.42l2.82,0.12l4.84-2.41l3.74-4.94l0.06-3.34l-2.27-1.92l-1.9-1.61l-0.859,0.62l-1.29,1.67   l-1.471-0.19l-1.47-1.61l-1.899,0.18l-2.761,2.29l-1.66,1.79l-0.92-0.8l-0.06-1.98l0.92-0.62L406.36,117.31L406.36,117.31z"/> \
	<path id="spitsbergen" d="M488.26,53.96l-1.65-1.66l-3.66,1.78h-6.72L475.17,58l3.77,3.33l1.65-0.24l2.359-4.04l2,1.43l-1.42,2.85   l-0.71,4.16l1.65,2.61l3.54-5.94l4.6-5.59l-1.77-1.54L488.26,53.96L488.26,53.96z"/> \
	<path id="nordaustlandet" d="M490.26,46.83l-2.95,2.73l1.77,2.73h3.181l1.3,1.78l3.89,2.02l4.48-2.61l3.07-2.61l-1.061-2.14   l-3.07-1.78l-2.239,2.02l-1.53-1.9l-1.18,0.12l-1.53,3.33l-2.24-2.26l-0.24-1.54L490.26,46.83L490.26,46.83z"/> \
	<path id="edgeoya" d="M496.98,59.07l-2.36,2.14l-2,1.54l0.94,1.66l1.89,0.59l3.07-1.43l1.42-1.78l-1.3-2.14L496.98,59.07   L496.98,59.07z"/> \
	<path id="prince_george" d="M547.82,38.79l1.72,0.69l-1.21,2.08v2.95l-2.58,1.56H543l-1.551-1.91l0.17-2.08l1.21-1.56h2.41   L547.82,38.79L547.82,38.79z"/> \
	<path id="salisbury" d="M554.36,36.88v2.08l1.72,1.39l2.41-0.17l2.07-1.91v-1.39h-1.89l-1.551,0.52l-1.21-1.39L554.36,36.88   L554.36,36.88z"/> \
	<path id="wilczek" d="M564.18,37.06l1.21,2.6l2.41,0.17l1.72-0.69l-0.86-2.43l-2.239-0.52L564.18,37.06L564.18,37.06z"/> \
	<path id="bell" d="M573.99,33.59l-1.89-0.35l-1.72,1.74l0.859,1.56l0.521,2.43l2.24-1.73l0.52-1.91L573.99,33.59L573.99,33.59z"/> \
	<path id="novaya_zemlya_north" d="M584.49,51.98l-0.52,2.43l-3.96,3.47l-8.44,1.91l-6.89,11.45l-1.21,3.3l6.89,1.74l1.03-4.16   l2.069-6.42l5.341-2.78l4.479-3.47l3.271-1.39h1.72v-4.68L584.49,51.98L584.49,51.98z"/> \
	<path id="novaya_zemlya_south" d="M562.28,77.31l4.65,0.52l1.55,5.38l3.96,4.16l-1.38,2.78h-2.41l-2.24-2.6l-4.989-0.17l-2.07-2.78   v-1.91l3.1-0.87L562.28,77.31L562.28,77.31z"/> \
	<path id="komsomolets" d="M634.949,18.15l-2.239-1.39h-2.58l-0.521,1.56l-2.75,1.56l-2.07,0.69l-0.34,2.08l4.82,0.35L634.949,18.15   L634.949,18.15z"/> \
	<path id="october" d="M640.28,18.67l-1.21,2.6l-2.41-0.17l-3.79,2.78l-1.029,3.47h2.41l1.38-2.26l3.27,2.43L642,26.13l2.239-1.91   l-0.859-2.95l-1.21-2.08L640.28,18.67L640.28,18.67z"/> \
	<path id="bolshevik" d="M645.28,20.58l1.21,4.86l1.891,4.51l2.069-3.64l3.96-0.87v-2.6l-2.579-1.91L645.28,20.58L645.28,20.58z"/> \
	<path id="kotelny" d="M739.76,12.8l2.689,2.26l1.91-0.79l0.561-3.17L741,8.39l-2.58,1.7l-6.28,0.57v2.83l-6.62,0.11v4.63l7.74,5.76   l2.02-1.47l-0.45-4.07l4.94-1.24l-1.01-1.92l-1.79-1.81L739.76,12.8L739.76,12.8z"/> \
	<path id="novaya_sibir" d="M746.94,10.09l1.79,3.39l6.96-0.79l1.91-2.49l-0.45-2.15l-1.91-0.79l-1.79,1.36l-5.16,1.13L746.94,10.09   L746.94,10.09z"/> \
	<path id="lyakhovsky" d="M746.49,23.31l-3.479-0.9L741,24.56l-0.9,2.94l4.71-0.45l3.59-1.81L746.49,23.31L746.49,23.31z"/> \
	<path id="wrangel" d="M836.68,3.76l-2.92-0.9L830.4,4.1l-1.68,2.49l2.13,2.83l5.609-2.49l1.121-1.24L836.68,3.76L836.68,3.76z"/> \
	<path id="russia" d="M817.97,72.93l1.76,6.08l3.521,1.01l3.52-5.57l-2.01-3.8l0.75-3.29h5.279l-1.26,2.53l0.5,9.12l-7.54,18.74   l0.75,4.05l-0.25,6.84l14.07,20.51l2.76,0.76l0.25-16.71l2.761-2.53l-3.021-6.58l2.51-2.79l-5.53-7.34l-3.02,0.25l-1-12.15   l7.79-2.03l0.5-3.55l4.021-1.01l2.26,2.03l2.76-11.14l4.77-8.1l3.771-2.03l3.271,0.25v-3.8l-5.28-1.01l-7.29-6.08l3.52-4.05   l-3.02-6.84l2.51-2.53l3.02,4.05l7.541,2.79l8.289,0.76l1.011-3.54l-4.271-4.3l4.771-6.58l-10.811-3.8l-2.76,5.57l-3.521-4.56   l-19.85-6.84l-18.85,3.29l-2.761,1.52v1.52l4.021,2.03l-0.5,4.81l-7.29-3.04l-16.08,6.33l-2.76-5.82H780.49l-5.029,5.32   l-17.841-4.05l-16.33,3.29l-2.01,5.06l2.51,0.76l-0.25,3.8l-15.829,1.77l1.01,5.06l-14.58-2.53l3.52-6.58l-14.83-0.76l1.261,6.84   l-4.771,2.28l-4.02-3.8l-16.33,2.79l-6.28,5.82l-0.25,3.54l-4.02,0.25l-0.5-4.05l12.819-11.14v-7.6l-8.29-2.28l-10.81,3.54   l-4.521-4.56h-2.01l-2.51,5.06l2.01,2.28l-14.33,7.85l-12.31,9.37l-7.54,10.38v4.3l8.04,3.29l-4.021,3.04l-8.54-3.04l-3.52,3.04   l-5.28-6.08l-1.01,2.28l5.779,18.23l1.511,0.51l4.02-2.03l2.011,1.52v3.29l-3.771-1.52l-2.26,1.77l1.51,3.29l-1.26,8.61l-7.79,0.76   l-0.5-2.79l4.52-2.79l1.011-7.6l-5.03-6.58l-1.76-11.39l-8.04-1.27l-0.75,4.05l1.51,2.03l-3.271,2.79l1.261,7.6l4.77,2.03   l1.01,5.57l-4.779-3.04l-12.311-2.28l-1.51,4.05l-9.8,3.54l-1.51-2.53l-12.82,7.09l-0.25,4.81l-5.03,0.76l1.51-3.54v-3.54   l-5.029-1.77l-3.271,1.27l2.76,5.32l2.011,3.54v2.79l-3.771-0.76l-0.75-0.76l-3.77,4.05l2.01,3.54l-8.54-0.25l2.76,3.55l-0.75,1.52   h-4.52l-3.271-2.28l-0.75-6.33l-5.28-2.03v-2.53l11.061,2.28l6.03,0.51l2.51-3.8l-2.26-4.05l-16.08-6.33l-5.551,1.38l-1.899,1.63   l0.59,3.75l2.36,0.41l-0.551,5.9l7.28,17.1l-5.26,8.34l-0.36,1.88l2.67,1.88l-2.409,1.59l-1.601,0.03l0.3,7.35l2.21,3.13l0.03,3.04   l2.83,0.26l4.33,1.65l4.58,6.3l0.05,1.66l-1.49,2.55l3.42-0.19l3.33,0.96l4.5,6.37l11.08,1.01l-0.479,7.58l-3.82,3.27l0.79,1.28   l-3.77,4.05l-1,3.8l2.26,3.29l7.29,2.53l3.02-1.77l19.351,7.34l0.75-2.03l-4.021-3.8v-4.81l-2.51-0.76l0.5-4.05l4.02-4.81   l-7.21-5.4l0.5-7.51l7.71-5.07l9.051,0.51l1.51,2.79l9.3,0.51l6.79-3.8l-3.521-3.8l0.75-7.09l17.591-8.61l13.529,6.1l4.521-4.05   l13.32,12.66l10.05-1.01l3.52,3.54l9.55,1.01l6.28-8.61l8.04,3.55l4.271,0.76l4.27-3.8l-3.77-2.53l3.27-5.06l9.3,3.04l2.011,4.05   l4.02,0.25l2.51-1.77l6.79-0.25l0.75,1.77l7.79,0.51l5.28-5.57l10.81,1.27l3.271-1.27l1-6.08l-3.271-7.34l3.271-2.79h10.3   l9.8,11.65l12.561,7.09h3.77l0.5-3.04l4.521-2.79l0.5,16.46l-4.021,0.25v4.05l2.26,2.79l-0.42,3.62l1.67,0.69l1.011-2.53l1.51,0.51   l1,1.01l4.521-1.01l4.52-13.17l0.5-16.46l-5.78-13.17l-7.29-8.86l-3.52,0.51v2.79l-8.54-3.29l3.27-7.09l2.761-18.74l11.56-3.54   l5.53-3.54h6.03L805.86,96l1.51,2.53l5.28-5.57l3.021,0.25l-0.5-3.29l-4.78-1.01l3.27-11.9L817.97,72.93L817.97,72.93z"/> \
	<path id="kazakhstan" d="M576.69,188.62l4.1-1.75l4.58-0.16l0.32,7h-2.68l-2.05,3.34l2.68,4.45l3.95,2.23l0.359,2.55l1.45-0.48   l1.34-1.59l2.21,0.48l1.11,2.23h2.84v-2.86l-1.74-5.09l-0.79-4.13l5.051-2.23l6.79,1.11l4.26,4.29l9.63-0.95l5.37,7.63l6.31,0.32   l1.74-2.86l2.21-0.48l0.32-3.18l3.31-0.16l1.74,2.07l1.74-4.13l14.99,2.07l2.52-3.34l-4.26-5.25l5.68-12.4l4.58,0.32l3.16-7.63   l-6.311-0.64l-3.63-3.5l-10,1.16l-12.88-12.45l-4.54,4.03l-13.77-6.25l-16.891,8.27l-0.47,5.88l3.95,4.61l-7.7,4.35l-9.99-0.22   l-2.09-3.07l-7.83-0.43l-7.42,4.77l-0.16,6.521L576.69,188.62L576.69,188.62z"/> \
	<path id="norway" d="M515.46,102.14l2.02-1.48L517.3,99l-1.28-0.74l0.18-2.03h1.101v-1.11l-4.771-1.29l-7.15,0.74l-0.729,3.14   L503,97.16l-1.101-1.85l-3.49,0.18l-0.37,3.51l-1.649,0.74l-0.92-1.85l-7.34,5.91l1.47,1.66l-2.75,1.29l-6.24,12.38l-2.2,1.48   l0.181,1.11l2.199,1.11l-0.55,2.4l-3.67-0.19l-1.1-1.29l-2.38,2.77l-1.471,1.11l-0.369,2.59l-1.28,0.74l-3.3,0.74l-1.65,5.18   l1.1,8.5l1.28,3.88l1.47,1.48l3.301-0.18l4.77-4.62l1.83-3.14l0.55,4.62l3.12-5.54l0.18-15.53l2.54-1.6l0.761-8.57l7.699-11.09   l3.67-1.29l1.65-2.03l5.5,1.29l2.75,1.66l0.92-4.62l4.59-2.77L515.46,102.14L515.46,102.14z"/> \
	<path id="britain" d="M446.119,149.08l-1.83,2.77l0.73,1.11h4.22v1.85l-1.1,1.48l0.729,3.88l2.381,4.62l1.829,4.25l2.931,1.11   l1.279,2.22l-0.18,2.03l-1.83,1.11l-0.18,0.92l1.28,0.74l-1.101,1.48l-2.569,1.11l-4.95-0.55l-7.71,3.51l-2.57-1.29l7.34-4.25   l-0.92-0.55l-3.85-0.37l2.38-3.51l0.37-2.96l3.12-0.37l-0.551-5.73l-3.67-0.18l-1.1-1.29l0.18-4.25l-2.2,0.18l2.2-7.39l4.04-2.96   L446.119,149.08L446.119,149.08z"/> \
	<path id="ulster" d="M438.42,161.47l-3.301,0.37l-0.18,2.96l2.2,1.48l2.38-0.55l0.92-1.66L438.42,161.47L438.42,161.47z"/> \
	<path id="ireland" d="M439.51,166.55l-0.91,6l-8.07,2.96h-2.57l-1.829-1.29v-1.11l4.04-2.59l-1.101-2.22l0.181-3.14l3.489,0.18   l1.601-3.76l-0.21,3.34l2.71,2.15L439.51,166.55L439.51,166.55z"/> \
	<path id="sweden" d="M497.72,104.58l1.96,1.81h3.67l2.02,3.88l0.551,6.65l-4.95,3.51v3.51l-3.49,4.81l-2.021,0.18l-2.75,4.62   l0.181,4.44l4.77,3.51l-0.37,2.03l-1.83,2.77l-2.75,2.4l0.181,7.95l-4.22,1.48l-1.471,3.14h-2.02l-1.101-5.54l-4.59-7.04   l3.771-6.31l0.26-15.59l2.6-1.43l0.631-8.92l7.409-10.61L497.72,104.58L497.72,104.58z"/> \
	<path id="finland" d="M506.789,116.94l2.07,0.91l1.28,2.4l-1.28,1.66l-6.42,7.02l-1.1,3.7l1.47,5.36l4.95,3.7l6.6-3.14l5.32-0.74   l4.95-7.95l-3.67-8.69l-3.49-8.32l0.55-5.36l-2.2-0.37l-0.569-3.91l-2.961-4.83l-3.279,2.27l-1.29,5.27l-3.48-2.09l-4.84-1.18   l-1.08,1.26l1.86,1.68l3.39-0.06l2.73,4.41L506.789,116.94L506.789,116.94z"/> \
	<path id="estonia_1_" d="M518.07,151.37l-6.85-1.11l0.149,3.83l6.351,3.88l2.6-0.76l-0.149-2.92L518.07,151.37L518.07,151.37z"/> \
	<path id="hiumaa" d="M506.76,147.64l-1.55-0.05l-0.9,0.91l0.65,0.96l1.55,0.1l0.8-1.16L506.76,147.64L506.76,147.64z"/> \
	<path id="saaremaa" d="M506.61,151.72l-1.5-0.15l-2.7,3.23v1.51l0.9,0.35l1.75,0.05l2.899-2.37l0.4-0.81L506.61,151.72   L506.61,151.72z"/> \
	<path id="lithuania" d="M510.81,154.7l-2.15-0.05l-2.95,2.82h-2.5l0.15,3.53l-1.5,2.77l5.4,0.05l1.55-0.2l1.55,1.87l3.55-0.15   l3.4-4.33l-0.2-2.57L510.81,154.7L510.81,154.7z"/> \
	<path id="belarus" d="M510.659,166.29l1.5,2.47l-0.6,1.97l0.1,1.56l0.551,1.87l3.1-1.76l3.85,0.1l2.7,1.11h6.85l2-4.79l1.2-1.81   v-1.21l-4.3-6.05l-3.8-1.51l-3.1-0.35l-2.7,0.86l0.1,2.72l-3.75,4.74L510.659,166.29L510.659,166.29z"/> \
	<path id="poland" d="M511.459,174.76l0.851,1.56l0.2,1.66l-0.7,1.61l-1.601,3.08l-1.35,0.61l-1.75-0.76l-1.05,0.05l-2.55,0.96   l-2.9-0.86l-4.7-3.33l-4.6-2.47l-1.851-2.82l-0.35-6.65l3.6-3.13l4.7-1.56l1.75-0.2l-0.7,1.41l0.45,0.55l7.91,0.15l1.7-0.05   l2.8,4.29l-0.7,1.76l0.301,2.07L511.459,174.76L511.459,174.76z"/> \
	<path id="spain" d="M448.36,205h-12.74l-2.569-1.16l-1.24,0.09l-1.5,3.12l0.53,3.21l4.869,0.45l0.62,2.05l-2.12,11.95l0.091,2.14   l3.45,1.87l3.979,0.271l7.96-1.96l3.89-4.9l0.091-4.99l6.899-6.24l0.351-2.76l-6.28-0.09L448.36,205L448.36,205z"/> \
	<path id="portugal" d="M430.93,211.24l-0.62,8.65l-1.771,1.6l0.181,0.98l1.239,2.05l-0.8,2.5l1.33,0.45l3.101-0.36l-0.181-2.5   l2.03-11.59l-0.439-1.6L430.93,211.24L430.93,211.24z"/> \
	<path id="majorca" d="M461.1,217.21l-1.59,0.54l0.35,1.43h2.3l0.971-1.07L461.1,217.21L461.1,217.21z"/> \
	<path id="sardinia" d="M477.56,213.38l-2.65,1.34l0.351,5.17l2.12,0.36l1.59-1.52v-4.9L477.56,213.38L477.56,213.38z"/> \
	<path id="corsica" d="M477.829,206.96l-1.949,1.96l-0.181,1.78l1.59,0.98l0.62-0.09l0.351-2.59L477.829,206.96L477.829,206.96z"/> \
	<path id="france" d="M460.4,178.7l-2.21,0.54l-4.42,4.81l-1.33,0.09l-1.77-1.25l-1.15,0.27l-0.88,2.76l-6.46,0.18l0.18,1.43   l4.42,2.94l5.13,4.1l-0.09,4.9l-2.739,4.81l5.93,2.85l6.02,0.18l1.86-2.14l3.8,0.09l1.061,0.98l3.8-0.271l1.95-2.5l-2.48-2.94   l-0.18-1.87l0.529-2.05l-1.239-1.78l-2.12,0.62l-0.271-1.6l4.69-5.17v-3.12l-3.101-1.78l-1.59-0.27L460.4,178.7L460.4,178.7z"/> \
	<path id="netherlands" d="M470.09,168.27l-4.53,2.23l0.96,0.87l0.1,2.23l-0.96-0.19l-1.06-1.65l-2.53,4.01l3.891,0.81l1.449,1.53   l0.771,0.02l0.51-3.46l2.45-1.03L470.09,168.27L470.09,168.27z"/> \
	<path id="belgium" d="M461.61,176.52l-0.64,1.6l6.88,4.54l1.979,0.47l0.07-2.15l-1.729-1.94h-1.061l-1.45-1.65L461.61,176.52   L461.61,176.52z"/> \
	<path id="germany" d="M471.14,167.88l3.57-0.58v-2.52l2.989-0.49l1.641,1.65l1.729,0.19l2.7-1.17l2.41,0.68l2.12,1.84l0.29,6.89   l2.12,2.82l-2.79,0.39l-4.631,2.91l0.391,0.97l4.14,3.88l-0.29,1.94l-3.85,1.939l-3.57,0.1l-0.87,1.84h-1.83l-0.87-1.94l-3.18-0.78   l-0.1-3.2l-2.7-1.84l0.29-2.33l-1.83-2.52l0.48-3.3l2.5-1.17L471.14,167.88L471.14,167.88z"/> \
	<path id="denmark" d="M476.77,151.5l-4.15,4.59l-0.149,2.99l1.89,4.93l2.96-0.56l-0.37-4.03l2.04-2.28l-0.04-1.79l-1.439-3.73   L476.77,151.5L476.77,151.5z"/> \
	<path id="sjælland" d="M481.44,159.64l-0.93-0.04l-1.221,1.12l0.15,1.75l2.89,0.08l0.15-1.98L481.44,159.64L481.44,159.64z"/> \
	<path id="gotland" d="M498.49,150.17l-2.109,1.67l1.06,2.45l1.87-1.82L498.49,150.17L498.49,150.17z"/> \
	<path id="switzerland" d="M472.909,189.38l-4.359,4.64l0.09,0.47l1.79-0.56l1.609,2.24l2.721-0.96l1.88,1.46l0.77-0.44l2.32-3.64   l-0.59-0.56l-2.29-0.06l-1.11-2.27L472.909,189.38L472.909,189.38z"/> \
	<path id="czech" d="M488.43,184.87h2.97h1.46l2.37,1.69l4.39-3.65l-4.26-3.04l-4.22-2.04l-2.89,0.52l-3.921,2.52L488.43,184.87   L488.43,184.87z"/> \
	<path id="slovakia" d="M495.84,187.13l0.689,0.61l0.09,1.04l7.631-0.17l5.64-2.43l-0.09-2.47l-1.08,0.48l-1.55-0.83l-0.95-0.04   l-2.5,1l-3.4-0.82L495.84,187.13L495.84,187.13z"/> \
	<path id="austria" d="M480.63,190.12l-0.65,1.35l0.56,0.96l2.33-0.48h1.98l2.15,1.82l4.569-0.83l3.36-2l0.859-1.35l-0.13-1.74   l-3.02-2.26l-4.05,0.04l-0.34,2.3l-4.261,2.08L480.63,190.12L480.63,190.12z"/> \
	<path id="hungary" d="M496.74,189.6l-1.16,1.82l0.091,2.78l1.85,0.95l5.689,0.17l7.931-6.68l0.04-1.48l-0.86-0.43l-5.729,2.6   L496.74,189.6L496.74,189.6z"/> \
	<path id="slovenia" d="M494.8,191.99l-2.54,1.52l-4.74,1.04l0.95,2.74l3.319,0.04l3.061-2.56L494.8,191.99L494.8,191.99z"/> \
	<path id="croatia" d="M495.619,195.16l-3.529,2.91h-3.58l-0.431,2.52l1.641,0.43l0.819-1.22l1.291,1.13l1.029,3.6l7.07,3.3l0.7-0.8   l-7.17-7.4l0.729-1.35l6.811-0.26l0.689-2.17l-4.439,0.13L495.619,195.16L495.619,195.16z"/> \
	<path id="bosnia" d="M494.8,198.94l-0.37,0.61l6.71,6.92l2.46-3.62l-0.09-1.43l-2.15-2.61L494.8,198.94L494.8,198.94z"/> \
	<path id="italy" d="M472.27,196.98l-0.62,1.57l0.17,1.71l2.391,2.79l3.76-0.13l8.3,9.64l5.18,1.5l3.061,2.89l0.729,6.59l1.641-0.96   l1.42-3.59l-0.351-2.58l2.431-0.22l0.35-1.46l-6.85-3.28l-6.5-6.39l-2.591-3.82l-0.63-3.63l3.311-0.79l-0.851-2.39l-2.029-1.71   l-1.75-0.08l-2.44,0.67l-2.3,3.22l-1.39,0.92l-2.15-1.32L472.27,196.98L472.27,196.98z"/> \
	<path id="sicily" d="M492.44,223.02l-1.45-0.78l-4.95,0.78l0.17,1.34l4.45,2.24l0.67,0.73l1.171,0.17L492.44,223.02L492.44,223.02z   "/> \
	<path id="malta" d="M492.61,230.47l-1.67,0.34l0.061,1.85l1.5,0.5l0.67-0.56L492.61,230.47L492.61,230.47z"/> \
	<path id="ukraine" d="M515.57,173.15l-2.899,1.63l0.72,3.08l-2.681,5.65l0.021,2.49l1.26,0.8l8.08,0.4l2.26-1.87l2.42,0.81   l3.471,4.63l-2.54,4.56l3.02,0.88l3.95-4.55l2.26,0.41l2.101,1.46l-1.851,2.44l2.5,3.9h2.66l1.37-2.6l2.82-0.57l0.08-2.11   l-5.24-0.81l0.16-2.271h5.08l5.479-4.39l2.42-2.11l0.4-6.66l-10.8-0.97l-4.431-6.25l-3.06-1.05l-3.71,0.16l-1.67,4.13l-7.601,0.1   l-2.47-1.14L515.57,173.15L515.57,173.15z"/> \
	<path id="moldova" d="M520.75,187.71l3.1,4.77l-0.26,2.7l1.109,0.05l2.63-4.45l-3.159-3.92l-1.79-0.74L520.75,187.71L520.75,187.71   z"/> \
	<path id="romania" d="M512.18,187.6l-0.26,1.48l-5.79,4.82l4.84,7.1l3.1,2.17h5.58l1.84-1.54l2.47-0.32l1.841,1.11l3.26-3.71   l-0.63-1.86l-3.311-0.85l-2.26-0.11l0.11-3.18l-3-4.72L512.18,187.6L512.18,187.6z"/> \
	<path id="serbia_and_montenegro" d="M505.55,194.54l-2.05,1.54h-1l-0.681,2.12l2.42,2.81l0.16,2.23l-3,4.24l0.42,1.27l1.74,0.32   l1.37-1.86l0.74-0.05l1.26,1.22l3.84-1.17l-0.32-5.46L505.55,194.54L505.55,194.54z"/> \
	<path id="bulgaria" d="M511.44,202.39l0.16,4.98l1.68,3.5l6.311,0.11l2.84-2.01l2.79-1.11l-0.681-3.18l0.631-1.7l-1.42-0.74   l-1.95,0.16l-1.53,1.54l-6.42,0.05L511.44,202.39L511.44,202.39z"/> \
	<path id="albania" d="M504.02,209.76v4.61l1.32,2.49l0.949-0.11l1.631-2.97l-0.95-1.33l-0.37-3.29l-1.26-1.17L504.02,209.76   L504.02,209.76z"/> \
	<path id="macedonia" d="M510.92,208.01l-3.37,1.11l0.16,2.86l0.79,1.01l4-1.86L510.92,208.01L510.92,208.01z"/> \
	<path id="greece" d="M506.709,217.6l-0.109,1.33l4.63,2.33l2.21,0.85l-1.16,1.22l-2.58,0.26l-0.369,1.17l0.89,2.01l2.89,1.54   l1.26,0.11l0.16-3.45l1.891-2.28l-5.16-6.1l0.68-2.07l1.21-0.05l1.84,1.48l1.16-0.58l0.37-2.07l5.42,0.05l0.21-3.18l-2.26,1.59   l-6.63-0.16l-4.311,2.23L506.709,217.6L506.709,217.6z"/> \
	<path id="thrace" d="M523.02,209.7l-0.16,3.55l3.101-0.95l1.42-0.95l-0.42-1.54l-1.471-1.17L523.02,209.7L523.02,209.7z"/> \
	<path id="crete" d="M516.76,230.59l1.63,0.05l0.68,1.01h2.37l1.58-0.58l0.53,0.64l-1.05,1.38l-4.631,0.16l-0.84-1.11l-0.89-0.53   L516.76,230.59L516.76,230.59z"/> \
	<path id="iturup" d="M830.86,160.45l-2.68,3.76l0.189,1.83l1.34-0.58l3.15-3.95L830.86,160.45L830.86,160.45z"/> \
	<path id="urup" d="M834.4,154.96l-0.96,2.6l0.1,1.73l1.631-1.06l1.529-3.08V154L834.4,154.96L834.4,154.96z"/> \
	<path id="paramushir" d="M840.039,132.03l-1.239,1.54l0.1,2.41l1.15-0.1l1.909-3.37L840.039,132.03L840.039,132.03z"/> \
	<path id="onekotan" d="M837.75,137.91v4.24l1.34,0.48l0.96-1.54v-3.27L837.75,137.91L837.75,137.91z"/> \
	<path id="sakhalin" d="M798.64,122.59l-0.09,6.17l7.739,11.95l2.771,10.4l4.88,9.25l1.91,0.67l1.63-1.35l0.76-2.22l-6.979-7.61   l0.189-3.95l1.53-0.67l0.38-2.31l-13.67-19.36L798.64,122.59L798.64,122.59z"/> \
	<path id="bering_island" d="M852.57,103.42l-1.91,0.19l1.15,1.64l2.39,1.64l0.67-0.77L852.57,103.42L852.57,103.42z"/> \
	<path id="medny" d="M856.289,104.58l0.29,1.64l2.96,0.87l0.29-1.16L856.289,104.58L856.289,104.58z"/> \
	<path id="attu" d="M872.539,110.87l1.25,2.24l2.08-0.14l0.42-1.54L872.539,110.87L872.539,110.87z"/> \
	<path id="greenland" d="M321.13,50.07l-1.36,2.17l2.45,2.45l-1.09,2.45l3.54,4.62l4.35-1.36l5.71-0.54l6.53,7.07l4.35,11.69   l-3.529,7.34l4.89-0.82l2.72,1.63l0.271,3.54l-5.98,0.27l3.261,3.26l4.079,0.82l-8.97,11.96l-1.09,7.34l1.9,5.98l-1.36,3.54   l2.45,7.61l4.62,5.17l1.359-0.27l2.99-0.82l0.27,4.35l1.9,2.72l3.53-0.271l2.72-10.06l8.16-10.06l12.24-4.89l7.609-9.52l3.53,1.63   h7.34l5.98-5.98l7.34-2.99l0.819-4.62l-4.62-4.08l-4.079-1.36l-2.181-5.71l5.17-2.99l8.16,4.35l2.721-2.99l-4.351-2.45l9.25-12.51   l-1.63-5.44l-4.35-0.27l1.63-4.89l5.439-2.45l11.15-9.79l-3.26-3.53l-12.511,1.09l-6.529,6.53l3.81-8.43l-4.35-1.09l-2.45,4.35   l-3.53-2.99l-9.79,1.09l2.72-4.35l16.04-0.54l-4.08-5.44l-17.399-3.26l-7.07,1.09l0.271,3.54l-7.34-2.45l0.27-2.45l-5.17,1.09   l-1.09,2.72l5.439,1.9l-5.71,4.08l-4.079-4.62l-5.71-1.63l-0.82,4.35h-5.71l-2.181-4.62l-8.97-1.36l-4.89,2.45l-0.271,3.26   l-6.25-0.82l-3.81,1.63l0.27,3.81v1.9l-7.069,1.36l-3.261-2.17l-2.18,3.53l3.26,3.54l6.801-0.82l0.54,2.18l-5.171,2.45   L321.13,50.07L321.13,50.07z"/> \
	<path id="milne" d="M410.869,85.69l4.62,1.36l-0.27,3.81l-4.891-2.45l-1.09-1.36L410.869,85.69L410.869,85.69z"/> \
</g> \
</svg> \
'

            
            function worldMap(container) {
                container.selectAll("svg").remove();
                container.html(world);
                container.selectAll("g").each(function(){
                    var g = d3.select(this);
                    var region = g.attr("id");
                    g.selectAll("path")
                        .datum(function(){
                            return {
                                "geo.name": d3.select(this).attr("id"), 
                                "geo.region": region, 
                            }
                        })
                })
            };
            
            return worldMap;
        }();
        
        

        
    }; 

}).call(this);