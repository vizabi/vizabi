import * as utils from 'base/utils';
import Component from 'base/component';
import globals from 'base/globals'; // to get map data path
import { warn as iconWarn, question as iconQuestion } from 'base/iconset';

import topojson from 'helpers/topojson';
import d3_geo_projection from 'helpers/d3.geo.projection';
import DynamicBackground from 'helpers/d3.dynamicBackground';
import Selectlist from './bubblemapchart-selectlist';

//BUBBLE MAP CHART COMPONENT
var BubbleMapChartComponent = Component.extend({
  /**
   * Initializes the component (Bubble Map Chart).
   * Executed once before any template is rendered.
   * @param {Object} config The options passed to the component
   * @param {Object} context The component's parent
   */
  init: function (config, context) {
    this.name = 'bubblemapchart';
    this.template = 'bubblemapchart.html';

    //define expected models for this component
    this.model_expects = [{
      name: "time",
      type: "time"
    }, {
      name: "entities",
      type: "entities"
    }, {
      name: "marker",
      type: "model"
    }, {
      name: "language",
      type: "language"
    }, {
      name: "ui",
      type: "model"
    }];

    var _this = this;
    this.model_binds = {
      "change:time:value": function (evt) {
        _this.updateEntities();
        _this.updateTime();
        _this._selectlist.redraw();
        _this.updateDoubtOpacity();
      },
      "change:entities:highlight": function (evt) {
          if (!_this._readyOnce) return;
          _this.highlightEntities();
          _this.updateOpacity();
      },
      "change:marker": function(evt) {
        // bubble size change is processed separately
        if(!_this._readyOnce) return;
        if(evt.indexOf("change:marker:size") !== -1) return;
        if(evt.indexOf("change:marker:color:palette") > -1) return;
        _this.ready();
      },
      'change:marker:size': function(evt) {
        //console.log("EVENT change:marker:size:max");
        if(!_this._readyOnce) return;
        if(evt.indexOf("min") > -1 || evt.indexOf("max") > -1) {
          _this.ready();
        }
      },
      "change:marker:color:palette": function (evt) {
          if (!_this._readyOnce) return;
          //_this.redrawDataPointsOnlyColors();
          //_this._selectlist.redraw();
          _this.ready();
      },
      "change:entities:select": function (evt) {
          if (!_this._readyOnce) return;
          _this.selectEntities();
          _this._selectlist.redraw();
          _this.updateDoubtOpacity();
          _this.updateOpacity();
          /*
          _this.redrawDataPoints();
          */
      },
    };

    this._selectlist = new Selectlist(this);

    //contructor is the same as any component
    this._super(config, context);

    this.sScale = null;
    this.cScale = d3.scale.category10();

    this.defaultWidth = 960;
    this.defaultHeight = 500;
    this.boundBox = [[0.03, 0], [0.97, 0.85]]; // two points to set box bound on 960 * 500 image;

    d3_geo_projection();
  },


  afterPreload: function(){
    var _this = this;
    // TODO: add url to config or local
    d3.json(globals.gapminder_paths.baseUrl + "data/world-50m.json", function(error, world) {
      if (error) throw error;
      _this.world = world;
    });
  },

  /**
   * DOM is ready
   */
  readyOnce: function () {

    this.element = d3.select(this.element);

    this.graph = this.element.select('.vzb-bmc-graph');
    this.mapSvg = this.element.select('.vzb-bmc-map-background');

    this.bubbleContainerCrop = this.graph.select('.vzb-bmc-bubbles-crop');
    this.bubbleContainer = this.graph.select('.vzb-bmc-bubbles');
    this.labelsContainer = this.graph.select('.vzb-bmc-bubble-labels');
    this.dataWarningEl = this.graph.select(".vzb-data-warning");

    this.yTitleEl = this.graph.select(".vzb-bmc-axis-y-title");
    this.infoEl = this.graph.select(".vzb-bmc-axis-info");

    this.entityBubbles = null;
    this.entityLabels = null;
    this.tooltip = this.element.select('.vzb-bmc-tooltip');
    this.entityLines = null;

    // year background
    this.yearEl = this.graph.select('.vzb-bmc-year');
    this.year = new DynamicBackground(this.yearEl);
    this.year.setConditions({xAlign: 'left', yAlign: 'bottom'});

    // http://bl.ocks.org/mbostock/d4021aa4dccfd65edffd patterson
    // http://bl.ocks.org/mbostock/3710566 robinson
    // map background
    var defaultWidth = this.defaultWidth;
    var defaultHeight = this.defaultHeight;
    var world = this.world;
    var projection = this.projection = d3.geo.robinson()
        .scale(150)
        .translate([defaultWidth / 2, defaultHeight / 2])
        .precision(.1);

    var path = this.bgPath = d3.geo.path()
        .projection(projection);

    var graticule = d3.geo.graticule();

    var svg = this.mapGraph = d3.select(".vzb-bmc-map-graph")
        .attr("width", defaultWidth)
        .attr("height", defaultHeight);
    svg.html('');

    /* // no latlng line
    svg.append("defs").append("path")
        .datum({type: "Sphere"})
        .attr("id", "sphere")
        .attr("d", path);

    svg.append("use")
        .attr("class", "stroke")
        .attr("xlink:href", "#sphere");

    svg.append("use")
        .attr("class", "fill")
        .attr("xlink:href", "#sphere");

    svg.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", path);
    */

    svg.insert("path", ".graticule")
        .datum(topojson.feature(world, world.objects.land))
        .attr("class", "land")
        .attr("d", path);

    svg.insert("path", ".graticule")
        .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
        .attr("class", "boundary")
        .attr("d", path);



    var _this = this;
    this.on("resize", function () {
      _this.updateSize();
      _this.updateMarkerSizeLimits();
      _this.updateEntities();
      _this._selectlist.redraw();
    });

    this.KEY = this.model.entities.getDimension();
    this.TIMEDIM = this.model.time.getDimension();

    this.wScale = d3.scale.linear()
        .domain(this.parent.datawarning_content.doubtDomain)
        .range(this.parent.datawarning_content.doubtRange);
  },

  /*
   * Both model and DOM are ready
   */
  ready: function () {
    this.updateUIStrings();
    this.updateIndicators();
    this.updateSize();
    this.updateMarkerSizeLimits();
    this.updateEntities();
    this.updateTime();
    this.highlightEntities();
    this.selectEntities();
    this._selectlist.redraw();
    this.updateDoubtOpacity();
    this.updateOpacity();
  },

  updateUIStrings: function () {
      var _this = this;

      this.translator = this.model.language.getTFunction();
      var sizeMetadata = globals.metadata.indicatorsDB[this.model.marker.size.which];

      this.yTitleEl.select("text")
          .text(this.translator("indicator/" + _this.model.marker.size.which));

      utils.setIcon(this.dataWarningEl, iconWarn).select("svg").attr("width", "0px").attr("height", "0px");
      this.dataWarningEl.append("text")
          .text(this.translator("hints/dataWarning"));

      this.infoEl
          .html(iconQuestion)
          .select("svg").attr("width", "0px").attr("height", "0px");

      //TODO: move away from UI strings, maybe to ready or ready once
      this.infoEl.on("click", function () {
          window.open(sizeMetadata.sourceLink, "_blank").focus();
      })

      this.dataWarningEl
          .on("click", function () {
              _this.parent.findChildByName("gapminder-datawarning").toggle();
          })
          .on("mouseover", function () {
              _this.updateDoubtOpacity(1);
          })
          .on("mouseout", function () {
              _this.updateDoubtOpacity();
          })
  },

  updateDoubtOpacity: function (opacity) {
      if (opacity == null) opacity = this.wScale(+this.time.getFullYear().toString());
      if (this.someSelected) opacity = 1;
      this.dataWarningEl.style("opacity", opacity);
  },

  updateOpacity: function () {
      var _this = this;
      /*
      this.entityBubbles.classed("vzb-selected", function (d) {
          return _this.model.entities.isSelected(d);
      });
      */

      var OPACITY_HIGHLT = 1.0;
      var OPACITY_HIGHLT_DIM = .3;
      var OPACITY_SELECT = 1.0;
      var OPACITY_REGULAR = this.model.entities.opacityRegular;
      var OPACITY_SELECT_DIM = this.model.entities.opacitySelectDim;

      this.entityBubbles.style("opacity", function (d) {

          if (_this.someHighlighted) {
              //highlight or non-highlight
              if (_this.model.entities.isHighlighted(d)) return OPACITY_HIGHLT;
          }

          if (_this.someSelected) {
              //selected or non-selected
              return _this.model.entities.isSelected(d) ? OPACITY_SELECT : OPACITY_SELECT_DIM;
          }

          if (_this.someHighlighted) return OPACITY_HIGHLT_DIM;

          return OPACITY_REGULAR;

      });

      this.entityBubbles.classed("vzb-selected", function (d) {
          return _this.model.entities.isSelected(d)
      });

      var someSelectedAndOpacityZero = _this.someSelected && _this.model.entities.opacitySelectDim < .01;

      // when pointer events need update...
      if (someSelectedAndOpacityZero !== this.someSelectedAndOpacityZero_1) {
          this.entityBubbles.style("pointer-events", function (d) {
              return (!someSelectedAndOpacityZero || _this.model.entities.isSelected(d)) ?
                  "visible" : "none";
          });
      }

      this.someSelectedAndOpacityZero_1 = _this.someSelected && _this.model.entities.opacitySelectDim < .01;
  },

  /**
   * Changes labels for indicators
   */
  updateIndicators: function () {
    var _this = this;
    this.timeFormatter = d3.time.format(_this.model.time.formatOutput);
    this.duration = this.model.time.speed;

    this.sScale = this.model.marker.size.getScale();
    this.cScale = this.model.marker.color.getScale();
  },

  /**
   * Updates entities
   */
  updateEntities: function () {

    var _this = this;
    var time = this.model.time;
    var timeDim = time.getDimension();
    var entityDim = this.model.entities.getDimension();
    // var latDim = this.model.lat.getDimension();
    // var lngDim = this.model.lng.getDimension();
    // console.log(latDim, lngDim, 'ok');
    var duration = (time.playing) ? time.speed : 0;
    var filter = {};
    filter[timeDim] = time.value;
    var items = this.model.marker.getKeys(filter);
    var values = this.model.marker.getValues(filter, [entityDim]);
    _this.values = values;
    // construct pointers
    this.pointers = this.model.marker.getKeys()
        .map(function (d) {
            var pointer = {};
            pointer[_this.KEY] = d[_this.KEY];
            pointer.KEY = function () {
                return this[_this.KEY];
            };
            return pointer;
        });

    // TODO: add to csv
    //Africa 9.1021° N, 18.2812°E 
    //Europe 53.0000° N, 9.0000° E
    //Asia 49.8380° N, 105.8203° E
    //north American 48.1667° N and longitude 100.1667° W
    /*
    var pos = {
      "afr": {lat: 9.1, lng: 18.3},
      "eur": {lat: 53.0, lng: 9.0},
      "asi": {lat: 49.8, lng: 105.8},
      "ame": {lat: 48.2, lng: -100.2},
    };
    */

    items = items.sort(function (a, b) { // small circle to front
      return values.size[b[entityDim]] - values.size[a[entityDim]];
    });

    this.entityBubbles = this.bubbleContainer.selectAll('.vzb-bmc-bubble')
      .data(items);

    if (!this.renderedOnce) {
      //enter selection -- init circles
      this.entityBubbles.enter().append("circle")
        .attr("class", "vzb-bmc-bubble")
        .on("mousemove", function (d, i) {
            if (utils.isTouchDevice()) return;
            _this._interact()._mousemove(d, i);
        })
        .on("mouseout", function (d, i) {
            if (utils.isTouchDevice()) return;
            _this._interact()._mouseout(d, i);
        })
        .on("click", function (d, i) {
            if (utils.isTouchDevice()) return;
            _this._interact()._click(d, i);
            _this.highlightEntities();
        })
        .onTap(function (d, i) {
            _this._interact()._click(d, i);
            d3.event.stopPropagation();
        })
        .onLongTap(function (d, i) {
        })
      this.renderedOnce = true;
    }

    //positioning and sizes of the bubbles
    this.bubbleContainer.selectAll('.vzb-bmc-bubble')
      .attr("fill", function (d) {
        return _this.cScale(values.color[d[entityDim]]);
      })
      .attr("cx", function (d) {
        d.cLoc = _this.skew(_this.projection([+values.lng[d[entityDim]], +values.lat[d[entityDim]]]));
        return d.cLoc[0];
      })
      .attr("cy", function (d) {
        return d.cLoc[1];
      })
      .transition().duration(duration).ease("linear")
      .attr("r", function (d) {
        return utils.areaToRadius(_this.sScale(values.size[d[entityDim]]));
      });
  },

  /*
   * UPDATE TIME:
   * Ideally should only update when time or data changes
   */
  updateTime: function() {
    var _this = this;

    this.time_1 = this.time == null ? this.model.time.value : this.time;
    this.time = this.model.time.value;
    this.duration = this.model.time.playing && (this.time - this.time_1 > 0) ? this.model.time.delayAnimations : 0;
    this.year.setText(this.timeFormatter(this.time));
  },

  /**
   * Executes everytime the container or vizabi is resized
   * Ideally,it contains only operations related to size
   */
  updateSize: function () {

    var _this = this;
    var margin, infoElHeight;

    var profiles = {
      small: {
        margin: { top: 10, right: 10, left: 10, bottom: 25 },
        infoElHeight: 16,
        minRadius: 2,
        maxRadius: 40
      },
      medium: {
        margin: { top: 20, right: 20, left: 20, bottom: 30 },
        infoElHeight: 20,
        minRadius: 3,
        maxRadius: 60
      },
      large: {
        margin: { top: 30, right: 30, left: 30, bottom: 35 },
        infoElHeight: 22,
        minRadius: 4,
        maxRadius: 80
      }
    };

    var presentationProfileChanges = {
      small: {
        margin: { top: 10, right: 10, left: 10, bottom: 25 },
        infoElHeight: 16,
        minRadius: 2,
        maxRadius: 40
      },
      medium: {
        margin: { top: 20, right: 20, left: 20, bottom: 50 },
        infoElHeight: 20,
        minRadius: 3,
        maxRadius: 60
      },
      large: {
        margin: { top: 30, right: 30, left: 30, bottom: 35 },
        infoElHeight: 22,
        minRadius: 4,
        maxRadius: 80
      }
    };

    this.activeProfile = this.getActiveProfile(profiles, presentationProfileChanges);
    margin = this.activeProfile.margin;
    infoElHeight = this.activeProfile.infoElHeight;

/*
    this.profiles = {
      "small": {
        margin: {
          top: 30,
          right: 20,
          left: 40,
          bottom: 50
        },
        padding: 2,
      },
      "medium": {
        margin: {
          top: 30,
          right: 60,
          left: 60,
          bottom: 60
        },
        padding: 2,
        minRadius: 3,
        maxRadius: 60
      },
      "large": {
        margin: {
          top: 30,
          right: 60,
          left: 60,
          bottom: 80
        },
        padding: 2,
        minRadius: 4,
        maxRadius: 80
      }
    };

    this.activeProfile = this.profiles[this.getLayoutProfile()];
    var margin = this.activeProfile.margin;
*/

    //stage
    var height = this.height = parseInt(this.element.style("height"), 10) - margin.top - margin.bottom;
    var width = this.width = parseInt(this.element.style("width"), 10) - margin.left - margin.right;
    var boundBox = this.boundBox;
    var viewBox = [ boundBox[0][0] * this.defaultWidth,
                    boundBox[0][1] * this.defaultHeight,
                    Math.abs(boundBox[1][0] - boundBox[0][0]) * this.defaultWidth,
                    Math.abs(boundBox[1][1] - boundBox[0][1]) * this.defaultHeight];

    this.graph
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    this.year.resize(this.width, this.height,
      Math.min(this.width/2.5, Math.max(this.height / 4, this.width / 4)) / 2.5);

    this.mapSvg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', viewBox.join(' '))
      .attr('preserveAspectRatio', 'none');

    //update scales to the new range
    // TODO: r ration should add to config
    //this.updateMarkerSizeLimits();
    this.sScale.range([0, this.height / 4]);

    var skew = this.skew = (function () {
      var vb = viewBox;
      var w = width;
      var h = height;
      var vbCenter = [vb[0] + vb[2] / 2, vb[1] + vb[3] / 2];
      var vbWidth = vb[2] || 0.001;
      var vbHeight = vb[3] || 0.001;
      //input pixel loc after projection, return pixel loc after skew;
      return function (points) {
        var x = (points[0] - vbCenter[0]) / vbWidth * width + width / 2;
        var y = (points[1] - vbCenter[1]) / vbHeight * height + height / 2;
        return [x, y];
      }
    }());


    this.yTitleEl.select("text")
        .attr("transform", "translate(0," + margin.top + ")")

    var warnBB = this.dataWarningEl.select("text").node().getBBox();
    this.dataWarningEl.select("svg")
        .attr("width", warnBB.height)
        .attr("height", warnBB.height)
        .attr("x", warnBB.height * .1)
        .attr("y", -warnBB.height * 1.0 + 1)

    this.dataWarningEl
        .attr("transform", "translate(" + (0) + "," + (margin.top + warnBB.height * 1.5) + ")")
        .select("text")
        .attr("dx", warnBB.height * 1.5);

    if(this.infoEl.select('svg').node()) {
        var titleBBox = this.yTitleEl.node().getBBox();
        var translate = d3.transform(this.yTitleEl.attr('transform')).translate;

        this.infoEl.select('svg')
            .attr("width", infoElHeight)
            .attr("height", infoElHeight)
        this.infoEl.attr('transform', 'translate('
            + (titleBBox.x + translate[0] + titleBBox.width + infoElHeight * .4) + ','
            + (titleBBox.y + translate[1] + infoElHeight * .3) + ')');
    }

  },

  updateMarkerSizeLimits: function() {
    var _this = this;
    var minRadius = this.activeProfile.minRadius;
    var maxRadius = this.activeProfile.maxRadius;

    this.minRadius = Math.max(maxRadius * this.model.marker.size.min, minRadius);
    this.maxRadius = Math.max(maxRadius * this.model.marker.size.max, minRadius);

    if(this.model.marker.size.scaleType !== "ordinal") {
      this.sScale.range([utils.radiusToArea(_this.minRadius), utils.radiusToArea(_this.maxRadius)]);
    } else {
      this.sScale.rangePoints([utils.radiusToArea(_this.minRadius), utils.radiusToArea(_this.maxRadius)], 0).range();
    }

  },

  _interact: function () {
      var _this = this;

      return {
          _mousemove: function (d, i) {
              if (_this.model.time.dragging) return;

              _this.model.entities.highlightEntity(d);

              var mouse = d3.mouse(_this.graph.node()).map(function (d) {
                  return parseInt(d);
              });

              //position tooltip
              _this._setTooltip(d.key ? _this.translator("region/" + d.key) : _this.model.marker.label.getValue(d));

          },
          _mouseout: function (d, i) {
              if (_this.model.time.dragging) return;

              _this._setTooltip("");
              _this.model.entities.clearHighlighted();
          },
          _click: function (d, i) {
              _this.model.entities.selectEntity(d);
          }
      };

  },

  highlightEntities: function () {
      var _this = this;
      this.someHighlighted = (this.model.entities.highlight.length > 0);

      if (!this.selectList || !this.someSelected) return;
      this.selectList.classed("vzb-highlight", function (d) {
          return _this.model.entities.isHighlighted(d);
      });
      this.selectList.each(function (d, i) {
        d3.select(this).selectAll(".vzb-bmc-label-x")
          .classed("vzb-invisible", function(n) {
            return !_this.model.entities.isHighlighted(d);
          });

      });

  },

  selectEntities: function () {
      var _this = this;
      this.someSelected = (this.model.entities.select.length > 0);

      this._selectlist.rebuild();
  },

  _setTooltip: function (tooltipText) {
      if (tooltipText) {
          var mouse = d3.mouse(this.graph.node()).map(function (d) { return parseInt(d); });

          //position tooltip
          this.tooltip.classed("vzb-hidden", false)
              .attr("transform", "translate(" + (mouse[0]) + "," + (mouse[1]) + ")")
              .selectAll("text")
              .attr("text-anchor", "middle")
              .attr("alignment-baseline", "middle")
              .text(tooltipText)

          var contentBBox = this.tooltip.select("text")[0][0].getBBox();
          this.tooltip.select("rect")
              .attr("width", contentBBox.width + 8)
              .attr("height", contentBBox.height + 8)
              .attr("x", -contentBBox.width - 25)
              .attr("y", -contentBBox.height - 25)
              .attr("rx", contentBBox.height * .2)
              .attr("ry", contentBBox.height * .2);

          this.tooltip.selectAll("text")
              .attr("x", -contentBBox.width - 25 + ((contentBBox.width + 8)/2))
              .attr("y", -contentBBox.height - 25 + ((contentBBox.height + 11)/2)); // 11 is 8 for margin + 3 for strokes

      } else {

          this.tooltip.classed("vzb-hidden", true);
      }
  }

});


export default BubbleMapChartComponent;