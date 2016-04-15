//  d3.scale.genericLogNew
export default function genericLogNew() {
  return function d3_scale_genericLogNew(logScale) {
    var _this = this;
    var scales = [];
    var domainParts = [];
    var eps = 0.1;
    var delta = 5;
    var domain = logScale.domain();
    var range = logScale.range();
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
          range: fakeRange,
          scale: d3.scale.linear().domain(fakeDomain).range(fakeRange)
      };
    };

    var _buildLogScale = function(fakeDomain, fakeRange, revertDomain) {
      var absDomain = fakeDomain;
      if (revertDomain) {
        absDomain = abs(fakeDomain); 
      }
      return {
        domain: fakeDomain,
        range: fakeRange,
        scale: d3.scale.linear().domain(absDomain).range(fakeRange)
      };
    };

    
    var buildScales = function () {
      rangePointingForward = range[0] < range[range.length - 1];
      scales = [];
      if (domainParts.length == 1) {
        if (domainParts[0][0] <= 0 && domainParts[0][1] >= 0) {
          scales = [_buildLinearScale(domainParts[0], range)];
        } else {
          scales = [_buildLogScale(domainParts[0], range, domainParts[0][0] <= 0)];
        }
      } else {
        var domainLength = abs([d3.max(domain), d3.min(domain)]).reduce(function (a, b) { return a + b });
        var rangeLength = abs([d3.max(range), d3.min(range)]).reduce(function (a, b) { return a + b });

        var firstRangePoint = 0, secondRangePoint = 0, firstEps = 0, secondEps = 0;

        var minRangePoint = logScale(eps * 2);
          
        if (domain[0] != 0) 
          firstRangePoint = logScale(abs(domain[0]));
        if (domain[domain.length - 1] != 0) 
          secondRangePoint = logScale(abs(domain[domain.length - 1]));

        if (abs(domain[0]) > eps)
          firstEps = minRangePoint;
        if (abs(domain[domain.length - 1]) > eps)
          secondEps = minRangePoint;
        
        var rangePointLength = rangeLength / (firstRangePoint + secondRangePoint + firstEps + secondEps);

        var point;
        if (domainParts.length == 2) {
          // example: [-eps..0,eps][eps, val]
          if (domainParts[0][0] == 0 || abs(domainParts[0][0]) <= eps) {
            point = range[0] + firstRangePoint * rangePointLength * domainPointingForward
              + secondEps * rangePointLength * domainPointingForward;
            scales = [
              _buildLinearScale(domainParts[0], [range[0], point]),
              _buildLogScale(domainParts[1], [point,  range[0]])
            ];
          } else if (domainParts[1][1] == 0 || abs(domainParts[1][1]) <= eps) {// example: [-val,-eps][-eps, 0..eps]
            point = range[1] - rangePointLength * secondEps * domainPointingForward
                      - rangePointLength * secondRangePoint * domainPointingForward;
            scales = [
              _buildLogScale(domainParts[0], [range[0], point]),
              _buildLinearScale(domainParts[0], [point, range[1]])
            ];
           }
        } else {
          var point1 = range[0] + rangePointLength * firstRangePoint * domainPointingForward;
          var point2 = range[1] - rangePointLength * secondRangePoint * domainPointingForward;
          scales = [
            _buildLogScale(domainParts[0], [range[0], point1]),
            _buildLinearScale(domainParts[1], [point1, point2]),
            _buildLogScale(domainParts[2], [point2, range[1]])
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
      var addSubdomain = function(first, second) {
        if (domainPointingForward) {
          domainParts.push([first, second]);
        } else {
          domainParts.unshift([second, first]);
        }
      };
      while (start != end) {
        if (start < 0) {
          if (start >= -eps) {
            if (end <= eps) {
              addSubdomain(start, end);
              start = end;
            } else {
              addSubdomain(start, eps);
              start = eps;
            }
          } else {
            addSubdomain(start, -eps);
            start = -eps;
          }
        } else if (start == 0) {
          if (end <= eps) {
            addSubdomain(start, end);
            start = end;
          } else {
            addSubdomain(start, eps);
            start = eps;
          }
        } else {
          addSubdomain(start, end);
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
            scale = scales[i];
            if (x >= scale.domain[0] && x <= scale.domain[1]) {
              return scale;  
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
            if (x <= scale.domain[0] && x >= scale.domain[1]) {
              return scale;
            }
          }
        }
      }
    };
    
    var getScaleByRange = function(x) {
      if (rangePointingForward) {
        if (x < range[0]) {
          return scales[0].scale;
        } else if (x > range[range.length - 1]) {
          return scales[scales.length - 1].scale;
        } else {
          for (var i = 0; i < scales.length; i++) {
            var scalePart = scales[i];
            if (x >= scalePart.range[0] && x <= scalePart.range[1]) {
              return scalePart.scale;
            }
          }
        }
      } else {
        if (x > range[0]) {
          return scales[0].scale;
        } else if (x < range[range.length - 1]) {
          return scales[scales.length - 1].scale;
        } else {
          for (var i = 0; i < scales.length; i++) {
            var scalePart = scales[i];
            if (x <= scale.range[0] && x >= scale.range[1]) {
              return scale;
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

    var oneside = function(arg) {
      var sign = Math.sign(arg[0]);
      for(var i = 0; i < arg.length; i++) {
        if(Math.sign(arg[i]) != sign)
          return false;
      }
      return true;
    };
    function scale(x) {
      return _getScaleByDomain(x).scale(x);
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
    scale.domain = function(_arg) {
      if(!arguments.length)
        return domain;
      // this is an internal array, it will be modified. the input _arg should stay intact
      domain = _arg;

      var arg = [];
      if(_arg.length != 2)
        console.warn(
          'generic log scale is best for 2 values in domain, but it tries to support other cases too'
        );
      switch(_arg.length) {
        // if no values are given, reset input to the default domain (do nothing)
        case 0:
          arg = domain;
          break;
        // use the given value as a center, get the domain /2 and *2 around it
        case 1:
          arg = [
            _arg[0] / 2,
            _arg[0] * 2
          ];
          break;
        // two is the standard case. just use these
        case 2:
          arg = [
            _arg[0],
            _arg[1]
          ];
          break;
        // use the edge values as domain, center as ±epsilon
        case 3:
          arg = [
            _arg[0],
            _arg[2]
          ];
          eps = abs(_arg[1]);
          break;
        default:
          arg = [
            _arg[0],
            _arg[_arg.length - 1]
          ];
          eps = d3.min(abs(_arg.filter(function(d, i) {
            return i != 0 && i != _arg.length - 1;
          })));
          break;
      }
      //if the domain is just a single value
      if(arg[0] == arg[1]) {
        arg[0] = arg[0] / 2;
        arg[1] = arg[1] * 2;
      }
      domain = arg;
      buildDomain();
      return scale;
    };
    
    scale.range = function(arg) {
      if(!arguments.length)
        return range;
      range = arg;
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
        case 2:
          break;
        // use the edge values as range, center as delta
        case 3:
          delta = arg[1];
          arg = [
            arg[0],
            arg[2]
          ];
          break;
        // use the edge values as range, the minimum of the rest be the delta
        default:
          delta = d3.min(arg.filter(function(d, i) {
            return i != 0 && i != arg.length - 1;
          }));
          arg = [
            arg[0],
            arg[arg.length - 1]
          ];
          break;
      }
      
      //console.log("LOG and LIN range:", logScale.range(), linScale.range());
      range = arg;
      buildScales();
      return scale;
    };
    
    scale.invert = function(arg) {
      return getScaleByRange(arg).invert(arg);
    };
    scale.copy = function() {
      return d3_scale_genericLogNew(d3.scale.log().domain([
        1,
        10
      ])).domain(domain).range(range).eps(eps);
    };
    return d3.rebind(scale, logScale, 'base', 'rangeRound', 'interpolate', 'clamp', 'nice',
      'tickFormat',
      'ticks');
  }(d3.scale.log().domain([0.1, 200]).range([0, 1000]));
};