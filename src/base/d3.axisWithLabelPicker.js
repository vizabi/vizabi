define(['d3'], function(d3){

    d3.svg.axisSmart = function(){
        var VERTICAL = 'vertical axis';
        var HORIZONTAL = 'horizontal axis';
        var OPTIMISTIC = 'optimistic approximation: labels have different lengths';
        var PESSIMISTIC = 'pessimistic approximation: all labels have the largest length';
        var DEFAULT_LOGBASE = 10;

        var _super = d3.svg.axis();
        _super.smartLabeler = function(options){
            var axis = this;
            this.METHOD_REPEATING = 'repeating specified powers';
            this.METHOD_DOUBLING = 'doubling the value';

            if(options==null) options = {}
            if(options.scaleType==null) {console.warn('please set scaleType to "lin", "log", "ordinal"'); return axis;};
            if(options.scaleType=='ordinal') return axis.tickValues(null);

            if(options.logBase==null) options.logBase = DEFAULT_LOGBASE;
            if(options.method==null) options.method = this.METHOD_REPEATING;
            if(options.baseValues==null) options.stops = [1,2,5,3,7,4,6,8,9];
            if(options.doublingOriginAtFraction==null) options.doublingOriginAtFraction = 0.5;
            if(options.lengthWhenPivoting==null) options.lengthWhenPivoting = 44;
            if(options.isPivotAuto==null) options.isPivotAuto = true;

            if(options.formatterRemovePrefix==null) options.formatterRemovePrefix = false;

            if(options.formatter==null) options.formatter = function(d){
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
                    case   5: d = d/1000000; prefix = "M"; prec = 1; break; //0.1M
                    case   6: d = d/1000000; prefix = "M"; break; //1M
                    case   7: d = d/1000000; prefix = "M"; break; //10M
                    case   8: d = d/1000000; prefix = "M"; break; //100M
                    case   9: d = d/1000000000; prefix = "B"; break; //1B
                    case  10: d = d/1000000000; prefix = "B"; break; //10B
                    case  11: d = d/1000000000; prefix = "B"; break; //100B
                    //use the D3 SI formatting for the extreme cases
                    default: return (d3.format("."+prec+"s")(d)).replace("G","B");
                }


                // use manual formatting for the cases above
                return (d3.format("."+prec+format)(d)+prefix).replace("G","B");
            }
            if(options.widthToFontsizeRatio==null) options.widthToFontsizeRatio = 0.75;
            if(options.heightToFontsizeRatio==null) options.heightToFontsizeRatio = 1.20;
            if(options.cssFontSize==null) options.cssFontSize = "13px";
            if(options.cssMarginLeft==null||parseInt(options.cssMarginLeft)<0) options.cssMarginLeft = "5px";
            if(options.cssMarginRight==null||parseInt(options.cssMarginRight)<0) options.cssMarginRight = "5px";
            if(options.cssMarginTop==null||parseInt(options.cssMarginTop)<0) options.cssMarginTop = "5px";
            if(options.cssMarginBottom==null||parseInt(options.cssMarginBottom)<0) options.cssMarginBottom = "5px";
            if(options.toolMargin==null) options.toolMargin = {left: 5, bottom: 5, right: 5, top: 5};

            if(options.tickSpacing==null)options.tickSpacing = 50;
            if(options.showOuter==null)options.showOuter = true;
            if(options.limitMaxTickNumber==null)options.limitMaxTickNumber = 10;

            var orient = this.orient()=="top"||this.orient()=="bottom"?HORIZONTAL:VERTICAL;




            if(options.widthOfOneDigit==null) options.widthOfOneDigit =
                parseInt(options.cssFontSize)*options.widthToFontsizeRatio;
            if(options.heightOfOneDigit==null) options.heightOfOneDigit =
                parseInt(options.cssFontSize)*options.heightToFontsizeRatio;

            var domain = axis.scale().domain();
            var range = axis.scale().range()
            var min = d3.min([domain[0],domain[domain.length-1]]);
            var max = d3.max([domain[0],domain[domain.length-1]]);


            //take 17 sample values and measure the longest formatted label
            var maximumDigitsCount = d3.max(
                d3.range(min, max, (max-min)/17).map(function(d){return options.formatter(d).length})
                );

            var longestLabelLength =
                //calculate the number of symbols needed for the values
                maximumDigitsCount*options.widthOfOneDigit
                //add left and right margins
                +parseInt(options.cssMarginLeft)
                +parseInt(options.cssMarginRight)
            ;

            axis.pivot = options.isPivotAuto && (longestLabelLength + axis.tickPadding() + axis.tickSize() 
                                                 > options.lengthWhenPivoting);

            var spaceOneLabel = (axis.pivot || orient == HORIZONTAL)? longestLabelLength : (
                //calculate the number of symbols needed for the values
                options.heightOfOneDigit
                //add left and right margins
                +parseInt(options.cssMarginTop)
                +parseInt(options.cssMarginBottom) )

            var ticksNumber = 5;
            var tickValues = [];
            var lengthDomain = Math.abs(domain[domain.length-1] - domain[0]);
            var lengthRange = Math.abs(range[range.length-1] - range[0]);


            console.log("********** "+orient+" **********");
            console.log("min max ", min, max);
            console.log("w h of one digit " + options.widthOfOneDigit + " " + options.heightOfOneDigit);
            console.log("margins LRTB: " + options.cssMarginLeft + " " + options.cssMarginRight + " " + options.cssMarginTop + " " + options.cssMarginBottom);
            console.log("expected digits " + maximumDigitsCount);
            console.log("space for one label " + Math.round(spaceOneLabel));


            var getBaseLog = function(x, base) {
                if(base == null) base = options.logBase;
                return Math.log(x) / Math.log(base);
            };

            var onlyUnique = function(value, index, self) {
                return self.indexOf(value) === index;
            }

            
            var labelsFitIntoScale = function(tickValues, lengthRange, approximationStyle){
                if (approximationStyle==null) approximationStyle = PESSIMISTIC;
                
                if(orient==HORIZONTAL && axis.pivot || orient==VERTICAL && !axis.pivot){
                    //labels stack on top of each other. digit height matters
                    return lengthRange >
                        tickValues.length * (
                            options.heightOfOneDigit +
                            parseInt(options.cssMarginTop) +
                            parseInt(options.cssMarginBottom)
                        );
                }else{
                    //labels stack side by side. label width matters
                    return lengthRange >
                        tickValues.length * (
                            parseInt(options.cssMarginLeft) +
                            parseInt(options.cssMarginRight) 
                        )
                        + (approximationStyle == PESSIMISTIC ?
                            options.widthOfOneDigit *
                            tickValues.length * d3.max(tickValues.map(function(d){return options.formatter(d).length}))
                            : 0)
                        + (approximationStyle == OPTIMISTIC ?
                            options.widthOfOneDigit * (
                            tickValues.map(function(d){return options.formatter(d)}).join("").length
                            )
                            : 0);
                }
            }

            var groupByDoublingPace = function(array){
                console.log("before sorting",array)
                
                var result = [];
                var taken = [];
                if(array.indexOf(0)!=-1){
                    result.push([0]);
                    taken.push(array.indexOf(0));
                }
                for(var k = array.length; k>=1; k/=2){
                    result.push(array.filter(function(d,i){
                        if(i % Math.floor(k) == 0 && taken.indexOf(i)==-1){
                            taken.push(i);
                            return true;
                        }
                        return false;
                    }));
                }
                
                
                console.log("aftere sorting",result)
                return result;
            }
            


            if(options.scaleType=="genericLog"){
                var eps = axis.scale().eps();
                var delta = axis.scale().delta();
                var bothSidesUsed = (min<0 && max >0);

//                if(min<=0 && max>=0)tickValues.push(0);
//                if(options.showOuter)tickValues.push(max);
//                if(options.showOuter)tickValues.push(min);

                if(options.method == this.METHOD_REPEATING){
                    
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
                    
                    
                    var spawn = groupByDoublingPace( spawnZero.concat(spawnPos).concat(spawnNeg).sort(d3.ascending) );
                    

                    options.stops.forEach(function(stop, i){
                        if(i==0){
                            spawn.forEach(function(sGroup, k){
                                    var trytofit = tickValues.concat( sGroup.map(function(d){return d*stop})
                                                    .filter(function(d){
                                                        return d==0 || !bothSidesUsed ||
                                                            
                                                            
                                                            Math.abs(axis.scale()(d) - axis.scale()(0))
                                                            >  (axis.pivot && orient==VERTICAL || !axis.pivot && orient == HORIZONTAL? 
                                                                    (options.formatter(d).length+1)*options.widthOfOneDigit/2
                                                                    :
                                                                    (options.heightOfOneDigit)
                                                                )
                                                            
                                                        
                                                    })                
                                                    )
                                                    .filter(onlyUnique);
                                    if(!labelsFitIntoScale(trytofit, lengthRange)) return;
                                    tickValues = trytofit;
                                })
                            
                            //flatten the spawn array
                            spawn = [].concat.apply([], spawn);
                        }else{
                            var trytofit = tickValues.concat(spawn.map(function(d){return d*stop}))
                                                    .filter(onlyUnique).filter(function(d){return min<=d&&d<=max});
                            
                            if(!labelsFitIntoScale(trytofit, lengthRange)) return;
                            if(tickValues.length > options.limitMaxTickNumber && options.limitMaxTickNumber!=0) return;
                            
                            tickValues = trytofit;
                        }
                    })


                }else if(options.method == this.METHOD_DOUBLING) {

                    // check if spawn positive is needed. if yes then spawn!
                    var startPos = max<eps? null :
                    Math.pow(options.logBase,  Math.floor((Math.ceil(getBaseLog(max) + Math.ceil(getBaseLog(Math.max(eps,min)))))*options.doublingOriginAtFraction) )

                    // check if spawn negative is needed. if yes then spawn!
                    var startNeg = min>-eps? null :
                    - Math.pow(options.logBase,  Math.floor((Math.ceil(getBaseLog(-min) + Math.ceil(getBaseLog(Math.max(eps,-max)))))*options.doublingOriginAtFraction) )


                    if(startPos){ for(var l=startPos; l<max; l*=2) tickValues.push(l);}
                    if(startPos){ for(var l=startPos/2; l>Math.max(min,eps); l/=2) tickValues.push(l);}
                    if(startNeg){ for(var l=startNeg; l>min; l*=2) tickValues.push(l);}
                    if(startNeg){ for(var l=startNeg/2; l<Math.min(max,-eps); l/=2) tickValues.push(l);}

                }





            tickValues = tickValues
                .filter(function(d, i){ return Math.min(min,max)<=d && d<=Math.max(min,max); })
                .sort(d3.descending);

            
            if (min==max)tickValues = [min];
                
            axis.repositionLabels = repositionLabelsThatStickOut(tickValues, options, orient, axis);
            
                
            } //logarithmic

            
            
            
            
            if(options.scaleType=="linear"){
                tickValues = null;
                ticksNumber = Math.max(lengthRange / options.tickSpacing, 2);
            }



console.log("final result",tickValues);

            return axis
                .ticks(ticksNumber)
                .tickFormat(options.formatter)
                .tickValues(tickValues);
        };

        
        
        function repositionLabelsThatStickOut(tickValues, options, orient, axis){
                
            // make an abstraction layer for margin sizes
            var margin = 
                orient==VERTICAL?
                {head: options.toolMargin.top, tail: options.toolMargin.bottom}
                :
                {head: options.toolMargin.left, tail: options.toolMargin.right};
            
            // check which dimension requires shifting
            var dimension = (axis.pivot&&orient==VERTICAL || !axis.pivot&&orient==HORIZONTAL)? "x":"y";
            
            var result = {};
            
            // for each label
            tickValues.forEach(function(d,i){
                
                // compute the influence of the axis head
                var repositionHead = margin.head
                    + axis.scale()(d)
                    - (dimension=="x") * options.formatter(d).length * options.widthOfOneDigit / 2
                    - (dimension=="y") * options.heightOfOneDigit / 2
                    // we may consider or not the label margins to give them a bit of spacing from the edges
                    //- (dimension=="x") * parseInt(options.cssMarginRight);
                    //- (dimension=="y") * parseInt(options.cssMarginTop);
                
                // compute the influence of the axis tail
                var repositionTail = margin.tail 
                    + d3.max(axis.scale().range()) - axis.scale()(d)
                    - (dimension=="x") * options.formatter(d).length * options.widthOfOneDigit / 2
                    - (dimension=="y") * options.heightOfOneDigit / 2
                    // we may consider or not the label margins to give them a bit of spacing from the edges
                    //- (dimension=="x") * parseInt(options.cssMarginLeft);
                    //- (dimension=="y") * parseInt(options.cssMarginBottom);
                
                // apply limits to cancel repositioning of labels that are far from the edge
                if(repositionHead>0)repositionHead=0;
                if(repositionTail>0)repositionTail=0;
                
                // add them up with appropriate signs
                var repositionBoth =
                    (orient==HORIZONTAL?-1:1) * repositionHead + 
                    (orient==VERTICAL?-1:1) * repositionTail;

                // save to the axis
                result[i] = {x:0, y:0};
                result[i][dimension] = (dimension=="y"?-1:1) * repositionBoth;
            });
            
            return result;
        }
        
        

        return _super;
    };







});
