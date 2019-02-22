//  d3.scaleGenericlog
export default function genericLog() {
  return (function d3_scale_genericLog(scale) {
    const _this = this;
    const defaultConstant = 0.1;

    const abs = function(arg) {
      if (arg instanceof Array)
        return arg.map(d => Math.abs(d));
      return Math.abs(arg);
    };

    const scaleDomain = scale.domain;
    scale.domain = function(domain) {
      if (!arguments.length) {
        return scaleDomain();
      }
      const min = d3.min(abs(domain).filter(val => !!val));
      //if (min) scale.constant(Math.min(defaultConstant, min / 100));

      return scaleDomain(domain);
    };

    const scaleCopy = scale.copy;
    scale.copy = function() {
      return d3_scale_genericLog(scaleCopy());
    };

    return scale;
  })(d3.scaleSymlog().constant(0.1));
}
