import Class from 'base/class';
import globals from 'base/globals';
import * as utils from 'base/utils';

import topojson from 'helpers/topojson';
import d3_geo_projection from 'helpers/d3.geoProjection';
var GoogleMapsLoader = require('google-maps');

import mapboxgl from 'mapbox-gl/dist/mapbox-gl.js';

export default Class.extend({
  init(context) {
    this.context = context;
    this.topojsonMap = null;
    this.mapInstance = null;
  },

  getMap() {
    if (!this.mapInstance) {
      switch (this.context.model.ui.map.mapEngine) {
        case "google":
          this.mapInstance = new GoogleMapLayer(this.context, this);
          break;
        case "mapbox":
          this.mapInstance = new MapboxLayer(this.context, this);
          break;
      }
      if (!this.context.model.ui.map.topojsonLayer && this.mapInstance) {
        return this.mapInstance;
      } else {
        if (this.mapInstance) {
          this.topojsonMap = new MapLayer(this.context, this);
        } else {
          this.mapInstance = new MapLayer(this.context, this);
          return this.mapInstance;
        }
        return this;
      }
    }
  },

  initMap(domSelector) {
    if (this.topojsonMap && this.mapInstance) {
      return Promise.all([
        this.mapInstance.initMap(domSelector),
        this.topojsonMap.initMap(domSelector)
      ]);
    }
  },

  boundsChanged() {
    if (this.topojsonMap) {
      this.topojsonMap.rescaleMap(this.mapInstance.getCanvas());
    }
    this.context.mapBoundsChanged();
  },

  rescaleMap() {
    var _this = this;
    return this.mapInstance.rescaleMap();
  },

  invert(x, y) {
    return this.mapInstance.invert(x, y);
  }

});

var MapLayer = Class.extend({
  init(context, parent) {
    this.shapes = null;
    this.parent = parent;
    this.context = context;
    d3_geo_projection();
  },

  initMap() {
    this.mapSvg = d3.select(this.context.element).select(".vzb-bmc-map-background");
    this.mapGraph = this.mapSvg.html('').append("g")
      .attr("class", "vzb-bmc-map-graph");

    var _this = this;
    var shape_path = this.context.model.ui.map.topology.path
        || globals.ext_resources.host + globals.ext_resources.preloadPath + "world-50m.json";

    var projection = "geo" + utils.capitalize(this.context.model.ui.map.projection);

    this.zeroProjection = d3[projection]();
    this.zeroProjection
        .scale(1)
        .translate([0, 0]);

    this.projection = d3[projection]();
    this.projection
        .scale(1)
        .translate([0, 0]);

    this.mapPath = d3.geoPath()
        .projection(this.projection);


    this.context.model.ui.map.scale = 1;
    return this._loadShapes(shape_path).then(
      shapes => {
        _this.shapes = shapes;
        _this.mapFeature = topojson.feature(_this.shapes, _this.shapes.objects[this.context.model.ui.map.topology.objects.geo]);
        _this.mapBounds = _this.mapPath.bounds(_this.mapFeature);

        var boundaries = topojson.mesh(_this.shapes, _this.shapes.objects[_this.context.model.ui.map.topology.objects.boundaries], function(a, b) { return a !== b; });
        if (_this.mapFeature.features) {
          _this.mapGraph.selectAll(".land")
              .data(_this.mapFeature.features)
              .enter().insert("path")
              .attr("d", _this.mapPath)
              .attr("id", function(d) {
                return d.properties[_this.context.model.ui.map.topology.geoIdProperty].toLowerCase();
              })
              .attr("class", "land");
        } else {
          _this.mapGraph.insert("path")
              .datum(_this.mapFeature)
              .attr("class", "land");
        }
        _this.mapGraph.insert("path")
            .datum(boundaries)
            .attr("class", "boundary");
      }
    );
  },

  _loadShapes(shape_path) {
    return new Promise(function(resolve, reject) {
      d3.json(shape_path, function(error, json) {
        if (error) return console.warn("Failed loading json " + shape_path + ". " + error);
        resolve(json);
      });
    });

  },

  rescaleMap(canvas) {
    //var topoCanvas =
    var emitEvent = false;
    var offset = this.context.model.ui.map.offset;
    var margin = this.context.activeProfile.margin;
    var zero = this.zeroProjection([
      this.context.model.ui.map.bounds.west,
      this.context.model.ui.map.bounds.north
    ]);
    var currentNW = this.zeroProjection([
      this.context.model.ui.map.bounds.west,
      this.context.model.ui.map.bounds.north
    ]);
    var currentSE = this.zeroProjection([
      this.context.model.ui.map.bounds.east,
      this.context.model.ui.map.bounds.south
    ]);
    var scaleDelta = 1, mapTopOffset = 0, mapLeftOffset = 0;

    if (!canvas) {
      emitEvent = true;
      canvas = [
        [0, 0],
        [this.context.width, this.context.height]
      ];
      var scaleX = (canvas[1][0] - canvas[0][0]) / (currentSE[0] - currentNW[0]);
      var scaleY = (canvas[1][1] - canvas[0][1]) / (currentSE[1] - currentNW[1]);
      if (scaleX != scaleY) {
        if (scaleX > scaleY) {
          scaleDelta = scaleY;
          mapLeftOffset = (this.context.width - scaleDelta * (this.mapBounds[1][0] - this.mapBounds[0][0])) / 2;
        } else {
          scaleDelta = scaleX;
          mapTopOffset = (this.context.height - scaleDelta * (this.mapBounds[1][1] - this.mapBounds[0][1])) / 2;
        }
      }

    } else {
      scaleDelta = (canvas[1][0] - canvas[0][0]) / (currentSE[0] - currentNW[0]);
    }

    // scale to aspect ratio
    // http://bl.ocks.org/mbostock/4707858
    var s = this.context.model.ui.map.scale / Math.max((this.mapBounds[1][0] - this.mapBounds[0][0]) / this.context.width, (this.mapBounds[1][1] - this.mapBounds[0][1]) / this.context.height),

    // dimensions of the map itself (regardless of cropping)
        mapWidth = (s * (this.mapBounds[1][0] - this.mapBounds[0][0])),
        mapHeight = (s * (this.mapBounds[1][1] - this.mapBounds[0][1])),

    // dimensions of the viewport in which the map is shown (can be bigger or smaller than map)
        viewPortHeight = mapHeight * (1 + offset.top + offset.bottom),
        viewPortWidth  = mapWidth  * (1 + offset.left + offset.right);

    // translate projection to the middle of map
    this.projection
        .translate([canvas[0][0] - (currentNW[0] * scaleDelta) + mapLeftOffset, canvas[0][1] - (currentNW[1] * scaleDelta) + mapTopOffset])
        .scale(scaleDelta)
        .precision(0.1);

    this.mapGraph
        .selectAll('path').attr("d", this.mapPath);

    // handle scale to fit case
    var widthScale, heightScale;
    if (!this.context.model.ui.map.preserveAspectRatio) {


      // viewport is complete area (apart from scaling)
      viewPortHeight = this.context.height * this.context.model.ui.map.scale;
      viewPortWidth = this.context.width * this.context.model.ui.map.scale;


      //            ratio between map, viewport and offset (for bubbles)
      widthScale  = viewPortWidth  / mapWidth  / (1 + offset.left + offset.right);
      heightScale = viewPortHeight / mapHeight / (1 + offset.top  + offset.bottom);

    } else {

      // no scaling needed
      widthScale = 1;
      heightScale = 1;

    }

    // internal offset against parent container (mapSvg)
/*
    this.mapGraph
        .attr('transform', 'translate(' + mapLeftOffset + ',' + mapTopOffset + ')');
*/

    // resize and put in center
    this.mapSvg
        .style("transform", "translate(" + margin.left + "px," + margin.top + "px)")
        .attr('width', this.context.width)
        .attr('height', this.context.height);

    // set skew function used for bubbles in chart
    var _this = this;
    this.skew = (function() {
      var w = _this.context.width;
      var h = _this.context.height;
      //input pixel loc after projection, return pixel loc after skew;
      return function(points) {
        //      input       scale         translate                    translate offset
        var x = points[0] * widthScale  + ((w - viewPortWidth) / 2)  + mapLeftOffset * widthScale;
        var y = points[1] * heightScale + ((h - viewPortHeight) / 2) + mapTopOffset  * heightScale;
        return [x, y];
      };
    }());

    // if canvas not received this map is main and shound trigger redraw points on tool
    if (emitEvent) {
      this.parent.boundsChanged();
    }
  },

  invert(x, y) {
     return this.projection([x || 0, y || 0]);
  }

});

var GoogleMapLayer = Class.extend({

  init(context, parent) {
    this.context = context;
    this.parent = parent;
  },

  initMap(domSelector) {
    var _this = this;
    this.mapRoot = d3.select(this.context.element).select(domSelector);
    this.mapCanvas = this.mapRoot.html('').append("div");

    GoogleMapsLoader.KEY = "AIzaSyAP0vMZwYojifwGYHTnEtYV40v6-MdLGFM";
    return new Promise(function(resolve, reject) {
      GoogleMapsLoader.load(function(google) {
        _this.map = new google.maps.Map(_this.mapCanvas.node(), {
          disableDefaultUI: true,
          backgroundColor: '#FFFFFF'
        });

        _this.overlay = new google.maps.OverlayView();
        _this.overlay.draw = function() {};
        _this.overlay.setMap(_this.map);
        _this.centerMapker = new google.maps.Marker({
          map: _this.map,
          title: 'Hello World!'
        });
        var rectangle = new google.maps.Rectangle({
          bounds: {
            north: _this.context.model.ui.map.bounds.north,
            east: _this.context.model.ui.map.bounds.east,
            south: _this.context.model.ui.map.bounds.south,
            west: _this.context.model.ui.map.bounds.west
          },
          editable: true,
          draggable: true
        });
        google.maps.event.addListener(_this.map, 'bounds_changed', function() {
            _this.parent.boundsChanged();
        });

        //rectangle.setMap(_this.map);

        resolve();
      });
    });
   },

  rescaleMap() {
    var _this = this;
    var margin = this.context.activeProfile.margin;

    this.mapCanvas
        .style("width", this.context.width + "px")
        .style("height", this.context.height + "px");
    this.mapRoot
        .attr('width', this.context.width)
        .attr('height', this.context.height)
        .style("position", "absolute")
        .style("left", margin.left + "px")
        .style("right", margin.right + "px")
        .style("top", margin.top + "px")
        .style("bottom", margin.bottom + "px");
    google.maps.event.trigger(this.map, "resize");

    var rectBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(this.context.model.ui.map.bounds.north, this.context.model.ui.map.bounds.west),
        new google.maps.LatLng(this.context.model.ui.map.bounds.south, this.context.model.ui.map.bounds.east)
    );
    this.map.fitBounds(rectBounds);
  },
  invert(x, y) {
    var coords = this.overlay.getProjection().fromLatLngToContainerPixel(new google.maps.LatLng(y, x));
    return [coords.x, coords.y];
  },

  getZoom() {
    return this.map.getZoom();
  },

  getCanvas() {
    return [
      this.invert(this.context.model.ui.map.bounds.west, this.context.model.ui.map.bounds.north),
      this.invert(this.context.model.ui.map.bounds.east, this.context.model.ui.map.bounds.south)
    ];
  },

  getCenter() {
    var center = this.map.getCenter();
    this.centerMapker.setPosition(center);
    return { lat: center.lat(), lng: center.lng() };
  }
});

var MapboxLayer = Class.extend({

  init(context, parent) {
    mapboxgl.accessToken = "pk.eyJ1Ijoic2VyZ2V5ZiIsImEiOiJjaXlqeWo5YnYwMDBzMzJwZnlwZXJ2bnA2In0.e711ku9KzcFW_x5wmOZTag";
    this.context = context;
    this.parent = parent;
  },

  initMap(domSelector) {
    var _this = this;
    this.mapRoot = d3.select(this.context.element).select(domSelector);
    this.mapCanvas = this.mapRoot.html('').append("div");
    return new Promise(function(resolve, reject) {
      _this.map = new mapboxgl.Map({
        container: _this.mapCanvas.node(),
        interactive: false,
        style: 'mapbox://styles/mapbox/satellite-streets-v9',
        hash: false
      });
      _this.bounds = [[
        _this.context.model.ui.map.bounds.west,
        _this.context.model.ui.map.bounds.south
      ], [
        _this.context.model.ui.map.bounds.east,
        _this.context.model.ui.map.bounds.north
      ]];
      _this.map.fitBounds(_this.bounds);
      resolve();
    });
  },

  rescaleMap() {
    var _this = this;
    var offset = this.context.model.ui.map.offset;
    var margin = this.context.activeProfile.margin;
    var viewPortHeight = this.context.height * this.context.model.ui.map.scale;
    var viewPortWidth = this.context.width * this.context.model.ui.map.scale;

    this.mapCanvas
        .style("width", viewPortWidth + "px")
        .style("height", viewPortHeight + "px");

    this.mapRoot
        .attr('width', viewPortWidth)
        .attr('height', viewPortHeight)
        .style("position", "absolute")
        .style("left", margin.left + "px")
        .style("right", margin.right + "px")
        .style("top", margin.top + "px")
        .style("bottom", margin.bottom + "px");

    utils.defer(function() {
      _this.map.fitBounds(_this.bounds, { duration: 0 });
      _this.map.resize();
      _this.parent.boundsChanged();
    });
  },

  getCanvas() {
    return [
      this.invert(this.context.model.ui.map.bounds.west, this.context.model.ui.map.bounds.north),
      this.invert(this.context.model.ui.map.bounds.east, this.context.model.ui.map.bounds.south)
    ];
  },

  invert(x, y) {
    var coords = this.map.project([x, y]);
    return [coords.x, coords.y];
  }

});


