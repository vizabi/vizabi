//  d3.scale.genericLog
export default function genericLog() {
  return (function d3_scale_genericLog(logScale) {
    const _this = this;
    let scales = [];
    let domainParts = [];
    let eps = 0.1;
    let delta = 5;
    let domain = logScale.domain();
    let range = logScale.range();
    let interpolator = null;
    let rangePointingForward, domainPointingForward;

    const abs = function(arg) {
      if (arg instanceof Array)
        return arg.map(d => Math.abs(d));
      return Math.abs(arg);
    };

    const _buildLinearScale = function(fakeDomain, fakeRange) {
      return {
        domain: fakeDomain,
        sign: 1,
        range: fakeRange,
        scale: d3.scale.linear().domain(fakeDomain).range(fakeRange)
      };
    };

    const _buildLogScale = function(fakeDomain, fakeRange, revertDomain) {
      let normalizedDomain = fakeDomain;
      //var normalizedRange = fakeRange.slice(0);
      if (revertDomain) {
        normalizedDomain = abs(fakeDomain);
        //fakeRange.reverse();
      }
      return {
        domain: fakeDomain,
        sign: revertDomain ? -1 : 1,
        range: fakeRange,
        scale: d3.scale.log().domain(normalizedDomain).range(fakeRange)
      };
    };


    const buildScales = function() {
      rangePointingForward = range[0] < range[range.length - 1];
      const rangePointingSign = rangePointingForward ? 1 : -1;
      scales = [];
      if (domainParts.length == 1) {
        if (domainParts[0][0] <= 0 && domainParts[0][1] >= 0) {
          scales = [_buildLinearScale(domainParts[0], range)];
        } else {
          scales = [_buildLogScale(domainParts[0], range, domainParts[0][0] <= 0)];
        }
      } else {
        const maxDomain = d3.max(abs(domain));
        let rangeLength = abs(d3.max(range) - d3.min(range));
        let rangePointKoef = 1;
        let firstRangePoint = 0, secondRangePoint = 0, firstEps = 0, secondEps = 0;
        logScale.domain([eps, maxDomain]).range([0, rangeLength]);
        const minRangePoint = delta;//logScale(eps * 2);
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

        let point1, point2;
        if (domainParts.length == 2) {
          // example: [-eps..0,eps][eps, val]
          if (domain[0] == 0 || abs(domain[0]) <= eps) {
            point1 = range[0] + firstRangePoint * rangePointKoef * rangePointingSign
              + secondEps * rangePointingSign;
            scales = [
              _buildLinearScale(domainParts[0], [range[0], point1]),
              _buildLogScale(domainParts[1], [point1,  range[range.length - 1]], !domainPointingForward)
            ];
          } else if (domain[domain.length - 1] == 0 || abs(domain[domain.length - 1]) <= eps) { // example: [-val,-eps][-eps, 0..eps]
            point1 = range[range.length - 1] - (firstEps + secondEps) * rangePointKoef * rangePointingSign;
            scales = [
              _buildLogScale(domainParts[0], [range[0], point1], domainPointingForward),
              _buildLinearScale(domainParts[1], [point1, range[range.length - 1]])
            ];
          }
        } else {
          point1 = range[0] + rangeLength / (1 / rangePointKoef + 1) * rangePointingSign;
          point2 = range[0] + (rangeLength / (1 / rangePointKoef + 1) + firstEps + secondEps) * rangePointingSign;
          scales = [
            _buildLogScale(domainParts[0], [range[0], point1], domainPointingForward),
            _buildLinearScale(domainParts[1], [point1, point2]),
            _buildLogScale(domainParts[2], [point2, range[range.length - 1]], !domainPointingForward)
          ];
        }
      }
    };

    const buildDomain = function() {
      domainPointingForward = domain[0] < domain[domain.length - 1];
      domainParts = [];
      if ((d3.min(domain) > 0 && d3.max(domain) > 0) || (d3.min(domain) < 0 && d3.max(domain) < 0)) {
        domainParts = [domain];
      } else {
        let start, end;
        if (domainPointingForward) {
          start = domain[0];
          end = domain[domain.length - 1];
        } else {
          start = domain[domain.length - 1];
          end = domain[0];
        }
        const _addSubdomain = function(first, second) {
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
      }
      buildScales();
    };

    const _getScaleByDomain = function(x) {
      if (domainPointingForward) {
        if (x < domain[0]) {
          return scales[0];
        } else if (x > domain[domain.length - 1]) {
          return scales[scales.length - 1];
        }

        for (let i = 0; i < scales.length; i++) {
          if (x >= scales[i].domain[0] && x <= scales[i].domain[scales[i].domain.length - 1]) {
            return scales[i];
          }
        }

      } else {
        if (x > domain[0]) {
          return scales[0];
        } else if (x < domain[domain.length - 1]) {
          return scales[scales.length - 1];
        }

        for (let i = 0; i < scales.length; i++) {
          if (x <= scales[i].domain[0] && x >= scales[i].domain[scales[i].domain.length - 1]) {
            return scales[i];
          }
        }

      }
    };

    const getScaleByRange = function(x) {
      if (rangePointingForward) {
        if (x < range[0]) {
          return scales[0];
        } else if (x > range[range.length - 1]) {
          return scales[scales.length - 1];
        }

        for (let i = 0; i < scales.length; i++) {
          if (x >= scales[i].range[0] && x <= scales[i].range[scales[i].range.length - 1]) {
            return scales[i];
          }
        }

      } else {
        if (x > range[0]) {
          return scales[0];
        } else if (x < range[range.length - 1]) {
          return scales[scales.length - 1];
        }

        for (let i = 0; i < scales.length; i++) {
          if (x <= scales[i].range[0] && x >= scales[i].range[1]) {
            return scales[i];
          }
        }

      }
    };

    //polyfill for IE11
    Math.sign = Math.sign || function(x) {
      x = +x;
      if (x === 0 || isNaN(x)) {
        return x;
      }
      return x > 0 ? 1 : -1;
    };

    function scale(x) {
      const currScale = _getScaleByDomain(x);

      return interpolator ?
        interpolator(currScale.scale(x * currScale.sign)) :
        currScale.scale(x * currScale.sign);
    }

    scale.eps = function(arg) {
      if (!arguments.length)
        return eps;
      eps = arg;
      scale.domain(domain);
      return scale;
    };

    scale.delta = function(arg) {
      if (!arguments.length)
        return delta;
      delta = arg;
      scale.range(range);
      return scale;
    };

    scale.domain = function(arg) {
      if (!arguments.length)
        return domain;

      // this is an internal array, it will be modified. the input _arg should stay intact
      switch (arg.length) {
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
      if (arg[0] == arg[arg.length - 1]) {
        arg[0] /= 2;
        arg[arg.length - 1] = arg[arg.length - 1] * 2;
      }
      domain = arg;
      const min = d3.min(abs(domain).filter(val => !!val));
      if (min) eps = Math.min(eps, min / 100);
      buildDomain();
      return scale;
    };


    scale.range = function(arg, force) {
      if (!arguments.length)
        return interpolator ? interpolator.range() : range;

      switch (arg.length) {
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
      if (interpolator && !force) {
        interpolator.range(arg);
      } else {
        range = arg;
        const min = d3.min(abs(range).filter(val => !!val));

        if (min) delta = Math.min(delta, min / 100);
        buildScales();
      }
      return scale;
    };

    scale.interpolate = function(arg) {
      interpolator = d3.scale.linear().domain(domain).range(range).interpolate(arg);
      scale.range(interpolator.domain(), true);
      return scale;
    };

    scale.invert = function(arg) {
      const currScale = getScaleByRange(arg);
      return currScale.scale.invert(arg) * currScale.sign;
    };

    scale.ticks = function(arg) {
      let partTicks;
      const ticks = [];
      for (let i = 0; i < scales.length; i++) {
        if (scales[i].sign == -1) {
          partTicks = scales[i].scale.ticks().reverse().map(val => val * -1);
        } else {
          partTicks = scales[i].scale.ticks();
        }
        if (ticks.length > 0 && partTicks.length > 0 && ticks[ticks.length - 1] == partTicks[0]) {
          partTicks.splice(0, 1);
        }
        ticks.push(...partTicks);
      }
      return ticks;
    };

    scale.copy = function() {
      return d3_scale_genericLog(logScale).domain(domain).range(range).delta(delta).eps(eps);
    };

    return d3.rebind(scale, logScale, "base", "rangeRound", "clamp", "nice",
      "tickFormat");
  })(d3.scale.log().domain([0.1, 200]).range([0, 1000]));
}
