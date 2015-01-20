define(['d3'], function(d3){


    d3.scale.genericLog = function() {
        return GenericLog();
    };
    function GenericLog() {
        var PROJECTION=[1,10];
        var linearScale, logScale;

        linearScale=d3.scale.linear();
        linearScale.range(PROJECTION);

        logScale=d3.scale.log();
        logScale.domain(PROJECTION);

        function scale(x) {
            return logScale(linearScale(x));
        }
        scale.domain = function(x) {
            if (!arguments.length) return linearScale.domain();
            linearScale.domain(x);
            return scale;
        };
        scale.range = function(x) {
            if (!arguments.length) return logScale.range();
            logScale.range(x);
            return scale;
        };
        scale.ticks = function(m) {
            return linearScale.ticks(m);
        };
        return scale;

    }



});
