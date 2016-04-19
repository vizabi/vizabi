//  d3.scale.genericLog
export default function genericLog() {
  return function d3_scale_genericLog(logScale) {
    var _this = this;
    var scales = [];
    var domainParts = [];
    var eps = 0.1;
    var delta = 5;
    var domain = logScale.domain();
    var range = logScale.range();
    var interpolator = null;
    var rangePointingForward, domainPointingForward;

    var abs = function (arg) {
      if (arg instanceof Array)
        return arg.map(function (d) {
          return Math.abs(d);
        });
      return Math.abs(arg);
    };

    var _buildLinearScale = function(fakeDomain, fakeRange) {
      return {
        domain: fakeDomain,
        sign: 1,
        range: fakeRange,
        scale: d3.scale.linear().domain(fakeDomain).range(fakeRange)
      };
    };

    var _buildLogScale = function(fakeDomain, fakeRange, revertDomain) {
      var normalizedDomain = fakeDomain;
      //var normalizedRange = fakeRange.slice(0);
      if (revertDomain) {
        normalizedDomain = abs(fakeDomain);
        //fakeRange.reverse();
      }
      return {
        domain: fakeDomain,
        sign: revertDomain?-1:1,
        range: fakeRange,
        scale: d3.scale.log().domain(normalizedDomain).range(fakeRange)
      };
    };


    var buildScales = function () {
      rangePointingForward = range[0] < range[range.length - 1];
      var rangePointingSign = rangePointingForward ? 1 : -1;
      scales = [];
      if (domainParts.length == 1) {
        if (domainParts[0][0] <= 0 && domainParts[0][1] >= 0) {
          scales = [_buildLinearScale(domainParts[0], range)];
        } else {
          scales = [_buildLogScale(domainParts[0], range, domainParts[0][0] <= 0)];
        }
      } else {
        var maxDomain = d3.max(abs(domain));
        var rangeLength = abs(d3.max(range) - d3.min(range));
        var minRangePoint, rangePointKoef = 1;
        var firstRangePoint = 0, secondRangePoint = 0, firstEps = 0, secondEps = 0;
        logScale.domain([eps, maxDomain]).range([0, rangeLength]);
        minRangePoint = delta;//logScale(eps * 2);
        if (domain[0] != 0 && abs(domain[0]) > eps)
          firstRangePoint = logScale(abs(domain[0]));
        if (domain[domain.length - 1] != 0  && abs(domain.length - 1) > eps)
          secondRangePoint = logScale(abs(domain[domain.length - 1]));

        if (abs(domain[0]) > eps)
          firstEps = minRangePoint;

        if (abs(domain[domain.length - 1]) > eps)
          secondEps = minRangePoint;

        rangeLength = rangeLength - firstEps - secondEps;
        if (secondRangePoint != 0) rangePointKoef = abs((firstRangePoint) / (secondRangePoint));

        var point1, point2;
        if (domainParts.length == 2) {
          // example: [-eps..0,eps][eps, val]
          if (domain[0] == 0 || abs(domain[0]) <= eps) {
            point1 = range[0] + firstRangePoint * rangePointKoef * rangePointingSign
              + secondEps * rangePointingSign;
            scales = [
              _buildLinearScale(domainParts[0], [range[0], point1]),
              _buildLogScale(domainParts[1], [point1,  range[1]], !domainPointingForward)
            ];
          } else if (domain[domain.length - 1] == 0 || abs(domain[domain.length - 1]) <= eps) {// example: [-val,-eps][-eps, 0..eps]
            point1 = range[range.length - 1] - (firstEps + secondEps) * rangePointKoef * rangePointingSign
            scales = [
              _buildLogScale(domainParts[0], [range[0], point1], domainPointingForward),
              _buildLinearScale(domainParts[1], [point1, range[range.length - 1]])
            ];
          }
        } else {
          point1 = range[0] + rangeLength / (1/rangePointKoef + 1) * rangePointingSign;
          point2 = range[0] + (rangeLength / (1/rangePointKoef + 1) + firstEps + secondEps) * rangePointingSign;
          scales = [
            _buildLogScale(domainParts[0], [range[0], point1], domainPointingForward),
            _buildLinearScale(domainParts[1], [point1, point2]),
            _buildLogScale(domainParts[2], [point2, range[1]], !domainPointingForward)
          ];
        }
      }
    };

    var buildDomain = function () {
      domainPointingForward = domain[0] < domain[domain.length - 1];

      if ((d3.min(domain) > 0 && d3.max(domain) > 0) || (d3.min(domain) < 0 && d3.max(domain) < 0)) {
        domainParts = [domain];
        return;
      }

      domainParts = [];
      var start, end;
      if (domainPointingForward) {
        start = domain[0];
        end = domain[domain.length - 1];
      } else {
        start = domain[domain.length - 1];
        end = domain[0];
      }
      var _addSubdomain = function(first, second) {
        if (domainPointingForward) {
          domainParts.push([first, second]);
        } else {
          domainParts.unshift([second, first]);
        }
      };
      while (start != end) {
        if (end <= -eps || (start >= -eps && end <= eps) || start >= eps) {
          _addSubdomain(start, end);
          start = end;
        } else if (start < -eps && end >= -eps) {
          _addSubdomain(start, -eps);
          start = -eps;
        } else if (start >= -eps && end >= eps) {
          _addSubdomain(start, eps);
          start = eps;
        } else {
          console.warn("Something wrong while build subdomains: " + start + " " + end);
          start = end;
        }
      }
      buildScales();
    };

    var _getScaleByDomain = function(x) {
      if (domainPointingForward) {
        if (x < domain[0]) {
          return scales[0];
        } else if (x > domain[domain.length - 1]) {
          return scales[scales.length - 1];
        } else {
          for (var i = 0; i < scales.length; i++) {
            if (x >= scales[i].domain[0] && x <= scales[i].domain[1]) {
              return scales[i];
            }
          }
        }
      } else {
        if (x > domain[0]) {
          return scales[0];
        } else if (x < domain[domain.length - 1]) {
          return scales[scales.length - 1];
        } else {
          for (var i = 0; i < scales.length; i++) {
            scale = scales[i];
            if (x <= scales[i].domain[0] && x >= scales[i].domain[1]) {
              return scales[i];
            }
          }
        }
      }
    };

    var getScaleByRange = function(x) {
      if (rangePointingForward) {
        if (x < range[0]) {
          return scales[0];
        } else if (x > range[range.length - 1]) {
          return scales[scales.length - 1];
        } else {
          for (var i = 0; i < scales.length; i++) {
            if (x >= scales[i].range[0] && x <= scales[i].range[1]) {
              return scales[i];
            }
          }
        }
      } else {
        if (x > range[0]) {
          return scales[0];
        } else if (x < range[range.length - 1]) {
          return scales[scales.length - 1];
        } else {
          for (var i = 0; i < scales.length; i++) {
            var scalePart = scales[i];
            if (x <= scales[i].range[0] && x >= scales[i].range[1]) {
              return scales[i];
            }
          }
        }
      }
    };

    //polyfill for IE11
    Math.sign = Math.sign || function (x) {
        x = +x;
        if (x === 0 || isNaN(x)) {
          return x;
        }
        return x > 0 ? 1 : -1;
      }

    function scale(x) {
      var currScale = _getScaleByDomain(x);
      if (interpolator) {
        return interpolator(currScale.scale(x * currScale.sign));
      } else {
        return currScale.scale(x * currScale.sign);
      }
    }

    scale.eps = function(arg) {
      if(!arguments.length)
        return eps;
      eps = arg;
      scale.domain(domain);
      return scale;
    };

    scale.delta = function(arg) {
      if(!arguments.length)
        return delta;
      delta = arg;
      scale.range(range);
      return scale;
    };

    scale.domain = function(arg) {
      if(!arguments.length)
        return domain;
      
      // this is an internal array, it will be modified. the input _arg should stay intact
      var min = d3.min(abs(domain));
      if (min != 0) {
        eps = Math.min(eps, min/100);
      }
      if(arg.length != 2)
        console.warn(
          'generic log scale is best for 2 values in domain, but it tries to support other cases too'
        );
      switch(arg.length) {
        // if no values are given, reset input to the default domain (do nothing)
        case 0:
          arg = domain;
          break;
        // use the given value as a center, get the domain /2 and *2 around it
        case 1:
          arg = [
            arg[0] / 2,
            arg[0] * 2
          ];
          break;
      }
      //if the domain is just a single value
      if(arg[0] == arg[arg.length - 1]) {
        arg[0] = arg[0] / 2;
        arg[arg.length - 1] = arg[arg.length - 1] * 2;
      }
      domain = arg;
      buildDomain();
      return scale;
    };

    
    scale.range = function(arg) {
      if(!arguments.length)
        return range;
      if(arg.length != 2)
        console.warn(
          'generic log scale is best for 2 values in range, but it tries to support other cases too');
      
      switch(arg.length) {
        // reset input to the default range
        case 0:
          arg = range;
          break;
        // use the only value as a center, get the range ±100 around it
        case 1:
          arg = [
            arg[0] - 100,
            arg[0] + 100
          ];
          break;
        // two is the standard case. do nothing
      }

      //console.log("LOG and LIN range:", logScale.range(), linScale.range());
      range = arg;
      buildScales();
      return scale;
    };

    scale.interpolate = function(arg) {
      interpolator = d3.scale.linear().domain(domain).range(range).interpolate(arg);
      scale.range(interpolator.domain());
      return scale;
    };

    scale.invert = function(arg) {
      var currScale = getScaleByRange(arg);
      return currScale.scale.invert(arg) * currScale.sign;
    };

    scale.ticks = function(arg) {
      var ticks = [], partTicks;
      for (var i = 0; i < scales.length; i++) {
        if (scales[i].sign == -1) {
          partTicks = scales[i].scale.ticks().reverse().map(function(val){ return val * -1 });
        } else {
          partTicks = scales[i].scale.ticks();
        }
        if (ticks.length > 0 && partTicks.length > 0 && ticks[ticks.length - 1] == partTicks[0]) {
          partTicks.splice(0, 1);
        }
        ticks.push.apply(ticks, partTicks);
      }
      return ticks;
    };

    scale.copy = function() {
      return d3_scale_genericLog(logScale).domain(domain).range(range).delta(delta).eps(eps);
    };

    return d3.rebind(scale, logScale, 'base', 'rangeRound', 'clamp', 'nice',
      'tickFormat');
  }(d3.scale.log().domain([0.1, 200]).range([0, 1000]));
};