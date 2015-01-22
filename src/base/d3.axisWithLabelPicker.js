define(['d3'], function(d3){

    d3.svg.axisSmart = function(){
        var VERTICAL = 'ordinate axis';
        var HORIZONTAL = 'absciss axis';
        var METHOD_REPEATING = 'repeating specified powers';
        var METHOD_DOUBLING = 'doubling the value';
        var DEFAULT_LOGBASE = 10;

        var _super = d3.svg.axis();
        _super.smartLabeler = function(options){
            var axis = this;

            if(options==null) options = {}
            if(options.scaleType==null) {console.warn('please set scaleType to "lin", "log", "ordinal"'); return axis;};
            if(options.scaleType=='ordinal') return axis.tickValues(null);

            if(options.logBase==null) options.logBase = DEFAULT_LOGBASE;
            if(options.method==null) options.method = METHOD_REPEATING;
            if(options.baseValues==null) options.stops = [1,5,2,7,3,4,6,8,9];
            if(options.lengthWhenPivoting==null) options.lengthWhenPivoting = 44;
            if(options.isPivotAuto==null) options.isPivotAuto = true;
            if(options.formatter==null) options.formatter = d3.format(",.1s");
            if(options.widthToFontsizeRatio==null) options.widthToFontsizeRatio = 0.75;
            if(options.cssFontSize==null) options.cssFontSize = "13px";
            if(options.cssMarginLeft==null||options.cssMarginLeft=="0px") options.cssMarginLeft = "10px";
            if(options.cssMarginRight==null||options.cssMarginRight=="0px") options.cssMarginRight = "10px";
            if(options.tickSpacing==null)options.tickSpacing = 50;
            if(options.showOuter==null)options.showOuter = true;
            if(options.limitMaxTickNumber==null)options.limitMaxTickNumber = 10;


            if(options.widthOfOneDigit==null) options.widthOfOneDigit =
                parseInt(options.cssFontSize)*options.widthToFontsizeRatio;

            var min = d3.min(axis.scale().domain());
            var max = d3.max(axis.scale().domain());



            var zero;
            if(min==0){}


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


            //console.log(orientation);
//            console.log("expected digits " + longestLabelLength);
//            console.log("space for one label " + Math.round(spaceOneLabel));


            var getBaseLog = function(x, base) {
                if(base == null) base = options.logBase;
                return Math.log(x) / Math.log(base);
            };


            if(options.scaleType=="genericLog"){
                var zeroEpsilonDomain = axis.scale().eps();

                var minLog = Math.max(min, zeroEpsilonDomain)
                var maxLog = max;


                if(options.method == METHOD_REPEATING){
                    var spawn = d3.range(
                            Math.ceil(getBaseLog(minLog)),
                            Math.ceil(getBaseLog(maxLog)),
                            min>max? -1 : 1)
                        .map(function(d){return Math.pow(options.logBase, d)});


                    if(options.showOuter)tickValues.push(max);

                    options.stops.forEach(function(stop){
                        //skip populating when there is no space on the screen
                        if(lengthRange / tickValues.length < spaceOneLabel) return;
                        if(tickValues.length > options.limitMaxTickNumber) return;
                        //populate the stops in the order of importance
                        tickValues = tickValues.concat(spawn.map(function(d){return d*stop}));
                    })

                    if(!options.showOuter)tickValues.splice(tickValues.indexOf(min),1);

                }else if(options.method == METHOD_DOUBLING) {
                    var spawn = d3.range(
                            Math.ceil(getBaseLog(this.scale().domain()[0],2)),
                            Math.ceil(getBaseLog(this.scale().domain()[1],2)),
                            min>max? -1 : 1)
                        .map(function(d){return Math.pow(2, d)});

                    tickValues = spawn;
                }


            tickValues = tickValues.filter(function(d, i){ return Math.min(min,max)<=d && d<=Math.max(min,max); });
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
//            console.log("===========");
            return axis
                .ticks(ticksNumber)
                .tickFormat(options.formatter)
                .tickValues(tickValues);
        };


        return _super;
    };







});
