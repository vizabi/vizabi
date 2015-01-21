define(['d3'], function (d3) {

    d3.scale.genericLog = function () {


        return function d3_scale_genericLog(logScale) {

            var _this = this;
            var zeroEpsilonDomain = 0.001;
            var zeroEpsilonRange = 5;

            var linScale = d3.scale.linear().domain([0, zeroEpsilonDomain]);

            var domain = logScale.domain();
            var range = logScale.range();
            var useLinear = false;


            function scale(x) {
                if (x > zeroEpsilonDomain) return logScale(x);
                if (x < -zeroEpsilonDomain) return -logScale(-x)+d3.max(linScale.range());
                if (0 <= x && x <= zeroEpsilonDomain) return linScale(x);
                if (-zeroEpsilonDomain <= x && x < 0) return -linScale(-x)+d3.max(linScale.range());
            }

            scale.zeroEpsilonDomain = function (arg) {
                if (!arguments.length) return zeroEpsilonDomain;
                zeroEpsilonDomain = arg;
                return scale;
            }

            scale.domain = function (arg) {
                if (!arguments.length) return domain;

                if (arg.length == 2) {
                    //check if the domain has negative or near-zero values
                    if (arg[0] >= zeroEpsilonDomain) {
                        //then fallback to a regular log scale. nothing special
                        logScale.domain(arg);
                        useLinear = false;
                    } else {
                        //replace part of the scale with a linear insertion
                        logScale.domain([zeroEpsilonDomain, d3.max(arg.map(Math.abs))]);
                        linScale.domain([d3.min(arg.map(Math.abs)), zeroEpsilonDomain]);
                        useLinear = true;
                    }
                }
                domain = arg;
                return scale;
            };


            scale.range = function (arg) {
                if (!arguments.length) return range;

                if (arg.length == 2) {
                    //check if the domain has negative or near-zero values
                    if (domain[0] >= zeroEpsilonDomain) {
                        //then fallback to a regular log scale. nothing special
                        logScale.range(arg);
                    } else {
                        //replace part of the scale with a linear insertion
                        logScale.range([d3.max(arg) - zeroEpsilonRange, d3.min(arg)]);
                        linScale.range([d3.max(arg), d3.max(arg)/2 - zeroEpsilonRange]);
                    }
                }

                range = arg;
                return scale;
            };


            scale.copy = function () {
                return d3_scale_genericLog(logScale.copy());
            };

            return d3.rebind(scale, logScale, "invert", "base", "rangeRound", "interpolate", "clamp", "nice", "tickFormat", "ticks");
        }(d3.scale.log().domain([1, 10]));

    }










});
