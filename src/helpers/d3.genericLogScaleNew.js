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
          sign: 1,
          range: fakeRange,
          scale: d3.scale.linear().domain(fakeDomain).range(fakeRange)
      };
    };

    var _buildLogScale = function(fakeDomain, fakeRange, revertDomain) {
      var normalizedDomain = fakeDomain;
      var normalizedRange = fakeRange.slice(0);
      if (revertDomain) {
        normalizedDomain = abs(fakeDomain).reverse();
        fakeRange.reverse();
      }
      return {
        domain: fakeDomain,
        sign: revertDomain?-1:1, 
        range: normalizedRange,
        scale: d3.scale.linear().domain(normalizedDomain).range(fakeRange)
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
        var maxDomain = d3.max(abs(domain));
        var rangeLength = abs(d3.max(range) - d3.min(range));
        var minRangePoint, koef;
        logScale.domain([eps, maxDomain]).range([delta, rangeLength]);
        minRangePoint = logScale(eps);
        firstRangePoint = logScale(abs(domain[0]));
        secondRangePoint = logScale(abs(domain[domain.length - 1]));
        koef = (firstRangePoint - minRangePoint) / (secondRangePoint - minRangePoint);
        console.log("first: " + firstRangePoint + " second: " + secondRangePoint + " koef: " + koef);


        logScale.range([delta + 1000, rangeLength + 1000]);
        minRangePoint = logScale(eps);
        firstRangePoint = logScale(abs(domain[0]));
        secondRangePoint = logScale(abs(domain[domain.length - 1]));
        koef = (firstRangePoint - minRangePoint) / (secondRangePoint - minRangePoint);
        console.log("first: " + firstRangePoint + " second: " + secondRangePoint + " koef: " + koef);


        var firstRangePoint = 0, secondRangePoint = 0, firstEps = 0, secondEps = 0;
        
        
        if (domain[0] != 0) 
          firstRangePoint = logScale(abs(domain[0]));
        if (domain[domain.length - 1] != 0) 
          secondRangePoint = logScale(abs(domain[domain.length - 1]));

        if (abs(domain[0]) > eps)
          firstEps = minRangePoint;
        if (abs(domain[domain.length - 1]) > eps)
          secondEps = minRangePoint;
        
        var rangePointKoef = firstRangePoint/secondRangePoint;
        var point;
        if (domainParts.length == 2) {
          // example: [-eps..0,eps][eps, val]
          if (domainParts[0][0] == 0 || abs(domainParts[0][0]) <= eps) {
            point = range[0] + firstRangePoint * rangePointKoef * domainPointingForward
              + secondEps;
            scales = [
              _buildLinearScale(domainParts[0], [range[0], point]),
              _buildLogScale(domainParts[1], [point,  range[0]])
            ];
          } else if (domainParts[1][1] == 0 || abs(domainParts[1][1]) <= eps) {// example: [-val,-eps][-eps, 0..eps]
            point = range[1] - secondEps * rangePointKoef * domainPointingForward
                      - rangePointKoef * secondRangePoint * domainPointingForward;
            scales = [
              _buildLogScale(domainParts[0], [range[0], point]),
              _buildLinearScale(domainParts[0], [point, range[1]])
            ];
           }
        } else {
          var point1 = range[0] + rangeLength / rangePointKoef - firstEps;
          var point2 = range[0] +  + rangeLength / rangePointKoef + secondEps;
          scales = [
            _buildLogScale(domainParts[0], [range[0], point1], true),
            _buildLinearScale(domainParts[1], [point1, point2]),
            _buildLogScale(domainParts[2], [point2, range[1]])
          ];
          
        }
      }
      console.log(scales);
      console.log("1: " + (scale(0) - scale(-70)) + " 2: " + (scale(70) - scale(0)));
      
/*
      console.log("1: " + (scale(0) - scale(- 10)) + " 2: " +  (scale(10) - scale(0)));
      console.log("1: " + (scale(0) - scale(-81.7)) + " 2: " +  (scale(81.7) - scale(0)));
      var scale0 = scale(0);
      console.log(scale0);
      var scaleEps1 = scale(0 - eps*2);
      var scaleEps2 = scale(eps*2);

      console.log("-eps scale: " + scaleEps1 + " zero: " + scale0 + " eps scale: " + scaleEps2);
      console.log("eps koef:" + (scale0 - scaleEps1)/(scaleEps2 - scale0));

      console.log(scales);
      var scale1 = scale(domain[0]);
      console.log(scale1);
      var scale2 = scale(domain[1]);
      console.log("min scale: " + scale1 + " zero: " + scale0 + " max scale: " + scale2);
      console.log("koef:" + (scale0 - scale1)/(scale2 - scale0));
*/
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
      return currScale.scale(x * currScale.sign);
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
      var currScale = getScaleByRange(arg);
      return currScale.scale.invert(arg) * currScale.sign;
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