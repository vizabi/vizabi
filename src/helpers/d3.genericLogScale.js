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
      if (!arguments.length) return linearScale.domain();
      linearScale.domain(x);
      return scale;
    };
    scale.range = function(x) {
      if (!arguments.length) return logScale.range();
      logScale.range(x);
      return scale;
    };
    scale.interpolate = function(x) {
      if (!arguments.length) return logScale.interpolate();
      logScale.interpolate(x);
      return scale;
    };

    scale.ticks = function(m) {
      return logScale.ticks(m);
    };
    scale.invert = function(m) {
      return linearScale.invert(logScale.invert(m));
    };
    scale.copy = function() {
      return d3_scale_genericLog().domain(scale.domain()).range(scale.range());
    };


    return d3.rebind(scale, logScale, 'base', 'rangeRound', 'interpolate', 'clamp', 'nice',
      'tickFormat',
      'ticks');

  }();
};