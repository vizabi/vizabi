//  d3.scale.genericLog
export default function genericLog() {
    return function d3_scale_genericLog() {
      var PROJECTION=[1,100];
      var linearScale, logScale;

      linearScale=d3.scale.linear();
      linearScale.range(PROJECTION);

      logScale=d3.scale.log();
      logScale.domain(PROJECTION);


      function scale(x) {
        return logScale(linearScale(x));
      }
      scale.domain = function(x) {
        if (!arguments.length) {
          var domain = logScale.range().map(function(d) {
            console.log(linearScale.invert(d));
            return logScale(d);
          });
          console.log(domain);
          return linearScale.domain();
        } 
        linearScale.domain(x);
        return scale;
      };
      scale.range = function(x) {
        if (!arguments.length) return logScale.range();
        logScale.range(x);
        return scale;
      };
      scale.interpolate = function(m) {
        if (!arguments.length) return logScale.interpolate(m);
        logScale.interpolate(m);
        return scale;
      };

      scale.ticks = function(m) {
        return linearScale.ticks(m);
      };
      
      scale.invert = function(m) {
        return linearScale.invert(m);
      };
      return scale;
    }();
};