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
    var maxRangePoint, controlRangePoint, minRangePoint, coefficient;
    var rangeZeroPoint = logScale(0);  
    var useLinear = false;
    
    var abs = function(arg) {
      if(arg instanceof Array)
        return arg.map(function(d) {
          return Math.abs(d);
        });
      return Math.abs(arg);
    };
    
    var getScale = function(scaleType, domain, range) {
        
    };
    
    var buildScale = function() {
      if ((d3.min(domain) > 0 && d3.max(domain) > 0) || (d3.min(domain) < 0 && d3.max(domain) < 0)) {
        if (d3.min(domain) > 0 && d3.max(domain) > 0) {
          scaleParts = [{
            domain: domain,
            range: range
          }];
        }
        rangeZeroPoint = null;
        return;
      }
      var domainLength = abs(domain).reduce(function(a, b) {return a + b});
      logScale.domain([eps, d3.max(abs(domain))]);
      minRangePoint = logScale(eps * 2);
      if (d3.min(domain) == 0 || d3.max(domain) == 0) { // zero point is domain extremum 
        if (d3.min(domain) == 0) { // all values positive
          if (domain[0] == 0) { //direction forward
            if (domain[domain.length - 1] <= eps) {
              domainParts = [domain];  
            } else {
              domainParts = [[0, eps], [eps, domain[domain.length - 1]]];
            }
            rangeZeroPoint = range[0];
          } else { // direction backward
            if (domain[0] >= eps) {
              domainParts = [domain];
            } else {
              domainParts = [[domain[0], -eps], [-eps, 0]];
            }
            rangeZeroPoint = range[range.length - 1];
          }
        } else { // all values negative include zero
          if (domain[0] == 0) { //direction backward
            rangeZeroPoint = range[0];
          } else { // direction backward
            rangeZeroPoint = range[range.length - 1];
          }
        }
      } else { // zero somewhere on domain

        var startRangePoint = logScale(abs(domain[0]));
        var endRangePoint = logScale(abs(domain[domain.length - 1]));
        var domainPointLength = domainLength / (startRangePoint + endRangePoint + minRangePoint * 2);
        var pointSign = domain[0] < domain[domain.length - 1] ? 1 : -1; 
        var rangeZeroPoint = range[0] + pointSign * startRangePoint * domainPointLength + pointSign * minRangePoint;
      }
      
    };
    var getNumericDomain = function() {
      console.log(logScale)
    };
    var buildScale = function() {
      var domain = sqrtScale.range();
      
      console.log(sqrtScale.invert(0));
      console.log(sqrtScale.domain());
      console.log(domain);
    };
    
    //polyfill for IE11
    Math.sign = Math.sign || function(x) {
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
      var ratio = 1;
      var shiftNeg = 0;
      var shiftPos = 0;
      var shiftAll = 0;
      //console.log("DOMAIN log lin", logScale.domain(), linScale.domain());
      //console.log("RANGE log lin", logScale.range(), linScale.range());
      var domainPointingForward = domain[0] < domain[domain.length - 1];
      var rangePointingForward = range[0] < range[range.length - 1];
      if(d3.min(domain) < 0 && d3.max(domain) > 0) {
        var minAbsDomain = d3.min(abs([
          domain[0],
          domain[domain.length - 1]
        ]));
        //var maxAbsDomain = d3.max(abs([ domain[0], domain[domain.length-1] ]));
        //ratio shows how the + and - scale should fit as compared to a simple + or - scale
        ratio = domainPointingForward != rangePointingForward ? (d3.max(range) + d3.max(range) - logScale(
          Math.max(
            eps, minAbsDomain))) / d3.max(range) : (d3.max(range) + logScale(Math.max(eps,
          minAbsDomain))) / d3.max(
          range);
        if(domainPointingForward && !rangePointingForward) {
          shiftNeg = (d3.max(range) + linScale(0)) / ratio;
          // if the bottom is heavier we need to shift the entire chart
          if(abs(domain[0]) > abs(domain[domain.length - 1]))
            shiftAll -= logScale(Math.max(eps, minAbsDomain)) / ratio;
        } else if(!domainPointingForward && !rangePointingForward) {
          shiftAll = logScale(Math.max(eps, minAbsDomain)) / ratio;
          //if the top is heavier we need to shift the entire chart
          if(abs(domain[0]) < abs(domain[domain.length - 1]))
            shiftAll += (d3.max(range) - logScale(Math.max(eps, minAbsDomain))) / ratio;
        } else if(domainPointingForward && rangePointingForward) {
          shiftAll = d3.max(range) / ratio;
          // if the top is heavier we need to shift the entire chart
          if(abs(domain[0]) < abs(domain[domain.length - 1]))
            shiftAll -= (d3.max(range) - logScale(Math.max(eps, minAbsDomain))) / ratio;
        } else if(!domainPointingForward && rangePointingForward) {
          shiftNeg = (d3.max(range) + linScale(0)) / ratio;
          //if the top is heavier we need to shift the entire chart
          if(abs(domain[0]) < abs(domain[domain.length - 1]))
            shiftAll -= logScale(Math.max(eps, minAbsDomain)) / ratio;
        }
      } else if(d3.min(domain) < 0 && d3.max(domain) < 0) {
        shiftNeg = d3.max(range);
      }
      if(x > eps)
        return logScale(x) / ratio + shiftAll + shiftPos;
      if(x < -eps)
        return -logScale(-x) / ratio + shiftAll + shiftNeg;
      if(0 <= x && x <= eps)
        return linScale(x) / ratio + shiftAll + shiftPos;
      if(-eps <= x && x < 0)
        return -linScale(-x) / ratio + shiftAll + shiftNeg;
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
      sqrtScale.range(arg);
      buildScale();
      //if the desired domain is one-seded
      if(oneside(arg) && d3.min(abs(arg)) >= eps) {
        //if the desired domain is above +epsilon
        if(arg[0] > 0 && arg[1] > 0) {
          //then fallback to a regular log scale. nothing special
          logScale.domain(arg);
        } else {
          //otherwise it's all negative, we take absolute and swap the arguments
          logScale.domain([-arg[1], -arg[0]]);
        }
        useLinear = false; //if the desired domain is one-sided and takes part of or falls within 0±epsilon
      } else if(oneside(arg) && d3.min(abs(arg)) < eps) {
        //if the desired domain is all positive
        if(arg[0] > 0 && arg[1] > 0) {
          //the domain is all positive
          //check the direction of the domain
          if(arg[0] <= arg[1]) {
            //if the domain is pointing forward
            logScale.domain([
              eps,
              arg[1]
            ]);
            linScale.domain([
              0,
              eps
            ]);
          } else {
            //if the domain is pointing backward
            logScale.domain([
              arg[0],
              eps
            ]);
            linScale.domain([
              eps,
              0
            ]);
          }
        } else {
          //otherwise it's all negative, we take absolute and swap the arguments
          //check the direction of the domain
          if(arg[0] <= arg[1]) {
            //if the domain is pointing forward
            logScale.domain([
              eps, -arg[0]
            ]);
            linScale.domain([
              0,
              eps
            ]);
          } else {
            //if the domain is pointing backward
            logScale.domain([-arg[1],
              eps
            ]);
            linScale.domain([
              eps,
              0
            ]);
          }
        }
        useLinear = true; // if the desired domain is two-sided and fully or partially covers 0±epsilon
      } else if(!oneside(arg)) {
        //check the direction of the domain
        if(arg[0] <= arg[1]) {
          //if the domain is pointing forward
          logScale.domain([
            eps,
            d3.max(abs(arg))
          ]);
          linScale.domain([
            0,
            eps
          ]);
        } else {
          //if the domain is pointing backward
          logScale.domain([
            d3.max(abs(arg)),
            eps
          ]);
          linScale.domain([
            eps,
            0
          ]);
        }
        useLinear = true;
      }
      //
      //console.log("LOG scale domain:", logScale.domain());
      //if(useLinear)console.log("LIN scale domain:", linScale.domain());
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
        case 2:
          arg = arg;
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
      sqrtScale.domain(arg);
      buildScale();
      if(!useLinear) {
        logScale.range(arg);
      } else {
        if(arg[0] < arg[1]) {
          //range is pointing forward
          //check where domain is pointing
          if(domain[0] < domain[domain.length - 1]) {
            //domain is pointing forward
            logScale.range([
              delta,
              arg[1]
            ]);
            linScale.range([
              0,
              delta
            ]);
          } else {
            //domain is pointing backward
            logScale.range([
              0,
              arg[1] - delta
            ]);
            linScale.range([
              arg[1] - delta,
              arg[1]
            ]);
          }
        } else {
          //range is pointing backward
          //check where domain is pointing
          if(domain[0] < domain[domain.length - 1]) {
            //domain is pointing forward
            logScale.range([
              arg[0] - delta,
              0
            ]);
            linScale.range([
              arg[0],
              arg[0] - delta
            ]);
          } else {
            //domain is pointing backward
            logScale.range([
              arg[0],
              delta
            ]);
            linScale.range([
              delta,
              0
            ]);
          }
        }
      }
      //
      //console.log("LOG and LIN range:", logScale.range(), linScale.range());
      range = arg;
      return scale;
    };
    scale.invert = function(arg) {
      return sqrtScale(arg);
    };
    scale.copy = function() {
      return d3_scale_genericLogNew(d3.scale.log().domain([
        1,
        10
      ])).domain(domain).range(range).eps(eps).interpolate(scale.interpolate());
    };
    return d3.rebind(scale, logScale, 'base', 'rangeRound', 'interpolate', 'clamp', 'nice',
      'tickFormat',
      'ticks');
  }(d3.scale.log().domain([0.1, 200]).range([0, 1000]));
};