import Class from "base/class";
import globals from "base/globals";
import * as utils from "base/utils";

import topojson from "helpers/topojson";
import d3_geo_projection from "helpers/d3.geoProjection";
const GoogleMapsLoader = require("google-maps");

import mapboxgl from "mapbox-gl/dist/mapbox-gl.js";

const MapLayer = Class.extend({
  init(context, parent) {
    this.shapes = null;
    this.parent = parent;
    this.context = context;
    d3_geo_projection();
  },

  initMap() {
    this.mapGraph = this.parent.mapSvg.html("").append("g")
      .attr("class", "vzb-bmc-map-graph");

    const _this = this;
    const shape_path = this.context.model.ui.map.topology.path
        || globals.ext_resources.host + globals.ext_resources.preloadPath + "world-50m.json";

    const projection = "geo" + utils.capitalize(this.context.model.ui.map.projection);

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

        const boundaries = topojson.mesh(_this.shapes, _this.shapes.objects[_this.context.model.ui.map.topology.objects.boundaries], (a, b) => a !== b);
        if (_this.mapFeature.features) {
          _this.mapGraph.selectAll(".land")
            .data(_this.mapFeature.features)
            .enter().insert("path")
            .attr("d", _this.mapPath)
            .attr("id", d => d.properties[_this.context.model.ui.map.topology.geoIdProperty] ? d.properties[_this.context.model.ui.map.topology.geoIdProperty].toLowerCase() : d.id)
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
    return new Promise((resolve, reject) => {
      d3.json(shape_path, (error, json) => {
        if (error) return console.warn("Failed loading json " + shape_path + ". " + error);
        resolve(json);
      });
    });

  },

  rescaleMap(canvas) {
    //var topoCanvas =
    let emitEvent = false;
    const margin = this.context.activeProfile.margin;

    const currentNW = this.zeroProjection([
      this.context.model.ui.map.bounds.west,
      this.context.model.ui.map.bounds.north
    ]);
    const currentSE = this.zeroProjection([
      this.context.model.ui.map.bounds.east,
      this.context.model.ui.map.bounds.south
    ]);
    let scaleDelta = 1, mapTopOffset = 0, mapLeftOffset = 0;

    if (!canvas) {
      emitEvent = true;
      canvas = [
        [0, 0],
        [this.context.width, this.context.height]
      ];
      const scaleX = (canvas[1][0] - canvas[0][0]) / (currentSE[0] - currentNW[0]);
      const scaleY = (canvas[1][1] - canvas[0][1]) / (currentSE[1] - currentNW[1]);
      if (scaleX != scaleY) {
        if (scaleX > scaleY) {
          scaleDelta = scaleY;
          mapLeftOffset = (this.context.width - Math.abs(scaleDelta * (currentNW[1] - currentSE[1]))) / 2;
        } else {
          scaleDelta = scaleX;
          mapTopOffset = (this.context.height - Math.abs(scaleDelta * (currentNW[0] - currentSE[0]))) / 2;
        }
      }
    } else {
      scaleDelta = (canvas[1][0] - canvas[0][0]) / (currentSE[0] - currentNW[0]);
    }
    // translate projection to the middle of map
    this.projection
      .translate([canvas[0][0] - (currentNW[0] * scaleDelta) + mapLeftOffset, canvas[0][1] - (currentNW[1] * scaleDelta) + mapTopOffset])
      .scale(scaleDelta)
      .precision(0.1);

    this.mapGraph
      .selectAll("path").attr("d", this.mapPath);

    // resize and put in center
    this.parent.mapSvg
      .style("transform", "translate(" + margin.left + "px," + margin.top + "px)")
      .attr("width", this.context.width)
      .attr("height", this.context.height);

    // set skew function used for bubbles in chart
    const _this = this;

    // if canvas not received this map is main and shound trigger redraw points on tool
    if (emitEvent) {
      this.parent.boundsChanged();
    }
  },

  invert(x, y) {
    return this.projection([x || 0, y || 0]);
  }

});

const GoogleMapLayer = Class.extend({

  init(context, parent) {
    this.context = context;
    this.parent = parent;
  },

  initMap(domSelector) {
    const _this = this;
    this.mapCanvas = this.parent.mapRoot.append("div");

    GoogleMapsLoader.KEY = "AIzaSyAP0vMZwYojifwGYHTnEtYV40v6-MdLGFM";
    return new Promise((resolve, reject) => {
      GoogleMapsLoader.load(google => {
        _this.map = new google.maps.Map(_this.mapCanvas.node(), {
          disableDefaultUI: true,
          backgroundColor: "#FFFFFF",
          mapTypeId: _this.context.model.ui.map.mapLayer
        });

        _this.overlay = new google.maps.OverlayView();
        _this.overlay.draw = function() {};
        _this.overlay.setMap(_this.map);

        google.maps.event.addListener(_this.map, "bounds_changed", () => {
          if (_this.map.getBounds()) {
            _this.parent.boundsChanged();
          }
        });
        resolve();
      });
    });
  },

  updateLayer() {
    if (this.map) {
      this.map.setMapTypeId(this.context.model.ui.map.mapLayer);
    }
  },

  rescaleMap() {
    const _this = this;
    const margin = this.context.activeProfile.margin;

    this.mapCanvas
      .style("width", this.context.width + "px")
      .style("height", this.context.height + "px");
    this.parent.mapRoot
      .attr("width", this.context.width)
      .attr("height", this.context.height)
      .style("position", "absolute")
      .style("left", margin.left + "px")
      .style("right", margin.right + "px")
      .style("top", margin.top + "px")
      .style("bottom", margin.bottom + "px");
    google.maps.event.trigger(this.map, "resize");

    const rectBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(this.context.model.ui.map.bounds.north, this.context.model.ui.map.bounds.west),
        new google.maps.LatLng(this.context.model.ui.map.bounds.south, this.context.model.ui.map.bounds.east)
    );
    this.map.fitBounds(rectBounds);
  },
  invert(x, y) {
    const projection = this.overlay.getProjection();
    if (!projection) {
      return [0, 0];
    }
    const coords = projection.fromLatLngToContainerPixel(new google.maps.LatLng(y, x));
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
    const center = this.map.getCenter();
    this.centerMapker.setPosition(center);
    return { lat: center.lat(), lng: center.lng() };
  }
});

const MapboxLayer = Class.extend({

  init(context, parent) {
    mapboxgl.accessToken = "pk.eyJ1Ijoic2VyZ2V5ZiIsImEiOiJjaXlqeWo5YnYwMDBzMzJwZnlwZXJ2bnA2In0.e711ku9KzcFW_x5wmOZTag";
    this.context = context;
    this.parent = parent;
  },

  initMap(domSelector) {
    const _this = this;
    this.mapCanvas = this.parent.mapRoot.append("div");
    return new Promise((resolve, reject) => {
      _this.map = new mapboxgl.Map({
        container: _this.mapCanvas.node(),
        interactive: false,
        style: this.context.model.ui.map.mapLayer,
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
    const _this = this;
    const offset = this.context.model.ui.map.offset;
    const margin = this.context.activeProfile.margin;
    const viewPortHeight = this.context.height * this.context.model.ui.map.scale;
    const viewPortWidth = this.context.width * this.context.model.ui.map.scale;

    this.mapCanvas
      .style("width", viewPortWidth + "px")
      .style("height", viewPortHeight + "px");

    this.parent.mapRoot
      .attr("width", viewPortWidth)
      .attr("height", viewPortHeight)
      .style("position", "absolute")
      .style("left", margin.left + "px")
      .style("right", margin.right + "px")
      .style("top", margin.top + "px")
      .style("bottom", margin.bottom + "px");

    utils.defer(() => {
      _this.map.fitBounds(_this.bounds, { duration: 0 });
      _this.map.resize();
      _this.parent.boundsChanged();
    });
  },

  updateLayer() {
    if (this.map) {
      this.map.setStyle(this.context.model.ui.map.mapLayer);
    }
  },

  getCanvas() {
    return [
      this.invert(this.context.model.ui.map.bounds.west, this.context.model.ui.map.bounds.north),
      this.invert(this.context.model.ui.map.bounds.east, this.context.model.ui.map.bounds.south)
    ];
  },

  invert(x, y) {
    const coords = this.map.project([x, y]);
    return [coords.x, coords.y];
  }

});

export default Class.extend({
  init(context, domSelector) {
    this.context = context;
    this.domSelector = domSelector;
    this.topojsonMap = null;
    this.mapEngine = this.context.model.ui.map.mapEngine;
    this.mapInstance = null;
    if (this.context.element instanceof d3.selection) {
      this.mapRoot = this.context.element.select(domSelector);
      this.mapSvg = this.context.element.select(".vzb-bmc-map-background");
    } else {
      this.mapRoot = d3.select(this.context.element).select(domSelector);
      this.mapSvg = d3.select(this.context.element).select(".vzb-bmc-map-background");
    }
    this.mapRoot.html("");
    this.mapSvg.html("");
    return this;
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
      if (this.mapInstance) {
        this.topojsonMap = new MapLayer(this.context, this);
      } else {
        this.mapInstance = new MapLayer(this.context, this);
      }
      return this;
    }
  },

  layerChanged() {
    if (this.mapEngine == this.context.model.ui.map.mapEngine) {
      this.mapInstance.updateLayer();
    } else {
      this.mapEngine = this.context.model.ui.map.mapEngine;
      this.topojsonMap = null;
      this.mapInstance = null;
      this.mapRoot.html("");
      this.mapSvg.html("");
      this.getMap();
      this.initMap().then(
        map => {
          this.rescaleMap();
        });
    }
  },

  initMap() {
    if (!this.topojsonMap) {
      return this.mapInstance.initMap(this.domSelector);
    } else if (!this.mapInstance) {
      return this.topojsonMap.initMap(this.domSelector);
    }
    return Promise.all([
      this.mapInstance.initMap(this.domSelector),
      this.topojsonMap.initMap(this.domSelector)
    ]);
  },

  rescaleMap() {
    if (this.mapInstance) {
      this.mapInstance.rescaleMap();
    } else {
      this.topojsonMap.rescaleMap();
    }
  },

  boundsChanged() {
    if (this.topojsonMap) {
      this.topojsonMap.rescaleMap(this.mapInstance.getCanvas());
    }
    this.context.mapBoundsChanged();
  },

  invert(x, y) {
    if (this.mapInstance) {
      return this.mapInstance.invert(x, y);
    }
    return this.topojsonMap.invert(x, y);
  }

});
