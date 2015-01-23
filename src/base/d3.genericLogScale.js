define(['d3'], function (d3) {

    d3.scale.genericLog = function () {


        return function d3_scale_genericLog(logScale) {

            var _this = this;
            var eps = 0.001;
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
                var shift = 0;
                var shift2 = 0;
                //console.log(domain, range)
                if(d3.min(domain)<0 && d3.max(domain)>0){
                    //ratio shows how the + and - scale should fit as compared to a simple + or - scale
                    var ratio = ( d3.max(range) + d3.max(range) - logScale(d3.min(abs(domain))) ) / d3.max(range);
                    var shift = linScale(0)/ratio;
                    //if(abs(domain[0])>abs(domain[1])) shift2 = logScale(d3.min(abs(domain)))/ratio;
                    if(abs(domain[0])>abs(domain[1]) && domain[0]<0 && domain[1]>0) shift2 = logScale(d3.min(abs(domain)))/ratio;
                    console.log(ratio, shift)
                }
                //console.log(domain, range)
                if (x > eps) return logScale(x)/ratio - shift2;
                if (x < -eps) return -logScale(-x)/ratio+d3.max(range)/ratio + shift - shift2;
                if (0 <= x && x <= eps) return linScale(x)/ratio - shift2 ;
                if (-eps <= x && x < 0) return -linScale(-x)/ratio+d3.max(range)/ratio + shift - shift2;
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

            scale.domain = function (arg) {
                if (!arguments.length) return domain;

                if(arg.length!=2)console.warn("generic log scale is best for 2 values in domain, but it tries to support other cases too");
                switch (arg.length){
                    // reset input to the default domain
                    case 0: arg = domain; break;
                    // use the only value as a center, get the domain /2 and *2 around it
                    case 1: arg = [arg[0]/2, arg[0]*2]; break;
                    // two is the standard case. do nothing
                    case 2: arg = arg; break;
                    // use the edge values as domain, center as epsilon
                    case 3: eps = arg[1]; arg = [arg[0], arg[2]]; break;
                    // use the edge values as domain, the minimum of the rest be the epsilon
                    default: eps = d3.min(arg.filter(function(d, i){return i!=0 && i!=arg.length-1}));
                            arg = [arg[0], arg[arg.length-1]];
                            break;
                }


                //if the desired domain is one-seded and lies away from 0±epsilon
                if(oneside(arg) && d3.min(abs(arg)) >= eps) {

                    //if the desired domain is all positive
                    if(arg[0]>0 && arg[1]>0){
                        //then fallback to a regular log scale. nothing special
                        logScale.domain(arg);
                    }else{
                        //otherwise it's all negative, we take absolute and swap the arguments
                        logScale.domain([-arg[1], -arg[0]]);
                    }

                    useLinear = false;

                //if the desired domain is one-sided and takes part of or lies within 0±epsilon
                } else if (oneside(arg) && d3.min(abs(arg)) < eps) {


                    //if the desired domain is all positive
                    if(arg[0]>0 && arg[1]>0){
                        //the domain is all positive

                        //check the direction of the domain
                        if(arg[0]<=arg[1]){
                            //if the domain is pointing right
                            logScale.domain([eps,arg[1]]);
                            linScale.domain([0,eps]);
                        }else{
                            //if the domain is pointing left
                            logScale.domain([arg[0],eps]);
                            linScale.domain([eps,0]);
                        }
                    }else{
                        //otherwise it's all negative, we take absolute and swap the arguments

                        //check the direction of the domain
                        if(arg[0]<=arg[1]){
                            //if the domain is pointing right
                            logScale.domain([eps,-arg[0]]);
                            linScale.domain([0,eps]);
                        }else{
                            //if the domain is pointing left
                            logScale.domain([-arg[1],eps]);
                            linScale.domain([eps,0]);
                        }
                    }

                    useLinear = true;

                // if the desired domain is two-sided and fully or partially covers 0±epsilon
                } else if (!oneside(arg)){

                    //check the direction of the domain
                    if(arg[0]<=arg[1]){
                        //if the domain is pointing right
                        logScale.domain([eps,d3.max(abs(arg))]);
                        linScale.domain([0,eps]);
                    }else{
                        //if the domain is pointing left
                        logScale.domain([d3.max(abs(arg)),eps]);
                        linScale.domain([eps,0]);
                    }

                    useLinear = true;
                }


console.log("LOG scale domain:", logScale.domain());
if(useLinear)console.log("LIN scale domain:", linScale.domain());
                domain = arg;
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
                    if(arg[0]<=arg[1]){
                        //range is pointing right
                        logScale.range([delta, arg[1]]);
                        linScale.range([0, delta]);
                    }else{
                        //range is pointing left

                        //check where domain is pointing
                        if(domain[0]>=domain[1]){
                            //domain is pointing right
                            logScale.range([arg[0], delta]);
                            linScale.range([delta, 0]);
                        }else{
                            //domain is pointing left
                            logScale.range([arg[0]-delta, 0]);
                            linScale.range([arg[0], arg[0]-delta]);
                        }
                    }
                }


console.log("LOG scale range:", logScale.range());
if(useLinear)console.log("LIN scale range:", linScale.range());
                range = arg;
                return scale;
            };





            scale.copy = function () {
                return d3_scale_genericLog(d3.scale.log().domain([1, 10])).domain(domain).range(range).eps(eps).delta(delta);
            };

            return d3.rebind(scale, logScale, "invert", "base", "rangeRound", "interpolate", "clamp", "nice", "tickFormat", "ticks");
        }(d3.scale.log().domain([1, 10]));

    }










});
