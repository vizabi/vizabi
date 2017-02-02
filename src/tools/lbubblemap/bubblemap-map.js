import Class from 'base/class';
import globals from 'base/globals';

import topojson from 'helpers/topojson';
import d3_geo_projection from 'helpers/d3.geo.projection';
var GoogleMapsLoader = require('google-maps');

export default Class.extend({
  init: function(context) {
    this.context = context;
  },
  
  getMap: function () {
    if (!this.mapInstance) {
      switch (this.context.model.ui.map.mapEngine) {
        case "google":
          this.mapInstance = new GoogleMapLayer(this.context);
          break;
        default:
        this.mapInstance = new MapLayer(this.context);
      }
    }
    return this.mapInstance; 
  }
});

var MapLayer = Class.extend({
  init: function (context) {
    this.shapes = null;
    this.context = context;
    d3_geo_projection();

  },
 
  initMap: function (domSelector) {
    this.mapRoot = d3.select(this.context.element).select(domSelector);
    this.mapSvg = this.mapRoot.html('').append("svg")
        .attr("class", "vzb-bmc-map-background vzb-export");
    this.mapGraph = this.mapSvg.html('').append("g")
      .attr("class", "vzb-bmc-map-graph");

    var _this = this;
    var shape_path = this.context.model.ui.map.topology.path
        || globals.ext_resources.host + globals.ext_resources.preloadPath + "world-50m.json";

    this.projection = d3.geo[this.context.model.ui.map.projection]();
    this.projection
        .scale(1)
        .translate([0, 0]);

    this.mapPath = d3.geo.path()
        .projection(this.projection);



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
              .attr("id", (d) => d.properties[_this.context.model.ui.map.topology.geoIdProperty].toLowerCase())
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
    )
  },

  _loadShapes: function (shape_path) {
    return new Promise(function (resolve, reject) {
      d3.json(shape_path, function (error, json) {
        if (error) return console.warn("Failed loading json " + shape_path + ". " + error);
        resolve(json);
      });
    });

  },

  rescaleMap: function() {

    var offset = this.context.model.ui.map.offset;
    var margin = this.context.activeProfile.margin;

    // scale to aspect ratio 
    // http://bl.ocks.org/mbostock/4707858
    var s = this.context.model.ui.map.scale / Math.max((this.mapBounds[1][0] - this.mapBounds[0][0]) / this.context.width, (this.mapBounds[1][1] - this.mapBounds[0][1]) / this.context.height),

    // dimensions of the map itself (regardless of cropping)
        mapWidth = (s * (this.mapBounds[1][0] - this.mapBounds[0][0])),
        mapHeight = (s * (this.mapBounds[1][1] - this.mapBounds[0][1])),

    // dimensions of the viewport in which the map is shown (can be bigger or smaller than map)
        viewPortHeight = mapHeight * (1 + offset.top + offset.bottom),
        viewPortWidth  = mapWidth  * (1 + offset.left + offset.right),
        mapTopOffset   = mapHeight * offset.top,
        mapLeftOffset  = mapWidth  * offset.left,

    // translate projection to the middle of map
        t = [(mapWidth - s * (this.mapBounds[1][0] + this.mapBounds[0][0])) / 2, (mapHeight - s * (this.mapBounds[1][1] + this.mapBounds[0][1])) / 2];
    this.projection
        .scale(s)
        .translate(t);

    this.mapGraph
        .selectAll('path').attr("d", this.mapPath);

    // handle scale to fit case
    var widthScale, heightScale;
    if (!this.context.model.ui.map.preserveAspectRatio) {

      // wrap viewBox around viewport so map scales to fit viewport
      var viewBoxHeight = viewPortHeight;
      var viewBoxWidth = viewPortWidth;

      // viewport is complete area (apart from scaling)
      viewPortHeight = this.context.height * this.context.model.ui.map.scale;
      viewPortWidth = this.context.width * this.context.model.ui.map.scale;

      this.mapSvg
          .attr('preserveAspectRatio', 'none')
          .attr('viewBox', [0, 0, viewBoxWidth, viewBoxHeight].join(' '));

      //            ratio between map, viewport and offset (for bubbles)
      widthScale  = viewPortWidth  / mapWidth  / (1 + offset.left + offset.right);
      heightScale = viewPortHeight / mapHeight / (1 + offset.top  + offset.bottom);

    } else {

      // no scaling needed
      widthScale = 1;
      heightScale = 1;

    }

    // internal offset against parent container (mapSvg)
    this.mapGraph
        .attr('transform', 'translate(' + mapLeftOffset + ',' + mapTopOffset + ')')

    // resize and put in center
    this.mapSvg
        .style("transform", "translate3d(" + (margin.left + (this.context.width-viewPortWidth)/2) + "px," + (margin.top + (this.context.height-viewPortHeight)/2) + "px,0)")
        .attr('width', viewPortWidth)
        .attr('height', viewPortHeight);

    // set skew function used for bubbles in chart
    var _this = this;
    this.skew = (function () {
      var w = _this.context.width;
      var h = _this.context.height;
      //input pixel loc after projection, return pixel loc after skew;
      return function (points) {
        //      input       scale         translate                    translate offset
        var x = points[0] * widthScale  + ((w - viewPortWidth) / 2)  + mapLeftOffset * widthScale;
        var y = points[1] * heightScale + ((h - viewPortHeight) / 2) + mapTopOffset  * heightScale;
        return [x, y];
      }
    }());
  },

  invert: function(x, y) {
     return this.skew(this.projection([x||0, y||0]));
  }
  
});

var GoogleMapLayer = Class.extend({

  init: function (context) {
    this.context = context;
  },

  initMap: function (domSelector) {
    var _this = this;
    this.mapRoot = d3.select(this.context.element).select(domSelector);
    this.mapCanvas = this.mapRoot.html('').append("div");
    GoogleMapsLoader.KEY = "AIzaSyAP0vMZwYojifwGYHTnEtYV40v6-MdLGFM";
    return new Promise(function(resolve, reject) {
      GoogleMapsLoader.load(function (google) {
        _this.map = new google.maps.Map(_this.mapCanvas.node(), {
          center: new google.maps.LatLng(0, 0),
          zoom: 2,
          minZoom: 1
        });
        _this.overlay = new google.maps.OverlayView();
        _this.overlay.draw = function() {};
        _this.overlay.setMap(_this.map);

        var rectBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(85, -180),           // top left corner of map
            new google.maps.LatLng(-85, 180)
        );
        _this.map.fitBounds(rectBounds);
        console.log("map ready");
        resolve();
      });
    });
   },
 
  rescaleMap: function() {
    var offset = this.context.model.ui.map.offset;
    var margin = this.context.activeProfile.margin;
    var viewPortHeight = this.context.height * this.context.model.ui.map.scale;
    var viewPortWidth = this.context.width * this.context.model.ui.map.scale;

    this.mapCanvas
        .style({"width": viewPortWidth + "px", "height": viewPortHeight + "px"});

    this.mapRoot
        .attr('width', viewPortWidth)
        .attr('height', viewPortHeight)
        .style({"position": "absolute", "left": margin.left + "px", "right": margin.right + "px", "top": margin.top + "px", "bottom": margin.bottom + "px"});
    var rectBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(85, -180),           // top left corner of map
        new google.maps.LatLng(-85, 180)
    );
    this.map.fitBounds(rectBounds);
    console.log("rescale");
  },
  invert: function(x, y) {
    var coords = this.overlay.getProjection().fromLatLngToContainerPixel(new google.maps.LatLng(x, y)); 
    return [coords.x, coords.y];
  }
  
});
