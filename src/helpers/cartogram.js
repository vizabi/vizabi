import topojson from 'helpers/topojson';
import * as utils from 'base/utils';
(function(exports) {

  /*
   * d3.cartogram is a d3-friendly implementation of An Algorithm to Construct
   * Continuous Area Cartograms:
   *
   * <http://chrisman.scg.ulaval.ca/G360/dougenik.pdf>
   *
   * It requires topojson to decode TopoJSON-encoded topologies:
   *
   * <http://github.com/mbostock/topojson/>
   *
   * Usage:
   *
   * var cartogram = d3.cartogram()
   *  .projection(d3.geo.albersUsa())
   *  .value(function(d) {
   *    return Math.random() * 100;
   *  });
   * d3.json("path/to/topology.json", function(topology) {
   *  var features = cartogram(topology, topology.objects.OBJECTNAME.geometries);
   *  d3.select("svg").selectAll("path")
   *    .data(features)
   *    .enter()
   *    .append("path")
   *      .attr("d", cartogram.path);
   * });
   */
  d3.cartogram = function() {

    function carto(topology, geometries, totalValue) {

      var calculateObjectsMeta = function(objects, values, path) {
        return new Promise(function(resolve, reject) {
          var areas = objects.map(path.area);
          var totalArea = d3.sum(areas),
            sizeErrorsTot =0,
            sizeErrorsNum=0;

          var calculateMeta = function(index, cb) {
            var area = Math.abs(areas[index]), // XXX: why do we have negative areas?
              v = +values[index],
              desired = totalArea * v / totalValue,
              radius = Math.sqrt(area / Math.PI),
              mass = Math.sqrt(desired / Math.PI) - radius,
              sizeError = Math.max(area, desired) / Math.min(area, desired);
            // console.log(o.id, "@", j, "area:", area, "value:", v, "->", desired, radius, mass, sizeError);
            cb({
              id: objects[index].id,
              area: area,
              centroid: path.centroid(objects[index]),
              value: v,
              desired: desired,
              radius: radius,
              mass: mass,
              sizeError: sizeError
            });
          };
          var calculateMetaSequence = function(index) {
            if (index >= objects.length) {
              return resolve({ meta: meta, sizeError: (sizeErrorsTot/sizeErrorsNum) });
            }
            calculateMeta(index, function(response) {
              meta.push(response);
              sizeErrorsTot+=response.sizeError;
              sizeErrorsNum++;
              if (index % 400 == 0) {
                utils.defer(function() {
                  calculateMetaSequence(++index);
                });
              } else {
                calculateMetaSequence(++index);
              }
            });
          };
          var meta = [];
          calculateMetaSequence(0);
        });
      };
      // copy it first
      return new Promise(function(resolve, reject) {
        topology = copy(topology);

        // objects are projected into screen coordinates

        // project the arcs into screen space
        var tf = transformer(topology.transform), x, y, len1, i1, out1, len2=topology.arcs.length, i2=0,
          projectedArcs = new Array(len2);
        var projectedArcsDefer = new Promise();
        var generateTopologySegment = function(segmentIndex, segmentLength) {
          return new Promise(function(resolve, reject) {
            i1 = 0;
            while (i1<segmentLength) {
              topology.arcs[segmentIndex][i1][0] = (x += topology.arcs[segmentIndex][i1][0]);
              topology.arcs[segmentIndex][i1][1] = (y += topology.arcs[segmentIndex][i1][1]);
              out1[i1] = projection === null ? tf(topology.arcs[segmentIndex][i1]) : projection(tf(topology.arcs[segmentIndex][i1]));
              i1++;
            }
            resolve(out1);
          });

        };
        var generateTopologyArcs = function(index, totalLength) {
          if (index >= totalLength) {
            return projectedArcsDefer.resolve(projectedArcs);
          }
          x = 0;
          y = 0;
          len1 = topology.arcs[index].length;
          i1 = 0;
          out1 = new Array(len1);

          generateTopologySegment(index, len1).then(function(segment) {
            projectedArcs[index++]=segment;
            if (index % 400 == 0) {
              utils.defer(function() {
                generateTopologyArcs(index, totalLength);
              });
            } else {
              generateTopologyArcs(index, totalLength);
            }
          });
        };
        generateTopologyArcs(0, len2);

        projectedArcsDefer.then(function(projectedArcs) {
          // path with identity projection
          var path = d3.geo.path()
            .projection(null);
          var objects = object(projectedArcs, { type: "GeometryCollection", geometries: geometries })
            .geometries.map(function(geom) {
              return {
                type: "Feature",
                id: geom.id,
                properties: properties.call(null, geom, topology),
                geometry: geom
              };
            });
          var values = objects.map(value);
          if (!totalValue) {
            totalValue = d3.sum(values);
          }
          // no iterations; just return the features
          if (iterations <= 0) {
            resolve({
              features: objects,
              arcs: projectedArcs
            });
          }
          var i = 0;
          var resizeSegments = function(index, iterations) {
            if (index >= iterations) {
              return iterationsDefer.resolve();
            }
            calculateObjectsMeta(objects, values, path).then(function(response) {
              var forceReductionFactor = 1 / (1 + response.sizeError);

              // console.log("meta:", meta);
              // console.log("  total area:", totalArea);
              // console.log("  force reduction factor:", forceReductionFactor, "mean error:", sizeError);
              var delta, centroid, mass, radius, rSquared, dx, dy, distSquared, dist, Fij;
              var updatePoint = function(i2, len2) {
                var len1, i1, delta, len3, i3, centroid, mass, radius, rSquared, dx, dy, distSquared, dist, Fij;
                while (i2<len2) {
                  len1=projectedArcs[i2].length;
                  i1=0;
                  while (i1<len1) {
                    // create an array of vectors: [x, y]
                    delta = [0, 0];
                    len3 = response.meta.length;
                    i3=0;
                    while (i3<len3) {
                      centroid =  response.meta[i3].centroid;
                      mass =      response.meta[i3].mass;
                      radius =    response.meta[i3].radius;
                      rSquared = (radius*radius);
                      dx = projectedArcs[i2][i1][0] - centroid[0];
                      dy = projectedArcs[i2][i1][1] - centroid[1];
                      distSquared = dx * dx + dy * dy;
                      dist=Math.sqrt(distSquared);
                      Fij = (dist > radius)
                        ? mass * radius / dist
                        : mass *
                      (distSquared / rSquared) *
                      (4 - 3 * dist / radius);
                      delta[0]+=(Fij * cosArctan(dy, dx));
                      delta[1]+=(Fij * sinArctan(dy, dx));
                      i3++;
                    }
                    projectedArcs[i2][i1][0] += (delta[0]*forceReductionFactor);
                    projectedArcs[i2][i1][1] += (delta[1]*forceReductionFactor);
                    i1++;
                  }
                  i2++;
                }
              };
              var updatePointSequence = function(start) {
                if (start >= projectedArcs.length) {
                  if (response.sizeError <= 1) {
                    resizeSegments(iterations, iterations);
                    return;
                  }
                  utils.defer(function() {
                    resizeSegments(++index, iterations);
                  });
                  return;
                }
                var end = Math.min(start + 400, projectedArcs.length);
                updatePoint(start, end);
                utils.defer(function() {
                  updatePointSequence(end);
                });
              };
              updatePointSequence(0);
              // break if we hit the target size error
            });
          };
          var iterationsDefer = new Promise();

          resizeSegments(0, iterations);
          iterationsDefer.then(function() {
            resolve({
              features: objects,
              arcs: projectedArcs
            });
          });
        });

/*
        while(i2<len2){
          x = 0;
          y = 0;
          len1 = topology.arcs[i2].length;
          i1 = 0;
          out1 = new Array(len1);
          while(i1<len1){
            topology.arcs[i2][i1][0] = (x += topology.arcs[i2][i1][0]);
            topology.arcs[i2][i1][1] = (y += topology.arcs[i2][i1][1]);
            out1[i1] = projection === null ? tf(topology.arcs[i2][i1]) : projection(tf(topology.arcs[i2][i1]));
            i1++;
          }
          projectedArcs[i2++]=out1;

        }
*/
      });

    }

    var iterations = 8,
        projection = d3.geo.albers(),
        properties = function(id) {
          return {};
        },
        value = function(d) {
          return 1;
        };

    // for convenience
    carto.path = d3.geo.path()
      .projection(null);

    carto.iterations = function(i) {
      if (arguments.length) {
        iterations = i;
        return carto;
      } else {
        return iterations;
      }
    };

    carto.value = function(v) {
      if (arguments.length) {
        value = d3.functor(v);
        return carto;
      } else {
        return value;
      }
    };

    carto.projection = function(p) {
      if (arguments.length) {
        projection = p;
        return carto;
      } else {
        return projection;
      }
    };

    carto.feature = function(topology, geom) {
      return {
        type: "Feature",
        id: geom.id,
        properties: properties.call(null, geom, topology),
        geometry: {
          type: geom.type,
          coordinates: topojson.feature(topology, geom).geometry.coordinates
        }
      };
    };

    carto.meshArcs = function(topology, o, filter) {
      var arcs = [];

      function arc(i) {
        var j = i < 0 ? ~i : i;
        (geomsByArc[j] || (geomsByArc[j] = [])).push({
          i: i,
          g: geom
        });
      }

      function line(arcs) {
        arcs.forEach(arc);
      }

      function polygon(arcs) {
        arcs.forEach(line);
      }

      function geometry(o) {
        if (o.type === "GeometryCollection") o.geometries.forEach(geometry);
        else if (o.type in geometryType) geom = o, geometryType[o.type](o.arcs);
      }

      if (arguments.length > 1) {
        var geomsByArc = [],
          geom;

        var geometryType = {
          LineString: line,
          MultiLineString: polygon,
          Polygon: polygon,
          MultiPolygon: function(arcs) {
            arcs.forEach(polygon);
          }
        };

        geometry(o);

        geomsByArc.forEach(arguments.length < 3 ? function(geoms) {
          arcs.push(geoms[0].i);
        } : function(geoms) {
          if (filter(geoms[0].g, geoms[geoms.length - 1].g)) arcs.push(geoms[0].i);
        });
      } else {
        for (var i = 0, n = topology.arcs.length; i < n; ++i) arcs.push(i);
      }

      return arcs;
    };

    carto.stitchArcs = function(topology, arcs) {
      var stitchedArcs = {},
        fragmentByStart = {},
        fragmentByEnd = {},
        fragments = [],
        emptyIndex = -1;

      // Stitch empty arcs first, since they may be subsumed by other arcs.
      arcs.forEach(function(i, j) {
        var arc = topology.arcs[i < 0 ? ~i : i],
          t;
        if (arc.length < 3 && !arc[1][0] && !arc[1][1]) {
          t = arcs[++emptyIndex], arcs[emptyIndex] = i, arcs[j] = t;
        }
      });

      arcs.forEach(function(i) {
        var e = ends(i),
          start = e[0],
          end = e[1],
          f, g;

        if (f = fragmentByEnd[start]) {
          delete fragmentByEnd[f.end];
          f.push(i);
          f.end = end;
          if (g = fragmentByStart[end]) {
            delete fragmentByStart[g.start];
            var fg = g === f ? f : f.concat(g);
            fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.end] = fg;
          } else {
            fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
          }
        } else if (f = fragmentByStart[end]) {
          delete fragmentByStart[f.start];
          f.unshift(i);
          f.start = start;
          if (g = fragmentByEnd[start]) {
            delete fragmentByEnd[g.end];
            var gf = g === f ? f : g.concat(f);
            fragmentByStart[gf.start = g.start] = fragmentByEnd[gf.end = f.end] = gf;
          } else {
            fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
          }
        } else {
          f = [i];
          fragmentByStart[f.start = start] = fragmentByEnd[f.end = end] = f;
        }
      });

      function ends(i) {
        var arc = topology.arcs[i < 0 ? ~i : i],
          p0 = arc[0],
          p1;
        if (topology.transform) p1 = [0, 0], arc.forEach(function(dp) {
          p1[0] += dp[0], p1[1] += dp[1];
        });
        else p1 = arc[arc.length - 1];
        return i < 0 ? [p1, p0] : [p0, p1];
      }

      function flush(fragmentByEnd, fragmentByStart) {
        for (var k in fragmentByEnd) {
          var f = fragmentByEnd[k];
          delete fragmentByStart[f.start];
          delete f.start;
          delete f.end;
          f.forEach(function(i) {
            stitchedArcs[i < 0 ? ~i : i] = 1;
          });
          fragments.push(f);
        }
      }

      flush(fragmentByEnd, fragmentByStart);
      flush(fragmentByStart, fragmentByEnd);
      arcs.forEach(function(i) {
        if (!stitchedArcs[i < 0 ? ~i : i]) fragments.push([i]);
      });

      return object(topology, {
        type: "MultiLineString",
        arcs: fragments
      });
    };

    carto.features = function(topo, geometries) {
      return geometries.map(function(f) {
        return carto.feature(topo, f);
      });
    };

    carto.properties = function(props) {
      if (arguments.length) {
        properties = d3.functor(props);
        return carto;
      } else {
        return properties;
      }
    };

    return carto;
  };

  var transformer = d3.cartogram.transformer = function(tf) {
    var kx = tf.scale[0],
        ky = tf.scale[1],
        dx = tf.translate[0],
        dy = tf.translate[1];

    function transform(c) {
      return [c[0] * kx + dx, c[1] * ky + dy];
    }

    transform.invert = function(c) {
      return [(c[0] - dx) / kx, (c[1]- dy) / ky];
    };

    return transform;
  };

  function angle(a, b) {
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
  }

  function distance(a, b) {
    var dx = b[0] - a[0],
        dy = b[1] - a[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  function projector(proj) {
    var types = {
      Point: proj,
      LineString: function(coords) {
        return coords.map(proj);
      },
      MultiLineString: function(arcs) {
        return arcs.map(types.LineString);
      },
      Polygon: function(rings) {
        return rings.map(types.LineString);
      },
      MultiPolygon: function(rings) {
        return rings.map(types.Polygon);
      }
    };
    return function(geom) {
      return types[geom.type](geom.coordinates);
    };
  }
  function cosArctan(dx, dy) {
    if (dy===0) return 0;
    var div = dx/dy;
    return (dy>0)?
      (1/Math.sqrt(1+(div*div))):
      (-1/Math.sqrt(1+(div*div)));
  }
  function sinArctan(dx, dy) {
    if (dy===0) return 1;
    var div = dx/dy;
    return (dy>0)?
      (div/Math.sqrt(1+(div*div))):
      (-div/Math.sqrt(1+(div*div)));
  }
  function copy(o) {
    return (o instanceof Array)
      ? o.map(copy)
      : (typeof o === "string" || typeof o === "number")
        ? o
        : copyObject(o);
  }

  function copyObject(o) {
    var obj = {};
    for (var k in o) obj[k] = copy(o[k]);
    return obj;
  }

  function object(topology, o) {
    var arcs = topology.arcs ? topology.arcs : topology;
    function arc(i, points) {
      if (points.length) points.pop();
      if (!arcs[i < 0 ? ~i : i]) {
        console.log("fail");
      }
      for (var a = arcs[i < 0 ? ~i : i], k = 0, n = a.length; k < n; ++k) {
        points.push(a[k]);
      }
      if (i < 0) reverse(points, n);
    }

    function line(arcs) {
      var points = [];
      for (var i = 0, n = arcs.length; i < n; ++i) arc(arcs[i], points);
      return points;
    }

    function polygon(arcs) {
      return arcs.map(line);
    }

    function geometry(o) {
      o = Object.create(o);
      o.coordinates = geometryType[o.type](o.arcs);
      return o;
    }
    var geometryType = {
      LineString: line,
      MultiLineString: polygon,
      Polygon: polygon,
      MultiPolygon: function(arcs) { return arcs.map(polygon); }
    };

    return o.type === "GeometryCollection"
        ? (o = Object.create(o), o.geometries = o.geometries.map(geometry), o)
        : geometry(o);
  }

  function reverse(array, n) {
    var t, j = array.length, i = j - n; while (i < --j) t = array[i], array[i++] = array[j], array[j] = t;
  }

})();
